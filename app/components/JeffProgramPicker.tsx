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
  ArrowRightLeft,
  CalendarPlus,
  Undo2,
} from "lucide-react";
import {
  type JeffProgram,
  type ProgramRecommendation,
  type ActiveJeffProgramState,
  type RecoveryPlan,
  type RecoveryPlanSession,
  type ManualScheduleMove,
  type EligibleSessionOption,
  JEFF_PROGRAMS,
  recommendPrograms,
  getActiveJeffProgram,
  saveActiveJeffProgram,
  clearActiveJeffProgram,
  getProgramProgressArchive,
  findProgramById,
  getProgramCurrentWeek,
  getProgramScheduledDates,
  getProgramDateKey,
  getNextProgramTrainingDate,
  isJeffProgramComplete,
  resolveProgramDayForDate,
  buildRecoveryPlan,
  getValidMoveDates,
  getEligibleSessionsForDate,
  scheduleTodayOverride,
  detectWeeklyReview,
  completeWeeklyReview,
  detectUnresolvedMissedSessions,
  recoverSessionThisWeek,
  deferSessionToFutureWeek,
  skipAndDismissSession,
  decideRecoveryLater,
  getAvailableRecoverySlotsInWeek,
  getMondayOfWeek,
  validateRecoveryDestinationDate,
} from "../lib/jeffPrograms";
import { getOnboardingResult } from "./OnboardingWizard";
import { getUserProfile } from "../lib/assessment";
import type { AppLanguage } from "./OnboardingWizard";

const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getExerciseDisplayName(name: string, _language: AppLanguage = "th"): string {
  // Requirement: Exercise names must remain in English in Thai UI without altering canonical IDs
  return name;
}

const PROGRAM_THAI_COPY: Record<string, { description: string; focus: string; benefit: string; difficulty: string }> = {
  fundamentals_full_body: { description: "ฝึกกล้ามเนื้อทั่วร่างกาย 3 วันต่อสัปดาห์", focus: "พื้นฐานท่าหลักและเพิ่มกล้ามเนื้อทั่วร่างกาย", benefit: "สร้างพื้นฐานที่ดี ฝึกทักษะสม่ำเสมอ และเพิ่มปริมาณฝึกอย่างเป็นระบบ", difficulty: "เริ่มต้นถึงปานกลาง" },
  fundamentals_upper_lower: { description: "แบ่งวันฝึกช่วงบนและช่วงล่าง", focus: "เพิ่มกล้ามเนื้อด้วยการแบ่ง Upper/Lower", benefit: "กระจายปริมาณฝึกได้ดีและมีเวลาฟื้นตัวระหว่างกลุ่มกล้ามเนื้อ", difficulty: "ปานกลาง" },
  fundamentals_bodypart: { description: "แยกฝึกตามกลุ่มกล้ามเนื้อ", focus: "เน้นรายละเอียดและปริมาณฝึกของแต่ละกลุ่มกล้าม", benefit: "เหมาะกับผู้ที่ต้องการจัดปริมาณฝึกเป็นรายกลุ่มกล้ามเนื้อ", difficulty: "ปานกลางถึงสูง" },
  powerbuilding_30: { description: "ผสมการเพิ่มแรงกับการสร้างกล้ามเนื้อ", focus: "Squat, Bench Press, Deadlift และท่าเสริม", benefit: "พัฒนาความแข็งแรงควบคู่กับขนาดกล้ามเนื้อด้วยการแบ่งช่วงฝึก", difficulty: "สูง" },
  comeback_ppl: { description: "กลับมาฝึกหลังหยุดพัก ด้วย Push/Pull/Legs", focus: "ค่อย ๆ เพิ่มความหนักและปริมาณฝึกกลับสู่ระดับเดิม", benefit: "ช่วยกลับเข้าสู่กิจวัตรโดยไม่เริ่มด้วยความหนักเต็มทันที", difficulty: "ปานกลางถึงสูง" },
  comeback_upper_lower: { description: "โปรแกรมกลับมาฝึกแบบ Upper/Lower 4 วัน", focus: "ฟื้นจังหวะฝึกช่วงบนและช่วงล่าง", benefit: "เหมาะกับผู้ที่กลับมาฝึกและต้องการฝึก 4 วันต่อสัปดาห์", difficulty: "ปานกลาง" },
  essentials_3x: { description: "ท่าหลักที่จำเป็น ฝึก 3 วันต่อสัปดาห์", focus: "ท่าคุ้มค่า ครอบคลุมกล้ามเนื้อหลัก", benefit: "ประหยัดเวลาและรักษาความสม่ำเสมอได้ง่าย", difficulty: "เริ่มต้นถึงปานกลาง" },
  pure_bodybuilding_p2: { description: "โปรแกรมเพาะกายที่เน้นปริมาณและรายละเอียด", focus: "สร้างกล้ามเนื้อหลายกลุ่มด้วยการจัดปริมาณฝึกสูง", benefit: "เหมาะกับผู้มีพื้นฐานที่ต้องการเพิ่มรายละเอียดและปริมาณฝึก", difficulty: "สูง" },
  bb_transformation_beginner: { description: "ระบบเริ่มต้นสร้างพื้นฐานการเพาะกาย", focus: "เรียนรู้รูปแบบการเคลื่อนไหวและสร้างแรงพื้นฐาน", benefit: "มีโครงสร้างชัดเจนสำหรับเริ่มฝึกอย่างเป็นระบบ", difficulty: "เริ่มต้น" },
  bb_transformation_int_adv: { description: "ระบบสร้างกล้ามเนื้อสำหรับผู้มีประสบการณ์", focus: "พัฒนากล้ามเนื้อด้วยโปรแกรมที่ซับซ้อนขึ้น", benefit: "ต่อยอดจากพื้นฐานด้วยการวางแผนฝึกระดับกลางถึงสูง", difficulty: "สูง" },
  card_workout: { description: "ฝึกด้วยน้ำหนักตัวโดยไม่ต้องใช้อุปกรณ์มาก", focus: "ท่าพื้นฐานช่วงบน ช่วงล่าง และ Full Body", benefit: "ฝึกที่บ้านหรือพื้นที่จำกัดได้สะดวก", difficulty: "ปรับได้ตามระดับ" },
  muscle_ladder: { description: "เรียนรู้หลักการสร้างกล้ามเนื้อแบบเป็นขั้น", focus: "หลักการฝึกที่มีหลักฐานรองรับและการเพิ่มความก้าวหน้า", benefit: "ช่วยทำความเข้าใจการฝึกและนำหลักการไปปรับใช้ระยะยาว", difficulty: "ปานกลางถึงสูง" },
};

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
  all: "ทุกระดับ",
};
const LEVEL_LABELS_EN: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", all: "All levels" };
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
  language = "th",
}: {
  program: JeffProgram;
  recommendation?: ProgramRecommendation;
  onSelect: (p: JeffProgram) => void;
  isActive?: boolean;
  language?: AppLanguage;
}) {
  const [expanded, setExpanded] = useState(false);
  const thaiCopy = PROGRAM_THAI_COPY[program.id];

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
          {language === "th" ? "โปรแกรมที่ใช้อยู่" : "Active program"}
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
            <p className="mt-0.5 text-xs text-zinc-400">{language === "th" ? thaiCopy?.description ?? program.description : program.description}</p>
            <div className="mt-2 space-y-1 text-xs leading-relaxed text-zinc-400">
              <p><span className="font-bold text-zinc-200">{language === "th" ? "เน้น:" : "Focus:"}</span> {language === "th" ? thaiCopy?.focus ?? program.bestFor : program.goals.join(", ")}</p>
              <p className="line-clamp-2"><span className="font-bold text-zinc-200">{language === "th" ? "ช่วย:" : "Benefits:"}</span> {language === "th" ? thaiCopy?.benefit ?? program.bestFor : program.longDescription}</p>
              <p><span className="font-bold text-zinc-200">{language === "th" ? "ระดับความยาก:" : "Difficulty:"}</span> {language === "th" ? thaiCopy?.difficulty ?? "ปานกลาง" : program.level.map((l) => LEVEL_LABELS_EN[l]).join(" / ")}</p>
            </div>
          </div>
        </div>

        {/* Meta badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300">
            <Calendar size={10} />
            {language === "th" ? `${program.daysPerWeek} วัน/สัปดาห์` : `${program.daysPerWeek} days/week`}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300">
            <Clock size={10} />
            {language === "th" ? `${program.durationWeeks} สัปดาห์` : `${program.durationWeeks} weeks`}
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
              {language === "th" ? LEVEL_LABELS[l] : LEVEL_LABELS_EN[l]}
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
          {expanded ? (language === "th" ? "ซ่อนรายละเอียด" : "Hide details") : (language === "th" ? "ดูรายละเอียดเพิ่ม" : "More details")}
          <ChevronDown
            size={11}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2 text-xs text-zinc-400">
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{language === "th" ? "จุดเด่นของโปรแกรม" : "Highlights"}</p>
              {program.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-1.5 text-zinc-300">
                  <Sparkles size={9} className="text-yellow-400" />
                  {h}
                </div>
              ))}
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-bold uppercase text-emerald-500">✓ {language === "th" ? "เหมาะกับ:" : "Best for:"} </span>
              <span className="text-zinc-300">{language === "th" ? program.bestFor : `For ${program.level.map((l) => LEVEL_LABELS_EN[l]).join(" / ")} lifters targeting ${program.goals.join(", ")}.`}</span>
            </div>
            {program.notFor && (
              <div>
                <span className="text-[10px] font-bold uppercase text-red-500">✗ {language === "th" ? "ไม่เหมาะกับ:" : "Not for:"} </span>
                <span className="text-zinc-300">{language === "th" ? program.notFor : "May not suit lifters outside the intended experience level or without the required equipment."}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-500">{language === "th" ? "อุปกรณ์:" : "Equipment:"} </span>
              <span className="text-zinc-300">{EQUIPMENT_LABELS[program.equipment]}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-zinc-500">{language === "th" ? "เป้าหมาย:" : "Goal:"} </span>
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
              {language === "th" ? "กำลังใช้งานอยู่" : "Currently active"}
            </>
          ) : (
            <>
              <Play size={14} fill="white" />
              {language === "th" ? "เลือกโปรแกรมนี้" : "Choose this program"}
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
  language = "th",
}: {
  program: JeffProgram;
  onConfirm: (state: ActiveJeffProgramState) => void;
  onCancel: () => void;
  language?: AppLanguage;
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    const active = getActiveJeffProgram();
    const archive = getProgramProgressArchive();
    const existing = (active && active.programId === program.id) ? active : archive[program.id];
    if (existing?.scheduleDays && Array.isArray(existing.scheduleDays) && existing.scheduleDays.length > 0) {
      return existing.scheduleDays;
    }
    return program.defaultScheduleDays;
  });
  const [startDate, setStartDate] = useState(() => {
    const active = getActiveJeffProgram();
    const archive = getProgramProgressArchive();
    const existing = (active && active.programId === program.id) ? active : archive[program.id];
    if (existing?.startDate) return existing.startDate;
    const today = new Date();
    return getProgramDateKey(today);
  });

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const isDayCountValid = selectedDays.length === program.daysPerWeek;

  const handleConfirm = () => {
    const active = getActiveJeffProgram();
    const archive = getProgramProgressArchive();
    const existing = (active && active.programId === program.id) ? active : archive[program.id];

    const state: ActiveJeffProgramState = {
      programId: program.id,
      startDate: existing?.startDate || startDate,
      currentWeek: existing?.currentWeek ?? 1,
      currentDayIndex: existing?.currentDayIndex ?? 0,
      completedDays: existing?.completedDays ?? [],
      rescheduledSessions: existing?.rescheduledSessions,
      skippedDates: existing?.skippedDates,
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
                {language === "th" ? "ตั้งค่าโปรแกรม" : "Program setup"}
              </p>
              <h2 className="text-lg font-black text-white">{program.shortName}</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/80">
            {language === "th" ? `${program.daysPerWeek} วัน/สัปดาห์ · ${program.durationWeeks} สัปดาห์ · ${SPLIT_LABELS[program.split]}` : `${program.daysPerWeek} days/week · ${program.durationWeeks} weeks · ${program.split.replaceAll("_", " ")}`}
          </p>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Start date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 block">
              {language === "th" ? "วันเริ่มต้น" : "Start date"}
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
              {language === "th" ? "วันฝึก" : "Training days"}
            </label>
            <p className="text-[11px] text-zinc-500 mb-3">
              {language === "th" ? `เลือก ${program.daysPerWeek} วัน/สัปดาห์ — เลือกแล้ว ${selectedDays.length} วัน` : `Select ${program.daysPerWeek} days/week — ${selectedDays.length} selected`}
              {!isDayCountValid && (
                <span className="text-amber-400 ml-1">
                  ({language === "th" ? `ต้องเลือกให้ครบ ${program.daysPerWeek} วัน` : `Select exactly ${program.daysPerWeek} days`})
                </span>
              )}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {(language === "th" ? DAY_LABELS : DAY_LABELS_EN).map((label, idx) => (
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
                {language === "th" ? "ตารางฝึก 2 สัปดาห์แรก" : "First two weeks"}
              </label>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {nextDates.map((date) => {
                    // Parse date-only keys at local noon to avoid timezone-induced weekday shifts.
                    const d = new Date(`${date}T12:00:00`);
                    const dayIdx = (d.getDay() + 6) % 7;
                    return (
                      <div
                        key={date}
                        className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1"
                      >
                        <span className="text-[10px] font-bold text-yellow-400">
                          {(language === "th" ? DAY_FULL_LABELS : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])[dayIdx]}
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
              {language === "th" ? "ตัวอย่างสัปดาห์ที่ 1" : "Week 1 preview"}
            </label>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
              {program.weeks[0].days.map((day, i) => (
                <div key={i} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{day.dayLabel}: {day.focusLabel}</span>
                    <span className="text-[10px] text-zinc-500">{day.exercises.length} {language === "th" ? "ท่า" : "exercises"}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-zinc-500 truncate">
                    {day.exercises.slice(0, 3).map((e) => getExerciseDisplayName(e.name, language)).join(" · ")}...
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
            {language === "th" ? "ยกเลิก" : "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isDayCountValid || !startDate}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${program.color} py-3 text-sm font-black text-white shadow-lg active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-40`}
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
  language = "th",
}: {
  activeState: ActiveJeffProgramState;
  onNavigateToPrograms: () => void;
  onStopProgram: () => void;
  language?: AppLanguage;
}) {
  const program = findProgramById(activeState.programId);
  if (!program) return null;

  const currentWeekData = getProgramCurrentWeek(activeState);
  const scheduleStatus = resolveProgramDayForDate(activeState);
  const isTodayTrainingDay = scheduleStatus.isTrainingDay;
  const isCompletedToday = scheduleStatus.isCompleted;
  const isProgramComplete = isJeffProgramComplete(activeState);
  const nextTrainingDate = getNextProgramTrainingDate(activeState);
  const nextTrainingLabel = nextTrainingDate
    ? (() => {
        const nextDate = new Date(`${nextTrainingDate}T12:00:00`);
        const dayNames = language === "th" ? DAY_FULL_LABELS : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return `${dayNames[(nextDate.getDay() + 6) % 7]} ${nextDate.getDate()}/${nextDate.getMonth() + 1}`;
      })()
    : null;
  const targetDayIdx = scheduleStatus.scheduledDayIndex;
  const currentWorkout = currentWeekData?.days[
    Math.max(0, Math.min(targetDayIdx, (currentWeekData?.days.length ?? 1) - 1))
  ];

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
            {isProgramComplete ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-sm font-black text-emerald-300">{language === "th" ? "🎉 ทำโปรแกรมครบแล้ว" : "🎉 Program completed"}</p>
                <p className="mt-1 text-xs text-zinc-400">{language === "th" ? "เลือกโปรแกรมใหม่ได้ หรือทบทวนประวัติการฝึก" : "Choose another program or review your training history."}</p>
              </div>
            ) : isCompletedToday ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-sm font-black text-emerald-300">✅ {language === "th" ? "วันนี้ฝึกเสร็จแล้ว" : "Workout completed today"}</p>
                <p className="mt-1 text-xs text-zinc-400">{language === "th" ? "ความคืบหน้าของโปรแกรมถูกบันทึกแล้ว" : "Program progress has been saved."}</p>
              </div>
            ) : isTodayTrainingDay ? (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-3">
                <p className="text-[10px] font-bold uppercase text-yellow-400 mb-1">
                  {isCompletedToday ? (language === "th" ? "✅ วันนี้เสร็จแล้ว!" : "✅ Completed today") : (language === "th" ? "⚡ วันนี้มีฝึก!" : "⚡ Training day")}
                </p>
                {currentWorkout && (
                  <div className="text-xs text-zinc-300">
                    <span className="font-black">{currentWorkout.dayLabel}:</span> {currentWorkout.focusLabel}
                    <span className="text-zinc-500 ml-1">({currentWorkout.exercises.length} exercises)</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">
                🗓️ {language === "th" ? "วันพัก — วันฝึกถัดไป:" : "Rest day — next workout:"} {nextTrainingLabel ?? (language === "th" ? "ยังไม่ได้เลือกวันฝึก" : "No training day selected")}
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
  onProgramStopped,
  onClose,
  language = "th",
}: {
  onProgramActivated: (state: ActiveJeffProgramState) => void;
  onProgramStopped: () => void;
  onClose?: () => void;
  language?: AppLanguage;
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
    onProgramStopped();
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
            {language === "th" ? "โปรแกรมฝึก Jeff Nippard" : "Jeff Nippard Programs"}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {JEFF_PROGRAMS.length} {language === "th" ? "โปรแกรมให้เลือก" : "programs available"}
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
                <p className="text-[10px] font-bold uppercase text-yellow-400">{language === "th" ? "กำลังใช้งาน" : "Active program"}</p>
                <p className="text-sm font-black text-white">
                  {findProgramById(activeState.programId)?.shortName}
                </p>
                <p className="text-xs text-zinc-400">
                  {language === "th" ? `สัปดาห์ ${activeState.currentWeek} · ${activeState.completedDays.length} ครั้งที่ฝึก` : `Week ${activeState.currentWeek} · ${activeState.completedDays.length} sessions`} ✅
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmStop(true)}
              className="flex items-center gap-1 rounded-xl bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition"
            >
              <RotateCcw size={12} />
              {language === "th" ? "หยุด" : "Stop"}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Stop */}
      {confirmStop && (
        <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-4">
          <p className="text-sm font-bold text-red-300 mb-3">{language === "th" ? "⚠️ หยุดโปรแกรมปัจจุบัน?" : "⚠️ Stop the current program?"}</p>
          <p className="text-xs text-zinc-400 mb-3">{language === "th" ? "ประวัติการฝึกจะยังอยู่ แต่ความคืบหน้าโปรแกรมจะเริ่มใหม่" : "Workout history stays saved, but program progress will reset."}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmStop(false)}
              className="flex-1 rounded-xl bg-zinc-800 py-2 text-sm font-bold text-zinc-300 border border-zinc-700"
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </button>
            <button
              onClick={handleStopProgram}
              className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-black text-white"
            >
              {language === "th" ? "ยืนยันหยุด" : "Confirm stop"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "recommended", label: language === "th" ? "⭐ แนะนำ" : "⭐ Recommended" },
          { key: "all", label: language === "th" ? "ทั้งหมด" : "All" },
          { key: "beginner", label: language === "th" ? "🌱 มือใหม่" : "🌱 Beginner" },
          { key: "intermediate", label: language === "th" ? "💪 กลาง" : "💪 Intermediate" },
          { key: "advanced", label: language === "th" ? "🔥 ขั้นสูง" : "🔥 Advanced" },
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
            {language === "th" ? "แนะนำตามโปรไฟล์ของคุณ: ระดับ · เป้าหมาย · วันฝึก" : "Recommended for your profile: experience · goal · availability"}
          </p>
        </div>
      )}

      {/* Program list */}
      <div className="space-y-3">
        {filteredPrograms.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-500 text-sm">{language === "th" ? "ไม่พบโปรแกรม" : "No programs found"}</p>
          </div>
        ) : (
          filteredPrograms.map(({ program, recommendation }) => (
            <ProgramCard
              key={program.id}
              program={program}
              recommendation={recommendation}
              onSelect={handleSelectProgram}
              isActive={activeState?.programId === program.id}
              language={language}
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
          language={language}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SELECT TODAY WORKOUT MODAL
// ─────────────────────────────────────────────────────────────────
export function SelectTodayWorkoutModal({
  activeState,
  onSelectSession,
  onClose,
  language = "th",
}: {
  activeState: ActiveJeffProgramState;
  onSelectSession: (option: EligibleSessionOption) => void;
  onClose: () => void;
  language?: AppLanguage;
}) {
  const todayKey = getProgramDateKey(new Date());
  const options = getEligibleSessionsForDate(activeState, todayKey);
  const program = findProgramById(activeState.programId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/90 backdrop-blur-md sm:items-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${program?.color || "from-amber-600 to-yellow-600"} p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {language === "th" ? "เลือกเซสชันสำหรับวันนี้" : "Select Workout for Today"}
                </p>
                <h2 className="text-base font-black text-white">
                  {language === "th" ? "เลือกเซสชันที่ต้องการฝึก" : "Choose Session to Train"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-black/30 p-2 text-white/80 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="p-4 space-y-2.5 max-h-[65vh] overflow-y-auto">
          <p className="text-xs text-zinc-400">
            {language === "th"
              ? "คุณสามารถเลือกเซสชันที่ค้างชดเชย หรือเซสชันถัดไปในโปรแกรม เพื่อซ้อมในวันนี้ได้ทันที:"
              : "You can select a pending make-up session or the next program workout to train today:"}
          </p>

          {options.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center text-xs text-zinc-400">
              {language === "th" ? "ไม่มีเซสชันที่พร้อมให้เลือกฝึกในวันนี้" : "No eligible sessions available for today"}
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                disabled={opt.hasConflict}
                onClick={() => onSelectSession(opt)}
                className={`w-full text-left rounded-2xl border p-3.5 transition flex items-center justify-between gap-3 ${
                  opt.hasConflict
                    ? "border-zinc-800 bg-zinc-900/30 opacity-60 cursor-not-allowed"
                    : "border-zinc-700 bg-zinc-900 hover:border-yellow-400/50 hover:bg-zinc-850 active:scale-[0.99]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {opt.type === "missed_recovery" && (
                      <span className="inline-flex items-center rounded-md bg-amber-500/25 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                        ⚡ {language === "th" ? "ซ้อมชดเชย" : "Make-up"}
                      </span>
                    )}
                    {opt.type === "next_scheduled" && (
                      <span className="inline-flex items-center rounded-md bg-emerald-500/25 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300">
                        🎯 {language === "th" ? "เซสชันถัดไป" : "Next Up"}
                      </span>
                    )}
                    {opt.type === "current_week" && (
                      <span className="inline-flex items-center rounded-md bg-blue-500/25 border border-blue-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-blue-300">
                        📅 {language === "th" ? "ในสัปดาห์นี้" : "This Week"}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-zinc-400">
                      {language === "th" ? `สัปดาห์ ${opt.sourceWeek}` : `Week ${opt.sourceWeek}`}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white truncate">
                    {opt.dayLabel}: {opt.focusLabel}
                  </h4>
                  {opt.hasConflict && opt.conflictReason && (
                    <p className="text-[11px] text-amber-400 mt-1 font-medium">
                      ⚠️ {opt.conflictReason}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-800 text-zinc-300">
                  <ChevronRight size={16} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 transition"
          >
            {language === "th" ? "ปิด" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// THAI DATE & MUSCLE GROUP FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────────
export const THAI_WEEKDAYS = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
export const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function formatThaiDateLabel(date: Date = new Date(), language: AppLanguage = "th"): string {
  if (language === "en") {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  const dayName = THAI_WEEKDAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = THAI_MONTHS_SHORT[date.getMonth()];
  return `${dayName} · ${dayNum} ${monthName}`;
}

export const MUSCLE_REGION_THAI: Record<string, string> = {
  chest: "อกกลาง",
  upperChest: "อกบน",
  lowerChest: "อกล่าง",
  frontDelts: "ไหล่หน้า",
  sideDelts: "ไหล่ข้าง",
  rearDelts: "ไหล่หลัง",
  biceps: "หน้าแขน",
  triceps: "หลังแขน",
  tricepsLong: "หลังแขน",
  lats: "ปีก (Lats)",
  midBack: "กลางหลัง",
  upperBack: "หลังบน",
  erectors: "หลังล่าง",
  upperTraps: "หนอกคอ (Traps)",
  lowerTraps: "หลังกลางล่าง",
  abs: "หน้าท้อง",
  obliques: "สีข้าง",
  glutes: "ก้น",
  quads: "หน้าขา",
  hamstrings: "หลังขา",
  calves: "น่อง",
  Chest: "อกกลาง",
  "Upper chest": "อกบน",
  "Lower chest": "อกล่าง",
  "Front delts": "ไหล่หน้า",
  "Side delts": "ไหล่ข้าง",
  "Rear delts": "ไหล่หลัง",
  Biceps: "หน้าแขน",
  Triceps: "หลังแขน",
  Lats: "ปีก (Lats)",
  "Mid back": "กลางหลัง",
  "Upper back": "หลังบน",
  Erectors: "หลังล่าง",
  "Upper traps": "หนอกคอ (Traps)",
  Abs: "หน้าท้อง",
  Glutes: "ก้น",
  Quads: "หน้าขา",
  Hamstrings: "หลังขา",
  Calves: "น่อง",
};

export function formatMuscleChips(
  regions: (string | undefined)[],
  language: AppLanguage = "th"
): string[] {
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const r of regions) {
    if (!r) continue;
    const raw = String(r).trim();
    if (!raw) continue;
    const label = language === "th"
      ? (MUSCLE_REGION_THAI[raw] || raw)
      : (raw.charAt(0).toUpperCase() + raw.slice(1));
    if (!seen.has(label)) {
      seen.add(label);
      chips.push(label);
    }
  }
  return chips;
}

export function deriveTargetMusclesFromJeffWorkout(
  workout: { focusLabel?: string; exercises?: { name: string }[] }
): { primary: string[]; secondary: string[] } {
  const primarySet = new Set<string>();
  const secondarySet = new Set<string>();

  const focus = (workout.focusLabel || "").toLowerCase();

  if (focus.includes("chest") || focus.includes("push") || focus.includes("อก")) {
    primarySet.add("chest");
    if (focus.includes("upper") || focus.includes("incline")) primarySet.add("upperChest");
    secondarySet.add("frontDelts");
    secondarySet.add("triceps");
  }
  if (focus.includes("back") || focus.includes("pull") || focus.includes("หลัง")) {
    primarySet.add("lats");
    primarySet.add("midBack");
    secondarySet.add("biceps");
    secondarySet.add("rearDelts");
  }
  if (focus.includes("shoulder") || focus.includes("ไหล่")) {
    primarySet.add("sideDelts");
    secondarySet.add("frontDelts");
    secondarySet.add("rearDelts");
  }
  if (focus.includes("arm") || focus.includes("แขน")) {
    if (focus.includes("biceps") || !focus.includes("triceps")) primarySet.add("biceps");
    if (focus.includes("triceps") || !focus.includes("biceps")) primarySet.add("triceps");
  }
  if (focus.includes("leg") || focus.includes("lower") || focus.includes("ขา")) {
    if (focus.includes("quad") || focus.includes("หน้าขา")) {
      primarySet.add("quads");
      secondarySet.add("glutes");
      secondarySet.add("calves");
    } else if (focus.includes("hamstring") || focus.includes("glute") || focus.includes("หลังขา")) {
      primarySet.add("hamstrings");
      primarySet.add("glutes");
      secondarySet.add("calves");
    } else {
      primarySet.add("quads");
      primarySet.add("hamstrings");
      secondarySet.add("glutes");
      secondarySet.add("calves");
    }
  }
  if (focus.includes("full body") || focus.includes("total body")) {
    primarySet.add("chest");
    primarySet.add("lats");
    primarySet.add("quads");
    secondarySet.add("triceps");
    secondarySet.add("biceps");
  }

  if (workout.exercises) {
    for (const ex of workout.exercises) {
      const name = ex.name.toLowerCase();
      if (name.includes("incline")) {
        primarySet.add("upperChest");
        secondarySet.add("triceps");
      }
      if (name.includes("bench") || name.includes("chest press") || name.includes("flye") || name.includes("push-up") || (name.includes("chest") && name.includes("press"))) {
        if (!name.includes("incline")) primarySet.add("chest");
        secondarySet.add("triceps");
      } else if (name.includes("lat pulldown") || name.includes("pull-up") || name.includes("pulldown")) {
        primarySet.add("lats");
        secondarySet.add("biceps");
      } else if (name.includes("row")) {
        primarySet.add("midBack");
        primarySet.add("upperBack");
        secondarySet.add("biceps");
      } else if (name.includes("squat") || name.includes("leg press") || name.includes("leg extension")) {
        primarySet.add("quads");
        secondarySet.add("glutes");
      } else if (name.includes("deadlift") || name.includes("rdl") || name.includes("leg curl")) {
        primarySet.add("hamstrings");
        primarySet.add("glutes");
      } else if (name.includes("lateral raise")) {
        primarySet.add("sideDelts");
      } else if (name.includes("overhead press") || name.includes("shoulder press")) {
        primarySet.add("frontDelts");
        secondarySet.add("triceps");
      } else if (name.includes("curl") && !name.includes("leg curl")) {
        secondarySet.add("biceps");
      } else if (name.includes("triceps") || name.includes("pressdown") || name.includes("skull crusher")) {
        secondarySet.add("triceps");
      } else if (name.includes("calf")) {
        secondarySet.add("calves");
      }
    }
  }

  const primary = Array.from(primarySet);
  const secondary = Array.from(secondarySet).filter((s) => !primarySet.has(s));

  return { primary, secondary };
}

// ─────────────────────────────────────────────────────────────────
// TODAY'S JEFF PROGRAM WORKOUT CARD
// ─────────────────────────────────────────────────────────────────
export function JeffProgramTodayCard({
  activeState,
  onMarkDayComplete,
  onMoveSession,
  onCancelMove,
  onStartWorkout,
  onSelectTodaySession,
  onOpenRecovery,
  language = "th",
  muscleSummary,
}: {
  activeState: ActiveJeffProgramState;
  onMarkDayComplete: (date: string, completedDayIndex?: number) => void;
  onMoveSession?: (fromDate: string, toDate: string) => void;
  onCancelMove?: (moveId: string) => void;
  onStartWorkout?: () => void;
  onSelectTodaySession?: (session: EligibleSessionOption) => void;
  onOpenRecovery?: () => void;
  language?: AppLanguage;
  muscleSummary?: { primary: string[]; secondary: string[] } | null;
}) {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSelectTodayModal, setShowSelectTodayModal] = useState(false);
  const [isExerciseDetailsOpen, setIsExerciseDetailsOpen] = useState(false);
  const program = findProgramById(activeState.programId);
  const currentWeekData = getProgramCurrentWeek(activeState);
  const todayKey = getProgramDateKey(new Date());
  const scheduleStatus = resolveProgramDayForDate(activeState);
  const isCompletedToday = scheduleStatus.isCompleted;

  if (!program || !currentWeekData) return null;

  if (isJeffProgramComplete(activeState)) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
        <p className="text-3xl mb-1">🏆</p>
        <p className="font-black text-emerald-300 text-lg">
          {language === "th" ? `ทำโปรแกรม ${program.shortName} ครบแล้ว` : `${program.shortName} completed`}
        </p>
        <p className="text-xs text-zinc-400">
          {language === "th" ? "เลือกโปรแกรมใหม่ได้จากเมนูโปรแกรม" : "Choose another program from the Programs menu."}
        </p>
      </div>
    );
  }

  if (isCompletedToday) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
          <span>📅 {formatThaiDateLabel(new Date(), language)}</span>
        </div>
        <p className="text-3xl mb-1">✅</p>
        <h3 className="font-black text-emerald-300 text-lg">
          {language === "th" ? "วันนี้ฝึกเสร็จแล้ว" : "Workout completed today"}
        </h3>
        <p className="text-xs text-zinc-400">
          {language === "th" ? `บันทึกความคืบหน้าของ ${program.shortName} เรียบร้อย` : `Progress for ${program.shortName} has been saved.`}
        </p>
      </div>
    );
  }

  if (!scheduleStatus.isTrainingDay) {
    const nextTrainingDate = getNextProgramTrainingDate(activeState);
    const nextTrainingLabel = nextTrainingDate
      ? (() => {
          const nextDate = new Date(`${nextTrainingDate}T12:00:00`);
          const dayNames = language === "th" ? DAY_FULL_LABELS : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          return `${dayNames[(nextDate.getDay() + 6) % 7]} ${nextDate.getDate()}/${nextDate.getMonth() + 1}`;
        })()
      : null;
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
          <span>📅 {formatThaiDateLabel(new Date(), language)}</span>
        </div>
        <p className="text-3xl mb-1">😴</p>
        <h3 className="text-xl font-black text-white">
          {language === "th" ? "วันนี้เป็นวันพัก (Rest Day)" : "Today is a Rest Day"}
        </h3>
        <p className="text-xs text-zinc-400">
          {program.shortName} — {language === "th" ? "วันฝึกถัดไป:" : "Next training day:"} {nextTrainingLabel ?? (language === "th" ? "ยังไม่ได้เลือกวันฝึก" : "No training day selected")}
        </p>
        {scheduleStatus.manualMove && scheduleStatus.isManualMove && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300">
            <span>📌 {language === "th" ? `เซสชันเดิมถูกย้ายไปวันที่ ${scheduleStatus.manualMove.targetDateKey}` : `Original session moved to ${scheduleStatus.manualMove.targetDateKey}`}</span>
            {onCancelMove && (
              <button
                onClick={() => onCancelMove(scheduleStatus.manualMove!.id)}
                className="underline hover:text-white font-bold"
              >
                {language === "th" ? "ยกเลิกการย้าย" : "Undo move"}
              </button>
            )}
          </div>
        )}

        {scheduleStatus.pendingBacklogCount && scheduleStatus.pendingBacklogCount > 0 && onOpenRecovery && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenRecovery}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition"
            >
              <span>📌</span>
              <span>{language === "th" ? `มีเซสชันค้าง ${scheduleStatus.pendingBacklogCount} เซสชัน (จัดการชดเชย)` : `${scheduleStatus.pendingBacklogCount} incomplete sessions (manage)`}</span>
            </button>
          </div>
        )}

        {/* Action to choose session to train today */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowSelectTodayModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2.5 text-xs font-black text-yellow-300 hover:bg-yellow-400/20 transition active:scale-95"
          >
            ⚡ {language === "th" ? "เลือกซ้อมวันนี้ (Train Today)" : "Select Workout for Today"}
          </button>
        </div>

        {showSelectTodayModal && (
          <SelectTodayWorkoutModal
            activeState={activeState}
            onSelectSession={(opt) => {
              setShowSelectTodayModal(false);
              onSelectTodaySession?.(opt);
            }}
            onClose={() => setShowSelectTodayModal(false)}
            language={language}
          />
        )}
      </div>
    );
  }

  const safeDayIndex = Math.max(0, Math.min(scheduleStatus.scheduledDayIndex, currentWeekData.days.length - 1));
  const todayWorkout = currentWeekData.days[safeDayIndex];
  const dateLabel = formatThaiDateLabel(new Date(), language);

  // Target muscle groups resolution
  const rawTargetMuscles = muscleSummary && (muscleSummary.primary?.length > 0 || muscleSummary.secondary?.length > 0)
    ? muscleSummary
    : deriveTargetMusclesFromJeffWorkout(todayWorkout);

  const primaryChips = formatMuscleChips(rawTargetMuscles.primary || [], language);
  const secondaryChips = formatMuscleChips(rawTargetMuscles.secondary || [], language).filter(
    (chip) => !primaryChips.includes(chip)
  );

  const totalSets = todayWorkout.exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0);

  return (
    <div className="rounded-2xl border border-zinc-700/80 overflow-hidden shadow-xl bg-zinc-950">
      {/* Header */}
      <div className={`bg-gradient-to-r ${program.color} p-4 sm:p-5 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Date, Weekday, and Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2.5 py-0.5 text-xs font-bold text-white/95 backdrop-blur-sm">
                <span>📅</span>
                <span>{dateLabel}</span>
              </span>

              {scheduleStatus.isRescheduledMakeUp && (
                <span className="inline-flex items-center rounded-md bg-amber-500/30 border border-amber-400/50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">
                  ⚡ {language === "th" ? "ซ้อมชดเชย" : "Make-up"}
                </span>
              )}
              {scheduleStatus.isManualMove && (
                <span className="inline-flex items-center rounded-md bg-blue-500/30 border border-blue-400/50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-200">
                  📌 {language === "th" ? "ย้ายวันฝึกมา" : "Moved session"}
                </span>
              )}

              {scheduleStatus.pendingBacklogCount && scheduleStatus.pendingBacklogCount > 0 && onOpenRecovery && (
                <button
                  type="button"
                  onClick={onOpenRecovery}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30 transition backdrop-blur-sm"
                >
                  <span>📌</span>
                  <span>{language === "th" ? `ค้าง ${scheduleStatus.pendingBacklogCount} เซสชัน` : `${scheduleStatus.pendingBacklogCount} backlog`}</span>
                </button>
              )}

              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                {program.shortName} · {language === "th" ? `สัปดาห์ ${scheduleStatus.cycleNumber || activeState.currentWeek}` : `Week ${scheduleStatus.cycleNumber || activeState.currentWeek}`}
              </span>
            </div>

            {/* Resolved Workout Day & Focus */}
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {todayWorkout.dayLabel}: {todayWorkout.focusLabel}
            </h3>

            {/* Target Muscle Group Chips */}
            {(primaryChips.length > 0 || secondaryChips.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-bold text-white/75 mr-0.5">
                  {language === "th" ? "กล้ามเนื้อเป้าหมาย:" : "Target Muscles:"}
                </span>
                {primaryChips.map((muscle) => (
                  <span
                    key={`p-${muscle}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-yellow-400/50 bg-black/40 px-2.5 py-0.5 text-xs font-bold text-yellow-300 backdrop-blur-sm"
                  >
                    <span className="text-yellow-400 text-[9px]">●</span>
                    <span>{muscle}</span>
                    <span className="text-[9px] text-yellow-400/80 font-normal">
                      {language === "th" ? "(หลัก)" : "(Primary)"}
                    </span>
                  </span>
                ))}
                {secondaryChips.map((muscle) => (
                  <span
                    key={`s-${muscle}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/30 px-2 py-0.5 text-xs font-medium text-zinc-200 backdrop-blur-sm"
                  >
                    <span className="text-zinc-400 text-[9px]">○</span>
                    <span>{muscle}</span>
                    <span className="text-[9px] text-zinc-400 font-normal">
                      {language === "th" ? "(รอง)" : "(Secondary)"}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <span className="text-3xl shrink-0 drop-shadow-md">{program.emoji}</span>
        </div>
      </div>

      {/* Manual move banner if applicable */}
      {scheduleStatus.isManualMove && scheduleStatus.manualMove && (
        <div className="flex items-center justify-between bg-blue-950/40 border-b border-blue-500/30 px-4 py-2">
          <span className="text-xs text-blue-300 flex items-center gap-1.5">
            <ArrowRightLeft size={13} />
            {language === "th"
              ? `ย้ายมาจาก ${scheduleStatus.manualMove.originalDateKey}`
              : `Moved from ${scheduleStatus.manualMove.originalDateKey}`}
          </span>
          {onCancelMove && (
            <button
              onClick={() => onCancelMove(scheduleStatus.manualMove!.id)}
              className="text-xs text-blue-400 hover:text-white underline font-bold"
            >
              {language === "th" ? "ยกเลิกการย้าย" : "Undo move"}
            </button>
          )}
        </div>
      )}

      {/* Collapsible Exercise Details Toggle */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={() => setIsExerciseDetailsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 text-left group hover:opacity-90 transition py-1 focus:outline-none"
          aria-expanded={isExerciseDetailsOpen}
          aria-controls="today-exercise-details-list"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition flex items-center gap-1.5">
              <span>🏋️‍♂️</span>
              <span>{language === "th" ? `${todayWorkout.exercises.length} ท่าฝึก` : `${todayWorkout.exercises.length} Exercises`}</span>
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              ({totalSets} {language === "th" ? "เซตทั้งหมด" : "sets total"})
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 group-hover:text-yellow-300 transition shrink-0">
            <span>
              {isExerciseDetailsOpen
                ? (language === "th" ? "ซ่อนรายละเอียด" : "Hide details")
                : (language === "th" ? "ดูรายละเอียดท่าฝึก" : "View exercise details")}
            </span>
            <ChevronDown size={15} className={`transition-transform duration-200 ${isExerciseDetailsOpen ? "rotate-180" : ""}`} />
          </span>
        </button>
      </div>

      {/* Collapsible Exercise List */}
      {isExerciseDetailsOpen && (
        <div id="today-exercise-details-list" className="bg-zinc-900/90 divide-y divide-zinc-800/80 border-t border-zinc-800/80">
          {todayWorkout.exercises.map((exercise, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white">{getExerciseDisplayName(exercise.name, language)}</p>
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
      )}

      {/* Mark complete & Move Actions */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-4 space-y-2">
        {isCompletedToday ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-3">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-black text-emerald-300">{language === "th" ? "ฝึกเสร็จแล้ววันนี้! 💪" : "Workout completed today! 💪"}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              {onStartWorkout && (
                <button
                  type="button"
                  onClick={onStartWorkout}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 text-sm font-black text-black hover:bg-yellow-300 shadow-lg active:scale-95 transition"
                >
                  <Play size={15} className="fill-black" />
                  {language === "th" ? "เริ่มฝึกเซสชันนี้" : "Start Workout"}
                </button>
              )}
              <button
                onClick={() => onMarkDayComplete(todayKey, safeDayIndex)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${program.color} py-3 text-sm font-black text-white shadow-lg active:scale-95 transition`}
              >
                <CheckCircle size={15} />
                {language === "th" ? "บันทึกว่าฝึกเสร็จแล้ว" : "Mark complete"}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSelectTodayModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition"
              >
                <span>⚡ {language === "th" ? "สลับเซสชันวันนี้" : "Select Different Session"}</span>
              </button>
              {onMoveSession && (
                <button
                  onClick={() => setShowMoveModal(true)}
                  title={language === "th" ? "ย้ายเซสชันนี้ไปยังวันอื่น" : "Move workout to another date"}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition"
                >
                  <ArrowRightLeft size={13} className="text-yellow-400" />
                  <span>{language === "th" ? "ย้ายวัน" : "Move"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Select Today Workout Modal */}
      {showSelectTodayModal && (
        <SelectTodayWorkoutModal
          activeState={activeState}
          onSelectSession={(opt) => {
            setShowSelectTodayModal(false);
            onSelectTodaySession?.(opt);
          }}
          onClose={() => setShowSelectTodayModal(false)}
          language={language}
        />
      )}

      {/* Move Workout Modal */}
      {showMoveModal && onMoveSession && (
        <MoveWorkoutModal
          activeState={activeState}
          fromDateKey={todayKey}
          onConfirmMove={(from, to) => {
            onMoveSession(from, to);
            setShowMoveModal(false);
          }}
          onClose={() => setShowMoveModal(false)}
          language={language}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MISSED RECOVERY PROMPT BANNER
// ─────────────────────────────────────────────────────────────────
export function MissedRecoveryPrompt({
  activeState,
  onConfirmRecovery,
  onDeclineRecovery,
  onRecoverThisWeek,
  onDeferSession,
  onSkipSession,
  onDecideLater,
  forceOpen = false,
  onClose,
  language = "th",
}: {
  activeState: ActiveJeffProgramState;
  onConfirmRecovery: (plan: RecoveryPlan) => void;
  onDeclineRecovery: () => void;
  onRecoverThisWeek?: (sessionId: string, targetDateKey: string) => void;
  onDeferSession?: (sessionId: string) => void;
  onSkipSession?: (sessionId: string) => void;
  onDecideLater?: () => void;
  forceOpen?: boolean;
  onClose?: () => void;
  language?: AppLanguage;
}) {
  const todayKey = getProgramDateKey();
  if (!forceOpen) {
    if (activeState.lastPromptDismissedDateKey === todayKey) return null;
    if (activeState.recoveryPlan?.status === "declined") return null;
  }

  const unresolved = detectUnresolvedMissedSessions(activeState);
  const plan = activeState.recoveryPlan?.status === "awaiting_user_decision"
    ? activeState.recoveryPlan
    : buildRecoveryPlan(activeState);

  const displaySessions = plan?.sessions && plan.sessions.length > 0
    ? plan.sessions
    : unresolved;

  if (displaySessions.length === 0) return null;

  const availableSlotsThisWeek = getAvailableRecoverySlotsInWeek(activeState, getMondayOfWeek(new Date()));
  const firstSession = displaySessions[0];

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 shrink-0">
          <CalendarPlus size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-black text-amber-200">
              {language === "th"
                ? "คุณมีเซสชันฝึกที่ยังไม่ได้ทำ ต้องการจัดการชดเชยอย่างไร?"
                : "You have missed workout sessions. How would you like to recover them?"}
            </h4>
            {forceOpen && onClose && (
              <button onClick={onClose} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {language === "th"
              ? `ตรวจพบ ${displaySessions.length} เซสชันที่ค้างอยู่ คุณสามารถเลือกชดเชยในวันพักสัปดาห์นี้ เลื่อนไปสัปดาห์ถัดไป หรือข้ามโดยรักษาตารางเดิม`
              : `Detected ${displaySessions.length} missed session(s). You can recover them on a rest day this week, defer them, or skip them.`}
          </p>

          {/* List proposed sessions */}
          <div className="mt-3 space-y-1.5 rounded-xl bg-zinc-950/60 p-2.5 border border-zinc-800">
            {displaySessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">
                  {s.dayLabel}: {s.focusLabel}
                </span>
                <span className="text-amber-400 font-mono text-[11px]">
                  📅 {s.targetDateKey ? `ชดเชย: ${s.targetDateKey}` : `พลาดเมื่อ: ${s.originalDateKey}`}
                </span>
              </div>
            ))}
          </div>

          {/* Decision Buttons */}
          <div className="mt-4 space-y-2">
            {availableSlotsThisWeek.length > 0 && onRecoverThisWeek ? (
              <button
                type="button"
                onClick={() => onRecoverThisWeek(firstSession.id, availableSlotsThisWeek[0])}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-black text-black shadow-lg transition active:scale-95"
              >
                {language === "th"
                  ? `⚡ ชดเชยในวันพักสัปดาห์นี้ (${availableSlotsThisWeek[0]})`
                  : `⚡ Recover on rest day (${availableSlotsThisWeek[0]})`}
              </button>
            ) : plan ? (
              <button
                type="button"
                onClick={() => onConfirmRecovery(plan)}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-black text-black shadow-lg transition active:scale-95"
              >
                {language === "th" ? "⚡ ยืนยันแทรกโปรแกรมที่พลาดตามแผน" : "⚡ Confirm & insert missed sessions"}
              </button>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onDeferSession) {
                    onDeferSession(firstSession.id);
                  } else {
                    onDeclineRecovery();
                  }
                }}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/80 px-3 py-2 text-xs font-bold text-zinc-200 transition"
              >
                {language === "th" ? "เลื่อนไปสัปดาห์ถัดไป" : "Defer to next week"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSkipSession) {
                    onSkipSession(firstSession.id);
                  } else {
                    onDeclineRecovery();
                  }
                }}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/80 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition"
              >
                {language === "th" ? "ข้ามเซสชัน (รักษาตารางเดิม)" : "Skip (keep schedule)"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onDecideLater) {
                  onDecideLater();
                } else if (onClose) {
                  onClose();
                }
              }}
              className="w-full text-center py-1 text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              {language === "th" ? "ตัดสินใจภายหลัง" : "Decide later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WEEKLY REVIEW MODAL
// ─────────────────────────────────────────────────────────────────
export function WeeklyReviewModal({
  activeState,
  onCompleteReview,
  onClose,
  language = "th",
}: {
  activeState: ActiveJeffProgramState;
  onCompleteReview: (
    weekNumber: number,
    decision: "recover_this_week" | "defer" | "skip" | "decide_later",
    assignments?: Record<string, string>
  ) => void;
  onClose: () => void;
  language?: AppLanguage;
}) {
  const reviewData = detectWeeklyReview(activeState);
  if (!reviewData) return null;

  const [selectedSlot, setSelectedSlot] = useState<string>(
    reviewData.availableSlotsInCurrentWeek[0] || ""
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-zinc-950 p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-200">
                {language === "th"
                  ? `สรุปผลการฝึกสัปดาห์ที่ ${reviewData.previousWeekNumber}`
                  : `Week ${reviewData.previousWeekNumber} Training Review`}
              </h3>
              <p className="text-xs text-zinc-400">
                {language === "th"
                  ? `ฝึกสำเร็จ ${reviewData.completedCount} จาก ${reviewData.totalScheduled} เซสชัน (ค้าง ${reviewData.unresolvedSessions.length} เซสชัน)`
                  : `Completed ${reviewData.completedCount} of ${reviewData.totalScheduled} sessions (${reviewData.unresolvedSessions.length} unresolved)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Incomplete Sessions List */}
        <div className="space-y-2 rounded-xl bg-zinc-900/80 p-3 border border-zinc-800">
          <p className="text-xs font-bold text-zinc-300">
            {language === "th" ? "เซสชันที่ยังค้างอยู่:" : "Incomplete Sessions:"}
          </p>
          {reviewData.unresolvedSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/60 last:border-0">
              <div>
                <span className="font-bold text-amber-300">{s.dayLabel}: </span>
                <span className="text-zinc-200">{s.focusLabel}</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">📅 {s.originalDateKey}</span>
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="space-y-2 pt-1">
          {reviewData.availableSlotsInCurrentWeek.length > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
              <p className="text-xs font-bold text-amber-300">
                {language === "th" ? "⚡ ชดเชยในวันพักสัปดาห์นี้:" : "⚡ Recover on Rest Day this Week:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reviewData.availableSlotsInCurrentWeek.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                      selectedSlot === slot
                        ? "bg-amber-500 text-black shadow-md"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    📅 {slot}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const assignments: Record<string, string> = {};
                  reviewData.unresolvedSessions.forEach((s) => {
                    assignments[s.id] = selectedSlot;
                  });
                  onCompleteReview(reviewData.previousWeekNumber, "recover_this_week", assignments);
                }}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-black text-black shadow-lg transition active:scale-95"
              >
                {language === "th" ? `ยืนยันชดเชยในวันที่ ${selectedSlot}` : `Confirm Recovery on ${selectedSlot}`}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onCompleteReview(reviewData.previousWeekNumber, "defer")}
              className="rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 transition"
            >
              {language === "th" ? "เลื่อนไปสัปดาห์ถัดไป" : "Defer to Next Week"}
            </button>
            <button
              type="button"
              onClick={() => onCompleteReview(reviewData.previousWeekNumber, "skip")}
              className="rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition"
            >
              {language === "th" ? "ข้ามเซสชันและรักษาตารางเดิม" : "Skip & Keep Schedule"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onCompleteReview(reviewData.previousWeekNumber, "decide_later")}
            className="w-full text-center py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            {language === "th" ? "ตัดสินใจภายหลัง" : "Decide Later"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MOVE WORKOUT MODAL
// ─────────────────────────────────────────────────────────────────
export function MoveWorkoutModal({
  activeState,
  fromDateKey,
  onConfirmMove,
  onClose,
  language = "th",
}: {
  activeState: ActiveJeffProgramState;
  fromDateKey: string;
  onConfirmMove: (fromDate: string, toDate: string) => void;
  onClose: () => void;
  language?: AppLanguage;
}) {
  const candidateDates = getValidMoveDates(activeState, fromDateKey, 21);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedCandidate = candidateDates.find((c) => c.dateKey === selectedDate);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/90 backdrop-blur-md sm:items-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-yellow-400" />
            <h3 className="text-base font-black text-white">
              {language === "th" ? "ย้ายวันฝึกของเซสชันนี้" : "Move workout session"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 transition">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          {language === "th"
            ? `เลือกวันที่ต้องการย้ายเซสชันจาก ${fromDateKey} โดยไม่กระทบลำดับโปรแกรมหลัก และไม่นับว่าฝึกเสร็จล่วงหน้า`
            : `Select a new date to move this session from ${fromDateKey} without affecting program sequence.`}
        </p>

        {/* Date options */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {candidateDates.map((item) => {
            const isSelected = selectedDate === item.dateKey;
            return (
              <button
                key={item.dateKey}
                disabled={!item.canMove}
                onClick={() => setSelectedDate(item.dateKey)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition ${
                  isSelected
                    ? "bg-yellow-400 text-black font-black"
                    : item.canMove
                    ? "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                    : "bg-zinc-900/40 text-zinc-500 cursor-not-allowed border border-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>📅 {item.dateKey}</span>
                  {item.isRestDay && (
                    <span className="text-[10px] rounded px-1.5 py-0.5 bg-zinc-800 text-zinc-400">
                      {language === "th" ? "วันพัก" : "Rest day"}
                    </span>
                  )}
                  {item.isScheduledTrainingDay && (
                    <span className="text-[10px] rounded px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      {language === "th" ? "วันฝึกตามตาราง" : "Scheduled"}
                    </span>
                  )}
                </div>
                {item.hasConflict ? (
                  <span className="text-[10px] text-rose-400 font-bold">{item.conflictReason}</span>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400">
                    {language === "th" ? "เลือกได้" : "Available"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedCandidate && selectedCandidate.isRestDay && (
          <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
            ⚠️ {language === "th" ? "คุณเลือกย้ายมาในวันพักเดิม ระบบจะตั้งให้วันนี้เป็นวันฝึกพิเศษสำหรับเซสชันนี้" : "You selected a rest day. It will become a training day for this session."}
          </p>
        )}

        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-bold text-zinc-300 transition"
          >
            {language === "th" ? "ยกเลิก" : "Cancel"}
          </button>
          <button
            disabled={!selectedDate || !selectedCandidate?.canMove}
            onClick={() => {
              if (selectedDate) {
                onConfirmMove(fromDateKey, selectedDate);
                onClose();
              }
            }}
            className="flex-1 rounded-xl bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 py-2.5 text-xs font-black text-black shadow-lg transition active:scale-95"
          >
            {language === "th" ? "ยืนยันย้ายวันฝึก" : "Confirm Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
