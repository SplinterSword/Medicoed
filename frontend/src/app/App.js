'use client';

import React, { useState, useEffect } from 'react';
import '../styles/app.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HomePage from '../pages/home/HomePage';

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
      <HomePage isDarkTheme={isDarkTheme} />
      <Footer isDarkTheme={isDarkTheme} />
    </div>
  );
}

export default App;
