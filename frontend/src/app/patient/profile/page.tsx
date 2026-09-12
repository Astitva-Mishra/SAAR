'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Activity,
  HeartPulse,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { User as UserType } from '@/types';

export default function PatientProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form editable states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<string>('28');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [abhaId, setAbhaId] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await api.auth.me();
        if (res && res.user) {
          setCurrentUser(res.user);
          setName(res.user.name || '');
          setPhone(res.user.phone || (res.user.emailOrMobile && !res.user.emailOrMobile.includes('@') ? res.user.emailOrMobile : ''));
          setEmail(res.user.email || (res.user.emailOrMobile && res.user.emailOrMobile.includes('@') ? res.user.emailOrMobile : ''));

          if (res.user.patientProfile) {
            setAge(String(res.user.patientProfile.age || 28));
            setGender(res.user.patientProfile.gender || 'MALE');
            setHeight(res.user.patientProfile.height ? String(res.user.patientProfile.height) : '');
            setWeight(res.user.patientProfile.weight ? String(res.user.patientProfile.weight) : '');
            setBloodGroup(res.user.patientProfile.bloodGroup || 'O+');
            setEmergencyContactName(res.user.patientProfile.emergencyContactName || '');
            setEmergencyContactPhone(res.user.patientProfile.emergencyContactPhone || '');
            setPreferredLanguage(res.user.patientProfile.preferredLanguage || 'English');
            setAbhaId(res.user.patientProfile.abhaPlaceholder || '');
          }
        }
      } catch (err: any) {
        setErrorMessage('Failed to load profile. Please make sure you are logged in.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.auth.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        age: Number(age),
        gender,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        bloodGroup,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        preferredLanguage,
        abhaPlaceholder: abhaId.trim(),
      });

      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMessage('Profile settings updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar portal="patient" userName="Patient" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span>Loading profile settings...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="patient" userName={currentUser?.name || 'Patient'} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/patient/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="teal">Patient Profile</Badge>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              ID: {currentUser?.id || 'Active'}
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Personal & Identity */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Personal Information</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Your contact information and baseline demographic profile.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Phone Number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Email Address *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aadhaar Identifier
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={currentUser?.aadhaarMasked || 'Not provided'}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Aadhaar is encrypted and masked for identity security.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                    required
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Health Baseline & Preferences */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Health Baseline &amp; Metrics</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Clinical metrics shared with attending healthcare providers during triage.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
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

                <div>
                  <Input
                    label="Height (cm)"
                    type="number"
                    placeholder="e.g. 172"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Weight (kg)"
                    type="number"
                    placeholder="e.g. 68"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
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
            </CardContent>
          </Card>

          {/* Section 3: Emergency Contacts */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Emergency Contacts</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Trusted contacts to notify in clinical urgencies.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Emergency Contact Name"
                    placeholder="e.g. Ananya Sharma"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Emergency Contact Phone"
                    placeholder="e.g. 9876501234"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/patient/dashboard">
              <Button variant="outline" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              disabled={isSaving}
              className="gap-2 font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
