// context/FinanceContext.jsx - COMPLETE FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FinanceContext = createContext();

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  // Core financial data
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recurringGoalsTotal, setRecurringGoalsTotal] = useState(0);
  const [oneTimeGoals, setOneTimeGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [categorySpending, setCategorySpending] = useState({});
  
  // Store expense list for notification calculations
  const [expenseList, setExpenseList] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  
  // Unified notification system
  const [notifications, setNotifications] = useState({});
  
  // Computed net balance
  const netBalance = totalIncome - totalExpenses;
  
  // Currency from settings
  const getCurrencySymbol = useCallback(() => {
    const code = localStorage.getItem('bp_currency') || 'ZAR';
    switch (code) {
      case 'USD': return '$';
      case 'KES': return 'KSh';
      case 'NGN': return '₦';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'ZAR':
      default: return 'R';
    }
  }, []);

  // Add system notification
  const addSystemNotification = useCallback((scope, type, message) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      scope,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => ({
      ...prev,
      [scope]: [...(prev[scope] || []), newNotification]
        .filter((notification, index, self) => 
          index === self.findIndex(n => n.message === notification.message)
        )
        .slice(0, 10)
    }));

    // Auto-remove after time
    const timeout = type === 'warning' ? 12000 : 8000;
    setTimeout(() => {
      setNotifications(prev => ({
        ...prev,
        [scope]: (prev[scope] || []).filter(n => n.id !== id)
      }));
    }, timeout);
  }, []);

  // 🔹 PROMPT 1 FIX: Pure and idempotent recalculateFinance
  const recalculateFinance = useCallback((incomeListParam = [], expenseListParam = []) => {
    // 🔹 RESET to zero before calculation
    let newTotalIncome = 0;
    let newTotalExpenses = 0;
    const newCategorySpending = {};

    // Calculate total income - fresh calculation
    incomeListParam.forEach(income => {
      newTotalIncome += parseFloat(income.amount || 0);
    });

    // Calculate total expenses and category spending - fresh calculation
    expenseListParam.forEach(expense => {
      const amount = parseFloat(expense.amount || 0);
      newTotalExpenses += amount;
      
      const category = expense.category || 'Other';
      newCategorySpending[category] = (newCategorySpending[category] || 0) + amount;
    });

    // Update state with fresh calculations
    setTotalIncome(newTotalIncome);
    setTotalExpenses(newTotalExpenses);
    setCategorySpending(newCategorySpending);
    
    // Store lists for notification calculations
    setIncomeList(incomeListParam);
    setExpenseList(expenseListParam);

    console.log('✅ recalculateFinance called:', { 
      income: newTotalIncome, 
      expenses: newTotalExpenses, 
      balance: newTotalIncome - newTotalExpenses 
    });

    // Generate notifications immediately
    generateSystemNotifications(newTotalIncome, newTotalExpenses, newCategorySpending);

    return { 
      totalIncome: newTotalIncome, 
      totalExpenses: newTotalExpenses, 
      netBalance: newTotalIncome - newTotalExpenses,
      categorySpending: newCategorySpending
    };
  }, []);

  // 🔹 PROMPT 2 FIX: Reactive notification generation
  const generateSystemNotifications = useCallback((income, expenses, categoryData) => {
    const currencySymbol = getCurrencySymbol();
    const balance = income - expenses;
    
    console.log('🔄 Generating notifications:', { 
      income, 
      expenses, 
      balance,
      hasData: income > 0 || expenses > 0 
    });
    
    // 🔹 Clear existing dashboard notifications first
    setNotifications(prev => ({
      ...prev,
      dashboard: []
    }));
    
    // Check for data before generating notifications
    if (income === 0 && expenses === 0) {
      addSystemNotification('dashboard', 'info', 
        '💡 Add some income and expenses to get personalized insights!'
      );
      return;
    }
    
    // Balance notifications (PRIORITY 1)
    if (balance < 0) {
      addSystemNotification('dashboard', 'warning', 
        `⚠️ Overspent! Balance: -${currencySymbol}${Math.abs(balance).toFixed(2)}`
      );
    } else if (balance > 0) {
      addSystemNotification('dashboard', 'success',
        `✅ Positive balance: ${currencySymbol}${balance.toFixed(2)}`
      );
    } else {
      addSystemNotification('dashboard', 'info',
        `⚖️ Break-even: ${currencySymbol}${income.toFixed(2)} income = ${currencySymbol}${expenses.toFixed(2)} expenses`
      );
    }
    
    // Expenses exceed income (PRIORITY 2)
    if (expenses > income && income > 0) {
      addSystemNotification('dashboard', 'warning',
        `🚨 Overspending! Expenses exceed income by ${currencySymbol}${(expenses - income).toFixed(2)}`
      );
    }
    
    // Savings rate notification (PRIORITY 3)
    if (income > 0) {
      const savingsRate = ((income - expenses) / income) * 100;
      
      if (savingsRate > 20) {
        addSystemNotification('dashboard', 'success',
          `📈 Great! Saving ${savingsRate.toFixed(0)}% of income`
        );
      } else if (savingsRate < 0) {
        addSystemNotification('dashboard', 'warning',
          `⚠️ Overspending by ${Math.abs(savingsRate).toFixed(0)}%`
        );
      } else if (savingsRate > 0 && savingsRate <= 10) {
        addSystemNotification('dashboard', 'insight',
          `💡 Save more! Only ${savingsRate.toFixed(0)}% saved`
        );
      }
    }
    
    // Category spending insights (PRIORITY 4)
    if (Object.keys(categoryData).length > 0) {
      const categories = Object.entries(categoryData);
      categories.sort((a, b) => b[1] - a[1]);
      
      if (categories.length > 0) {
        const [topCategory, topAmount] = categories[0];
        const totalSpent = Object.values(categoryData).reduce((a, b) => a + b, 0);
        const percentage = (topAmount / totalSpent) * 100;
        
        if (percentage > 40) {
          addSystemNotification('dashboard', 'insight',
            `📊 Most spending: ${percentage.toFixed(0)}% on ${topCategory}`
          );
        }
      }
    }
    
    // Needs vs Wants analysis (PRIORITY 5)
    if (expenseList.length > 0) {
      const needsExpenses = expenseList.filter(e => e.type === 'Need').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const wantsExpenses = expenseList.filter(e => e.type === 'Want').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      if (wantsExpenses > needsExpenses && wantsExpenses > 0) {
        addSystemNotification('dashboard', 'insight',
          `🎯 Review: Wants (${currencySymbol}${wantsExpenses.toFixed(2)}) > Needs (${currencySymbol}${needsExpenses.toFixed(2)})`
        );
      }
    }
  }, [getCurrencySymbol, expenseList, addSystemNotification]);

  // 🔹 PROMPT 2 FIX: React to financial data changes
  useEffect(() => {
    if (totalIncome > 0 || totalExpenses > 0) {
      console.log('📊 Data changed, regenerating notifications:', { totalIncome, totalExpenses });
      generateSystemNotifications(totalIncome, totalExpenses, categorySpending);
    }
  }, [totalIncome, totalExpenses, categorySpending, generateSystemNotifications]);

  // 🔹 CRITICAL FIX: Clear old notification state on app start
  useEffect(() => {
    const clearOldNotifications = () => {
      localStorage.removeItem('last_positive_notification');
      localStorage.removeItem('last_coverage_state');
      localStorage.removeItem('budgetPro_netBalance'); // Remove corrupted balance
      console.log('🧹 Cleared old notification state');
    };
    
    clearOldNotifications();
  }, []);

  // Get notifications by scope
  const getNotificationsByScope = useCallback((scope) => {
    return notifications[scope] || [];
  }, [notifications]);

  // Mark notification as read
  const markAsRead = useCallback((scope, id) => {
    setNotifications(prev => ({
      ...prev,
      [scope]: (prev[scope] || []).map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((scope, id) => {
    setNotifications(prev => ({
      ...prev,
      [scope]: (prev[scope] || []).filter(n => n.id !== id)
    }));
  }, []);

  // Clear all notifications for a scope
  const clearAllNotifications = useCallback((scope) => {
    setNotifications(prev => ({
      ...prev,
      [scope]: []
    }));
  }, []);

  // Update recurring goals total and generate notifications
  const updateRecurringGoalsTotal = useCallback((goals) => {
    const total = goals.reduce((sum, goal) => {
      if (goal.frequency === 'Weekly') return sum + (goal.amountPerPeriod * 4.33);
      if (goal.frequency === 'Yearly') return sum + (goal.amountPerPeriod / 12);
      return sum + goal.amountPerPeriod;
    }, 0);
    
    setRecurringGoalsTotal(total);
    
    // Generate notifications about goals coverage
    if (total > 0) {
      const currencySymbol = getCurrencySymbol();
      const coverage = (netBalance / total) * 100;
      
      // Clear old goal notifications first
      setNotifications(prev => ({
        ...prev,
        goals: []
      }));
      
      if (netBalance < total) {
        const shortage = total - netBalance;
        addSystemNotification('goals', 'insight',
          `🎯 Need ${currencySymbol}${shortage.toFixed(2)} more for monthly goals`
        );
        addSystemNotification('dashboard', 'insight',
          `🎯 ${currencySymbol}${shortage.toFixed(2)} needed for goals`
        );
      } else {
        addSystemNotification('goals', 'success',
          `✅ Balance covers monthly goals (${coverage.toFixed(0)}% coverage)`
        );
      }
    }
  }, [netBalance, getCurrencySymbol, addSystemNotification]);

  // Update one-time goals
  const updateOneTimeGoals = useCallback((goals) => {
    setOneTimeGoals(goals);
    
    // Generate notifications about goal progress
    const activeGoals = goals.filter(goal => {
      if (!goal.targetDate) return false;
      return new Date(goal.targetDate) > new Date();
    });

    activeGoals.forEach(goal => {
      const currentAmount = goal.currentAmount || 0;
      const targetAmount = goal.targetAmount;
      const progress = (currentAmount / targetAmount) * 100;
      const currencySymbol = getCurrencySymbol();

      if (progress >= 100) {
        addSystemNotification('goals', 'success',
          `🎉 Reached "${goal.name}" goal!`
        );
      } else if (goal.targetDate) {
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 30 && progress < 70) {
          const requiredDaily = (targetAmount - currentAmount) / Math.max(1, daysLeft);
          addSystemNotification('goals', 'insight',
            `⏰ Save ${currencySymbol}${requiredDaily.toFixed(2)} daily for "${goal.name}"`
          );
        }
      }
    });
  }, [getCurrencySymbol, addSystemNotification]);

  // Update debts
  const updateDebts = useCallback((debtsList) => {
    setDebts(debtsList);
    
    if (debtsList.length > 0) {
      const totalDebt = debtsList.reduce((sum, debt) => sum + (debt.balance || 0), 0);
      const currencySymbol = getCurrencySymbol();
      
      if (totalDebt > 0) {
        // Clear old debt notifications first
        setNotifications(prev => ({
          ...prev,
          debts: []
        }));
        
        addSystemNotification('debts', 'warning',
          `💳 Total debt: ${currencySymbol}${totalDebt.toFixed(2)}`
        );
        addSystemNotification('dashboard', 'warning',
          `💳 Debt balance: ${currencySymbol}${totalDebt.toFixed(2)}`
        );
      }
    }
  }, [getCurrencySymbol, addSystemNotification]);

  // Load initial data - FIXED VERSION
  useEffect(() => {
    // Only load recurring goals from localStorage
    const savedRecurringTotal = parseFloat(localStorage.getItem('budgetPro_recurringTotal') || '0');
    if (!isNaN(savedRecurringTotal)) {
      setRecurringGoalsTotal(savedRecurringTotal);
    }
    
    // DO NOT load netBalance into income - that's wrong!
    // The balance should only come from recalculateFinance(incomeList, expenseList)
  }, []);

  // Persist net balance
  useEffect(() => {
    localStorage.setItem('budgetPro_netBalance', netBalance.toFixed(2));
  }, [netBalance]);

  // Persist recurring goals total
  useEffect(() => {
    localStorage.setItem('budgetPro_recurringTotal', recurringGoalsTotal.toFixed(2));
  }, [recurringGoalsTotal]);

  const value = {
    // Financial data
    totalIncome,
    totalExpenses,
    netBalance,
    recurringGoalsTotal,
    oneTimeGoals,
    debts,
    categorySpending,
    
    // Update functions
    recalculateFinance,
    updateRecurringGoalsTotal,
    updateOneTimeGoals,
    updateDebts,
    
    // Notification system
    notifications,
    addSystemNotification,
    getNotificationsByScope,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    
    // Utilities
    getCurrencySymbol
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export default FinanceContext;