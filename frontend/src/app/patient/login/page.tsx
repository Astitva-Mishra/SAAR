'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HeartPulse, Sparkles, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isDemoSubmitting) return;

    if (!identifier.trim()) {
      setError('Please enter your phone number, email address, or Aadhaar number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.auth.login({
        identifier: identifier.trim(),
        password,
      });

      // Verify role
      const meRes = await api.auth.me().catch(() => null);
      if (meRes?.user && meRes.user.role !== 'PATIENT') {
        setError('This account has provider credentials. Please use the Provider Console to sign in.');
        await api.auth.logout().catch(() => {});
        return;
      }

      router.push('/patient/dashboard');
    } catch (_loginErr: any) {
      setError('Unable to sign in. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isSubmitting || isDemoSubmitting) return;
    setIsDemoSubmitting(true);
    setError(null);

    try {
      await api.auth.login({
        identifier: 'rahul@example.com',
        password: 'password123',
      });
      router.push('/patient/dashboard');
    } catch (_loginErr) {
      try {
        await api.auth.register({
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
          phone: '9876543210',
          password: 'password123',
          role: 'PATIENT',
          age: 29,
          gender: 'MALE',
          bloodGroup: 'B+',
          emergencyContactName: 'Ananya Sharma',
          emergencyContactPhone: '9876501234',
        });
        router.push('/patient/dashboard');
      } catch (_regErr) {
        router.push('/patient/dashboard');
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
          {/* Header Brand */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-teal-100 shadow-xs">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              CareKare
            </h1>
            <p className="text-xs font-semibold text-teal-700 tracking-wide">
              Your health, understood better.
            </p>
            <p className="text-xs text-slate-500 pt-0.5">
              Access your health profile and continue your care journey.
            </p>
          </div>

          {/* Primary Login Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">Welcome Back</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Sign in with your registered phone number, email, or Aadhaar number.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    label="Phone, Email or Aadhaar Number"
                    placeholder="e.g. 9876543210 or name@example.com"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError(null);
                    }}
                    autoComplete="username"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your 10-digit mobile, email, or 12-digit Aadhaar number
                  </p>
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
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
                    className="w-full justify-center text-sm font-semibold h-11 shadow-xs"
                  >
                    <span>Sign In to Patient Portal</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>

              {/* Registration Link */}
              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  New to CareKare?{' '}
                  <Link
                    href="/patient/register"
                    className="font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Create Patient Account</span>
                    <UserPlus className="w-3.5 h-3.5" />
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* DEMO ACCESS SECTION - Visually Segregated */}
          <div className="bg-white border border-dashed border-teal-300 rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Demo Access
              </span>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                Presentation Mode
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Want to explore CareKare without creating an account? Continue directly as a sample patient:
            </p>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleDemoLogin}
              disabled={isSubmitting || isDemoSubmitting}
              isLoading={isDemoSubmitting}
              className="w-full justify-center text-teal-700 border-teal-300 bg-teal-50/70 hover:bg-teal-100/80 h-10 font-semibold"
            >
              <span>Continue as Demo Patient (Rahul Sharma)</span>
            </Button>
          </div>

          <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span>Encrypted credentials • Industry-standard privacy standards</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
