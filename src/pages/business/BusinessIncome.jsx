import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import "./BusinessIncome.css";

export default function BusinessIncome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(
    localStorage.getItem("accountType") || "business"
  );
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    source: "",
    amount: "",
    description: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  
  // Save to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please log in to add income");
      return;
    }

    if (!incomeForm.source || !incomeForm.amount) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const selectedDate = new Date(incomeForm.date);
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      await addDoc(collection(db, 'users', currentUser.uid, 'businessTransactions'), {
        type: 'income',
        label: incomeForm.source,
        amount: parseFloat(incomeForm.amount),
        date: incomeForm.date,
        month: month,
        year: year,
        notes: incomeForm.description || '',
        createdAt: serverTimestamp(),
        userId: currentUser.uid
      });

      setSuccess(true);
      
      setIncomeForm({
        date: new Date().toISOString().split('T')[0],
        source: "",
        amount: "",
        description: ""
      });

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error saving income:", error);
      alert("Failed to save income. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.business-income-page .account-switcher')) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="business-income-page">
      {/* HEADER */}
      <header className="business-income-page__header">
        <div className="business-income-page__header-content">
          <div className="business-income-page__header-main">
            <h1>Business Income</h1>
            <p>Record money from completed jobs</p>
          </div>
          
          {/* MOBILE ACCOUNT SWITCHER - Dropdown Style */}
          <div className="business-income-page__account-switcher">
            <div className="business-income-page__switch-label">Account</div>
            <div className="business-income-page__dropdown-container">
              <button 
                className="business-income-page__dropdown-trigger"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <span className="business-income-page__current-account">
                  {accountType === 'business' ? 'Business' : 'Personal'}
                </span>
                <span className="business-income-page__dropdown-arrow">▼</span>
              </button>
              
              {showAccountDropdown && (
                <div className="business-income-page__dropdown-menu">
                  <button 
                    className={`business-income-page__dropdown-item ${accountType === 'business' ? 'business-income-page__dropdown-item--active' : ''}`}
                    onClick={() => handleAccountSwitch('business')}
                  >
                    Business Account
                  </button>
                  <button 
                    className={`business-income-page__dropdown-item ${accountType === 'personal' ? 'business-income-page__dropdown-item--active' : ''}`}
                    onClick={() => handleAccountSwitch('personal')}
                  >
                    Personal Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* MAIN CONTENT */}
      <main className="business-income-page__main">
        {/* Success Message */}
        {success && (
          <div className="business-income-page__success-message">
            <span className="business-income-page__success-icon">✓</span>
            <span className="business-income-page__success-text">Income recorded successfully!</span>
          </div>
        )}
        
        {/* FORM CONTAINER */}
        <div className="business-income-page__form-card">
          <div className="business-income-page__form-header">
            <h2>Add New Income</h2>
            <p className="business-income-page__form-subtitle">Fill in the details below</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Date Field */}
            <div className="business-income-page__form-field">
              <label className="business-income-page__field-label">
                Date
                <span className="business-income-page__required">*</span>
              </label>
              <input
                type="date"
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                className="business-income-page__form-input"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Source Field */}
            <div className="business-income-page__form-field">
              <label className="business-income-page__field-label">
                Income Source
                <span className="business-income-page__required">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Completed bathroom renovation, Website design service"
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value})}
                className="business-income-page__form-input"
                required
              />
              <div className="business-income-page__field-hint">What was this money for?</div>
            </div>
            
            {/* Amount Field */}
            <div className="business-income-page__form-field">
              <label className="business-income-page__field-label">
                Amount (R)
                <span className="business-income-page__required">*</span>
              </label>
              <div className="business-income-page__amount-input-wrapper">
                <span className="business-income-page__currency-symbol">R</span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                  className="business-income-page__form-input business-income-page__amount-input"
                  required
                />
              </div>
            </div>
            
            {/* Description Field */}
            <div className="business-income-page__form-field">
              <label className="business-income-page__field-label">
                Description (Optional)
              </label>
              <textarea
                placeholder="Add any notes: client name, job details, payment method, etc."
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                className="business-income-page__form-textarea"
                rows="3"
              />
              <div className="business-income-page__field-hint">Helpful for future reference</div>
            </div>
            
            {/* Form Actions */}
            <div className="business-income-page__form-actions">
              <button 
                type="button" 
                onClick={() => navigate("/business")}
                className="business-income-page__cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="business-income-page__submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="business-income-page__spinner"></span>
                    Saving...
                  </>
                ) : (
                  "Add Income"
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Quick Tips */}
        <div className="business-income-page__tips-card">
          <div className="business-income-page__tips-header">
            <span className="business-income-page__tips-icon">💡</span>
            <h3>Tips for Better Records</h3>
          </div>
          <ul className="business-income-page__tips-list">
            <li>Record income as soon as you receive payment</li>
            <li>Include client name for easy reference</li>
            <li>Specify the job or service provided</li>
            <li>Track payment method (cash, card, transfer)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}