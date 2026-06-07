import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { notificationsAPI } from '../../services/api';
import { Bell, LogOut, ShieldAlert, Landmark, Menu, ChevronDown, Check } from 'lucide-react';
import Button from '../common/Button';

export default function DashboardNavbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { addToast } = useNotification();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifs = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const data = response.data || response;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications in navbar:", err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll notifications every 30s
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markNotificationsAsRead();
      addToast('All notifications marked as read', 'info');
      setShowNotifMenu(false);
      fetchNotifs();
    } catch (err) {
      console.error("Failed to mark notifications read in navbar:", err);
    }
  };

  const handleNotifClick = (complaintId) => {
    setShowNotifMenu(false);
    navigate(`/dashboard/complaint/${complaintId}`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 shadow-sm font-sans select-none shrink-0">
      
      {/* Left: Branding & Mobile Menu Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic header title based on active role */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="font-display font-extrabold text-sm sm:text-base text-slate-900">
            Smart Citizen<span className="text-blue-600">Hub</span>
          </Link>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            {role} Workspace
          </span>
        </div>
      </div>

      {/* Right: Quick actions, notifications, role switcher, profile */}
      <div className="flex items-center space-x-4">
        


        {/* Notifications Popover */}
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

        {/* Vertical divider */}
        <span className="h-5 w-px bg-slate-200" />

        {/* Profile Dropdown */}
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
            <div className="hidden md:flex flex-col items-start leading-none text-left">
              <span className="text-xs font-bold text-slate-800">{user?.name}</span>
              <span className="text-[9px] font-semibold text-slate-400 mt-0.5">{user?.email}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-100">
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

      </div>

    </header>
  );
}
