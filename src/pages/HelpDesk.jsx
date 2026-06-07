import React, { useState } from 'react';
import { ChevronDown, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export default function HelpDesk() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: "What is Smart Citizen Hub?",
      a: "Smart Citizen Hub is an advanced e-governance platform that connects local citizens directly with municipal authorities. It enables fast, transparent grievance reporting, automated department routing, real-time ticket tracking, and clear escalation protocols."
    },
    {
      q: "How does the Escalation Protocol work?",
      a: "If an officer fails to address an assigned grievance within a predefined SLA period (e.g. 48 hours for urgent tasks), the ticket is automatically escalated to a Municipal Officer. Admins monitor escalation metrics to optimize team performance."
    },
    {
      q: "Who handles the complaints?",
      a: "Complaints are initially sorted using smart categories and routed to designated Local Officers in that specific ward. Municipal officers audit these local departments to ensure resolutions meet standards."
    },
    {
      q: "Can I track my complaint progress?",
      a: "Yes. Once submitted, each complaint is assigned a unique ticket number. You will receive real-time notifications via your dashboard or SMS, and can view a dynamic step-by-step status timeline of your ticket."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 font-sans select-none animate-fade-in text-left">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Citizens Support</span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Help Desk & FAQ
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium text-center">
            Review detailed frequently asked questions about the redressal scheme, or reach out directly to the ward executive team.
          </p>
        </div>

        {/* Dynamic Accordion list */}
        <div className="divide-y divide-slate-100 bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm animate-slide-up">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="py-4.5 first:pt-0 last:pb-0">
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-2 font-display font-extrabold text-base text-slate-800 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-40 opacity-100 mt-2.5' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <p className="text-sm text-slate-500 font-sans leading-relaxed font-medium">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contacts details split cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-200/50">
          
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Ward HQ</span>
            <p className="text-xs font-bold text-slate-700 leading-normal">
              1st Floor, City Center Plaza, Sector A, IN
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <Phone className="h-4.5 w-4.5" />
            </div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Support Phone</span>
            <a href="tel:+1800123456" className="block text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors">
              1800-123-456 (Toll-Free)
            </a>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Official E-mail</span>
            <a href="mailto:support@smartcitizen.gov.in" className="block text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors truncate">
              support@smartcitizen.gov.in
            </a>
          </div>

        </div>

        <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-start space-x-2 text-[10px] leading-relaxed text-slate-400 font-semibold text-center justify-center">
          <ShieldCheck className="h-4.5 w-4.5 text-blue-600 shrink-0" />
          <p>
            Help desk records and logs are verified by municipal customer success coordinators during active business hours.
          </p>
        </div>

      </div>
    </div>
  );
}
