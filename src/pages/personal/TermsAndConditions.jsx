import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsAndConditions.css';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <div className="terms-content-wrapper">
        <div className="terms-header">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            ← Back
          </button>
          <h1 className="terms-title">📄 Terms & Conditions</h1>
          <p className="terms-effective-date">Effective: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using BudgetPro ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Description of Service</h2>
            <p>
              BudgetPro provides personal financial management tools including but not limited to:
            </p>
            <ul>
              <li>Income and expense tracking</li>
              <li>Budget planning and monitoring</li>
              <li>Financial reporting and analytics</li>
              <li>Debt management tools</li>
              <li>Business expense tracking (Pro feature)</li>
              <li>Advanced notifications (Pro feature)</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>3. User Accounts</h2>
            <p>
              You must create an account to use BudgetPro. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>4. Subscription Plans</h2>
            <p>
              BudgetPro offers the following subscription plans:
            </p>
            <div className="plan-details">
              <div className="plan-card">
                <h3>Free Plan</h3>
                <ul>
                  <li>Basic income and expense tracking</li>
                  <li>Simple budget planning</li>
                  <li>Local data storage</li>
                  <li>Basic financial reports</li>
                </ul>
              </div>
              <div className="plan-card">
                <h3>Professional Plan</h3>
                <ul>
                  <li>All Free features plus:</li>
                  <li>Advanced notifications</li>
                  <li>Business expense tracking</li>
                  <li>Cloud backup and sync</li>
                  <li>Priority support</li>
                  <li>Export capabilities</li>
                </ul>
              </div>
              <div className="plan-card">
                <h3>Lifetime Plan</h3>
                <ul>
                  <li>All Professional features</li>
                  <li>One-time payment</li>
                  <li>Lifetime access</li>
                  <li>All future updates included</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="terms-section">
            <h2>5. Payment and Billing</h2>
            <p>
              For paid subscriptions:
            </p>
            <ul>
              <li>Professional plan is billed monthly</li>
              <li>Lifetime plan is a one-time payment</li>
              <li>All payments are processed through secure third-party providers</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>No refunds for partial months or unused periods</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Data Privacy and Security</h2>
            <p>
              We take your privacy seriously:
            </p>
            <ul>
              <li>Your financial data is encrypted and stored securely</li>
              <li>We never sell your personal information to third parties</li>
              <li>You can export or delete your data at any time</li>
              <li>We use industry-standard security measures to protect your data</li>
              <li>For more details, see our Privacy Policy</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>7. User Responsibilities</h2>
            <p>
              You agree to:
            </p>
            <ul>
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to hack or compromise the Service</li>
              <li>Not use the Service to store illegal or harmful content</li>
              <li>Maintain accurate financial records</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              BudgetPro is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul>
              <li>Financial decisions made based on our Service</li>
              <li>Data loss due to user error or system failure</li>
              <li>Unauthorized access to your account</li>
              <li>Service interruptions or downtime</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account if you:
            </p>
            <ul>
              <li>Violate these terms</li>
              <li>Use the Service fraudulently</li>
              <li>Attempt to compromise system security</li>
              <li>Fail to pay subscription fees</li>
            </ul>
            <p>
              You may terminate your account at any time through the Settings page.
            </p>
          </section>

          <section className="terms-section">
            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="terms-section">
            <h2>11. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of South Africa. Any disputes shall be resolved through email communication.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. Contact Information</h2>
            <p>
              For questions about these terms, contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> BudgetProo@gmail.com</p>
              <p><strong>Support:</strong> BudgetProo@gmail.com</p>
            </div>
          </section>

          <div className="terms-acceptance">
            <p>
              By using BudgetPro, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
            </p>
          </div>
        </div>

        <div className="terms-actions">
          <button 
            onClick={() => navigate('/signup')}
            className="signup-button"
          >
            ← Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}