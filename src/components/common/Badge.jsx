import React from 'react';
import { cn } from '../../lib/utils';

export default function Badge({ className, variant, children, ...props }) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold font-sans tracking-wide leading-none shrink-0 border';

  const variants = {
    // Complaint Statuses
    Submitted: 'bg-yellow-50 text-yellow-800 border-yellow-100',
    'Under Review': 'bg-amber-50 text-amber-800 border-amber-100',
    Assigned: 'bg-sky-50 text-sky-800 border-sky-100',
    'In Progress': 'bg-blue-50 text-blue-800 border-blue-100',
    'Work Completed': 'bg-teal-50 text-teal-800 border-teal-100',
    'Verification Pending': 'bg-purple-50 text-purple-800 border-purple-100',
    Resolved: 'bg-green-50 text-green-800 border-green-100',
    Escalated: 'bg-red-50 text-red-800 border-red-100 animate-pulse',

    // Priorities
    Low: 'bg-slate-50 text-slate-700 border-slate-100',
    Medium: 'bg-yellow-50 text-yellow-800 border-yellow-100',
    High: 'bg-red-50 text-red-800 border-red-100',

    // User Roles
    Citizen: 'bg-teal-50 text-teal-800 border-teal-100',
    'Field Officer': 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100',
    field_officer: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100',
    'Local Officer': 'bg-indigo-50 text-indigo-800 border-indigo-100',
    'Municipal Officer': 'bg-violet-50 text-violet-800 border-violet-100',
    Admin: 'bg-rose-50 text-rose-800 border-rose-100',

    default: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={cn(baseStyles, selectedVariant, className)} {...props}>
      {children}
    </span>
  );
}
