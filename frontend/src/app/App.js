'use client';

import React, { useState, useEffect } from 'react';
import '../styles/app.css';
import Header from '../components/Header';
import Hero from '../components/Hero';
import FeaturePillars from '../components/FeaturePillars';
import AIDashboardShowcase from '../components/AIDashboardShowcase';
import CaseLabFlow from '../components/CaseLabFlow';
import CommunityPreview from '../components/CommunityPreview';
import TrustStrip from '../components/TrustStrip';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('medicoed-theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('medicoed-dark-theme', isDarkTheme);
    document.body.classList.toggle('medicoed-light-theme', !isDarkTheme);
    localStorage.setItem('medicoed-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className={`medicoed-app ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <Hero isDarkTheme={isDarkTheme} />
      <FeaturePillars  isDarkTheme={isDarkTheme} />
      <AIDashboardShowcase  isDarkTheme={isDarkTheme} />
      <CaseLabFlow  isDarkTheme={isDarkTheme} />
      <CommunityPreview  isDarkTheme={isDarkTheme} />
      <TrustStrip  isDarkTheme={isDarkTheme} />
      <FinalCTA  isDarkTheme={isDarkTheme} />
      <Footer isDarkTheme={isDarkTheme} />
    </div>
  );
}

export default App;
