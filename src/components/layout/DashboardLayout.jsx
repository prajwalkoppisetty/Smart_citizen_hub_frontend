import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Enforce auth guard inside layout
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
            Authenticating Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 overflow-hidden">
      
      {/* Unified Fixed Navbar */}
      <Navbar />

      {/* Main body: Sidebar + Content */}
      <div className="flex flex-grow pt-16 h-[calc(100vh-4rem)] overflow-hidden">
        
        {/* Sidebar Left Drawer */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Floating Mobile Sidebar Trigger (only visible on mobile/tablet) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 rounded-xl p-2.5 bg-white border border-slate-100 hover:bg-slate-50 shadow-sm text-slate-500 hover:text-slate-900 lg:hidden cursor-pointer"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {/* Scrollable Content Area */}
          <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/40 animate-fade-in pt-16 lg:pt-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>

        </div>

      </div>

    </div>
  );
}
