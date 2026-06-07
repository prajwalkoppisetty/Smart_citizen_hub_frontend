import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Clock, BellRing, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 font-sans select-none animate-fade-in text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">System Advantages</span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Modern Municipal Tools
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
            Engineered using modern government-tech standards to provide swift, transparent, and intelligent public grievance redressal.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
          
          <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-md transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm">
              <Send className="h-6 w-6" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-slate-900 mb-3">Instant Grievance Submission</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
              File a grievance in less than a minute. Specify category, write description, provide location coordinates, and upload clear photo evidence.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-md transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-slate-900 mb-3">Intelligent SLA Triggers</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
              Enforces strict Service Level Agreements. If a local officer fails to address your grievance within 48 hours, it auto-escalates to municipal leads.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-md transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm">
              <BellRing className="h-6 w-6" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-slate-900 mb-3">Real-time SMS Updates</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
              Never remain in the dark. Receive instant notifications via e-mail and SMS triggers on every step-change, reassignment, or resolution.
            </p>
          </div>

        </div>

        {/* Detailed technical breakdown */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Core Framework</span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              AI-Assisted Ticket Routing
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Smart Citizen Hub leverages a localized smart categorization framework. As soon as you file a complaint, it analyzes your ward coordinates and grievance category to map it directly to the designated department field executive.
            </p>
            <div className="flex items-start space-x-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
              <span>Protects data integrity and prevents department routing loops.</span>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
              onClick={() => navigate('/signup')}
            >
              Get Started Now
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
