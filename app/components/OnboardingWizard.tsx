"use client";
import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type Level = "beginner" | "intermediate" | "advanced";
type Goal = "strength" | "hypertrophy" | "fitness";
type Days = 3 | 4 | 5;

export type OnboardingResult = {
  level: Level;
  goal: Goal;
  days: Days;
};

const ONBOARDING_KEY = "haitOnboardingV1";

const LEVELS: { value: Level; label: string; desc: string; emoji: string }[] = [
  { value: "beginner", label: "มือใหม่", desc: "ฝึกมาไม่เกิน 6 เดือน", emoji: "🌱" },
  { value: "intermediate", label: "กลาง", desc: "ฝึกมา 6 เดือน - 2 ปี", emoji: "💪" },
  { value: "advanced", label: "ขั้นสูง", desc: "ฝึกมามากกว่า 2 ปี", emoji: "🔥" },
];

const GOALS: { value: Goal; label: string; desc: string; emoji: string }[] = [
  { value: "strength", label: "Strength", desc: "เน้นยกหนัก เพิ่มแรง", emoji: "🏋️" },
  { value: "hypertrophy", label: "Hypertrophy", desc: "เน้นเพิ่มขนาดกล้ามเนื้อ", emoji: "📈" },
  { value: "fitness", label: "General Fitness", desc: "สุขภาพดี รูปร่างสมส่วน", emoji: "❤️" },
];

const DAYS_OPTIONS: { value: Days; label: string; desc: string }[] = [
  { value: 3, label: "3 วัน", desc: "Full Body — เหมาะมือใหม่/เวลาจำกัด" },
  { value: 4, label: "4 วัน", desc: "Upper/Lower — สมดุลที่สุด" },
  { value: 5, label: "5 วัน", desc: "Split — สำหรับคนจริงจัง" },
];

export function OnboardingWizard({
  onComplete,
}: {
  onComplete: (result: OnboardingResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState<Days | null>(null);

  const canNext = [level, goal, days][step] !== null;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else if (level && goal && days) {
      const result: OnboardingResult = { level, goal, days };
      try {
        window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(result));
      } catch {}
      onComplete(result);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-4 backdrop-blur-md">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-emerald-400" : "w-2 bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Level */}
        {step === 0 && (
          <div>
            <h2 className="text-center text-2xl font-black">คุณฝึกมานานแค่ไหน?</h2>
            <p className="mt-2 text-center text-sm text-zinc-500">
              เลือกเพื่อปรับโปรแกรมให้เหมาะ
            </p>
            <div className="mt-6 space-y-3">
              {LEVELS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setLevel(item.value)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    level === item.value
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  {level === item.value && (
                    <Check size={20} className="text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 1 && (
          <div>
            <h2 className="text-center text-2xl font-black">เป้าหมายหลักของคุณ?</h2>
            <p className="mt-2 text-center text-sm text-zinc-500">
              ระบบจะปรับจำนวนเซตและช่วง reps ให้
            </p>
            <div className="mt-6 space-y-3">
              {GOALS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setGoal(item.value)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    goal === item.value
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  {goal === item.value && (
                    <Check size={20} className="text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Days */}
        {step === 2 && (
          <div>
            <h2 className="text-center text-2xl font-black">ว่างฝึกกี่วัน/สัปดาห์?</h2>
            <p className="mt-2 text-center text-sm text-zinc-500">
              ซื่อสัตย์กับตัวเองนะครับ 😊
            </p>
            <div className="mt-6 space-y-3">
              {DAYS_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setDays(item.value)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    days === item.value
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className="text-2xl font-black text-emerald-400">
                    {item.value}
                  </span>
                  <div className="flex-1">
                    <p className="font-black">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  {days === item.value && (
                    <Check size={20} className="text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 rounded-2xl bg-zinc-900 px-5 py-3 font-bold text-zinc-300"
            >
              <ChevronLeft size={18} /> กลับ
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-zinc-950 disabled:opacity-40"
          >
            {step === 2 ? "เริ่มฝึกเลย! 🚀" : "ถัดไป"}
            {step < 2 && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) !== null;
  } catch {
    return true;
  }
}

export function getOnboardingResult(): OnboardingResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
