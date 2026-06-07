import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { MapPin, Search, Filter, Loader2, Calendar, Clipboard } from 'lucide-react';

export default function GisMapDashboard() {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Fetch all complaints on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await complaintService.getComplaints();
        setComplaints(data || []);
      } catch (err) {
        console.error("Failed to load map data:", err);
        addToast("Failed to fetch complaints registry for GIS map visualization.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter complaints list
  useEffect(() => {
    let list = [...complaints];
    
    if (statusFilter !== 'All') {
      list = list.filter(c => c.status === statusFilter);
    }
    
    if (categoryFilter !== 'All') {
      list = list.filter(c => c.category === categoryFilter);
    }
    
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q)
      );
    }
    
    setFilteredComplaints(list);
  }, [complaints, statusFilter, categoryFilter, searchQuery]);

  // Leaflet Map Initialization and Pin plotting
  useEffect(() => {
    const L = window.L;
    if (!L || loading || !mapContainerRef.current) return;

    // Filter to only those with coordinates
    const geocodedComplaints = filteredComplaints.filter(c => 
      c.rawLocation?.latitude && c.rawLocation?.longitude
    );

    // Set map default center (MVP Colony / Visakhapatnam area)
    let center = [17.6868, 83.2185];
    if (geocodedComplaints.length > 0) {
      // Calculate centroid of active complaints
      const avgLat = geocodedComplaints.reduce((sum, c) => sum + c.rawLocation.latitude, 0) / geocodedComplaints.length;
      const avgLon = geocodedComplaints.reduce((sum, c) => sum + c.rawLocation.longitude, 0) / geocodedComplaints.length;
      center = [avgLat, avgLon];
    }

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, 14);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Create a layer group for markers
      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      // If map exists, clear previous markers and recenter
      markersGroupRef.current.clearLayers();
      if (geocodedComplaints.length > 0) {
        mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
      }
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    // Add marker pins
    geocodedComplaints.forEach(c => {
      const lat = c.rawLocation.latitude;
      const lon = c.rawLocation.longitude;

      // Status Colors
      let color = '#3B82F6'; // Blue (Submitted / Under Review)
      if (c.status === 'Resolved') color = '#10B981'; // Green
      if (c.status === 'Escalated') color = '#EF4444'; // Red
      if (['In Progress', 'Assigned', 'Verification Pending'].includes(c.status)) color = '#F59E0B'; // Yellow/Orange

      // Create a premium HTML icon
      const customIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-lg text-white font-bold animate-fade-in" style="background-color: ${color}; transform: scale(1); transition: transform 0.2s;">
                 <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
               </div>`,
        className: 'custom-map-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(markersGroup);

      // Setup detailed custom popup content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-2 space-y-2 font-sans text-left max-w-xs';
      popupDiv.innerHTML = `
        <div class="flex justify-between items-center gap-2 border-b border-slate-100 pb-1.5">
          <span class="font-mono text-[9px] text-slate-400 font-bold">#${c.id}</span>
          <span class="px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded bg-blue-50 text-blue-600">${c.status}</span>
        </div>
        <h4 class="font-bold text-xs text-slate-800 leading-snug truncate mt-1">${c.title}</h4>
        <p class="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
          <span class="shrink-0">📍</span> <span class="truncate">${c.location}</span>
        </p>
        <p class="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">${c.description}</p>
        <button id="btn-view-${c.id}" class="w-full mt-2 h-7 bg-slate-950 hover:bg-slate-900 text-white rounded-md text-[10px] font-bold transition flex items-center justify-center cursor-pointer border-none shadow-xs">
          View Case Workspace
        </button>
      `;

      marker.bindPopup(popupDiv);

      // Bind dynamic redirect trigger to the button inside the Leaflet popup DOM
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-${c.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            navigate(`/dashboard/complaint/${c.id}`);
          });
        }
      });
    });

  }, [filteredComplaints, loading]);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6 font-sans animate-fade-in text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Geospatial Intelligence</span>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            GIS Complaint Map Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time geospatial layout of all active and resolved complaints across ward boundaries.
          </p>
        </div>
      </div>

      {/* Main Grid: Filters & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Filters Panel Left */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border-slate-100 p-5 rounded-2xl shadow-sm text-left space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Filter className="h-4.5 w-4.5 text-blue-500" />
              GIS Map Filters
            </h3>

            {/* Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keyword Search</label>
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search title, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Incident Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All">All Categories</option>
                <option value="Road & Infrastructure">Road & Infrastructure</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Garbage & Waste">Garbage & Waste</option>
                <option value="Electricity & Lighting">Electricity & Lighting</option>
                <option value="Others">Others / Public Health</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ticket Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned to Field</option>
                <option value="In Progress">In Progress</option>
                <option value="Work Completed">Work Completed</option>
                <option value="Verification Pending">Verification Pending</option>
                <option value="Resolved">Resolved (Closed)</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>
          </Card>

          {/* Map Legend */}
          <Card className="bg-white border-slate-100 p-5 rounded-2xl shadow-sm text-left space-y-3">
            <h4 className="font-display font-extrabold text-xs text-slate-800">Map Pins Legend</h4>
            <div className="space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-blue-500 border border-white shadow-xs shrink-0" />
                <span>Submitted / Under Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-amber-500 border border-white shadow-xs shrink-0" />
                <span>Active / In Progress / Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 border border-white shadow-xs shrink-0" />
                <span>Resolved & Closed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-red-500 border border-white shadow-xs shrink-0" />
                <span>Escalated to High Priority</span>
              </div>
            </div>
          </Card>

          {/* Quick Stats Panel */}
          <Card className="bg-slate-900 border-none p-5 rounded-2xl text-white shadow-md space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Geotagged Tickets</span>
            <div className="text-2xl font-black">
              {filteredComplaints.filter(c => c.rawLocation?.latitude && c.rawLocation?.longitude).length}
              <span className="text-xs text-slate-400 font-bold ml-1.5">of {filteredComplaints.length} loaded</span>
            </div>
          </Card>
        </div>

        {/* Map Container Panel Right */}
        <div className="lg:col-span-9 relative">
          <Card className="bg-white border-slate-100 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col min-h-[480px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Loading Municipal Geospatial Layers...</p>
              </div>
            ) : (
              <div className="relative flex-1 w-full h-full">
                <div 
                  ref={mapContainerRef} 
                  className="absolute inset-0 w-full h-full z-10"
                />
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
}
