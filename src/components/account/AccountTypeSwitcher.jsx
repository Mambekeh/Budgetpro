import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AccountTypeSwitcher.css";

export default function AccountTypeSwitcher() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const plan = currentUser.plan || "free";
  const hasBusinessAccess = plan === "pro" || plan === "lifetime";

  // Infer current account from URL
  const isBusiness = window.location.pathname.startsWith("/business");
  const currentAccount = isBusiness ? "business" : "personal";

  const handleSwitch = (type) => {
    setOpen(false);

    if (type === currentAccount) return;

    if (type === "business" && !hasBusinessAccess) {
      setShowUpgradeModal(true);
      return;
    }

    navigate(type === "business" ? "/business" : "/dashboard");
  };

  return (
    <>
      {/* SWITCH BUTTON */}
      <div className="account-switcher" ref={dropdownRef}>
        <button
          className="account-switcher-btn"
          onClick={() => setOpen(!open)}
          aria-label={`Switch account, currently in ${currentAccount} mode`}
          aria-expanded={open}
        >
          {currentAccount === "personal" ? (
            <>
              <span className="account-icon">👤</span>
              <span className="account-label">Personal</span>
            </>
          ) : (
            <>
              <span className="account-icon">🏢</span>
              <span className="account-label">Business</span>
            </>
          )}
          <span className="caret">▾</span>
        </button>

        {open && (
          <div className="account-switcher-dropdown" role="menu">
            <button
              className={`account-option ${
                currentAccount === "personal" ? "active" : ""
              }`}
              onClick={() => handleSwitch("personal")}
              role="menuitem"
              aria-disabled={currentAccount === "personal"}
            >
              <span className="option-icon">👤</span>
              <div className="option-content">
                <span className="option-label">Personal</span>
                {currentAccount === "personal" && (
                  <span className="option-status">Current</span>
                )}
              </div>
            </button>

            <div className="dropdown-divider"></div>

            <button
              className={`account-option ${
                currentAccount === "business" ? "active" : ""
              }`}
              onClick={() => handleSwitch("business")}
              role="menuitem"
              aria-disabled={currentAccount === "business"}
            >
              <span className="option-icon">🏢</span>
              <div className="option-content">
                <span className="option-label">Business</span>
                {currentAccount === "business" ? (
                  <span className="option-status">Current</span>
                ) : !hasBusinessAccess ? (
                  <span className="option-badge">Premium</span>
                ) : null}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="upgrade-modal-overlay">
          <div className="upgrade-modal" role="dialog" aria-modal="true">
            <div className="modal-icon">🏢</div>
            <h2 className="modal-title">Business Mode Locked</h2>
            <p className="modal-subtitle">
              Upgrade to Professional or Lifetime plan
            </p>
            
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span className="feature-text">Business performance dashboard</span>
              </div>
              
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span className="feature-text">Track all business income</span>
              </div>
              
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span className="feature-text">Monitor business expenses</span>
              </div>
              
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span className="feature-text">Professional quotations</span>
              </div>
              
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span className="feature-text">Client invoicing & payments</span>
              </div>
            </div>

            <div className="upgrade-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowUpgradeModal(false)}
              >
                Not Now
              </button>
              <button
                className="btn-upgrade"
                onClick={() => navigate("/upgrade")}
              >
                Upgrade to Professional
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}