import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { Card } from '../components/common/Card';
import ImageLightbox from '../components/common/ImageLightbox';
import { 
  ArrowLeft, MapPin, Calendar, Users, 
  ShieldAlert, CheckCircle2, Circle, AlertCircle, FileText, X, Clock
} from 'lucide-react';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);

  // Refs for Leaflet Map
  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerInstanceRef = React.useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await complaintService.getComplaintById(id);
        setComp(data);
      } catch (err) {
        console.error("Failed to fetch complaint details:", err);
        setError(err.userMessage || "Failed to load complaint case file from E-Governance database.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    const L = window.L;
    if (!L || !comp || !comp.rawLocation) return;

    const lat = comp.rawLocation.latitude;
    const lon = comp.rawLocation.longitude;

    if (lat && lon && mapContainerRef.current) {
      // Create map if it doesn't exist yet
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([lat, lon], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add a non-draggable marker
        const marker = L.marker([lat, lon]).addTo(map);

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } else {
        // If map already exists, just center it and update marker position
        const map = mapInstanceRef.current;
        const marker = markerInstanceRef.current;
        map.setView([lat, lon], 16);
        marker.setLatLng([lat, lon]);
      }
    } else {
      // Clean up map if coordinates are removed
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    }
  }, [comp]);

  // Clean up Leaflet Map instance on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 font-sans animate-pulse text-left">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-[500px] bg-slate-200 rounded-3xl" />
          <div className="lg:col-span-5 h-[500px] bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !comp) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl py-20 px-6 text-center text-slate-500 text-xs font-semibold space-y-4 animate-fade-in font-sans">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 animate-pulse" />
        <h3 className="text-base font-bold text-slate-800">Registry Log Missing</h3>
        <p className="max-w-md mx-auto text-slate-400 font-medium leading-relaxed">
          {error || "Complaint details not found in E-Governance registry."}
        </p>
        <Button variant="secondary" onClick={() => navigate('/dashboard/track')}>Go Back</Button>
      </div>
    );
  }

  const imagesList = comp.rawImages || [];

  // Choose icon based on status
  const getTimelineIcon = (status) => {
    switch (status) {
      case 'Submitted':
        return <Circle className="h-5 w-5 text-yellow-500 fill-yellow-500 shrink-0" />;
      case 'Under Review':
        return <Circle className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />;
      case 'Assigned':
        return <Users className="h-5 w-5 text-sky-500 shrink-0" />;
      case 'In Progress':
        return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
      case 'Work Completed':
        return <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />;
      case 'Verification Pending':
        return <Clock className="h-5 w-5 text-purple-500 shrink-0" />;
      case 'Resolved':
        return <CheckCircle2 className="h-5 w-5 text-green-600 fill-green-50 shrink-0" />;
      case 'Escalated':
        return <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />;
      default:
        return <Circle className="h-5 w-5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Back button and title */}
      <div className="flex items-center space-x-3 text-left">
        <button
          onClick={() => navigate('/dashboard/track')}
          className="rounded-xl p-2.5 bg-white border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer border-none"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-slate-600" />
        </button>
        <div>
          <span className="text-[10px] font-extrabold font-mono text-slate-400">TICKET DETAILS: #{comp.id}</span>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 leading-none mt-0.5">
            Audit Workspace
          </h2>
        </div>
      </div>

      {/* Grid: Left detail card & Right timeline audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Core Grievance Card */}
        <div className="lg:col-span-7 space-y-6 animate-slide-up">
          <Card className="bg-white border-slate-100 rounded-3xl p-6 text-left space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-5">
              
              {/* Badges and metadata */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <Badge variant={comp.category}>{comp.category}</Badge>
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

              {/* Title */}
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">
                  {comp.title}
                </h3>
                
                {/* Meta details */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400 font-semibold pt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Submitted: {comp.date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Citizen: {comp.citizenName || 'Registered User'}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Grievance Case Explanation</span>
                <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium">
                  {comp.description}
                </p>
              </div>

              {/* Detailed Location Section */}
              <div className="flex flex-col space-y-2 border-t border-slate-50 pt-4 text-left">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Grievance Location Information</span>
                <div className="flex items-start space-x-2 pt-1 pb-2">
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold text-slate-600">
                    <p className="text-slate-800">{comp.location}</p>
                    {comp.rawLocation?.latitude && comp.rawLocation?.longitude && (
                      <div className="space-y-1 mt-1">
                        <p className="text-slate-400 font-mono text-[10px]">
                          GPS Coordinates: {comp.rawLocation.latitude.toFixed(4)}° N, {comp.rawLocation.longitude.toFixed(4)}° E
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${comp.rawLocation.latitude},${comp.rawLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 mt-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                          <span>View on Google Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaflet Map for Audit */}
                {comp.rawLocation?.latitude && comp.rawLocation?.longitude && (
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm mt-2">
                    <div 
                      ref={mapContainerRef} 
                      className="w-full h-48 z-10"
                      style={{ minHeight: '192px' }}
                    />
                  </div>
                )}
              </div>

              {/* Officer remarks if resolved */}
              {(comp.officerRemarks || comp.assignedOfficer !== 'Unassigned') && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Assignment Metadata</span>
                  <div className="text-xs space-y-2 pt-1 font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Field Executive:</span>
                      <span className="text-slate-800">{comp.assignedOfficer}</span>
                    </div>
                    {comp.officerRemarks && (
                      <div className="border-t border-slate-100/50 pt-2 space-y-1 text-left">
                        <span className="text-slate-400">Action Remarks:</span>
                        <p className="text-slate-700 font-normal leading-relaxed mt-0.5">{comp.officerRemarks}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Escalation Details Panel */}
              {(comp.status === 'Escalated' || comp.escalation?.escalated) && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-5 space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-red-100/50 pb-2">
                    <span className="text-red-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                      <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
                      <span>Official Escalation Registry Log</span>
                    </span>
                    <Badge variant="Escalated">Escalated</Badge>
                  </div>
                  <div className="text-xs space-y-2 font-semibold text-red-800">
                    <div className="flex justify-between">
                      <span className="text-red-600">Escalated By:</span>
                      <span>{comp.escalation?.escalatedBy || 'System SLA Engine'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Escalation Date:</span>
                      <span>{comp.escalation?.escalatedAt ? new Date(comp.escalation.escalatedAt).toLocaleDateString() : comp.date}</span>
                    </div>
                    <div className="border-t border-red-100/30 pt-2 space-y-1">
                      <span className="text-red-600">Escalation Reason:</span>
                      <p className="text-red-900 font-medium leading-relaxed mt-0.5 font-sans">
                        {comp.escalation?.reason || comp.escalationReason || 'Ticket unassigned and exceeded SLA response period of 48 hours.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Evidence Image Gallery */}
            {imagesList.length > 0 ? (
              <div className="pt-6 border-t border-slate-50 space-y-3 text-left">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Visual Incident Evidence</span>
                
                {imagesList.length === 1 ? (
                  <div 
                    className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 cursor-zoom-in group relative"
                    onClick={() => setSelectedImg(imagesList[0])}
                  >
                    <img
                      src={imagesList[0]}
                      alt="Grievance Evidence"
                      className="w-full max-h-80 object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/90 text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm">
                        Click to Expand
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagesList.map((img, idx) => (
                      <div 
                        key={idx}
                        className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 h-24 sm:h-28 cursor-zoom-in group relative"
                        onClick={() => setSelectedImg(img)}
                      >
                        <img
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-slate-800 text-[8px] font-bold px-2 py-1 rounded shadow-sm">
                            View
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-50 space-y-2 text-left">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Visual Incident Evidence</span>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-center">
                  <p className="text-xs text-slate-400 font-medium">No visual photo evidence was attached to this complaint submission.</p>
                </div>
              </div>
            )}

            {/* Field Officer Resolution Proof Gallery */}
            {(comp.beforeImages?.length > 0 || comp.afterImages?.length > 0 || comp.workNotes || comp.completionNotes) && (
              <div className="pt-6 border-t border-slate-50 space-y-4 text-left">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Field Officer Resolution Proof</span>
                
                {comp.workNotes && (
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-700 block mb-1">Work Notes:</span>
                    <p className="leading-relaxed">{comp.workNotes}</p>
                  </div>
                )}

                {comp.completionNotes && (
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-700 block mb-1">Completion Notes:</span>
                    <p className="leading-relaxed">{comp.completionNotes}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Images */}
                  {comp.beforeImages?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Work Area (Before)</span>
                      <div className="grid grid-cols-2 gap-2">
                        {comp.beforeImages.map((img, idx) => (
                          <div 
                            key={idx}
                            className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 h-20 cursor-zoom-in group relative"
                            onClick={() => setSelectedImg(img)}
                          >
                            <img
                              src={img}
                              alt={`Before ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* After Images */}
                  {comp.afterImages?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Work Area (After)</span>
                      <div className="grid grid-cols-2 gap-2">
                        {comp.afterImages.map((img, idx) => (
                          <div 
                            key={idx}
                            className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 h-20 cursor-zoom-in group relative"
                            onClick={() => setSelectedImg(img)}
                          >
                            <img
                              src={img}
                              alt={`After ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Interactive timeline audit trail */}
        <div className="lg:col-span-5">
          <Card className="bg-white border-slate-100 rounded-3xl p-6 shadow-sm text-left h-full space-y-6">
            <h3 className="font-display font-extrabold text-sm text-slate-800">
              Audit Trail Timeline
            </h3>

            {/* Audit list */}
            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-8 py-3">
              {comp.timeline && comp.timeline.map((event, idx) => (
                <div key={idx} className="relative group text-left">
                  
                  {/* Absolute icon overlay */}
                  <span className="absolute -left-9 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-slate-50">
                    {getTimelineIcon(event.status)}
                  </span>

                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 leading-none">
                        {event.title}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0">
                        {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <span className="block text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-0.5 leading-none">
                      {event.status}
                    </span>
                    
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium pt-1">
                      {event.remarks}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl text-[10px] leading-relaxed text-slate-400 font-semibold shrink-0 text-left">
              <p>
                Status changes are logged instantly in accordance with regional IT E-Governance Redressal Act directives.
              </p>
            </div>

          </Card>
        </div>

      </div>

      {/* Lightbox / Modal for enlarged images */}
      {selectedImg && (
        <ImageLightbox 
          src={selectedImg} 
          onClose={() => setSelectedImg(null)} 
        />
      )}

    </div>
  );
}
