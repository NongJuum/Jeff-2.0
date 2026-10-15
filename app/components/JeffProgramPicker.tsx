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
  getNextProgramTrainingDate,
  isJeffProgramComplete,
  resolveProgramDayForDate,
} from "../lib/jeffPrograms";
import { getOnboardingResult } from "./OnboardingWizard";
import { getUserProfile } from "../lib/assessment";
import type { AppLanguage } from "./OnboardingWizard";

const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getExerciseDisplayName(name: string, language: AppLanguage = "th"): string {
  if (language !== "th") return name;
  const replacements: [RegExp, string][] = [
    [/Bulgarian Split Squat/gi, "บัลแกเรียนสปลิตสควอต"],
    [/Romanian Deadlift/gi, "โรมาเนียนเดดลิฟต์"],
    [/Hanging Knee Raise/gi, "แฮงกิงนีเรส"],
    [/Chest Supported/gi, "เชสต์ซัพพอร์ตเต็ด"],
    [/Shoulder Press/gi, "โชลเดอร์เพรส"],
    [/Bench Press/gi, "เบนช์เพรส"],
    [/Incline/gi, "อินไคลน์"],
    [/Deadlift/gi, "เดดลิฟต์"],
    [/Squat/gi, "สควอต"],
    [/Dumbbell|\bDB\b/gi, "ดัมเบล"],
    [/Barbell/gi, "บาร์เบล"],
    [/Cable/gi, "เคเบิล"],
    [/Machine/gi, "แมชชีน"],
    [/Pulldown/gi, "พูลดาวน์"],
    [/Pull Up/gi, "พูลอัป"],
    [/Lat Raise/gi, "แลทเรส"],
    [/Lateral Raise/gi, "แลเทอรัลเรส"],
    [/Pec Deck/gi, "เพคเด็ค"],
    [/Leg Extension/gi, "เลกเอ็กซ์เทนชัน"],
    [/Hamstring Curl/gi, "แฮมสตริงเคิร์ล"],
    [/Tricep/gi, "ไตรเซปส์"],
    [/Bicep/gi, "ไบเซปส์"],
    [/Pushdown/gi, "พุชดาวน์"],
    [/Push-ups/gi, "พุชอัป"],
    [/Curl/gi, "เคิร์ล"],
    [/Row/gi, "โรว์"],
    [/Press/gi, "เพรส"],
    [/Flye|Fly/gi, "ฟลาย"],
    [/Raise/gi, "เรส"],
    [/Reverse/gi, "รีเวิร์ส"],
    [/Weighted/gi, "เวตเต็ด"],
    [/Bodyweight/gi, "บอดีเวต"],
    [/Full Body/gi, "ฟูลบอดี"],
  ];
  return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), name);
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

  const isDayCountValid = selectedDays.length === program.daysPerWeek;

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
  const currentWorkout = currentWeekData?.days[
    Math.max(0, Math.min(activeState.currentDayIndex, (currentWeekData?.days.length ?? 1) - 1))
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
                <p className="mt-1 text-xs text-zinc-400">{language === "th" ? "{language === "th" ? "ความคืบหน้าของโปรแกรมถูกบันทึกแล้ว" : "Program progress has been saved."}" : "Program progress has been saved."}</p>
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
// TODAY'S JEFF PROGRAM WORKOUT CARD
// ─────────────────────────────────────────────────────────────────
export function JeffProgramTodayCard({
  activeState,
  onMarkDayComplete,
  language = "th",
}: {
  activeState: ActiveJeffProgramState;
  onMarkDayComplete: (date: string) => void;
  language?: AppLanguage;
}) {
  const program = findProgramById(activeState.programId);
  const currentWeekData = getProgramCurrentWeek(activeState);
  const todayKey = getProgramDateKey(new Date());
  const scheduleStatus = resolveProgramDayForDate(activeState);
  const isCompletedToday = scheduleStatus.isCompleted;

  if (!program || !currentWeekData) return null;

  if (isJeffProgramComplete(activeState)) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <p className="text-2xl mb-2">🏆</p>
        <p className="font-black text-emerald-300">{language === "th" ? `ทำโปรแกรม ${program.shortName} ครบแล้ว` : `${program.shortName} completed`}</p>
        <p className="text-xs text-zinc-400 mt-1">{language === "th" ? "เลือกโปรแกรมใหม่ได้จากเมนูโปรแกรม" : "Choose another program from the Programs menu."}</p>
      </div>
    );
  }

  if (isCompletedToday) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-black text-emerald-300">{language === "th" ? "วันนี้ฝึกเสร็จแล้ว" : "Workout completed today"}</p>
        <p className="text-xs text-zinc-400 mt-1">{language === "th" ? `บันทึกความคืบหน้าของ ${program.shortName} เรียบร้อย` : `Progress for ${program.shortName} has been saved.`}</p>
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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
        <p className="text-2xl mb-2">😴</p>
        <p className="font-black text-white">{language === "th" ? "วันนี้เป็นวันพัก" : "Today is a rest day"}</p>
        <p className="text-xs text-zinc-400 mt-1">
          {program.shortName} — {language === "th" ? "วันฝึกถัดไป:" : "Next training day:"} {nextTrainingLabel ?? (language === "th" ? "ยังไม่ได้เลือกวันฝึก" : "No training day selected")}
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

      {/* Mark complete */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-4">
        {isCompletedToday ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-3">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-sm font-black text-emerald-300">{language === "th" ? "ฝึกเสร็จแล้ววันนี้! 💪" : "Workout completed today! 💪"}</span>
          </div>
        ) : (
          <button
            onClick={() => onMarkDayComplete(todayKey)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${program.color} py-3 text-sm font-black text-white shadow-lg active:scale-95 transition`}
          >
            <CheckCircle size={15} />
            {language === "th" ? "บันทึกว่าฝึกเสร็จแล้ว" : "Mark workout complete"}
          </button>
        )}
      </div>
    </div>
  );
}
