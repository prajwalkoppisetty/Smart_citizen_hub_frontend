import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 font-sans tracking-wide cursor-pointer';

  const variants = {
    primary: 'bg-blue-600 text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/50',
    outline: 'bg-transparent text-blue-600 border-2 border-blue-600/20 hover:border-blue-600 hover:bg-blue-50/50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-600 text-white shadow-md shadow-red-500/10 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20',
  };

  const sizes = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-13 px-8 text-base rounded-2xl',
  };

  return (
    <button
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
      ) : leftIcon ? (
        <span className="mr-2 inline-flex">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
