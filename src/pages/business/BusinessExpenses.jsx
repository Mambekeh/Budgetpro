// BusinessExpenses.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import AccountTypeSwitcher from "../../components/account/AccountTypeSwitcher";
import "./BusinessExpenses.css";

export default function BusinessExpenses() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(
    localStorage.getItem("accountType") || "business"
  );
  
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    category: "Office Supplies",
    vendor: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const expenseCategories = [
    "Office Supplies",
    "Rent & Utilities",
    "Marketing & Advertising",
    "Salaries & Wages",
    "Software & Subscriptions",
    "Travel & Entertainment",
    "Professional Services",
    "Equipment & Maintenance",
    "Insurance",
    "Taxes & Licenses",
    "Shipping & Delivery",
    "Other Business Expenses"
  ];

  // Scroll to top when component loads - but also ensure header is visible
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if we need to adjust for navbar
    const checkNavbarHeight = () => {
      const mainNavbar = document.querySelector('.main-navbar, nav, header');
      if (mainNavbar) {
        const navbarHeight = mainNavbar.offsetHeight || 60;
        const headerSection = document.querySelector('.business-header-section');
        if (headerSection) {
          headerSection.style.top = `${navbarHeight}px`;
        }
      }
    };
    
    // Run after a short delay to ensure DOM is ready
    setTimeout(checkNavbarHeight, 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please log in to add expenses");
      return;
    }
    
    setLoading(true);
    
    try {
      // Validate amount
      if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
        alert("Please enter a valid amount");
        setLoading(false);
        return;
      }
      
      // Get current date for month/year
      const expenseDate = new Date(expenseForm.date);
      const month = expenseDate.getMonth() + 1; // 1-12
      const year = expenseDate.getFullYear();
      
      // Prepare expense data for Firestore
      const expenseData = {
        type: "expense",
        label: expenseForm.description,
        date: expenseForm.date,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        vendor: expenseForm.vendor || "",
        month: month,
        year: year,
        createdAt: serverTimestamp(),
        userId: currentUser.uid
      };
      
      // Save to Firestore
      const expensesRef = collection(db, 'users', currentUser.uid, 'businessTransactions');
      await addDoc(expensesRef, expenseData);
      
      // Also save to localStorage for backup/offline
      const existingExpenses = JSON.parse(localStorage.getItem("bp_business_expenses") || "[]");
      existingExpenses.push({
        ...expenseData,
        id: Date.now().toString(),
        timestamp: Date.now()
      });
      localStorage.setItem("bp_business_expenses", JSON.stringify(existingExpenses));
      
      // Show success message
      setSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setExpenseForm({
          date: new Date().toISOString().split('T')[0],
          description: "",
          amount: "",
          category: "Office Supplies",
          vendor: ""
        });
        setSuccess(false);
        navigate("/business");
      }, 1500);
      
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error saving expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="business-page">
      {/* HEADER - FIXED AT THE TOP (DOES NOT SCROLL) */}
      <div className="business-header-section">
        <div className="header-content">
          <div className="welcome-message">
            <h2>Business Expenses</h2>
            <p>Track and manage your business spending</p>
          </div>
          
          <div className="account-switcher-section">
            <div className="switch-account-title">Account</div>
            <AccountTypeSwitcher
              accountType={accountType}
              onChange={(type) => {
                setAccountType(type);
                localStorage.setItem("accountType", type);
                if (type === "personal") navigate("/dashboard");
                if (type === "business") navigate("/business");
              }}
            />
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT - Scrolls underneath fixed header */}
      <div className="business-content">
        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <div className="success-text">Expense added successfully!</div>
          </div>
        )}
        
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            {/* DATE FIELD */}
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* DESCRIPTION FIELD */}
            <div className="form-group">
              <label>Description *</label>
              <input
                type="text"
                placeholder="e.g., Office stationery, Marketing materials, Client meeting"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                required
              />
            </div>
            
            {/* VENDOR FIELD */}
            <div className="form-group">
              <label>Vendor (Optional)</label>
              <input
                type="text"
                placeholder="Where did you make this purchase?"
                value={expenseForm.vendor}
                onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
              />
            </div>
            
            {/* AMOUNT FIELD */}
            <div className="form-group">
              <label>Amount (R) *</label>
              <div className="amount-input-wrapper">
                <span className="currency-label">R</span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  required
                />
              </div>
            </div>
            
            {/* CATEGORY FIELD */}
            <div className="form-group">
              <label>Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
              >
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* FORM ACTIONS */}
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => navigate("/business")} 
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  "Add Expense"
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* TIPS CARD */}
        <div className="tips-card">
          <div className="tips-header">
            <div className="tips-icon">💡</div>
            <h3>Tips for Better Expense Tracking</h3>
          </div>
          <ul className="tips-list">
            <li>Record expenses immediately after purchase</li>
            <li>Keep receipts for tax deductions</li>
            <li>Categorize expenses correctly for reporting</li>
            <li>Track both cash and card payments</li>
            <li>Regularly review your expense patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}