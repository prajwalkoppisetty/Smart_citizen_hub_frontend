import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { 
  Building2, Users, ClipboardList, CheckCircle2, 
  ShieldAlert, UserCheck, BarChart3 
} from 'lucide-react';

export default function AdminDashboard({ role = "Admin" }) {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [complaints, setComplaints] = useState([]);
  const [localOfficers, setLocalOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState(null);
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchComplaints = async () => {
    try {
      const data = await complaintService.getComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalOfficers = async () => {
    console.log("[AdminDashboard] Fetching local officers from backend...");
    try {
      const data = await complaintService.getLocalOfficers();
      console.log("[AdminDashboard] Local officers fetched successfully:", data);
      setLocalOfficers(data || []);
    } catch (err) {
      console.error("[AdminDashboard] Failed to fetch local officers:", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchLocalOfficers();
  }, []);

  const refreshList = () => {
    fetchComplaints();
  };

  // Metrics calculations
  const totalCount = complaints.length;
  const activeCount = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const escalatedCount = complaints.filter(c => c.status === 'Escalated').length;

  const handleOpenAssignModal = (comp) => {
    setSelectedComp(comp);
    
    // Match current assigned officer name back to their MongoDB ID
    const officerObj = localOfficers.find(o => o.name === comp.assignedOfficer);
    setAssignedOfficer(officerObj ? officerObj._id : (localOfficers[0]?._id || ''));
    
    setModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    try {
      if (!assignedOfficer) {
        addToast('Please select a local officer to route the ticket.', 'warning');
        return;
      }
      
      const selectedOfficerObj = localOfficers.find(o => o._id === assignedOfficer);
      const officerName = selectedOfficerObj ? selectedOfficerObj.name : 'Local Officer';

      await complaintService.updateComplaint(selectedComp.id, {
        officer: assignedOfficer,
        status: 'Under Review',
        officerRemarks: `Ticket assigned to Local Officer ${officerName} by E-Governance Admin.`
      });

      addToast(`Ticket #${selectedComp.id} successfully routed to ${officerName}!`, 'success');
      setModalOpen(false);
      setSelectedComp(null);
      refreshList();
    } catch (err) {
      console.error("Failed to route ticket:", err);
      addToast(err.userMessage || "Failed to route ticket on backend.", "error");
    }
  };

  // Quick escalate trigger
  const handleForceEscalate = async (id) => {
    try {
      await complaintService.updateComplaint(id, {
        status: 'Escalated',
        escalationReason: 'Manual emergency override trigger by Admin Office.'
      });
      addToast(`Ticket #${id} manually escalated to HQ.`, 'error');
      refreshList();
    } catch (err) {
      console.error("Failed to escalate ticket:", err);
      addToast(err.userMessage || "Failed to escalate ticket on backend.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
            Loading Complaints...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* 1. Header block */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden select-none text-left">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 h-[200px] w-[200px] -z-10 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">
            {role === 'Admin' ? 'System Administrator Terminal' : 'Municipal HQ Control'}
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
            {role === 'Admin' ? 'E-Governance Commission Console' : 'Municipal Operations Hub'}
          </h2>
          <p className="text-slate-400 text-xs font-medium">
            Operational Territory: Full Ward Metropolitan | SLA Status: Online
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 p-3.5 rounded-2xl flex items-center space-x-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="block text-sm font-bold text-white leading-none">{escalatedCount}</span>
            <span className="text-[10px] font-semibold text-slate-400 block mt-1">Escalated Tickets</span>
          </div>
        </div>
      </div>

      {/* 2. KPIs statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        
        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{totalCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Total System Complaints</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{activeCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Active Backlog</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{resolvedCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Resolved redresses</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-100 flex items-center space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{escalatedCount}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1">Escalation Ratio</span>
          </div>
        </Card>

      </div>

      {/* 3. Operational System List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-extrabold text-base text-slate-800">
            Metropolitan Grievance Registry
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{totalCount} Tickets Logged</span>
        </div>

        {/* Complaints Table */}
        <div className="w-full overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm text-left">
          <table className="w-full border-collapse text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 text-xs uppercase select-none">
              <tr>
                <th className="px-6 py-4.5 font-bold">Ticket ID</th>
                <th className="px-6 py-4.5 font-bold">Grievance Info</th>
                <th className="px-6 py-4.5 font-bold">Ward Area</th>
                <th className="px-6 py-4.5 font-bold">Priority / Status</th>
                <th className="px-6 py-4.5 font-bold">Assigned Lead</th>
                <th className="px-6 py-4.5 font-bold">Action Console</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-extrabold text-xs text-slate-400">
                    #{comp.id}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <span className="block font-bold text-slate-800 truncate">{comp.title}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold truncate">{comp.citizenName} | {comp.date}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                    {comp.location}
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={comp.status}>{comp.status}</Badge>
                      <Badge variant={comp.priority}>{comp.priority}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    {comp.assignedOfficer}
                  </td>
                  <td className="px-6 py-4 flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/dashboard/complaint/${comp.id}`)}
                    >
                      Audit
                    </Button>
                    
                    {comp.status !== 'Resolved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                        onClick={() => handleOpenAssignModal(comp)}
                      >
                        Route
                      </Button>
                    )}

                    {comp.status !== 'Resolved' && comp.status !== 'Escalated' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                        onClick={() => handleForceEscalate(comp.id)}
                      >
                        Escalate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. Assignment modal */}
      {selectedComp && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`E-Governance Ticket Routing: #${selectedComp.id}`}
          footer={
            <div className="flex space-x-2 w-full justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveAssignment}>
                Route to Department
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 text-left">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Grievance Title</span>
                <p className="text-xs font-bold text-slate-800 mt-1">{selectedComp.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Location: {selectedComp.location}</p>
              </div>
              <Badge variant={selectedComp.priority}>{selectedComp.priority}</Badge>
            </div>

            {/* Officer Select */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Route to Department Desk (Local Officer)</label>
              <select
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">-- Select Department Officer --</option>
                {localOfficers.map(officer => (
                  <option key={officer._id} value={officer._id}>
                    {officer.name} ({officer.department || 'Municipal Operations'} - {officer.ward || 'General Division'})
                  </option>
                ))}
              </select>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
