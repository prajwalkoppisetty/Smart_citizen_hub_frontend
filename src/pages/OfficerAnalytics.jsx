import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { BarChart3, TrendingUp, Users, Clock, Loader2, Award, Zap, ShieldCheck } from 'lucide-react';

export default function OfficerAnalytics() {
  const { addToast } = useNotification();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await complaintService.getOfficerAnalytics();
        setAnalytics(data || []);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        addToast("Failed to fetch performance analytics from municipal registry.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Compute overall municipal metrics
  const totalAssigned = analytics.reduce((sum, o) => sum + o.assigned, 0);
  const totalResolved = analytics.reduce((sum, o) => sum + o.resolved, 0);
  const totalActive = analytics.reduce((sum, o) => sum + o.active, 0);
  const totalOverdue = analytics.reduce((sum, o) => sum + o.overdue, 0);
  
  const resolvedWithSLA = analytics.reduce((sum, o) => {
    const resolvedSlaCount = Math.round((o.slaComplianceRate / 100) * o.resolved);
    return sum + resolvedSlaCount;
  }, 0);
  
  const overallSlaRate = totalResolved > 0 ? Math.round((resolvedWithSLA / totalResolved) * 100) : 100;
  
  const totalWeightResTime = analytics.reduce((sum, o) => sum + (o.avgResolutionTimeHrs * o.resolved), 0);
  const overallAvgResTime = totalResolved > 0 ? parseFloat((totalWeightResTime / totalResolved).toFixed(1)) : 0;

  // Sorting: Top performing officers based on SLA Compliance and volume
  const sortedLeaderboard = [...analytics].sort((a, b) => {
    if (b.slaComplianceRate !== a.slaComplianceRate) {
      return b.slaComplianceRate - a.slaComplianceRate;
    }
    return b.resolved - a.resolved;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left font-sans">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Municipal HQ Operations</span>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Officer Performance Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Audit average turnaround times, SLA compliance indices, and resolution volumes across deployment desks.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Assigned */}
        <Card className="bg-white border-slate-100 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Dispatched</span>
            <span className="text-xl font-black text-slate-800">{totalAssigned} Complaints</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">{totalActive} currently active</span>
          </div>
        </Card>

        {/* Resolved on Time */}
        <Card className="bg-white border-slate-100 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Resolved</span>
            <span className="text-xl font-black text-slate-800">{totalResolved} Tickets</span>
            <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">{resolvedWithSLA} resolved within SLA</span>
          </div>
        </Card>

        {/* SLA Compliance Index */}
        <Card className="bg-white border-slate-100 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLA Adherence Rate</span>
            <span className="text-xl font-black text-slate-800">{overallSlaRate}%</span>
            <span className="text-[9px] text-red-500 font-bold block mt-0.5">{totalOverdue} tickets overdue</span>
          </div>
        </Card>

        {/* Average Resolution Time */}
        <Card className="bg-white border-slate-100 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Resolution Time</span>
            <span className="text-xl font-black text-slate-800">{overallAvgResTime} hrs</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Approx. {Math.round(overallAvgResTime / 24)} days per ticket</span>
          </div>
        </Card>

      </div>

      {/* SVG Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Turnaround Time Comparison Chart (SVG) */}
        <div className="lg:col-span-8">
          <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
              Turnaround Time by Officer (Hours)
            </h3>
            
            {analytics.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No resolved ticket metrics available for analysis.</p>
            ) : (
              <div className="space-y-4 pt-2">
                {analytics.slice(0, 5).map((o, idx) => (
                  <div key={o.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{o.name} <span className="text-[9px] font-bold text-slate-400 uppercase">({o.role})</span></span>
                      <span>{o.avgResolutionTimeHrs} hrs</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${Math.min(100, Math.max(8, (o.avgResolutionTimeHrs / Math.max(...analytics.map(a => a.avgResolutionTimeHrs || 1))) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* SLA Adherence Ring (SVG) */}
        <div className="lg:col-span-4">
          <Card className="bg-white border-slate-100 p-6 rounded-3xl shadow-sm text-center flex flex-col justify-between h-full space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 text-left flex items-center gap-1.5">
              <Zap className="h-4.5 w-4.5 text-yellow-500" />
              SLA Quality Level
            </h3>

            <div className="relative flex items-center justify-center py-6">
              {/* Radial Progress Ring */}
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="#F1F5F9"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="url(#slaGrad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={339.29}
                  strokeDashoffset={339.29 - (339.29 * overallSlaRate) / 100}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="slaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800">{overallSlaRate}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Compliance</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start space-x-2 text-[10px] leading-relaxed text-slate-400 text-left font-semibold">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              <p>Municipal threshold targets a 90% SLA adherence rate. Focus on overdue items in the warning pane.</p>
            </div>
          </Card>
        </div>

      </div>

      {/* Performance Leaderboard Table */}
      <Card className="bg-white border-slate-100 rounded-3xl shadow-sm overflow-hidden text-left">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-display font-extrabold text-sm text-slate-800">Officer Performance Leaderboard</h3>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Sorted by SLA compliance score and total complaints resolved.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 font-extrabold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Officer Name</th>
                <th className="py-4 px-6">Administrative Role</th>
                <th className="py-4 px-6 text-center">Assigned</th>
                <th className="py-4 px-6 text-center">Resolved</th>
                <th className="py-4 px-6 text-center">Active / Pending</th>
                <th className="py-4 px-6 text-center text-red-500">Overdue</th>
                <th className="py-4 px-6 text-center">Avg Duration</th>
                <th className="py-4 px-6 text-center">SLA Met</th>
                <th className="py-4 px-6 text-right">Rating Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sortedLeaderboard.map((o) => {
                let badgeColor = "default";
                if (o.slaComplianceRate >= 90) badgeColor = "success";
                else if (o.slaComplianceRate >= 70) badgeColor = "warning";
                else badgeColor = "danger";

                // Map SLA compliance to a 5-star metric
                const stars = Math.max(1, Math.min(5, Math.ceil(o.slaComplianceRate / 20)));

                return (
                  <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{o.name}</td>
                    <td className="py-4 px-6 font-semibold text-slate-400">{o.role}</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-800">{o.assigned}</td>
                    <td className="py-4 px-6 text-center text-emerald-600 font-bold">{o.resolved}</td>
                    <td className="py-4 px-6 text-center text-amber-500 font-bold">{o.active}</td>
                    <td className="py-4 px-6 text-center text-red-600 font-bold">{o.overdue}</td>
                    <td className="py-4 px-6 text-center font-mono">{o.avgResolutionTimeHrs} hrs</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        o.slaComplianceRate >= 90 ? 'bg-emerald-50 text-emerald-700' :
                        o.slaComplianceRate >= 75 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {o.slaComplianceRate}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-yellow-500">
                      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
