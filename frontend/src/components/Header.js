'use client';

import React, { useState } from 'react';
import '../styles/header.css';

const Header = ({ isDarkTheme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="medicoed-header">
      <div className="medicoed-header-container">
        <div className="medicoed-logo">
          <div className="medicoed-logo-icon">M</div>
          <span className="medicoed-logo-text">MEDICOED</span>
        </div>

        <nav className={`medicoed-nav ${isMenuOpen ? 'medicoed-nav-active' : ''}`}>
          <a href="#home" className="medicoed-nav-link medicoed-nav-link-active">
            Home
          </a>
          <a href="#dashboard" className="medicoed-nav-link">
            Dashboard
          </a>
          <a href="#cases" className="medicoed-nav-link">
            Case Studies
          </a>
          <a href="#community" className="medicoed-nav-link">
            Community
          </a>
          <a href="#about" className="medicoed-nav-link">
            About
          </a>
        </nav>

        <div className="medicoed-header-actions">
          <button className="medicoed-theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDarkTheme ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button className="medicoed-cta-button medicoed-cta-button-primary">
            Get Started
          </button>

          <button
            className="medicoed-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className="medicoed-header-underline" />
    </header>
  );
};

export default Header;
