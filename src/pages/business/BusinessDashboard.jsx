import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import BusinessTransactionModal from './BusinessTransactionModal';
import './BusinessDashboard.css';

const BusinessDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State for period selection
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [accountType, setAccountType] = useState('business');
  
  // State for business data
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [profit, setProfit] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for showing all transactions
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  // Modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [modalType, setModalType] = useState('income');
  
  // Fetch business data when period changes
  useEffect(() => {
    if (!currentUser) return;
    
    fetchBusinessData();
  }, [currentUser, selectedMonth, selectedYear]);
  
  // Fetch business info
  useEffect(() => {
    if (!currentUser) return;
    
    fetchBusinessInfo();
  }, [currentUser]);
  
  const fetchBusinessInfo = async () => {
    try {
      const businessRef = collection(db, 'users', currentUser.uid, 'businessInfo');
      const querySnapshot = await getDocs(businessRef);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setBusinessInfo({
          id: doc.id,
          ...doc.data()
        });
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };
  
  const fetchBusinessData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      const transactionsRef = collection(db, 'users', currentUser.uid, 'businessTransactions');
      const q = query(
        transactionsRef,
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );
      
      const querySnapshot = await getDocs(q);
      let incomeTotal = 0;
      let expensesTotal = 0;
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data
        });
        
        if (data.type === 'income') {
          incomeTotal += data.amount;
        } else if (data.type === 'expense') {
          expensesTotal += data.amount;
        }
      });
      
      transactions.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : a.createdAt?.toDate();
        const dateB = b.date ? new Date(b.date) : b.createdAt?.toDate();
        return dateB - dateA;
      });
      
      setIncome(incomeTotal);
      setExpenses(expensesTotal);
      setProfit(incomeTotal - expensesTotal);
      
      // If showing all transactions, show all, otherwise just show recent 3
      if (showAllTransactions) {
        setRecentTransactions(transactions);
      } else {
        setRecentTransactions(transactions.slice(0, 3));
      }
      
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTransaction = (type) => {
    setModalType(type);
    setShowTransactionModal(true);
  };
  
  const handleTransactionSaved = () => {
    setShowTransactionModal(false);
    fetchBusinessData();
  };
  
  // Toggle between showing recent transactions and all transactions
  const handleViewAllTransactions = () => {
    setShowAllTransactions(!showAllTransactions);
    // We need to refetch to get all transactions
    if (!showAllTransactions) {
      fetchBusinessData();
    } else {
      // If toggling back to recent, we already have the data, just slice it
      const transactionsRef = collection(db, 'users', currentUser.uid, 'businessTransactions');
      // We need to refetch and then slice
      fetchBusinessData();
    }
  };
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  // First-time business user logic
  const isFirstTimeBusinessUser = (!businessInfo || businessInfo === null) && 
                                  income === 0 && 
                                  expenses === 0 && 
                                  recentTransactions.length === 0;
  
  if (!currentUser) {
    return (
      <div className="business-page">
        <div className="login-prompt">
          <p>Please log in to access the Business Dashboard</p>
        </div>
      </div>
    );
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
  <div className="business-page business-dashboard">
    {/* HEADER WITH ACCOUNT SWITCHER */}
    <div className="dashboard-business-header">
      <div className="header-content">
        <div className="welcome-message">
          <h2>Business Dashboard</h2>
          <p>
            Welcome back to your business account
            {businessInfo?.businessName && (
              <span className="business-name-display">
                {" "} | {businessInfo.businessName}
              </span>
            )}
          </p>
        </div>

          
          <div className="account-switcher-section">
            <div className="switch-account-title">Switch Account</div>
            <div className="switcher-wrapper">
              <button 
                className="switcher-button"
                onClick={() => {
                  setAccountType("personal");
                  localStorage.setItem("accountType", "personal");
                  navigate("/dashboard");
                }}
              >
                Switch to Personal
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main-content">
        
        {/* BUSINESS NAME BANNER */}
        {businessInfo?.businessName && (
          <div className="business-name-banner">
            <div className="business-name-content">
              <div className="business-name-icon">🏢</div>
              <div className="business-name-text">
                <h3>{businessInfo.businessName}</h3>
                {businessInfo.industry && (
                  <p className="business-industry">{businessInfo.industry}</p>
                )}
              </div>
            </div>
            <button 
              className="edit-business-btn"
              onClick={() => navigate('/business/settings')}
            >
              Edit Business
            </button>
          </div>
        )}
        
        {/* FIRST-TIME ONBOARDING CARD */}
        {isFirstTimeBusinessUser && (
          <div className="onboarding-card">
            <h3 className="onboarding-title">Welcome to your Business Dashboard</h3>
            <p className="onboarding-subtitle">Start managing your business by recording income, expenses, and creating invoices or quotations.</p>
          </div>
        )}
        
        {/* TOP SECTION: Period Selection + Quick Actions side by side */}
        <div className="top-section-grid">
          {/* PERIOD SELECTION CARD - SMALL */}
          <div className="dashboard-card period-selection-card">
            <div className="period-header">
              <h3 className="period-title">Select Period</h3>
            </div>
            <div className="period-controls-compact">
              <div className="form-group">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="form-select-compact"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="form-select-compact"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* QUICK ACTIONS CARD */}
          <div className="dashboard-card quick-actions-card">
            <h3 className="card-title">Quick Actions</h3>
            <div className="quick-actions-grid">
              {/* Income button navigates to income tab/page */}
              <button 
                className="quick-action-btn income-action"
                onClick={() => navigate('/business/income')}
              >
                <div className="action-icon">💵</div>
                <div className="action-text">Add Income</div> {/* Changed from View Income */}
              </button>
              
              {/* Expense button navigates to expenses tab/page */}
              <button 
                className="quick-action-btn expense-action"
                onClick={() => navigate('/business/expenses')}
              >
                <div className="action-icon">🛠️</div>
                <div className="action-text">Add Expense</div> {/* Changed from View Expense */}
              </button>
              
              {/* Quotation button navigates to quotations page */}
              <button 
                className="quick-action-btn quotation-action"
                onClick={() => navigate('/business/quotations')}
              >
                <div className="action-icon">📝</div>
                <div className="action-text">Quotations</div>
              </button>
              
              {/* Invoice button navigates to invoices page */}
              <button 
                className="quick-action-btn invoice-action"
                onClick={() => navigate('/business/invoices')}
              >
                <div className="action-icon">🧾</div>
                <div className="action-text">Invoices</div>
              </button>
            </div>
          </div>
        </div>
        
        {/* MONTHLY OVERVIEW - THREE CARDS SIDE BY SIDE */}
        <div className="dashboard-overview-grid">
          <div className="overview-card income-card">
            <div className="overview-content">
              <div className="overview-left">
                <div className="overview-label">Income</div>
                <div className="overview-subtitle">From completed jobs</div>
              </div>
              <div className="overview-right">
                <div className="overview-value">{formatCurrency(income)}</div>
              </div>
            </div>
          </div>
          
          <div className="overview-card expense-card">
            <div className="overview-content">
              <div className="overview-left">
                <div className="overview-label">Expenses</div>
                <div className="overview-subtitle">Operating costs</div>
              </div>
              <div className="overview-right">
                <div className="overview-value">{formatCurrency(expenses)}</div>
              </div>
            </div>
          </div>
          
          <div className="overview-card profit-card">
            <div className="overview-content">
              <div className="overview-left">
                <div className="overview-label">Profit</div>
                <div className="overview-subtitle">Income - Expenses</div>
              </div>
              <div className="overview-right">
                <div className={`overview-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                  {formatCurrency(profit)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* RECENT TRANSACTIONS */}
        <div className="dashboard-card">
          <div className="transactions-header">
            <h3 className="card-title">
              {showAllTransactions ? 'All Transactions' : 'Recent Transactions'}
            </h3>
            <button 
              className="view-all-btn"
              onClick={handleViewAllTransactions}
            >
              {showAllTransactions ? 'Show Recent' : 'View All'}
            </button>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <p>Loading transactions...</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-type">
                    <div className={`type-icon ${transaction.type}`}>
                      {transaction.type === 'income' ? '💵' : '🛠️'}
                    </div>
                  </div>
                  
                  <div className="transaction-details">
                    <div className="transaction-label">{transaction.label || 'No label'}</div>
                    <div className="transaction-date">{formatDate(transaction.date)}</div>
                  </div>
                  
                  <div className="transaction-amount">
                    <div className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No transactions for {months[selectedMonth - 1]} {selectedYear}</p>
              <button 
                className="add-first-btn"
                onClick={() => handleAddTransaction('income')}
              >
                Add First Transaction
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction Modal - Only used for adding first transaction from empty state */}
      {showTransactionModal && (
        <BusinessTransactionModal
          type={modalType}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setShowTransactionModal(false)}
          onSave={handleTransactionSaved}
        />
      )}
    </div>
  );
};

export default BusinessDashboard;