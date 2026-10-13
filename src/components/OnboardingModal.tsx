import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Receipt,
  Mic,
  ArrowRight,
  CheckCircle2,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

interface Step {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  bullets: string[];
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: 'Ghanshyam kids wear',
      subtitle:
        'Smart Digital Khata, Boutique POS & Ledger ERP\nEngineered by Kirio Ken',
      icon: <Sparkles className="w-10 h-10 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-200',
      badge: 'KIRIO KEN EDITION',
      bullets: [
        '👗 Professional store management tailored for children\'s fashion & boutique garments',
        '🔒 100% Private on-device ledger architecture with offline resilience',
        '🌐 Multi-language support: Hinglish (Default), Hindi, Gujarati & English',
      ],
    },
    {
      title: 'Digital Khata & Udhaar',
      subtitle:
        'Track "Aapne Diye (Udhaar)" & "Aapko Mile (Jama)" with live running balances',
      icon: <BookOpen className="w-10 h-10 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-200',
      badge: 'LEDGER & PAYMENTS',
      bullets: [
        '✔️ Manual tick box to cancel out cleared entries instantly (struck-through)',
        '📲 One-tap WhatsApp payment reminders & direct UPI deep links',
        '👥 Fast import from phone contacts & WhatsApp chat names',
      ],
    },
    {
      title: 'Kids Wear Stock & Invoicing',
      subtitle:
        'POS Counter billing with 4 signature invoice print designs',
      icon: <Receipt className="w-10 h-10 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-200',
      badge: 'MODULAR BILLING',
      bullets: [
        '🏷️ Garment sizing (0-6M, 1-2Y, 2-4Y, 6-8Y) with live inventory alerts',
        '🎨 4 Custom Print Designs: Thermal POS Slip, Formal GST, Royal Letterhead, Boutique',
        '🚚 Additional delivery charges, GST rates, discounts & private store memos',
      ],
    },
    {
      title: 'Smart AI Voice Assistant',
      subtitle:
        'Operate your entire store by voice in Hinglish & Hindi',
      icon: <Mic className="w-10 h-10 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-200',
      badge: 'FULL STORE CONTROL',
      bullets: [
        '🎙️ Voice recognition in Hinglish, Hindi & English via Web Speech',
        '💬 "Rajesh Sharma ka khata dikhao" or "Mera total udhaar kitna hai?"',
        '📊 Auto-generate store reports, create bills & cancel out ledger entries',
      ],
    },
  ];

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        {/* Top Header Pill */}
        <div className="p-6 pb-2 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-extrabold tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {activeStep.badge}
            </span>
          </div>
          <button
            onClick={onComplete}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition px-2 py-1 rounded-lg cursor-pointer"
          >
            Skip Guide
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col items-center text-center">
          {/* Circular Icon with Glow */}
          <div
            className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 hover:scale-105 ${activeStep.iconBg}`}
          >
            {activeStep.icon}
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {activeStep.title}
          </h2>

          <p className="text-xs md:text-sm text-slate-500 whitespace-pre-line leading-relaxed mb-6 font-medium">
            {activeStep.subtitle}
          </p>

          {/* Bullet points Card */}
          <div className="w-full bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-left space-y-3">
            {activeStep.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Store starts 100% clean with 0 entries • Sample data can be loaded anytime</span>
          </div>
        </div>

        {/* Footer with Step Dots and Navigation */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-indigo-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>Get Started (Start Fresh)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
