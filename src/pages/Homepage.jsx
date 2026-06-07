import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ArrowRight, ShieldCheck, MapPin, Clock 
} from 'lucide-react';
import Button from '../components/common/Button';

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/50 pt-16 font-sans select-none animate-fade-in relative overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.50),white)] opacity-70" />
        
        {/* Soft Background Accents */}
        <div className="absolute top-1/4 left-1/3 h-72 w-72 -z-10 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 -z-10 rounded-full bg-indigo-300/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Text content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6 animate-slide-up">
              <div className="inline-flex items-center space-x-1.5 rounded-full border border-blue-100 bg-blue-50/60 px-3 py-1 text-xs font-semibold text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                <span>Next-Gen Civic Redressal Scheme</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Connecting Citizens,<br className="hidden sm:inline" /> 
                Empowering <span className="text-blue-600 relative inline-block">Governance</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                A unified, state-of-the-art SaaS municipal portal for citizens, officers, and civic leaders. Submit issues, track timelines, and improve city living through transparency.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  onClick={() => navigate('/signup')}
                >
                  Citizen Portal
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  leftIcon={<Building2 className="h-5 w-5" />}
                  onClick={() => navigate('/login')}
                >
                  Official Gateway
                </Button>
              </div>

              {/* Features List Mini Badge */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 pt-4 text-xs text-slate-500 font-semibold">
                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>Real-time Timeline Tracking</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>Auto Escalation SLA</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>AI Route Optimizer</span>
                </div>
              </div>
            </div>

            {/* Hero Image Mockup Preview */}
            <div className="lg:col-span-5 relative animate-fade-in">
              <div className="relative mx-auto max-w-[420px] rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-100">
                {/* Simulated App Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">LIVE PREVIEW</span>
                </div>

                {/* Dashboard simulation */}
                <div className="space-y-4 pt-3 font-sans">
                  {/* Title card */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-left">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Citizens Dashboard</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Citizen: Prajwal</p>
                    </div>
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                      Active Portal
                    </span>
                  </div>

                  {/* Active Complaints */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                      <span>Recent Submissions</span>
                      <span className="text-blue-600 text-[10px] hover:underline cursor-pointer">View All</span>
                    </div>
                    
                    {/* Complaint mock item */}
                    <div className="border border-slate-100 p-3 rounded-2xl bg-white shadow-sm space-y-2 text-left">
                      <div className="flex justify-between items-start">
                        <span className="font-display font-bold text-xs text-slate-800 leading-tight">
                          Broken water pipeline near market area
                        </span>
                        <span className="text-[9px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded-md shrink-0">
                          High
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span>Ward 4, Sector B</span>
                        </span>
                        <span>Yesterday</span>
                      </div>

                      {/* Mini Timeline Tracker */}
                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-medium">Status History:</span>
                        <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Clock className="h-2.5 w-2.5 animate-pulse" />
                          <span>Under Review</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini KPIs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="block text-base font-extrabold text-blue-600">03</span>
                      <span className="text-[9px] font-semibold text-slate-500">Submitted</span>
                    </div>
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="block text-base font-extrabold text-green-600">02</span>
                      <span className="text-[9px] font-semibold text-slate-500">Resolved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Impact Statistics Ticker */}
      <section className="bg-white border-y border-slate-100 py-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 text-center">
            
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
        </div>
      </section>

      {/* 3. Call To Action Banner */}
      <section className="bg-slate-900 relative overflow-hidden py-20 text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] -z-10 rounded-full bg-blue-500/10 blur-3xl" />
        
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to improve your neighborhood?
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Create an account today to file a grievance, track municipal workflows, and engage in modern civic collaboration. Free for all local ward residents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              variant="primary" 
              size="lg" 
              rightIcon={<ArrowRight className="h-5 w-5" />}
              onClick={() => navigate('/signup')}
            >
              Sign Up Now
            </Button>
            <Button 
              variant="secondary" 
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700" 
              size="lg"
              onClick={() => navigate('/login')}
            >
              Access Portal
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
