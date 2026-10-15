"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  type JeffProgram,
  type ProgramRecommendation,
  type ActiveJeffProgramState,
  JEFF_PROGRAMS,
  recommendPrograms,
  getActiveJeffProgram,
  saveActiveJeffProgram,
  clearActiveJeffProgram,
  findProgramById,
  getProgramCurrentWeek,
  getProgramScheduledDates,
  getProgramDateKey,
} from "../lib/jeffPrograms";
import { getOnboardingResult } from "./OnboardingWizard";
import { getUserProfile } from "../lib/assessment";

const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const DAY_FULL_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์", "อาทิตย์"];
const SPLIT_LABELS: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper/Lower",
  push_pull_legs: "Push/Pull/Legs",
  bodypart: "Body Part Split",
  at_home: "At-Home",
  powerbuilding: "Powerbuilding",
};
const EQUIPMENT_LABELS: Record<string, string> = {
  full_gym: "Full Gym",
  dumbbells_only: "Dumbbells Only",
  bodyweight: "Bodyweight / No Equipment",
  barbell_rack: "Barbell + Rack",
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: "มือใหม่",
  intermediate: "กลาง",
  advanced: "ขั้นสูง",
};
const GOAL_LABELS: Record<string, string> = {
  strength: "Strength 💪",
  hypertrophy: "Hypertrophy 📈",
  powerbuilding: "Powerbuilding ⚡",
  fitness: "General Fitness ❤️",
  fat_loss: "Fat Loss 🔥",
};

function ProgramCard({
  program,
  recommendation,
  onSelect,
  isActive,
}: {
  program: JeffProgram;
  recommendation?: ProgramRecommendation;
  onSelect: (p: JeffProgram) => void;
  isActive?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isActive
          ? "border-yellow-400 bg-yellow-400/5 shadow-[0_0_20px_rgba(250,204,21,0.15)]"
          : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-600"
      }`}
    >
      {/* Active Badge */}
      {isActive && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-black">
          <Play size={9} fill="black" />
          โปรแกรมที่ใช้อยู่
        </div>
      )}

      {/* Match Badge */}
      {recommendation && !isActive && (
        <div
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
            recommendation.matchBadge === "Perfect Match"
              ? "bg-emerald-400/20 text-emerald-300 border border-emerald-500/40"
              : recommendation.matchBadge === "Great Match"
              ? "bg-blue-400/20 text-blue-300 border border-blue-500/40"
              : "bg-zinc-700/60 text-zinc-300 border border-zinc-600/40"
          }`}
        >
          <Star size={9} fill="currentColor" />
          {recommendation.matchBadge}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${program.color} text-2xl shadow-lg`}
          >
            {program.emoji}
          </div>
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="font-black text-white leading-tight">{program.name}</h3>
            <p className="mt-0.5 text-xs text-zinc-400">{program.description}</p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300">
            <Calendar size={10} />
            {program.daysPerWeek} วัน/สัปดาห์
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300">
            <Clock size={10} />
            {program.durationWeeks} สัปดาห์
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300">
            <Layers size={10} />
            {SPLIT_LABELS[program.split]}
          </span>
          {program.level.map((l) => (
            <span
              key={l}
              className={`inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold ${
                l === "beginner"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : l === "intermediate"
                  ? "bg-blue-400/15 text-blue-300"
                  : "bg-purple-400/15 text-purple-300"
              }`}
            >
              {LEVEL_LABELS[l]}
            </span>
          ))}
        </div>

        {/* Recommendation Reasons */}
        {recommendation && recommendation.reasons.length > 0 && (
          <div className="mt-3 space-y-1">
            {recommendation.reasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <CheckCircle size={10} className="shrink-0" />
                {reason}
              </div>
            ))}
          </div>
        )}

        {/* Expand details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition"
        >
          <Info size={11} />
          {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียดเพิ่ม"}
          <ChevronDown
            size={11}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2 text-xs text-zinc-400">
            <p>{program.longDescription}</p>
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Highlights</p>
              {program.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-1.5 text-zinc-300">
                  <Sparkles size={9} className="text-yellow-400" />
                  {h}
                </div>
              ))}
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase text-emerald-500">✓ Best for: </span>
              <span className="text-zinc-300">{program.bestFor}</span>
            </div>
            {program.notFor && (
              <div>
                <span className="text-[10px] font-bold uppercase text-red-500">✗ Not for: </span>
                <span className="text-zinc-300">{program.notFor}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-500">Equipment: </span>
              <span className="text-zinc-300">{EQUIPMENT_LABELS[program.equipment]}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-500">Goal: </span>
              <span className="text-zinc-300">{program.goals.map((g) => GOAL_LABELS[g]).join(", ")}</span>
            </div>
          </div>
        )}

        {/* Select Button */}
        <button
          onClick={() => onSelect(program)}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black transition active:scale-95 ${
            isActive
              ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
              : `bg-gradient-to-r ${program.color} text-white shadow-lg hover:opacity-90`
          }`}
        >
          {isActive ? (
            <>
              <CheckCircle size={15} />
              กำลังใช้งานอยู่
            </>
          ) : (
            <>
              <Play size={14} fill="white" />
              เลือกโปรแกรมนี้
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROGRAM SETUP MODAL (Step 2: Schedule)
// ─────────────────────────────────────────────────────────────────
function ProgramSetupModal({
  program,
  onConfirm,
  onCancel,
}: {
  program: JeffProgram;
  onConfirm: (state: ActiveJeffProgramState) => void;
  onCancel: () => void;
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>(program.defaultScheduleDays);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return getProgramDateKey(today);
  });

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const isDayCountValid =
    selectedDays.length === program.daysPerWeek ||
    Math.abs(selectedDays.length - program.daysPerWeek) <= 1;

  const handleConfirm = () => {
    const state: ActiveJeffProgramState = {
      programId: program.id,
      startDate,
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: selectedDays,
    };
    onConfirm(state);
  };

  // Preview next 14 days
  const nextDates = getProgramScheduledDates(startDate, selectedDays, 2).slice(0, 14);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/90 backdrop-blur-md sm:items-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${program.color} p-5`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{program.emoji}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                ตั้งค่าโปรแกรม
              </p>
              <h2 className="text-lg font-black text-white">{program.shortName}</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/80">
            {program.daysPerWeek} วัน/สัปดาห์ · {program.durationWeeks} สัปดาห์ · {SPLIT_LABELS[program.split]}
          </p>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Start date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 block">
              วันเริ่มต้น
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white font-medium focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {/* Training days */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-1 block">
              วันออกกำลังกาย
            </label>
            <p className="text-[11px] text-zinc-500 mb-3">
              แนะนำ {program.daysPerWeek} วัน/สัปดาห์ — เลือก {selectedDays.length} วัน
              {!isDayCountValid && (
                <span className="text-amber-400 ml-1">
                  (แนะนำ {program.daysPerWeek} วัน)
                </span>
              )}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(idx)}
                  className={`flex flex-col items-center rounded-xl py-2 text-xs font-bold transition active:scale-90 ${
                    selectedDays.includes(idx)
                      ? `bg-gradient-to-b ${program.color} text-white shadow-sm`
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span className="text-[10px]">{label}</span>
                  {selectedDays.includes(idx) && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-white/80" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule preview */}
          {nextDates.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 block">
                ตารางฝึก 2 สัปดาห์แรก
              </label>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {nextDates.map((date) => {
                    const d = new Date(date);
                    const dayIdx = (d.getDay() + 6) % 7;
                    return (
                      <div
                        key={date}
                        className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1"
                      >
                        <span className="text-[10px] font-bold text-yellow-400">
                          {DAY_FULL_LABELS[dayIdx]}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {d.getDate()}/{d.getMonth() + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Week 1 preview */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 block">
              ตัวอย่าง Week 1
            </label>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
              {program.weeks[0].days.map((day, i) => (
                <div key={i} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{day.dayLabel}: {day.focusLabel}</span>
                    <span className="text-[10px] text-zinc-500">{day.exercises.length} exercises</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-zinc-500 truncate">
                    {day.exercises.slice(0, 3).map((e) => e.name).join(" · ")}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-zinc-800">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-zinc-300 border border-zinc-700 active:scale-95 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${program.color} py-3 text-sm font-black text-white shadow-lg active:scale-95 transition`}
          >
            <Zap size={15} />
            เริ่มโปรแกรม!
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACTIVE PROGRAM DASHBOARD (shown at top when program is running)
// ─────────────────────────────────────────────────────────────────
export function ActiveProgramDashboard({
  activeState,
  onNavigateToPrograms,
  onStopProgram,
}: {
  activeState: ActiveJeffProgramState;
  onNavigateToPrograms: () => void;
  onStopProgram: () => void;
}) {
  const program = findProgramById(activeState.programId);
  if (!program) return null;

  const currentWeekData = getProgramCurrentWeek(activeState);
  const todayKey = getProgramDateKey(new Date());
  const dayOfWeek = (new Date().getDay() + 6) % 7;
  const isTodayTrainingDay = activeState.scheduleDays.includes(dayOfWeek);
  const isCompletedToday = activeState.completedDays.includes(todayKey);

  // Progress percentage
  const totalDays = program.durationWeeks * program.daysPerWeek;
  const completedCount = activeState.completedDays.length;
  const progressPct = Math.min(100, Math.round((completedCount / totalDays) * 100));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br ${program.color}/10 p-4 mb-4`}
    >
      {/* Background glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-5 pointer-events-none`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{program.emoji}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                โปรแกรมปัจจุบัน
              </p>
              <p className="font-black text-white truncate">{program.shortName}</p>
            </div>
          </div>
          <button
            onClick={onNavigateToPrograms}
            className="shrink-0 rounded-xl bg-zinc-800 px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:bg-zinc-700 transition"
          >
            เปลี่ยน
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>สัปดาห์ที่ {activeState.currentWeek}/{program.durationWeeks}</span>
            <span>{completedCount}/{totalDays} sessions · {progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${program.color} transition-all`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Today's workout */}
        {currentWeekData && (
          <div className="mt-3">
            {isTodayTrainingDay ? (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-3">
                <p className="text-[10px] font-bold uppercase text-yellow-400 mb-1">
                  {isCompletedToday ? "✅ วันนี้เสร็จแล้ว!" : "⚡ วันนี้มีฝึก!"}
                </p>
                {currentWeekData.days.map((day, i) => (
                  <div key={i} className="text-xs text-zinc-300">
                    <span className="font-black">{day.dayLabel}:</span> {day.focusLabel}
                    <span className="text-zinc-500 ml-1">({day.exercises.length} exercises)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">
                🗓️ วันหยุดพัก — วันฝึกถัดไป:{" "}
                {(() => {
                  const nextDay = activeState.scheduleDays.find((d) => d > dayOfWeek) ??
                    activeState.scheduleDays[0];
                  return DAY_FULL_LABELS[nextDay];
                })()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN JEFF PROGRAM PICKER
// ─────────────────────────────────────────────────────────────────
export function JeffProgramPicker({
  onProgramActivated,
  onClose,
}: {
  onProgramActivated: (state: ActiveJeffProgramState) => void;
  onClose?: () => void;
}) {
  const [filter, setFilter] = useState<"recommended" | "all" | "beginner" | "intermediate" | "advanced">("recommended");
  const [setupProgram, setSetupProgram] = useState<JeffProgram | null>(null);
  const [activeState, setActiveState] = useState<ActiveJeffProgramState | null>(null);
  const [recommendations, setRecommendations] = useState<ProgramRecommendation[]>([]);
  const [confirmStop, setConfirmStop] = useState(false);

  useEffect(() => {
    // Load active program
    const saved = getActiveJeffProgram();
    setActiveState(saved);

    // Build recommendations prioritizing detailed userProfile, then onboarding wizard
    const profile = getUserProfile();
    const onboarding = getOnboardingResult();

    const resolvedLevel = profile
      ? profile.expMonths < 6
        ? "beginner"
        : profile.expMonths >= 24
        ? "advanced"
        : "intermediate"
      : onboarding?.level || "intermediate";

    const resolvedGoal = profile?.goal || onboarding?.goal || "hypertrophy";
    const resolvedDays = (profile?.daysPerWeek || onboarding?.days || 4) as 3 | 4 | 5 | 6;

    const recs = recommendPrograms(
      resolvedLevel,
      resolvedGoal === "fitness" ? "fitness" : resolvedGoal as "strength" | "hypertrophy" | "fitness",
      resolvedDays,
      true,
      {
        injuries: profile?.injuries || [],
        expMonths: profile?.expMonths,
        daysPerWeek: resolvedDays,
        goal: resolvedGoal,
        level: resolvedLevel,
      }
    );
    setRecommendations(recs);
  }, []);

  const handleSelectProgram = (program: JeffProgram) => {
    setSetupProgram(program);
  };

  const handleConfirmSetup = (state: ActiveJeffProgramState) => {
    saveActiveJeffProgram(state);
    setActiveState(state);
    setSetupProgram(null);
    onProgramActivated(state);
  };

  const handleStopProgram = () => {
    clearActiveJeffProgram();
    setActiveState(null);
    setConfirmStop(false);
  };

  // Filter programs
  const filteredPrograms = (() => {
    if (filter === "recommended") {
      return recommendations.map((r) => ({ program: r.program, recommendation: r }));
    }
    const all = filter === "all"
      ? JEFF_PROGRAMS
      : JEFF_PROGRAMS.filter((p) => p.level.includes(filter as "beginner" | "intermediate" | "advanced"));
    return all.map((p) => ({ program: p, recommendation: undefined }));
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen size={18} className="text-yellow-400" />
            Jeff Nippard Programs
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {JEFF_PROGRAMS.length} โปรแกรมจาก PDF ทั้งหมด
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-xl bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 transition">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Active Program Banner */}
      {activeState && (
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{findProgramById(activeState.programId)?.emoji}</span>
              <div>
                <p className="text-[10px] font-bold uppercase text-yellow-400">กำลังใช้งาน</p>
                <p className="text-sm font-black text-white">
                  {findProgramById(activeState.programId)?.shortName}
                </p>
                <p className="text-xs text-zinc-400">
                  สัปดาห์ {activeState.currentWeek} · {activeState.completedDays.length} sessions ✅
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmStop(true)}
              className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              <RotateCcw size={12} />
              หยุด
            </button>
          </div>
        </div>
      )}

      {/* Confirm Stop */}
      {confirmStop && (
        <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-4">
          <p className="text-sm font-bold text-red-300 mb-3">⚠️ หยุดโปรแกรมปัจจุบัน?</p>
          <p className="text-xs text-zinc-400 mb-3">ประวัติการฝึกจะยังอยู่ แต่ progress จะถูก reset</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmStop(false)}
              className="flex-1 rounded-xl bg-zinc-800 py-2 text-sm font-bold text-zinc-300 border border-zinc-700"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleStopProgram}
              className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-black text-white"
            >
              ยืนยันหยุด
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "recommended", label: "⭐ แนะนำ" },
          { key: "all", label: "ทั้งหมด" },
          { key: "beginner", label: "🌱 มือใหม่" },
          { key: "intermediate", label: "💪 กลาง" },
          { key: "advanced", label: "🔥 ขั้นสูง" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filter === tab.key
                ? "bg-yellow-400 text-black"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendation header */}
      {filter === "recommended" && recommendations.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/20 border border-emerald-500/30 px-3 py-2">
          <Sparkles size={14} className="text-emerald-400" />
          <p className="text-xs text-emerald-300">
            แนะนำตามข้อมูลส่วนตัวของคุณ — ระดับ · เป้าหมาย · วันว่าง
          </p>
        </div>
      )}

      {/* Program list */}
      <div className="space-y-3">
        {filteredPrograms.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-500 text-sm">ไม่พบโปรแกรม</p>
          </div>
        ) : (
          filteredPrograms.map(({ program, recommendation }) => (
            <ProgramCard
              key={program.id}
              program={program}
              recommendation={recommendation}
              onSelect={handleSelectProgram}
              isActive={activeState?.programId === program.id}
            />
          ))
        )}
      </div>

      {/* Setup Modal */}
      {setupProgram && (
        <ProgramSetupModal
          program={setupProgram}
          onConfirm={handleConfirmSetup}
          onCancel={() => setSetupProgram(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TODAY'S JEFF PROGRAM WORKOUT CARD
// ─────────────────────────────────────────────────────────────────
export function JeffProgramTodayCard({
  activeState,
  onMarkDayComplete,
}: {
  activeState: ActiveJeffProgramState;
  onMarkDayComplete: (date: string) => void;
}) {
  const program = findProgramById(activeState.programId);
  const currentWeekData = getProgramCurrentWeek(activeState);
  const todayKey = getProgramDateKey(new Date());
  const isCompletedToday = activeState.completedDays.includes(todayKey);

  if (!program || !currentWeekData) return null;

  const dayOfWeek = (new Date().getDay() + 6) % 7;
  const isTodayTrainingDay = activeState.scheduleDays.includes(dayOfWeek);

  if (!isTodayTrainingDay) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
        <p className="text-2xl mb-2">😴</p>
        <p className="font-black text-white">วันพักผ่อน</p>
        <p className="text-xs text-zinc-400 mt-1">
          {program.shortName} — วันฝึกถัดไป:{" "}
          {DAY_FULL_LABELS[activeState.scheduleDays.find((d) => d > dayOfWeek) ?? activeState.scheduleDays[0]]}
        </p>
      </div>
    );
  }

  const safeDayIndex = Math.max(0, Math.min(activeState.currentDayIndex, currentWeekData.days.length - 1));
  const todayWorkout = currentWeekData.days[safeDayIndex];

  return (
    <div className={`rounded-2xl border border-zinc-700 overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${program.color} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              {program.shortName} · สัปดาห์ {activeState.currentWeek}
            </p>
            <h3 className="text-lg font-black text-white mt-0.5">
              {todayWorkout.dayLabel}: {todayWorkout.focusLabel}
            </h3>
          </div>
          <span className="text-3xl">{program.emoji}</span>
        </div>
      </div>

      {/* Exercise list */}
      <div className="bg-zinc-900 divide-y divide-zinc-800">
        {todayWorkout.exercises.map((exercise, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white">{exercise.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                    {exercise.sets} sets × {exercise.reps}
                  </span>
                  {exercise.rpe && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                      RPE {exercise.rpe}
                    </span>
                  )}
                  {exercise.rest && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                      <Clock size={8} />
                      {exercise.rest}
                    </span>
                  )}
                  {exercise.warmupSets && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      +{exercise.warmupSets} warmup
                    </span>
                  )}
                </div>
                {exercise.notes && (
                  <p className="mt-1 text-[10px] text-zinc-500 italic">{exercise.notes}</p>
                )}
              </div>
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-black text-zinc-400">
                {i + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mark complete */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-4">
        {isCompletedToday ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-3">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-black text-emerald-300">ฝึกเสร็จแล้ววันนี้! 💪</span>
          </div>
        ) : (
          <button
            onClick={() => onMarkDayComplete(todayKey)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${program.color} py-3 text-sm font-black text-white shadow-lg active:scale-95 transition`}
          >
            <CheckCircle size={15} />
            บันทึกว่าฝึกเสร็จแล้ว
          </button>
        )}
      </div>
    </div>
  );
}
