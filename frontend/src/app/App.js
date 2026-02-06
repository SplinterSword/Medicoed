'use client';

import React, { useState, useEffect } from 'react';
import '../styles/app.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomePage from '../pages/home/HomePage';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from '../pages/dashboard/Dashboard';
import PricingPage from '../pages/pricing/PricingPage';

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [pageSelected, setPageSelected] = useState('/');
  const location = useLocation();

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

  useEffect(() => {
    setPageSelected(location.pathname);
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className={`medicoed-app ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} pageSelected={pageSelected} />
      <Routes>
        <Route path="/" element={<HomePage isDarkTheme={isDarkTheme} />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/pricing/*" element={<PricingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer isDarkTheme={isDarkTheme} />
    </div>
  );
}

export default App;
