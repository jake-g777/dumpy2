import React, { useEffect, useRef } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

const ScrambleText: React.FC<ScrambleTextProps> = ({ text, className = '' }) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const span = spanRef.current;
    if (!span) return;

    const randomChar = () => String.fromCharCode(33 + Math.floor(Math.random() * 94));
    const framesPerSecond = 30;
    const revealSpeed = 3;

    let scrambleInterval: NodeJS.Timeout;
    let resolveInterval: NodeJS.Timeout;

    const startScrambling = () => {
      clearInterval(scrambleInterval);
      scrambleInterval = setInterval(() => {
        if (span) {
          span.textContent = [...text].map(() => randomChar()).join('');
        }
      }, 1000 / framesPerSecond);
    };

    const resolve = () => {
      clearInterval(scrambleInterval);
      let progress = 0;
      resolveInterval = setInterval(() => {
        progress += revealSpeed;
        if (span) {
          span.textContent = [...text]
            .map((ch, i) => (i < progress ? ch : randomChar()))
            .join('');

          if (progress >= text.length) {
            clearInterval(resolveInterval);
            span.textContent = text;
          }
        }
      }, 1000 / framesPerSecond);
    };

    const scrambleAgain = () => {
      clearInterval(resolveInterval);
      setTimeout(startScrambling, 300);
    };

    // Initial state
    startScrambling();

    // Event listeners
    span.addEventListener('mouseenter', resolve);
    span.addEventListener('mouseleave', scrambleAgain);

    // Cleanup
    return () => {
      clearInterval(scrambleInterval);
      clearInterval(resolveInterval);
      span.removeEventListener('mouseenter', resolve);
      span.removeEventListener('mouseleave', scrambleAgain);
    };
  }, [text]);

  return (
    <span
      ref={spanRef}
      className={`scramble text-2xl md:text-3xl lg:text-4xl tracking-wider cursor-pointer transition-all duration-250 hover:filter hover:drop-shadow-[0_0_6px_#34ffca] ${className}`}
    />
  );
};

export default ScrambleText; 