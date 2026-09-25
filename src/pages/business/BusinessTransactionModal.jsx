import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import './BusinessTransactionModal.css'; // SEPARATE CSS FILE

const BusinessTransactionModal = ({ type, month, year, onClose, onSave }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !formData.label || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'businessTransactions'), {
        type: type,
        label: formData.label.trim(),
        amount: parseFloat(formData.amount),
        date: formData.date,
        month: month,
        year: year,
        notes: formData.notes?.trim() || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: currentUser.uid
      });
      
      // Reset form
      setFormData({
        label: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      onSave(); // Notify parent to refresh data
      onClose(); // Close modal
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrencySymbol = () => {
    const code = localStorage.getItem("bp_currency") || "ZAR";
    switch (code) {
      case "USD": return "$";
      case "KES": return "KSh";
      case "NGN": return "₦";
      case "EUR": return "€";
      case "GBP": return "£";
      case "ZAR":
      default: return "R";
    }
  };

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="business-transaction-modal">
      {/* BACKDROP */}
      <div className="business-transaction-modal__backdrop" onClick={onClose}></div>
      
      {/* MODAL CONTENT */}
      <div className="business-transaction-modal__content">
        {/* HEADER */}
        <div className="business-transaction-modal__header">
          <div className="business-transaction-modal__header-content">
            <h2 className="business-transaction-modal__title">
              {type === 'income' ? '💰 Add Business Income' : '💸 Add Business Expense'}
            </h2>
            <p className="business-transaction-modal__subtitle">
              {type === 'income' 
                ? 'Record money coming into your business' 
                : 'Track money spent on business operations'}
            </p>
          </div>
          <button 
            className="business-transaction-modal__close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        {/* FORM */}
        <form onSubmit={handleSubmit} className="business-transaction-modal__form">
          {/* LABEL FIELD */}
          <div className="business-transaction-modal__field">
            <label className="business-transaction-modal__label">
              <span className="business-transaction-modal__label-text">
                {type === 'income' ? 'Income Source' : 'Expense Item'}
              </span>
              <span className="business-transaction-modal__required">*</span>
            </label>
            <input
              type="text"
              name="label"
              value={formData.label}
              onChange={handleChange}
              placeholder={type === 'income' 
                ? 'e.g., Completed bathroom renovation, Product sales, Service fees...' 
                : 'e.g., New power tools, Office supplies, Marketing costs...'}
              required
              className="business-transaction-modal__input"
              disabled={loading}
            />
          </div>
          
          {/* AMOUNT FIELD */}
          <div className="business-transaction-modal__field">
            <label className="business-transaction-modal__label">
              <span className="business-transaction-modal__label-text">
                Amount ({currencySymbol})
              </span>
              <span className="business-transaction-modal__required">*</span>
            </label>
            <div className="business-transaction-modal__amount-container">
              <span className="business-transaction-modal__currency-symbol">
                {currencySymbol}
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className="business-transaction-modal__input business-transaction-modal__amount-input"
                disabled={loading}
              />
            </div>
          </div>
          
          {/* DATE FIELD */}
          <div className="business-transaction-modal__field">
            <label className="business-transaction-modal__label">
              <span className="business-transaction-modal__label-text">
                Date
              </span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="business-transaction-modal__input"
              disabled={loading}
            />
          </div>
          
          {/* NOTES FIELD */}
          <div className="business-transaction-modal__field">
            <label className="business-transaction-modal__label">
              <span className="business-transaction-modal__label-text">
                Notes (Optional)
              </span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={type === 'income' 
                ? 'Client name, job details, invoice number...' 
                : 'Supplier details, receipt number, purchase reason...'}
              rows="3"
              className="business-transaction-modal__textarea"
              disabled={loading}
            />
          </div>
          
          {/* FOOTER ACTIONS */}
          <div className="business-transaction-modal__footer">
            <button 
              type="button" 
              className="business-transaction-modal__btn business-transaction-modal__btn--cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`business-transaction-modal__btn business-transaction-modal__btn--save business-transaction-modal__btn--${type}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="business-transaction-modal__spinner"></span>
                  Saving...
                </>
              ) : (
                `Save ${type === 'income' ? 'Income' : 'Expense'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessTransactionModal;