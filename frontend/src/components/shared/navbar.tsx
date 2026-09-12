'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, UserCheck, Stethoscope, User, LogOut } from 'lucide-react';
import { api } from '@/lib/api';

interface NavbarProps {
  portal?: 'patient' | 'provider' | 'public';
  userName?: string;
}

export function Navbar({ portal = 'public', userName }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (_) {
      // ignore
    }
    router.push(portal === 'provider' ? '/provider/login' : '/patient/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">
                CareKare
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Your health, understood better.
            </p>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="flex items-center space-x-4">
          {portal === 'patient' && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <nav className="flex space-x-1 sm:space-x-3 text-sm font-medium">
                <Link
                  href="/patient/dashboard"
                  className="text-slate-600 hover:text-teal-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/patient/new-case"
                  className="text-teal-700 font-semibold px-2.5 py-1 rounded-md hover:bg-teal-50 transition-colors"
                >
                  + New Case
                </Link>
                <Link
                  href="/patient/history"
                  className="text-slate-600 hover:text-teal-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  My Cases
                </Link>
                <Link
                  href="/patient/profile"
                  className="text-slate-600 hover:text-teal-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  Profile
                </Link>
              </nav>
              <Badge variant="teal" className="hidden md:inline-flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                Patient Portal
              </Badge>
            </div>
          )}

          {portal === 'provider' && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <nav className="flex space-x-1 sm:space-x-3 text-sm font-medium">
                <Link
                  href="/provider/dashboard"
                  className="text-slate-600 hover:text-indigo-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  Cases Queue
                </Link>
                <Link
                  href="/provider/profile"
                  className="text-slate-600 hover:text-indigo-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  Profile
                </Link>
              </nav>
              <Badge variant="indigo" className="hidden md:inline-flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                Provider Console
              </Badge>
            </div>
          )}

          {portal === 'public' && (
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">
                Clinical Decision Support Platform
              </span>
            </div>
          )}
        </div>

        {/* User / Exit link */}
        <div className="flex items-center space-x-3">
          {userName && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800">{userName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{portal} Access</p>
            </div>
          )}

          {portal !== 'public' ? (
            <div className="flex items-center gap-2">
              <Link
                href={portal === 'patient' ? '/patient/profile' : '/provider/profile'}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="View Profile"
              >
                <User className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/patient/login"
                className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Patient Portal
              </Link>
              <Link
                href="/provider/login"
                className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Provider Console
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
