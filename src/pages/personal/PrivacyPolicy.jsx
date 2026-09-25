import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const currentDate = new Date();
  const effectiveDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1)); // One month ago

  return (
    <div className="privacy-container">
      <div className="privacy-content-wrapper">
        <div className="privacy-header">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            ← Back
          </button>
          <h1 className="privacy-title">🔐 Privacy Policy</h1>
          <p className="privacy-effective-date">
            Effective: {effectiveDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="privacy-last-updated">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="privacy-content">
          <div className="privacy-intro">
            <p>
              At BudgetPro, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our personal finance management application. Please read this 
              policy carefully to understand our views and practices regarding your personal data.
            </p>
            <p>
              By using BudgetPro, you consent to the data practices described in this policy. If you do not agree with 
              our policies and practices, please do not use our application.
            </p>
          </div>

          <section className="privacy-section">
            <h2>1. Information We Collect</h2>
            
            <h3>1.1 Personal Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and password</li>
              <li><strong>Profile Information:</strong> Country, phone number (optional), currency preference</li>
              <li><strong>Authentication Data:</strong> Firebase Authentication tokens and identifiers</li>
            </ul>

            <h3>1.2 Financial Information</h3>
            <p>To provide our core services, we collect:</p>
            <ul>
              <li><strong>Income Data:</strong> Salary, freelance income, investment returns, and other earnings</li>
              <li><strong>Expense Data:</strong> Purchases, bills, subscriptions, and daily spending</li>
              <li><strong>Budget Information:</strong> Budget categories, limits, and targets</li>
              <li><strong>Debt Information:</strong> Loans, credit card balances, and repayment plans</li>
              <li><strong>Business Data (Pro/Lifetime users):</strong> Business income, expenses, invoices, quotations</li>
              <li><strong>Financial Goals:</strong> Savings targets, investment goals, and timelines</li>
            </ul>

            <h3>1.3 Technical Information</h3>
            <p>We automatically collect:</p>
            <ul>
              <li><strong>Device Information:</strong> Device type, operating system, browser type</li>
              <li><strong>Usage Data:</strong> Features used, time spent, pages visited</li>
              <li><strong>Performance Data:</strong> Crash reports, error logs, and performance metrics</li>
              <li><strong>Location Data:</strong> Only country-level data for currency and regional settings</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>2. How We Use Your Information</h2>
            
            <div className="usage-grid">
              <div className="usage-card">
                <div className="usage-icon">📊</div>
                <h3>Service Delivery</h3>
                <ul>
                  <li>Provide personalized financial insights</li>
                  <li>Calculate budgets and spending patterns</li>
                  <li>Generate financial reports and analytics</li>
                  <li>Send notifications and reminders</li>
                </ul>
              </div>

              <div className="usage-card">
                <div className="usage-icon">🔒</div>
                <h3>Security & Maintenance</h3>
                <ul>
                  <li>Authenticate user access</li>
                  <li>Prevent fraud and unauthorized access</li>
                  <li>Debug and fix technical issues</li>
                  <li>Ensure service availability</li>
                </ul>
              </div>

              <div className="usage-card">
                <div className="usage-icon">🚀</div>
                <h3>Improvement & Development</h3>
                <ul>
                  <li>Analyze usage patterns</li>
                  <li>Develop new features</li>
                  <li>Improve user experience</li>
                  <li>Test new functionality</li>
                </ul>
              </div>

              <div className="usage-card">
                <div className="usage-icon">📧</div>
                <h3>Communication</h3>
                <ul>
                  <li>Send service updates</li>
                  <li>Provide customer support</li>
                  <li>Share important notices</li>
                  <li>Send promotional offers (with consent)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="privacy-section">
            <h2>3. Data Storage & Security</h2>
            
            <h3>3.1 Data Storage</h3>
            <p>Your data is stored in multiple secure locations:</p>
            <ul>
              <li><strong>Firebase Firestore:</strong> Primary storage for all user data with automatic backups</li>
              <li><strong>Local Storage:</strong> Device storage for offline access and performance</li>
              <li><strong>Firebase Authentication:</strong> Secure authentication service</li>
              <li><strong>Encrypted Backups:</strong> Regular encrypted backups for disaster recovery</li>
            </ul>

            <h3>3.2 Security Measures</h3>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li><strong>Encryption:</strong> All data encrypted at rest and in transit (256-bit SSL/TLS)</li>
              <li><strong>Access Controls:</strong> Strict role-based access to sensitive data</li>
              <li><strong>Firewall Protection:</strong> Network security and intrusion detection</li>
              <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
              <li><strong>Authentication:</strong> Secure password hashing and multi-factor authentication support</li>
            </ul>

            <h3>3.3 Data Retention</h3>
            <p>We retain your data for as long as your account is active:</p>
            <ul>
              <li><strong>Active Accounts:</strong> Data retained indefinitely</li>
              <li><strong>Inactive Accounts:</strong> Data retained for 3 years after last login</li>
              <li><strong>Deleted Accounts:</strong> Data permanently deleted within 30 days</li>
              <li><strong>Export Option:</strong> You can export all your data before deletion</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Data Sharing & Disclosure</h2>
            
            <p>We do not sell, trade, or rent your personal information to third parties. We only share data when necessary:</p>
            
            <h3>4.1 Service Providers</h3>
            <p>We work with trusted third-party providers:</p>
            <ul>
              <li><strong>Google Firebase:</strong> Cloud infrastructure and authentication</li>
              <li><strong>Payment Processors:</strong> For subscription payments (Stripe, PayPal)</li>
              <li><strong>Analytics Services:</strong> For understanding usage patterns (Google Analytics)</li>
              <li><strong>Support Services:</strong> Customer support and communication tools</li>
            </ul>

            <h3>4.2 Legal Requirements</h3>
            <p>We may disclose your information when required by law:</p>
            <ul>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and property</li>
              <li>To prevent fraud or security issues</li>
              <li>To protect the safety of our users</li>
            </ul>

            <h3>4.3 Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
          </section>

          <section className="privacy-section">
            <h2>5. Your Rights & Choices</h2>
            
            <div className="rights-grid">
              <div className="right-card">
                <div className="right-icon">👁️</div>
                <h3>Right to Access</h3>
                <p>View all personal data we store about you through your account settings.</p>
              </div>

              <div className="right-card">
                <div className="right-icon">✏️</div>
                <h3>Right to Correct</h3>
                <p>Update or correct inaccurate information in your profile at any time.</p>
              </div>

              <div className="right-card">
                <div className="right-icon">📥</div>
                <h3>Right to Export</h3>
                <p>Download all your data in JSON format from the Settings page.</p>
              </div>

              <div className="right-card">
                <div className="right-icon">🗑️</div>
                <h3>Right to Delete</h3>
                <p>Permanently delete your account and all associated data.</p>
              </div>

              <div className="right-card">
                <div className="right-icon">🔕</div>
                <h3>Right to Opt-Out</h3>
                <p>Control notification preferences and marketing communications.</p>
              </div>

              <div className="right-card">
                <div className="right-icon">📧</div>
                <h3>Right to Complain</h3>
                <p>Contact us with privacy concerns at BudgetProo@gmail.com</p>
              </div>
            </div>
          </section>

          <section className="privacy-section">
            <h2>6. Children's Privacy</h2>
            <p>
              BudgetPro is not intended for children under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and believe your child has provided 
              us with personal information, please contact us immediately at BudgetProo@gmail.com.
            </p>
          </section>

          <section className="privacy-section">
            <h2>7. International Data Transfers</h2>
            <p>
              BudgetPro uses cloud services that may store data in various locations worldwide. When we transfer your 
              data outside your country of residence, we ensure appropriate safeguards are in place to protect your 
              information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. When we make changes, we will update the "Last updated" 
              date at the top of this page. Significant changes will be communicated via email or in-app notification. 
              Your continued use of BudgetPro after any changes indicates your acceptance of the updated policy.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Contact Information</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
            
            <div className="contact-details">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <div>
                  <strong>Email:</strong>
                  <p>BudgetProo@gmail.com</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-icon">📞</div>
                <div>
                  <strong>Support:</strong>
                  <p>BudgetProo@gmail.com</p>
                </div>
              </div>
            </div>
          </section>

          <div className="privacy-acceptance">
            <p>
              By using BudgetPro, you acknowledge that you have read, understood, and agree to the collection, 
              use, and disclosure of your information as described in this Privacy Policy.
            </p>
            <p className="signature">
              <strong>The BudgetPro Team</strong><br />
              <em>Protecting your privacy is our priority</em>
            </p>
          </div>
        </div>

        <div className="privacy-actions">
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