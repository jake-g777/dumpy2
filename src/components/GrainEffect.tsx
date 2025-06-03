import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GrainEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Animation variables
  const timeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Shader material
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec2 iResolution;
        uniform float iTime;
        varying vec2 vUv;

        // Random function for noise
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
          vec2 p = vUv;
          
          // Generate noise with more contrast
          float noise = random(p + iTime * 0.1) * 0.85;
          
          // Create grain color (white with varying intensity)
          vec3 grainColor = vec3(noise);
          
          // Adjust opacity for addition blend mode
          float opacity = 0.085; // Increased intensity
          
          gl_FragColor = vec4(grainColor, opacity);
        }
      `,
      uniforms: {
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        iTime: { value: 0 }
      },
      transparent: true
    });
    shaderMaterialRef.current = shaderMaterial;

    // Create a plane geometry that fills the screen
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(mesh);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      timeRef.current += 0.01;
      if (shaderMaterialRef.current) {
        shaderMaterialRef.current.uniforms.iTime.value = timeRef.current;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!rendererRef.current || !shaderMaterialRef.current) return;
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      shaderMaterialRef.current.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default GrainEffect; 