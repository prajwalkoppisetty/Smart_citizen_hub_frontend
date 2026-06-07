import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ImageLightbox from '../components/common/ImageLightbox';
import { Search, MapPin, Calendar, Clock, Filter, Eye, ArrowUpDown, ShieldAlert } from 'lucide-react';

export default function TrackComplaints() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  // State for registry
  const [complaintsList, setComplaintsList] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (statusFilter !== 'All') params.status = statusFilter;
        if (categoryFilter !== 'All') params.category = categoryFilter;
        if (search.trim()) params.search = search.trim();

        let data = [];
        if (role === 'Citizen') {
          data = await complaintService.getMyComplaints(params);
        } else {
          data = await complaintService.getComplaints(params);
        }
        
        setComplaintsList(data);
      } catch (err) {
        console.error("Failed to fetch track complaints:", err);
        setError(err.userMessage || "Failed to load complaints from regional registry.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      // Debounce inputs by 300ms to avoid flooding backend API
      const delayDebounce = setTimeout(() => {
        fetchComplaints();
      }, 300);

      return () => clearTimeout(delayDebounce);
    }
  }, [user, role, search, statusFilter, categoryFilter]);

  // Client-side sorting on date
  const sortedList = [...complaintsList].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  if (loading && complaintsList.length === 0) {
    return (
      <div className="space-y-6 font-sans animate-pulse text-left">
        {/* Header skeleton */}
        <div className="h-14 bg-slate-200 rounded-3xl w-1/3" />
        {/* Filter bar skeleton */}
        <div className="h-20 bg-slate-200 rounded-3xl" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl py-20 px-6 text-center text-slate-500 text-xs font-semibold space-y-4 animate-fade-in font-sans">
        <ShieldAlert className="h-12 w-12 mx-auto text-red-500" />
        <h3 className="text-base font-bold text-slate-800">Registry Connection Fault</h3>
        <p className="max-w-md mx-auto text-slate-400 font-medium leading-relaxed">{error}</p>
        <Button 
          variant="secondary" 
          onClick={() => window.location.reload()}
          className="mx-auto"
        >
          Reload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 text-left">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Audit Panel</span>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Grievance Redressal Registry
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'Citizen' 
              ? 'Monitor progress of all your submitted complaints and SLA timelines.'
              : 'Search and inspect all tickets within your operational zone.'
            }
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 flex items-center space-x-1"
          leftIcon={<ArrowUpDown className="h-4 w-4" />}
          onClick={toggleSort}
        >
          <span>Date Order: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
        </Button>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-slide-up">
        
        {/* Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <Input
              id="search"
              placeholder="Search by Ticket ID, keywords, landmarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4.5 w-4.5 text-slate-400" />}
            />
          </div>

          {/* Status filter */}
          <div className="md:col-span-3 flex flex-col space-y-1 text-left">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="md:col-span-3 flex flex-col space-y-1 text-left">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">All Categories</option>
              <option value="Road & Infrastructure">Road & Infrastructure</option>
              <option value="Water & Sanitation">Water & Sanitation</option>
              <option value="Garbage & Waste">Garbage & Waste</option>
              <option value="Electricity & Lighting">Electricity & Lighting</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedList.length > 0 ? (
          sortedList.map((comp) => (
            <div
              key={comp.id}
              className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full space-y-4 text-left border-l-4 border-l-blue-600"
            >
              <div className="flex justify-between gap-4 items-start">
                <div className="space-y-3 flex-grow min-w-0">
                  <div className="flex justify-between items-center">
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

                  <div className="space-y-1">
                    <span className="block font-display font-extrabold text-sm text-slate-800 leading-snug truncate">
                      {comp.title}
                    </span>
                    <Badge variant={comp.category}>{comp.category}</Badge>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2">
                    {comp.description}
                  </p>
                </div>

                {/* Thumbnail Image */}
                {comp.images ? (
                  <img
                    src={comp.images}
                    alt={comp.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-sm mt-1 bg-slate-50 cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImg(comp.images)}
                  />
                ) : null}
              </div>

              {/* Sub details */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-3">
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="truncate max-w-[150px]">{comp.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-blue-500 shrink-0" />
                    <span>{comp.date}</span>
                  </span>
                  {comp.assignedOfficer !== 'Unassigned' && (
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                      <span>Lead: {comp.assignedOfficer}</span>
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border-none font-bold flex items-center space-x-1"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/dashboard/complaint/${comp.id}`)}
                  >
                    <span>Inspect Redressal Timeline</span>
                  </Button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-slate-100 rounded-3xl py-20 text-center text-slate-400 text-xs font-semibold space-y-2 animate-slide-up">
            <Filter className="h-10 w-10 mx-auto text-slate-200 animate-pulse" />
            <p>No complaints match your search query or filter tags.</p>
          </div>
        )}
      </div>

      {lightboxImg && (
        <ImageLightbox 
          src={lightboxImg} 
          onClose={() => setLightboxImg(null)} 
        />
      )}

    </div>
  );
}
