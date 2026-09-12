import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck,
  Stethoscope,
  ShieldCheck,
  HeartPulse,
  ArrowRight,
  Clock,
  Layers,
  FileCheck2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="public" />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                <span>Intelligent Clinical Intake &amp; Triage Platform</span>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight">
                  CareKare
                </h1>
                <p className="text-xl sm:text-2xl font-semibold text-teal-700 tracking-tight">
                  Your health, understood better.
                </p>
              </div>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
                CareKare structures everyday patient complaints before doctor consultation.
                Using safety screening and department-specific clinical intake questions,
                it optimizes consultation time while keeping medical judgment strictly with the physician.
              </p>

              {/* Core CTA Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 max-w-xl mx-auto">
                {/* Patient Entry */}
                <div className="bg-white p-5 rounded-2xl border-2 border-teal-600/30 hover:border-teal-600 transition-all card-shadow flex flex-col justify-between text-left space-y-4 group">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-slate-900 text-base">Patient Portal</h2>
                      <Badge variant="teal" size="sm">Patient</Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Describe your condition in everyday language. Prepare a structured clinical summary before your doctor visit.
                    </p>
                  </div>
                  <Link href="/patient/login" className="w-full">
                    <Button variant="primary" size="md" className="w-full justify-between font-semibold">
                      <span>Continue to Patient Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Provider Entry */}
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 transition-all card-shadow flex flex-col justify-between text-left space-y-4 group">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-slate-900 text-base">Provider Console</h2>
                      <Badge variant="indigo" size="sm">Clinical</Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Review structured clinical dossiers, triage priority indicators, department answers, and record consultation notes.
                    </p>
                  </div>
                  <Link href="/provider/login" className="w-full">
                    <Button variant="outline" size="md" className="w-full justify-between hover:bg-slate-900 hover:text-white hover:border-slate-900 font-semibold">
                      <span>Open Provider Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Safety Banner */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Safety screening • Non-diagnostic clinical decision support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Overview Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              A Complete End-to-End Case Intake Workflow
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Designed for hospital outpatient departments and clinics to maximize physician consultation efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Natural Complaint',
                desc: 'Patient describes symptoms naturally in everyday language or voice dictation.',
                icon: Clock,
              },
              {
                step: '02',
                title: 'Structured Summary',
                desc: 'Symptoms, duration, and chronology are organized into clear clinical categories.',
                icon: Layers,
              },
              {
                step: '03',
                title: 'Safety Check',
                desc: 'Screens for critical red flags and flags potential urgency for triage.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Department Intake',
                desc: 'Presents dynamic clinical questions tailored to the relevant medical department.',
                icon: CheckCircle2,
              },
              {
                step: '05',
                title: 'Doctor Consultation',
                desc: 'Physician opens complete structured dossier, adds notes, and completes visit.',
                icon: FileCheck2,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-teal-600">
                        {item.step}
                      </span>
                      <Icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Presentation & Demo Exploration Launchpad */}
        <section className="bg-slate-100/80 border-t border-slate-200 py-10">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Demo Access &amp; Workflow Exploration
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Explore patient intake, provider triage queues, and case reviews without creating an account:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Link href="/patient/dashboard">
                <Button variant="outline" size="sm">Demo Patient Dashboard</Button>
              </Link>
              <Link href="/patient/new-case">
                <Button variant="primary" size="sm">Start Case Intake</Button>
              </Link>
              <Link href="/patient/history">
                <Button variant="outline" size="sm">Patient History</Button>
              </Link>
              <Link href="/provider/dashboard">
                <Button variant="secondary" size="sm">Provider Case Queue</Button>
              </Link>
              <Link href="/provider/case/ARG-2026-104">
                <Button variant="outline" size="sm">Sample Clinical Dossier</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
