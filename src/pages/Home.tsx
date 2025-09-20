import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/test.css';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Database, 
  Zap, 
  BarChart3, 
  Shield, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Play,
  Code,
  FileText,
  Cloud,
  GitBranch,
  Settings,
  Globe,
  TrendingUp,
  Lock,
  RefreshCw,
  Eye,
  Download,
  BarChart,
  Cpu,
  Network,
  Activity
} from 'lucide-react';

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
            <p>No-Code ETL</p>
            <p>Data Pipelines</p>
            <p>Real-time Processing</p>
          </div>

          <div className="contact">
            <h3>+Get In Touch</h3>
            <p><a href="#">Support</a></p>
            <p><a href="mailto:contact@dumpy.com">Contact</a></p>
          </div>

          <div className="social">
            <h3>+Social</h3>
            <ul>
              <li><a href="https://github.com/dumpy">Github</a></li>
              <li><a href="https://twitter.com/dumpy">X / Twitter</a></li>
              <li><a href="https://linkedin.com/company/dumpy">LinkedIn</a></li>
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
          <div className="hero-animated-box">
            <div className="hero-abstract-bg" aria-hidden="true"></div>
            <div className="hero-content relative z-10">
              <div className="animated-text">
                Transform<br />Your Data<br />Without Code
              </div>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2>Features</h2>
          <p>Enterprise-grade data pipeline platform</p>
        </div>

        <div className="features-section" id="features">
          <div className="feature">
            <h2>01</h2>
            <h3>Visual Pipeline Builder</h3>
            <p>Drag-and-drop interface to build complex data pipelines without writing a single line of code. Connect databases, APIs, and cloud services with ease.</p>
          </div>

          <div className="feature">
            <h2>02</h2>
            <h3>Real-time Data Processing</h3>
            <p>Process millions of records with sub-second latency. Stream data from multiple sources and transform it in real-time for instant insights.</p>
          </div>

          <div className="feature">
            <h2>03</h2>
            <h3>Enterprise Security</h3>
            <p>SOC 2 compliant with end-to-end encryption. Role-based access control, audit logging, and enterprise-grade security features included.</p>
          </div>

          <div className="feature">
            <h2>04</h2>
            <h3>Advanced Monitoring</h3>
            <p>Built-in dashboards and real-time monitoring. Track pipeline performance, data quality metrics, and get instant alerts for any issues.</p>
          </div>

          <div className="feature">
            <h2>05</h2>
            <h3>Scalable Infrastructure</h3>
            <p>Auto-scaling infrastructure that grows with your data needs. Handle from gigabytes to petabytes of data with consistent performance.</p>
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
                <p>Connect your data sources using our pre-built connectors for databases, APIs, and cloud services.</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <h3>Design</h3>
                <p>Use our visual builder to design your data pipeline with drag-and-drop components and transformations.</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <h3>Deploy</h3>
                <p>Deploy your pipeline with one click and let our infrastructure handle the scaling and monitoring.</p>
              </div>
              <div className="step">
                <span className="step-number">4</span>
                <h3>Monitor</h3>
                <p>Monitor performance, data quality, and get real-time alerts through our comprehensive dashboard.</p>
              </div>
              <div className="step">
                <span className="step-number">5</span>
                <h3>Scale</h3>
                <p>Scale automatically as your data grows. Our infrastructure handles millions of records without performance degradation.</p>
              </div>
              <div className="step">
                <span className="step-number">6</span>
                <h3>Optimize</h3>
                <p>Use AI-powered insights to optimize your pipelines for better performance and cost efficiency.</p>
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
                <span className="amount">$29</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="features-list">
              <li>Up to 5 data pipelines</li>
              <li>10GB data processing</li>
              <li>Basic connectors</li>
              <li>Email support</li>
              <li>Standard monitoring</li>
            </ul>
            <button className="signup-btn">Start Free Trial</button>
          </div>

          <div className="pricing-card featured">
            <div className="pricing-header">
              <h3>Pro</h3>
              <div className="price">
                <span className="amount">$99</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="features-list">
              <li>Unlimited pipelines</li>
              <li>100GB data processing</li>
              <li>All connectors</li>
              <li>Priority support</li>
              <li>Advanced monitoring</li>
              <li>Real-time processing</li>
              <li>Custom transformations</li>
            </ul>
            <button className="signup-btn">Start Free Trial</button>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Enterprise</h3>
              <div className="price">
                <span className="period">Contact Sales</span>
              </div>
            </div>
            <ul className="features-list">
              <li>Unlimited everything</li>
              <li>Custom integrations</li>
              <li>Dedicated support</li>
              <li>SLA guarantees</li>
              <li>On-premise option</li>
              <li>Advanced security</li>
              <li>Custom connectors</li>
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
              <h3>What databases do you support?</h3>
              <p>We support all major databases including MySQL, PostgreSQL, SQL Server, Oracle, MongoDB, and more. We also support cloud databases like AWS RDS, Google Cloud SQL, and Azure SQL.</p>
            </div>
            <div className="faq-item">
              <h3>Is my data secure?</h3>
              <p>Yes, we take security seriously. All data is encrypted in transit and at rest. We're SOC 2 compliant and offer enterprise-grade security features including role-based access control and audit logging.</p>
            </div>
            <div className="faq-item">
              <h3>Can I try before I buy?</h3>
              <p>Absolutely! We offer a 14-day free trial with full access to all features. No credit card required. You can build and deploy real pipelines during your trial.</p>
            </div>
            <div className="faq-item">
              <h3>What if I need help?</h3>
              <p>We provide comprehensive documentation, video tutorials, and a knowledge base. Pro and Enterprise customers get priority support with dedicated account managers.</p>
            </div>
            <div className="faq-item">
              <h3>How does scaling work?</h3>
              <p>Our infrastructure automatically scales based on your data volume. You can process from gigabytes to petabytes of data without any configuration changes.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use my own infrastructure?</h3>
              <p>Yes, our Enterprise plan includes on-premise deployment options. We can deploy our platform in your own data center or cloud environment.</p>
            </div>
          </div>
        </div>

        <div className="cta-section" id="connect">
          <div className="cta-content">
            <h2>Ready to Transform Your Data?</h2>
            <p>Join thousands of companies using our platform to build reliable data pipelines. Start your free trial today and see the difference no-code ETL can make.</p>
            <button className="signup-btn">Start Building Free</button>
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
            <p>• Est. 2024 •</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 