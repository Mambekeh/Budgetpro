// src/pages/auth/LandingPage.jsx - UPDATED WITH SUBSCRIPTION STATEMENT
import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp">
      {/* Top Nav */}
      <header className="lp-nav">
        <div className="lp-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
          <div className="lp-logo" aria-hidden="true">BP</div>
          <div className="lp-brand-text">
            <div className="lp-brand-name">BudgetPro</div>
            <div className="lp-brand-tag">Your Financial Coach</div>
          </div>
        </div>

        <nav className="lp-nav-actions" aria-label="Primary">
          <button className="lp-btn lp-btn-ghost" onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate("/signup")}>
            Get Started Free
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="lp-main">
        <section className="lp-hero" aria-label="Hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-left">
              <div className="lp-pill">
                Simple • Calm • Built for real life
              </div>

              <h1 className="lp-title">
                Clarity for your money,
                <span className="lp-title-accent"> every month</span>.
              </h1>

              <p className="lp-subtitle">
                BudgetPro helps you clearly understand where your money is going, so you can
                plan ahead, make confident decisions, and save more — in a way that fits your life.
              </p>

              <div className="lp-hero-ctas">
                <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate("/signup")}>
                  Create Free Account
                </button>
                <button className="lp-btn lp-btn-outline lp-btn-lg" onClick={() => navigate("/login")}>
                  Log In
                </button>
              </div>

              <p className="lp-note">
                No pressure. No complicated setup. Just clear insight and guidance.
              </p>

              <div className="lp-trust">
                <div className="lp-trust-item">
                  <span className="lp-dot" aria-hidden="true" />
                  Private accounts
                </div>
                <div className="lp-trust-item">
                  <span className="lp-dot" aria-hidden="true" />
                  Simple dashboard
                </div>
                <div className="lp-trust-item">
                  <span className="lp-dot" aria-hidden="true" />
                  Personal & business
                </div>
              </div>
              
              {/* SUBSCRIPTION STATEMENT ADDED HERE */}
              <div className="lp-subscription-statement">
                BudgetPro offers Free, Basic, Professional, and Lifetime plans. Payments are processed securely.
              </div>
            </div>

            <div className="lp-hero-right" aria-label="Preview card">
              <div className="lp-card">
                <div className="lp-card-top">
                  <div className="lp-card-title">What you gain</div>
                  <div className="lp-card-badge">In minutes</div>
                </div>

                <div className="lp-card-grid">
                  <div className="lp-mini">
                    <div className="lp-mini-icon" aria-hidden="true">👀</div>
                    <div className="lp-mini-title">Visibility</div>
                    <div className="lp-mini-text">See where your money goes with clarity.</div>
                  </div>

                  <div className="lp-mini">
                    <div className="lp-mini-icon" aria-hidden="true">🧭</div>
                    <div className="lp-mini-title">Direction</div>
                    <div className="lp-mini-text">Plan this month with intention.</div>
                  </div>

                  <div className="lp-mini">
                    <div className="lp-mini-icon" aria-hidden="true">💡</div>
                    <div className="lp-mini-title">Better habits</div>
                    <div className="lp-mini-text">Small improvements become obvious.</div>
                  </div>

                  <div className="lp-mini">
                    <div className="lp-mini-icon" aria-hidden="true">🎯</div>
                    <div className="lp-mini-title">Progress</div>
                    <div className="lp-mini-text">Stay aligned with your goals.</div>
                  </div>
                </div>

                <div className="lp-card-bottom">
                  <div className="lp-card-line" />
                  <div className="lp-card-bottom-text">
                    When you understand your money clearly, better decisions follow naturally.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave */}
          <div className="lp-wave" aria-hidden="true" />
        </section>

        {/* Outcomes */}
        <section className="lp-section" aria-label="Outcomes">
          <div className="lp-container">
            <h2 className="lp-h2">Turn awareness into savings — naturally</h2>
            <p className="lp-p">
              BudgetPro doesn’t judge your spending. It helps you see patterns clearly,
              so you can decide what to keep, what to adjust, and what matters most.
            </p>

            <div className="lp-grid-3">
              <div className="lp-feature">
                <div className="lp-feature-title">Spend with confidence</div>
                <div className="lp-feature-text">
                  Understand your real spending habits so choices feel intentional, not accidental.
                </div>
              </div>

              <div className="lp-feature">
                <div className="lp-feature-title">Plan forward</div>
                <div className="lp-feature-text">
                  Use clarity from the past to plan the month ahead — and keep more money available.
                </div>
              </div>

              <div className="lp-feature">
                <div className="lp-feature-title">Build better habits</div>
                <div className="lp-feature-text">
                  Consistent visibility reinforces smarter decisions over time — without pressure.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-section lp-section-alt" aria-label="How it works">
          <div className="lp-container">
            <h2 className="lp-h2">Simple from the first login</h2>
            <p className="lp-p">
              No complicated setup. You sign up, open your dashboard, and start tracking.
            </p>

            <div className="lp-steps">
              <div className="lp-step">
                <div className="lp-step-num">1</div>
                <div className="lp-step-body">
                  <div className="lp-step-title">Create your account</div>
                  <div className="lp-step-text">Start free in seconds.</div>
                </div>
              </div>

              <div className="lp-step">
                <div className="lp-step-num">2</div>
                <div className="lp-step-body">
                  <div className="lp-step-title">Open your dashboard</div>
                  <div className="lp-step-text">See your financial picture in one place.</div>
                </div>
              </div>

              <div className="lp-step">
                <div className="lp-step-num">3</div>
                <div className="lp-step-body">
                  <div className="lp-step-title">Make smarter decisions</div>
                  <div className="lp-step-text">Use clarity to plan, save, and stay consistent.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it’s for */}
        <section className="lp-section" aria-label="Who it's for">
          <div className="lp-container">
            <h2 className="lp-h2">Built for real people and real businesses</h2>
            <p className="lp-p">
              Whether you earn a salary, run a business, freelance, or work with cash — BudgetPro fits.
            </p>

            <div className="lp-grid-3">
              <div className="lp-persona">
                <div className="lp-persona-title">Individuals</div>
                <div className="lp-persona-text">Manage daily expenses, saving, and monthly clarity.</div>
              </div>
              <div className="lp-persona">
                <div className="lp-persona-title">Freelancers</div>
                <div className="lp-persona-text">Stay on top of cash flow without spreadsheets.</div>
              </div>
              <div className="lp-persona">
                <div className="lp-persona-title">Small businesses</div>
                <div className="lp-persona-text">Track income, expenses, and understand profitability.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="lp-cta" aria-label="Call to action">
          <div className="lp-container lp-cta-inner">
            <div>
              <h2 className="lp-cta-title">Start seeing your money clearly today</h2>
              <p className="lp-cta-text">
                Create your free account and get clarity in minutes.
              </p>
            </div>

            <div className="lp-cta-actions">
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate("/signup")}>
                Get Started Free
              </button>
              <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={() => navigate("/login")}>
                Log In
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer" aria-label="Footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-left">
            <div className="lp-footer-brand">
              <span className="lp-footer-logo" aria-hidden="true">BP</span>
              <span className="lp-footer-name">BudgetPro</span>
            </div>
            <div className="lp-footer-copy">© {new Date().getFullYear()} BudgetPro. All rights reserved.</div>
            {/* ADDED SECOND SUBSCRIPTION STATEMENT IN FOOTER FOR VISIBILITY */}
            <div className="lp-footer-subscription">
              BudgetPro offers Free, Basic, Professional, and Lifetime plans. Payments are processed securely.
            </div>
          </div>

          <div className="lp-footer-links">
            <button className="lp-link" onClick={() => navigate("/terms")}>Terms</button>
            <button className="lp-link" onClick={() => navigate("/privacy")}>Privacy</button>
            <button className="lp-link" onClick={() => navigate("/upgrade")}>Plans & Pricing</button>
          </div>
        </div>
      </footer>
    </div>
  );
}