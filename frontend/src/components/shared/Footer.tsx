import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="font-bold text-slate-800">CareKare</span>
            <span>•</span>
            <span>Smarter patient care, from the first conversation</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Home
            </Link>
            <Link href="/patient/login" className="hover:text-slate-800 transition-colors">
              Patient Portal
            </Link>
            <Link href="/provider/login" className="hover:text-slate-800 transition-colors">
              Provider Console
            </Link>
          </div>
        </div>

        {/* Clinical Notice */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-slate-400 text-[11px] leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-600 font-medium">Notice:</strong> CareKare
            structures patient-reported information and performs safety screening to assist
            healthcare providers. It does not provide medical diagnoses, prescribe medications, or replace
            professional physician judgment.
          </p>
        </div>
      </div>
    </footer>
  );
}
