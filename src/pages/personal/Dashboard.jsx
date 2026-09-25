import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { canExportPDF } from "../../utils/subscription.js";
import { getCurrencySymbol } from "../../utils/currencyUtils.js";

import { useUser } from "../../hooks/useUser";

// Add this import with other imports
import { useFinance } from "../../context/FinanceContext.jsx";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../../firebase/config.js";
import jsPDF from "jspdf";
import AccountTypeSwitcher from "../../components/account/AccountTypeSwitcher.jsx";
import AppToast from "../../components/AppToast.jsx";
import "./Dashboard.css";

// ------------------------------
// DELETE CONFIRMATION MODAL COMPONENT
// ------------------------------
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemType, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h3>Confirm Delete</h3>
        </div>
        <div className="delete-modal-content">
          <p>Are you sure you want to delete this {itemType}?</p>
          {itemName && (
            <p className="delete-item-name">"{itemName}"</p>
          )}
        </div>
        <div className="delete-modal-actions">
          <button 
            className="delete-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="delete-modal-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// CENTERED SUCCESS MODAL COMPONENT
// ------------------------------
const SuccessModal = ({ isOpen, onClose, message }) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className="success-modal-content">
          <div className="success-icon">✅</div>
          <p className="success-message">{message}</p>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// IN-APP UPGRADE BANNER COMPONENT
// ------------------------------
const UpgradeBanner = ({ onDismiss }) => {
  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-content">
        <span className="upgrade-banner-icon">🔒</span>
        <span className="upgrade-banner-text">
          Upgrade to Professional plan to access Business Profile features
        </span>
        <button onClick={onDismiss} className="upgrade-banner-close">×</button>
      </div>
    </div>
  );
};

// ------------------------------
// UPGRADE REQUIRED MODAL COMPONENT
// ------------------------------
const UpgradeModal = ({ isOpen, onClose, onUpgrade, message }) => {
  if (!isOpen) return null;

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-modal-header">
          <h2 className="upgrade-modal-title">🔒 Feature Locked</h2>
          <p className="upgrade-modal-subtitle">{message || "Upgrade required to continue"}</p>
        </div>
        
        <div className="upgrade-modal-content">
          <div className="upgrade-icon">🚀</div>
          <p className="upgrade-main-message">
            Upgrade to a paid plan to unlock unlimited tracking and advanced features.
          </p>
          
          <div className="upgrade-feature-list">
            <div className="upgrade-feature-item">✓ Unlimited income & expense tracking</div>
            <div className="upgrade-feature-item">✓ Advanced analytics & reports</div>
            <div className="upgrade-feature-item">✓ PDF export capabilities</div>
            <div className="upgrade-feature-item">✓ Business mode (Professional plan)</div>
            <div className="upgrade-feature-item">✓ Priority support</div>
          </div>
        </div>
        
        <div className="upgrade-modal-actions">
          <button 
            className="upgrade-action-btn cancel-btn"
            onClick={onClose}
          >
            Maybe Later
          </button>
          <button 
            className="upgrade-action-btn upgrade-btn"
            onClick={onUpgrade}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// BUSINESS UPGRADE MODAL COMPONENT
// ------------------------------
const BusinessUpgradeModal = ({ onClose, onUpgrade, onCancel }) => {
  return (
    <div className="business-upgrade-modal-overlay" onClick={onClose}>
      <div className="business-upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="business-modal-header">
          <h2 className="business-modal-title">🔒 Business Account Locked</h2>
          <p className="business-modal-subtitle">Upgrade to Professional plan to unlock business features</p>
        </div>
        
        <div className="business-modal-features">
          <div className="business-feature-list">
            <div className="business-feature">Track business income and expenses separately</div>
            <div className="business-feature">Create and manage invoices & quotations</div>
            <div className="business-feature">Get a clear overview of your business performance</div>
            <div className="business-feature">Keep personal and business finances organized</div>
          </div>
        </div>
        
        <div className="business-modal-cta">
          <p className="upgrade-cta-text">👉 Upgrade to Professional to unlock Business</p>
        </div>
        
        <div className="business-modal-actions">
          <button 
            className="business-action-btn stay-basic-btn"
            onClick={onCancel}
          >
            Stay on Basic
          </button>
          <button 
            className="business-action-btn upgrade-now-btn"
            onClick={onUpgrade}
          >
            Upgrade to Professional
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------
// HELPER FUNCTIONS FOR SETTINGS INTEGRATION
// ------------------------------

// 1. GREETING NAME HELPER - ENHANCED
function getDisplayName(currentUser) {
  const storedName = localStorage.getItem("bp_profile_name");
  if (storedName && storedName.trim().length > 0) return storedName;
  if (currentUser?.displayName) return currentUser.displayName;
  if (currentUser?.name) return currentUser.name;
  if (currentUser?.email) return currentUser.email.split("@")[0];
  return "there";
}

// 3. DATE FORMAT HELPER
function formatDateWithPreference(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const format = localStorage.getItem("bp_date_format") || "DD/MM/YYYY";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

// ------------------------------
// CONSTANTS
// ------------------------------

export const HEADER_MESSAGES = [
  "Track your money confidently 💡",
  "Small steps today build financial freedom tomorrow 📈",
  "Stay consistent — your money will follow your discipline 💰",
  "Your goals are valid. Keep pushing 🔥",
  "Control your money — don't let it control you 🧠"
];

export const DID_YOU_KNOW_MESSAGES = [
  "💡 Track every expense to see powerful spending patterns!",
  "🎯 Try saving 20% of your income this month!",
  "📈 People who track finances save 3x more!",
  "🚀 Upgrade to Pro for advanced analytics!",
  "💪 Consistency is the key to financial success!",
  "💰 Tracking money makes you the CEO of your finances!"
];

export const MOTIVATIONAL_MESSAGES = [
  "Tracking today builds your freedom tomorrow.",
  "Small money habits create big financial wins.",
  "Consistency beats motivation every time.",
  "Your future self will thank you for tracking.",
  "Wealth grows where attention goes.",
  "Progress, not perfection.",
  "Every rand tracked is a step forward.",
  "Your money reflects your priorities.",
  "Discipline is choosing what you want most over what you want now.",
  "Financial confidence starts with awareness."
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const YEARS = ["2024", "2025", "2026", "2027"];

export const currentMonth = MONTHS[new Date().getMonth()];
export const currentYear = new Date().getFullYear().toString();

// ------------------------------
// PDF GENERATOR WITH JSPDF - FIXED COLUMNS (UPDATED FOR SETTINGS)
// ------------------------------

const generatePDF = (data, type, month, year) => {
  if (data.length === 0) {
    alert(`No ${type} data to export for ${month} ${year}`);
    return false;
  }

  // Get currency symbol from settings
  const currencySymbol = getCurrencySymbol();

  // Create a new jsPDF instance
  const pdfDoc = new jsPDF();
  
  // Set document properties
  pdfDoc.setProperties({
    title: `BudgetPro ${type} Report - ${month} ${year}`,
    subject: 'Financial Report',
    author: 'BudgetPro',
    keywords: 'budget, finance, report, income, expenses',
    creator: 'BudgetPro Web App'
  });
  
  // Fix header text based on report type
  let reportTitle = '';
  if (type === "income") {
    reportTitle = "BUDGETPRO INCOME REPORT";
  } else if (type === "expenses") {
    reportTitle = "BUDGETPRO EXPENSE REPORT";
  } else if (type === "full-report") {
    reportTitle = "BUDGETPRO FULL FINANCIAL REPORT";
  }
  
  // Add title
  pdfDoc.setFontSize(18);
  pdfDoc.setTextColor(0, 0, 0);
  pdfDoc.text(reportTitle, 105, 20, { align: 'center' });
  
  // Add period
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(100, 100, 100);
  pdfDoc.text(`Period: ${month} ${year}`, 105, 30, { align: 'center' });
  
  // Add generation date
  pdfDoc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 36, { align: 'center' });
  
  // Add line separator
  pdfDoc.setDrawColor(200, 200, 200);
  pdfDoc.line(20, 42, 190, 42);
  
  // Set up table with proper column spacing
  let yPosition = 50;
  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(0, 0, 0);
  
  // Column positions - NEW ORDER: Date → Description → Amount
  const colDate = 25;
  const colDesc = 70;
  const colAmount = 180;
  
  if (type === "full-report") {
    // Split data into income and expenses for full report
    const incomeItems = data.filter(item => item.type === "income");
    const expenseItems = data.filter(item => item.type === "expense");
    
    let totalIncome = 0;
    let totalExpenses = 0;
  // INCOME SECTION
if (incomeItems.length > 0) {
  // Add section title
  pdfDoc.setFontSize(14);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("INCOME SECTION", 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Add table headers with new column order
  pdfDoc.setFillColor(240, 240, 240);
  pdfDoc.rect(20, yPosition - 5, 170, 8, 'F');
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Date", colDate, yPosition);
  pdfDoc.text("Description", colDesc, yPosition);
  pdfDoc.text(`Amount (${currencySymbol})`, colAmount, yPosition, { align: "right" });
  pdfDoc.setFont("helvetica", "normal");
  yPosition += 10;
  
  // Add income rows with new column order
  incomeItems.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > 270) {
      pdfDoc.addPage();
      yPosition = 20;
      
      // Redraw headers on new page
      pdfDoc.setFillColor(240, 240, 240);
      pdfDoc.rect(20, yPosition - 5, 170, 8, 'F');
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.text("Date", colDate, yPosition + 10);
      pdfDoc.text("Description", colDesc, yPosition + 10);
      pdfDoc.text(`Amount (${currencySymbol})`, colAmount, yPosition + 10, { align: "right" });
      pdfDoc.setFont("helvetica", "normal");
      yPosition += 20;
    }
    
    const description = item.source?.substring(0, 40) || "Income";
    const amount = parseFloat(item.amount || 0);
    totalIncome += amount;
    const amountFormatted = amount.toFixed(2);
    const date = formatDateWithPreference(item.date);
    
    pdfDoc.text(date, colDate, yPosition);
    pdfDoc.text(description, colDesc, yPosition);
    pdfDoc.text(`${currencySymbol} ${amountFormatted}`, colAmount, yPosition, { align: "right" });
    
    yPosition += 7;
  });
  
  // Add income total
  yPosition += 5;
  pdfDoc.setDrawColor(200, 200, 200);
  pdfDoc.line(20, yPosition, 190, yPosition);
  
  yPosition += 8;
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Total Income:", colAmount - 50, yPosition); // CHANGED: -40 to -50
  pdfDoc.text(`${currencySymbol} ${totalIncome.toFixed(2)}`, colAmount, yPosition, { align: "right" });
  
  // Add vertical spacing between sections
  yPosition += 15;
}

// EXPENSE SECTION
if (expenseItems.length > 0) {
  // Add section title
  pdfDoc.setFontSize(14);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("EXPENSE SECTION", 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  // Add table headers with new column order
  pdfDoc.setFillColor(240, 240, 240);
  pdfDoc.rect(20, yPosition - 5, 170, 8, 'F');
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Date", colDate, yPosition);
  pdfDoc.text("Description", colDesc, yPosition);
  pdfDoc.text(`Amount (${currencySymbol})`, colAmount, yPosition, { align: "right" });
  pdfDoc.setFont("helvetica", "normal");
  yPosition += 10;
  
  // Add expense rows with new column order
  expenseItems.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > 270) {
      pdfDoc.addPage();
      yPosition = 20;
      
      // Redraw headers on new page
      pdfDoc.setFillColor(240, 240, 240);
      pdfDoc.rect(20, yPosition - 5, 170, 8, 'F');
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.text("Date", colDate, yPosition + 10);
      pdfDoc.text("Description", colDesc, yPosition + 10);
      pdfDoc.text(`Amount (${currencySymbol})`, colAmount, yPosition + 10, { align: "right" });
      pdfDoc.setFont("helvetica", "normal");
      yPosition += 20;
    }
    
    const description = item.description?.substring(0, 40) || "Expense";
    const amount = parseFloat(item.amount || 0);
    totalExpenses += amount;
    const amountFormatted = amount.toFixed(2);
    const date = formatDateWithPreference(item.date);
    
    pdfDoc.text(date, colDate, yPosition);
    pdfDoc.text(description, colDesc, yPosition);
    pdfDoc.text(`${currencySymbol} ${amountFormatted}`, colAmount, yPosition, { align: "right" });
    
    yPosition += 7;
  });
  
  // Add expense total
  yPosition += 5;
  pdfDoc.setDrawColor(200, 200, 200);
  pdfDoc.line(20, yPosition, 190, yPosition);
  
  yPosition += 8;
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Total Expenses:", colAmount - 55, yPosition); // CHANGED: -40 to -55
  pdfDoc.text(`${currencySymbol} ${totalExpenses.toFixed(2)}`, colAmount, yPosition, { align: "right" });
  
  // Add vertical spacing before net balance
  yPosition += 15;
  
  // ===== FINAL NET BALANCE (CLEAN & ALIGNED) =====
  pdfDoc.setDrawColor(0, 0, 0);
  pdfDoc.setLineWidth(0.5);
  pdfDoc.line(20, yPosition, 190, yPosition);

  yPosition += 12;

  const netBalance = totalIncome - totalExpenses;
  pdfDoc.setFontSize(12);
  pdfDoc.setFont(undefined, "bold");

  // LEFT side label
  pdfDoc.text("NET BALANCE:", 25, yPosition); // CHANGED: 20 to 25

  // RIGHT side value
  pdfDoc.text(`${currencySymbol} ${netBalance.toFixed(2)}`, 190, yPosition, { align: "right" });
}
    
  } else {
    // Regular single-section report (income or expenses only)
    // Add table headers with new column order
    pdfDoc.setFillColor(240, 240, 240);
    pdfDoc.rect(20, yPosition - 5, 170, 8, 'F');
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Date", colDate, yPosition);
    pdfDoc.text("Description", colDesc, yPosition);
    pdfDoc.text(`Amount (${currencySymbol})`, colAmount, yPosition, { align: "right" });
    pdfDoc.setFont("helvetica", "normal");
    yPosition += 10;
    
    // Add data rows with new column order
    let total = 0;
    data.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        pdfDoc.addPage();
        yPosition = 20;
        
        // Redraw headers on new page
        pdfDoc.setFillColor(240, 240, 240);
        pdfDoc.rect(20, yPosition - 5, 170, 8, 'F');
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Date", colDate, yPosition + 10);
        pdfDoc.text("Description", colDesc, yPosition + 10);
        pdfDoc.text(`Amount (${currencySymbol})`, colAmount, yPosition + 10, { align: "right" });
        pdfDoc.setFont("helvetica", "normal");
        yPosition += 20;
      }
      
      const description = type === "income" 
        ? (item.source?.substring(0, 40) || "Income")
        : (item.description?.substring(0, 40) || "Expense");
      const amount = parseFloat(item.amount || 0);
      total += amount;
      const amountFormatted = amount.toFixed(2);
      const date = formatDateWithPreference(item.date);
      
      pdfDoc.text(date, colDate, yPosition);
      pdfDoc.text(description, colDesc, yPosition);
      pdfDoc.text(`${currencySymbol} ${amountFormatted}`, colAmount, yPosition, { align: "right" });
      
      yPosition += 7;
    });
    
    // Add total
    yPosition += 5;
    pdfDoc.setDrawColor(200, 200, 200);
    pdfDoc.line(20, yPosition, 190, yPosition);
    
    yPosition += 8;
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Total:", colAmount - 30, yPosition);
    pdfDoc.text(`${currencySymbol} ${total.toFixed(2)}`, colAmount, yPosition, { align: "right" });
  }
  
  // Add footer
  yPosition = 280;
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(150, 150, 150);
  pdfDoc.text("--- Generated by BudgetPro ---", 105, yPosition, { align: 'center' });
  
  // Save the PDF
  pdfDoc.save(`BudgetPro-${type}-${month}-${year}.pdf`);
  return true;
};

// ------------------------------
// FIRESTORE HELPERS
// ------------------------------

const getIncomeCollectionRef = (uid) =>
  collection(db, "users", uid, "income");

const getExpenseCollectionRef = (uid) =>
  collection(db, "users", uid, "expenses");

async function loadRecords(type, uid) {
  if (!uid) return [];

  const ref =
    type === "income"
      ? getIncomeCollectionRef(uid)
      : getExpenseCollectionRef(uid);

  const snap = await getDocs(ref);
  const records = [];

  snap.forEach((doc) => records.push({ id: doc.id, ...doc.data() }));
  return records;
}

async function saveRecord(type, data, uid) {
  if (!uid) return false;

  const ref =
    type === "income"
      ? getIncomeCollectionRef(uid)
      : getExpenseCollectionRef(uid);

  // Separate the ID from the data for Firestore
  const { id, ...firestoreData } = data;

  if (id && !id.startsWith("temp_")) {
    // Update existing document
    await updateDoc(doc(ref, id), {
      ...firestoreData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } else {
    // Create new document
    const newDoc = doc(ref);
    await setDoc(newDoc, {
      ...firestoreData,
      id: newDoc.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  }
}

async function deleteRecord(type, id, uid) {
  if (!uid || id.startsWith("temp_")) return false;

  const ref =
    type === "income"
      ? getIncomeCollectionRef(uid)
      : getExpenseCollectionRef(uid);

  await deleteDoc(doc(ref, id));
  return true;
}

function filterByMonth(list, month, year) {
  return list.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getMonth() === MONTHS.indexOf(month) &&
      d.getFullYear() === parseInt(year)
    );
  });
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getFirstDayOf(month, year) {
  const m = (MONTHS.indexOf(month) + 1).toString().padStart(2, "0");
  return `${year}-${m}-01`;
}

// ------------------------------
// DUPLICATE CLEANUP FUNCTION
// ------------------------------

const cleanDuplicates = async (type, uid) => {
  if (!uid) return;
  
  try {
    const records = await loadRecords(type, uid);
    
    // Create a map to find duplicates
    const recordsMap = new Map();
    const duplicatesToDelete = [];
    
    records.forEach(record => {
      // Create a unique key based on date + source/description
      const key = type === "income" 
        ? `${record.date}_${record.source?.trim()?.toLowerCase()}`
        : `${record.date}_${record.description?.trim()?.toLowerCase()}`;
      
      if (recordsMap.has(key)) {
        // Compare createdAt dates
        const existing = recordsMap.get(key);
        const currentDate = record.createdAt ? new Date(record.createdAt) : new Date(0);
        const existingDate = existing.createdAt ? new Date(existing.createdAt) : new Date(0);
        
        if (currentDate > existingDate) {
          // Current record is newer, mark existing for deletion
          duplicatesToDelete.push(existing);
          recordsMap.set(key, record);
        } else {
          // Existing record is newer or same, mark current for deletion
          duplicatesToDelete.push(record);
        }
      } else {
        // First occurrence of this key
        recordsMap.set(key, record);
      }
    });
    
    // Delete all identified duplicates
    if (duplicatesToDelete.length > 0) {
      const ref = type === "income" 
        ? getIncomeCollectionRef(uid)
        : getExpenseCollectionRef(uid);
      
      // Delete in parallel for efficiency
      const deletePromises = duplicatesToDelete.map(record => 
        deleteDoc(doc(ref, record.id))
      );
      
      await Promise.all(deletePromises);
      console.log(`✅ Cleaned ${duplicatesToDelete.length} duplicate ${type} records`);
    }
    
    // Return the cleaned records (only the ones we kept)
    return Array.from(recordsMap.values());
    
  } catch (error) {
    console.error(`Error cleaning ${type} duplicates:`, error);
    return null;
  }
};

// ------------------------------
// PERSONAL DASHBOARD COMPONENT
// ------------------------------

const PersonalDashboard = ({
  month, year, setMonth, setYear,
  incomeForm, setIncomeForm,
  expenseForm, setExpenseForm,
  editingIncomeId, editingExpenseId,
  incomeList, expenseList,
  setIncomeList, setExpenseList,
  setEditingIncomeId, setEditingExpenseId,
  isMobile, showExportMenu, setShowExportMenu,
  currentUser, navigate, loading,
  didYouKnow,
  motivationalMessage,
  accountType,
  onSwitchAccount,
  showUpgradeBanner,
  onDismissUpgradeBanner
}) => {

  const currencySymbol = getCurrencySymbol();
  const { recalculateFinance, getNotificationsByScope } = useFinance();
  const dashboardNotifications = getNotificationsByScope('dashboard');
  const currentNotification = dashboardNotifications.length > 0 
    ? dashboardNotifications[0].message 
    : didYouKnow;

  const incomeFormRef = useRef(null);
  const expenseFormRef = useRef(null);

  // State for modals
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemType: null,
    itemName: null
  });

  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: ""
  });

  // Add state for upgrade modal
  const [upgradeModal, setUpgradeModal] = useState({
    isOpen: false,
    message: ""
  });

  const [expandedLog, setExpandedLog] = useState(null);

  const getCurrentMonth = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  const getSmartDate = () => {
    const now = new Date();
    const isCurrent =
      month === MONTHS[now.getMonth()] &&
      year === now.getFullYear().toString();

    if (isCurrent) return getCurrentDate();
    return getFirstDayOf(month, year);
  };

  const validateForm = (form, type) => {
    const errors = [];

    if (!form.amount || parseFloat(form.amount) <= 0)
      errors.push("Amount must be greater than 0");

    if (type === "income" && !form.source?.trim())
      errors.push("Income source is required");

    if (type === "expense" && !form.description?.trim())
      errors.push("Expense description is required");

    if (!form.date) errors.push("Date is required");

    return errors;
  };

  // ✅ CHANGED: Add helper functions for free limit checking
  const checkFreeLimit = async () => {
    const plan = localStorage.getItem("budgetPro_plan") || "free";
    
    if (plan !== "free") return false; // Paid users have no limits
    
    if (!currentUser?.uid) return false;
    
    try {
      // Fetch user document to get actual transactionCount and hasUpgradedBefore
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      const transactionCount = userData.transactionCount || 0;
      const hasUpgradedBefore = userData.hasUpgradedBefore || false;
      const userPlan = userData.plan || "free";
      
      // DOWGRADED USER: Block immediately (no grace period)
      if (hasUpgradedBefore && userPlan === "free") {
        setUpgradeModal({
          isOpen: true,
          message: "You've reached the limit for free plan users. Upgrade to continue tracking."
        });
        return true; // Block submission
      }
      
      // NEW FREE USER: Check if they've hit 10 entries
      if (!hasUpgradedBefore && transactionCount >= 10) {
        setUpgradeModal({
          isOpen: true,
          message: "You have hit your free limit. Please upgrade to keep tracking."
        });
        return true; // Block submission
      }
      
      return false; // Allow submission
      
    } catch (error) {
      console.error("Error checking free limit:", error);
      return false; // Allow submission on error
    }
  };

  // ✅ CHANGED: Add function to increment transactionCount
  const incrementTransactionCount = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentCount = userData.transactionCount || 0;
        
        await updateDoc(userDocRef, {
          transactionCount: currentCount + 1
        });
        
        console.log(`✅ Incremented transactionCount to ${currentCount + 1}`);
      }
    } catch (error) {
      console.error("Error incrementing transactionCount:", error);
    }
  };

  const filteredIncome = useMemo(() => {
    const f = filterByMonth(incomeList, month, year);
    return f.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [incomeList, month, year]);

  const filteredExpenses = useMemo(() => {
    const f = filterByMonth(expenseList, month, year);
    return f.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenseList, month, year]);

  const totals = useMemo(() => ({
    totalIncome: filteredIncome.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    totalExpenses: filteredExpenses.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    balance: filteredIncome.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
             - filteredExpenses.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
  }), [filteredIncome, filteredExpenses]);

  useEffect(() => {
    if (filteredIncome.length > 0 || filteredExpenses.length > 0) {
      recalculateFinance(filteredIncome, filteredExpenses);
    }
  }, [filteredIncome, filteredExpenses, recalculateFinance]);

  // PDF Export Functions (No upgrade checks)
  const exportIncomePDF = () => {
    if (filteredIncome.length === 0) {
      alert(`No income data to export for ${month} ${year}`);
      return;
    }
    
    generatePDF(filteredIncome, "income", month, year);
    setShowExportMenu(false);
  };

  const exportExpensePDF = () => {
    if (filteredExpenses.length === 0) {
      alert(`No expense data to export for ${month} ${year}`);
      return;
    }
    
    generatePDF(filteredExpenses, "expenses", month, year);
    setShowExportMenu(false);
  };

  const exportFullPDF = () => {
    if (filteredIncome.length === 0 && filteredExpenses.length === 0) {
      alert(`No data to export for ${month} ${year}`);
      return;
    }
    
    const fullData = [
      ...filteredIncome.map(item => ({ ...item, type: "income" })),
      ...filteredExpenses.map(item => ({ ...item, type: "expense" }))
    ];
    
    generatePDF(fullData, "full-report", month, year);
    setShowExportMenu(false);
  };

  const handleMobileExport = (type) => {
    switch(type) {
      case 'income':
        if (filteredIncome.length === 0) {
          alert(`No income data to export for ${month} ${year}`);
          return;
        }
        generatePDF(filteredIncome, "income", month, year);
        break;
      case 'expense':
        if (filteredExpenses.length === 0) {
          alert(`No expense data to export for ${month} ${year}`);
          return;
        }
        generatePDF(filteredExpenses, "expenses", month, year);
        break;
      case 'full':
        if (filteredIncome.length === 0 && filteredExpenses.length === 0) {
          alert(`No data to export for ${month} ${year}`);
          return;
        }
        const fullData = [
          ...filteredIncome.map(item => ({ ...item, type: "income" })),
          ...filteredExpenses.map(item => ({ ...item, type: "expense" }))
        ];
        generatePDF(fullData, "full-report", month, year);
        break;
    }
    
    setShowExportMenu(false);
  };

  // Add these functions to PersonalDashboard section:

  const handleMobileAddIncome = () => {
    if (isMobile && incomeFormRef.current) {
      const elementPosition = incomeFormRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleMobileAddExpense = () => {
    if (isMobile && expenseFormRef.current) {
      const elementPosition = expenseFormRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 100;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Delete functions with modal
  const deleteIncome = async (id) => {
    const item = incomeList.find((i) => i.id === id);
    if (!item) return;

    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemType: 'income',
      itemName: item.source
    });
  };

  const deleteExpense = async (id) => {
    const item = expenseList.find((x) => x.id === id);
    if (!item) return;

    setDeleteModal({
      isOpen: true,
      itemId: id,
      itemType: 'expense',
      itemName: item.description
    });
  };

  const handleConfirmDelete = async () => {
    const { itemId, itemType } = deleteModal;
    
    setDeleteModal({ isOpen: false, itemId: null, itemType: null, itemName: null });

    if (itemType === 'income') {
      const filtered = incomeList.filter((i) => i.id !== itemId);
      setIncomeList(filtered);
      
      if (currentUser?.uid && !itemId.startsWith("temp_")) {
        const success = await deleteRecord("income", itemId, currentUser.uid);
        if (!success) {
          alert("Error deleting income.");
          const originalData = await loadRecords("income", currentUser.uid);
          setIncomeList(originalData);
        }
      }
    } else if (itemType === 'expense') {
      const filtered = expenseList.filter((x) => x.id !== itemId);
      setExpenseList(filtered);
      
      if (currentUser?.uid && !itemId.startsWith("temp_")) {
        const success = await deleteRecord("expense", itemId, currentUser.uid);
        if (!success) {
          alert("Error deleting expense.");
          const originalData = await loadRecords("expense", currentUser.uid);
          setExpenseList(originalData);
        }
      }
    }
  };

  const handleDeleteFromModal = (type, id) => {
    if (type === 'income') {
      const item = incomeList.find((i) => i.id === id);
      setDeleteModal({
        isOpen: true,
        itemId: id,
        itemType: 'income',
        itemName: item?.source
      });
    } else {
      const item = expenseList.find((x) => x.id === id);
      setDeleteModal({
        isOpen: true,
        itemId: id,
        itemType: 'expense',
        itemName: item?.description
      });
    }
  };

  // ✅ CHANGED: Updated handleIncomeSubmit with new free limit logic
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Check free limits BEFORE validation
    const shouldBlock = await checkFreeLimit();
    if (shouldBlock) return;

    const errors = validateForm(incomeForm, "income");
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const newIncome = {
      ...incomeForm,
      amount: parseFloat(incomeForm.amount).toFixed(2)
    };

    if (editingIncomeId) {
      const incomeWithId = {
        ...newIncome,
        id: editingIncomeId
      };

      setIncomeList(incomeList.map((i) => 
        i.id === editingIncomeId ? incomeWithId : i
      ));
      setEditingIncomeId(null);

      if (currentUser?.uid) {
        const success = await saveRecord("income", incomeWithId, currentUser.uid);
        if (success) {
          const freshIncome = await loadRecords("income", currentUser.uid);
          setIncomeList(freshIncome);
          setSuccessModal({
            isOpen: true,
            message: "Successfully updated."
          });
        } else {
          alert("Error updating income.");
          const originalData = await loadRecords("income", currentUser.uid);
          setIncomeList(originalData);
        }
      }
    } else {
      const tempId = `temp_${Date.now()}`;
      const tempIncome = { ...newIncome, id: tempId };
      setIncomeList([...incomeList, tempIncome]);

      if (currentUser?.uid) {
        try {
          const success = await saveRecord("income", newIncome, currentUser.uid);
          if (success) {
            // ✅ INCREMENT TRANSACTION COUNT FOR NEW ENTRIES ONLY
            await incrementTransactionCount();
            
            const freshIncome = await loadRecords("income", currentUser.uid);
            setIncomeList(freshIncome);
            setSuccessModal({
              isOpen: true,
              message: "Income successfully added."
            });
          } else {
            alert("Error saving income.");
            setIncomeList(incomeList.filter(item => item.id !== tempId));
          }
        } catch (error) {
          console.error("Error saving income:", error);
          
          // Check if it's the free plan limit error from Firestore rules
          if (error.message && error.message.includes("Free plan limit reached")) {
            setUpgradeModal({
              isOpen: true,
              message: "You have hit your free limit. Please upgrade to keep tracking."
            });
          } else {
            alert("Error saving income.");
          }
          
          setIncomeList(incomeList.filter(item => item.id !== tempId));
        }
      }
    }

    setIncomeForm({ date: getSmartDate(), source: "", amount: "" });
  };

  // ✅ CHANGED: Updated handleExpenseSubmit with new free limit logic
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Check free limits BEFORE validation
    const shouldBlock = await checkFreeLimit();
    if (shouldBlock) return;

    const errors = validateForm(expenseForm, "expense");
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const newExpense = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount).toFixed(2)
    };

    if (editingExpenseId) {
      const expenseWithId = {
        ...newExpense,
        id: editingExpenseId
      };

      setExpenseList(expenseList.map((x) =>
        x.id === editingExpenseId ? expenseWithId : x
      ));
      setEditingExpenseId(null);

      if (currentUser?.uid) {
        const success = await saveRecord("expense", expenseWithId, currentUser.uid);
        if (success) {
          const freshExpenses = await loadRecords("expense", currentUser.uid);
          setExpenseList(freshExpenses);
          setSuccessModal({
            isOpen: true,
            message: "Successfully updated."
          });
        } else {
          alert("Error updating expense.");
          const originalData = await loadRecords("expense", currentUser.uid);
          setExpenseList(originalData);
        }
      }
    } else {
      const tempId = `temp_${Date.now()}`;
      const tempExpense = { ...newExpense, id: tempId };
      setExpenseList([...expenseList, tempExpense]);

      if (currentUser?.uid) {
        try {
          const success = await saveRecord("expense", newExpense, currentUser.uid);
          if (success) {
            // ✅ INCREMENT TRANSACTION COUNT FOR NEW ENTRIES ONLY
            await incrementTransactionCount();
            
            const freshExpenses = await loadRecords("expense", currentUser.uid);
            setExpenseList(freshExpenses);
            setSuccessModal({
              isOpen: true,
              message: "Expense successfully added."
            });
          } else {
            alert("Error saving expense.");
            setExpenseList(expenseList.filter(item => item.id !== tempId));
          }
        } catch (error) {
          console.error("Error saving expense:", error);
          
          // Check if it's the free plan limit error from Firestore rules
          if (error.message && error.message.includes("Free plan limit reached")) {
            setUpgradeModal({
              isOpen: true,
              message: "You have hit your free limit. Please upgrade to keep tracking."
            });
          } else {
            alert("Error saving expense.");
          }
          
          setExpenseList(expenseList.filter(item => item.id !== tempId));
        }
      }
    }

    setExpenseForm({
      date: getSmartDate(),
      description: "",
      amount: "",
      category: "Food & Groceries",
      type: "Need"
    });
  };

  const editIncome = (id) => {
    const i = incomeList.find((x) => x.id === id);
    if (!i) return;

    setIncomeForm({ date: i.date, source: i.source, amount: i.amount });
    setEditingIncomeId(id);
    setEditingExpenseId(null);

    setExpenseForm({
      date: getSmartDate(),
      description: "",
      amount: "",
      category: "Food & Groceries",
      type: "Need"
    });

    setTimeout(() => {
      if (incomeFormRef.current && isMobile) {
        const elementPosition = incomeFormRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else if (incomeFormRef.current) {
        incomeFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 50);
  };

  const editExpense = (id) => {
    const x = expenseList.find((t) => t.id === id);
    if (!x) return;

    setExpenseForm({
      date: x.date,
      description: x.description,
      amount: x.amount,
      category: x.category,
      type: x.type
    });

    setEditingExpenseId(id);
    setEditingIncomeId(null);

    setIncomeForm({ date: getSmartDate(), source: "", amount: "" });

    setTimeout(() => {
      if (expenseFormRef.current && isMobile) {
        const elementPosition = expenseFormRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else if (expenseFormRef.current) {
        expenseFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 50);
  };

  const cancelEdit = () => {
    setEditingIncomeId(null);
    setEditingExpenseId(null);

    setIncomeForm({
      date: getSmartDate(),
      source: "",
      amount: ""
    });

    setExpenseForm({
      date: getSmartDate(),
      description: "",
      amount: "",
      category: "Food & Groceries",
      type: "Need"
    });
  };

  const formatDate = (dateString) => {
    return formatDateWithPreference(dateString);
  };

  const toggleLogExpansion = (logType) => {
    if (expandedLog === logType) {
      setExpandedLog(null);
    } else {
      setExpandedLog(logType);
    }
  };

  const handleEditFromModal = (type, id) => {
    if (type === 'income') {
      editIncome(id);
    } else {
      editExpense(id);
    }
    setExpandedLog(null);
  };

  return (
    <div className="dashboard-page personal-dashboard">
      {/* UPGRADE BANNER */}
      {showUpgradeBanner && (
        <UpgradeBanner onDismiss={onDismissUpgradeBanner} />
      )}

      {/* BLUE HEADER SECTION */}
      <div className="dashboard-header-section">
        <div className="header-content">
          <div className="welcome-message">
            <h2>Hello {getDisplayName(currentUser)}</h2>
            <div className="motivational-message">
              {motivationalMessage}
            </div>
          </div>

          <div className="notification-text">
            {currentNotification}
          </div>

          <div className="account-switcher-section">
            <div className="switch-account-title">Switch Account</div>
            <AccountTypeSwitcher
              accountType={accountType}
              showIcons={false}
              onChange={onSwitchAccount}
            />
          </div>
        </div>
      </div>
      
      <div className={`dashboard-content ${expandedLog ? 'modal-open' : ''}`}>
        <div className="left-panel">
          <div className="control-panel period-selection">
            <h3>Select Period</h3>

            <div className="period-controls-inline">
              <div className="period-control-column">
                <label>Month</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} disabled={expandedLog}>
                  {MONTHS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="period-control-column">
                <label>Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} disabled={expandedLog}>
                  {YEARS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* MOBILE ADD BUTTONS */}
            <div className="mobile-add-buttons">
              <button 
                className="mobile-add-btn income-btn"
                onClick={handleMobileAddIncome}
                disabled={expandedLog}
              >
                + Add Income
              </button>
              <button 
                className="mobile-add-btn expense-btn"
                onClick={handleMobileAddExpense}
                disabled={expandedLog}
              >
                + Add Expense
              </button>
            </div>

            {!isMobile && (
              <div className="export-section">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="export-toggle-btn"
                  disabled={expandedLog}
                >
                  📊 Export Reports
                </button>

                {showExportMenu && (
                  <div className="export-menu">
                    <button onClick={exportIncomePDF} className="export-menu-btn income" disabled={expandedLog}>Income PDF</button>
                    <button onClick={exportExpensePDF} className="export-menu-btn expense" disabled={expandedLog}>Expense PDF</button>
                    <button onClick={exportFullPDF} className="export-menu-btn upgrade" disabled={expandedLog}>Full PDF Report</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="summary-panel">
            <h3>{month} Summary</h3>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="summary-cards">
                <div className="summary-card income">
                  <div className="summary-label">Total Income</div>
                  <div className="summary-value income-color">
                    {currencySymbol} {totals.totalIncome.toFixed(2)}
                  </div>
                </div>

                <div className="summary-card expense">
                  <div className="summary-label">Total Expenses</div>
                  <div className="summary-value expense-color">
                    {currencySymbol} {totals.totalExpenses.toFixed(2)}
                  </div>
                </div>

                <div className="summary-card balance">
                  <div className="summary-label">Balance Left</div>
                  <div
                    className={`summary-value ${
                      totals.balance >= 0 ? "income-color" : "expense-color"
                    }`}
                  >
                    {currencySymbol} {totals.balance.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="forms-row">
            <div className="form-card income-form" ref={incomeFormRef}>
              <div className="form-header">
                <h3 className="income-color">
                  {editingIncomeId ? "Edit Income" : "+ Add Income"}
                  {editingIncomeId && <span className="editing-badge">✏️ editing…</span>}
                </h3>
                <span>💰</span>
              </div>

              <form onSubmit={handleIncomeSubmit}>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    required
                    disabled={expandedLog}
                  />
                </div>

                <div className="form-group">
                  <label>Source *</label>
                  <input
                    type="text"
                    placeholder="Salary, Business, etc."
                    value={incomeForm.source}
                    onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                    required
                    disabled={expandedLog}
                  />
                </div>

                <div className="form-group">
                  <label>Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    required
                    disabled={expandedLog}
                  />
                </div>

                <button type="submit" className="submit-btn income-btn" disabled={expandedLog}>
                  {editingIncomeId ? "Update Income" : "+ Add Income"}
                </button>

                {editingIncomeId && (
                  <button type="button" onClick={cancelEdit} className="cancel-btn" disabled={expandedLog}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>

            <div className="form-card expense-form" ref={expenseFormRef}>
              <div className="form-header">
                <h3 className="expense-color">
                  {editingExpenseId ? "Edit Expense" : "+ Add Expense"}
                  {editingExpenseId && <span className="editing-badge">✏️ editing…</span>}
                </h3>
                <span>💸</span>
              </div>

              <form onSubmit={handleExpenseSubmit}>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, date: e.target.value })
                    }
                    required
                    disabled={expandedLog}
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    placeholder="Rent, Groceries, etc."
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, description: e.target.value })
                    }
                    required
                    disabled={expandedLog}
                  />
                </div>

                <div className="form-group">
                  <label>Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: e.target.value })
                    }
                    required
                    disabled={expandedLog}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, category: e.target.value })
                      }
                      className="category-select"
                      disabled={expandedLog}
                    >
                      <option>Food & Groceries</option>
                      <option>Housing / Rent</option>
                      <option>Utilities (Water, Electricity, etc.)</option>
                      <option>Transport</option>
                      <option>Healthcare / Medical</option>
                      <option>Education</option>
                      <option>Savings & Investments</option>
                      <option>Debt Repayment</option>
                      <option>Insurance</option>
                      <option>Subscriptions & Streaming</option>
                      <option>Personal Care</option>
                      <option>Clothing</option>
                      <option>Gifts & Donations</option>
                      <option>Childcare / Family</option>
                      <option>Entertainment & Leisure</option>
                      <option>Travel & Holidays</option>
                      <option>Household Goods</option>
                      <option>Business / Side Hustle</option>
                      <option>Emergencies</option>
                      <option>Miscellaneous / Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={expenseForm.type}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, type: e.target.value })
                      }
                      className="type-select"
                      disabled={expandedLog}
                    >
                      <option>Need</option>
                      <option>Want</option>
                      <option>Savings</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="submit-btn expense-btn" disabled={expandedLog}>
                  {editingExpenseId ? "Update Expense" : "+ Add Expense"}
                </button>

                {editingExpenseId && (
                  <button type="button" onClick={cancelEdit} className="cancel-btn" disabled={expandedLog}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* LOGS */}
          <div className="logs-row">
            <div className={`log-card income-log ${expandedLog === 'income' ? 'expanded' : ''} ${expandedLog === 'expense' ? 'collapsed' : ''}`}>
              <div className="log-header static-header">
                <h3 className="income-color">
                  {getCurrentMonth()} Income Log
                </h3>
                <div className="log-header-right">
                  <span className="count">{filteredIncome.length}</span>
                  <button
                    onClick={() => toggleLogExpansion('income')}
                    className="expand-toggle-btn"
                    title={expandedLog === 'income' ? "Collapse" : "Expand"}
                    disabled={expandedLog === 'expense'}
                  >
                    {expandedLog === 'income' ? "✕" : "⤢"}
                  </button>
                </div>
              </div>

              <div className="log-content scrollable-content">
                {filteredIncome.length === 0 ? (
                  <div className="empty">
                    <p>No income for {month} {year}</p>
                    <small>Add your first income above!</small>
                  </div>
                ) : (
                  filteredIncome.map((item) => (
                    <div key={item.id} className="log-item">
                      <div className="log-main">
                        <span className="log-title">{item.source}</span>
                        <span className="log-amount income-color">
                          {currencySymbol} {parseFloat(item.amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="log-date">{formatDate(item.date)}</div>

                      <div className="log-actions">
                        <button
                          onClick={() => editIncome(item.id)}
                          className={`edit-btn ${isMobile ? 'mobile-text-btn' : ''}`}
                          disabled={expandedLog}
                        >
                          {isMobile ? "Edit" : "Edit"}
                        </button>
                        <button
                          onClick={() => deleteIncome(item.id)}
                          className={`delete-btn ${isMobile ? 'mobile-text-btn' : ''}`}
                          disabled={expandedLog}
                        >
                          {isMobile ? "Delete" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`log-card expense-log ${expandedLog === 'expense' ? 'expanded' : ''} ${expandedLog === 'income' ? 'collapsed' : ''}`}>
              <div className="log-header static-header">
                <h3 className="expense-color">
                  {getCurrentMonth()} Expense Log
                </h3>
                <div className="log-header-right">
                  <span className="count">{filteredExpenses.length}</span>
                  <button
                    onClick={() => toggleLogExpansion('expense')}
                    className="expand-toggle-btn"
                    title={expandedLog === 'expense' ? "Collapse" : "Expand"}
                    disabled={expandedLog === 'income'}
                  >
                    {expandedLog === 'expense' ? "✕" : "⤢"}
                  </button>
                </div>
              </div>

              <div className="log-content scrollable-content">
                {filteredExpenses.length === 0 ? (
                  <div className="empty">
                    <p>No expenses for {month} {year}</p>
                    <small>Add your first expense above!</small>
                  </div>
                ) : (
                  filteredExpenses.map((item) => (
                    <div key={item.id} className="log-item">
                      <div className="log-main">
                        <span className="log-title">{item.description}</span>
                        <span className="log-amount expense-color">
                          {currencySymbol} {parseFloat(item.amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="log-meta">
                        {item.category} | {item.type} | {formatDate(item.date)}
                      </div>

                      <div className="log-actions">
                        <button
                          onClick={() => editExpense(item.id)}
                          className={`edit-btn ${isMobile ? 'mobile-text-btn' : ''}`}
                          disabled={expandedLog}
                        >
                          {isMobile ? "Edit" : "Edit"}
                        </button>

                        <button
                          onClick={() => deleteExpense(item.id)}
                          className={`delete-btn ${isMobile ? 'mobile-text-btn' : ''}`}
                          disabled={expandedLog}
                        >
                          {isMobile ? "Delete" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPGRADE MODAL */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, message: "" })}
        onUpgrade={() => {
          setUpgradeModal({ isOpen: false, message: "" });
          navigate("/upgrade");
        }}
        message={upgradeModal.message}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, itemId: null, itemType: null, itemName: null })}
        onConfirm={handleConfirmDelete}
        itemType={deleteModal.itemType}
        itemName={deleteModal.itemName}
      />

      {/* SUCCESS MODAL (CENTERED) */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        message={successModal.message}
      />

      {/* EXPANDED LOG MODAL */}
      {expandedLog && (
        <div className="log-modal-overlay" onClick={() => setExpandedLog(null)}>
          <div className="log-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <h3 className={expandedLog === 'income' ? 'income-color' : 'expense-color'}>
                {expandedLog === 'income' ? `${getCurrentMonth()} Income Log` : `${getCurrentMonth()} Expense Log`}
                <span className="modal-count">
                  {expandedLog === 'income' ? filteredIncome.length : filteredExpenses.length}
                </span>
              </h3>
              <button
                onClick={() => setExpandedLog(null)}
                className="close-modal-btn"
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="log-modal-content">
              {expandedLog === 'income' ? (
                filteredIncome.length === 0 ? (
                  <div className="empty-modal">
                    <p>No income for {month} {year}</p>
                    <small>Add your first income above!</small>
                  </div>
                ) : (
                  filteredIncome.map((item) => (
                    <div key={item.id} className="log-modal-item">
                      <div className="log-modal-main">
                        <span className="log-modal-title">{item.source}</span>
                        <span className="log-modal-amount income-color">
                          {currencySymbol} {parseFloat(item.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="log-modal-meta">
                        <span className="log-modal-date">{formatDate(item.date)}</span>
                      </div>
                      <div className="log-modal-actions">
                        <button
                          onClick={() => handleEditFromModal('income', item.id)}
                          className="modal-action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFromModal('income', item.id)}
                          className="modal-action-btn delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                filteredExpenses.length === 0 ? (
                  <div className="empty-modal">
                    <p>No expenses for {month} {year}</p>
                    <small>Add your first expense above!</small>
                  </div>
                ) : (
                  filteredExpenses.map((item) => (
                    <div key={item.id} className="log-modal-item">
                      <div className="log-modal-main">
                        <span className="log-modal-title">{item.description}</span>
                        <span className="log-modal-amount expense-color">
                          {currencySymbol} {parseFloat(item.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="log-modal-meta">
                        <div className="log-modal-category">{item.category} | {item.type}</div>
                        <span className="log-modal-date">{formatDate(item.date)}</span>
                      </div>
                      <div className="log-modal-actions">
                        <button
                          onClick={() => handleEditFromModal('expense', item.id)}
                          className="modal-action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFromModal('expense', item.id)}
                          className="modal-action-btn delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE EXPORT FLOAT BUTTON */}
      {isMobile && (
        <div className="mobile-export-fab">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="export-fab-btn"
            disabled={expandedLog}
          >
            📊
          </button>

          {showExportMenu && (
            <div className="mobile-export-menu">
              <button onClick={() => handleMobileExport('income')} className="export-menu-btn income" disabled={expandedLog}>
                Income PDF
              </button>

              <button onClick={() => handleMobileExport('expense')} className="export-menu-btn expense" disabled={expandedLog}>
                Expense PDF
              </button>

              <button onClick={() => handleMobileExport('full')} className="export-menu-btn upgrade" disabled={expandedLog}>
                Full PDF Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ------------------------------
// MAIN DASHBOARD COMPONENT
// ------------------------------

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { user, loading: userLoading } = useUser();

  const navigate = useNavigate();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);

  const [didYouKnowIndex, setDidYouKnowIndex] = useState(0);
  const [headerMessageIndex, setHeaderMessageIndex] = useState(0);
  const [motivationalIndex, setMotivationalIndex] = useState(0);

  // State for business upgrade modal
  const [showBusinessUpgradeModal, setShowBusinessUpgradeModal] = useState(false);

  // State for upgrade banner
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);

  // State for toast
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Expose setToastMessage globally
  useEffect(() => {
    window.setToastMessage = (msg) => {
      setToastMessage(msg);
    };
    window.setToastType = (type) => {
      setToastType(type || "success");
    };
    
    return () => {
      delete window.setToastMessage;
      delete window.setToastType;
    };
  }, []);

  const handleAccountSwitch = (nextType) => {
    if (nextType === "business") {
      const plan = localStorage.getItem("budgetPro_plan") || "free";

      if (plan !== "pro") {
        setShowUpgradeBanner(true);
        return;
      }
    }

    localStorage.setItem("accountType", nextType);
    navigate(
      nextType === "business" ? "/business" : "/dashboard",
      { replace: true }
    );
  };

  const getSmartDate = () => {
    const now = new Date();
    const isCurrent =
      month === MONTHS[now.getMonth()] &&
      year === now.getFullYear().toString();

    if (isCurrent) return getCurrentDate();
    return getFirstDayOf(month, year);
  };

  const [incomeForm, setIncomeForm] = useState({
    date: getSmartDate(),
    source: "",
    amount: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    date: getSmartDate(),
    description: "",
    amount: "",
    category: "Food & Groceries",
    type: "Need"
  });

  // update form date when month/year changes
  useEffect(() => {
    const d = getSmartDate();
    setIncomeForm((p) => ({ ...p, date: d }));
    setExpenseForm((p) => ({ ...p, date: d }));
  }, [month, year]);

  // Firestore loading useEffect with one-time duplicate cleanup
  useEffect(() => {
    let isMounted = true;
    
    async function load() {
      if (currentUser?.uid && isMounted) {
        setLoading(true);
        
        try {
          const cleanupKey = `budgetpro_${currentUser.uid}_duplicates_cleaned`;
          const hasCleaned = localStorage.getItem(cleanupKey);
          
          if (!hasCleaned) {
            console.log("🔄 Running one-time duplicate cleanup...");
            
            const [cleanedIncome, cleanedExpenses] = await Promise.all([
              cleanDuplicates("income", currentUser.uid),
              cleanDuplicates("expense", currentUser.uid)
            ]);
            
            localStorage.setItem(cleanupKey, "true");
            
            if (cleanedIncome && cleanedExpenses && isMounted) {
              setIncomeList(cleanedIncome);
              setExpenseList(cleanedExpenses);
              setLoading(false);
              return;
            }
          }
          
          const [inc, exp] = await Promise.all([
            loadRecords("income", currentUser.uid),
            loadRecords("expense", currentUser.uid)
          ]);
          
          if (isMounted) {
            setIncomeList(inc);
            setExpenseList(exp);
            setLoading(false);
          }
          
        } catch (error) {
          console.error("Error loading data:", error);
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    }

    load();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Clean up any leftover temp IDs on component mount
  useEffect(() => {
    if (incomeList.length > 0 || expenseList.length > 0) {
      const cleanIncome = incomeList.filter(item => !item.id?.startsWith("temp_"));
      const cleanExpenses = expenseList.filter(item => !item.id?.startsWith("temp_"));
      
      if (cleanIncome.length !== incomeList.length) {
        setIncomeList(cleanIncome);
      }
      if (cleanExpenses.length !== expenseList.length) {
        setExpenseList(cleanExpenses);
      }
    }
  }, []);

  // Initialize free trial counter if not exists
  useEffect(() => {
    if (!localStorage.getItem("budgetPro_plan")) {
      localStorage.setItem("budgetPro_plan", "free");
    }
    if (!localStorage.getItem("bp_trial_entries")) {
      localStorage.setItem("bp_trial_entries", "0");
    }
  }, []);

  // did-you-know rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setDidYouKnowIndex((i) => i + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // header message rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeaderMessageIndex((i) => (i + 1) % HEADER_MESSAGES.length);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // rotating motivational message (60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setMotivationalIndex((i) => (i + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // mobile check
  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const didYouKnow = DID_YOU_KNOW_MESSAGES[didYouKnowIndex % DID_YOU_KNOW_MESSAGES.length];
  const motivationalMessage = MOTIVATIONAL_MESSAGES[motivationalIndex % MOTIVATIONAL_MESSAGES.length];

  // 🚫 BLOCK dashboard until user doc exists
  if (!currentUser || userLoading) {
    return (
      <div className="dashboard-loading">
        Loading your dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-loading">
        Preparing your account...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* APP TOAST */}
      {toastMessage && (
        <AppToast 
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
        />
      )}

      <PersonalDashboard
        key="personal"
        month={month}
        year={year}
        setMonth={setMonth}
        setYear={setYear}
        incomeForm={incomeForm}
        setIncomeForm={setIncomeForm}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        editingIncomeId={editingIncomeId}
        editingExpenseId={editingExpenseId}
        incomeList={incomeList}
        expenseList={expenseList}
        setIncomeList={setIncomeList}
        setExpenseList={setExpenseList}
        setEditingIncomeId={setEditingIncomeId}
        setEditingExpenseId={setEditingExpenseId}
        isMobile={isMobile}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        currentUser={currentUser}
        navigate={navigate}
        loading={loading}
        didYouKnow={didYouKnow}
        motivationalMessage={motivationalMessage}
        accountType={localStorage.getItem("accountType") || "personal"}
        onSwitchAccount={handleAccountSwitch}
        showUpgradeBanner={showUpgradeBanner}
        onDismissUpgradeBanner={() => setShowUpgradeBanner(false)}
      />

      {showBusinessUpgradeModal && (
        <BusinessUpgradeModal 
          onClose={() => setShowBusinessUpgradeModal(false)}
          onUpgrade={() => {
            setShowBusinessUpgradeModal(false);
            navigate("/upgrade");
          }}
          onCancel={() => setShowBusinessUpgradeModal(false)}
        />
      )}
    </div>
  );
}