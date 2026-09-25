import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCountryPricing } from "../../utils/currencyUtils";
import { getZARChargeAmount } from "../../utils/zarChargeMap";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import "./Upgrade.css";

export default function Upgrade() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // If plan missing (because user doc missing field), treat as free
  const currentPlan = currentUser?.plan || "free";
  
  // Get user's country from localStorage (set by Settings), Firestore, or default
  const userCountry = localStorage.getItem('bp_country') || 
                     currentUser?.signupCountry || 
                     currentUser?.displayCountry || 
                     "South Africa";
  
  // State for pricing plans
  const [plans, setPlans] = useState(() => {
    const countryPricing = getCountryPricing(userCountry);
    return {
      basic: {
        name: "Basic",
        price: countryPricing.basic.price,
        rawAmount: countryPricing.basic.amount,
        currency: countryPricing.basic.currency,
        period: "per month",
        description: "Perfect for personal finance management",
        features: [
          "✅ Unlimited income tracking",
          "✅ Unlimited expense tracking",
          "✅ Goal setting",
          "✅ Recurring budgets",
          "✅ Advanced charts & analytics",
          "✅ Export to PDF",
          "❌ Business Mode",
          "❌ Debt payoff strategies",
          "❌ Budget alerts & reminders"
        ],
        buttonText: "Upgrade to Basic",
        level: 1
      },
      pro: {
        name: "Professional",
        price: countryPricing.pro.price,
        rawAmount: countryPricing.pro.amount,
        currency: countryPricing.pro.currency,
        period: "per month",
        description: "Complete financial toolkit for power users",
        popular: true,
        features: [
          "✅ Everything in Basic",
          "✅ Business Mode (Quotations & Invoices)",
          "✅ Debt Pay-Off Strategies",
          "✅ Bill Payment Reminders",
          "✅ Collaborative Budgeting (2 users)",
          "✅ Budget Category Limits & Alerts",
          "✅ Priority Email Support",
          "✅ Early Access to New Features"
        ],
        buttonText: "Upgrade to Professional",
        level: 2
      },
      lifetime: {
        name: "Lifetime",
        price: countryPricing.lifetime.price,
        rawAmount: countryPricing.lifetime.amount,
        currency: countryPricing.lifetime.currency,
        period: "once-off",
        description: "Pay once, own BudgetPro forever",
        lifetime: true,
        features: [
          "✅ Everything in Professional",
          "✅ Lifetime access (no monthly fees)",
          "✅ All future updates included",
          "✅ Lifetime priority support",
          "✅ One-time payment only",
          "✅ No renewal, no contracts",
          "✅ Forever updates",
          "✅ Best long-term value"
        ],
        buttonText: "Upgrade to Lifetime",
        level: 3
      }
    };
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState({ 
    success: false, 
    message: "", 
    details: "",
    reference: "",
    plan: "",
    verifiedPlan: "",
    amountPaid: 0
  });

  // ✅ ADDED: Function to set hasUpgradedBefore flag
  const ensureUpgradedFlag = async () => {
    try {
      if (!currentUser?.uid) return;
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.hasUpgradedBefore) {
          await updateDoc(userDocRef, {
            hasUpgradedBefore: true,
            firstUpgradeAttempt: new Date().toISOString(),
            attemptPlan: selectedPlan
          });
          console.log('✅ User marked as "has attempted upgrade"');
        }
      }
    } catch (error) {
      console.error('Error ensuring upgraded flag:', error);
    }
  };

  // Listen for country changes from Settings
  useEffect(() => {
    const handleCountryChange = (event) => {
      if (event.detail && event.detail.country) {
        // Update userCountry from localStorage (more reliable)
        const newCountry = localStorage.getItem('bp_country') || event.detail.country;
        const newPricing = getCountryPricing(newCountry);
        
        // Update plan prices
        setPlans({
          basic: {
            ...plans.basic,
            price: newPricing.basic.price,
            rawAmount: newPricing.basic.amount,
            currency: newPricing.basic.currency
          },
          pro: {
            ...plans.pro,
            price: newPricing.pro.price,
            rawAmount: newPricing.pro.amount,
            currency: newPricing.pro.currency
          },
          lifetime: {
            ...plans.lifetime,
            price: newPricing.lifetime.price,
            rawAmount: newPricing.lifetime.amount,
            currency: newPricing.lifetime.currency
          }
        });
      }
    };

    window.addEventListener('countryChanged', handleCountryChange);
    
    return () => {
      window.removeEventListener('countryChanged', handleCountryChange);
    };
  }, [plans]);

  const planLevels = { free: 0, basic: 1, pro: 2, lifetime: 3 };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setToastType("success");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const showErrorToast = (message) => {
    setToastMessage(message);
    setToastType("error");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const getButtonText = (planKey) => {
    const currentLevel = planLevels[currentPlan];
    const targetLevel = planLevels[planKey];

    if (currentPlan === planKey) return "Current Plan";
    if (planKey === "free") return "Downgrade Not Allowed";

    if (currentPlan === "free") return `Upgrade to ${plans[planKey].name}`;
    if (targetLevel > currentLevel) return `Upgrade to ${plans[planKey].name}`;
    if (currentPlan === "pro" && planKey === "basic") return "Downgrade to Basic";

    return plans[planKey].buttonText;
  };

  const isButtonDisabled = (planKey) => {
    if (currentPlan === planKey) return true;
    if (planKey === "free") return true;
    if (currentPlan === "basic" && planLevels[planKey] < planLevels[currentPlan]) return true;
    if (currentPlan === "lifetime") return true;
    return false;
  };

  const getPlanCardClass = (planKey) => {
    const classes = ["plan-card"];
    if (plans[planKey].popular) classes.push("popular-plan");
    if (plans[planKey].lifetime) classes.push("lifetime-plan");
    return classes.join(" ");
  };

  const getButtonClass = (planKey) => {
    const classes = ["plan-button"];
    if (isButtonDisabled(planKey)) return [...classes, "disabled-button"].join(" ");

    const currentLevel = planLevels[currentPlan];
    const targetLevel = planLevels[planKey];

    if (currentPlan === "free") return [...classes, "upgrade-button"].join(" ");
    if (targetLevel > currentLevel) return [...classes, "upgrade-button"].join(" ");
    if (currentPlan === "pro" && planKey === "basic") return [...classes, "downgrade-button"].join(" ");

    return [...classes, "disabled-button"].join(" ");
  };

  // ✅ UPDATED: Added async and ensureUpgradedFlag call
  const handlePlanButtonClick = async (planKey) => {
    if (isButtonDisabled(planKey)) {
      if (planKey === "free") {
        showErrorToast("Downgrading to Free plan is not available");
      }
      return;
    }

    const currentLevel = planLevels[currentPlan];
    const targetLevel = planLevels[planKey];

    // Downgrade case (pro -> basic) - SHOW MODAL
    if (currentPlan === "pro" && planKey === "basic") {
      setShowDowngradeModal(true);
      return;
    }

    // Upgrade case - show confirmation modal
    if (targetLevel > currentLevel) {
      // ✅ CRITICAL: Set hasUpgradedBefore flag BEFORE showing modal
      await ensureUpgradedFlag();
      setSelectedPlan(planKey);
      setShowConfirmModal(true);
      return;
    }
  };

  // Separate function to verify payment with server - UPDATED
  const verifyPaymentWithServer = async (reference, planKey) => {
    try {
      console.log('🔍 Verifying payment with server...', reference);
      
      // Call our secure verification endpoint
      const verifyResponse = await fetch('/.netlify/functions/paystack-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });
      
      const result = await verifyResponse.json();
      console.log('🔍 Verification result:', result);
      
      if (result.ok) {
        // SUCCESS: Server verified and updated Firestore
        setPaymentResult({
          success: true,
          message: result.message || "Payment verified and plan activated!",
          details: "",
          reference: reference,
          plan: planKey,
          verifiedPlan: result.plan || planKey,
          amountPaid: result.amountPaid || getZARChargeAmount(userCountry, planKey)/100
        });
        
        // Update localStorage immediately for UI
        localStorage.setItem('budgetPro_plan', result.plan || planKey);
        
        // ✅ UPDATE hasUpgradedBefore FLAG TO TRUE (User has now upgraded for first time)
        try {
          if (currentUser?.uid) {
            // First check if user was previously on free plan (hasUpgradedBefore is false)
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Only update if they're upgrading for the first time (from free)
              if (!userData.hasUpgradedBefore) {
                await updateDoc(userDocRef, {
                  hasUpgradedBefore: true,
                  upgradedAt: new Date().toISOString(),
                  firstUpgradePlan: planKey,
                  firstUpgradeDate: new Date().toISOString()
                });
                console.log('✅ hasUpgradedBefore flag set to true');
              }
            }
          }
        } catch (error) {
          console.error('Error updating hasUpgradedBefore flag:', error);
          // Don't fail the payment if this flag update fails
        }
        
        // Trigger plan refresh event
        window.dispatchEvent(new CustomEvent('planUpdated', { 
          detail: { 
            plan: result.plan || planKey, 
            amount: result.amountPaid || getZARChargeAmount(userCountry, planKey)/100
          } 
        }));
        
        // SHOW SUCCESS MODAL HERE
        setShowResultModal(true);
        
      } else {
        // FAILED: Payment verification failed
        setPaymentResult({
          success: false,
          message: result.error || "Payment verification failed",
          details: result.details || "",
          reference: reference,
          plan: planKey,
          verifiedPlan: "",
          amountPaid: 0
        });
        // SHOW FAILURE MODAL HERE
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('🌐 Network error during verification:', error);
      setPaymentResult({
        success: false,
        message: "Payment Processed",
        details: "Please reload the app to see your plan activated",
        reference: reference,
        plan: planKey,
        verifiedPlan: "",
        amountPaid: 0
      });
      // SHOW RELOAD MODAL
      setShowResultModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Paystack Checkout Function with SECURE VERIFICATION
  const payWithPaystack = (planKey) => {
    if (!currentUser?.email) {
      alert("Please log in to upgrade");
      return;
    }

    // Get display pricing (unchanged - keeps local currency display)
    const plan = plans[planKey];
    const email = currentUser.email;
    const userId = currentUser.uid || "unknown";

    // 🔒 CRITICAL: Get ZAR charge amount (ALWAYS charge in ZAR)
    const amountInZar = getZARChargeAmount(userCountry, planKey);
    
    console.log(`Payment Debug: ${userCountry} | Display: ${plan.price} | Charge: R${(amountInZar/100).toFixed(2)}`);

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

const handler = window.PaystackPop.setup({
  key: paystackKey,
  email: email,
  amount: amountInZar, // ALWAYS in ZAR cents
  currency: "ZAR", // 🔒 ALWAYS ZAR - Paystack requirement
  metadata: {
    plan: planKey,
    userId: userId,
    planName: plan.name,
    timestamp: new Date().toISOString(),
    userCountry: userCountry,
    displayPrice: plan.price,
    displayCurrency: plan.currency,
    chargedCurrency: "ZAR",
    chargedAmount: amountInZar
  },
  callback: function(response) {
    console.log('🎯 Paystack payment successful, reference:', response.reference);

    setIsProcessing(true);

    setPaymentResult({
      success: false,
      message: "Verifying payment...",
      details: "Please wait while we confirm your payment",
      reference: response.reference,
      plan: planKey,
      verifiedPlan: "",
      amountPaid: 0
    });

    setShowResultModal(true);

    verifyPaymentWithServer(response.reference, planKey);
  },
  onClose: function() {
    console.log('Payment modal closed');
    if (!isProcessing) {
      showErrorToast("Payment was cancelled. Please try again.");
    }
  }
});


    handler.openIframe();
  };

  // Function to open email client
  const openSupportEmail = () => {
    const subject = "BudgetPro Support Request";
    const body = `Hello BudgetPro Support,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nMy account email: ${currentUser?.email || "Not logged in"}\n\nThank you.`;
    
    window.location.href = `mailto:budgetproo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Function to open downgrade email
  const openDowngradeEmail = () => {
    const subject = "Plan Downgrade Request - BudgetPro";
    const body = `Hello BudgetPro Support,\n\nI would like to downgrade my plan from Professional to Basic.\n\nMy account email: ${currentUser?.email || "Not logged in"}\n\nPlease assist me with this process.\n\nThank you.`;
    
    window.location.href = `mailto:budgetproo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    setTimeout(() => {
      setShowDowngradeModal(false);
    }, 500);
  };

  // Upgrade Confirmation Modal Component
  const UpgradeConfirmModal = () => {
    if (!selectedPlan) return null;
    
    const plan = plans[selectedPlan];
    
    return (
      <div className="upgrade-confirm-modal-overlay">
        <div className="upgrade-confirm-modal">
          <div className="upgrade-confirm-header">
            <h3 className="upgrade-confirm-title">
              <span>🚀</span> Upgrade to {plan.name}
            </h3>
            <p className="upgrade-confirm-subtitle">
              Confirm your plan selection
            </p>
            {userCountry && (
              <div className="upgrade-country-indicator">
                Pricing for {userCountry}
              </div>
            )}
            {/* Payment Note */}
            <div className="payment-note">
              <small>
                ⚡ Prices shown in your local currency. Charged securely in South African Rand.
              </small>
            </div>
          </div>
          
          <div className="upgrade-confirm-content">
            <div className="upgrade-plan-info">
              <h4 className="upgrade-plan-name">{plan.name} Plan</h4>
              <h2 className="upgrade-plan-price">
                {plan.price}
                <span className="upgrade-plan-period">/{plan.period}</span>
              </h2>
            </div>
            
            {isProcessing ? (
              <div className="upgrade-processing">
                <div className="upgrade-spinner"></div>
                <p>Processing payment...</p>
              </div>
            ) : (
              <>
                <ul className="upgrade-features-list">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="upgrade-feature-item">
                      <span className="upgrade-feature-check">✓</span>
                      <span>{feature.replace("✅ ", "").replace("❌ ", "")}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="upgrade-confirm-actions">
                  <button 
                    className="upgrade-cancel-btn"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setIsProcessing(false);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    className="upgrade-proceed-btn"
                    onClick={() => {
                      setIsProcessing(true);
                      setTimeout(() => {
                        payWithPaystack(selectedPlan);
                        setShowConfirmModal(false);
                        setIsProcessing(false);
                      }, 800);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Proceed to Payment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Downgrade Modal Component
  const DowngradeModal = () => (
    <div className="downgrade-toast-modal-overlay">
      <div className="downgrade-toast-modal">
        <div className="downgrade-toast-header">
          <h3 className="downgrade-toast-title">
            <span>⚠️</span> Plan Downgrade Required
          </h3>
          <p className="downgrade-toast-subtitle">
            Contact Support to Downgrade
          </p>
        </div>
        
        <div className="downgrade-toast-content">
          <span className="downgrade-toast-icon">📞</span>
          <p className="downgrade-toast-message">
            To downgrade from Professional to Basic plan, please contact our support team.
            This helps us ensure a smooth transition of your data and settings.
          </p>
          
          <div className="downgrade-toast-actions">
            <button 
              className="downgrade-cancel-btn"
              onClick={() => setShowDowngradeModal(false)}
            >
              Cancel
            </button>
            <button 
              className="downgrade-contact-btn"
              onClick={openDowngradeEmail}
            >
              <span>✉️</span> Email Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Payment Result Modal Component - UPDATED with reload option
  const PaymentResultModal = () => {
    const handleAction = () => {
      setShowResultModal(false);
      if (paymentResult.success) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      }
    };
    
    const handleReloadApp = () => {
      window.location.reload();
    };
    
    const planName = paymentResult.verifiedPlan 
      ? plans[paymentResult.verifiedPlan]?.name 
      : (paymentResult.plan ? plans[paymentResult.plan]?.name : "Selected");
    
    const isPending = paymentResult.message.includes("pending") || 
                     paymentResult.message.includes("Verifying");
    
    const needsReload = paymentResult.message === "Payment Processed" && 
                       paymentResult.details.includes("reload");
    
    return (
      <div className="payment-result-modal-overlay">
        <div className="payment-result-modal">
          {paymentResult.success ? (
            <div className="payment-result-success">
              <span className="payment-result-icon">✅</span>
              <h3 className="payment-result-title">
                {paymentResult.verifiedPlan ? "Payment Verified!" : "Payment Successful!"}
              </h3>
              <p className="payment-result-message">
                {paymentResult.verifiedPlan 
                  ? `${planName} plan is now active` 
                  : "Your upgrade has been processed successfully"}
              </p>
            </div>
          ) : needsReload ? (
            <div className="payment-result-reload">
              <span className="payment-result-icon">✅</span>
              <h3 className="payment-result-title">
                {paymentResult.message}
              </h3>
              <p className="payment-result-message">
                {paymentResult.details}
              </p>
            </div>
          ) : isPending ? (
            <div className="payment-result-pending">
              <span className="payment-result-icon">⏳</span>
              <h3 className="payment-result-title">
                {paymentResult.message}
              </h3>
              <p className="payment-result-message">
                {paymentResult.details}
              </p>
            </div>
          ) : (
            <div className="payment-result-error">
              <span className="payment-result-icon">⚠️</span>
              <h3 className="payment-result-title">
                {paymentResult.message.includes("cancelled") ? "Payment Cancelled" : "Payment Failed"}
              </h3>
              <p className="payment-result-message">
                {paymentResult.message}
                {paymentResult.details && (
                  <><br /><small>{paymentResult.details}</small></>
                )}
              </p>
            </div>
          )}
          
          <div className="payment-result-content">
            {paymentResult.success && (
              <div className="payment-result-details">
                <p className="payment-result-plan">
                  {planName} Plan Activated
                </p>
                {paymentResult.amountPaid > 0 && (
                  <p className="payment-result-amount">
                    Amount: R{paymentResult.amountPaid.toFixed(2)}
                  </p>
                )}
                {paymentResult.reference && (
                  <p className="payment-result-ref">
                    Reference: {paymentResult.reference}
                  </p>
                )}
                <p className="payment-result-note">
                  <strong>Note:</strong> Your plan has been activated on our servers. 
                  You can view your new features in the dashboard.
                </p>
              </div>
            )}
            
            {needsReload && (
              <div className="payment-result-details">
                <p className="payment-result-note">
                  <strong>Note:</strong> Your payment was successful and plan is active. 
                  Please reload the app to see your updated plan.
                </p>
              </div>
            )}
            
            {!paymentResult.success && !isPending && !needsReload && (
              <div className="payment-result-details">
                <p className="payment-result-note">
                  <strong>Need help?</strong> Contact support at{" "}
                  <a 
                    href="mailto:budgetproo@gmail.com?subject=Payment%20Issue%20-%20BudgetPro"
                    style={{color: "#0ea5e9", textDecoration: "underline"}}
                    onClick={(e) => {
                      e.preventDefault();
                      openSupportEmail();
                    }}
                  >
                    budgetproo@gmail.com
                  </a>
                </p>
              </div>
            )}
            
            {isPending && (
              <div className="payment-result-details">
                <div className="payment-result-spinner"></div>
                <p className="payment-result-note">
                  <strong>Verification in progress:</strong> This may take a moment. 
                  Please don't close this window.
                </p>
              </div>
            )}
            
            <div className="payment-result-actions">
              {needsReload ? (
                <button 
                  className="payment-result-btn payment-result-reload-btn"
                  onClick={handleReloadApp}
                >
                  🔄 Reload App
                </button>
              ) : (
                <button 
                  className={`payment-result-btn ${!paymentResult.success && !isPending ? 'payment-result-error-btn' : ''}`}
                  onClick={handleAction}
                >
                  {paymentResult.success ? "Go to Dashboard" : 
                   isPending ? "Please wait..." : "Try Again"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Toast = () => (
    <div className={`toast toast-${toastType}`}>
      <span className="toast-icon">{toastType === "success" ? "✅" : "⚠️"}</span>
      <span className="toast-message">{toastMessage}</span>
      <button onClick={() => setShowToast(false)} className="toast-close" aria-label="Close notification">
        ×
      </button>
    </div>
  );

  const comparisonFeatures = [
    ["Unlimited Income & Expense Tracking", "✅", "✅", "✅"],
    ["Advanced Analytics & Reports", "✅", "✅", "✅"],
    ["PDF Export", "✅", "✅", "✅"],
    ["Goal Setting & Budgets", "✅", "✅", "✅"],
    ["Business Mode", "❌", "✅", "✅"],
    ["Debt Payoff Strategies", "❌", "✅", "✅"],
    ["Collaborative Features", "❌", "✅", "✅"],
    ["Priority Support", "❌", "✅", "✅"],
    ["Lifetime Updates", "❌", "❌", "✅"],
    ["Monthly Price", plans.basic.price, plans.pro.price, `One-time ${plans.lifetime.price}`]
  ];

  // Add modal-open class to body when modals are open
  useEffect(() => {
    if (showConfirmModal || showResultModal || showDowngradeModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showConfirmModal, showResultModal, showDowngradeModal]);

  return (
    <div className="upgrade-container">
      <div className="upgrade-header">
        <h1>Level Up Your Financial Game</h1>
        <div className="desktop-only">
          <p>
            Join thousands of users who transformed their finances with BudgetPro Premium.
            {userCountry && (
              <span className="upgrade-country-indicator">
                Pricing for {userCountry}
              </span>
            )}
          </p>
          {/* Currency Note */}
          <p className="currency-note">
            <small>
              ⚡ Prices shown in your local currency. Charged securely in South African Rand.
            </small>
          </p>
        </div>
        <div className="mobile-only">
          <p>Join thousands of users who transformed their finances with BudgetPro Premium.</p>
          {userCountry && (
            <div className="upgrade-country-indicator">
              Pricing for {userCountry}
            </div>
          )}
          {/* Currency Note for Mobile */}
          <p className="currency-note-mobile">
            <small>
              ⚡ Prices in local currency. Charged in South African Rand.
            </small>
          </p>
        </div>
      </div>

      <div className="pricing-grid">
        {Object.entries(plans).map(([key, plan]) => {
          const buttonText = getButtonText(key);
          const isDisabled = isButtonDisabled(key);
          const buttonClass = getButtonClass(key);

          return (
            <div key={key} className={getPlanCardClass(key)}>
              <div className="plan-header">
                <h3 className="plan-title">{plan.name}</h3>
                <div className="plan-price-display">
                  <span className="plan-amount">{plan.price}</span>
                  <span className="plan-period">/{plan.period}</span>
                </div>
              </div>

              <p className="plan-description">{plan.description}</p>

              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`feature-item ${feature.startsWith("✅") ? "included" : "excluded"}`}
                  >
                    <span className="feature-icon">{feature.startsWith("✅") ? "✓" : "✗"}</span>
                    <span className="feature-text">{feature.replace("✅ ", "").replace("❌ ", "")}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanButtonClick(key)}
                disabled={isDisabled}
                className={buttonClass}
              >
                {buttonText}
              </button>
            </div>
          );
        })}
      </div>

      <div className="comparison-section">
        <h2 className="comparison-title">Compare All Features</h2>

        <div className="comparison-table">
          <div className="comparison-header">
            <div className="comparison-feature">Feature</div>
            <div className="comparison-plan">Basic</div>
            <div className="comparison-plan">Professional</div>
            <div className="comparison-plan">Lifetime</div>
          </div>

          {comparisonFeatures.map(([feature, basic, pro, lifetime], idx) => (
            <div key={idx} className={`comparison-row ${idx === comparisonFeatures.length - 1 ? "last-row" : ''}`}>
              <div className="comparison-feature">{feature}</div>
              <div 
                className="comparison-plan"
                data-checkmark={basic === "✅" ? "true" : undefined}
                data-cross={basic === "❌" ? "true" : undefined}
              >
                {basic}
              </div>
              <div 
                className="comparison-plan"
                data-checkmark={pro === "✅" ? "true" : undefined}
                data-cross={pro === "❌" ? "true" : undefined}
              >
                {pro}
              </div>
              <div 
                className="comparison-plan"
                data-checkmark={lifetime === "✅" ? "true" : undefined}
                data-cross={lifetime === "❌" ? "true" : undefined}
              >
                {lifetime}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="final-cta">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-content">
          <div className="faq-item">
            <h3>How does the payment work?</h3>
            <p>All payments are processed securely through Paystack. After payment, our system verifies and activates your plan.</p>
          </div>
          <div className="faq-item">
            <h3>When will my plan be activated?</h3>
            <p>Your plan is activated immediately after successful payment verification (usually within seconds).</p>
          </div>
          <div className="faq-item">
            <h3>Can I cancel or change my plan?</h3>
            <p>
              You can upgrade at any time. For downgrades, please contact our support team at{" "}
              <a 
                href="mailto:budgetproo@gmail.com?subject=Plan%20Change%20Request"
                style={{color: "#0ea5e9", textDecoration: "underline", fontWeight: "600"}}
                onClick={(e) => {
                  e.preventDefault();
                  openSupportEmail();
                }}
              >
                budgetproo@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="upgrade-footer">
        <p>
          Need help?{" "}
          <a 
            href="mailto:budgetproo@gmail.com"
            onClick={(e) => {
              e.preventDefault();
              openSupportEmail();
            }}
          >
            Contact Support
          </a> • 
          <a href="/terms"> Terms</a> • 
          <a href="/privacy"> Privacy</a>
        </p>
      </div>

      {/* Paystack Script Loader */}
      <script 
        src="https://js.paystack.co/v1/inline.js" 
        async 
        onLoad={() => console.log('Paystack script loaded')}
      ></script>

      {/* Modals */}
      {showConfirmModal && <UpgradeConfirmModal />}
      {showResultModal && <PaymentResultModal />}
      {showDowngradeModal && <DowngradeModal />}

      {/* Toast Notification */}
      {showToast && <Toast />}

      {/* Add CSS for currency note and reload state */}
      <style>{`
        .currency-note, .currency-note-mobile {
          color: #666;
          font-size: 12px;
          margin-top: 8px;
        }
        .payment-note {
          margin-top: 8px;
          color: #666;
          font-size: 11px;
          text-align: center;
        }
        .currency-note-mobile {
          font-size: 11px;
          margin-top: 4px;
        }
        .payment-result-pending {
          text-align: center;
          padding: 20px;
          background: #fff8e1;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .payment-result-reload {
          text-align: center;
          padding: 20px;
          background: #e8f5e9;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .payment-result-reload .payment-result-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 10px;
        }
        .payment-result-pending .payment-result-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 10px;
        }
        .payment-result-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin: 0 auto 20px;
        }
        .payment-result-reload-btn {
          background: #4caf50 !important;
          color: white !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}