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
  HeartPulse,
  User,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  Phone,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function PatientRegisterPage() {
  const router = useRouter();

  // Wizard Step: 1 = Account Credentials, 2 = Personal & Health Profile
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Account
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [aadhaar, setAadhaar] = useState('');

  // Step 2: Personal & Health Profile
  const [age, setAge] = useState<string>('28');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [abhaId, setAbhaId] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate Step 1 before advancing
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full legal name (at least 2 characters).');
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
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

  // Submit complete registration
  const handleFinalRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 125) {
      setError('Please enter a valid age between 1 and 125.');
      return;
    }

    if (height && (isNaN(Number(height)) || Number(height) < 30 || Number(height) > 260)) {
      setError('Height must be between 30 and 260 cm.');
      return;
    }

    if (weight && (isNaN(Number(weight)) || Number(weight) < 2 || Number(weight) > 350)) {
      setError('Weight must be between 2 and 350 kg.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/[\s-]/g, ''),
        aadhaar: aadhaar.trim() ? aadhaar.replace(/[\s-]/g, '') : undefined,
        password,
        role: 'PATIENT',
        age: parsedAge,
        gender,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        bloodGroup: bloodGroup || undefined,
        preferredLanguage: preferredLanguage || 'English',
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.replace(/[\s-]/g, '') || undefined,
        abhaPlaceholder: abhaId.trim() || undefined,
      });

      router.push('/patient/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
      setIsSubmitting(false);
    }
  };

  // Masked Aadhaar preview helper
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
            <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-teal-100 shadow-xs">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Patient Account
            </h1>
            <p className="text-xs font-semibold text-teal-700 tracking-wide">
              CareKare • Healthcare Intake Profile
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Join CareKare to structure your medical symptoms and build your secure health profile.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                  step === 1 ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  1
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">Account</p>
                  <p className="text-[10px] text-slate-400">Login credentials</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                  step === 2 ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  2
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold leading-none">Health Profile</p>
                  <p className="text-[10px] text-slate-400">Personal &amp; emergency info</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Form */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {step === 1 ? 'Step 1: Account Credentials' : 'Step 2: Personal & Health Profile'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    {step === 1
                      ? 'Establish your secure identity and primary login identifiers.'
                      : 'Provide baseline health information for your patient consultation records.'}
                  </CardDescription>
                </div>
                <Badge variant="teal" size="sm">
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
                      label="Full Legal Name *"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Input
                        label="Mobile Number *"
                        type="tel"
                        placeholder="10-digit mobile (e.g. 9876543210)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Email Address *"
                        type="email"
                        placeholder="e.g. rahul@example.com"
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
                        <Shield className="w-3.5 h-3.5 text-teal-600" />
                        Aadhaar Number <span className="text-slate-400 font-normal">(Optional alternate login)</span>
                      </label>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-medium">
                        SHA-256 Hashed
                      </span>
                    </div>

                    <input
                      type="text"
                      maxLength={14}
                      placeholder="XXXX XXXX XXXX (12 digits)"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-slate-800"
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
                      className="w-full justify-center text-sm font-semibold h-11"
                    >
                      <span>Continue to Health Profile</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 2: PERSONAL & HEALTH PROFILE */}
              {step === 2 && (
                <form onSubmit={handleFinalRegistration} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Age (Years) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={125}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender *
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium"
                        required
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Height & Weight Metric Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                      Physical Baseline Metrics <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 172"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 68"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Blood Group
                        </label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <Input
                        label="Emergency Contact Name (Optional)"
                        placeholder="e.g. Spouse / Parent"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        label="Emergency Contact Phone (Optional)"
                        placeholder="e.g. 9876501234"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Language and ABHA ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Preferred Language *
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Input
                        label="ABHA Health ID (Optional)"
                        placeholder="e.g. 91-8834-1290-4421"
                        value={abhaId}
                        onChange={(e) => setAbhaId(e.target.value)}
                      />
                    </div>
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
                      className="flex-1 justify-center text-sm font-semibold h-11"
                    >
                      <span>Complete Registration</span>
                      <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Already have an account */}
              <div className="pt-4 text-center border-t border-slate-100 mt-4">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <Link
                    href="/patient/login"
                    className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    Sign in here
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
