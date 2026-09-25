import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccountTypeSwitcher from "../components/account/AccountTypeSwitcher.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  
  const userDropdownRef = useRef(null);
  const userIconRef = useRef(null);
  const notificationRef = useRef(null);

  if (!currentUser) return null;

  /* ===============================
     🔐 SOURCE OF TRUTH
     =============================== */
  const plan = currentUser.plan || "free";
  const hasBusinessAccess = plan === "pro" || plan === "lifetime";

  // ✅ MODE IS DERIVED FROM ROUTE (NOT localStorage)
  const isBusinessMode = location.pathname.startsWith("/business");

  /* ===============================
     EFFECTS
     =============================== */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown
      if (
        userDropdownRef.current && 
        !userDropdownRef.current.contains(event.target) &&
        userIconRef.current &&
        !userIconRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }

      // Close notification dropdown
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !event.target.closest('.bell-icon')
      ) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ===============================
     ACTIONS
     =============================== */
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    setNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    setUserDropdownOpen(false);
  };

  const closeUserDropdown = () => {
    setUserDropdownOpen(false);
  };

  const handleSupportClick = () => {
    window.open("mailto:Budgetproo@gmail.com?subject=Support Request", "_blank");
  };

  const handleFeedbackClick = () => {
    window.open("mailto:Budgetproo@gmail.com?subject=Feedback", "_blank");
  };

  /* ===============================
     PLAN BADGE STYLE
     =============================== */
  const getPlanBadgeStyle = () => {
    switch (plan) {
      case "basic":
        return { background: "linear-gradient(135deg,#3498db,#2980b9)", color: "#fff" };
      case "pro":
        return { background: "linear-gradient(135deg,#9b59b6,#8e44ad)", color: "#fff" };
      case "lifetime":
        return { background: "linear-gradient(135deg,#f39c12,#d35400)", color: "#fff" };
      default:
        return { background: "linear-gradient(135deg,#95a5a6,#7f8c8d)", color: "#fff" };
    }
  };

  const planBadgeStyle = getPlanBadgeStyle();

  /* ===============================
     RENDER
     =============================== */
  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
<div className="nav-logo">
  <NavLink
    to={isBusinessMode ? "/business" : "/dashboard"}
    className="logo-link"
  >
    <img
      src="/budgetpro-logo.png"
      alt="BudgetPro"
      className="logo-image"
    />
    <div className="logo-tagline">Earn • Track • Clarity</div>
  </NavLink>
</div>


          {/* TABS */}
          <div className="nav-tabs-container">
            <div className="nav-tabs">
              {isBusinessMode && hasBusinessAccess ? (
                <>
                  <NavLink to="/business" end className="nav-tab">Dashboard</NavLink>
                  <NavLink to="/business/income" className="nav-tab">Income</NavLink>
                  <NavLink to="/business/expenses" className="nav-tab">Expenses</NavLink>
                  <NavLink to="/business/quotations" className="nav-tab">Quotations</NavLink>
                  <NavLink to="/business/invoices" className="nav-tab">Invoices</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard" end className="nav-tab">Dashboard</NavLink>
                  <NavLink to="/analytics" className="nav-tab">Insights</NavLink>
                  <NavLink to="/debt-tracker" className="nav-tab">Debt Tracker</NavLink>
                  <NavLink to="/goals" className="nav-tab">Goals</NavLink>
                  <NavLink to="/upgrade" className="nav-tab">Upgrade</NavLink>
                  <NavLink to="/settings" className="nav-tab">Settings</NavLink>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="nav-right">
            {isMobile ? (
              <>
                <div className="plan-badge-mobile" style={planBadgeStyle}>
                  {plan.toUpperCase()}
                </div>
                <button
                  className="mobile-menu-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </button>
              </>
            ) : (
              <div className="desktop-right">
                <div className="plan-badge" style={planBadgeStyle}>
                  {plan.toUpperCase()}
                </div>
                <div className="icon-container">
                  <div className="notification-container" ref={notificationRef}>
                    <button 
                      className="icon-btn bell-icon" 
                      aria-label="Notifications"
                      onClick={toggleNotificationDropdown}
                    >
                      🔔
                      {notificationDropdownOpen && (
                        <div className="notification-dropdown">
                          <div className="notification-empty">
                            No notifications yet
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="user-dropdown-container" ref={userDropdownRef}>
                    <button 
                      className="icon-btn user-icon" 
                      aria-label="User menu"
                      onClick={toggleUserDropdown}
                      ref={userIconRef}
                    >
                      <svg className="profile-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </button>
                    {userDropdownOpen && (
                      <div className="user-dropdown">
                        <div className="dropdown-email">{currentUser.email}</div>
                        
                        <div className="dropdown-divider"></div>
                        
                        {/* ACCOUNT SWITCHER */}
                        <div className="dropdown-switcher-container">
                          <div className="dropdown-switcher-label">Switch Account:</div>
                          <AccountTypeSwitcher
                            accountType={localStorage.getItem("accountType") || "personal"}
                            showIcons={true}
                            onSwitch={closeUserDropdown}
                          />
                        </div>

                        <div className="dropdown-divider"></div>
                        
                        {/* SUPPORT & FEEDBACK */}
                        <button className="dropdown-item support-link" onClick={handleSupportClick}>
                          <span className="dropdown-item-icon">💬</span> Support
                        </button>
                        <button className="dropdown-item feedback-link" onClick={handleFeedbackClick}>
                          <span className="dropdown-item-icon">📝</span> Feedback
                        </button>
                        
                        <div className="dropdown-divider"></div>
                        
                        {/* LOGOUT */}
                        <button className="dropdown-item logout-dropdown" onClick={handleLogout}>
                          <span className="dropdown-item-icon">🚪</span> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-header">
              <button
                className="mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="mobile-top-section">
              <div className="mobile-email-container">
                <button 
                  className="mobile-notification-icon-btn"
                  onClick={toggleNotificationDropdown}
                >
                  🔔
                </button>
                <div className="mobile-email">{currentUser.email}</div>
              </div>
            </div>

            <div className="mobile-nav-primary">
              {(isBusinessMode && hasBusinessAccess
                ? [
                    ["/business", "Dashboard"],
                    ["/business/income", "Income"],
                    ["/business/expenses", "Expenses"],
                    ["/business/quotations", "Quotations"],
                    ["/business/invoices", "Invoices"],
                  ]
                : [
                    ["/dashboard", "Dashboard"],
                    ["/analytics", "Insights"],
                    ["/debt-tracker", "Debt Tracker"],
                    ["/goals", "Goals"],
                    ["/settings", "Settings"],
                    ["/upgrade", "Upgrade"],
                  ]
              ).map(([path, label]) => (
                <NavLink
                  key={path}
                  to={path}
                  className="mobile-nav-item"
                  onClick={handleMobileLinkClick}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="mobile-secondary-actions">
              <button className="mobile-link-btn support-link" onClick={() => { handleSupportClick(); setMobileMenuOpen(false); }}>
                Support
              </button>
              <button className="mobile-link-btn feedback-link" onClick={() => { handleFeedbackClick(); setMobileMenuOpen(false); }}>
                Feedback
              </button>
            </div>

            <div className="mobile-bottom-section">
              <div className="mobile-switcher-container">
                <div className="mobile-switcher-label">Switch Account:</div>
                <AccountTypeSwitcher
                  accountType={localStorage.getItem("accountType") || "personal"}
                  showIcons={true}
                  onSwitch={() => setMobileMenuOpen(false)}
                  compact={true}
                />
              </div>
              
              <button className="mobile-logout-btn" onClick={handleLogout}>
                <span className="mobile-logout-icon">🚪</span> Logout
              </button>
            </div>
            
            {/* Mobile Notification Dropdown */}
            {notificationDropdownOpen && (
              <div className="mobile-notification-dropdown">
                <div className="notification-empty">
                  No notifications yet
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}