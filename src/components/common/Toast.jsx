import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const { id, message, type } = toast;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const borders = {
    success: 'border-green-100 bg-green-50/80',
    error: 'border-red-100 bg-red-50/80',
    warning: 'border-amber-100 bg-amber-50/80',
    info: 'border-blue-100 bg-blue-50/80',
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center justify-between border p-4 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in-right",
        borders[type]
      )}
    >
      <div className="flex items-center space-x-3">
        {icons[type]}
        <span className="font-sans text-xs font-semibold text-slate-800">{message}</span>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="ml-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
