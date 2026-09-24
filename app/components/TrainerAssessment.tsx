"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Activity,
  Dumbbell,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Scale,
} from "lucide-react";
import {
  getUserProfile,
  saveUserProfile,
  getAsiaPacificBmi,
  evaluateMuscleMass,
  calculatePrescriptionWeight,
  INJURY_RULES,
  type UserProfile,
  type Gender,
  type FitnessGoal,
  type MuscleMassMode,
  type BiomechanicalResult,
} from "../lib/assessment";
import type { WeightUnit } from "../lib/units";

type Props = {
  open: boolean;
  onClose: () => void;
  onApplyPlan?: (days: 3 | 4 | 5, profile: UserProfile) => void;
};

const SAMPLE_EXERCISES = [
  { name: "Bench Press", load: "barbell", reps: "6 to 10" },
  { name: "Flat DB Press", load: "dumbbell", reps: "8 to 12" },
  { name: "Cable Lat Raise", load: "cable", reps: "12 to 20" },
  { name: "45° Leg Press", load: "plate-loaded", reps: "10 to 15" },
  { name: "Hack Squat", load: "barbell", reps: "6 to 10" },
  { name: "Chest Supported Row", load: "dumbbell", reps: "8 to 12" },
  { name: "Neutral Grip Lat Pull Down", load: "cable", reps: "8 to 12" },
  { name: "Romanian Deadlift RDL", load: "barbell", reps: "6 to 10" },
  { name: "Seated Hamstring Curl", load: "selectorized", reps: "10 to 15" },
  { name: "Overhead Cable Ext", load: "cable", reps: "10 to 15" },
  { name: "Face Away Bayesian Curl", load: "cable", reps: "10 to 15" },
];

export function TrainerAssessment({ open, onClose, onApplyPlan }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(172);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [muscleMassKg, setMuscleMassKg] = useState<string>("");
  const [muscleMassMode, setMuscleMassMode] = useState<MuscleMassMode>("smm");
  const [expMonths, setExpMonths] = useState<number>(6);
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(4);
  const [goal, setGoal] = useState<FitnessGoal>("hypertrophy");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<WeightUnit>("kg");

  useEffect(() => {
    if (open) {
      const saved = getUserProfile();
      if (saved) {
        setGender(saved.gender);
        setAge(saved.age);
        setHeightCm(saved.heightCm);
        setWeightKg(saved.weightKg);
        setMuscleMassKg(saved.muscleMassKg ? String(saved.muscleMassKg) : "");
        setMuscleMassMode(saved.muscleMassMode || "smm");
        setExpMonths(saved.expMonths);
        setDaysPerWeek(saved.daysPerWeek);
        setGoal(saved.goal);
        setInjuries(saved.injuries || []);
        setPreferredWeightUnit(saved.preferredWeightUnit || "kg");
      }
    }
  }, [open]);

  if (!open) return null;

  const currentProfile: UserProfile = {
    gender,
    age,
    heightCm,
    weightKg,
    muscleMassKg: muscleMassKg ? Number(muscleMassKg) : undefined,
    muscleMassMode,
    expMonths,
    daysPerWeek,
    goal,
    injuries,
    preferredWeightUnit,
    updatedAt: new Date().toISOString(),
  };

  const bmiInfo = getAsiaPacificBmi(weightKg, heightCm);
  const muscleInfo = evaluateMuscleMass(
    gender,
    weightKg,
    muscleMassKg ? Number(muscleMassKg) : undefined,
    muscleMassMode
  );

  const toggleInjury = (id: string) => {
    setInjuries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSaveAndCalculate = () => {
    saveUserProfile(currentProfile);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-3xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-base font-black text-zinc-100">AI Trainer Assessment</h3>
              <p className="text-[11px] text-zinc-500">
                ประเมินแรงตามหลักชีวกลศาสตร์ (Biomechanical 1RM Engine)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/50 px-5 py-2.5">
          {[
            { s: 1, label: "สรีระ & กล้ามเนื้อ" },
            { s: 2, label: "ประสบการณ์ & บาดเจ็บ" },
            { s: 3, label: "ตารางน้ำหนักที่แนะนำ" },
          ].map((item) => (
            <div
              key={item.s}
              onClick={() => (step > item.s ? setStep(item.s as any) : null)}
              className={`flex-1 text-center text-xs font-bold transition ${
                step === item.s
                  ? "text-emerald-400 border-b-2 border-emerald-400 pb-1"
                  : step > item.s
                  ? "text-zinc-400 cursor-pointer"
                  : "text-zinc-600"
              }`}
            >
              <span>{item.s}. {item.label}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* STEP 1: Body Stats */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Gender */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-400">
                  เพศสรีระ (Biological Gender)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      gender === "male"
                        ? "border border-emerald-400 bg-emerald-400 text-zinc-950 font-black shadow-sm"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    👨 ชาย (Male)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      gender === "female"
                        ? "border border-emerald-400 bg-emerald-400 text-zinc-950 font-black shadow-sm"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    👩 หญิง (Female)
                  </button>
                </div>
              </div>

              {/* Age, Height, Weight */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-zinc-400">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Math.max(12, Number(e.target.value) || 20))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-zinc-400">ส่วนสูง (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(100, Number(e.target.value) || 160))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400">น้ำหนักตัว</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextUnit: WeightUnit = preferredWeightUnit === "kg" ? "lbs" : "kg";
                        setPreferredWeightUnit(nextUnit);
                      }}
                      className="text-[10px] font-black text-emerald-400 underline"
                      title="กดเพื่อสลับหน่วย"
                    >
                      {preferredWeightUnit}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={
                        preferredWeightUnit === "lbs"
                          ? Math.round((weightKg / 0.453592) * 10) / 10
                          : weightKg
                      }
                      onChange={(e) => {
                        const val = Math.max(20, Number(e.target.value) || 50);
                        if (preferredWeightUnit === "lbs") {
                          setWeightKg(Math.round(val * 0.453592 * 10) / 10);
                        } else {
                          setWeightKg(val);
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-3 pr-8 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-emerald-400"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-2 text-xs font-bold text-zinc-500">
                      {preferredWeightUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* BMI Live Card */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Asia-Pacific BMI:</span>
                  <span className="text-sm font-black text-emerald-300">
                    {bmiInfo.bmi} — {bmiInfo.label}
                  </span>
                </div>
              </div>

              {/* Muscle Mass (Optional) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    มวลกล้ามเนื้อ (InBody / Dexa) - ไม่บังคับ
                  </label>
                  <div className="flex gap-1 rounded-lg bg-zinc-950 p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMuscleMassMode("smm")}
                      className={`px-2 py-0.5 rounded font-bold ${
                        muscleMassMode === "smm" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"
                      }`}
                    >
                      SMM
                    </button>
                    <button
                      type="button"
                      onClick={() => setMuscleMassMode("total")}
                      className={`px-2 py-0.5 rounded font-bold ${
                        muscleMassMode === "total" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"
                      }`}
                    >
                      Total
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 28.5 (kg)"
                    value={muscleMassKg}
                    onChange={(e) => setMuscleMassKg(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-zinc-500 font-bold">kg</span>
                </div>
                {muscleMassKg && (
                  <p className="text-[11px] text-emerald-300 font-medium">
                    {muscleInfo.percentage}% นน. ตัว · {muscleInfo.label}
                  </p>
                )}
              </div>

              {/* Preferred Unit Selection */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-400">
                  หน่วยน้ำหนักหลักประจำเครื่อง (Default Global Unit)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredWeightUnit("kg")}
                    className={`rounded-xl py-2 text-xs font-bold transition ${
                      preferredWeightUnit === "kg"
                        ? "border border-emerald-400 bg-emerald-400 text-zinc-950 font-black"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    กิโลกรัม (kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredWeightUnit("lbs")}
                    className={`rounded-xl py-2 text-xs font-bold transition ${
                      preferredWeightUnit === "lbs"
                        ? "border border-emerald-400 bg-emerald-400 text-zinc-950 font-black"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    ปอนด์ (lbs)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Goals, Experience & Injuries */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Experience */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-400">
                  ประสบการณ์ฝึกเวทเทรนนิ่ง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { m: 3, label: "มือใหม่ (<6 เดือน)", sub: "ตัวคูณ 0.45" },
                    { m: 9, label: "เริ่มต้น (6-12 เดือน)", sub: "ตัวคูณ 0.65" },
                    { m: 18, label: "ระดับกลาง (1-2 ปี)", sub: "ตัวคูณ 0.85" },
                    { m: 36, label: "ระดับสูง (>2 ปี)", sub: "ตัวคูณ 1.00" },
                  ].map((item) => (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => setExpMonths(item.m)}
                      className={`rounded-xl p-2.5 text-left transition ${
                        (item.m === 3 && expMonths < 6) ||
                        (item.m === 9 && expMonths >= 6 && expMonths < 12) ||
                        (item.m === 18 && expMonths >= 12 && expMonths < 24) ||
                        (item.m === 36 && expMonths >= 24)
                          ? "border border-emerald-400 bg-emerald-400/20 text-emerald-300 font-bold"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      <p className="text-xs font-black">{item.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-400">
                  เป้าหมายหลัก (Training Goal)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "strength", label: "Strength", desc: "เน้นแรงยก" },
                    { id: "hypertrophy", label: "Hypertrophy", desc: "เน้นกล้ามโต" },
                    { id: "fitness", label: "Fitness", desc: "สุขภาพสมส่วน" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoal(item.id as FitnessGoal)}
                      className={`rounded-xl p-2 text-center transition ${
                        goal === item.id
                          ? "border border-emerald-400 bg-emerald-400 text-zinc-950 font-black"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      <p className="text-xs font-black">{item.label}</p>
                      <p className="text-[10px] opacity-80 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Days Per Week */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase text-zinc-400">
                  วันฝึกต่อสัปดาห์
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { d: 3, label: "3 วัน", desc: "Full Body" },
                    { d: 4, label: "4 วัน", desc: "Upper / Lower" },
                    { d: 5, label: "5 วัน", desc: "Split Routine" },
                  ].map((item) => (
                    <button
                      key={item.d}
                      type="button"
                      onClick={() => setDaysPerWeek(item.d as any)}
                      className={`rounded-xl p-2.5 text-center transition ${
                        daysPerWeek === item.d
                          ? "border border-emerald-400 bg-emerald-400 text-zinc-950 font-black"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      <p className="text-sm font-black">{item.label}</p>
                      <p className="text-[10px] opacity-80">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Injuries & Limitations */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-400">
                  <ShieldAlert size={14} className="text-amber-400" /> จุดที่มีอาการบาดเจ็บ / หลีกเลี่ยง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(INJURY_RULES).map(([key, info]) => {
                    const isChecked = injuries.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleInjury(key)}
                        className={`rounded-xl p-2.5 text-left text-xs font-bold transition flex items-center justify-between ${
                          isChecked
                            ? "border border-amber-500/50 bg-amber-500/10 text-amber-300"
                            : "border border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        <span>{info.label}</span>
                        {isChecked && <Check size={14} className="text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Results Table */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-400">ผลการประเมินชีวกลศาสตร์</p>
                    <p className="text-sm font-black text-zinc-100">
                      น้ำหนักตัว {weightKg} kg · {goal.toUpperCase()} · {daysPerWeek} วัน/สัปดาห์
                    </p>
                  </div>
                  <span className="rounded-xl bg-emerald-400 px-2.5 py-1 text-xs font-black text-zinc-950">
                    คำนวณแล้ว
                  </span>
                </div>
              </div>

              {/* Prescription Table */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase text-zinc-400">
                  น้ำหนักเริ่มต้นแนะนำตามเครื่องเล่นจริง (Hardware Snapped)
                </div>
                <div className="divide-y divide-zinc-800/80 max-h-64 overflow-y-auto">
                  {SAMPLE_EXERCISES.map((ex) => {
                    const calc = calculatePrescriptionWeight(
                      ex.name,
                      ex.load,
                      ex.reps,
                      currentProfile
                    );

                    return (
                      <div key={ex.name} className="flex items-center justify-between p-3 text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-zinc-200">{ex.name}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{calc.displayNote}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-black text-emerald-300">
                            {preferredWeightUnit === "lbs"
                              ? `${Math.round(calc.hardwareWeightKg * 2.20462 * 10) / 10} lbs`
                              : `${calc.hardwareWeightKg} kg`}
                          </span>
                          <span className="block text-[10px] text-zinc-500 mt-0.5">
                            {preferredWeightUnit === "lbs"
                              ? `~${calc.hardwareWeightKg} kg`
                              : `~${(calc.hardwareWeightKg * 2.20462).toFixed(1)} lbs`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Injury Substitutions Warning */}
              {injuries.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
                  <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert size={14} /> ตรวจพบการบาดเจ็บ: ระบบจะปรับลดท่าเสี่ยงอัตโนมัติ
                  </p>
                  <ul className="text-[11px] text-zinc-400 space-y-1 list-disc pl-4">
                    {injuries.map((id) => (
                      <li key={id}>
                        {INJURY_RULES[id]?.label}: แนะนำเลี่ยง{" "}
                        {INJURY_RULES[id]?.warns.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-5 py-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="flex items-center gap-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
            >
              <ChevronLeft size={16} /> ย้อนกลับ
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) setStep(2);
                else handleSaveAndCalculate();
              }}
              className="flex items-center gap-1 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-black text-zinc-950 shadow-md transition hover:bg-emerald-300"
            >
              ถัดไป <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  saveUserProfile(currentProfile);
                  onApplyPlan?.(daysPerWeek, currentProfile);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-zinc-950 shadow-md transition hover:bg-emerald-300"
              >
                <Sparkles size={14} /> ใช้น้ำหนัก & จัดตาราง {daysPerWeek} วัน
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
