import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ShieldCheck, Mail, Phone, MapPin, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 font-sans border-t border-slate-800 text-left select-none">
      {/* Top Footer Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo and About */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Landmark className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-display text-base font-extrabold tracking-tight text-white">
                  Smart Citizen<span className="text-blue-500">Hub</span>
                </span>
                <div className="flex items-center space-x-1 text-[8px] font-semibold text-blue-500 uppercase tracking-widest leading-none">
                  <ShieldCheck className="h-2 w-2" />
                  <span>Municipal Portal</span>
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Empowering communities with seamless transparency, digital grievance redressal, and collaborative civic administration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase mb-4">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/features" className="hover:text-white transition-colors">
                  System Features
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-white transition-colors">
                  Analytics & Impact
                </Link>
              </li>
              <li>
                <Link to="/help-desk" className="hover:text-white transition-colors">
                  FAQ & Support Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Government Portals */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase mb-4">
              National Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://india.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center hover:text-white transition-colors">
                  National Portal of India <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://mygov.in" target="_blank" rel="noreferrer" className="inline-flex items-center hover:text-white transition-colors">
                  MyGov Citizen Engagement <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center hover:text-white transition-colors">
                  CPGRAMS PG Portal <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Support Contacts */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase mb-4">
              Support Desk
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                <span>Municipal Headquarters, 1st Floor, City Center Plaza, IN</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 shrink-0 text-blue-500" />
                <a href="tel:+1800123456" className="hover:text-white transition-colors">
                  1800-123-456 (Toll-Free)
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 shrink-0 text-blue-500" />
                <a href="mailto:support@smartcitizen.gov.in" className="hover:text-white transition-colors">
                  support@smartcitizen.gov.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-800 my-10" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 text-xs">
          <p>© {new Date().getFullYear()} Smart Citizen Hub. Developed under Municipal E-Governance Scheme.</p>
          <div className="flex items-center space-x-1">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>for better citizen experience</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
