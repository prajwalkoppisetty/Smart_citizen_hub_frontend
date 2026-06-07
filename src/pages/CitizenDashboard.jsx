import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import { Card } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { 
  CheckCircle2, Clock, ShieldAlert, FileText, 
  MapPin, PlusCircle, ArrowRight, Eye, RefreshCw
} from 'lucide-react';

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [citizenComplaints, setCitizenComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const complaintsData = await complaintService.getMyComplaints();
      setCitizenComplaints(complaintsData);

      // Attempt to load stats from backend, fall back to client-side calculations if it fails
      try {
        const statsData = await complaintService.getComplaintStats();
        setStats(statsData);
      } catch (statsErr) {
        console.warn("Backend statistics API failed, using client-side calculation fallback:", statsErr);
        setStats(null);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.userMessage || "Connection to E-Governance service failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fallback calculations if stats response is partial or empty
  const totalCount = stats?.total ?? citizenComplaints.length;
  const submittedCount = stats?.submitted ?? citizenComplaints.filter(c => c.status === 'Submitted').length;
  const underReviewCount = stats?.underReview ?? citizenComplaints.filter(c => c.status === 'Under Review').length;
  const inProgressCount = stats?.inProgress ?? citizenComplaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = stats?.resolved ?? citizenComplaints.filter(c => c.status === 'Resolved').length;
  const escalatedCount = stats?.escalated ?? citizenComplaints.filter(c => c.status === 'Escalated').length;

  // Active or pending includes Submitted, Under Review, and In Progress
  const activePendingCount = submittedCount + underReviewCount + inProgressCount;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left font-sans">
        {/* Welcome block skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-[280px] bg-slate-200 rounded-3xl" />
          <div className="lg:col-span-4 h-[280px] bg-slate-200 rounded-3xl" />
        </div>
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        {/* Recent & Breakdown skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-slate-200 rounded-3xl" />
          <div className="lg:col-span-4 h-80 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl py-20 px-6 text-center text-slate-500 text-xs font-semibold space-y-4 animate-fade-in font-sans">
        <ShieldAlert className="h-12 w-12 mx-auto text-red-500 animate-bounce" />
        <h3 className="text-base font-bold text-slate-800">Dashboard Synchronizer Error</h3>
        <p className="max-w-md mx-auto text-slate-400 font-medium leading-relaxed">{error}</p>
        <Button 
          variant="primary" 
          onClick={fetchDashboardData}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          className="mx-auto"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* 1. Welcome Greeting & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Welcome Block */}
        <div className="lg:col-span-8 bg-blue-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-500/10 relative overflow-hidden text-left">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[300px] w-[300px] -z-10 rounded-full bg-blue-500/20 blur-3xl" />
          
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-blue-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
              Citizen Portal Active
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.name}!
            </h2>
            <p className="text-blue-100 text-sm max-w-xl leading-relaxed">
              Submit water bursts, broken sodium bulbs, pothole failures, or illegal garbage piles. Your ward division is ready to process grievances under SLA metrics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-6">
            <Button
              variant="secondary"
              className="bg-white border-transparent text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
              leftIcon={<PlusCircle className="h-4.5 w-4.5" />}
              onClick={() => navigate('/dashboard/submit')}
            >
              Submit Grievance
            </Button>
            <Button
              variant="outline"
              className="border-blue-400 text-white hover:bg-blue-700 w-full sm:w-auto"
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
              onClick={() => navigate('/dashboard/track')}
            >
              Track Active Tickets
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-400 uppercase tracking-widest">
              Profile Summary
            </h3>
            
            <div className="flex items-center space-x-3">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="h-11 w-11 rounded-xl object-cover border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-sm font-extrabold">
                  {user?.avatar}
                </div>
              )}
              <div>
                <span className="block font-bold text-slate-800 text-sm">{user?.name}</span>
                <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{user?.email}</span>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-3 space-y-2.5 text-xs text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Ward Registration:</span>
                <span className="text-slate-800">{user?.ward || 'Ward 12'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Updates:</span>
                <span className="text-slate-800">{user?.phone || 'Not Configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security Clearance:</span>
                <span className="text-teal-600 font-bold">Authenticated</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-slate-500 hover:text-slate-900 mt-4 border border-slate-100 hover:bg-slate-50"
            onClick={() => navigate('/dashboard/profile')}
          >
            Manage Settings
          </Button>
        </div>

      </div>

      {/* 2. Grievance statistics counter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-slide-up">
        
        {/* Total Filed */}
        <Card className="p-4 border-slate-100 flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-lg font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">Total</span>
          </div>
        </Card>

        {/* Submitted */}
        <Card className="p-4 border-slate-100 flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-lg font-extrabold text-slate-900">{submittedCount}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">Submitted</span>
          </div>
        </Card>

        {/* Under Review */}
        <Card className="p-4 border-slate-100 flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-lg font-extrabold text-slate-900">{underReviewCount}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">Reviewing</span>
          </div>
        </Card>

        {/* In Progress */}
        <Card className="p-4 border-slate-100 flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-lg font-extrabold text-slate-900">{inProgressCount}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">Progressing</span>
          </div>
        </Card>

        {/* Resolved */}
        <Card className="p-4 border-slate-100 flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-lg font-extrabold text-slate-900">{resolvedCount}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">Resolved</span>
          </div>
        </Card>

        {/* Escalated */}
        <Card className="p-4 border-slate-100 flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div className="text-left leading-none">
            <span className="block text-lg font-extrabold text-slate-900">{escalatedCount}</span>
            <span className="text-[10px] font-bold text-slate-500 block mt-1 uppercase tracking-wider">Escalated</span>
          </div>
        </Card>

      </div>

      {/* 3. Recent Complaints & Status Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recent list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-extrabold text-base text-slate-800">
              Your Recent Grievances
            </h3>
            <button
              onClick={() => navigate('/dashboard/track')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer bg-transparent border-none outline-none"
            >
              See All Filed
            </button>
          </div>

          <div className="space-y-3">
            {citizenComplaints.length > 0 ? (
              citizenComplaints.slice(0, 3).map((comp) => (
                <div 
                  key={comp.id}
                  className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md"
                >
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-[10px] font-extrabold font-mono text-slate-400">#{comp.id}</span>
                      <Badge variant={comp.status}>{comp.status}</Badge>
                      <Badge variant={comp.priority}>{comp.priority}</Badge>
                      {comp.slaDeadline && (
                        (() => {
                          const deadline = new Date(comp.slaDeadline);
                          const now = new Date();
                          if (comp.status === 'Resolved') {
                            const resolvedAt = comp.updatedAt ? new Date(comp.updatedAt) : now;
                            const met = resolvedAt <= deadline;
                            return (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                met ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                {met ? 'SLA: Met' : 'SLA: Overdue'}
                              </span>
                            );
                          }
                          const diffTime = deadline - now;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            return (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-red-50 text-red-700 border border-red-100 animate-pulse">
                                SLA: Overdue ({Math.abs(diffDays)}d)
                              </span>
                            );
                          } else if (diffDays === 0) {
                            const diffHrs = Math.ceil(diffTime / (1000 * 60 * 60));
                            return (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                SLA: Due in {diffHrs}h
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                SLA: {diffDays}d left
                              </span>
                            );
                          }
                        })()
                      )}
                    </div>
                    <span className="block font-display font-bold text-sm text-slate-800 leading-tight">
                      {comp.title}
                    </span>
                    <span className="flex items-center text-[10px] text-slate-400 font-semibold space-x-1.5">
                      <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{comp.location}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      <span>{comp.date}</span>
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0 flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/dashboard/complaint/${comp.id}`)}
                  >
                    Details
                  </Button>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl py-12 px-6 text-center text-slate-400 text-xs font-medium space-y-3">
                <FileText className="h-10 w-10 mx-auto text-slate-200" />
                <p>You have not registered any grievances yet.</p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/submit')}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                  className="mx-auto"
                >
                  File Complaint
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* E-Gov Redressal Progress (SaaS flexbar) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800">
              Grievance Breakdown
            </h3>
            
            <div className="space-y-4.5 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Resolved Redressals</span>
                  <span>{totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-green-500 transition-all duration-500" 
                    style={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Active Investigation</span>
                  <span>{totalCount > 0 ? Math.round((activePendingCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${totalCount > 0 ? (activePendingCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Escalation Backlog</span>
                  <span>{totalCount > 0 ? Math.round((escalatedCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-red-500 transition-all duration-500" 
                    style={{ width: `${totalCount > 0 ? (escalatedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-[11px] leading-relaxed text-slate-500 font-semibold space-y-1 flex items-start space-x-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-white font-mono font-bold leading-none">
              !
            </span>
            <p>
              Your municipal ward operates under a 48-hour SLA policy. If local action delays, tickets auto-escalate.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
