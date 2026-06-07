import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/common/Button';
import { Bell, Eye, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const data = response.data || response;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markNotificationsAsRead();
      addToast('All notifications marked as read', 'success');
      fetchNotifs();
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
      addToast("Failed to mark notifications as read on backend.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
            Loading Notifications...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 text-left">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">System Notices</span>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Regional Notifications Log
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review live alerts regarding SLA escalations, status revisions, and operational assignments.
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 flex items-center space-x-1"
          leftIcon={<CheckCheck className="h-4 w-4" />}
          onClick={handleMarkAllRead}
        >
          <span>Mark All Read</span>
        </Button>
      </div>

      {/* Notifications list */}
      <div className="space-y-3 max-w-3xl mx-auto animate-slide-up">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4 text-left ${
                n.read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/20'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600`}>
                  <Bell className="h-4.5 w-4.5" />
                </div>
                
                <div className="space-y-1">
                  <p className={`text-xs sm:text-sm leading-relaxed ${n.read ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>
                    {n.message}
                  </p>
                  <span className="block text-[10px] text-slate-400 font-semibold">{n.date}</span>
                </div>
              </div>

              {n.complaintId && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                  onClick={() => navigate(`/dashboard/complaint/${n.complaintId}`)}
                >
                  Inspect
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl py-20 text-center text-slate-400 text-xs font-semibold space-y-2">
            <Bell className="h-10 w-10 mx-auto text-slate-200" />
            <p>Your notifications directory is completely empty.</p>
          </div>
        )}
      </div>

    </div>
  );
}
