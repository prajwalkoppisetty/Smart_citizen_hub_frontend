import React from 'react';
import { useAuth } from '../context/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import OfficerDashboard from './OfficerDashboard';
import FieldOfficerDashboard from './FieldOfficerDashboard';

export default function DashboardHub() {
  const { role } = useAuth();

  if (role === 'Citizen') return <CitizenDashboard />;
  if (role === 'Local Officer') return <OfficerDashboard role="Local Officer" />;
  if (role === 'Field Officer') return <FieldOfficerDashboard />;
  if (role === 'Municipal Officer') return <OfficerDashboard role="Municipal Officer" />;
  if (role === 'Admin') return <OfficerDashboard role="Admin" />;
  
  return <CitizenDashboard />;
}
