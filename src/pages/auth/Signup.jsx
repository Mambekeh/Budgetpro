import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { getCurrencyFromCountry } from "../../utils/currencyUtils";
import "./Signup.css";
import { ensureUserDoc } from "../../utils/ensureUserDoc";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config.js";


// Country list - comprehensive alphabetical list
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "", // Changed from currency to country
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const { signup, currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.country) {
      return "All fields are required";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      return "You must agree to the Terms & Conditions and Privacy Policy";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Derive currency from country using existing utility (LOCKED behavior)
      const derivedCurrency = getCurrencyFromCountry(formData.country);

      const result = await signup(
        formData.email,
        formData.password,
        formData.name
      );

      if (!result.success) {
        let userFriendlyError = "Failed to create account";
        if (result.error?.includes("email-already-in-use")) {
          userFriendlyError = "Email already registered. Please sign in.";
        } else if (result.error?.includes("weak-password")) {
          userFriendlyError = "Password is too weak. Please choose a stronger password.";
        }
        setError(userFriendlyError);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // ✅ FIXED: Only use ensureUserDoc - it creates the complete document
      await ensureUserDoc({
        uid: result.user.uid,
        email: result.user.email,
        signupName: formData.name,
        signupCountry: formData.country,
      });

      // ✅ REMOVED: The duplicate setDoc that was overwriting the document
      // ❌ REMOVE THIS ENTIRE SECTION:
      // const userDocRef = doc(db, "users", result.user.uid);
      // await setDoc(userDocRef, {
      //   hasUpgradedBefore: false,
      //   plan: "free"
      // }, { merge: true });

      // Store all three fields as required (keep your existing logic)
      await updateUserProfile({
        signupCountry: formData.country,      // immutable
        displayCountry: formData.country,     // initially same as signupCountry
        displayCurrency: derivedCurrency,     // derived from country
      });

      // Also update localStorage to maintain compatibility with existing dashboard
      localStorage.setItem("bp_currency", derivedCurrency);
      localStorage.setItem("budgetPro_plan", "free");

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left Panel - White & Blue Gradient */}
        <div className="signup-left-panel">
          <div className="brand-showcase">
            <div className="brand-logo">
              <div className="logo-icon">
                <span>BP</span>
              </div>
              <div className="brand-text">
                <h1 className="brand-name">BudgetPro</h1>
                <p className="brand-tagline-short">Your Financial Coach</p>
              </div>
            </div>
            
            <div className="brand-description">
              <p className="brand-description-text">
                Track every dollar, master your budget, and build wealth smarter.
              </p>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h4 className="feature-title">Track Everything</h4>
                  <p className="feature-description">Monitor all income, spending, and debts in one place</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">👁️</div>
                <div className="feature-text">
                  <h4 className="feature-title">Clear Insights</h4>
                  <p className="feature-description">See exactly where your money goes every month</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">
                  <h4 className="feature-title">Achieve Goals</h4>
                  <p className="feature-description">Set and track financial goals with instant progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Signup Form */}
        <div className="signup-right-panel">
          <div className={`signup-card ${shake ? 'shake' : ''}`}>
            <div className="card-header">
              <div className="welcome-icon">🚀</div>
              <h2 className="card-title">Start Your Journey</h2>
              <p className="card-subtitle">Create your account to get started</p>
            </div>

            <div className="signup-card-content">
              {error && (
                <div className="signup-error-message">
                  <div className="error-icon">⚠️</div>
                  <span className="error-text">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password *
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password *
                  </label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input"
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {/* REPLACED: Currency selector with Country selector */}
                <div className="form-group">
                  <label htmlFor="country" className="form-label">
                    Country *
                  </label>
                  <div className="form-select-wrapper">
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-select"
                      required
                    >
                      <option value="">Select your country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {/* Dropdown arrow */}
                    <div className="form-select-arrow">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      disabled={loading}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => navigate('/terms')}
                        className="terms-link-button"
                        tabIndex="0"
                      >
                        Terms & Conditions
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => navigate('/privacy')}
                        className="terms-link-button"
                        tabIndex="0"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className={`signup-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <span className="btn-icon">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="signup-divider">
                <span className="divider-text">Already have an account?</span>
              </div>

              <div className="alternative-action">
                <Link to="/login" className="alternative-link">
                  <span className="link-icon">←</span>
                  <span>Sign in to existing account</span>
                </Link>
              </div>

              <div className="signup-footer">
                <div className="security-badge">
                  <span className="lock-icon">🔒</span>
                  <span>Your data is securely protected with 256-bit encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}