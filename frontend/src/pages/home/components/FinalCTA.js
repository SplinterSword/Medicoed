import React from 'react';
import { FaArrowRight, FaPlay } from 'react-icons/fa';
import '../../../styles/FinalCTA.css';

export default function FinalCTA({ isDarkTheme = false }) {
  return (
    <section className={`medicoed-fc-section ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <div className="medicoed-fc-background">
        <div className="medicoed-fc-wave-animation"></div>
        <div className="medicoed-fc-particles"></div>
      </div>

      <div className="medicoed-fc-container">
        <div className="medicoed-fc-content">
          <h2 className="medicoed-fc-headline">
            Start your AI-powered medical learning journey
          </h2>
          <p className="medicoed-fc-subheadline">
            Join medical students and professionals transforming their education with intelligent AI tools
          </p>

          <div className="medicoed-fc-buttons">
            <button className="medicoed-cta-button medicoed-cta-button-primary">
              <span>Start Free</span>
              <FaArrowRight size={16} style={{ marginLeft: '8px' }} />
            </button>
            <button className="medicoed-cta-button medicoed-cta-button-outline">
              <FaPlay size={14} style={{ marginRight: '8px' }} />
              <span>View Demo</span>
            </button>
          </div>

          <p className="medicoed-fc-note">
            No credit card required • Start learning today • Cancel anytime
          </p>
        </div>
      </div>

      <div className="medicoed-fc-glow-orb medicoed-fc-orb-1"></div>
      <div className="medicoed-fc-glow-orb medicoed-fc-orb-2"></div>
    </section>
  );
}
