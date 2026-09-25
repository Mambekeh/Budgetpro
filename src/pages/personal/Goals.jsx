import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { getCurrencySymbol } from "../../utils/currencyUtils.js"; // ADDED IMPORT
import './Goals.css';

// View constants
const VIEWS = {
  GOALS_HOME: 'GOALS_HOME',
  RECURRING_VIEW: 'RECURRING_VIEW',
  ONE_TIME_VIEW: 'ONE_TIME_VIEW',
  RULE_SETUP: 'RULE_SETUP',
  RULE_SUMMARY: 'RULE_SUMMARY'
};

// Professional Upgrade Modal Component
const ProfessionalUpgradeModal = ({ onClose }) => {
  const handleUpgrade = () => {
    window.location.href = '/upgrade';
  };

  return (
    <div className="modal-overlay professional-upgrade-overlay" onClick={onClose}>
      <div className="modal-content professional-upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="professional-upgrade-header">
          <h3 className="professional-upgrade-title">
            <span>🚀</span> Upgrade to Professional
          </h3>
          <p className="professional-upgrade-subtitle">
            Unlock Advanced Budgeting Features
          </p>
        </div>
        
        <div className="professional-upgrade-content">
          <div className="upgrade-plan-info">
            <h4 className="upgrade-plan-name">50/30/20 Budget Rule</h4>
            <div className="upgrade-feature-list">
              <div className="upgrade-feature-item">
                <span className="upgrade-feature-check">✓</span>
                <span>Smart budget allocation with Needs/Wants/Savings</span>
              </div>
              <div className="upgrade-feature-item">
                <span className="upgrade-feature-check">✓</span>
                <span>Customizable percentage rules for your lifestyle</span>
              </div>
              <div className="upgrade-feature-item">
                <span className="upgrade-feature-check">✓</span>
                <span>Progress tracking against income targets</span>
              </div>
              <div className="upgrade-feature-item">
                <span className="upgrade-feature-check">✓</span>
                <span>Detailed analytics and recommendations</span>
              </div>
            </div>
          </div>
          
          <div className="professional-upgrade-actions">
            <button 
              className="professional-upgrade-cancel-btn"
              onClick={onClose}
            >
              Maybe Later
            </button>
            <button 
              className="professional-upgrade-proceed-btn"
              onClick={handleUpgrade}
            >
              Adjust rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Goal Modal Component
const AddGoalModal = ({ type, onClose, onSave, editingGoal }) => {
  const [form, setForm] = useState({
    name: '',
    category: 'Bills',
    amountPerPeriod: '',
    frequency: 'Monthly',
    note: '',
    targetAmount: '',
    targetDate: '',
    startingAmount: ''
  });

  const [suggestedMonthly, setSuggestedMonthly] = useState(0);

  useEffect(() => {
    if (editingGoal) {
      if (type === 'recurring') {
        setForm({
          name: editingGoal.name || '',
          category: editingGoal.category || 'Bills',
          amountPerPeriod: editingGoal.amountPerPeriod || '',
          frequency: editingGoal.frequency || 'Monthly',
          note: editingGoal.note || '',
          targetAmount: '',
          targetDate: '',
          startingAmount: ''
        });
      } else {
        setForm({
          name: editingGoal.name || '',
          targetAmount: editingGoal.targetAmount || '',
          targetDate: editingGoal.targetDate || '',
          startingAmount: editingGoal.currentAmount || '',
          category: 'Bills',
          amountPerPeriod: '',
          frequency: 'Monthly',
          note: ''
        });
      }
    } else {
      setForm({
        name: '',
        category: 'Bills',
        amountPerPeriod: '',
        frequency: 'Monthly',
        note: '',
        targetAmount: '',
        targetDate: '',
        startingAmount: ''
      });
    }
  }, [editingGoal, type]);

  useEffect(() => {
    if (type === 'oneTime' && form.targetAmount && form.targetDate) {
      const targetAmount = parseFloat(form.targetAmount);
      const startingAmount = parseFloat(form.startingAmount) || 0;
      const targetDate = new Date(form.targetDate);
      const today = new Date();
      
      const monthsDiff = Math.max(1, 
        (targetDate.getFullYear() - today.getFullYear()) * 12 + 
        (targetDate.getMonth() - today.getMonth())
      );
      
      const monthly = (targetAmount - startingAmount) / monthsDiff;
      setSuggestedMonthly(monthly > 0 ? monthly : 0);
    }
  }, [form.targetAmount, form.targetDate, form.startingAmount, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingGoal ? 'Edit' : 'Add'} {type === 'recurring' ? 'Recurring' : 'One-Time'} Goal</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {type === 'recurring' ? (
            <>
              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Rent, Netflix, Gym"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  <option value="Bills">Bills</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Loans">Loans</option>
                  <option value="Savings">Savings</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={form.amountPerPeriod}
                    onChange={(e) => setForm({...form, amountPerPeriod: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({...form, frequency: e.target.value})}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Note (Optional)</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({...form, note: e.target.value})}
                  placeholder="Add any notes here..."
                  rows="3"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Vacation, New Laptop, Emergency Fund"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Target Amount *</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({...form, targetAmount: e.target.value})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Target Date (Optional)</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({...form, targetDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Starting Amount (Optional)</label>
                <input
                  type="number"
                  value={form.startingAmount}
                  onChange={(e) => setForm({...form, startingAmount: e.target.value})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              {suggestedMonthly > 0 && (
                <div className="suggestion-info">
                  <p><strong>Suggested monthly savings:</strong> {getCurrencySymbol()}{suggestedMonthly.toFixed(2)}</p> {/* FIXED: Dynamic currency */}
                </div>
              )}
            </>
          )}
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              {editingGoal ? 'Update' : 'Save'} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmModal = ({ onClose, onConfirm, title, message }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-delete-confirm" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </div>
  </div>
);

// 50/30/20 Rule Setup Component
const RuleSetup = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [rule, setRule] = useState({ needs: 50, wants: 30, savings: 20 });
  const [total, setTotal] = useState(100);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const loadRule = async () => {
      try {
        const ruleRef = doc(db, 'users', currentUser.uid, 'budgetRule');
        const ruleSnap = await getDoc(ruleRef);
        
        if (ruleSnap.exists()) {
          const data = ruleSnap.data();
          setRule({
            needs: data.needs || 50,
            wants: data.wants || 30,
            savings: data.savings || 20
          });
          setTotal((data.needs || 50) + (data.wants || 30) + (data.savings || 20));
        }
      } catch (error) {
        console.error('Error loading rule:', error);
      }
    };

    loadRule();
  }, [currentUser]);

  const handleChange = (category, value) => {
    const numValue = parseInt(value) || 0;
    const newRule = { ...rule, [category]: numValue };
    
    const newTotal = Object.values(newRule).reduce((sum, val) => sum + val, 0);
    
    setRule(newRule);
    setTotal(newTotal);
    
    if (newTotal !== 100) {
      setError(`Total must equal 100% (currently ${newTotal}%)`);
    } else {
      setError('');
    }
  };

  const saveRule = async () => {
    if (total !== 100) {
      setError('Total must equal 100%');
      return;
    }

    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const ruleRef = doc(db, 'users', currentUser.uid, 'budgetRule');
      await setDoc(ruleRef, {
        ...rule,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onBack();
      }, 1500);
    } catch (error) {
      console.error('Error saving rule:', error);
      setError('Failed to save rule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setRule({ needs: 50, wants: 30, savings: 20 });
    setTotal(100);
    setError('');
  };

  return (
    <div className="rule-setup-page">
      <div className="rule-setup-header">
        <button className="btn-back" onClick={onBack}>← Back to Goals</button>
        <h2>Set 50/30/20 Rule</h2>
        <div className="header-spacer" />
      </div>

      <div className="rule-explanation">
        <p>The 50/30/20 rule helps you allocate your income into three categories:</p>
        <ul>
          <li><strong>Needs (50%):</strong> Essential expenses like rent, groceries, utilities</li>
          <li><strong>Wants (30%):</strong> Non-essential spending like dining out, entertainment</li>
          <li><strong>Savings (20%):</strong> Future goals, investments, and debt repayment</li>
        </ul>
        <p>Adjust the percentages to fit your financial situation.</p>
      </div>

      <div className="rule-inputs-container">
        {['needs', 'wants', 'savings'].map((category) => {
          const label = category.charAt(0).toUpperCase() + category.slice(1);
          const value = rule[category];
          
          return (
            <div key={category} className="rule-input-group">
              <div className="rule-input-label">
                <span className="label-text">{label}</span>
                <span className="label-percentage">{value}%</span>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => handleChange(category, e.target.value)}
                className={`rule-slider slider-${category}`}
              />
              
              <div className="rule-number-controls">
                <button
                  type="button"
                  onClick={() => handleChange(category, Math.max(0, value - 5))}
                  className="btn-adjust"
                >
                  -5%
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handleChange(category, e.target.value)}
                  className="rule-number-input"
                />
                <button
                  type="button"
                  onClick={() => handleChange(category, Math.min(100, value + 5))}
                  className="btn-adjust"
                >
                  +5%
                </button>
              </div>
            </div>
          );
        })}
        
        <div className="rule-total-display">
          <span className="total-label">Total:</span>
          <span className={`total-value ${total === 100 ? 'valid' : 'invalid'}`}>
            {total}%
          </span>
        </div>
        
        {error && <div className="rule-error">{error}</div>}
        {saveSuccess && <div className="rule-success">Rule saved successfully!</div>}
      </div>

      <div className="rule-setup-actions">
        <button className="btn-cancel" onClick={onBack}>
          Cancel
        </button>
        <button className="btn-reset" onClick={resetToDefault}>
          Reset to 50/30/20
        </button>
        <button 
          className="btn-save" 
          onClick={saveRule}
          disabled={total !== 100 || loading}
        >
          {loading ? 'Saving...' : 'Save Rule'}
        </button>
      </div>
    </div>
  );
};

// 50/30/20 Rule Summary Component
const RuleSummary = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { totalIncome = 0, getTotalExpenses } = useFinance();
  
  const [rule, setRule] = useState({ needs: 50, wants: 30, savings: 20 });
  const [loading, setLoading] = useState(true);
  const currentMonthExpenses = getTotalExpenses ? getTotalExpenses() : 0;

  useEffect(() => {
    if (!currentUser) return;

    const loadRule = async () => {
      try {
        const ruleRef = doc(db, 'users', currentUser.uid, 'budgetRule');
        const ruleSnap = await getDoc(ruleRef);
        
        if (ruleSnap.exists()) {
          const data = ruleSnap.data();
          setRule({
            needs: data.needs || 50,
            wants: data.wants || 30,
            savings: data.savings || 20
          });
        }
      } catch (error) {
        console.error('Error loading rule:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRule();
  }, [currentUser]);

  const calculateTarget = (percentage) => {
    return totalIncome * (percentage / 100);
  };

  // FIXED: Use imported getCurrencySymbol
  const formatCurrency = (amount) => {
    return `${getCurrencySymbol()}${parseFloat(amount).toFixed(2)}`; // FIXED: Using imported function
  };

  if (loading) {
    return (
      <div className="rule-summary-page">
        <div className="rule-summary-header">
          <button className="btn-back" onClick={onBack}>← Back to Goals</button>
          <h2>50/30/20 Summary</h2>
          <div className="header-spacer" />
        </div>
        <div className="loading-state">
          <p>Loading budget rule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rule-summary-page">
      <div className="rule-summary-header">
        <button className="btn-back" onClick={onBack}>← Back to Goals</button>
        <h2>50/30/20 Summary</h2>
        <div className="header-spacer" />
      </div>

      <div className="summary-content">
        <div className="summary-section">
          <h3>Monthly Income</h3>
          <div className="income-display">
            <span className="income-label">Total Income</span>
            <span className="income-value">{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        <div className="summary-section">
          <h3>Target Allocations</h3>
          <div className="allocations-grid">
            <div className="allocation-item">
              <div className="allocation-header">
                <span className="allocation-label">Needs</span>
                <span className="allocation-percentage">{rule.needs}%</span>
              </div>
              <div className="allocation-amount">{formatCurrency(calculateTarget(rule.needs))}</div>
              <div className="allocation-bar">
                <div 
                  className="allocation-fill needs-fill"
                  style={{ width: `${rule.needs}%` }}
                ></div>
              </div>
            </div>

            <div className="allocation-item">
              <div className="allocation-header">
                <span className="allocation-label">Wants</span>
                <span className="allocation-percentage">{rule.wants}%</span>
              </div>
              <div className="allocation-amount">{formatCurrency(calculateTarget(rule.wants))}</div>
              <div className="allocation-bar">
                <div 
                  className="allocation-fill wants-fill"
                  style={{ width: `${rule.wants}%` }}
                ></div>
              </div>
            </div>

            <div className="allocation-item">
              <div className="allocation-header">
                <span className="allocation-label">Savings</span>
                <span className="allocation-percentage">{rule.savings}%</span>
              </div>
              <div className="allocation-amount">{formatCurrency(calculateTarget(rule.savings))}</div>
              <div className="allocation-bar">
                <div 
                  className="allocation-fill savings-fill"
                  style={{ width: `${rule.savings}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h3>Current Month</h3>
          <div className="expenses-display">
            <div className="expenses-item">
              <span className="expenses-label">Total Expenses</span>
              <span className="expenses-value">{formatCurrency(currentMonthExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="analytics-note">
          <h4>Need deeper insights?</h4>
          <p>Visit the Analytics page to see detailed spending patterns, 
             track progress against your targets, and get personalized recommendations.</p>
        </div>
      </div>

      <div className="summary-actions">
        <button className="btn-back" onClick={onBack}>
          Back to Goals
        </button>
      </div>
    </div>
  );
};

const Goals = () => {
  const { currentUser } = useAuth();
  const { 
    netBalance, 
    totalIncome = 0,
    getTotalExpenses
  } = useFinance();
  
  const [currentView, setCurrentView] = useState(VIEWS.GOALS_HOME);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [recurringGoals, setRecurringGoals] = useState([]);
  const [oneTimeGoals, setOneTimeGoals] = useState([]);
  
  const [financialInsights, setFinancialInsights] = useState([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  
  const [savingInputs, setSavingInputs] = useState({});
  
  // Get current plan from user context
  const currentPlan = currentUser?.plan || 'free';

  // Check if user can access 50/30/20 features
  const canAccessBudgetRule = currentPlan === 'pro' || currentPlan === 'lifetime';

  const calculateMonthlyCommitment = useCallback((goal) => {
    if (goal.frequency === 'Weekly') return goal.amountPerPeriod * 4.33;
    if (goal.frequency === 'Yearly') return goal.amountPerPeriod / 12;
    return goal.amountPerPeriod;
  }, []);

  // Load all data on component mount
  useEffect(() => {
    if (!currentUser) return;

    const recurringQuery = query(
      collection(db, 'users', currentUser.uid, 'goals_recurring')
    );

    const recurringUnsubscribe = onSnapshot(recurringQuery, (snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecurringGoals(goals);
    });

    const oneTimeQuery = query(
      collection(db, 'users', currentUser.uid, 'goals_onetime')
    );

    const oneTimeUnsubscribe = onSnapshot(oneTimeQuery, (snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOneTimeGoals(goals);
    });

    return () => {
      recurringUnsubscribe();
      oneTimeUnsubscribe();
    };
  }, [currentUser]);

  const totalRecurringGoals = useMemo(() => {
    return recurringGoals.reduce((total, goal) => {
      if (goal.frequency === 'Weekly') return total + (goal.amountPerPeriod * 4.33);
      if (goal.frequency === 'Yearly') return total + (goal.amountPerPeriod / 12);
      return total + goal.amountPerPeriod;
    }, 0);
  }, [recurringGoals]);

  // Calculate category breakdown for bar chart
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    
    recurringGoals.forEach(goal => {
      const monthlyAmount = calculateMonthlyCommitment(goal);
      const category = goal.category || 'Other';
      
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += monthlyAmount;
    });
    
    // Convert to array and calculate percentages
    const total = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [recurringGoals, calculateMonthlyCommitment]);

  // FIXED: Use imported getCurrencySymbol
  const formatCurrency = useCallback((amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return `${getCurrencySymbol()}0.00`;
    return `${getCurrencySymbol()}${parseFloat(amount).toFixed(2)}`;
  }, []);

  // Generate intelligent insights based on app activity
  useEffect(() => {
    const insights = [];
    const currentMonthExpenses = getTotalExpenses ? getTotalExpenses() : 0;

    // Calculate days left in current month
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysLeftInMonth = Math.ceil((lastDayOfMonth - today) / (1000 * 60 * 60 * 24));

    // 1. RECURRING GOALS INSIGHTS
    if (totalRecurringGoals > 0 && netBalance !== undefined) {
      const coveragePercentage = Math.min(100, (netBalance / totalRecurringGoals) * 100);
      const shortage = totalRecurringGoals - netBalance;
      const dailyNeeded = shortage > 0 ? shortage / daysLeftInMonth : 0;
      
      if (netBalance >= totalRecurringGoals) {
        const surplus = netBalance - totalRecurringGoals;
        insights.push({
          type: 'success',
          message: `✅ You can cover all monthly bills (${coveragePercentage.toFixed(0)}% covered) with ${formatCurrency(surplus)} remaining.`,
          priority: 3
        });
      } else {
        insights.push({
          type: 'warning',
          message: `⚠️ You're ${formatCurrency(shortage)} short to cover monthly bills (${coveragePercentage.toFixed(0)}% covered).`,
          priority: 4
        });
        
        if (daysLeftInMonth > 0 && dailyNeeded > 0) {
          insights.push({
            type: 'insight',
            message: `📅 You need to save ${formatCurrency(dailyNeeded)} daily for ${daysLeftInMonth} days to catch up.`,
            priority: 2
          });
        }
      }
    }

    // 2. SAVINGS GOALS INSIGHTS
    if (oneTimeGoals.length > 0) {
      const activeGoals = oneTimeGoals.filter(goal => {
        if (!goal.targetDate) return false;
        return new Date(goal.targetDate) > new Date();
      });

      if (activeGoals.length > 0) {
        const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
        const totalCurrent = activeGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
        const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

        insights.push({
          type: 'info',
          message: `📈 You're ${overallProgress.toFixed(0)}% towards all savings goals (${formatCurrency(totalCurrent)} of ${formatCurrency(totalTarget)}).`,
          priority: 1
        });

        // Find the goal with closest deadline
        const goalsWithDates = activeGoals.filter(g => g.targetDate);
        if (goalsWithDates.length > 0) {
          const closestGoal = goalsWithDates.reduce((closest, goal) => {
            const goalDate = new Date(goal.targetDate);
            const today = new Date();
            const closestDate = new Date(closest.targetDate);
            return goalDate - today < closestDate - today ? goal : closest;
          });
          
          const daysLeft = Math.ceil((new Date(closestGoal.targetDate) - today) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0) {
            const needed = (closestGoal.targetAmount - (closestGoal.currentAmount || 0)) / daysLeft;
            insights.push({
              type: 'tip',
              message: `🎯 For "${closestGoal.name}", save ${formatCurrency(needed)} daily to reach your goal in ${daysLeft} days.`,
              priority: 0
            });
          }
        }
      }
    }

    // 3. INCOME VS EXPENSES INSIGHTS
    if (totalIncome > 0 && currentMonthExpenses > 0) {
      const savingsRate = ((totalIncome - currentMonthExpenses) / totalIncome) * 100;
      const spendingRate = (currentMonthExpenses / totalIncome) * 100;
      
      if (savingsRate > 0) {
        insights.push({
          type: 'success',
          message: `💰 You're saving ${savingsRate.toFixed(1)}% of your income this month. Great job!`,
          priority: 2
        });
      } else {
        insights.push({
          type: 'warning',
          message: `💸 You're spending ${spendingRate.toFixed(1)}% of your income. Try to reduce expenses by ${Math.abs(savingsRate).toFixed(1)}% to break even.`,
          priority: 3
        });
      }
    }

    // 4. NO GOALS YET INSIGHT
    if (recurringGoals.length === 0 && oneTimeGoals.length === 0) {
      insights.push({
        type: 'info',
        message: `🎯 Start by adding your first goal to track your financial progress.`,
        priority: 0
      });
    }

    // 5. GENERAL TIPS (only add if we have room)
    if (insights.length < 4) {
      const tips = [
        "💡 Review your recurring subscriptions monthly to save money.",
        "📊 Track your spending daily to stay on budget.",
        "🎯 Set realistic savings goals with specific deadlines.",
        "💰 Pay yourself first by automating savings transfers."
      ];
      
      insights.push({
        type: 'tip',
        message: tips[Math.floor(Math.random() * tips.length)],
        priority: 0
      });
    }

    // Sort by priority and limit to 4 insights
    insights.sort((a, b) => b.priority - a.priority);
    setFinancialInsights(insights.slice(0, 4));
  }, [totalRecurringGoals, netBalance, oneTimeGoals, totalIncome, getTotalExpenses, recurringGoals, formatCurrency]);

  // Rotate insights every 10 seconds
  useEffect(() => {
    if (financialInsights.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentInsightIndex(prev => (prev + 1) % financialInsights.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [financialInsights.length]);

  const currentInsight = useMemo(() => {
    if (financialInsights.length === 0) return null;
    return financialInsights[currentInsightIndex];
  }, [financialInsights, currentInsightIndex]);

  const showToastMessage = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  const openAddModal = useCallback((type, goal = null) => {
    setModalType(type);
    setEditingGoal(goal);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingGoal(null);
  }, []);

  const handleSaveGoal = useCallback(async (formData) => {
    if (!currentUser) {
      showToastMessage('Please log in to save goals', 'error');
      return;
    }

    try {
      if (modalType === 'recurring') {
        if (!formData.name.trim() || !formData.amountPerPeriod) {
          showToastMessage('Please fill in all required fields', 'error');
          return;
        }

        const monthlyCommitment = calculateMonthlyCommitment({
          amountPerPeriod: parseFloat(formData.amountPerPeriod),
          frequency: formData.frequency
        });

        const goalData = {
          userId: currentUser.uid,
          name: formData.name.trim(),
          category: formData.category,
          amountPerPeriod: parseFloat(formData.amountPerPeriod),
          frequency: formData.frequency,
          monthlyCommitment: monthlyCommitment,
          note: formData.note.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (editingGoal) {
          await updateDoc(doc(db, 'users', currentUser.uid, 'goals_recurring', editingGoal.id), {
            ...goalData,
            updatedAt: serverTimestamp()
          });
          showToastMessage('Goal updated successfully');
        } else {
          await addDoc(collection(db, 'users', currentUser.uid, 'goals_recurring'), goalData);
          showToastMessage('Recurring goal created successfully');
        }
      } else {
        if (!formData.name.trim() || !formData.targetAmount) {
          showToastMessage('Please fill in all required fields', 'error');
          return;
        }

        const goalData = {
          userId: currentUser.uid,
          name: formData.name.trim(),
          targetAmount: parseFloat(formData.targetAmount),
          targetDate: formData.targetDate || null,
          currentAmount: parseFloat(formData.startingAmount) || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (editingGoal) {
          await updateDoc(doc(db, 'users', currentUser.uid, 'goals_onetime', editingGoal.id), {
            ...goalData,
            updatedAt: serverTimestamp()
          });
          showToastMessage('Goal updated successfully');
        } else {
          await addDoc(collection(db, 'users', currentUser.uid, 'goals_onetime'), goalData);
          showToastMessage('One-time goal created successfully');
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error saving goal:', error);
      showToastMessage('Failed to save goal', 'error');
    }
  }, [currentUser, modalType, editingGoal, showToastMessage, closeModal, calculateMonthlyCommitment]);

  const openConfirmModal = useCallback((goalId, type) => {
    setGoalToDelete({ id: goalId, type });
    setShowConfirmModal(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
    setGoalToDelete(null);
  }, []);

  const addSavings = useCallback(async (goalId) => {
    const amount = parseFloat(savingInputs[goalId]);
    if (isNaN(amount) || amount <= 0) {
      showToastMessage('Please enter a valid amount', 'error');
      return;
    }

    try {
      const goal = oneTimeGoals.find(g => g.id === goalId);
      const newAmount = (goal.currentAmount || 0) + amount;
      
      await updateDoc(doc(db, 'users', currentUser.uid, 'goals_onetime', goalId), {
        currentAmount: newAmount,
        updatedAt: serverTimestamp()
      });

      setSavingInputs(prev => ({ ...prev, [goalId]: '' }));
      showToastMessage('Savings added successfully');
      
    } catch (error) {
      console.error('Error adding savings:', error);
      showToastMessage('Failed to add savings', 'error');
    }
  }, [savingInputs, oneTimeGoals, currentUser, showToastMessage]);

  const deleteGoal = useCallback(async () => {
    if (!goalToDelete) return;

    try {
      const collectionName = goalToDelete.type === 'recurring' ? 'goals_recurring' : 'goals_onetime';
      await deleteDoc(doc(db, 'users', currentUser.uid, collectionName, goalToDelete.id));
      
      showToastMessage('Goal deleted successfully');
      closeConfirmModal();
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToastMessage('Failed to delete goal', 'error');
      closeConfirmModal();
    }
  }, [goalToDelete, currentUser, showToastMessage, closeConfirmModal]);

  // Handle 50/30/20 button clicks with plan check
  const handleRuleViewClick = (view) => {
    if (!canAccessBudgetRule) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentView(view);
  };

  const renderHomeView = () => {
    return (
      <div className="goals-container">
        <header className="goals-header">
          <h1 className="page-title">Financial Goals</h1>
          <p className="page-subtitle">Plan your obligations. Build your future.</p>
        </header>

        {currentInsight && (
          <div className={`financial-insights-card insight-${currentInsight.type}`}>
            <div className="insight-content">
              <span className="insight-icon">
                {currentInsight.type === 'success' && '✅'}
                {currentInsight.type === 'warning' && '⚠️'}
                {currentInsight.type === 'info' && '📊'}
                {currentInsight.type === 'tip' && '💡'}
                {currentInsight.type === 'insight' && '📅'}
              </span>
              <div className="insight-text">
                <p className="insight-message">{currentInsight.message}</p>
                {financialInsights.length > 1 && (
                  <div className="insight-dots">
                    {financialInsights.map((_, index) => (
                      <span 
                        key={index}
                        className={`insight-dot ${index === currentInsightIndex ? 'active' : ''}`}
                        onClick={() => setCurrentInsightIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="cards-grid">
          {/* Card 1: Recurring Goals */}
          <div className="goal-card">
            <div className="card-icon recurring">📅</div>
            <h2 className="card-title">Recurring Goals</h2>
            <p className="card-description">
              Track monthly bills and regular expenses for better financial planning.
            </p>
            
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">Active Goals</span>
                <span className="stat-value">{recurringGoals.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Monthly Total</span>
                <span className="stat-value">{formatCurrency(totalRecurringGoals)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Your Balance</span>
                <span className="stat-value">{formatCurrency(netBalance)}</span>
              </div>
            </div>
            
            <div className="card-actions">
              <button 
                className="btn btn-view"
                onClick={() => setCurrentView(VIEWS.RECURRING_VIEW)}
              >
                View Goals
              </button>
              <button 
                className="btn btn-add"
                onClick={() => openAddModal('recurring')}
              >
                Add Goal
              </button>
            </div>
          </div>

          {/* Card 2: One-Time Goals */}
          <div className="goal-card">
            <div className="card-icon onetime">🎯</div>
            <h2 className="card-title">One-Time Goals</h2>
            <p className="card-description">
              Save for specific purchases or events with target dates and amounts.
            </p>
            
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">Active Goals</span>
                <span className="stat-value">{oneTimeGoals.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Upcoming</span>
                <span className="stat-value">
                  {oneTimeGoals.filter(g => g.targetDate && new Date(g.targetDate) > new Date()).length}
                </span>
              </div>
            </div>
            
            <div className="card-actions">
              <button 
                className="btn btn-view"
                onClick={() => setCurrentView(VIEWS.ONE_TIME_VIEW)}
              >
                View Goals
              </button>
              <button 
                className="btn btn-add"
                onClick={() => openAddModal('oneTime')}
              >
                Add Goal
              </button>
            </div>
          </div>

          {/* Card 3: 50/30/20 Rule */}
          <div className="goal-card rule-card">
            <div className="card-icon rule">💰</div>
            <h2 className="card-title">50/30/20 Budget Rule</h2>
            <p className="card-description">
              Allocate your income into Needs, Wants, and Savings. {!canAccessBudgetRule && <strong style={{color: '#f59e0b'}}>(Professional feature)</strong>}
            </p>
            
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">Default Rule</span>
                <span className="stat-value">50/30/20</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${canAccessBudgetRule ? 'success' : 'warning'}`}>
                  {canAccessBudgetRule ? 'Available' : 'Professional'}
                </span>
              </div>
            </div>
            
            <div className="card-actions">
              <button 
                className="btn btn-view"
                onClick={() => handleRuleViewClick(VIEWS.RULE_SUMMARY)}
              >
                View rule
              </button>
              <button 
                className="btn btn-add"
                onClick={() => handleRuleViewClick(VIEWS.RULE_SETUP)}
              >
                {canAccessBudgetRule ? 'Set Rule' : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <AddGoalModal
            type={modalType}
            onClose={closeModal}
            onSave={handleSaveGoal}
            editingGoal={editingGoal}
          />
        )}

        {showUpgradeModal && (
          <ProfessionalUpgradeModal
            onClose={() => setShowUpgradeModal(false)}
          />
        )}

        {showConfirmModal && goalToDelete && (
          <ConfirmModal
            onClose={closeConfirmModal}
            onConfirm={deleteGoal}
            title="Delete Goal"
            message="Are you sure you want to delete this goal? This action cannot be undone."
          />
        )}

        {toast.show && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    );
  };

  const renderRecurringView = () => {
    return (
      <div className="goals-container">
        <header className="screen-header">
          <div className="header-top">
            <button 
              className="btn-back"
              onClick={() => setCurrentView(VIEWS.GOALS_HOME)}
            >
              ← Back to Goals
            </button>
            <button 
              className="btn-add-header"
              onClick={() => openAddModal('recurring')}
            >
              + Add Goal
            </button>
          </div>
          <h2>Recurring Goals</h2>
        </header>

        <div className="summary-card">
          <div className="summary-header">
            <h3>Monthly Commitments</h3>
            <span className="summary-badge">{recurringGoals.length} goals</span>
          </div>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Monthly Amount</span>
              <span className="stat-value primary">{formatCurrency(totalRecurringGoals)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Your Net Balance</span>
              <span className={`stat-value ${netBalance >= totalRecurringGoals ? 'success' : 'warning'}`}>
                {formatCurrency(netBalance)}
              </span>
            </div>
            {netBalance < totalRecurringGoals && (
              <div className="stat-item">
                <span className="stat-label">Amount Short</span>
                <span className="stat-value warning">
                  {formatCurrency(totalRecurringGoals - netBalance)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        {categoryBreakdown.length > 0 && (
          <div className="summary-card">
            <div className="summary-header">
              <h3>Category Breakdown</h3>
            </div>
            <div className="category-chart">
              {categoryBreakdown.map((item, index) => (
                <div key={index} className="category-chart-item">
                  <div className="category-chart-label">
                    <span className="category-name">{item.category}</span>
                    <span className="category-percentage">{item.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="category-chart-bar">
                    <div 
                      className="category-chart-fill"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="category-chart-amount">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recurringGoals.length === 0 ? (
          <div className="empty-state">
            <p>No recurring goals yet. Click "Add Goal" to create one.</p>
          </div>
        ) : (
          <div className="goals-list">
            <h3 className="section-title">Your Monthly Bills</h3>
            {recurringGoals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div className="goal-content">
                  <div className="goal-header">
                    <div className="goal-info">
                      <h4 className="goal-name">{goal.name}</h4>
                      <div className="goal-tags">
                        <span className="category-badge">{goal.category}</span>
                        <span className="frequency-badge">{goal.frequency}</span>
                      </div>
                    </div>
                    <div className="goal-amount">
                      {formatCurrency(goal.amountPerPeriod)}
                      {goal.frequency === 'Weekly' && <span className="frequency-hint">/week</span>}
                    </div>
                  </div>
                  {goal.note && (
                    <div className="goal-note">
                      <p>{goal.note}</p>
                    </div>
                  )}
                </div>
                <div className="goal-actions compact">
                  <button 
                    className="btn-edit"
                    onClick={() => openAddModal('recurring', goal)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => openConfirmModal(goal.id, 'recurring')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <AddGoalModal
            type={modalType}
            onClose={closeModal}
            onSave={handleSaveGoal}
            editingGoal={editingGoal}
          />
        )}

        {showConfirmModal && goalToDelete && (
          <ConfirmModal
            onClose={closeConfirmModal}
            onConfirm={deleteGoal}
            title="Delete Goal"
            message="Are you sure you want to delete this goal? This action cannot be undone."
          />
        )}
      </div>
    );
  };

  const renderOneTimeView = () => {
    return (
      <div className="goals-container">
        <header className="screen-header">
          <div className="header-top">
            <button 
              className="btn-back"
              onClick={() => setCurrentView(VIEWS.GOALS_HOME)}
            >
              ← Back to Goals
            </button>
            <button 
              className="btn-add-header"
              onClick={() => openAddModal('oneTime')}
            >
              + Add Goal
            </button>
          </div>
          <h2>One-Time Goals</h2>
        </header>

        {oneTimeGoals.length === 0 ? (
          <div className="empty-state">
            <p>No one-time goals yet. Click "Add Goal" to create one.</p>
          </div>
        ) : (
          <div className="goals-list">
            <h3 className="section-title">Your Savings Goals</h3>
            {oneTimeGoals.map(goal => {
              const progress = goal.targetAmount > 0 
                ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 
                : 0;
              const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
              const daysLeft = targetDate ? Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
              
              return (
                <div key={goal.id} className="goal-item">
                  <div className="goal-content">
                    <div className="goal-header">
                      <div className="goal-info">
                        <h4 className="goal-name">{goal.name}</h4>
                        {targetDate && (
                          <div className="goal-date">
                            Target: {targetDate.toLocaleDateString()}
                            {daysLeft && daysLeft > 0 && (
                              <span className="days-left"> ({daysLeft} days left)</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="goal-amount">
                        <div className="current-amount">{formatCurrency(goal.currentAmount || 0)}</div>
                        <div className="target-amount">of {formatCurrency(goal.targetAmount)}</div>
                      </div>
                    </div>
                    
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        <span>{progress.toFixed(1)}%</span>
                        <span className="progress-amount">
                          {formatCurrency(goal.currentAmount || 0)} saved
                        </span>
                      </div>
                    </div>
                    
                    <div className="savings-control">
                      <input
                        type="number"
                        value={savingInputs[goal.id] || ''}
                        onChange={(e) => setSavingInputs({
                          ...savingInputs,
                          [goal.id]: e.target.value
                        })}
                        placeholder="Add savings amount"
                        min="0"
                        step="0.01"
                      />
                      <button 
                        className="btn-add-saving"
                        onClick={() => addSavings(goal.id)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div className="goal-actions compact">
                    <button 
                      className="btn-edit"
                      onClick={() => openAddModal('oneTime', goal)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => openConfirmModal(goal.id, 'oneTime')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <AddGoalModal
            type={modalType}
            onClose={closeModal}
            onSave={handleSaveGoal}
            editingGoal={editingGoal}
          />
        )}

        {showConfirmModal && goalToDelete && (
          <ConfirmModal
            onClose={closeConfirmModal}
            onConfirm={deleteGoal}
            title="Delete Goal"
            message="Are you sure you want to delete this goal? This action cannot be undone."
          />
        )}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="goals-container">
        <div className="login-prompt">
          <h3>Please log in</h3>
          <p>Log in to manage your financial goals</p>
        </div>
      </div>
    );
  }

  switch (currentView) {
    case VIEWS.RULE_SETUP:
      return canAccessBudgetRule ? <RuleSetup onBack={() => setCurrentView(VIEWS.GOALS_HOME)} /> : renderHomeView();
    
    case VIEWS.RULE_SUMMARY:
      return canAccessBudgetRule ? <RuleSummary onBack={() => setCurrentView(VIEWS.GOALS_HOME)} /> : renderHomeView();
    
    case VIEWS.RECURRING_VIEW:
      return renderRecurringView();
    
    case VIEWS.ONE_TIME_VIEW:
      return renderOneTimeView();
    
    default:
      return renderHomeView();
  }
};

export default Goals;