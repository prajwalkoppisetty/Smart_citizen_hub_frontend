import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { complaintService } from '../services/complaintService';
import { Card } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ImageLightbox from '../components/common/ImageLightbox';
import { 
  ClipboardList, CheckCircle2, Clock, 
  ShieldAlert, MapPin, Edit3, RefreshCw
} from 'lucide-react';

export default function OfficerDashboard({ role = 'Local Officer' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();
  
  // States
  const [complaints, setComplaints] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [localOfficers, setLocalOfficers] = useState([]);
  const [selectedLocalOfficer, setSelectedLocalOfficer] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedComp, setSelectedComp] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [newStatus, setNewStatus] = useState('In Progress');
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await complaintService.getComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch officer complaints:", err);
      setError(err.userMessage || "Failed to load complaints registry from the E-Governance server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldOfficers = async () => {
    console.log("[OfficerDashboard] Fetching field officers from backend...");
    try {
      const data = await complaintService.getFieldOfficers();
      console.log("[OfficerDashboard] Field officers fetched successfully:", data);
      setFieldOfficers(data || []);
    } catch (err) {
      console.error("[OfficerDashboard] Failed to fetch field officers:", err);
    }
  };

  const fetchLocalOfficers = async () => {
    console.log("[OfficerDashboard] Fetching local officers from backend...");
    try {
      const data = await complaintService.getLocalOfficers();
      console.log("[OfficerDashboard] Local officers fetched successfully:", data);
      setLocalOfficers(data || []);
    } catch (err) {
      console.error("[OfficerDashboard] Failed to fetch local officers:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
      const isAllowedRole = 
        ['local_officer', 'municipal_officer', 'admin', 'Local Officer', 'Municipal Officer', 'Admin'].includes(user.role) ||
        ['local_officer', 'municipal_officer', 'admin'].includes(user.databaseRole);
      
      if (isAllowedRole) {
        fetchFieldOfficers();
      }

      if (role === 'Municipal Officer' || role === 'Admin') {
        fetchLocalOfficers();
      }
    }
  }, [user, role]);

  const refreshList = () => {
    fetchComplaints();
  };

  // Calculations
  const myLayerComplaints = complaints.filter(c => {
    const layer = c.currentLayer || 'local_officer';
    if (role === 'Local Officer') return layer === 'local_officer';
    if (role === 'Municipal Officer') return layer === 'municipal_officer';
    if (role === 'Admin') return layer === 'admin';
    return true;
  });

  const totalCount = myLayerComplaints.length;
  const pendingCount = myLayerComplaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = myLayerComplaints.filter(c => c.status === 'Resolved').length;

  const escalatedCount = complaints.filter(c => {
    const layer = c.currentLayer || 'local_officer';
    if (role === 'Local Officer') return layer !== 'local_officer';
    if (role === 'Municipal Officer') return layer === 'admin' || layer === 'hq';
    if (role === 'Admin') return layer === 'hq';
    return false;
  }).length;

  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const canEditComplaint = (comp) => {
    if (!comp) return false;
    if (comp.status === 'Resolved' || comp.status === 'Escalated') return false;
    const layer = comp.currentLayer || 'local_officer';
    if (role === 'Local Officer') return layer === 'local_officer';
    if (role === 'Municipal Officer') return layer === 'municipal_officer';
    if (role === 'Admin') return layer === 'admin';
    return false;
  };

  const filteredComplaints = complaints.filter(c => {
    const layer = c.currentLayer || 'local_officer';
    
    if (role === 'Local Officer') {
      if (activeTab === 'Pending') {
        return layer === 'local_officer' && c.status !== 'Resolved';
      }
      if (activeTab === 'Resolved') {
        return layer === 'local_officer' && c.status === 'Resolved';
      }
      if (activeTab === 'Escalated') {
        return layer !== 'local_officer';
      }
      return true;
    }
    
    if (role === 'Municipal Officer') {
      if (activeTab === 'Pending') {
        return layer === 'municipal_officer' && c.status !== 'Resolved';
      }
      if (activeTab === 'Resolved') {
        return layer === 'municipal_officer' && c.status === 'Resolved';
      }
      if (activeTab === 'Escalated') {
        return layer === 'admin' || layer === 'hq';
      }
      return layer === 'municipal_officer' || layer === 'admin' || layer === 'hq';
    }
    
    if (role === 'Admin') {
      if (activeTab === 'Pending') {
        return layer === 'admin' && c.status !== 'Resolved';
      }
      if (activeTab === 'Resolved') {
        return layer === 'admin' && c.status === 'Resolved';
      }
      if (activeTab === 'Escalated') {
        return layer === 'hq';
      }
      return layer === 'admin' || layer === 'hq';
    }
    
    return true;
  });

  const handleOpenActionModal = (comp) => {
    setSelectedComp(comp);
    setNewStatus(comp.status);
    
    // Map the string name back to the officer's MongoDB ID
    const officerObj = fieldOfficers.find(o => o.name === comp.assignedOfficer);
    setAssignedOfficer(officerObj ? officerObj._id : '');
    
    setRemarks(comp.officerRemarks || '');
    setModalOpen(true);
  };

  const handleSaveAction = async () => {
    if (!remarks.trim()) {
      addToast('Please input official remarks/progress update.', 'warning');
      return;
    }
    
    try {
      if (role !== 'Local Officer' && selectedLocalOfficer) {
        const selectedOfficerObj = localOfficers.find(o => o._id === selectedLocalOfficer);
        const officerName = selectedOfficerObj ? selectedOfficerObj.name : 'Local Officer';
        
        await complaintService.updateComplaint(selectedComp.id, {
          officer: selectedLocalOfficer,
          currentLayer: 'local_officer',
          status: 'Under Review',
          officerRemarks: `Ticket delegated/routed back to Local Officer ${officerName} by ${role}. Remarks: ${remarks.trim()}`
        });

        addToast(`Ticket #${selectedComp.id} successfully delegated to ${officerName}!`, 'success');
      } else if (newStatus === 'Assigned') {
        if (!assignedOfficer) {
          addToast('Please select a field officer to assign.', 'warning');
          return;
        }
        await complaintService.assignFieldOfficer(selectedComp.id, {
          fieldOfficerId: assignedOfficer,
          notes: remarks.trim()
        });
        addToast(`Ticket #${selectedComp.id} assigned successfully!`, 'success');
      } else {
        const payload = {
          status: newStatus,
          remarks: remarks.trim(),
          officerRemarks: remarks.trim()
        };
        await complaintService.updateComplaint(selectedComp.id, payload);
        addToast(`Ticket #${selectedComp.id} updated to [${newStatus}] successfully!`, 'success');
      }
      
      setModalOpen(false);
      setSelectedComp(null);
      setRemarks('');
      setAssignedOfficer('');
      setSelectedLocalOfficer('');
      refreshList();
    } catch (err) {
      console.error("Failed to update complaint:", err);
      addToast(err.userMessage || "Failed to update complaint on backend.", "error");
    }
  };

  const handleVerifyAction = async (targetStatus) => {
    if (!remarks.trim()) {
      addToast('Please provide verification review notes/remarks.', 'warning');
      return;
    }

    let action = '';
    if (targetStatus === 'Resolved') action = 'approve';
    else if (targetStatus === 'In Progress') action = 'rework';
    else if (targetStatus === 'Under Review') action = 'reject';
    else if (targetStatus === 'Escalated') action = 'escalate';

    if (!action) {
      addToast('Invalid verification action.', 'error');
      return;
    }

    try {
      await complaintService.reviewFieldWork(selectedComp.id, {
        action,
        comments: remarks.trim()
      });
      
      let message = '';
      if (targetStatus === 'Resolved') message = `Approved resolution for ticket #${selectedComp.id}!`;
      else if (targetStatus === 'Under Review') message = `Rejected resolution for ticket #${selectedComp.id}. Sent back to review.`;
      else if (targetStatus === 'In Progress') message = `Rework requested for ticket #${selectedComp.id}. Assigned back to Field Officer.`;
      else if (targetStatus === 'Escalated') message = `Escalated ticket #${selectedComp.id} to Municipal HQ.`;
      
      addToast(message, 'success');
      setModalOpen(false);
      setSelectedComp(null);
      setRemarks('');
      setAssignedOfficer('');
      refreshList();
    } catch (err) {
      console.error("Failed to verify complaint:", err);
      addToast(err.userMessage || "Failed to update complaint verification state.", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans animate-pulse text-left">
        {/* Header skeleton */}
        <div className="h-28 bg-slate-200 rounded-3xl" />
        {/* KPI metrics skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        {/* List skeleton */}
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 rounded-xl w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl py-20 px-6 text-center text-slate-500 text-xs font-semibold space-y-4 animate-fade-in font-sans">
        <ShieldAlert className="h-12 w-12 mx-auto text-red-500" />
        <h3 className="text-base font-bold text-slate-800">Officer Dashboard Synchronization Error</h3>
        <p className="max-w-md mx-auto text-slate-400 font-medium leading-relaxed">{error}</p>
        <Button 
          variant="primary" 
          onClick={fetchComplaints}
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
      
      {/* 1. Header greeting */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden select-none text-left">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[200px] w-[200px] -z-10 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">
            {role === 'Local Officer' ? 'Local Officer Hub' : role === 'Municipal Officer' ? 'Municipal HQ Control' : 'System Administrator Terminal'}
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
            {role === 'Local Officer' ? `Assigned Ward Desk: ${user?.name}` : role === 'Municipal Officer' ? `Municipal Operations Hub: ${user?.name}` : `E-Governance Commission Console: ${user?.name}`}
          </h2>
          <p className="text-slate-400 text-xs font-medium">
            Department: {user?.department || 'Municipal works'} | Division: {user?.ward || 'General division'}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 p-3.5 rounded-2xl flex items-center space-x-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
            <ClipboardList className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="block text-sm font-bold text-white leading-none">{pendingCount}</span>
            <span className="text-[10px] font-semibold text-slate-400 block mt-1">Pending redressals</span>
          </div>
        </div>
      </div>

      {/* 2. KPI metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        
        {/* All complaints */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{totalCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">All Complaints</span>
          </div>
        </Card>

        {/* Pending complaints */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{pendingCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Pending Complaints</span>
          </div>
        </Card>

        {/* Escalated complaints */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{escalatedCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Escalated Complaints</span>
          </div>
        </Card>

        {/* Resolution Rate */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{resolutionRate}%</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Resolution Rate</span>
          </div>
        </Card>

      </div>

      {/* 3. Assigned list filter panel & Field Officers Directory */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left/Main Column: Complaints List */}
        <div className="xl:col-span-8 space-y-4">
          {/* Filter buttons */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex space-x-2">
              {['All', 'Pending', 'Resolved', 'Escalated'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{filteredComplaints.length} Tickets</span>
          </div>

          {/* Complaints cards container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((comp) => (
                <div 
                  key={comp.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-extrabold text-slate-400">#{comp.id}</span>
                      <div className="flex space-x-1.5 flex-wrap gap-y-1">
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
                    </div>

                    <div className="space-y-1 text-left">
                      <span className="block font-display font-bold text-sm text-slate-800 leading-snug truncate">
                        {comp.title}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-semibold flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span className="truncate max-w-[250px]">{comp.location}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2 text-left">
                      {comp.description}
                    </p>

                    {comp.officerRemarks && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Latest Remarks</span>
                        <p className="text-[11px] font-medium text-slate-600 mt-1 leading-relaxed">{comp.officerRemarks}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-50">
                    <Button
                      variant="primary"
                      size="sm"
                      className={`flex-1 justify-center ${
                        comp.status === 'Verification Pending'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/10'
                          : ''
                      }`}
                      leftIcon={
                        comp.status === 'Verification Pending' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Edit3 className="h-3.5 w-3.5" />
                        )
                      }
                      onClick={() => handleOpenActionModal(comp)}
                      disabled={!canEditComplaint(comp)}
                    >
                      {comp.status === 'Verification Pending' ? 'Verify Completion' : 'Update Progress'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/dashboard/complaint/${comp.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border border-slate-100 rounded-3xl py-16 text-center text-slate-400 text-xs font-semibold space-y-2">
                <ClipboardList className="h-10 w-10 mx-auto text-slate-200 animate-pulse" />
                <p>No complaints match this filter category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Field Officers Directory */}
        <div className="xl:col-span-4 space-y-4">
          <div className="border border-slate-100 bg-white rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-display font-extrabold text-sm text-slate-800">Field Dispatch Team</h3>
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {fieldOfficers.length} Active
              </span>
            </div>
            
            {fieldOfficers.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {fieldOfficers.map(officer => (
                  <div key={officer._id} className="flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-50">
                    <img 
                      src={officer.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256"} 
                      alt={officer.name} 
                      className="h-9 w-9 rounded-full object-cover border border-slate-100" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-800 truncate">{officer.name}</span>
                      <span className="block text-[10px] font-semibold text-slate-400 truncate">{officer.email}</span>
                      <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold">
                        {officer.ward || 'General Ward'}
                      </span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Active" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-semibold text-center py-6">No field officers registered in E-Governance DB.</p>
            )}
          </div>
        </div>

      </div>

      {/* 4. Action overlays Modal */}
      {selectedComp && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={
            selectedComp.status === 'Verification Pending'
              ? `Verify Grievance Resolution: #${selectedComp.id}`
              : `Update Redressal Progress: #${selectedComp.id}`
          }
          footer={
            selectedComp.status === 'Verification Pending' ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full justify-between items-center border-t border-slate-100 pt-4 mt-2">
                <Button variant="secondary" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
                  <Button 
                    variant="danger" 
                    onClick={() => handleVerifyAction('Under Review')}
                    className="w-full sm:w-auto"
                  >
                    Reject Resolution
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleVerifyAction('In Progress')}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20"
                  >
                    Request Rework
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => handleVerifyAction('Resolved')}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 border-none shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    Approve Resolution
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2 w-full justify-end">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveAction}>
                  Submit Changes
                </Button>
              </div>
            )
          }
        >
          {selectedComp.status === 'Verification Pending' ? (
            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 text-left">
              
              {/* Split layout: Citizen vs Field Officer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: Citizen Request */}
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Citizen Submission</h4>
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                      {selectedComp.description}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Citizen Attachment</span>
                    {(() => {
                      const citizenImages = selectedComp.rawImages && selectedComp.rawImages.length > 0
                        ? selectedComp.rawImages
                        : (selectedComp.images ? [selectedComp.images] : []);
                      
                      if (citizenImages.length === 0) {
                        return (
                          <div className="text-center py-6 bg-white border border-slate-100 rounded-xl text-slate-400 text-xs font-medium">
                            No photo attached by citizen
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {citizenImages.map((img, i) => (
                            <div 
                              key={i} 
                              className="relative rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
                              onClick={() => setLightboxImg(img)}
                            >
                              <img src={img} alt="Citizen upload" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Column: Field Officer Resolution */}
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Field Report</h4>
                    </div>
                    <Badge variant="field_officer">{selectedComp.assignedOfficer}</Badge>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-extrabold text-purple-600 uppercase tracking-widest">Work Notes</span>
                      <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{selectedComp.workNotes || "No work notes provided."}</p>
                    </div>
                    <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-extrabold text-green-600 uppercase tracking-widest">Completion Summary</span>
                      <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{selectedComp.completionNotes || "No completion notes provided."}</p>
                    </div>
                  </div>

                  {/* Before vs After image grid */}
                  <div className="space-y-3">
                    {/* Before Images */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Field Proof (Before)</span>
                      {selectedComp.beforeImages && selectedComp.beforeImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedComp.beforeImages.map((img, i) => (
                            <div 
                              key={i} 
                              className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
                              onClick={() => setLightboxImg(img)}
                            >
                              <img src={img} alt="Before work" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No before images.</div>
                      )}
                    </div>

                    {/* After Images */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Field Proof (After)</span>
                      {selectedComp.afterImages && selectedComp.afterImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedComp.afterImages.map((img, i) => (
                            <div 
                              key={i} 
                              className="relative rounded-lg overflow-hidden border border-slate-200 h-16 bg-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
                              onClick={() => setLightboxImg(img)}
                            >
                              <img src={img} alt="After work" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No after images.</div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Verification Remarks Textarea */}
              <div className="flex flex-col space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700">Verification Review Notes / Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide official review remarks or instructions for rework (this will be logged in history)..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-5 text-left">
              
              {/* Description reference */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Grievance Title: {selectedComp.title}</div>
                <p className="line-clamp-2">{selectedComp.description}</p>
              </div>

              {/* Quick Action Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Quick Status Route</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus('Under Review');
                      setAssignedOfficer('');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      newStatus === 'Under Review'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Under Review
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus('In Progress');
                      setAssignedOfficer('');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      newStatus === 'In Progress'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus('Escalated');
                      setAssignedOfficer('');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      newStatus === 'Escalated'
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Escalate
                  </button>
                </div>
              </div>

              {/* Assign Field Officer Section */}
              <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Assign Field Officer (Dispatch)</label>
                  {newStatus === 'Assigned' && (
                    <Badge variant="Assigned">Assigned</Badge>
                  )}
                </div>
                <select
                  value={newStatus === 'Assigned' ? assignedOfficer : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setNewStatus('Assigned');
                      setAssignedOfficer(e.target.value);
                    } else {
                      setNewStatus('In Progress');
                      setAssignedOfficer('');
                    }
                  }}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">-- Select Field Officer --</option>
                  {fieldOfficers.map(officer => (
                    <option key={officer._id} value={officer._id}>
                      {officer.name} ({officer.ward || 'General Ward'})
                    </option>
                  ))}
                </select>
                {newStatus === 'Assigned' && assignedOfficer && (() => {
                  const selectedOfficerObj = fieldOfficers.find(o => o._id === assignedOfficer);
                  return (
                    <span className="text-[10px] text-blue-600 font-bold block">
                      ✓ Ticket will be dispatched to Field Officer: {selectedOfficerObj ? selectedOfficerObj.name : ''}
                    </span>
                  );
                })()}
              </div>

              {/* Route to Local Officer Section (Only for Municipal Officer / Admin) */}
              {role !== 'Local Officer' && (
                <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 block">Delegate to Local Officer (Route)</label>
                    {selectedLocalOfficer && (
                      <Badge variant="Under Review">Delegated</Badge>
                    )}
                  </div>
                  <select
                    value={selectedLocalOfficer}
                    onChange={(e) => {
                      setSelectedLocalOfficer(e.target.value);
                      if (e.target.value) {
                        setNewStatus('Under Review');
                        setAssignedOfficer('');
                      }
                    }}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">-- Select Local Officer --</option>
                    {localOfficers.map(officer => (
                      <option key={officer._id} value={officer._id}>
                        {officer.name} ({officer.department || 'Municipal works'} - {officer.ward || 'General division'})
                      </option>
                    ))}
                  </select>
                  {selectedLocalOfficer && (() => {
                    const selectedOfficerObj = localOfficers.find(o => o._id === selectedLocalOfficer);
                    return (
                      <span className="text-[10px] text-blue-600 font-bold block">
                        ✓ Ticket will be delegated down to Local Officer: {selectedOfficerObj ? selectedOfficerObj.name : ''}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Direct Resolution Section */}
              <div className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 bg-white">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Resolve Directly</span>
                  <span className="text-[10px] text-slate-400 font-medium">Bypass dispatch workflow and close grievance now</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewStatus('Resolved');
                    setAssignedOfficer('');
                    setSelectedLocalOfficer('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    newStatus === 'Resolved'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {newStatus === 'Resolved' ? 'Selected' : 'Resolve'}
                </button>
              </div>

              {/* Official Action Remarks */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Action Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe actions taken, delegation/dispatch details, or escalation reason..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

            </div>
          )}
        </Modal>
      )}

      {/* Image Lightbox Viewer Modal */}
      {lightboxImg && (
        <ImageLightbox 
          src={lightboxImg} 
          onClose={() => setLightboxImg(null)} 
        />
      )}

    </div>
  );
}
