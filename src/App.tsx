import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Banner from './components/Banner';
import SignIn from './components/SignIn';

const HomePage: React.FC<{ isBannerVisible: boolean }> = ({ isBannerVisible }) => {
  return (
    <>
      <Navbar isBannerVisible={isBannerVisible} />
      <main>
        <Hero />
      </main>
    </>
  );
};

const App: React.FC = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen bg-white">
          <Banner onVisibilityChange={setIsBannerVisible} />
          <Routes>
            <Route path="/" element={<HomePage isBannerVisible={isBannerVisible} />} />
            <Route path="/signin" element={<SignIn />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
};

export default App;