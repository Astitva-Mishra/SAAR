'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Award,
} from 'lucide-react';
import { api } from '@/lib/api';

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'ENT',
  'Neurology',
  'Psychiatry',
  'Dentistry',
  'Physiotherapy',
  'General Surgery',
  'Ophthalmology',
  'Pulmonology',
  'Other',
];

export default function ProviderRegisterPage() {
  const router = useRouter();

  // Wizard Step: 1 = Account Credentials, 2 = Professional Profile
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aadhaar, setAadhaar] = useState('');

  // Step 2: Professional Profile
  const [specialty, setSpecialty] = useState('General Medicine');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState<string>('5');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('');
  const [city, setCity] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('English, Hindi');
  const [bio, setBio] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full professional name (e.g. Dr. First Last).');
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid professional email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (aadhaar.trim()) {
      const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        setError('Aadhaar number must be exactly 12 digits (or leave blank).');
        return;
      }
    }

    setStep(2);
  };

  // Final submit
  const handleFinalRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!specialty) {
      setError('Please select your primary clinical specialty.');
      return;
    }

    if (!qualification.trim()) {
      setError('Please provide your professional medical qualification (e.g., MBBS, MD).');
      return;
    }

    if (!registrationNumber.trim()) {
      setError('Please enter your medical registration number.');
      return;
    }

    const parsedExp = Number(experienceYears);
    if (isNaN(parsedExp) || parsedExp < 0 || parsedExp > 70) {
      setError('Please enter a valid number of years of clinical experience (0 to 70).');
      return;
    }

    if (!hospitalOrClinic.trim()) {
      setError('Please provide your hospital, clinic, or practice organization name.');
      return;
    }

    if (!city.trim()) {
      setError('Please provide your practice city.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.auth.register({
        name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
        email: email.trim().toLowerCase(),
        phone: phone.replace(/[\s-]/g, ''),
        aadhaar: aadhaar.trim() ? aadhaar.replace(/[\s-]/g, '') : undefined,
        password,
        role: 'PROVIDER',
        specialty: specialty.trim(),
        qualification: qualification.trim(),
        registrationNumber: registrationNumber.trim(),
        experienceYears: parsedExp,
        hospitalOrClinic: hospitalOrClinic.trim(),
        city: city.trim(),
        languages: primaryLanguage ? primaryLanguage.split(',').map((l) => l.trim()) : ['English'],
        bio: bio.trim() || undefined,
      });

      router.push('/provider/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials and try again.');
      setIsSubmitting(false);
    }
  };

  const formatAadhaarInput = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const parts: string[] = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="public" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-indigo-100 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Provider Account
            </h1>
            <p className="text-xs font-semibold text-indigo-700 tracking-wide">
              CareKare • Clinical Consultation Portal
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Join the CareKare clinical network to access structured patient intake dossiers and triage queues.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                  step === 1 ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  1
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">Account</p>
                  <p className="text-[10px] text-slate-400">Security &amp; credentials</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                  step === 2 ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  2
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">Professional Profile</p>
                  <p className="text-[10px] text-slate-400">Specialty &amp; practice info</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {step === 1 ? 'Step 1: Provider Credentials' : 'Step 2: Professional Profile & Practice'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    {step === 1
                      ? 'Establish your identity and secure login identifiers.'
                      : 'Provide your clinical practice information and consultation focus.'}
                  </CardDescription>
                </div>
                <Badge variant="indigo" size="sm">
                  Step {step} of 2
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: ACCOUNT CREDENTIALS */}
              {step === 1 && (
                <form onSubmit={handleProceedToStep2} className="space-y-4">
                  <div>
                    <Input
                      label="Full Professional Name *"
                      placeholder="e.g. Dr. Priya Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Input
                        label="Practice Phone Number *"
                        type="tel"
                        placeholder="10-digit mobile (e.g. 9876543211)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Professional Email Address *"
                        type="email"
                        placeholder="e.g. priya@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="relative">
                      <Input
                        label="Password *"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                    <div>
                      <Input
                        label="Confirm Password *"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Aadhaar Number (Optional with Privacy note) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        Aadhaar Identifier <span className="text-slate-400 font-normal">(Optional alternate login)</span>
                      </label>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                        SHA-256 Hashed
                      </span>
                    </div>

                    <input
                      type="text"
                      maxLength={14}
                      placeholder="XXXX XXXX XXXX (12 digits)"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                    />

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      If provided, you can log in using your Aadhaar number. Plaintext Aadhaar numbers are never stored in the database.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold h-11"
                    >
                      <span>Continue to Professional Profile</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 2: PROFESSIONAL PROFILE */}
              {step === 2 && (
                <form onSubmit={handleFinalRegistration} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Clinical Specialization *
                      </label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                        required
                      >
                        {SPECIALTIES.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Input
                        label="Medical Qualification *"
                        placeholder="e.g. MBBS, MD, MS, DNB"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Registration Number (Profile information only notice) */}
                  <div className="space-y-1.5">
                    <Input
                      label="Medical Registration Number *"
                      placeholder="e.g. MCI-2018-94821 or State Council Reg ID"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Note: Registration numbers are collected as self-reported profile information for clinical case records. CareKare does not provide independent regulatory license verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Years of Experience *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={70}
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <Input
                        label="Practice City *"
                        placeholder="e.g. New Delhi"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Hospital, Clinic or Practice Affiliation *"
                      placeholder="e.g. Apollo Hospital / City Health OPD"
                      value={hospitalOrClinic}
                      onChange={(e) => setHospitalOrClinic(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Consultation Languages Spoken *"
                      placeholder="e.g. English, Hindi, Punjabi"
                      value={primaryLanguage}
                      onChange={(e) => setPrimaryLanguage(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Professional Bio / Practice Focus (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief clinical focus or consultation background..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="gap-1 text-slate-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                      className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold h-11"
                    >
                      <span>Complete Provider Registration</span>
                      <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Already have an account */}
              <div className="pt-4 text-center border-t border-slate-100 mt-4">
                <p className="text-xs text-slate-600">
                  Already have a provider account?{' '}
                  <Link
                    href="/provider/login"
                    className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline"
                  >
                    Sign in to Console
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
