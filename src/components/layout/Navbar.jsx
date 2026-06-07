import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { notificationsAPI } from '../../services/api';
import { Menu, X, Landmark, ArrowRight, ShieldCheck, ChevronDown, Bell, LogOut } from 'lucide-react';
import Button from '../common/Button';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useNotification();
  
  // States
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchNotifs = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const data = response.data || response;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications in public navbar:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markNotificationsAsRead();
      addToast('All notifications marked as read', 'info');
      setShowNotifMenu(false);
      fetchNotifs();
    } catch (err) {
      console.error("Failed to mark notifications read in public navbar:", err);
    }
  };

  const handleNotifClick = (complaintId) => {
    setShowNotifMenu(false);
    navigate(`/dashboard/complaint/${complaintId}`);
  };

  const linkClass = ({ isActive }) =>
    `font-sans text-sm font-bold transition-colors select-none cursor-pointer ${
      isActive ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block rounded-xl px-4 py-2.5 font-sans text-sm font-bold transition-all text-left cursor-pointer ${
      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 transition-transform duration-300 group-hover:scale-105">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                Smart Citizen<span className="text-blue-600">Hub</span>
              </span>
              <div className="flex items-center space-x-1 text-[9px] font-semibold text-blue-600 uppercase tracking-widest leading-none">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span>Municipal Portal</span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/features" className={linkClass}>
              Features
            </NavLink>
            <NavLink to="/impact" className={linkClass}>
              Impact
            </NavLink>
            <NavLink to="/help-desk" className={linkClass}>
              Help Desk
            </NavLink>
            
            {/* Dynamic Dashboard Link */}
            {isAuthenticated && (
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            
            {isAuthenticated ? (
              <>
                {/* 1. Notifications Bell Popover */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setShowProfileMenu(false);
                    }}
                    className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-100 p-2">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2 px-2 pt-1 text-left">
                        <span className="text-xs font-bold text-slate-800">Recent System Logs</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-slate-50 overflow-y-auto max-h-60 mt-1">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => n.complaintId && handleNotifClick(n.complaintId)}
                              className={`py-2.5 px-2 hover:bg-slate-50/50 rounded-lg transition-colors text-left ${n.complaintId ? 'cursor-pointer' : ''}`}
                            >
                              <p className={`text-[11px] leading-relaxed ${n.read ? 'text-slate-500' : 'text-slate-800 font-semibold'}`}>
                                {n.message}
                              </p>
                              <span className="text-[9px] text-slate-400 mt-1 block">{n.date}</span>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-slate-400 text-xs">No new notifications.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <span className="h-5 w-px bg-slate-200" />

                {/* 2. User profile avatar */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifMenu(false);
                    }}
                    className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-extrabold shadow-sm shadow-blue-500/10 overflow-hidden">
                      {user?.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        user?.avatar || 'US'
                      )}
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-100">
                      <div className="px-3 py-2 border-b border-slate-50 text-left">
                        <span className="block text-xs font-bold text-slate-800 truncate">{user?.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400 truncate block mt-0.5">{user?.email}</span>
                      </div>
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <span>Edit Account</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer border-t border-slate-50 mt-1 pt-2"
                      >
                        <LogOut className="h-3.5 w-3.5 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="font-sans text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => navigate('/signup')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 border-b border-slate-100 bg-white ${
          isOpen ? 'max-h-screen opacity-100 py-4 px-4' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-3">
          <NavLink to="/" end onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Home
          </NavLink>
          <NavLink to="/features" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Features
          </NavLink>
          <NavLink to="/impact" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Impact
          </NavLink>
          <NavLink to="/help-desk" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
            Help Desk
          </NavLink>
          
          {/* Mobile Dashboard link */}
          {isAuthenticated && (
            <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
              Dashboard
            </NavLink>
          )}
          
          <div className="border-t border-slate-100 pt-3 flex flex-col space-y-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex items-center justify-center space-x-2 w-full rounded-xl py-2.5 font-sans text-sm font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer border border-red-100"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center rounded-xl py-2.5 font-sans text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/signup');
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
