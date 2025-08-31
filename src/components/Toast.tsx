import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseClasses = "fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white", 
    info: "bg-blue-500 text-white"
  };

  const iconClasses = {
    success: "✓",
    error: "✕",
    info: "ℹ"
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold">{iconClasses[type]}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
