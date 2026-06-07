import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, PlusCircle, Search, Bell, Settings, 
  Landmark, X, UserCheck, ShieldAlert, Map, BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      roles: ['Citizen', 'Local Officer', 'Field Officer', 'Municipal Officer', 'Admin'],
      end: true
    },
    {
      id: 'submit',
      label: 'Submit Complaint',
      path: '/dashboard/submit',
      icon: <PlusCircle className="h-5 w-5" />,
      roles: ['Citizen'],
      end: false
    },
    {
      id: 'track',
      label: 'Track Complaints',
      path: '/dashboard/track',
      icon: <Search className="h-5 w-5" />,
      roles: ['Citizen', 'Local Officer', 'Field Officer', 'Municipal Officer', 'Admin'],
      end: false
    },
    {
      id: 'map',
      label: 'GIS Map',
      path: '/dashboard/map',
      icon: <Map className="h-5 w-5" />,
      roles: ['Citizen', 'Local Officer', 'Field Officer', 'Municipal Officer', 'Admin'],
      end: false
    },
    {
      id: 'analytics',
      label: 'Performance KPIs',
      path: '/dashboard/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ['Municipal Officer', 'Admin'],
      end: false
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/dashboard/notifications',
      icon: <Bell className="h-5 w-5" />,
      roles: ['Citizen', 'Local Officer', 'Field Officer', 'Municipal Officer', 'Admin'],
      end: false
    },
    {
      id: 'profile',
      label: 'Settings',
      path: '/dashboard/profile',
      icon: <Settings className="h-5 w-5" />,
      roles: ['Citizen', 'Local Officer', 'Field Officer', 'Municipal Officer', 'Admin'],
      end: false
    }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Backdrop overlay for mobile screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-400 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col justify-between font-sans select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top: Logo branding */}
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Landmark className="h-4.5 w-4.5" />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight text-white">
                Smart Citizen<span className="text-blue-500">Hub</span>
              </span>
            </Link>
            
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 px-4 py-6">
            {filteredItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.end}
                onClick={handleLinkClick}
                className={({ isActive }) => cn(
                  "flex w-full items-center space-x-3.5 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-300 cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom: Quick metadata badge */}
        <div className="border-t border-slate-800 p-4 shrink-0">
          <div className="flex items-center space-x-2 rounded-xl bg-slate-800/40 border border-slate-800 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-blue-500 font-bold text-xs shrink-0">
              {role === 'Admin' ? 'AD' : role === 'Citizen' ? 'CZ' : 'OF'}
            </div>
            <div className="overflow-hidden leading-none text-left">
              <span className="block text-[11px] font-bold text-white truncate uppercase tracking-wider">{role} Mode</span>
              <span className="text-[9px] font-semibold text-slate-500 mt-1 block">Gov-Tech Secure</span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
