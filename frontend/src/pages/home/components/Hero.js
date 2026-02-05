'use client';

import React, { useEffect, useState } from 'react';
import { FaBook, FaRobot, FaComments, FaMapSigns, FaLightbulb, FaTrophy, FaRocket } from 'react-icons/fa';
import '../../../styles/hero.css';

const Hero = ({ isDarkTheme }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('.medicoed-hero-section');
      const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 0;
      const currentScroll = window.scrollY;
      const progress = Math.min((currentScroll / (heroBottom - window.innerHeight)) * 100, 100);
      setScrollProgress(Math.max(0, progress));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="medicoed-hero-section" id="home">
      <div className="medicoed-hero-background">
        <div className="medicoed-hero-glow medicoed-glow-top-left" />
        <div className="medicoed-hero-glow medicoed-glow-top-right" />
        <div className="medicoed-hero-glow medicoed-glow-bottom" />
        <div className="medicoed-hero-animated-bg" />
      </div>

      <div className="medicoed-hero-content">
        <div className="medicoed-hero-tag">
          <FaRocket className="medicoed-hero-tag-icon" />
          <span className="medicoed-hero-tag-text">World's Most Advanced Medical AI</span>
        </div>

        <h1 className="medicoed-hero-title">
          
          <span className="medicoed-hero-title-main" >Revolutionizing</span>
          <div>
            <span className="medicoed-hero-title-highlight" style={{display: "inline"}}> Medical Education</span>
            <span className="medicoed-hero-title-main"  style={{display: "inline"}}> with AI</span>
          </div>
        </h1>

        <p className="medicoed-hero-subtitle">
          Master clinical excellence through AI-powered learning, real case studies, and collaborative community
        </p>

        {/*<div className="medicoed-hero-search-bar">
          <div className="medicoed-search-input-group">
            <svg className="medicoed-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search topics, specializations..."
              className="medicoed-search-input"
            />
          </div>

          <button className="medicoed-search-button medicoed-search-button-primary">
            Explore Now
          </button>
        </div>*/}

        <div className="medicoed-hero-stats">
          <div className="medicoed-stat-item">
            <span className="medicoed-stat-number">AI Powered</span>
            <span className="medicoed-stat-label">Analysis</span>
          </div>
          <div className="medicoed-stat-divider" />
          <div className="medicoed-stat-item">
            <span className="medicoed-stat-number">10K+</span>
            <span className="medicoed-stat-label">Case Studies</span>
          </div>
          <div className="medicoed-stat-divider" />
          <div className="medicoed-stat-item">
            <span className="medicoed-stat-number">24/7</span>
            <span className="medicoed-stat-label">AI Support</span>
          </div>
        </div>
      </div>

      <div
        className="medicoed-hero-card-container"
        style={{ transform: `translateY(${Math.min(scrollProgress * 0.3, 100)}px)` }}
      >
        <div className="medicoed-hero-card medicoed-hero-card-glow">
          <div className="medicoed-card-header">
            <div className="medicoed-card-tabs">
              <button className="medicoed-card-tab medicoed-card-tab-active">Overview</button>
              <button className="medicoed-card-tab">Analytics</button>
              <button className="medicoed-card-tab">Reports</button>
            </div>
          </div>

          <div className="medicoed-card-body">
            <div className="medicoed-card-section">
              <h3 className="medicoed-card-title">What We Deliver</h3>
              <p className="medicoed-card-description">
                MEDICOED is an AI-powered medical education platform that provides comprehensive learning solutions including:
              </p>

              <div className="medicoed-features-list">
                <div className="medicoed-feature-item">
                  <FaBook className="medicoed-feature-icon" />
                  <span className="medicoed-feature-text">Infinite Case Studies</span>
                </div>
                <div className="medicoed-feature-item">
                  <FaRobot className="medicoed-feature-icon" />
                  <span className="medicoed-feature-text">AI-Powered Analysis & Learning</span>
                </div>
                <div className="medicoed-feature-item">
                  <FaComments className="medicoed-feature-icon" />
                  <span className="medicoed-feature-text">Interactive Discussions</span>
                </div>
                <div className="medicoed-feature-item">
                  <FaMapSigns className="medicoed-feature-icon" />
                  <span className="medicoed-feature-text">Personalized Study Paths</span>
                </div>
                <div className="medicoed-feature-item">
                  <FaLightbulb className="medicoed-feature-icon" />
                  <span className="medicoed-feature-text">24/7 Expert Support</span>
                </div>
                <div className="medicoed-feature-item">
                  <FaTrophy className="medicoed-feature-icon" />
                  <span className="medicoed-feature-text">Industry-Leading Resources</span>
                </div>
              </div>
            </div>
          </div>

          <div className="medicoed-card-footer">
            <button className="medicoed-card-action-btn">View Full Report</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
