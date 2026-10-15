"use client";

import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { saveUserProfile, type Gender, type UserProfile } from "../lib/assessment";
import type { WeightUnit } from "../lib/units";

type Goal = "strength" | "hypertrophy" | "fitness";
type Days = 3 | 4 | 5;
export type AppLanguage = "th" | "en";
export type FontScale = "small" | "medium" | "large";

export type OnboardingResult = {
  level: "beginner" | "intermediate" | "advanced";
  goal: Goal;
  days: Days;
  language: AppLanguage;
  fontScale: FontScale;
  profile: UserProfile;
};

export const ONBOARDING_KEY = "haitOnboardingV1";
export const APP_LANGUAGE_KEY = "haitAppLanguageV1";
export const FONT_SCALE_KEY = "haitFontScaleV1";

const INJURIES = [
  { id: "lowerBack", label: "หลังส่วนล่าง" },
  { id: "shoulder", label: "ไหล่" },
  { id: "knee", label: "เข่า" },
  { id: "wrist", label: "ข้อมือ" },
] as const;

const GOALS: { value: Goal; label: string; desc: string; emoji: string }[] = [
  { value: "hypertrophy", label: "สร้างกล้ามเนื้อ", desc: "เน้นเพิ่มขนาดกล้ามเนื้อและปริมาณการฝึก", emoji: "📈" },
  { value: "strength", label: "เพิ่มความแข็งแรง", desc: "เน้นพัฒนาพละกำลังและการยกน้ำหนัก", emoji: "🏋️" },
  { value: "fitness", label: "สุขภาพและสมรรถภาพ", desc: "เน้นความฟิต ความสม่ำเสมอ และสุขภาพโดยรวม", emoji: "❤️" },
];

const DAY_OPTIONS: { value: Days; label: string; desc: string }[] = [
  { value: 3, label: "3 วัน/สัปดาห์", desc: "มีเวลาน้อย หรืออยากมีวันพักมากขึ้น" },
  { value: 4, label: "4 วัน/สัปดาห์", desc: "สมดุลระหว่างปริมาณฝึกกับการฟื้นตัว" },
  { value: 5, label: "5 วัน/สัปดาห์", desc: "เหมาะกับคนที่จัดเวลาและการพักได้สม่ำเสมอ" },
];

function readSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getAppLanguage(): AppLanguage {
  if (typeof window === "undefined") return "th";
  const value = window.localStorage.getItem(APP_LANGUAGE_KEY);
  return value === "en" ? "en" : "th";
}

export function getFontScale(): FontScale {
  if (typeof window === "undefined") return "medium";
  const value = window.localStorage.getItem(FONT_SCALE_KEY);
  return value === "small" || value === "large" ? value : "medium";
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) !== null
      && window.localStorage.getItem("haitUserProfileV1") !== null;
  } catch {
    return false;
  }
}

export function getOnboardingResult(): OnboardingResult | null {
  return readSaved<OnboardingResult | null>(ONBOARDING_KEY, null);
}

export function OnboardingWizard({
  onComplete,
}: {
  onComplete: (result: OnboardingResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [expMonths, setExpMonths] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState<Days | null>(null);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [language, setLanguage] = useState<AppLanguage>("th");
  const [fontScale, setFontScale] = useState<FontScale>("medium");

  const copy = language === "th" ? {
    title: "ยินดีต้อนรับสู่ HA IT",
    subtitle: "ตั้งค่าโปรไฟล์ก่อน เพื่อให้เราแนะนำโปรแกรมฝึกที่เหมาะกับคุณ",
    profile: "ข้อมูลส่วนตัวและพื้นฐานการฝึก",
    training: "เป้าหมายและเวลาที่ฝึกได้",
    preferences: "ภาษาและขนาดตัวอักษร",
    gender: "เพศที่ใช้คำนวณสรีรศาสตร์",
    male: "ชาย",
    female: "หญิง",
    age: "อายุ (ปี)",
    height: "ส่วนสูง (ซม.)",
    weight: "น้ำหนักตัว",
    experience: "ประสบการณ์ฝึกเวท",
    injuries: "อาการบาดเจ็บหรือจุดที่ควรระวัง (ไม่บังคับ)",
    goal: "เป้าหมายหลัก",
    days: "ฝึกได้กี่วันต่อสัปดาห์?",
    language: "ภาษาแอป",
    font: "ขนาดตัวอักษร",
    small: "เล็ก",
    medium: "มาตรฐาน",
    large: "ใหญ่",
    next: "ถัดไป",
    back: "ย้อนกลับ",
    start: "บันทึกและแนะนำโปรแกรม",
    required: "กรอกข้อมูลที่จำเป็นให้ครบก่อนดำเนินการ",
    beginner: "มือใหม่ (น้อยกว่า 6 เดือน)",
    intermediate: "ระดับกลาง (6 เดือน ถึง 2 ปี)",
    advanced: "ขั้นสูง (มากกว่า 2 ปี)",
  } : {
    title: "Welcome to HA IT",
    subtitle: "Set up your profile first so we can recommend a suitable training program.",
    profile: "Personal profile and training background",
    training: "Goals and training availability",
    preferences: "Language and text size",
    gender: "Gender for biomechanics",
    male: "Male",
    female: "Female",
    age: "Age (years)",
    height: "Height (cm)",
    weight: "Body weight",
    experience: "Weight-training experience",
    injuries: "Injuries or areas to be careful with (optional)",
    goal: "Primary goal",
    days: "How many days can you train each week?",
    language: "App language",
    font: "Text size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    next: "Continue",
    back: "Back",
    start: "Save and recommend programs",
    required: "Complete the required fields before continuing.",
    beginner: "Beginner (under 6 months)",
    intermediate: "Intermediate (6 months to 2 years)",
    advanced: "Advanced (over 2 years)",
  }, [language];

  const level = expMonths === null ? null : expMonths < 6 ? "beginner" : expMonths >= 24 ? "advanced" : "intermediate";
  const canContinue = step === 0
    ? Boolean(gender && Number(age) >= 16 && Number(age) <= 100 && Number(heightCm) >= 100 && Number(heightCm) <= 250 && Number(weightKg) >= 25 && Number(weightKg) <= 350 && expMonths !== null)
    : step === 1 ? Boolean(goal && days) : true;

  const handleComplete = () => {
    if (!gender || !level || !goal || !days) return;
    const profile: UserProfile = {
      gender,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: unit === "lbs" ? Math.round(Number(weightKg) * 0.453592 * 10) / 10 : Number(weightKg),
      expMonths: expMonths!,
      daysPerWeek: days,
      goal,
      injuries,
      preferredWeightUnit: unit,
      updatedAt: new Date().toISOString(),
    };
    saveUserProfile(profile);
    try {
      window.localStorage.setItem("haitBodyweight", JSON.stringify({
        lbs: Math.round((profile.weightKg / 0.453592) * 10) / 10,
        updatedAt: new Date().toISOString(),
      }));
      window.localStorage.setItem(APP_LANGUAGE_KEY, language);
      window.localStorage.setItem(FONT_SCALE_KEY, fontScale);
      const result: OnboardingResult = { level, goal, days, language, fontScale, profile };
      window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(result));
    } catch {}
    onComplete({ level, goal, days, language, fontScale, profile });
  };

  const inputClass = "mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base font-bold text-white outline-none focus:border-emerald-400";
  const optionClass = (active: boolean) => `rounded-xl border px-3 py-3 text-left transition ${active ? "border-emerald-400 bg-emerald-400/10 text-emerald-200" : "border-zinc-800 bg-zinc-900 text-zinc-300"}`;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-zinc-950/95 p-3 backdrop-blur-md sm:p-5">
      <div className="my-auto w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">HA IT · SETUP</p>
            <h2 className="mt-1 text-2xl font-black text-white">{copy.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <Globe size={15} className="ml-1 text-zinc-400" />
            <button type="button" onClick={() => setLanguage("th")} className={`rounded-lg px-2 py-1.5 text-xs font-black ${language === "th" ? "bg-emerald-400 text-black" : "text-zinc-400"}`}>ไทย</button>
            <button type="button" onClick={() => setLanguage("en")} className={`rounded-lg px-2 py-1.5 text-xs font-black ${language === "en" ? "bg-emerald-400 text-black" : "text-zinc-400"}`}>EN</button>
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          {[copy.profile, copy.training, copy.preferences].map((label, i) => (
            <div key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-emerald-400" : "bg-zinc-800"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-zinc-200">{copy.profile}</h3>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">{copy.gender} *</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setGender("male")} className={optionClass(gender === "male")}>{copy.male}</button>
                <button type="button" onClick={() => setGender("female")} className={optionClass(gender === "female")}>{copy.female}</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs font-bold text-zinc-400">{copy.age} *
                <input className={inputClass} inputMode="numeric" type="number" min={16} max={100} value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
              </label>
              <label className="text-xs font-bold text-zinc-400">{copy.height} *
                <input className={inputClass} inputMode="decimal" type="number" min={100} max={250} value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="175" />
              </label>
              <label className="text-xs font-bold text-zinc-400">{copy.weight} ({unit}) *
                <input className={inputClass} inputMode="decimal" type="number" min={25} max={350} value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="70" />
              </label>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">{copy.experience} *</label>
              <div className="grid gap-2">
                {[
                  { value: 3, label: copy.beginner },
                  { value: 12, label: copy.intermediate },
                  { value: 36, label: copy.advanced },
                ].map(item => (
                  <button key={item.value} type="button" onClick={() => setExpMonths(item.value)} className={optionClass(expMonths === item.value)}>{item.label}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-zinc-400">หน่วยน้ำหนัก / Weight unit</p>
              <div className="flex gap-1 rounded-xl bg-zinc-900 p-1">
                {(["kg", "lbs"] as WeightUnit[]).map(v => <button key={v} type="button" onClick={() => setUnit(v)} className={`rounded-lg px-3 py-1.5 text-xs font-black ${unit === v ? "bg-emerald-400 text-black" : "text-zinc-400"}`}>{v}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-zinc-400">{copy.injuries}</p>
              <div className="grid grid-cols-2 gap-2">
                {INJURIES.map(item => (
                  <button key={item.id} type="button" onClick={() => setInjuries(old => old.includes(item.id) ? old.filter(x => x !== item.id) : [...old, item.id])} className={optionClass(injuries.includes(item.id))}>
                    {injuries.includes(item.id) ? "✓ " : ""}{item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-zinc-200">{copy.training}</h3>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">{copy.goal} *</label>
              <div className="space-y-2">
                {GOALS.map(item => (
                  <button key={item.value} type="button" onClick={() => setGoal(item.value)} className={optionClass(goal === item.value)}>
                    <span className="mr-2 text-xl">{item.emoji}</span><span className="font-black">{language === "th" ? item.label : ({hypertrophy:"Muscle growth",strength:"Strength",fitness:"General fitness"} as Record<Goal,string>)[item.value]}</span>
                    <span className="mt-1 block text-xs opacity-75">{language === "th" ? item.desc : ({hypertrophy:"Build muscle size and training volume.",strength:"Improve force production and lifting strength.",fitness:"Build fitness, consistency and general health."} as Record<Goal,string>)[item.value]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">{copy.days} *</label>
              <div className="space-y-2">
                {DAY_OPTIONS.map(item => (
                  <button key={item.value} type="button" onClick={() => setDays(item.value)} className={optionClass(days === item.value)}>
                    <span className="font-black">{item.label}</span><span className="mt-1 block text-xs opacity-75">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-black text-zinc-200">{copy.preferences}</h3>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">{copy.language}</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setLanguage("th")} className={optionClass(language === "th")}>ไทย</button>
                <button type="button" onClick={() => setLanguage("en")} className={optionClass(language === "en")}>English</button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">{copy.font}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["small", "medium", "large"] as FontScale[]).map(v => (
                  <button key={v} type="button" onClick={() => setFontScale(v)} className={optionClass(fontScale === v)}>
                    {copy[v]} <span className="ml-1" style={{fontSize: v === "small" ? 12 : v === "large" ? 18 : 15}}>Aa</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-zinc-400">
              {language === "th" ? "เมื่อบันทึกแล้ว HA IT จะเปิดรายการโปรแกรมที่แนะนำจากข้อมูลของคุณ คุณสามารถดูจุดเด่น ประโยชน์ และระดับความยากก่อนเลือกเริ่มได้" : "After saving, HA IT will show programs recommended for your profile. Review each program's focus, benefits and difficulty before choosing one."}
            </p>
          </div>
        )}

        {!canContinue && <p className="mt-4 text-xs font-bold text-amber-300">{copy.required}</p>}

        <div className="mt-6 flex gap-2">
          {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300"><ChevronLeft size={16}/>{copy.back}</button>}
          <button type="button" disabled={!canContinue} onClick={() => step < 2 ? setStep(s => s + 1) : handleComplete()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40">
            {step === 2 ? copy.start : copy.next} {step === 2 ? <Check size={16}/> : <ChevronRight size={16}/>}
          </button>
        </div>
      </div>
    </div>
  );
}
