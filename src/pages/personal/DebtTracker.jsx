import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';

import { getCurrencySymbol } from "../../utils/currencyUtils.js";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DebtTracker.css';

export default function DebtTracker() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('debts');
  const [debts, setDebts] = useState([]);
  const [lending, setLending] = useState([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showLendingForm, setShowLendingForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  
  // In-app notifications and modals
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', id: null, name: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');
  
  // New centered popup state
  const [popup, setPopup] = useState({ open: false, type: 'success', message: '' });
  
  const getPlan = () => {
    return localStorage.getItem("budgetPro_plan") || "free";
  };
  
  const plan = getPlan();
  const isPro = plan === "pro" || plan === "lifetime";
  const isFree = plan === "free";
  
  const [debtForm, setDebtForm] = useState({
    name: '',
    type: 'Personal Loan',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    borrowedDate: '',
    dueDate: '',
    status: 'Active'
  });

  const [lendingForm, setLendingForm] = useState({
    personName: '',
    purpose: '',
    totalAmount: '',
    interestRate: '',
    dateLent: '',
    dueDate: '',
    status: 'Active',
    notes: ''
  });

  // Show notification
  const showNotification = (type, message, duration = 3000) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), duration);
  };

  // Show centered popup
  const showPopup = (type, message) => {
    setPopup({ open: true, type, message });
  };

  // Close centered popup
  const closePopup = () => {
    setPopup({ open: false, type: 'success', message: '' });
  };

  // Show confirm modal
  const showConfirm = (type, id, name) => {
    setConfirmAction({ type, id, name });
    setShowConfirmModal(true);
  };

  // Close confirm modal
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction({ type: '', id: null, name: '' });
  };

  // Show history modal
  const showHistory = (title, history) => {
    setHistoryTitle(title);
    setPaymentHistory(history);
    setShowHistoryModal(true);
  };

  // Close history modal
  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setPaymentHistory([]);
    setHistoryTitle('');
  };

  // Format currency - FIXED: Using imported getCurrencySymbol
  const formatCurrency = (amount) => {
    const currencySymbol = getCurrencySymbol();
    return `${currencySymbol} ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // ✅ FIXED: Use user-specific subcollection
        const debtsRef = collection(db, 'users', currentUser.uid, 'debts');
        const debtsSnapshot = await getDocs(debtsRef);
        const debtsData = debtsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          payments: doc.data().payments || []
        }));
        setDebts(debtsData);

        // ✅ FIXED: Use user-specific subcollection
        const lendingRef = collection(db, 'users', currentUser.uid, 'lending');
        const lendingSnapshot = await getDocs(lendingRef);
        const lendingData = lendingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          payments: doc.data().payments || []
        }));
        setLending(lendingData);

      } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('error', 'Error loading data. Please try again.');
      }
    };

    fetchData();
  }, [currentUser]);

  const handleDebtInputChange = (e) => {
    const { name, value } = e.target;
    setDebtForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDebtSubmit = async (e) => {
    e.preventDefault();
    
    if (!debtForm.name || !debtForm.totalAmount) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      const totalAmount = parseFloat(debtForm.totalAmount);
      const interestRate = parseFloat(debtForm.interestRate || 0);
      const interestAmount = totalAmount * (interestRate / 100);
      const totalWithInterest = totalAmount + interestAmount;
      
      const borrowedDate = debtForm.borrowedDate || new Date().toISOString().split('T')[0];
      
      const debtData = {
        ...debtForm,
        userId: currentUser.uid,
        totalAmount: totalAmount,
        interestRate: interestRate,
        interestAmount: interestAmount,
        totalWithInterest: totalWithInterest,
        remainingAmount: parseFloat(debtForm.remainingAmount || totalWithInterest),
        borrowedDate: borrowedDate,
        payments: editingDebt ? (editingDebt.payments || []) : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingDebt) {
        // ✅ FIXED: Update in user-specific subcollection
        const debtRef = doc(db, 'users', currentUser.uid, 'debts', editingDebt.id);
        await updateDoc(debtRef, debtData);
        setDebts(debts.map(debt => debt.id === editingDebt.id ? { ...debt, ...debtData } : debt));
        showPopup('success', 'Debt updated successfully');
        resetDebtForm();
      } else {
        // ✅ FIXED: Add to user-specific subcollection
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'debts'), debtData);
        setDebts([...debts, { id: docRef.id, ...debtData }]);
        showPopup('success', 'Debt added successfully');
        resetDebtForm();
      }

    } catch (error) {
      console.error('Error saving debt:', error);
      showNotification('error', 'Error saving debt. Please try again.');
    }
  };

  const resetDebtForm = () => {
    setDebtForm({
      name: '',
      type: 'Personal Loan',
      totalAmount: '',
      remainingAmount: '',
      interestRate: '',
      borrowedDate: '',
      dueDate: '',
      status: 'Active'
    });
    setEditingDebt(null);
    setShowDebtForm(false);
  };

  const handleDebtEdit = (debt) => {
    setDebtForm({
      name: debt.name,
      type: debt.type,
      totalAmount: debt.totalAmount,
      remainingAmount: debt.remainingAmount,
      interestRate: debt.interestRate,
      borrowedDate: debt.borrowedDate || '',
      dueDate: debt.dueDate || '',
      status: debt.status
    });
    setEditingDebt(debt);
    setShowDebtForm(true);
  };

  const handleDebtDelete = async () => {
    try {
      // ✅ FIXED: Delete from user-specific subcollection
      await deleteDoc(doc(db, 'users', currentUser.uid, 'debts', confirmAction.id));
      setDebts(debts.filter(debt => debt.id !== confirmAction.id));
      showPopup('success', 'Debt deleted successfully');
      closeConfirmModal();
    } catch (error) {
      console.error('Error deleting debt:', error);
      showNotification('error', 'Error deleting debt. Please try again.');
    }
  };

  const handleDebtPayment = async (debt) => {
    setConfirmAction({ 
      type: 'payment', 
      id: debt.id, 
      name: debt.name,
      remaining: debt.remainingAmount 
    });
    setShowConfirmModal(true);
  };

  const processDebtPayment = async () => {
    const paymentInput = document.getElementById('paymentAmount');
    if (!paymentInput || !paymentInput.value) {
      showNotification('error', 'Please enter a payment amount');
      return;
    }

    const paymentAmount = parseFloat(paymentInput.value);
    const debt = debts.find(d => d.id === confirmAction.id);
    
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      showNotification('error', 'Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > debt.remainingAmount) {
      showNotification('error', 'Payment amount cannot exceed remaining balance');
      return;
    }

    try {
      const newRemaining = Math.max(0, debt.remainingAmount - paymentAmount);
      const newStatus = newRemaining <= 0 ? 'Paid Off' : debt.status;
      const paymentRecord = {
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        remaining: newRemaining
      };
      
      // ✅ FIXED: Update in user-specific subcollection
      const debtRef = doc(db, 'users', currentUser.uid, 'debts', debt.id);
      await updateDoc(debtRef, {
        remainingAmount: newRemaining,
        status: newStatus,
        payments: [...(debt.payments || []), paymentRecord],
        updatedAt: serverTimestamp(),
        lastPaymentDate: serverTimestamp()
      });

      setDebts(debts.map(d => 
        d.id === debt.id ? { 
          ...d, 
          remainingAmount: newRemaining, 
          status: newStatus,
          payments: [...(d.payments || []), paymentRecord]
        } : d
      ));
      
      showPopup('success', `Payment of ${formatCurrency(paymentAmount)} recorded successfully`);
      closeConfirmModal();
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('error', 'Error processing payment. Please try again.');
    }
  };

  const viewDebtHistory = (debt) => {
    showHistory(`Payment History: ${debt.name}`, debt.payments || []);
  };

  const handleLendingInputChange = (e) => {
    const { name, value } = e.target;
    setLendingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLendingSubmit = async (e) => {
    e.preventDefault();
    
    if (!lendingForm.personName || !lendingForm.totalAmount) {
      showNotification('error', 'Please fill in person name and amount');
      return;
    }

    try {
      const totalAmount = parseFloat(lendingForm.totalAmount);
      const interestRate = parseFloat(lendingForm.interestRate || 0);
      const interestAmount = totalAmount * (interestRate / 100);
      const totalWithInterest = totalAmount + interestAmount;
      
      const lendingData = {
        ...lendingForm,
        userId: currentUser.uid,
        totalAmount: totalAmount,
        interestRate: interestRate,
        interestAmount: interestAmount,
        totalWithInterest: totalWithInterest,
        remainingAmount: totalWithInterest,
        dateLent: lendingForm.dateLent || new Date().toISOString().split('T')[0],
        payments: editingLoan ? (editingLoan.payments || []) : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingLoan) {
        // ✅ FIXED: Update in user-specific subcollection
        const loanRef = doc(db, 'users', currentUser.uid, 'lending', editingLoan.id);
        await updateDoc(loanRef, lendingData);
        setLending(lending.map(loan => loan.id === editingLoan.id ? { ...loan, ...lendingData } : loan));
        showPopup('success', 'Loan updated successfully');
        resetLendingForm();
      } else {
        // ✅ FIXED: Add to user-specific subcollection
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'lending'), lendingData);
        setLending([...lending, { id: docRef.id, ...lendingData }]);
        showPopup('success', 'Loan added successfully');
        resetLendingForm(); // Fixed: Automatically hide form and clear fields
      }

    } catch (error) {
      console.error('Error saving loan:', error);
      showNotification('error', 'Error saving loan. Please try again.');
    }
  };

  const resetLendingForm = () => {
    setLendingForm({
      personName: '',
      purpose: '',
      totalAmount: '',
      interestRate: '',
      dateLent: '',
      dueDate: '',
      status: 'Active',
      notes: ''
    });
    setEditingLoan(null);
    setShowLendingForm(false);
  };

  const handleLendingEdit = (loan) => {
    setLendingForm({
      personName: loan.personName,
      purpose: loan.purpose,
      totalAmount: loan.totalAmount,
      interestRate: loan.interestRate,
      dateLent: loan.dateLent,
      dueDate: loan.dueDate || '',
      status: loan.status,
      notes: loan.notes || ''
    });
    setEditingLoan(loan);
    setShowLendingForm(true);
  };

  const handleLendingDelete = async () => {
    try {
      // ✅ FIXED: Delete from user-specific subcollection
      await deleteDoc(doc(db, 'users', currentUser.uid, 'lending', confirmAction.id));
      setLending(lending.filter(loan => loan.id !== confirmAction.id));
      showPopup('success', 'Loan deleted successfully');
      closeConfirmModal();
    } catch (error) {
      console.error('Error deleting loan:', error);
      showNotification('error', 'Error deleting loan. Please try again.');
    }
  };

  const handleReceivePayment = async (loan) => {
    setConfirmAction({ 
      type: 'receive', 
      id: loan.id, 
      name: loan.personName,
      remaining: loan.remainingAmount 
    });
    setShowConfirmModal(true);
  };

  const processReceivePayment = async () => {
    const paymentInput = document.getElementById('paymentAmount');
    if (!paymentInput || !paymentInput.value) {
      showNotification('error', 'Please enter a payment amount');
      return;
    }

    const paymentAmount = parseFloat(paymentInput.value);
    const loan = lending.find(l => l.id === confirmAction.id);
    
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      showNotification('error', 'Please enter a valid payment amount');
      return;
    }

    if (paymentAmount > loan.remainingAmount) {
      showNotification('error', 'Payment amount cannot exceed remaining balance');
      return;
    }

    try {
      const newRemaining = Math.max(0, loan.remainingAmount - paymentAmount);
      const newStatus = newRemaining <= 0 ? 'Paid Back' : loan.status;
      const paymentRecord = {
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        remaining: newRemaining
      };
      
      // ✅ FIXED: Update in user-specific subcollection
      const loanRef = doc(db, 'users', currentUser.uid, 'lending', loan.id);
      await updateDoc(loanRef, {
        remainingAmount: newRemaining,
        status: newStatus,
        payments: [...(loan.payments || []), paymentRecord],
        updatedAt: serverTimestamp(),
        lastPaymentDate: serverTimestamp()
      });

      setLending(lending.map(l => 
        l.id === loan.id ? { 
          ...l, 
          remainingAmount: newRemaining, 
          status: newStatus,
          payments: [...(l.payments || []), paymentRecord]
        } : l
      ));
      
      showPopup('success', `Received ${formatCurrency(paymentAmount)} successfully`);
      closeConfirmModal();
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('error', 'Error processing payment. Please try again.');
    }
  };

  const viewPaymentHistory = (loan) => {
    showHistory(`Payment History: ${loan.personName}`, loan.payments || []);
  };

  // ========== CALCULATIONS ==========
  
  // Get active debts (status !== 'Paid Off')
  const activeDebts = debts.filter(debt => debt.status !== 'Paid Off');
  
  // 1) Total Debt Amount = SUM of remainingAmount for ACTIVE debts only
  const totalDebtAmount = activeDebts.reduce((sum, debt) => sum + (debt.remainingAmount || 0), 0);
  
  const activeDebtsCount = activeDebts.length;
  
  // 2) Progress calculation - ONLY for ACTIVE debts
  const calculateDebtProgress = () => {
    if (activeDebts.length === 0) return 0;
    
    // totalToRepayActive = sum(totalWithInterest for ACTIVE debts)
    const totalToRepayActive = activeDebts.reduce((sum, debt) => sum + (debt.totalWithInterest || debt.totalAmount || 0), 0);
    
    // totalRemainingActive = sum(remainingAmount for ACTIVE debts)
    const totalRemainingActive = activeDebts.reduce((sum, debt) => sum + (debt.remainingAmount || 0), 0);
    
    // totalPaidActive = totalToRepayActive - totalRemainingActive
    const totalPaidActive = totalToRepayActive - totalRemainingActive;
    
    if (totalToRepayActive <= 0) return 0;
    
    // progressPct = (totalPaidActive / totalToRepayActive) * 100
    const progressPct = (totalPaidActive / totalToRepayActive) * 100;
    
    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, Math.round(progressPct)));
  };

  // Lending calculations
  const activeLoans = lending.filter(loan => loan.status !== 'Paid Back');
  const totalLentOut = activeLoans.reduce((sum, loan) => sum + (loan.totalAmount || 0), 0);
  const totalExpectedBack = activeLoans.reduce((sum, loan) => sum + (loan.totalWithInterest || loan.totalAmount || 0), 0);
  const totalStillOwed = activeLoans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);
  
  const calculateLendingProgress = () => {
    if (activeLoans.length === 0) return 0;
    const totalOriginal = activeLoans.reduce((sum, loan) => sum + (loan.totalWithInterest || loan.totalAmount || 0), 0);
    const totalRemaining = activeLoans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);
    const totalPaid = totalOriginal - totalRemaining;
    if (totalOriginal <= 0) return 0;
    const progress = Math.round((totalPaid / totalOriginal) * 100);
    return Math.min(100, Math.max(0, progress));
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate time left in months
  const calculateTimeLeft = (debt) => {
    if (!debt.dueDate) return 'No due date';
    
    try {
      const today = new Date();
      const due = new Date(debt.dueDate);
      
      if (isNaN(due.getTime())) return 'Invalid date';
      
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Due today';
      if (diffDays < 30) return `${diffDays} days`;
      
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      
      if (remainingDays === 0) return `${months} month${months !== 1 ? 's' : ''}`;
      return `${months} month${months !== 1 ? 's' : ''} ${remainingDays} days`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const debtProgress = calculateDebtProgress();
  const lendingProgress = calculateLendingProgress();

  return (
    <div className="debt-tracker-container">
      {/* Notification */}
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button className="notification-close" onClick={() => setNotification({ type: '', message: '' })}>
            ×
          </button>
        </div>
      )}

      {/* Centered Popup */}
      {popup.open && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className={`popup-icon ${popup.type}`}>
              {popup.type === 'success' ? '✓' : '✗'}
            </div>
            <h3 className="popup-title">
              {popup.type === 'success' ? 'Success' : 'Error'}
            </h3>
            <p className="popup-message">{popup.message}</p>
            <button onClick={closePopup} className="popup-button">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="debt-header">
        <h1 className="debt-title">Debt & Lending Tracker</h1>
        <p className="debt-subtitle">Track money you owe and money owed to you</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          onClick={() => setActiveTab('debts')}
          className={`tab-button ${activeTab === 'debts' ? 'active' : ''}`}
        >
          <span className="tab-icon">💸</span>
          <span className="tab-text">My Debts</span>
          {debts.length > 0 && <span className="tab-count">{activeDebtsCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('lending')}
          className={`tab-button ${activeTab === 'lending' ? 'active' : ''}`}
        >
          <span className="tab-icon">📤</span>
          <span className="tab-text">Money Lent</span>
          {lending.length > 0 && <span className="tab-count">{activeLoans.length}</span>}
        </button>
      </div>

      {/* DEBTS TAB */}
      {activeTab === 'debts' && (
        <div className="tab-content">
          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Active Debts</div>
              <div className="stat-value">{activeDebtsCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Debt Amount</div> {/* Changed label */}
              <div className="stat-value">{formatCurrency(totalDebtAmount)}</div> {/* FIXED: Using formatCurrency */}
            </div>
            <div className="stat-card">
              <div className="stat-label">Progress</div>
              <div className="stat-value">{debtProgress}%</div>
            </div>
          </div>

          {/* Mobile Stats Row */}
          <div className="mobile-stats-row">
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Active Debts:</span>
              <span className="mobile-stat-value">{activeDebtsCount}</span>
            </div>
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Total Debt Amount:</span> {/* Changed label */}
              <span className="mobile-stat-value">{formatCurrency(totalDebtAmount)}</span> {/* FIXED: Using formatCurrency */}
            </div>
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Progress:</span>
              <span className="mobile-stat-value">{debtProgress}%</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="action-row">
            <h2 className="section-title">Your Debts</h2>
            <button
              onClick={() => { setShowDebtForm(true); setEditingDebt(null); }}
              className="add-button"
            >
              + Add New
            </button>
          </div>

          {/* Debt Form */}
          {showDebtForm && (
            <div className="form-modal">
              <div className="form-header">
                <h3>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h3>
                <button onClick={resetDebtForm} className="close-button">×</button>
              </div>
              
              <form onSubmit={handleDebtSubmit} className="debt-form">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Debt Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={debtForm.name}
                      onChange={handleDebtInputChange}
                      placeholder="e.g., Car Loan"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Debt Type</label>
                    <select
                      name="type"
                      value={debtForm.type}
                      onChange={handleDebtInputChange}
                    >
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Car Loan">Car Loan</option>
                      <option value="Student Loan">Student Loan</option>
                      <option value="Mortgage">Mortgage</option>
                      <option value="Medical Debt">Medical Debt</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Total Amount ({getCurrencySymbol()}) *</label> {/* FIXED: Dynamic currency */}
                    <div className="input-with-prefix">
                      <span className="prefix">{getCurrencySymbol()}</span> {/* FIXED: Dynamic currency */}
                      <input
                        type="number"
                        name="totalAmount"
                        value={debtForm.totalAmount}
                        onChange={handleDebtInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Interest Rate (%)</label>
                    <div className="input-with-prefix">
                      <span className="prefix">%</span>
                      <input
                        type="number"
                        name="interestRate"
                        value={debtForm.interestRate}
                        onChange={handleDebtInputChange}
                        placeholder="0.0"
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Borrowed Date</label>
                    <input
                      type="date"
                      name="borrowedDate"
                      value={debtForm.borrowedDate}
                      onChange={handleDebtInputChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-field">
                    <label>Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={debtForm.dueDate}
                      onChange={handleDebtInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={resetDebtForm}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                  >
                    {editingDebt ? 'Update Debt' : 'Add Debt'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Debts List */}
          {debts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <h3>No Debts Tracked Yet</h3>
              <p>Start by adding your first debt to track payments</p>
              <button
                onClick={() => { setShowDebtForm(true); setEditingDebt(null); }}
                className="add-button"
              >
                + Add First Debt
              </button>
            </div>
          ) : (
            <>
              <div className="debts-list">
                {debts.map((debt) => {
                  const totalWithInterest = debt.totalWithInterest || debt.totalAmount;
                  const paidAmount = totalWithInterest - (debt.remainingAmount || 0);
                  const progressPercent = Math.min(100, Math.max(0, (paidAmount / totalWithInterest) * 100));
                  
                  return (
                    <div key={debt.id} className="debt-item">
                      <div className="debt-header-info">
                        <div className="debt-title-section">
                          <h4 className="debt-name">{debt.name}</h4>
                          <span className={`status-tag status-${debt.status.toLowerCase().replace(' ', '-')}`}>
                            {debt.status}
                          </span>
                        </div>
                        <div className="debt-meta desktop">
                          <span className="meta-item">{debt.type}</span>
                          <span className="meta-separator">•</span>
                          <span className="meta-item">{debt.interestRate || 0}% interest</span>
                          <span className="meta-separator">•</span>
                          <span className="meta-item">Borrowed: {formatDate(debt.borrowedDate)}</span>
                          <span className="meta-separator">•</span>
                          <span className="meta-item">Due: {formatDate(debt.dueDate)}</span>
                        </div>
                        <div className="debt-meta mobile">
                          <div className="debt-meta-line-1">
                            <span className="meta-item">{debt.type}</span>
                            <span className="meta-separator">•</span>
                            <span className="meta-item">{debt.interestRate || 0}% interest</span>
                          </div>
                          <div className="debt-meta-line-2">
                            <span className="meta-item">Borrowed: {formatDate(debt.borrowedDate)}</span>
                            <span className="meta-separator">•</span>
                            <span className="meta-item">Due: {formatDate(debt.dueDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          <span>Paid: {formatCurrency(paidAmount)}</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                      </div>

                      <div className="debt-details-grid desktop-grid">
                        <div className="detail-item">
                          <div className="detail-label">Borrowed</div>
                          <div className="detail-value">{formatCurrency(debt.totalAmount)}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">To Repay</div>
                          <div className="detail-value">{formatCurrency(totalWithInterest)}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Paid</div>
                          <div className="detail-value">{formatCurrency(paidAmount)}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Remaining</div>
                          <div className="detail-value remaining">{formatCurrency(debt.remainingAmount)}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Time Left</div>
                          <div className="detail-value">{calculateTimeLeft(debt)}</div>
                        </div>
                      </div>

                      <div className="debt-details-list mobile-list">
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">Borrowed:</span>
                          <span className="mobile-detail-value">{formatCurrency(debt.totalAmount)}</span>
                        </div>
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">To Repay:</span>
                          <span className="mobile-detail-value">{formatCurrency(totalWithInterest)}</span>
                        </div>
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">Paid:</span>
                          <span className="mobile-detail-value">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">Remaining:</span>
                          <span className="mobile-detail-value remaining">{formatCurrency(debt.remainingAmount)}</span>
                        </div>
                        <div className="mobile-detail-item">
                          <span className="mobile-detail-label">Time Left:</span>
                          <span className="mobile-detail-value">{calculateTimeLeft(debt)}</span>
                        </div>
                      </div>

                      <div className="debt-actions">
                        <button
                          onClick={() => handleDebtPayment(debt)}
                          disabled={debt.status === 'Paid Off'}
                          className="action-button pay-button"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => viewDebtHistory(debt)}
                          disabled={!debt.payments || debt.payments.length === 0}
                          className="action-button history-button"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleDebtEdit(debt)}
                          className="action-button edit-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => showConfirm('debt-delete', debt.id, debt.name)}
                          className="action-button delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* LENDING TAB */}
      {activeTab === 'lending' && (
        <div className="tab-content">
          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Active Loans</div>
              <div className="stat-value">{activeLoans.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Lent</div>
              <div className="stat-value">{formatCurrency(totalLentOut)}</div> {/* FIXED: Using formatCurrency */}
            </div>
            <div className="stat-card">
              <div className="stat-label">Progress</div>
              <div className="stat-value">{lendingProgress}%</div>
            </div>
          </div>

          {/* Mobile Stats Row */}
          <div className="mobile-stats-row">
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Active Loans:</span>
              <span className="mobile-stat-value">{activeLoans.length}</span>
            </div>
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Total Lent:</span>
              <span className="mobile-stat-value">{formatCurrency(totalLentOut)}</span> {/* FIXED: Using formatCurrency */}
            </div>
            <div className="mobile-stat-item">
              <span className="mobile-stat-label">Progress:</span>
              <span className="mobile-stat-value">{lendingProgress}%</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="action-row">
            <h2 className="section-title">Money Lent Out</h2>
            <button
              onClick={() => { setShowLendingForm(true); setEditingLoan(null); }}
              className="add-button blue"
            >
              + Add New
            </button>
          </div>

          {/* Lending Form */}
          {showLendingForm && (
            <div className="form-modal">
              <div className="form-header">
                <h3>{editingLoan ? 'Edit Loan' : 'Add Money Lent'}</h3>
                <button onClick={resetLendingForm} className="close-button">×</button>
              </div>
              
              <form onSubmit={handleLendingSubmit} className="lending-form">
                <div className="form-grid">
                  <div className="form-field">
                    <label>Person's Name *</label>
                    <input
                      type="text"
                      name="personName"
                      value={lendingForm.personName}
                      onChange={handleLendingInputChange}
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Purpose</label>
                    <input
                      type="text"
                      name="purpose"
                      value={lendingForm.purpose}
                      onChange={handleLendingInputChange}
                      placeholder="e.g., Emergency"
                    />
                  </div>

                  <div className="form-field">
                    <label>Amount ({getCurrencySymbol()}) *</label> {/* FIXED: Dynamic currency */}
                    <div className="input-with-prefix">
                      <span className="prefix">{getCurrencySymbol()}</span> {/* FIXED: Dynamic currency */}
                      <input
                        type="number"
                        name="totalAmount"
                        value={lendingForm.totalAmount}
                        onChange={handleLendingInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Interest Rate (%)</label>
                    <div className="input-with-prefix">
                      <span className="prefix">%</span>
                      <input
                        type="number"
                        name="interestRate"
                        value={lendingForm.interestRate}
                        onChange={handleLendingInputChange}
                        placeholder="0.0"
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Date Lent</label>
                    <input
                      type="date"
                      name="dateLent"
                      value={lendingForm.dateLent}
                      onChange={handleLendingInputChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-field">
                    <label>Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={lendingForm.dueDate}
                      onChange={handleLendingInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={lendingForm.notes}
                      onChange={handleLendingInputChange}
                      placeholder="Additional notes..."
                      rows="2"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={resetLendingForm}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button blue"
                  >
                    {editingLoan ? 'Update Loan' : 'Add Loan'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lending List */}
          {lending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📤</div>
              <h3>No Money Lent Out</h3>
              <p>Track money you've lent to others</p>
              <button
                onClick={() => { setShowLendingForm(true); setEditingLoan(null); }}
                className="add-button blue"
              >
                + Track First Loan
              </button>
            </div>
          ) : (
            <div className="debts-list">
              {lending.map((loan) => {
                const totalWithInterest = loan.totalWithInterest || loan.totalAmount;
                const paidAmount = totalWithInterest - (loan.remainingAmount || totalWithInterest);
                const progressPercent = Math.min(100, Math.max(0, (paidAmount / totalWithInterest) * 100));
                
                return (
                  <div key={loan.id} className="debt-item">
                    <div className="debt-header-info">
                      <div className="debt-title-section">
                        <h4 className="debt-name">{loan.personName}</h4>
                        <span className={`status-tag status-${loan.status.toLowerCase().replace(' ', '-')}`}>
                          {loan.status}
                        </span>
                      </div>
                      <div className="debt-meta desktop">
                        <span className="meta-item">{loan.purpose || 'Loan'}</span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">{loan.interestRate || 0}% interest</span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">Lent: {formatDate(loan.dateLent)}</span>
                        <span className="meta-separator">•</span>
                        <span className="meta-item">Due: {formatDate(loan.dueDate)}</span>
                      </div>
                      <div className="debt-meta mobile">
                        <div className="debt-meta-line-1">
                          <span className="meta-item">{loan.purpose || 'Loan'}</span>
                          <span className="meta-separator">•</span>
                          <span className="meta-item">{loan.interestRate || 0}% interest</span>
                        </div>
                        <div className="debt-meta-line-2">
                          <span className="meta-item">Lent: {formatDate(loan.dateLent)}</span>
                          <span className="meta-separator">•</span>
                          <span className="meta-item">Due: {formatDate(loan.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        <span>Received: {formatCurrency(paidAmount)}</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                    </div>

                    <div className="debt-details-grid desktop-grid">
                      <div className="detail-item">
                        <div className="detail-label">Lent</div>
                        <div className="detail-value">{formatCurrency(loan.totalAmount)}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">To Receive</div>
                        <div className="detail-value">{formatCurrency(totalWithInterest)}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Received</div>
                        <div className="detail-value">{formatCurrency(paidAmount)}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Remaining</div>
                        <div className="detail-value remaining">
                          {formatCurrency(loan.remainingAmount || totalWithInterest)}
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Time Left</div>
                        <div className="detail-value">{calculateTimeLeft(loan)}</div>
                      </div>
                    </div>

                    <div className="debt-details-list mobile-list">
                      <div className="mobile-detail-item">
                        <span className="mobile-detail-label">Lent:</span>
                        <span className="mobile-detail-value">{formatCurrency(loan.totalAmount)}</span>
                      </div>
                      <div className="mobile-detail-item">
                        <span className="mobile-detail-label">To Receive:</span>
                        <span className="mobile-detail-value">{formatCurrency(totalWithInterest)}</span>
                      </div>
                      <div className="mobile-detail-item">
                        <span className="mobile-detail-label">Received:</span>
                        <span className="mobile-detail-value">{formatCurrency(paidAmount)}</span>
                      </div>
                      <div className="mobile-detail-item">
                        <span className="mobile-detail-label">Remaining:</span>
                        <span className="mobile-detail-value remaining">
                          {formatCurrency(loan.remainingAmount || totalWithInterest)}
                        </span>
                      </div>
                      <div className="mobile-detail-item">
                        <span className="mobile-detail-label">Time Left:</span>
                        <span className="mobile-detail-value">{calculateTimeLeft(loan)}</span>
                      </div>
                    </div>

                    <div className="debt-actions">
                      <button
                        onClick={() => handleReceivePayment(loan)}
                        disabled={loan.status === 'Paid Back'}
                        className="action-button pay-button blue"
                      >
                        Receive
                      </button>
                      <button
                        onClick={() => viewPaymentHistory(loan)}
                        disabled={!loan.payments || loan.payments.length === 0}
                        className="action-button history-button"
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleLendingEdit(loan)}
                        className="action-button edit-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => showConfirm('loan-delete', loan.id, loan.personName)}
                        className="action-button delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <h3>
                {confirmAction.type === 'debt-delete' && 'Delete Debt'}
                {confirmAction.type === 'loan-delete' && 'Delete Loan'}
                {confirmAction.type === 'payment' && 'Make Payment'}
                {confirmAction.type === 'receive' && 'Receive Payment'}
              </h3>
              <button onClick={closeConfirmModal} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              {confirmAction.type.includes('delete') && (
                <p>
                  Are you sure you want to delete <strong>{confirmAction.name}</strong>?
                  This action cannot be undone.
                </p>
              )}
              
              {(confirmAction.type === 'payment' || confirmAction.type === 'receive') && (
                <>
                  <p>Enter payment amount for <strong>{confirmAction.name}</strong>:</p>
                  <div className="payment-input-group">
                    <span className="payment-prefix">{getCurrencySymbol()}</span> {/* FIXED: Dynamic currency */}
                    <input
                      id="paymentAmount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      max={confirmAction.remaining}
                      defaultValue={Math.min(1000, confirmAction.remaining)}
                      autoFocus
                    />
                  </div>
                  <div className="payment-info">
                    Remaining balance: {formatCurrency(confirmAction.remaining)}
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeConfirmModal} className="modal-cancel">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'debt-delete') handleDebtDelete();
                  else if (confirmAction.type === 'loan-delete') handleLendingDelete();
                  else if (confirmAction.type === 'payment') processDebtPayment();
                  else if (confirmAction.type === 'receive') processReceivePayment();
                }}
                className={`modal-confirm ${
                  confirmAction.type.includes('delete') ? 'delete' : 'confirm'
                }`}
              >
                {confirmAction.type.includes('delete') ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content history-modal">
            <div className="modal-header">
              <h3>{historyTitle}</h3>
              <button onClick={closeHistoryModal} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              {paymentHistory.length === 0 ? (
                <div className="no-history">No payment history available</div>
              ) : (
                <div className="history-list">
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="history-item">
                      <div className="history-item-header">
                        <span className="history-date">{payment.date}</span>
                        <span className="history-amount">{formatCurrency(payment.amount)}</span>
                      </div>
                      <div className="history-item-details">
                        Remaining after payment: {formatCurrency(payment.remaining || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeHistoryModal} className="modal-close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}