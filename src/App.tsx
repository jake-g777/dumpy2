import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Banner from './components/Banner';
import SignIn from './components/SignIn';
import DashboardLayout from './components/DashboardLayout';

const HomePage: React.FC<{ isBannerVisible: boolean }> = ({ isBannerVisible }) => {
  useEffect(() => {
    console.log('HomePage mounted');
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar isBannerVisible={isBannerVisible} />
      <main className="container mx-auto">
        <Hero />
      </main>
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-4">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <div className="min-h-screen bg-white">
            <Banner onVisibilityChange={setIsBannerVisible} />
            <Routes>
              <Route path="/" element={<HomePage isBannerVisible={isBannerVisible} />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/dashboard" element={<DashboardLayout />} />
            </Routes>
          </div>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;