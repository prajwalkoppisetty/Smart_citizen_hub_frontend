import React, { useState } from 'react';
import { MapPin, Clock } from 'lucide-react';

export default function Impact() {
  const [activeTab, setActiveTab] = useState('Submitted');

  // Mock timeline flow data for interactive demo
  const timelineStages = {
    Submitted: {
      status: 'Submitted',
      title: 'Pothole on Main Street Corner',
      category: 'Road & Infrastructure',
      location: 'Ward 12, Park Circus Junction',
      date: 'Just Now',
      color: 'bg-yellow-500 text-white',
      timelineIdx: 1,
      description: 'A deep, dangerous pothole has formed at the turn of W. Park Circus, causing traffic slowdowns and bike hazards. Needs immediate filling.',
      activity: 'Complaint registered by citizen Prajwal. Automated ticket issued: #SCH-84920.'
    },
    Assigned: {
      status: 'Assigned',
      title: 'Pothole on Main Street Corner',
      category: 'Road & Infrastructure',
      location: 'Ward 12, Park Circus Junction',
      date: '2 Hours Ago',
      color: 'bg-blue-600 text-white',
      timelineIdx: 2,
      description: 'A deep, dangerous pothole has formed at the turn of W. Park Circus, causing traffic slowdowns and bike hazards. Needs immediate filling.',
      activity: 'Ticket audited. System routed to Infrastructure Dept. Local Officer Rajesh Kumar assigned.'
    },
    'In Progress': {
      status: 'In Progress',
      title: 'Pothole on Main Street Corner',
      category: 'Road & Infrastructure',
      location: 'Ward 12, Park Circus Junction',
      date: '4 Hours Ago',
      color: 'bg-indigo-600 text-white',
      timelineIdx: 4,
      description: 'A deep, dangerous pothole has formed at the turn of W. Park Circus, causing traffic slowdowns and bike hazards. Needs immediate filling.',
      activity: 'Road repairs team dispatched. Repair materials mixed. Road cordoned for minor works.'
    },
    Resolved: {
      status: 'Resolved',
      title: 'Pothole on Main Street Corner',
      category: 'Road & Infrastructure',
      location: 'Ward 12, Park Circus Junction',
      date: '24 Hours Ago',
      color: 'bg-green-600 text-white',
      timelineIdx: 5,
      description: 'A deep, dangerous pothole has formed at the turn of W. Park Circus, causing traffic slowdowns and bike hazards. Needs immediate filling.',
      activity: 'Pothole successfully filled, tarred, and leveled. Image report submitted. Citizen notification sent.'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 font-sans select-none animate-fade-in text-left">
      
      {/* Dynamic Ticker Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Metropolitan Records</span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Metropolitan Operations & Impact
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
            Discover how transparency, fast SLAs, and automated routing have accelerated municipal resolutions across all wards.
          </p>
        </div>

        {/* Big Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 text-center bg-white border border-slate-100 p-8 rounded-3xl shadow-sm animate-slide-up">
          <div className="pt-4 lg:pt-0">
            <span className="block font-display text-3xl sm:text-4xl font-extrabold text-slate-900">24,850+</span>
            <span className="block text-xs sm:text-sm font-semibold text-slate-500 mt-1">Grievances Registered</span>
          </div>

          <div className="pt-4 lg:pt-0">
            <span className="block font-display text-3xl sm:text-4xl font-extrabold text-blue-600">98.4%</span>
            <span className="block text-xs sm:text-sm font-semibold text-slate-500 mt-1">Resolution Rate</span>
          </div>

          <div className="pt-4 lg:pt-0">
            <span className="block font-display text-3xl sm:text-4xl font-extrabold text-slate-900">4.2 Hrs</span>
            <span className="block text-xs sm:text-sm font-semibold text-slate-500 mt-1">Average Response Time</span>
          </div>

          <div className="pt-4 lg:pt-0">
            <span className="block font-display text-3xl sm:text-4xl font-extrabold text-slate-900">14,200+</span>
            <span className="block text-xs sm:text-sm font-semibold text-slate-500 mt-1">Active Ward Citizens</span>
          </div>
        </div>

        {/* Timeline demo grid */}
        <div className="space-y-10 border-t border-slate-200/50 pt-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-slate-100 pb-10">
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Interactive Showcase</span>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                Grievance Life-cycle in Action
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
                Experience the transparency of the Smart Citizen Hub. Click the status tabs below to see how our system logs, tracks, and assigns responsibilities step-by-step from submission to completion.
              </p>
            </div>
          </div>

          {/* Interactive Core Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Timeline controller tabs */}
            <div className="lg:col-span-4 flex flex-col justify-center space-y-3">
              {Object.keys(timelineStages).map((stage) => {
                const isActive = activeTab === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setActiveTab(stage)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                      isActive 
                        ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Stage {timelineStages[stage].timelineIdx}</span>
                      <span className="font-display font-bold text-base mt-0.5 block">{stage}</span>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`} />
                  </button>
                );
              })}
            </div>

            {/* Display screen */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-sm">
              
              <div className="space-y-6">
                {/* Badge and Title info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 pb-5">
                  <div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 mb-1">
                      {timelineStages[activeTab].category}
                    </span>
                    <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900">
                      {timelineStages[activeTab].title}
                    </h3>
                  </div>
                  
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 text-center ${timelineStages[activeTab].color}`}>
                    Status: {timelineStages[activeTab].status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">Location Coordinate</span>
                    <p className="text-slate-700 font-semibold flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>{timelineStages[activeTab].location}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">Registered Date</span>
                    <p className="text-slate-700 font-semibold flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>{timelineStages[activeTab].date}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wide block">Grievance Description</span>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium">
                    {timelineStages[activeTab].description}
                  </p>
                </div>
              </div>

              {/* Dynamic status comment box */}
              <div className="mt-8 bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-mono text-xs font-bold">
                  i
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">System Audit Remarks</span>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed mt-0.5">
                    {timelineStages[activeTab].activity}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
