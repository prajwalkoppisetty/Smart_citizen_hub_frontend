import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout shells
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Homepage from './pages/Homepage';
import Features from './pages/Features';
import Impact from './pages/Impact';
import HelpDesk from './pages/HelpDesk';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Pages
import DashboardHub from './pages/DashboardHub';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaints from './pages/TrackComplaints';
import ComplaintDetails from './pages/ComplaintDetails';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import GisMapDashboard from './pages/GisMapDashboard';
import OfficerAnalytics from './pages/OfficerAnalytics';

// Public Landing wrapper
function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/20">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            
            {/* 1. Public Multi-Page Routes */}
            <Route 
              path="/" 
              element={
                <PublicLayout>
                  <Homepage />
                </PublicLayout>
              } 
            />
            <Route 
              path="/features" 
              element={
                <PublicLayout>
                  <Features />
                </PublicLayout>
              } 
            />

            <Route 
              path="/impact" 
              element={
                <PublicLayout>
                  <Impact />
                </PublicLayout>
              } 
            />
            <Route 
              path="/help-desk" 
              element={
                <PublicLayout>
                  <HelpDesk />
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/login" 
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicLayout>
                  <Signup />
                </PublicLayout>
              } 
            />

            {/* 2. Protected Dashboard Portal Nesting */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              {/* Default Main Dashboard */}
              <Route index element={<DashboardHub />} />
              
              {/* Feature subroutes */}
              <Route path="submit" element={<SubmitComplaint />} />
              <Route path="track" element={<TrackComplaints />} />
              <Route path="complaint/:id" element={<ComplaintDetails />} />
              <Route path="map" element={<GisMapDashboard />} />
              <Route path="analytics" element={<OfficerAnalytics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* 3. Fallback Redirect back to Homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
