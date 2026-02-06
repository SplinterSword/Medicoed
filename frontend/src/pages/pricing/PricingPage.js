import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './styles/pricing-page.css';

const PricingPage = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    script.onload = () => {
      console.log('Stripe script loaded successfully.');
      if (window.StripeBuyButton) {
        // This line ensures the StripeBuyButton is available and mounts it to the DOM
        document.querySelectorAll('stripe-buy-button').forEach(button => {
          window.StripeBuyButton.mount(button);
        });
      } else {
        console.error('StripeBuyButton is not available. Check if the script loaded correctly.');
      }
    };
    script.onerror = () => {
      console.error('Failed to load Stripe script. Check the script URL and network connection.');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup the script from the DOM when the component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <div className="medicoed-pricing-page">
        <div className="medicoed-pricing-container">
          <header className="medicoed-pricing-header">
            <h1>
              Choose Your <span className="medicoed-highlight">Plan</span>
            </h1>
            <p>
              Find the right plan for your needs and elevate your study experience with MedicoEd.
            </p>
          </header>

          <div className="medicoed-pricing-plans">
            {/* Standard Plan */}
            <div className="medicoed-pricing-plan">
              <h2>Standard</h2>
              <div className="medicoed-price">$9.99<span style={{ fontSize: '1rem', color: 'var(--medicoed-text-secondary)' }}>/month</span></div>
              <div id="stripe-buy-button-container">
              <stripe-buy-button
                buy-button-id="buy_btn_1Qwd4nKVV0DxAE32PBDHjPuL"
                publishable-key="pk_live_51Qf3SNKVV0DxAE32lMWfeqDWfo2HQ7cdVOgTkUnYPwGZrzNTQjMU2K8Q6yxfGhZgr26F9U7lIQ12SaK8bgU9ctFs00tM0KomlG"
              >
              </stripe-buy-button>
              <div>
                <p className="medicoed-plan-description">
                  Unlimited PDF uploads, Generating up to 500 flashcards/month, Mind map creation, and question generation.
                </p>
              </div>
              </div>
            </div>
            
            {/* Premium Plan */}
            <div className="medicoed-pricing-plan">
              <h2>Premium</h2>
              <div className="medicoed-price">$19.99<span style={{ fontSize: '1rem', color: 'var(--medicoed-text-secondary)' }}>/month</span></div>
              <div id="stripe-buy-button-container2">
              <stripe-buy-button
              buy-button-id="buy_btn_1Qwd3dKVV0DxAE32BJzZllfV"
              publishable-key="pk_live_51Qf3SNKVV0DxAE32lMWfeqDWfo2HQ7cdVOgTkUnYPwGZrzNTQjMU2K8Q6yxfGhZgr26F9U7lIQ12SaK8bgU9ctFs00tM0KomlG"
              >
              </stripe-buy-button>
              <div>
                <p className="medicoed-plan-description">
                  All Standard features, Unlimited access to all tools, Chat with documents and case studies, Advanced AI tools for personalized recommendations, and Certificate of completion for case studies.
                </p>
              </div>
              </div>
            </div>
            
            {/* Universities Plan */}
            <div className="medicoed-pricing-plan medicoed-custom-plan">
              <h2>Universities</h2>
              <div className="medicoed-price">Custom</div>
              <p className="medicoed-custom-info">
                Personalized plan tailored to your specific needs. Get in touch to discuss your requirements and pricing.
              </p>
              <button className="medicoed-cta-button medicoed-cta-button-primary">Contact Us</button>
              <p style={{ fontSize: '0.9rem', color: 'var(--medicoed-text-tertiary)', marginTop: 'var(--medicoed-spacing-md)' }}>Custom checkout coming soon...</p>
            </div>
          </div>
          <div className="medicoed-reload-message">
            <p>Please refresh the page once the payment is completed to ensure all changes are applied.</p>
          </div>
        </div>
        <div className="medicoed-manage-subscription">
            <Link to="https://billing.stripe.com/p/login/bIY6qw7XH5U7axW4gg" className="medicoed-manage-subscription-link">
              Manage Subscription
            </Link>
          </div>
      </div>
    </div>
  );
};

export default PricingPage;
