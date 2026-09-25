import React, { useEffect, useState } from 'react';
import './AppToast.css';

const AppToast = ({ message, type = 'success', duration = 2500, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible || !message) return null;

  const toastClass = `app-toast ${type}`;

  return (
    <div className={toastClass}>
      <div className="toast-content">
        {type === 'success' && '✅ '}
        {type === 'info' && 'ℹ️ '}
        {type === 'warning' && '⚠️ '}
        {type === 'error' && '❌ '}
        {message}
      </div>
      <button className="toast-close" onClick={() => {
        setIsVisible(false);
        if (onClose) onClose();
      }}>×</button>
    </div>
  );
};

export default AppToast;