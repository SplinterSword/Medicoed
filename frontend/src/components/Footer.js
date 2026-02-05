import React from 'react';
import '../styles/footer.css';

const Footer = ({ isDarkTheme }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="medicoed-footer">
      <div className="medicoed-footer-container">
        <div className="medicoed-footer-grid">
          <div className="medicoed-footer-column">
            <div className="medicoed-footer-logo">
              <div className="medicoed-footer-logo-icon">M</div>
              <span className="medicoed-footer-logo-text">MEDICOED</span>
            </div>
            <p className="medicoed-footer-description">
              Revolutionizing medical education through AI-powered learning, case studies, and community collaboration.
            </p>
            <div className="medicoed-footer-social">
              <a href="#" className="medicoed-social-link">
                f
              </a>
              <a href="#" className="medicoed-social-link">
                𝕏
              </a>
              <a href="#" className="medicoed-social-link">
                in
              </a>
              <a href="#" className="medicoed-social-link">
                ▶
              </a>
            </div>
          </div>

          <div className="medicoed-footer-column">
            <h4 className="medicoed-footer-title">Product</h4>
            <ul className="medicoed-footer-links">
              <li>
                <a href="#dashboard">Dashboard</a>
              </li>
              <li>
                <a href="#cases">Case Studies</a>
              </li>
              <li>
                <a href="#community">Community</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
            </ul>
          </div>

          <div className="medicoed-footer-column">
            <h4 className="medicoed-footer-title">Company</h4>
            <ul className="medicoed-footer-links">
              <li>
                <a href="#about">About Us</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>

          {/*<div className="medicoed-footer-column">
            <h4 className="medicoed-footer-title">Resources</h4>
            <ul className="medicoed-footer-links">
              <li>
                <a href="#docs">Documentation</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
              <li>
                <a href="#support">Support</a>
              </li>
              <li>
                <a href="#status">Status</a>
              </li>
              <li>
                <a href="#academy">Academy</a>
              </li>
            </ul>
          </div>*/}

          <div className="medicoed-footer-column">
            <h4 className="medicoed-footer-title">Legal</h4>
            <ul className="medicoed-footer-links">
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="medicoed-footer-divider" />

        <div className="medicoed-footer-bottom">
          <p className="medicoed-footer-copyright">
            © {currentYear} MEDICOED. All rights reserved. | Designed with ❤️ for medical excellence
          </p>
          {/*<div className="medicoed-footer-badges">
            <span className="medicoed-badge">🔒 HIPAA Compliant</span>
            <span className="medicoed-badge">✓ ISO Certified</span>
            <span className="medicoed-badge">🌍 Global Platform</span>
          </div>*/}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
