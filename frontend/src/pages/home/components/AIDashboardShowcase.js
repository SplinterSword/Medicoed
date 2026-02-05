'use client';

import React, { useState, useEffect } from 'react';
import { FaComments, FaQuestion, FaBook, FaBrain } from 'react-icons/fa';
import '../../../styles/AIDashboardShowcase.css';

export default function AIDashboardShowcase({ isDarkTheme = false }) {
  const [activePanel, setActivePanel] = useState(0);

  const panels = [
    {
      id: 0,
      icon: FaComments,
      label: 'Chat with PDF',
      title: 'Intelligent PDF Interaction',
      description: 'Upload medical PDFs and have natural conversations with AI. Ask questions, get explanations, and dive deeper into complex concepts.'
    },
    {
      id: 1,
      icon: FaQuestion,
      label: 'Quiz Generation',
      title: 'Adaptive Quiz System',
      description: 'Generate customized quizzes based on your learning material. Get instant feedback and track your progress over time.'
    },
    {
      id: 2,
      icon: FaBook,
      label: 'Flashcards',
      title: 'Smart Flashcard Decks',
      description: 'Automatic flashcard generation with spaced repetition algorithms. Master information retention with science-backed methods.'
    },
    {
      id: 3,
      icon: FaBrain,
      label: 'Mind Maps',
      title: 'Visual Knowledge Maps',
      description: 'Transform your learning material into interactive mind maps. Visualize connections between concepts and retain more.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePanel((prev) => (prev + 1) % panels.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [panels.length]);

  return (
    <section className={`medicoed-ads-section ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <div className="medicoed-ads-container">
        <div className="medicoed-ads-header">
          <h2 className="medicoed-ads-title">
            Your AI-Powered Learning <span className="medicoed-highlight">Dashboard</span>
          </h2>
          <p className="medicoed-ads-subtitle">
            One platform. Multiple AI tools. Unlimited learning potential.
          </p>
        </div>

        <div className="medicoed-ads-content">
          <div className="medicoed-ads-panels-wrapper">
            {panels.map((panel) => {
              const IconComponent = panel.icon;
              const isActive = activePanel === panel.id;

              return (
                <div
                  key={panel.id}
                  className={`medicoed-ads-panel ${isActive ? 'medicoed-ads-panel-active' : 'medicoed-ads-panel-active'}`}
                  onClick={() => setActivePanel(panel.id)}
                >
                  <div className="medicoed-ads-panel-inner">
                    <div className="medicoed-ads-panel-glow"></div>

                    <div className="medicoed-ads-panel-content">
                      <div className="medicoed-ads-panel-icon">
                        <IconComponent />
                      </div>
                      <h3 className="medicoed-ads-panel-title">{panel.title}</h3>
                      <p className="medicoed-ads-panel-description">
                        {panel.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="medicoed-ads-tabs">
            {panels.map((panel, idx) => {
              const IconComponent = panel.icon;
              const isActive = activePanel === idx;

              return (
                <button
                  key={idx}
                  className={`medicoed-ads-tab ${isActive ? 'medicoed-ads-tab-active' : ''}`}
                  onClick={() => setActivePanel(idx)}
                  aria-label={panel.label}
                >
                  <IconComponent className="medicoed-ads-tab-icon" />
                  <span>{panel.label}</span>
                  {isActive && <span className="medicoed-ads-tab-indicator"></span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
