import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import './Login.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
    
    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
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
    if (!formData.email || !formData.password) {
      return "Email and password are required";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
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
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        let userFriendlyError = "Login failed";
        if (
          result.error?.includes("user-not-found") ||
          result.error?.includes("wrong-password")
        ) {
          userFriendlyError = "Invalid email or password";
        } else if (result.error?.includes("network-request-failed")) {
          userFriendlyError = "Network error. Please check your connection";
        }
        setError(userFriendlyError);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Handle remember me
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

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

  const handleForgotPassword = () => {
    alert("Forgot password feature coming soon!");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Panel - White & Blue Gradient */}
        <div className="login-left-panel">
          <div className="brand-showcase">
            <div className="brand-logo">
              <div className="logo-icon">
                <span>BP</span>
              </div>
              <div className="brand-text">
                <h1 className="brand-name">BudgetPro</h1>
                <p className="brand-tagline-short">Take Control of Your Finances</p>
              </div>
            </div>
            
            <div className="brand-description">
              <p className="brand-description-text">
                Smart budgeting, powerful insights, and financial freedom in one place.
              </p>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h4 className="feature-title">Real-time Analytics</h4>
                  <p className="feature-description">Track expenses and income with live updates</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">
                  <h4 className="feature-title">Goal Tracking</h4>
                  <p className="feature-description">Set and achieve financial goals faster</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <h4 className="feature-title">Bank-level Security</h4>
                  <p className="feature-description">Your data is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right-panel">
          <div className={`login-card ${shake ? 'shake' : ''}`}>
            <div className="card-header">
              <div className="welcome-icon">👋</div>
              <h2 className="card-title">Welcome Back</h2>
              <p className="card-subtitle">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="login-error-message">
                <div className="error-icon">⚠️</div>
                <span className="error-text">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
                <div className="forgot-password-container">
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={loading}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Remember me for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                className={`login-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="btn-icon">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="login-divider">
              <span className="divider-text">Don't have an account?</span>
            </div>

            <div className="alternative-action">
              <Link to="/signup" className="alternative-link">
                <span>Create a new account</span>
                <span className="link-icon">→</span>
              </Link>
            </div>

            <div className="login-footer">
              <div className="security-badge">
                <span className="lock-icon">🔒</span>
                <span>Your data is securely protected with 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}