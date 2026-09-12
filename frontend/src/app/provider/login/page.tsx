'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Stethoscope, Sparkles, ArrowRight, Lock, AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';

export default function ProviderLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isDemoSubmitting) return;

    if (!identifier.trim()) {
      setErrorMessage('Please enter your provider phone number, email address, or Aadhaar number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Authenticate with backend
      await api.auth.login({
        identifier: identifier.trim(),
        password,
      });

      // 2. Verify authenticated user role from backend
      const meRes = await api.auth.me();
      if (meRes.user.role !== 'PROVIDER') {
        setErrorMessage('Access restricted: Account role is PATIENT. The provider console requires a PROVIDER account.');
        await api.auth.logout().catch(() => {});
        return;
      }

      router.push('/provider/dashboard');
    } catch (_err: any) {
      setErrorMessage('Unable to sign in. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isSubmitting || isDemoSubmitting) return;
    setIsDemoSubmitting(true);
    setErrorMessage(null);

    try {
      await api.auth.login({
        identifier: 'priya@example.com',
        password: 'password123',
      });
      const meRes = await api.auth.me();
      if (meRes.user.role !== 'PROVIDER') {
        setErrorMessage('Access restricted: Account role is not PROVIDER.');
        return;
      }
      router.push('/provider/dashboard');
    } catch (_loginErr) {
      try {
        await api.auth.register({
          name: 'Dr. Priya Verma',
          email: 'priya@example.com',
          phone: '9876543211',
          password: 'password123',
          role: 'PROVIDER',
          specialty: 'General Medicine',
          qualification: 'MBBS, MD (Internal Medicine)',
          registrationNumber: 'MCI-2018-94821',
          experienceYears: 9,
          hospitalOrClinic: 'City Health OPD & Triage',
          city: 'New Delhi',
          languages: ['English', 'Hindi'],
        });
        router.push('/provider/dashboard');
      } catch (_regErr: any) {
        router.push('/provider/dashboard');
      }
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="public" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-100 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Provider Console
            </h1>
            <p className="text-xs font-semibold text-indigo-700 tracking-wide">
              CareKare • Clinical Triage &amp; Intake Queue
            </p>
            <p className="text-xs text-slate-500 pt-0.5">
              Sign in to your CareKare provider account to review patient cases.
            </p>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Healthcare Provider Sign In
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Enter your registered practice email, mobile phone, or Aadhaar number.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    label="Provider Email, Phone or Aadhaar"
                    placeholder="e.g. priya@example.com or 9876543211"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoComplete="username"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Registered hospital/clinic email, mobile, or Aadhaar
                  </p>
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || isDemoSubmitting}
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold h-11 shadow-xs"
                  >
                    <span>Sign In to Provider Console</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>

              {/* Register Provider Link */}
              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  New healthcare provider?{' '}
                  <Link
                    href="/provider/register"
                    className="font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Create Provider Account</span>
                    <UserPlus className="w-3.5 h-3.5" />
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* DEMO ACCESS SECTION - Visually Segregated */}
          <div className="bg-white border border-dashed border-indigo-300 rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Demo Access
              </span>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                Presentation Mode
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Explore the clinical intake queue and decision support tools without creating a new account:
            </p>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleDemoLogin}
              disabled={isSubmitting || isDemoSubmitting}
              isLoading={isDemoSubmitting}
              className="w-full justify-center text-indigo-700 border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100/80 h-10 font-semibold"
            >
              <span>Continue as Demo Doctor (Dr. Priya Verma)</span>
            </Button>
          </div>

          <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Role-Based Access Controlled • Clinical Staff Audit Log Active</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
