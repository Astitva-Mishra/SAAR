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
  Stethoscope,
  Building2,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { User as UserType } from '@/types';

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

export default function ProviderProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [qualification, setQualification] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState<string>('5');
  const [hospitalOrClinic, setHospitalOrClinic] = useState('');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState('English, Hindi');
  const [bio, setBio] = useState('');

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
          setSpecialty(res.user.specialty || 'General Medicine');
          setQualification(res.user.qualification || '');
          setRegistrationNumber(res.user.registrationNumber || '');
          setExperienceYears(res.user.experienceYears !== undefined ? String(res.user.experienceYears) : '5');
          setHospitalOrClinic(res.user.hospitalOrClinic || '');
          setCity(res.user.city || '');
          setLanguages(Array.isArray(res.user.languages) ? res.user.languages.join(', ') : (res.user.languages || 'English'));
          setBio(res.user.bio || '');
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
        specialty: specialty.trim(),
        qualification: qualification.trim(),
        registrationNumber: registrationNumber.trim(),
        experienceYears: Number(experienceYears),
        hospitalOrClinic: hospitalOrClinic.trim(),
        city: city.trim(),
        languages: languages ? languages.split(',').map((l) => l.trim()).filter(Boolean) : ['English'],
        bio: bio.trim(),
      });

      if (res && res.user) {
        setCurrentUser(res.user);
        setSuccessMessage('Provider profile updated successfully.');
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
        <Navbar portal="provider" userName="Doctor" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading provider credentials...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="provider" userName={currentUser?.name || 'Doctor'} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/provider/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Case Queue</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="indigo">Clinical Provider</Badge>
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
          {/* Section 1: Personal & Practice Contact */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Personal &amp; Practice Contact</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Your professional identity and contact information.
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
                    label="Practice Phone Number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Professional Email *"
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
                    Aadhaar is hashed and masked for security.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Clinical Credentials */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Clinical Credentials</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Self-reported clinical qualification and medical registration profile data.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Specialization *
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
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
                    placeholder="e.g. MBBS, MD, MS"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="Medical Registration Number *"
                    placeholder="e.g. MCI-2018-94821"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Self-reported for consultation record attribution.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Years of Clinical Experience *
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
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Hospital & Practice Affiliation */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Hospital &amp; Practice Affiliation</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Organization and location information for patient routing.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Hospital, Clinic or Practice *"
                    placeholder="e.g. Apollo Hospital / City Health OPD"
                    value={hospitalOrClinic}
                    onChange={(e) => setHospitalOrClinic(e.target.value)}
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
                  label="Consultation Languages Spoken *"
                  placeholder="e.g. English, Hindi, Punjabi"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Bio / Practice Focus (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/provider/dashboard">
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
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 font-semibold shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Provider Changes</span>
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
