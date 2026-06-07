import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { complaintService } from '../services/complaintService';
import { Card } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import ImageLightbox from '../components/common/ImageLightbox';
import { 
  ClipboardList, CheckCircle2, Clock, ShieldAlert, 
  MapPin, Upload, Camera, Trash2, Edit3, ArrowRight, Eye, Calendar
} from 'lucide-react';

export default function FieldOfficerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotification();
  
  // Data States
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Assigned'); // 'Assigned', 'Completed'

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState(null);

  // Modal States
  const [selectedComp, setSelectedComp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Completion Proof States
  const [afterPreviews, setAfterPreviews] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]); // Store actual File objects
  const [workNotes, setWorkNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch complaints on load
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintService.getAssignedComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error("Failed to load field officer complaints:", err);
      addToast("Failed to fetch assigned job registry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user.name]);

  // Handle Cleanups of Object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      afterPreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [afterPreviews]);

  // Image helpers
  const handleAfterImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        addToast(`File ${file.name} is too large. Max 2MB.`, 'warning');
        return;
      }
      setAfterFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterPreviews(prev => [...prev, { id: file.name + '-' + Math.random(), url: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClearAfter = (id, index) => {
    setAfterPreviews(prev => prev.filter(p => p.id !== id));
    setAfterFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenModal = (comp) => {
    setSelectedComp(comp);
    setAfterPreviews([]);
    setAfterFiles([]);
    setWorkNotes(comp.workNotes || '');
    setCompletionNotes(comp.completionNotes || '');
    setModalOpen(true);
  };

  const handleSubmitProof = async () => {
    if (afterFiles.length === 0) {
      addToast("Please provide at least one photo as resolution proof.", "warning");
      return;
    }
    if (!workNotes || !completionNotes) {
      addToast("Please supply work and completion notes.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('notes', `${workNotes}\n\nCompletion Summary: ${completionNotes}`);
      
      const beforeImagesPayload = (selectedComp.rawImages || []).map(url => ({ url, filename: '' }));
      formData.append('beforeImages', JSON.stringify(beforeImagesPayload));

      afterFiles.forEach(file => {
        formData.append('files', file);
      });

      await complaintService.submitFieldWork(selectedComp.id || selectedComp._id, formData);
      addToast("Completion report submitted successfully for review!", "success");
      setModalOpen(false);
      fetchComplaints();
    } catch (err) {
      console.error(err);
      addToast(err.userMessage || "Failed to submit resolution report.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI calculations
  const assignedJobs = complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status));
  const completedJobs = complaints.filter(c => ['Work Completed', 'Verification Pending', 'Resolved'].includes(c.status));
  const pendingVerification = complaints.filter(c => c.status === 'Verification Pending');

  const filteredJobs = complaints.filter(c => {
    if (activeTab === 'Assigned') {
      return ['Assigned', 'In Progress'].includes(c.status);
    } else {
      return ['Work Completed', 'Verification Pending', 'Resolved'].includes(c.status);
    }
  });

  if (loading) {
    return (
      <div className="space-y-6 font-sans animate-pulse text-left">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
        <div className="text-left">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Field Dispatch Unit</span>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Grievance Action Terminal: {user?.name}
          </h2>
          <p className="text-slate-400 text-xs font-medium">
            Role: Field Dispatch Executive | Active Region: Municipal Division
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
        
        {/* Assigned */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{assignedJobs.length}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1.5">Assigned Jobs</span>
          </div>
        </Card>

        {/* Completed */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{completedJobs.length}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1.5">Completed Jobs</span>
          </div>
        </Card>

        {/* Pending Verification */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-900 leading-none">{pendingVerification.length}</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1.5">Pending Verification</span>
          </div>
        </Card>

        {/* SLA Rate */}
        <Card className="p-4 border-slate-100 flex items-center space-x-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-900 leading-none">2.4 Days</span>
            <span className="text-[11px] font-semibold text-slate-500 block mt-1.5">Avg. Completion Time</span>
          </div>
        </Card>

      </div>

      {/* Task Filters */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex space-x-2">
            {['Assigned', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border-none outline-none cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab} Tasks ({tab === 'Assigned' ? assignedJobs.length : completedJobs.length})
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((comp) => (
              <div 
                key={comp.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full space-y-4 text-left"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-extrabold text-slate-400">#{comp.id}</span>
                    <div className="flex space-x-1.5">
                      <Badge variant={comp.status}>{comp.status}</Badge>
                      <Badge variant={comp.priority}>{comp.priority}</Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-slate-800 leading-snug truncate">
                      {comp.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-blue-500" />
                      <span className="truncate max-w-[280px]">{comp.location}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {comp.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t border-slate-50">
                  {activeTab === 'Assigned' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 justify-center"
                      leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                      onClick={() => handleOpenModal(comp)}
                    >
                      Report Resolution
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                      onClick={() => navigate(`/dashboard/complaint/${comp.id}`)}
                    >
                      View Action Summary
                    </Button>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full bg-white border border-slate-100 rounded-3xl py-16 text-center text-slate-400 text-xs font-semibold space-y-2">
              <ClipboardList className="h-10 w-10 mx-auto text-slate-200 animate-pulse" />
              <p>No jobs registered in this section.</p>
            </div>
          )}
        </div>

      </div>

      {/* Completion Modal */}
      {selectedComp && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Submit Resolution Evidence: #${selectedComp.id}`}
          footer={
            <div className="flex space-x-2 w-full justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitProof} isLoading={isSubmitting}>
                Submit Completion Report
              </Button>
            </div>
          }
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-left">
            
            {/* Description reference */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2 leading-relaxed text-slate-600">
              <div className="font-bold text-slate-800 text-sm">Grievance Description</div>
              <p>{selectedComp.description}</p>
            </div>

            {/* Original Grievance Photos Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Original Grievance Photos (Before Reference)</label>
              {selectedComp.rawImages && selectedComp.rawImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {selectedComp.rawImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative rounded-lg overflow-hidden border border-slate-100 h-16 bg-slate-50 cursor-zoom-in hover:opacity-95 transition-opacity"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img src={img} alt={`Grievance Ref ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-semibold italic">No citizen photos were attached to this ticket.</div>
              )}
            </div>

            {/* After images upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">After Work Images (Resolution Proof)</label>
              <div className="grid grid-cols-3 gap-2 items-center">
                {afterPreviews.map((p, idx) => (
                  <div key={p.id} className="relative rounded-lg overflow-hidden border border-slate-100 h-16">
                    <img src={p.url} alt="After preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleClearAfter(p.id, idx)}
                      className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/80 rounded-md text-white border-none cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {afterPreviews.length < 3 && (
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl h-16 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <Camera className="h-4.5 w-4.5 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Add Proof</span>
                    <input type="file" accept="image/*" onChange={handleAfterImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Work Notes */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Work Notes (Repairs Details)</label>
              <textarea
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                placeholder="Details of materials, repairs, machinery utilized..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Completion Notes */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Completion Notes</label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Final summary of task resolution..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>

          </div>
        </Modal>
      )}

      {lightboxImg && (
        <ImageLightbox 
          src={lightboxImg} 
          onClose={() => setLightboxImg(null)} 
        />
      )}

    </div>
  );
}
