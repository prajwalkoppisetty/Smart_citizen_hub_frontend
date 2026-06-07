import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({
  className,
  label,
  error,
  type = 'text',
  id,
  leftIcon,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="font-sans text-xs font-bold text-slate-700 tracking-wide"
        >
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center justify-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          id={id}
          type={inputType}
          className={cn(
            "w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:bg-slate-50",
            leftIcon ? "pl-11" : "",
            isPassword ? "pr-11" : "",
            error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>
      
      {error && (
        <span className="font-sans text-[11px] font-semibold text-red-600 leading-none">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
