'use client';

import React from 'react';
import './styles/HomePage.css';
import Hero from './components/Hero';
import FeaturePillars from './components/FeaturePillars';
import AIDashboardShowcase from './components/AIDashboardShowcase';
import CaseLabFlow from './components/CaseLabFlow';
import CommunityPreview from './components/CommunityPreview';
import TrustStrip from './components/TrustStrip';
import FinalCTA from './components/FinalCTA';

function HomePage({ isDarkTheme }) {
  return (
    <div className={`medicoed-app ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <Hero isDarkTheme={isDarkTheme} />
      <FeaturePillars  isDarkTheme={isDarkTheme} />
      <AIDashboardShowcase  isDarkTheme={isDarkTheme} />
      <CaseLabFlow  isDarkTheme={isDarkTheme} />
      <CommunityPreview  isDarkTheme={isDarkTheme} />
      <TrustStrip  isDarkTheme={isDarkTheme} />
      <FinalCTA  isDarkTheme={isDarkTheme} />
    </div>
  );
}

export default HomePage;
