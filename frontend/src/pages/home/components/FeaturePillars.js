'use client';

import React, { useState } from 'react';
import { FaBrain, FaStethoscope, FaUsers, FaArrowRight } from 'react-icons/fa';
import '../../../styles/FeaturePillars.css';

export default function FeaturePillars({ isDarkTheme = false }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const pillars = [
    {
      id: 1,
      icon: FaBrain,
      subtitle: 'Dashboard',
      title: 'Your AI-powered study dashboard',
      features: [
        'Upload PDFs and chat with AI',
        'Generate quizzes, flashcards, notes, and mind maps',
        'Organize everything using tags',
        'Resume learning anytime'
      ],
      accentVar: '--medicoed-sea-green'
    },
    {
      id: 2,
      icon: FaStethoscope,
      subtitle: 'CaseLab',
      title: 'Practice real clinical decision-making',
      features: [
        'Select department and receive a unique case',
        'Progress through clinical steps',
        'Decide investigations and interventions',
        'Complete handover and diagnosis'
      ],
      accentVar: '--medicoed-ocean-blue'
    },
    {
      id: 3,
      icon: FaUsers,
      subtitle: 'Community',
      title: 'A community built for medical minds',
      features: [
        'Share insights, questions, photos, or videos',
        'Follow hashtags, specialties, and peers',
        'Like, comment, repost, and subscribe',
        'Learn together with colleagues'
      ],
      accentVar: '--medicoed-accent-cyan'
    }
  ];

  return (
    <section className={`medicoed-fp-section ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <div className="medicoed-fp-container">
        <h2 className="medicoed-fp-title">
          Powerful Tools <span className="medicoed-highlight">Built for Medicine</span>
        </h2>

        <div className="medicoed-fp-grid">
          {pillars.map((pillar) => {
            const IconComponent = pillar.icon;
            const isHovered = hoveredCard === pillar.id;

            return (
              <div
                key={pillar.id}
                className={`medicoed-fp-card ${isHovered ? 'medicoed-fp-card-hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(pillar.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  '--fp-accent': `var(${pillar.accentVar})`
                }}
              >
                <div className="medicoed-fp-glow"></div>
                
                <div className="medicoed-fp-content">
                  <div className="medicoed-fp-header">
                    <div className="medicoed-fp-icon-wrapper">
                      <IconComponent className="medicoed-fp-icon" />
                    </div>
                    <span className="medicoed-fp-subtitle">{pillar.subtitle}</span>
                  </div>
                  
                  <h3 className="medicoed-fp-card-title">{pillar.title}</h3>
                  
                  <ul className="medicoed-fp-features">
                    {pillar.features.map((feature, idx) => (
                      <li key={idx} className="medicoed-fp-feature-item">
                        <span className="medicoed-fp-feature-icon">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className="medicoed-cta-button medicoed-cta-button-outline medicoed-fp-btn">
                    Explore <FaArrowRight size={14} style={{ marginLeft: '6px' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
