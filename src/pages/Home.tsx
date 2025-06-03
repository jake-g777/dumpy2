import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/test.css';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Home: React.FC = () => {
  const { user, signInWithGoogle, logout, loginLoading } = useAuth();

  return (
    <div className="test-page">
      <div className="footer">
        <div className="container">
          <div className="nav">
            <div className="logo-container">
              <div className="logo-circles">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
              </div>
              <span className="logo-text">DUMPY</span>
            </div>
          </div>

          <div className="values">
            <h3>+Menu</h3>
            <ul>
              <li><a href="#home">- [Home]</a></li>
              <li><a href="#features">- [Features]</a></li>
              <li><a href="#process">- [Process]</a></li>
              <li><a href="#pricing">- [Pricing]</a></li>
            </ul>
            <ul>
              <li><a href="#faq">- [FAQ]</a></li>
              <li><a href="#connect">- [Connect]</a></li>
            </ul>
          </div>

          <div className="location-2">
            <h3>+OFFERINGS</h3>
            <p>6357 Selma Ave</p>
            <p>Los Angeles</p>
            <p>CA 90028</p>
          </div>

          <div className="contact">
            <h3>+Get In Touch</h3>
            <p><a href="#">Support</a></p>
            <p><a href="mailto:hi@filip.fyi">Contact</a></p>
          </div>

          <div className="social">
            <h3>+Social</h3>
            <ul>
              <li><a href="https://instagram.com/filipz__">Github</a></li>
              <li><a href="https://x.com/filipz">X / Twitter</a></li>
              <li><a href="https://linkedin.com/in/filipzrnzevic">LinkedIn</a></li>
            </ul>
          </div>

          <div className="auth-buttons">
            {user ? (
              <div className="user-info">
                <p className="logged-in-text">Logged in as:</p>
                <p className="user-email">{user.email}</p>
                <div className="user-buttons">
                  <Link to="/dashboard" className="dashboard-btn">Dashboard</Link>
                  <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
              </div>
            ) : (
              <button 
                className="signup-btn" 
                onClick={signInWithGoogle}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" color="#ffffff" />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  'Sign in with Google'
                )}
              </button>
            )}
          </div>
        </div>

        <div className="hero-section" id="home">
          <div className="hero-content">
            <div className="animated-text">
            remove<br />the<br />noise
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2>Features</h2>
          <p>What we offer</p>
        </div>

        <div className="features-section" id="features">
          <div className="feature">
            <h2>01</h2>
            <h3>Simplify Your Workflow</h3>
            <p>Dumpy streamlines your development process by removing unnecessary complexity. Focus on what matters most - building great software.</p>
          </div>

          <div className="feature">
            <h2>02</h2>
            <h3>Clean Code, Clean Mind</h3>
            <p>Our tools help you maintain pristine codebases. Automatic cleanup, formatting, and optimization keep your projects organized and efficient.</p>
          </div>

          <div className="feature">
            <h2>03</h2>
            <h3>Smart Automation</h3>
            <p>Let Dumpy handle the repetitive tasks. From code generation to testing, we automate the mundane so you can focus on innovation.</p>
          </div>

          <div className="feature">
            <h2>04</h2>
            <h3>Real-time Collaboration</h3>
            <p>Work seamlessly with your team. Share code, track changes, and maintain version control all in one place.</p>
          </div>

          <div className="feature">
            <h2>05</h2>
            <h3>Performance Insights</h3>
            <p>Get detailed analytics and insights about your code's performance. Identify bottlenecks and optimize your applications.</p>
          </div>
        </div>

        <div className="section-header">
          <h2>Process</h2>
          <p>How it works</p>
        </div>

        <div className="process-section" id="process">
          <div className="process-content">
            <div className="process-steps">
              <div className="step">
                <span className="step-number">1</span>
                <h3>Connect</h3>
                <p>Link your development environment with Dumpy's powerful tools.</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <h3>Analyze</h3>
                <p>Our AI scans your codebase to identify areas for improvement.</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <h3>Optimize</h3>
                <p>Automatically clean, format, and enhance your code.</p>
              </div>
              <div className="step">
                <span className="step-number">4</span>
                <h3>Collaborate</h3>
                <p>Share your optimized code with team members and track changes.</p>
              </div>
              <div className="step">
                <span className="step-number">5</span>
                <h3>Monitor</h3>
                <p>Track performance metrics and get real-time insights.</p>
              </div>
              <div className="step">
                <span className="step-number">6</span>
                <h3>Scale</h3>
                <p>Expand your development capabilities with advanced features.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2>Pricing</h2>
          <p>Choose your plan</p>
        </div>

        <div className="pricing-section" id="pricing">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Starter</h3>
              <div className="price">
                <span className="amount">$9</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="features-list">
              <li>Basic code cleanup</li>
              <li>Standard formatting</li>
              <li>Email support</li>
              <li>1 project</li>
            </ul>
            <button className="signup-btn">Get Started</button>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-header">
              <h3>Pro</h3>
              <div className="price">
                <span className="amount">$29</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="features-list">
              <li>Advanced code cleanup</li>
              <li>Custom formatting</li>
              <li>Priority support</li>
              <li>Unlimited projects</li>
              <li>AI assistance</li>
            </ul>
            <button className="signup-btn">Get Started</button>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Enterprise</h3>
              <div className="price">
                <span className="period">Contact Sales</span>
              </div>
            </div>
            <ul className="features-list">
              <li>Custom solutions</li>
              <li>Dedicated support</li>
              <li>Team collaboration</li>
              <li>API access</li>
              <li>Custom integrations</li>
            </ul>
            <button className="signup-btn">Contact Sales</button>
          </div>
        </div>

        <div className="section-header">
          <h2>FAQ</h2>
          <p>Common questions</p>
        </div>

        <div className="faq-section" id="faq">
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How does Dumpy work?</h3>
              <p>Dumpy integrates with your development environment to analyze and optimize your code in real-time. It uses AI to understand your codebase and suggest improvements.</p>
            </div>
            <div className="faq-item">
              <h3>Is my code secure?</h3>
              <p>Yes, we take security seriously. All code analysis happens locally, and we never store your source code on our servers.</p>
            </div>
            <div className="faq-item">
              <h3>Can I try before I buy?</h3>
              <p>Absolutely! We offer a 14-day free trial with full access to all features. No credit card required.</p>
            </div>
            <div className="faq-item">
              <h3>What languages do you support?</h3>
              <p>We currently support JavaScript, TypeScript, Python, Java, and C#. More languages are coming soon!</p>
            </div>
          </div>
        </div>

        <div className="cta-section" id="connect">
          <div className="cta-content">
            <h2>Try Dumpy Today!</h2>
            <p>Join thousands of developers who have streamlined their workflow with Dumpy.</p>
            <button className="signup-btn">Get Started</button>
          </div>
        </div>

        <div className="bottom-bar">
          <div className="coordinates">
            <p>34.0522° N, 118.2437° W</p>
          </div>

          <div className="links">
            <span>Get</span>
            <span>Dumpy</span>
          </div>

          <div className="info">
            <p>• Est. 2025 •</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 