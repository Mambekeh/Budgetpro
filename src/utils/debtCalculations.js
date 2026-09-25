// Helper functions for debt calculations
export const calculateInterest = (principal, interestRate) => {
  const principalAmount = parseFloat(principal) || 0;
  const rate = parseFloat(interestRate) || 0;
  const interestAmount = parseFloat((principalAmount * (rate / 100)).toFixed(2));
  const totalPayable = parseFloat((principalAmount + interestAmount).toFixed(2));
  
  return {
    principal: principalAmount,
    interestAmount: interestAmount,
    totalPayable: totalPayable
  };
};

export const calculateDueStatus = (dueDate) => {
  if (!dueDate) return { status: 'normal', days: null };
  
  const today = new Date();
  const due = new Date(dueDate);
  
  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'overdue', days: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { status: 'due-today', days: 0 };
  } else if (diffDays === 1) {
    return { status: 'due-tomorrow', days: 1 };
  } else if (diffDays <= 2) {
    return { status: 'due-soon', days: diffDays };
  }
  
  return { status: 'normal', days: diffDays };
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const generatePaymentId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const calculateRemainingAfterPayment = (remaining, payment) => {
  const r = parseFloat(remaining) || 0;
  const p = parseFloat(payment) || 0;
  const value = Math.max(0, r - p);
  return Number(value.toFixed(2));
};