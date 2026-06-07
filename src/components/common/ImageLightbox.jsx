import React from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, onClose }) {
  if (!src) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center cursor-default" 
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt="Enlarged Visual Evidence" 
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-scale-up"
        />
        
        {/* Top Right Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full transition-all shadow-lg border-none cursor-pointer flex items-center justify-center hover:scale-105"
          aria-label="Close Preview"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Bottom Close Button */}
        <button 
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md backdrop-blur-sm hover:scale-105 cursor-pointer border border-white/10"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
