import React from 'react';
import { FaCheckCircle, FaBrain, FaNetworkWired, FaUsers } from 'react-icons/fa';
import '../styles/TrustStrip.css';

export default function TrustStrip({ isDarkTheme = false }) {
  const values = [
    {
      icon: FaNetworkWired,
      title: 'Structured Learning',
      description: 'Curriculum-aligned content organized for systematic mastery'
    },
    {
      icon: FaBrain,
      title: 'Clinical Reasoning',
      description: 'Learn to think like a clinician, not just memorize facts'
    },
    {
      icon: FaCheckCircle,
      title: 'Organized Knowledge',
      description: 'Track your progress and never lose your learnings'
    },
    {
      icon: FaUsers,
      title: 'Collaborative Growth',
      description: 'Learn with peers and share insights across specialties'
    }
  ];

  return (
    <section className={`medicoed-ts-section ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <div className="medicoed-ts-container">
        <div className="medicoed-ts-values">
          {values.map((value, idx) => {
            const IconComponent = value.icon;
            return (
              <div key={idx} className="medicoed-ts-item" style={{ '--trust-index': idx }}>
                <div className="medicoed-ts-icon-wrapper">
                  <IconComponent className="medicoed-ts-icon" />
                  <div className="medicoed-ts-icon-bg"></div>
                </div>
                <div className="medicoed-ts-content">
                  <h3 className="medicoed-ts-title">{value.title}</h3>
                  <p className="medicoed-ts-description">{value.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
