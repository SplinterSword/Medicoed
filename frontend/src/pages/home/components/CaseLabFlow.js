'use client';

import React, { useState } from 'react';
import {
  FaClipboardList,
  FaHeartbeat,
  FaStethoscope,
  FaFlask,
  FaSyringe,
  FaBookMedical,
  FaHandshake,
  FaTrophy,
} from 'react-icons/fa';
import '../styles/CaseLabFlow.css';

export default function CaseLabFlow({ isDarkTheme = false }) {
  const [hoveredStep, setHoveredStep] = useState(null);

  const steps = [
    { id: 1, icon: FaClipboardList, label: 'Department', description: 'Choose your specialty' },
    { id: 2, icon: FaHeartbeat, label: 'History', description: 'Gather patient information' },
    { id: 3, icon: FaStethoscope, label: 'Exam', description: 'Physical assessment' },
    { id: 4, icon: FaFlask, label: 'Tests', description: 'Order tests and imaging' },
    { id: 5, icon: FaSyringe, label: 'Plan', description: 'Treatment decisions' },
    { id: 6, icon: FaBookMedical, label: 'Diagnosis', description: 'List possibilities' },
    { id: 7, icon: FaHandshake, label: 'Handover', description: 'Complete summary' },
    { id: 8, icon: FaTrophy, label: 'Report', description: 'Receive feedback' }
  ];

  return (
    <section className={`medicoed-clf-section ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <div className="medicoed-clf-container">
        <div className="medicoed-clf-header">
          <h2 className="medicoed-clf-title">
            CaseLab: Learn Clinical <span className="medicoed-highlight">Reasoning</span>
          </h2>
          <p className="medicoed-clf-subtitle">
            Work through realistic medical cases step-by-step, making clinical decisions like you would in practice
          </p>
        </div>

        <div className="medicoed-clf-timeline-wrapper">
          <svg
            className="medicoed-clf-timeline-svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M 0,60 Q 150,20 300,60 T 600,60 T 900,60 T 1200,60"
              fill="none"
              stroke="var(--medicoed-sea-green)"
              strokeWidth="2"
              opacity="0.3"
            />
            <defs>
              <linearGradient
                id="medicoed-clf-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--medicoed-sea-green)" />
                <stop offset="50%" stopColor="var(--medicoed-ocean-blue)" />
                <stop offset="100%" stopColor="var(--medicoed-accent-cyan)" />
              </linearGradient>
            </defs>
          </svg>

          <div className="medicoed-clf-steps-container">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isHovered = hoveredStep === step.id;

              return (
                <div
                  key={step.id}
                  className="medicoed-clf-step-wrapper"
                  style={{ '--step-index': index }}
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div
                    className={`medicoed-clf-step-node ${
                      isHovered ? 'medicoed-clf-step-hovered' : ''
                    }`}
                  >
                    <div className="medicoed-clf-step-glow"></div>
                    <div className="medicoed-clf-step-pulse"></div>
                    <IconComponent className="medicoed-clf-step-icon" />
                  </div>

                  <div className="medicoed-clf-step-tooltip">
                    <h4 className="medicoed-clf-tooltip-label">{step.label}</h4>
                    <p className="medicoed-clf-tooltip-description">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="medicoed-clf-features">
          <div className="medicoed-clf-feature-card">
            <div className="medicoed-clf-feature-icon">
              <FaBookMedical />
            </div>
            <h3>Realistic Cases</h3>
            <p>Cases based on actual clinical presentations and guidelines</p>
          </div>

          <div className="medicoed-clf-feature-card">
            <div className="medicoed-clf-feature-icon">
              <FaHeartbeat />
            </div>
            <h3>Live Feedback</h3>
            <p>Get immediate insights on your clinical reasoning</p>
          </div>

          <div className="medicoed-clf-feature-card">
            <div className="medicoed-clf-feature-icon">
              <FaTrophy />
            </div>
            <h3>Performance Tracking</h3>
            <p>Monitor your progress across multiple cases and departments</p>
          </div>
        </div>
      </div>
    </section>
  );
}
