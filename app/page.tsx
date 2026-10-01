"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Cog,
  Download,
  Dumbbell,
  Edit3,
  Flame,
  Home,
  Info,
  Library,
  MinusCircle,
  MoreVertical,
  Pause,
  Play,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Scale,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  User,
  X,
} from "lucide-react";
import { OnboardingWizard, hasCompletedOnboarding } from "./components/OnboardingWizard";
import { PlanBuilder } from "./components/PlanBuilder";
import { MuscleTapPicker } from "./components/MuscleTapPicker";
import { MuscleTapBuilder } from "./components/MuscleTapBuilder";
import { ProfileModal } from "./components/ProfileModal";
import { ProgressPhotos } from "./components/ProgressPhotos";
import { runMigration, hasMigrated, getMigrationResult, type MigrationResult } from "./lib/migration";
import { WeeklyTrendChart, type WeeklyScore } from "./components/WeeklyTrendChart";
import { AppleActivityRing } from "./components/AppleActivityRing";
import { CardioController } from "./components/CardioController";
import { BodyweightManager, getCurrentBodyweight, type BodyweightEntry } from "./components/BodyweightManager";
import { NotificationSettings } from "./components/NotificationSettings";
import { startNotificationScheduler } from "./lib/notifications";
import {
  type WeightUnit,
  resolveEffectiveUnit,
  getSnapStep,
  snapWeight,
  convertWeight,
  convertAndSnapWeight,
  MACHINE_UNITS_KEY,
  EXERCISE_UNITS_KEY,
  getMachineUnitsMap,
  saveMachineUnit,
  getExerciseUnitsMap,
  saveExerciseUnit,
} from "./lib/units";
import { TrainerAssessment } from "./components/TrainerAssessment";
import {
  type UserProfile,
  type Gender,
  getUserProfile,
  saveUserProfile,
  USER_PROFILE_KEY,
  calculatePrescriptionWeight,
  INJURY_RULES,
  evaluateMuscleMass,
  getIntelligentWarmup,
  type WarmupRecommendation,
} from "./lib/assessment";

type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Abs & Calves";
type AppMode = "dashboard" | "today" | "preset" | "custom" | "history" | "library";

type LoadType = "barbell" | "dumbbell" | "selectorized" | "plate-loaded" | "smith" | "cable" | "bodyweight" | "specialty";

type Exercise = { name: string; group: MuscleGroup; movement: string; muscles: string[]; tier: "S+" | "S" | "A+" | "A"; load: LoadType };
type PlanExercise = { id: string; name: string; group: MuscleGroup; sets: number; reps: string; warmup: boolean; muscles: string[]; movement: string; load: LoadType };

type DayPlan = {
  id: string;
  title: string;
  subtitle: string;
  focus: MuscleGroup[];
  exercises: PlanExercise[];
};

type CustomPlan = {
  id: string;
  name: string;
  days: DayPlan[];
};

type SetInput = {
  weightLbs: string;
  reps: string;
  done: boolean;
};

type RestTimerState = {
  exerciseId: string | null;
  exerciseName?: string;
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
  targetEndTimestamp?: number;
};

type RestMode = "short" | "normal" | "heavy";

export type LogSet = {
  exerciseId: string;
  exerciseName: string;
  weightLbs: number;
  reps: number;
  setNumber: number;
  date: string;
  machine?: string;
  unit?: WeightUnit;
  rawValue?: number;
};

export type ExerciseRecords = {
  maxWeight?: LogSet;
  bestReps?: LogSet;
  bestVolume?: LogSet;
};


type PersistedUiState = {
  mode: AppMode;
  days: 3 | 4 | 5;
  selectedDay: number;
  fiveDayMode: "twoLegDays" | "oneLegDay";
  showHistory: boolean;
  showLibrary: boolean;
  scrollY: number;
  selectedCustomPlanId: string | null;
  selectedCustomDay: number;
  sessionStage?: "lifting" | "cardio";
  activeExerciseIndex?: number;
};

const UI_STATE_KEY = "haitUiStateV5";
const SET_INPUTS_KEY = "haitSetInputsV5";
const CUSTOM_PLANS_KEY = "haitCustomPlansV2";
const SUBSTITUTE_KEY = "haitSubstitutionsV1";
const LATEST_LOGS_KEY = "trainingLatestV2";
const REST_TIMER_KEY = "haitRestTimerV1";
const PERMANENT_RECORDS_KEY = "haitPermanentRecordsV1";
const LEGACY_STATS_KEY = "trainingStatsV2";
const MACHINE_TAGS_KEY = "haitMachineTagsV1";
const FAVORITE_MACHINES_KEY = "haitFavoriteMachinesV1";
const PRESET_SETS_KEY = "haitPresetSetsV1";
const WEEK_STREAK_KEY = "haitWeekStreak";
const BODYWEIGHT_LOGS_KEY = "haitBodyweightLogsV1";
const CURRENT_BODYWEIGHT_KEY = "haitCurrentBodyweightKg";
const WEEKLY_SCORES_KEY = "haitWeeklyScoresV1";
const CARDIO_LOGS_KEY = "haitCardioLogsV1";
const ACTIVE_SESSION_KEY = "haitActiveSessionV1";
const WEEKLY_SCHEDULE_KEY = "haitWeeklyScheduleV1";

export type WeeklySchedule = {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
};

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  mon: true,
  tue: true,
  wed: false,
  thu: true,
  fri: true,
  sat: true,
  sun: false,
};

export type CardioLog = {
  id: string;
  date: string;
  type: "treadmill" | "incline_walk" | "rower" | "bike" | "outdoor";
  durationMin: number;
  distanceKm?: number;
  paceOrSpeed?: string; // e.g. "9.5 km/h" or "5:30 min/km"
  inclinePercent?: number;
  avgHr?: number;
  rpe?: number;
  notes?: string;
};

type BodyweightLog = {
  date: string;
  weightKg: number;
};

type WeeklyTrendPoint = {
  label: string;
  score: number;
  dateRange: string;
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded or private mode */ }
}

function getLocalDateKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEffectiveExerciseKey(exerciseName: string, machineTag?: string) {
  const trimmed = (machineTag ?? "").trim();
  return trimmed ? `${exerciseName} [${trimmed}]` : exerciseName;
}

function updateRecordsWithSet(records: Record<string, ExerciseRecords>, log: LogSet): Record<string, ExerciseRecords> {
  if (!log || !log.exerciseName || !Number.isFinite(log.weightLbs) || !Number.isFinite(log.reps) || log.weightLbs <= 0 || log.reps <= 0) {
    return records;
  }
  const key = getEffectiveExerciseKey(log.exerciseName, log.machine);
  const current = records[key] ?? {};
  const currentMax = current.maxWeight;
  const currentReps = current.bestReps;
  const currentVol = current.bestVolume;

  const logVolScore = log.weightLbs * log.reps;
  const bestVolScore = currentVol ? currentVol.weightLbs * currentVol.reps : -1;

  // Max weight is PERMANENT: only updated if greater, never decreased
  const newMax =
    !currentMax ||
    log.weightLbs > currentMax.weightLbs ||
    (log.weightLbs === currentMax.weightLbs && log.reps > currentMax.reps)
      ? log
      : currentMax;

  const newReps =
    !currentReps ||
    log.reps > currentReps.reps ||
    (log.reps === currentReps.reps && log.weightLbs > currentReps.weightLbs)
      ? log
      : currentReps;

  const newVol =
    !currentVol ||
    logVolScore > bestVolScore ||
    (logVolScore === bestVolScore && log.weightLbs > currentVol.weightLbs)
      ? log
      : currentVol;

  const next: Record<string, ExerciseRecords> = {
    ...records,
    [key]: {
      maxWeight: newMax,
      bestReps: newReps,
      bestVolume: newVol,
    },
  };

  // If machine was specified, also update base exercise record if it sets a higher overall max
  if (log.machine && key !== log.exerciseName) {
    const baseCurrent = records[log.exerciseName] ?? {};
    const baseMax = baseCurrent.maxWeight;
    const baseReps = baseCurrent.bestReps;
    const baseVol = baseCurrent.bestVolume;
    const baseVolScore = baseVol ? baseVol.weightLbs * baseVol.reps : -1;

    next[log.exerciseName] = {
      maxWeight: !baseMax || log.weightLbs > baseMax.weightLbs || (log.weightLbs === baseMax.weightLbs && log.reps > baseMax.reps) ? log : baseMax,
      bestReps: !baseReps || log.reps > baseReps.reps || (log.reps === baseReps.reps && log.weightLbs > baseReps.weightLbs) ? log : baseReps,
      bestVolume: !baseVol || logVolScore > baseVolScore || (logVolScore === baseVolScore && log.weightLbs > baseVol.weightLbs) ? log : baseVol,
    };
  }

  return next;
}

function checkIsPr(
  records: Record<string, ExerciseRecords>,
  log: LogSet
): { isPr: boolean; type: "weight" | "reps" | "volume"; oldVal: string; newVal: string } | null {
  if (!log || !log.exerciseName || !Number.isFinite(log.weightLbs) || !Number.isFinite(log.reps) || log.weightLbs <= 0 || log.reps <= 0) {
    return null;
  }
  const key = getEffectiveExerciseKey(log.exerciseName, log.machine);
  const current = records[key];
  if (!current || !current.maxWeight) {
    return null;
  }

  // 1. Max Weight PR
  if (log.weightLbs > current.maxWeight.weightLbs) {
    const oldKg = Math.round(current.maxWeight.weightLbs * 0.453592 * 10) / 10;
    const newKg = Math.round(log.weightLbs * 0.453592 * 10) / 10;
    return {
      isPr: true,
      type: "weight",
      oldVal: `${oldKg} kg (${current.maxWeight.weightLbs} lbs) × ${current.maxWeight.reps} reps`,
      newVal: `${newKg} kg (${log.weightLbs} lbs) × ${log.reps} reps`,
    };
  }

  // 2. Best Reps PR
  if (current.bestReps && log.weightLbs >= current.bestReps.weightLbs && log.reps > current.bestReps.reps) {
    const oldKg = Math.round(current.bestReps.weightLbs * 0.453592 * 10) / 10;
    const newKg = Math.round(log.weightLbs * 0.453592 * 10) / 10;
    return {
      isPr: true,
      type: "reps",
      oldVal: `${oldKg} kg × ${current.bestReps.reps} reps`,
      newVal: `${newKg} kg × ${log.reps} reps`,
    };
  }

  // 3. Best Volume PR
  const logVol = log.weightLbs * log.reps;
  const bestVol = current.bestVolume ? current.bestVolume.weightLbs * current.bestVolume.reps : 0;
  if (bestVol > 0 && logVol > bestVol * 1.05) {
    return {
      isPr: true,
      type: "volume",
      oldVal: `${Math.round(bestVol * 0.453592)} kg total volume`,
      newVal: `${Math.round(logVol * 0.453592)} kg total volume`,
    };
  }

  return null;
}

function loadPermanentRecords(): Record<string, ExerciseRecords> {
  if (typeof window === "undefined") return {};

  let result = readJson<Record<string, ExerciseRecords>>(PERMANENT_RECORDS_KEY, {});

  // 1. Recover legacy stats if available
  const legacyStats = readJson<Record<string, ExerciseRecords>>(LEGACY_STATS_KEY, {});
  if (legacyStats && typeof legacyStats === "object") {
    for (const rec of Object.values(legacyStats)) {
      if (rec?.maxWeight) result = updateRecordsWithSet(result, rec.maxWeight);
      if (rec?.bestReps) result = updateRecordsWithSet(result, rec.bestReps);
      if (rec?.bestVolume) result = updateRecordsWithSet(result, rec.bestVolume);
    }
  }

  // 2. Scan current logs
  const latestLogs = readJson<LogSet[]>(LATEST_LOGS_KEY, []);
  if (Array.isArray(latestLogs)) {
    for (const log of latestLogs) {
      result = updateRecordsWithSet(result, log);
    }
  }

  // 3. Scan legacy training logs if any exist
  const legacyLogs = readJson<LogSet[]>("trainingLogsV2", []);
  if (Array.isArray(legacyLogs)) {
    for (const log of legacyLogs) {
      result = updateRecordsWithSet(result, log);
    }
  }

  // 4. Sanitize records where weightLbs appears inflated (>600) due to double conversion
  for (const key of Object.keys(result)) {
    const rec = result[key];
    if (rec?.maxWeight && rec.maxWeight.weightLbs > 600 && rec.maxWeight.rawValue !== undefined && rec.maxWeight.unit === "kg") {
      rec.maxWeight.weightLbs = convertWeight(rec.maxWeight.rawValue, "kg", "lbs");
    }
    if (rec?.bestReps && rec.bestReps.weightLbs > 600 && rec.bestReps.rawValue !== undefined && rec.bestReps.unit === "kg") {
      rec.bestReps.weightLbs = convertWeight(rec.bestReps.rawValue, "kg", "lbs");
    }
    if (rec?.bestVolume && rec.bestVolume.weightLbs > 600 && rec.bestVolume.rawValue !== undefined && rec.bestVolume.unit === "kg") {
      rec.bestVolume.weightLbs = convertWeight(rec.bestVolume.rawValue, "kg", "lbs");
    }
  }

  return result;
}

function playRestDoneChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // First chime note (F#5 - 739.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(739.99, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // Second harmonious higher note (B5 - 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.16);
    gain2.gain.setValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.65);
  } catch {
    // AudioContext blocked or user hasn't interacted yet
  }
}

function notifyRestDone(exerciseName?: string) {
  playRestDoneChime();
  if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {}
  }
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("⏰ Rest Finished!", {
        body: exerciseName ? `Time for your next set of ${exerciseName}!` : "Time for your next set!",
        icon: "/icon-192.png",
      });
    } catch {}
  }
}

function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

const exerciseLibrary: Exercise[] = [
  // CHEST
  { name: "Bench Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A", load: "barbell" },
  { name: "Incline Barbell Bench Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "A", load: "barbell" },
  { name: "Decline Bench Press", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A", load: "barbell" },
  { name: "Flat DB Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A", load: "dumbbell" },
  { name: "Incline DB Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+", load: "dumbbell" },
  { name: "DB Flye", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "A", load: "dumbbell" },
  { name: "Machine Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+", load: "selectorized" },
  { name: "Pin-Loaded Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+", load: "selectorized" },
  { name: "Plate-Loaded Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+", load: "plate-loaded" },
  { name: "Converging Cable Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+", load: "cable" },
  { name: "Incline Converging Chest Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+", load: "cable" },
  { name: "Incline Machine Bench", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+", load: "selectorized" },
  { name: "Decline Machine Press", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A+", load: "selectorized" },
  { name: "Iso-Lateral Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+", load: "plate-loaded" },
  { name: "Iso-Lateral Incline Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+", load: "plate-loaded" },
  { name: "Smith Machine Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A", load: "smith" },
  { name: "Incline Smith Machine Bench", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "A", load: "smith" },
  { name: "Smith Machine Floor Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Triceps", "Front delts"], tier: "A", load: "smith" },
  { name: "Pec Deck", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "S", load: "selectorized" },
  { name: "Seated Cable Pec Flye", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "S", load: "cable" },
  { name: "Cable Crossover", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "A", load: "cable" },
  { name: "Low-to-High Cable Flye", group: "Chest", movement: "chest flye", muscles: ["Upper chest"], tier: "A", load: "cable" },
  { name: "High-to-Low Cable Flye", group: "Chest", movement: "chest flye", muscles: ["Lower chest"], tier: "A", load: "cable" },
  { name: "Weighted Dip", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A", load: "bodyweight" },
  // BACK
  { name: "Chest Supported Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S+", load: "dumbbell" },
  { name: "Seal Row", group: "Back", movement: "row", muscles: ["Mid back", "Rear delts"], tier: "S", load: "barbell" },
  { name: "Machine High Row", group: "Back", movement: "row", muscles: ["Upper back", "Lats", "Rear delts"], tier: "S", load: "plate-loaded" },
  { name: "Chest Supported T-Bar Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "S", load: "plate-loaded" },
  { name: "Iso-Lateral Low Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "S", load: "plate-loaded" },
  { name: "Cable Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S", load: "cable" },
  { name: "Wide Grip Cable Row", group: "Back", movement: "row", muscles: ["Upper back", "Rear delts"], tier: "A", load: "cable" },
  { name: "Barbell Bent-Over Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Erectors"], tier: "A", load: "barbell" },
  { name: "Deficit Pendlay Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Erectors"], tier: "A", load: "barbell" },
  { name: "Meadows Row", group: "Back", movement: "row", muscles: ["Lats", "Upper back"], tier: "A", load: "barbell" },
  { name: "One Arm DB Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "A", load: "dumbbell" },
  { name: "Kroc Row", group: "Back", movement: "row", muscles: ["Upper back", "Lats", "Grip"], tier: "A", load: "dumbbell" },
  { name: "Neutral Grip Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S", load: "selectorized" },
  { name: "Iso-Lateral Pulldown", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S", load: "plate-loaded" },
  { name: "Widegrip Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "A", load: "selectorized" },
  { name: "One Arm Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats"], tier: "A", load: "cable" },
  { name: "Weighted Pull Up", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S", load: "bodyweight" },
  { name: "Assisted Pull Up Machine", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "A", load: "selectorized" },
  { name: "Straight Arm Pulldown", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A", load: "cable" },
  { name: "Cable Lat Prayers", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A", load: "cable" },
  { name: "DB Pullovers", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A", load: "dumbbell" },
  { name: "DB Shrug", group: "Back", movement: "shrug", muscles: ["Upper traps"], tier: "A", load: "dumbbell" },
  { name: "Smith Machine Shrug", group: "Back", movement: "shrug", muscles: ["Upper traps"], tier: "A", load: "smith" },
  // LEGS
  { name: "Hack Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S+", load: "specialty" },
  { name: "Belt Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S+", load: "specialty" },
  { name: "Pendulum Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S", load: "specialty" },
  { name: "V-Squat Machine", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A", load: "specialty" },
  { name: "Barbell Back Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A", load: "barbell" },
  { name: "Front Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A", load: "barbell" },
  { name: "Smith Machine Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A", load: "smith" },
  { name: "Smith Machine Squat Feet Forward", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A", load: "smith" },
  { name: "45° Leg Press", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A", load: "plate-loaded" },
  { name: "45° Leg Press High Foot", group: "Legs", movement: "glute press", muscles: ["Glutes", "Hamstrings", "Quads"], tier: "A", load: "plate-loaded" },
  { name: "Bulgarian Split Squat", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "S", load: "dumbbell" },
  { name: "Smith Machine Lunge FFE", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "A", load: "smith" },
  { name: "Lunges", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "A", load: "dumbbell" },
  { name: "Step Ups High Box", group: "Legs", movement: "single leg", muscles: ["Glutes", "Quads"], tier: "A", load: "dumbbell" },
  { name: "Leg Extension", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A", load: "selectorized" },
  { name: "Reverse Nordic", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A", load: "bodyweight" },
  { name: "Sissy Squat", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A", load: "bodyweight" },
  { name: "Seated Hamstring Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "S+", load: "selectorized" },
  { name: "Lying Leg Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "A", load: "selectorized" },
  { name: "Nordic Hamstring Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "A", load: "bodyweight" },
  { name: "Romanian Deadlift RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A", load: "barbell" },
  { name: "Smith Machine RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A", load: "smith" },
  { name: "B-Stance RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes"], tier: "A", load: "dumbbell" },
  { name: "Deadlift", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A", load: "barbell" },
  { name: "Trap Bar Deadlift", group: "Legs", movement: "hinge", muscles: ["Quads", "Glutes", "Erectors"], tier: "A", load: "specialty" },
  { name: "Cable Pull Through", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes"], tier: "A", load: "cable" },
  { name: "45° Back Extension", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A", load: "bodyweight" },
  { name: "45° Glute Hyperextension", group: "Legs", movement: "glute isolation", muscles: ["Glutes", "Hamstrings"], tier: "A", load: "bodyweight" },
  { name: "Machine Hip Thrust", group: "Legs", movement: "glute bridge", muscles: ["Glutes", "Hamstrings"], tier: "S", load: "selectorized" },
  { name: "Kickbacks", group: "Legs", movement: "glute isolation", muscles: ["Glutes"], tier: "A", load: "cable" },
  { name: "Machine Hip Abduction", group: "Legs", movement: "glute isolation", muscles: ["Glutes"], tier: "A", load: "selectorized" },
  { name: "Machine Hip Adduction", group: "Legs", movement: "hip adduction", muscles: ["Adductors"], tier: "A", load: "selectorized" },
  // SHOULDERS
  { name: "Machine Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A", load: "selectorized" },
  { name: "Smith Machine Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A", load: "smith" },
  { name: "Seated DB Overhead Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A", load: "dumbbell" },
  { name: "Barbell Overhead Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A", load: "barbell" },
  { name: "Cable Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S+", load: "cable" },
  { name: "Atlantis Machine Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S", load: "selectorized" },
  { name: "Behind Back Cable Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S", load: "cable" },
  { name: "DB Lateral Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "A", load: "dumbbell" },
  { name: "Lean In DB Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "A", load: "dumbbell" },
  { name: "Cable Y Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts", "Lower traps"], tier: "A", load: "cable" },
  { name: "Reverse Pec Deck", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "S", load: "selectorized" },
  { name: "Reverse Cable Crossover", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "A", load: "cable" },
  { name: "Rope Face Pull", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back", "Lower traps"], tier: "A", load: "cable" },
  { name: "DB Rear Delt Flye", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "A", load: "dumbbell" },
  // ARMS
  { name: "Overhead Cable Ext", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "S+", load: "cable" },
  { name: "Katana Cable", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "A", load: "cable" },
  { name: "1 Arm DB Overhead", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "A", load: "dumbbell" },
  { name: "Barbell Skullcrusher", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A", load: "barbell" },
  { name: "DB Skullcrusher", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A", load: "dumbbell" },
  { name: "Machine Triceps Extension", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A", load: "selectorized" },
  { name: "Triceps Pressdown Bar", group: "Arms", movement: "triceps pressdown", muscles: ["Triceps"], tier: "A", load: "cable" },
  { name: "Rope Tricep Pushdown", group: "Arms", movement: "triceps pressdown", muscles: ["Triceps"], tier: "A", load: "cable" },
  { name: "Close-Grip Bench Press", group: "Arms", movement: "horizontal press", muscles: ["Triceps", "Chest", "Front delts"], tier: "A", load: "barbell" },
  { name: "Face Away Bayesian Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "cable" },
  { name: "Incline Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "dumbbell" },
  { name: "Standing DB Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "dumbbell" },
  { name: "EZ Bar Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "barbell" },
  { name: "DB Preacher Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "dumbbell" },
  { name: "Machine Preacher Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "selectorized" },
  { name: "DB Hammer Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "dumbbell" },
  { name: "Cable Rope Hammer Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "cable" },
  { name: "Straight Bar Cable Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A", load: "cable" },
  // ABS & CALVES
  { name: "Cable Crunch", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A", load: "cable" },
  { name: "Machine Abs Crunch", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A", load: "selectorized" },
  { name: "Hanging Knee Raise", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "S", load: "bodyweight" },
  { name: "Captain's Chair Knee Raise", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "S", load: "bodyweight" },
  { name: "Hanging Leg Raise", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A", load: "bodyweight" },
  { name: "Ab Wheel Rollout", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A", load: "bodyweight" },
  { name: "Seated Calf Raise", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "S", load: "selectorized" },
  { name: "Standing Calf Raise", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "A", load: "selectorized" },
  { name: "Leg Press Calf Raise", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "A", load: "plate-loaded" },
];

const allGroups: MuscleGroup[] = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Abs & Calves"];

const exerciseByNameMap = new Map<string, Exercise>(exerciseLibrary.map((ex) => [ex.name, ex]));

function findExercise(name: string) {
  return exerciseByNameMap.get(name) ?? exerciseLibrary[0];
}

const LOAD_LABELS: Record<LoadType, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  selectorized: "Selectorized",
  "plate-loaded": "Plate-Loaded Iso",
  smith: "Smith",
  cable: "Cable",
  bodyweight: "Bodyweight",
  specialty: "Specialty",
};

function getLoadType(ex: { name: string; load?: LoadType }): LoadType {
  if (ex.load) return ex.load; // explicit tag wins
  const n = ex.name.toLowerCase();
  if (n.includes("smith")) return "smith";
  if (n.includes("cable") || n.includes("katana")) return "cable";
  if (n.includes("iso-lateral") || n.includes("plate-loaded")) return "plate-loaded";
  if (n.includes("leg press") || n.includes("hack squat") || n.includes("pendulum")) return "plate-loaded";
  if (
    n.includes("machine") || n.includes("mts") || n.includes("pec deck") || n.includes("atlantis") ||
    n.includes("leg extension") || n.includes("leg curl") || n.includes("hamstring curl") ||
    n.includes("calf raise") || n.includes("hip abduction") || n.includes("preacher") || n.includes("abs crunch")
  ) return "selectorized";
  if (n.includes("belt squat") || n.includes("trap bar")) return "specialty";
  if (n.startsWith("db ") || n.includes(" db ") || n.includes("dumbbell")) return "dumbbell";
  if (n.includes("pull up") || n.includes("hanging") || n.includes("captain") || n.includes("ab wheel") || n.includes("nordic") || n.includes("sissy") || n.includes("lunge") || n.includes("step up") || n.includes("kickback")) return "bodyweight";
  return "barbell";
}

function mapMachineVariantToLoad(machineVariant?: string, fallbackLoad: LoadType = "barbell"): LoadType {
  if (!machineVariant) return fallbackLoad;
  const m = machineVariant.toLowerCase();
  if (m.includes("plate-loaded") || m.includes("plate loaded") || m.includes("iso-lateral") || m.includes("t-bar")) return "plate-loaded";
  if (m.includes("pin-selectorized") || m.includes("pin-loaded") || m.includes("selectorized") || m.includes("pin stack") || m.includes("standard selectorized")) return "selectorized";
  if (m.includes("cable") || m.includes("dual cable")) return "cable";
  if (m.includes("smith")) return "smith";
  if (m.includes("dumbbell") || m.includes("db")) return "dumbbell";
  if (m.includes("barbell") || m.includes("bb")) return "barbell";
  if (m.includes("machine") || m.includes("mts")) return "selectorized";
  return fallbackLoad;
}


function getPrescription(exercise: Exercise) {
  const movement = exercise.movement;
  const name = exercise.name.toLowerCase();

  const individual: Record<string, { sets: number; reps: string; warmup: boolean }> = {
    "machine chest press": { sets: 3, reps: "6 to 10", warmup: true },
    "pin-loaded chest press": { sets: 3, reps: "6 to 10", warmup: true },
    "plate-loaded chest press": { sets: 3, reps: "6 to 10", warmup: true },
    "converging cable chest press": { sets: 3, reps: "8 to 12", warmup: true },
    "incline converging chest press": { sets: 3, reps: "8 to 12", warmup: true },
    "bench press": { sets: 3, reps: "5 to 8", warmup: true },
    "flat db press": { sets: 3, reps: "8 to 12", warmup: true },
    "incline db press": { sets: 3, reps: "8 to 12", warmup: true },
    "incline machine bench": { sets: 3, reps: "8 to 12", warmup: true },
    "incline smith machine bench": { sets: 3, reps: "8 to 12", warmup: true },
    "smith machine press": { sets: 3, reps: "6 to 10", warmup: true },
    "smith machine floor press": { sets: 3, reps: "6 to 10", warmup: true },
    "weighted dip": { sets: 3, reps: "8 to 12", warmup: true },

    "pec deck": { sets: 4, reps: "10 to 15", warmup: false },
    "seated cable pec flye": { sets: 4, reps: "10 to 15", warmup: false },
    "cable crossover": { sets: 3, reps: "12 to 20", warmup: false },
    "db flye": { sets: 3, reps: "10 to 15", warmup: false },
    "high-to-low cable flye": { sets: 3, reps: "12 to 20", warmup: false },
    "low-to-high cable flye": { sets: 3, reps: "12 to 20", warmup: false },

    "chest supported row": { sets: 3, reps: "8 to 12", warmup: true },
    "cable row": { sets: 3, reps: "8 to 12", warmup: true },
    "cable rows": { sets: 3, reps: "8 to 12", warmup: true },
    "wide grip cable row": { sets: 3, reps: "10 to 15", warmup: true },
    "deficit pendlay row": { sets: 3, reps: "6 to 10", warmup: true },
    "one arm db row": { sets: 3, reps: "8 to 12", warmup: false },
    "meadows row": { sets: 3, reps: "8 to 12", warmup: false },
    "kroc row": { sets: 2, reps: "10 to 15", warmup: true },

    "neutral grip lat pull down": { sets: 3, reps: "8 to 12", warmup: true },
    "widegrip lat pull down": { sets: 3, reps: "8 to 12", warmup: true },
    "one arm lat pull down": { sets: 3, reps: "10 to 15", warmup: false },
    "weighted pull up": { sets: 3, reps: "5 to 8", warmup: true },
    "cable lat prayers": { sets: 3, reps: "12 to 15", warmup: false },
    "db pullovers": { sets: 3, reps: "10 to 15", warmup: false },

    "hack squat": { sets: 3, reps: "6 to 10", warmup: true },
    "pendulum squat": { sets: 3, reps: "6 to 10", warmup: true },
    "barbell back squat": { sets: 3, reps: "5 to 8", warmup: true },
    "front squat": { sets: 3, reps: "5 to 8", warmup: true },
    "smith machine squat": { sets: 3, reps: "6 to 10", warmup: true },
    "smith machine squat feet forward": { sets: 3, reps: "8 to 12", warmup: true },
    "45° leg press": { sets: 3, reps: "10 to 15", warmup: true },
    "45° leg press high foot": { sets: 3, reps: "10 to 15", warmup: true },

    "romanian deadlift rdl": { sets: 2, reps: "6 to 10", warmup: true },
    "deadlift": { sets: 2, reps: "3 to 6", warmup: true },
    "45° back extension": { sets: 3, reps: "10 to 15", warmup: false },
    "seated hamstring curl": { sets: 3, reps: "10 to 15", warmup: false },
    "lying leg curl": { sets: 3, reps: "10 to 15", warmup: false },

    "leg extension": { sets: 4, reps: "10 to 15", warmup: false },
    "reverse nordic": { sets: 3, reps: "8 to 12", warmup: false },
    "sissy squat": { sets: 3, reps: "10 to 15", warmup: false },

    "machine hip thrust": { sets: 3, reps: "8 to 12", warmup: true },
    "machine hip abduction": { sets: 3, reps: "12 to 20", warmup: false },
    "kickbacks": { sets: 3, reps: "12 to 20", warmup: false },
    "bulgarian split squat": { sets: 3, reps: "8 to 12 each leg", warmup: false },
    "lunges": { sets: 3, reps: "8 to 12 each leg", warmup: false },
    "smith machine lunge ffe": { sets: 3, reps: "8 to 12 each leg", warmup: false },
    "step ups high box": { sets: 3, reps: "8 to 12 each leg", warmup: false },

    "machine shoulder press": { sets: 3, reps: "6 to 10", warmup: true },
    "seated db overhead press": { sets: 3, reps: "8 to 12", warmup: true },
    "cable lat raise": { sets: 4, reps: "12 to 20", warmup: false },
    "atlantis machine lat raise": { sets: 4, reps: "12 to 20", warmup: false },
    "behind back cable lat raise": { sets: 4, reps: "12 to 20", warmup: false },
    "cable y raise": { sets: 3, reps: "12 to 20", warmup: false },
    "lean in db raise": { sets: 3, reps: "12 to 20", warmup: false },
    "reverse pec deck": { sets: 3, reps: "12 to 20", warmup: false },
    "reverse cable crossover": { sets: 3, reps: "12 to 20", warmup: false },
    "rope face pull": { sets: 3, reps: "12 to 20", warmup: false },

    "overhead cable ext": { sets: 4, reps: "10 to 15", warmup: false },
    "katana cable": { sets: 3, reps: "10 to 15", warmup: false },
    "1 arm db overhead": { sets: 3, reps: "10 to 15", warmup: false },
    "barbell skullcrusher": { sets: 3, reps: "8 to 12", warmup: false },
    "db skullcrusher": { sets: 3, reps: "10 to 15", warmup: false },
    "triceps pressdown bar": { sets: 3, reps: "10 to 15", warmup: false },
    "rope tricep pushdown": { sets: 3, reps: "10 to 15", warmup: false },

    "face away bayesian curl": { sets: 4, reps: "10 to 15", warmup: false },
    "incline curl": { sets: 3, reps: "10 to 15", warmup: false },
    "machine preacher curl": { sets: 3, reps: "10 to 15", warmup: false },
    "db preacher curl": { sets: 3, reps: "10 to 15", warmup: false },
    "ez bar curl": { sets: 3, reps: "8 to 12", warmup: false },
    "standing db curl": { sets: 3, reps: "10 to 15", warmup: false },
    "db hammer curl": { sets: 3, reps: "10 to 15", warmup: false },
    "cable rope hammer curl": { sets: 3, reps: "10 to 15", warmup: false },

    "db lateral raise": { sets: 4, reps: "12 to 20", warmup: false },
    "straight arm pulldown": { sets: 3, reps: "12 to 15", warmup: false },
    "db shrug": { sets: 3, reps: "10 to 15", warmup: false },

    "cable pull through": { sets: 3, reps: "10 to 15", warmup: false },
    "nordic hamstring curl": { sets: 3, reps: "5 to 8", warmup: false },
    "45° glute hyperextension": { sets: 3, reps: "10 to 15", warmup: false },

    "cable crunch": { sets: 3, reps: "10 to 15", warmup: false },
    "machine abs crunch": { sets: 3, reps: "10 to 15", warmup: false },
    "hanging knee raise": { sets: 3, reps: "10 to 15", warmup: false },
    "hanging leg raise": { sets: 3, reps: "8 to 12", warmup: false },
    "captain's chair knee raise": { sets: 3, reps: "10 to 15", warmup: false },
    "ab wheel rollout": { sets: 3, reps: "8 to 12", warmup: false },

    "seated calf raise": { sets: 4, reps: "10 to 15", warmup: false },
    "leg press calf raise": { sets: 4, reps: "8 to 15", warmup: false },
    "standing calf raise": { sets: 4, reps: "8 to 15", warmup: false },

    "decline machine press": { sets: 3, reps: "8 to 12", warmup: true },
    "decline bench press": { sets: 3, reps: "8 to 12", warmup: true },
    "incline barbell bench press": { sets: 3, reps: "6 to 10", warmup: true },
    "machine dip": { sets: 3, reps: "8 to 12", warmup: true },
    "barbell bent-over row": { sets: 3, reps: "6 to 10", warmup: true },
    "machine high row": { sets: 3, reps: "10 to 15", warmup: true },
    "chest supported t-bar row": { sets: 3, reps: "8 to 12", warmup: true },
    "seal row": { sets: 3, reps: "10 to 15", warmup: true },
    "assisted pull up machine": { sets: 3, reps: "6 to 10", warmup: true },
    "smith machine shrug": { sets: 3, reps: "10 to 15", warmup: false },
    "belt squat": { sets: 3, reps: "8 to 12", warmup: true },
    "v-squat machine": { sets: 3, reps: "8 to 12", warmup: true },
    "smith machine rdl": { sets: 3, reps: "8 to 12", warmup: true },
    "b-stance rdl": { sets: 3, reps: "8 to 12 each leg", warmup: false },
    "trap bar deadlift": { sets: 3, reps: "5 to 8", warmup: true },
    "machine hip adduction": { sets: 3, reps: "12 to 20", warmup: false },
    "barbell overhead press": { sets: 3, reps: "6 to 10", warmup: true },
    "smith machine shoulder press": { sets: 3, reps: "6 to 10", warmup: true },
    "db rear delt flye": { sets: 3, reps: "12 to 20", warmup: false },
    "close-grip bench press": { sets: 3, reps: "6 to 10", warmup: true },
    "straight bar cable curl": { sets: 3, reps: "10 to 15", warmup: false },
    "machine triceps extension": { sets: 3, reps: "10 to 15", warmup: false },

    "iso-lateral chest press": { sets: 3, reps: "6 to 10", warmup: true },
    "iso-lateral incline press": { sets: 3, reps: "8 to 12", warmup: true },
    "mts chest press": { sets: 3, reps: "6 to 10", warmup: true },
    "mts incline press": { sets: 3, reps: "8 to 12", warmup: true },
    "iso-lateral high row": { sets: 3, reps: "10 to 15", warmup: true },
    "iso-lateral low row": { sets: 3, reps: "8 to 12", warmup: true },
    "iso-lateral pulldown": { sets: 3, reps: "8 to 12", warmup: true },
    "mts seated row": { sets: 3, reps: "8 to 12", warmup: true },
    "mts lat pulldown": { sets: 3, reps: "8 to 12", warmup: true },
    "iso-lateral shoulder press": { sets: 3, reps: "6 to 10", warmup: true },
    "mts shoulder press": { sets: 3, reps: "6 to 10", warmup: true },
  };

  if (individual[name]) return individual[name];

  if (exercise.group === "Arms") return { sets: 3, reps: "10 to 15", warmup: false };
  if (exercise.group === "Abs & Calves") return { sets: 3, reps: movement === "calves" ? "8 to 15" : "10 to 15", warmup: false };
  if (movement === "hinge") return { sets: 2, reps: name.includes("deadlift") && !name.includes("romanian") ? "3 to 6" : "6 to 10", warmup: true };
  if (movement === "single leg") return { sets: 3, reps: "8 to 12 each leg", warmup: false };
  if (movement.includes("flye")) return { sets: 3, reps: "10 to 15", warmup: false };
  if (movement.includes("raise") || movement.includes("rear delt") || movement.includes("glute isolation")) return { sets: 3, reps: "12 to 20", warmup: false };
  if (movement.includes("isolation") || movement.includes("curl") || movement === "lat isolation") return { sets: 3, reps: movement === "lat isolation" ? "12 to 15" : "10 to 15", warmup: false };
  if (movement === "vertical pull" && name.includes("weighted")) return { sets: 3, reps: "5 to 8", warmup: true };

  return {
    sets: 3,
    reps: movement.includes("incline") || movement.includes("row") || movement.includes("vertical pull") || movement.includes("glute bridge") ? "8 to 12" : "6 to 10",
    warmup: true,
  };
}

function toPlanExercise(name: string, customId?: string | number): PlanExercise {
  const exercise = findExercise(name);
  const prescription = getPrescription(exercise);
  return {
    id: customId !== undefined ? String(customId) : makeId("ex"),
    name: exercise.name,
    group: exercise.group,
    sets: prescription.sets,
    reps: prescription.reps,
    warmup: prescription.warmup,
    muscles: exercise.muscles,
    movement: exercise.movement,
    load: exercise.load,
  };
}

function makeDay(dayIdPrefix: string, title: string, subtitle: string, focus: MuscleGroup[], exerciseNames: string[]): DayPlan {
  return {
    id: dayIdPrefix,
    title,
    subtitle,
    focus,
    exercises: exerciseNames
      .map((n) => exerciseByNameMap.get(n))
      .filter((e): e is Exercise => Boolean(e))
      .map((e, idx) => toPlanExercise(e.name, `${dayIdPrefix}_ex_${idx}`)),
  };
}

function makePresetPlans() {
  return {
    3: [
      makeDay("p3_d1", "Day 1 Full Body A", "Squat, horizontal press, row, hamstrings, delts, arms", ["Chest", "Back", "Legs", "Shoulders", "Arms"], ["Hack Squat", "Machine Chest Press", "Chest Supported Row", "Seated Hamstring Curl", "Cable Lat Raise", "Overhead Cable Ext"]),
      makeDay("p3_d2", "Day 2 Full Body B", "Hinge, vertical pull, incline press, quads, rear delts, biceps", ["Legs", "Back", "Chest", "Shoulders", "Arms"], ["Romanian Deadlift RDL", "Neutral Grip Lat Pull Down", "Incline DB Press", "Leg Extension", "Reverse Pec Deck", "Face Away Bayesian Curl"]),
      makeDay("p3_d3", "Day 3 Full Body C", "Belt squat, lower chest, row, glutes, delts, abs", ["Legs", "Chest", "Back", "Shoulders", "Abs & Calves"], ["Belt Squat", "Decline Machine Press", "Cable Row", "Machine Hip Thrust", "Cable Lat Raise", "Cable Crunch"]),
    ],
    4: [
      makeDay("p4_d1", "Day 1 Upper A", "Mid chest, lats, side delts, upper traps, triceps long", ["Chest", "Back", "Shoulders", "Arms"], ["Iso-Lateral Chest Press", "Seated Cable Pec Flye", "Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Raise", "DB Shrug", "Overhead Cable Ext"]),
      makeDay("p4_d2", "Day 2 Lower A", "Quad bias, hamstrings, glutes, soleus", ["Legs", "Abs & Calves"], ["Belt Squat", "Leg Extension", "Seated Hamstring Curl", "Machine Hip Thrust", "Seated Calf Raise"]),
      makeDay("p4_d3", "Day 3 Upper B", "Upper+lower chest, lat width, rear delts, lower traps, biceps", ["Chest", "Back", "Shoulders", "Arms"], ["Iso-Lateral Incline Press", "Decline Machine Press", "Iso-Lateral Pulldown", "Cable Row", "Reverse Pec Deck", "Rope Face Pull", "Face Away Bayesian Curl"]),
      makeDay("p4_d4", "Day 4 Lower B", "Hinge, glute press, quads, hamstrings, abs, gastroc", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Bulgarian Split Squat", "Seated Hamstring Curl", "Cable Crunch", "Standing Calf Raise"]),
    ],
    5: [
      makeDay("p5_d1", "Day 1 Chest + Back A", "Horizontal press, row, incline press, vertical pull, flye", ["Chest", "Back"], ["Machine Chest Press", "Chest Supported Row", "Incline DB Press", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye"]),
      makeDay("p5_d2", "Day 2 Legs Quad Bias", "Squat press, leg curl, quad isolation, glute, soleus", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Seated Calf Raise"]),
      makeDay("p5_d3", "Day 3 Shoulders + Arms", "Shoulder press, side delt, rear delt, lower traps, biceps, triceps long", ["Shoulders", "Arms"], ["Machine Shoulder Press", "Cable Lat Raise", "Reverse Pec Deck", "Cable Y Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("p5_d4", "Day 4 Chest + Back B", "Row bias, lat isolation, lower chest, rear delt, upper traps", ["Back", "Chest", "Shoulders"], ["Cable Row", "Straight Arm Pulldown", "Decline Machine Press", "Pec Deck", "Rope Face Pull", "DB Shrug"]),
      makeDay("p5_d5", "Day 5 Legs Posterior Bias", "Hinge, glute press, hamstring curl, glute, abs, gastroc", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Seated Hamstring Curl", "Machine Hip Thrust", "Cable Crunch", "Standing Calf Raise"]),
    ],
  } satisfies Record<3 | 4 | 5, DayPlan[]>;
}

function makeFiveDayLegOncePlan() {
  return [
    makeDay("p5leg1_d1", "Day 1 Push", "Chest press, incline, flye, side delt, triceps", ["Chest", "Shoulders", "Arms"], ["Machine Chest Press", "Incline DB Press", "Seated Cable Pec Flye", "Cable Lat Raise", "Overhead Cable Ext"]),
    makeDay("p5leg1_d2", "Day 2 Pull", "Row, pulldown, lat isolation, rear delt, biceps", ["Back", "Shoulders", "Arms"], ["Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Prayers", "Reverse Pec Deck", "Face Away Bayesian Curl"]),
    makeDay("p5leg1_d3", "Day 3 Legs Only", "Single weekly leg day with complete lower-body coverage", ["Legs", "Abs & Calves"], ["Hack Squat", "Romanian Deadlift RDL", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Standing Calf Raise"]),
    makeDay("p5leg1_d4", "Day 4 Upper A", "Chest and back volume without extra leg fatigue", ["Chest", "Back", "Shoulders"], ["Incline Machine Bench", "Cable Row", "Pec Deck", "Widegrip Lat Pull Down", "Rope Face Pull"]),
    makeDay("p5leg1_d5", "Day 5 Upper B + Arms", "Upper pump with direct arm work", ["Back", "Chest", "Shoulders", "Arms"], ["Machine Chest Press", "Chest Supported Row", "Cable Lat Raise", "Machine Preacher Curl", "Triceps Pressdown Bar"]),
  ];
}

function recommendForGroups(groups: MuscleGroup[]) {
  const names: string[] = [];

  if (groups.includes("Chest")) names.push("Machine Chest Press", "Incline DB Press", "High-to-Low Cable Flye", "Seated Cable Pec Flye");
  if (groups.includes("Back")) names.push("Chest Supported Row", "Neutral Grip Lat Pull Down", "DB Shrug");
  if (groups.includes("Legs")) names.push("Hack Squat", "Romanian Deadlift RDL", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust");
  if (groups.includes("Shoulders")) {
    if (!groups.includes("Chest")) names.push("Machine Shoulder Press");
    names.push("Cable Lat Raise", "Reverse Pec Deck", "Rope Face Pull");
  }
  if (groups.includes("Arms")) names.push("Face Away Bayesian Curl", "DB Hammer Curl", "Overhead Cable Ext");
  if (groups.includes("Abs & Calves")) names.push("Cable Crunch", "Hanging Knee Raise", "Seated Calf Raise");

  // Keep the day dense enough for hypertrophy but avoid junk volume.
  const maxExercises = groups.includes("Legs") ? 6 : groups.length >= 3 ? 7 : 6;
  return Array.from(new Set(names)).slice(0, maxExercises).map((name) => toPlanExercise(name));
}

function createStarterCustomPlan() {
  return {
    id: makeId("plan"),
    name: "My Custom Split",
    days: [makeDay("c_d1", "Custom Day 1", "Choose target muscles then press Recommend", ["Chest", "Back"], ["Machine Chest Press", "Chest Supported Row"])],
  } satisfies CustomPlan;
}

function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

function getWarmupSets(bestWeight?: number) {
  if (!bestWeight || bestWeight <= 0) return [];
  return [
    { label: "Warmup 1", weight: roundToFive(bestWeight * 0.4), reps: "8 to 10" },
    { label: "Warmup 2", weight: roundToFive(bestWeight * 0.6), reps: "5 to 6" },
    { label: "Warmup 3", weight: roundToFive(bestWeight * 0.8), reps: "2 to 3" },
  ];
}

function getSmartRestSeconds(
  exercise: PlanExercise,
  currentWeightLbs: number,
  userBwLbs: number | null,
  reps: number
): number {
  const name = exercise.name.toLowerCase();
  const mov = exercise.movement.toLowerCase();
  const isHeavySpine = name.includes("deadlift") || name.includes("squat") || name.includes("rdl") || mov.includes("hinge");
  const isCompound = isHeavySpine || mov.includes("press") || mov.includes("row") || mov.includes("vertical pull") || name.includes("bench");
  const isSmall = exercise.group === "Arms" || exercise.group === "Abs & Calves" || mov.includes("raise") || mov.includes("curl") || mov.includes("pressdown") || mov.includes("ext");

  const ratio = userBwLbs && userBwLbs > 0 && currentWeightLbs > 0 ? currentWeightLbs / userBwLbs : 1.0;

  // Heavy CNS / Spinal Load (Deadlift, Squat)
  if (isHeavySpine) {
    if (ratio >= 1.5 || reps <= 5) return 210; // 3:30 min for max strength
    if (ratio >= 1.2 || reps <= 8) return 180; // 3:00 min
    return 150; // 2:30 min
  }

  // Compound Upper / Machine (Bench, Rows, Pulldowns)
  if (isCompound) {
    if (reps <= 6 || ratio >= 1.2) return 150; // 2:30 min heavy
    if (reps >= 12) return 90; // 1:30 min pump/endurance
    return 120; // 2:00 min standard hypertrophy
  }

  // Isolation & Small Muscle Groups (Arms, Delts, Abs)
  if (isSmall) {
    if (exercise.group === "Abs & Calves") return 45; // 45s
    if (reps >= 15) return 60; // 1:00 min
    return 75; // 1:15 min
  }

  return 90;
}

function formatRestTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getRestSecondsByMode(
  exercise: PlanExercise,
  mode: RestMode,
  currentWeightLbs = 0,
  userBwLbs: number | null = null,
  reps = 10
) {
  const normal = getSmartRestSeconds(exercise, currentWeightLbs, userBwLbs, reps);

  if (mode === "short") return Math.max(30, normal - 30);
  if (mode === "heavy") return normal + 30;

  return normal;
}

function createDefaultSetInputs(sets: number): SetInput[] {
  return Array.from({ length: sets }, () => ({ weightLbs: "", reps: "", done: false }));
}

function isWithinLastDays(dateIso: string, daysBack: number) {
  const time = new Date(dateIso).getTime();
  if (Number.isNaN(time)) return false;
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  return time >= cutoff;
}

function formatShortDate(dateIso: string) {
  return new Intl.DateTimeFormat("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateIso));
}

function getRelatedMovements(movement: string) {
  if (["horizontal press", "incline press", "decline press"].includes(movement)) return ["horizontal press", "incline press", "decline press"];
  if (["chest flye"].includes(movement)) return ["chest flye"];
  if (["row"].includes(movement)) return ["row"];
  if (["shrug"].includes(movement)) return ["shrug"];
  if (["vertical pull", "lat isolation"].includes(movement)) return ["vertical pull", "lat isolation"];
  if (["squat press", "quad isolation", "single leg", "hip adduction"].includes(movement)) return ["squat press", "quad isolation", "single leg", "hip adduction"];
  if (["hinge"].includes(movement)) return ["hinge"];
  if (["hamstring curl"].includes(movement)) return ["hamstring curl"];
  if (["glute bridge", "glute isolation", "glute press"].includes(movement)) return ["glute bridge", "glute isolation", "glute press"];
  if (["lateral raise"].includes(movement)) return ["lateral raise"];
  if (["rear delt"].includes(movement)) return ["rear delt"];
  if (["shoulder press"].includes(movement)) return ["shoulder press"];
  if (["biceps curl"].includes(movement)) return ["biceps curl"];
  if (["triceps overhead", "triceps extension", "triceps pressdown"].includes(movement)) return ["triceps overhead", "triceps extension", "triceps pressdown"];
  if (["abs"].includes(movement)) return ["abs"];
  if (["calves"].includes(movement)) return ["calves"];
  return [movement];
}

function getAlternatives(exercise: PlanExercise) {
  const related = getRelatedMovements(exercise.movement);
  const candidates = exerciseLibrary.filter(
    (candidate) => candidate.group === exercise.group && candidate.name !== exercise.name
  );

  return candidates
    .map((candidate) => ({
      name: candidate.name,
      score: calculateMuscleMatchScore(exercise, candidate),
      isRelated: related.includes(candidate.movement),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.isRelated !== b.isRelated) return a.isRelated ? -1 : 1;
      return b.score - a.score;
    })
    .map((item) => item.name)
    .slice(0, 8);
}

function applyExerciseIdentity(base: PlanExercise, exerciseName: string): PlanExercise {
  const next = toPlanExercise(exerciseName);
  return {
    ...base,
    name: next.name,
    group: next.group,
    movement: next.movement,
    muscles: next.muscles,
    sets: next.sets,
    reps: next.reps,
    warmup: next.warmup,
    load: next.load,
  };
}

function getWeeklyVolumeSummary(plan: DayPlan[]) {
  const summary: Record<string, number> = {
    Chest: 0,
    Back: 0,
    Quads: 0,
    Hamstrings: 0,
    Glutes: 0,
    "Side delts": 0,
    "Rear delts": 0,
    Biceps: 0,
    Triceps: 0,
    Abs: 0,
    Calves: 0,
  };

  for (const day of plan) {
    for (const exercise of day.exercises) {
      for (const muscle of exercise.muscles) {
        if (muscle.includes("Upper chest") || muscle === "Chest" || muscle.includes("Lower chest")) summary.Chest += exercise.sets;
        if (muscle.includes("Lats") || muscle.includes("Mid back") || muscle.includes("Upper back") || muscle.toLowerCase().includes("traps")) summary.Back += exercise.sets;
        if (muscle.includes("Quads")) summary.Quads += exercise.sets;
        if (muscle.includes("Hamstrings")) summary.Hamstrings += exercise.sets;
        if (muscle.includes("Glutes")) summary.Glutes += exercise.sets;
        if (muscle.includes("Side delts")) summary["Side delts"] += exercise.sets;
        if (muscle.includes("Rear delts")) summary["Rear delts"] += exercise.sets;
        if (muscle.includes("Biceps")) summary.Biceps += exercise.sets;
        if (muscle.includes("Triceps")) summary.Triceps += exercise.sets;
        if (muscle.includes("Abs")) summary.Abs += exercise.sets;
        if (muscle.includes("Calves")) summary.Calves += exercise.sets;
      }
    }
  }

  return Object.entries(summary).filter(([, sets]) => sets > 0);
}

function normalizeSetInputs(raw: SetInput[] | undefined, defaultSets: number): SetInput[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return createDefaultSetInputs(defaultSets);
  }
  return raw.map((item) => ({
    weightLbs: item?.weightLbs !== undefined ? String(item.weightLbs) : "",
    reps: item?.reps !== undefined ? String(item.reps) : "",
    done: Boolean(item?.done),
  }));
}



type MuscleRegion =
  | "chest"
  | "upperChest"
  | "lowerChest"
  | "frontDelts"
  | "sideDelts"
  | "rearDelts"
  | "biceps"
  | "triceps"
  | "tricepsLong"
  | "lats"
  | "midBack"
  | "upperBack"
  | "erectors"
  | "upperTraps"
  | "lowerTraps"
  | "abs"
  | "obliques"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

type MuscleSummary = {
  primary: MuscleRegion[];
  secondary: MuscleRegion[];
  summaryText: string;
  hasData: boolean;
  sourceLabel: string;
};

const MUSCLE_REGION_LABELS: Record<MuscleRegion, string> = {
  chest: "Chest (mid)",
  upperChest: "Upper chest",
  lowerChest: "Lower chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps (lat/med)",
  tricepsLong: "Triceps long head",
  lats: "Lats",
  midBack: "Mid back",
  upperBack: "Upper back",
  erectors: "Erectors",
  upperTraps: "Upper traps",
  lowerTraps: "Lower traps",
  abs: "Abs",
  obliques: "Obliques",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

const MUSCLE_ALIAS_MAP: Record<string, MuscleRegion[]> = {
  Chest: ["chest"],
  "Upper chest": ["upperChest"],
  "Lower chest": ["lowerChest"],
  "Front delts": ["frontDelts"],
  "Side delts": ["sideDelts"],
  "Rear delts": ["rearDelts"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  "Triceps long head": ["tricepsLong"],
  Lats: ["lats"],
  "Mid back": ["midBack"],
  "Upper back": ["upperBack"],
  Erectors: ["erectors"],
  "Upper traps": ["upperTraps"],
  "Lower traps": ["lowerTraps"],
  Abs: ["abs"],
  Glutes: ["glutes"],
  Quads: ["quads"],
  Hamstrings: ["hamstrings"],
  Calves: ["calves"],
  Adductors: [],
  Grip: [],
};

function uniqueRegions(items: MuscleRegion[]) {
  return Array.from(new Set(items));
}

function getExercisePreviewRegions(exercise: Pick<PlanExercise, "group" | "movement" | "muscles">) {
  const normalized = uniqueRegions(exercise.muscles.flatMap((muscle) => MUSCLE_ALIAS_MAP[muscle] ?? []));
  const movement = exercise.movement.toLowerCase();

  const isIsolation =
    exercise.group === "Arms" ||
    exercise.group === "Abs & Calves" ||
    movement.includes("flye") ||
    movement.includes("raise") ||
    movement.includes("curl") ||
    movement.includes("extension") ||
    movement.includes("pressdown") ||
    movement.includes("lat isolation") ||
    movement.includes("rear delt") ||
    movement.includes("hamstring curl") ||
    movement.includes("quad isolation") ||
    movement.includes("glute isolation") ||
    movement === "abs" ||
    movement === "calves";

  if (normalized.length <= 1 || isIsolation) {
    return {
      primary: normalized,
      secondary: [] as MuscleRegion[],
    };
  }

  let primaryCount = 1;

  if (
    exercise.group === "Back" ||
    exercise.group === "Legs" ||
    exercise.group === "Shoulders" ||
    movement.includes("squat") ||
    movement.includes("row") ||
    movement.includes("vertical pull") ||
    movement.includes("single leg") ||
    movement.includes("shoulder press") ||
    movement.includes("glute bridge")
  ) {
    primaryCount = Math.min(2, normalized.length);
  }

  return {
    primary: normalized.slice(0, primaryCount),
    secondary: normalized.slice(primaryCount),
  };
}

// Jeff's logic: stability = how purely the target muscle is trained
const FOCUS_EFFICIENCY: Record<LoadType, number> = {
  "plate-loaded": 1.0,
  specialty: 0.95,
  selectorized: 0.95,
  smith: 0.9,
  cable: 0.85,
  dumbbell: 0.7,
  barbell: 0.6,
  bodyweight: 0.55,
};

function calculateMuscleMatchScore(
  target: Pick<PlanExercise, "group" | "movement" | "muscles" | "name" | "load">,
  candidate: Exercise
): number {
  if (target.group !== candidate.group) return -1;
  const t = getExercisePreviewRegions(target);
  const c = getExercisePreviewRegions(candidate);
  let score = 0;
  for (const r of t.primary) score += c.primary.includes(r) ? 6 : c.secondary.includes(r) ? 2 : 0; // FOCUS MUSCLE = MOST
  for (const r of t.secondary) score += c.primary.includes(r) ? 2 : c.secondary.includes(r) ? 1 : 0;
  const related = getRelatedMovements(target.movement);
  score += candidate.movement === target.movement ? 2 : related.includes(candidate.movement) ? 1 : 0;
  score += 2 * FOCUS_EFFICIENCY[candidate.load]; // stability -> focus
  if (candidate.load === target.load) score += 0.5; // same machine feel
  if (candidate.tier === "S+") score += 0.3;
  else if (candidate.tier === "S") score += 0.2;
  else if (candidate.tier === "A") score += 0.1;
  return score;
}

function summarizeRegionScores(scoreMap: Record<MuscleRegion, number>, sourceLabel: string): MuscleSummary {
  const ranked = Object.entries(scoreMap)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]) as [MuscleRegion, number][];

  if (ranked.length === 0) {
    return { primary: [], secondary: [], summaryText: "No muscle data yet", hasData: false, sourceLabel };
  }

  const highest = ranked[0][1];
  const primary = ranked.filter(([, score]) => score >= Math.max(1, highest * 0.66)).map(([region]) => region);
  const secondary = ranked.filter(([region, score]) => !primary.includes(region) && score >= 0.45).map(([region]) => region);
  const orderedLabels = [...primary, ...secondary].map((region) => MUSCLE_REGION_LABELS[region]);

  return { primary, secondary, summaryText: orderedLabels.slice(0, 6).join(", "), hasData: true, sourceLabel };
}

function buildTodayMuscleSummary(logs: LogSet[], exerciseLookup: Record<string, Exercise>): MuscleSummary {
  const todayKey = getLocalDateKey(new Date());
  const scoreMap = {} as Record<MuscleRegion, number>;

  for (const log of logs) {
    if (getLocalDateKey(log.date) !== todayKey) continue;
    const exercise = exerciseLookup[log.exerciseName];
    if (!exercise) continue;
    const { primary, secondary } = getExercisePreviewRegions(exercise);
    const setWeight = log.reps >= 6 && log.reps <= 20 ? 1.15 : 1;
    for (const region of primary) scoreMap[region] = (scoreMap[region] ?? 0) + setWeight;
    for (const region of secondary) scoreMap[region] = (scoreMap[region] ?? 0) + setWeight * 0.55;
  }

  return summarizeRegionScores(scoreMap, "Saved sets today");
}

function buildPlannedMuscleSummary(exercises: PlanExercise[]): MuscleSummary {
  const scoreMap = {} as Record<MuscleRegion, number>;

  for (const exercise of exercises) {
    const { primary, secondary } = getExercisePreviewRegions(exercise);
    const setWeight = Math.max(1, exercise.sets * 0.8);
    for (const region of primary) scoreMap[region] = (scoreMap[region] ?? 0) + setWeight;
    for (const region of secondary) scoreMap[region] = (scoreMap[region] ?? 0) + setWeight * 0.55;
  }

  return summarizeRegionScores(scoreMap, "Planned from this day");
}

const REGION_TO_ANATOMY_MAP: Record<MuscleRegion, { front?: string[]; back?: string[] }> = {
  upperChest: { front: ["upper_chest"] },
  chest: { front: ["chest"] },
  lowerChest: { front: ["chest"] },
  frontDelts: { front: ["front_deltoid"] },
  sideDelts: { front: ["side_deltoid"], back: ["side_deltoid"] },
  rearDelts: { back: ["rear_deltoid"] },
  biceps: { front: ["biceps"] },
  triceps: { back: ["triceps"] },
  tricepsLong: { back: ["triceps"] },
  lats: { back: ["lats"] },
  midBack: { back: ["middle_traps", "infraspinatus"] },
  upperBack: { back: ["upper_traps", "middle_traps"] },
  erectors: { back: ["lower_back"] },
  upperTraps: { back: ["upper_traps"] },
  lowerTraps: { back: ["lower_traps"] },
  abs: { front: ["abs"] },
  obliques: { front: ["obliques", "serratus_anterior"] },
  glutes: { back: ["glutes", "gluteus_medius"] },
  quads: { front: ["quads"] },
  hamstrings: { back: ["hamstrings"] },
  calves: { front: ["tibialis_anterior"], back: ["calves", "soleus"] },
};

function RealisticAnatomyFigure({
  side,
  primary,
  secondary,
  compact = false,
}: {
  side: "front" | "back";
  primary: MuscleRegion[];
  secondary: MuscleRegion[];
  compact?: boolean;
}) {
  const primaryIds = Array.from(new Set(primary.flatMap((r) => REGION_TO_ANATOMY_MAP[r]?.[side] ?? [])));
  const secondaryIds = Array.from(
    new Set(secondary.flatMap((r) => REGION_TO_ANATOMY_MAP[r]?.[side] ?? []))
  ).filter((id) => !primaryIds.includes(id));

  return (
    <div
      className={`relative mx-auto flex items-center justify-center select-none overflow-hidden ${
        compact ? "h-44 max-w-[140px]" : "h-60 max-w-[180px]"
      }`}
      aria-label={`Realistic Anatomy ${side} view`}
    >
      {/* Base 3D Realistic Body Render */}
      <img
        src={`/anatomy/${side}/body.webp`}
        alt={`Human anatomy ${side}`}
        className="h-full w-full object-contain pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] opacity-95 transition-opacity"
        loading="lazy"
        draggable={false}
      />

      {/* Secondary Muscles Glow Mask (Electric Purple Glow) */}
      {secondaryIds.map((id) => (
        <div
          key={`sec-${id}`}
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            maskImage: `url('/anatomy/${side}/${id}.png')`,
            WebkitMaskImage: `url('/anatomy/${side}/${id}.png')`,
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
            backgroundColor: "#a855f7",
            filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.95)) brightness(1.35)",
            opacity: 0.9,
          } as React.CSSProperties}
        />
      ))}

      {/* Primary Muscles Glow Mask (HYROX Volt Yellow Glow) */}
      {primaryIds.map((id) => (
        <div
          key={`pri-${id}`}
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            maskImage: `url('/anatomy/${side}/${id}.png')`,
            WebkitMaskImage: `url('/anatomy/${side}/${id}.png')`,
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
            backgroundColor: "#FFE500",
            filter: "drop-shadow(0 0 10px rgba(255, 229, 0, 1)) drop-shadow(0 0 16px rgba(234, 179, 8, 0.8)) brightness(1.4)",
            opacity: 0.95,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function DayMuscleOverviewCard({ summary }: { summary: MuscleSummary }) {
  return (
    <details className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-yellow-300">Daily Muscle Map · 3D Anatomy</p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">{summary.hasData ? summary.summaryText : "Show day 3D anatomy"}</p>
        </div>
        <span className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition">Show 3D</span>
      </summary>
      <p className="mt-2 text-[11px] text-zinc-500">{summary.sourceLabel}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Anterior (Front)</p>
          <RealisticAnatomyFigure side="front" primary={summary.primary} secondary={summary.secondary} compact />
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Posterior (Back)</p>
          <RealisticAnatomyFigure side="back" primary={summary.primary} secondary={summary.secondary} compact />
        </div>
      </div>
    </details>
  );
}

function ExerciseMusclePreviewCard({ exercise }: { exercise: PlanExercise }) {
  const [showFullDiagram, setShowFullDiagram] = useState(false);
  const { primary, secondary } = getExercisePreviewRegions(exercise);
  const primaryLabels = primary.map((item) => MUSCLE_REGION_LABELS[item]);
  const secondaryLabels = secondary.map((item) => MUSCLE_REGION_LABELS[item]);

  const isBackDominant = secondary.some((m) => ["lats", "rhomboids", "upper_back", "lower_back", "glutes", "hamstrings", "rear_delts"].includes(m))
    || primary.some((m) => ["lats", "rhomboids", "upper_back", "lower_back", "glutes", "hamstrings", "rear_delts"].includes(m));

  return (
    <div className="mb-3 rounded-2xl border border-zinc-800/60 bg-[#141416] p-2.5 sm:p-3 overflow-hidden">
      {/* Integrated Inline Strip: Left Target Chips + Right Mini 3D Silhouette */}
      <div className="flex items-center justify-between gap-2 min-w-0 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span>Target Muscles</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowFullDiagram((prev) => !prev)}
              className="text-yellow-400 font-bold hover:text-yellow-300 underline underline-offset-2 capitalize font-semibold transition"
            >
              {showFullDiagram ? "ย่อรูปหุ่น 3D" : "ขยาย 3D คู่ (หน้า/หลัง)"}
            </button>
          </div>

          {/* Primary (Volt Yellow) & Secondary (Electric Purple) Muscle Chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            {primaryLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md border border-yellow-400 bg-yellow-400/20 px-2 py-0.5 text-[10px] font-black uppercase text-yellow-300 shadow-sm shadow-yellow-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#FFE500]" />
                ● หลัก {label}
              </span>
            ))}
            {secondaryLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md border border-purple-400/60 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-200 shadow-sm shadow-purple-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
                ○ รอง {label}
              </span>
            ))}
            {primaryLabels.length === 0 && secondaryLabels.length === 0 && (
              <span className="text-xs text-zinc-500">—</span>
            )}
          </div>
        </div>

        {/* Mini 3D Anatomical Silhouette (~94px height, shrink-0 w-[52px] sm:w-[58px]) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowFullDiagram((prev) => !prev)}
          className="shrink-0 w-[52px] sm:w-[58px] cursor-pointer rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-1 transition hover:border-yellow-400/40 active:scale-95 overflow-hidden"
          title="แตะเพื่อดูโมเดล 3D แบบเต็ม"
        >
          <div className="h-[94px] w-full overflow-hidden flex items-center justify-center">
            <RealisticAnatomyFigure
              side={isBackDominant ? "back" : "front"}
              primary={primary}
              secondary={secondary}
              compact
            />
          </div>
          <p className="text-[9px] font-bold text-center text-zinc-500 truncate mt-0.5">
            {isBackDominant ? "หลัง (3D)" : "หน้า (3D)"}
          </p>
        </div>
      </div>

      {/* Expandable full dual-view 3D anatomy drawer inside card */}
      {showFullDiagram && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 animate-in fade-in duration-150">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Full 3D Anatomy Explorer</span>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#FFE500]" /> ● Primary (หลัก)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" /> ○ Secondary (รอง)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Anterior (Front)</p>
              <RealisticAnatomyFigure side="front" primary={primary} secondary={secondary} compact />
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Posterior (Back)</p>
              <RealisticAnatomyFigure side="back" primary={primary} secondary={secondary} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function safeCsvCell(value: string | number) {
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function sanitizeUiState(raw: PersistedUiState | null): PersistedUiState {
  const fallback: PersistedUiState = {
    mode: "dashboard",
    days: 4,
    selectedDay: 0,
    fiveDayMode: "twoLegDays",
    showHistory: false,
    showLibrary: false,
    scrollY: 0,
    selectedCustomPlanId: null,
    selectedCustomDay: 0,
    sessionStage: "lifting",
    activeExerciseIndex: 0,
  };
  if (!raw || typeof raw !== "object") return fallback;
  const modes: AppMode[] = ["dashboard", "today", "preset", "custom", "history", "library"];
  const safeInt = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0);
  return {
    mode: modes.includes(raw.mode) ? raw.mode : fallback.mode,
    days: ([3, 4, 5] as const).includes(raw.days) ? raw.days : fallback.days,
    selectedDay: safeInt(raw.selectedDay),
    fiveDayMode: raw.fiveDayMode === "oneLegDay" ? "oneLegDay" : "twoLegDays",
    showHistory: Boolean(raw.showHistory),
    showLibrary: Boolean(raw.showLibrary),
    scrollY: Number.isFinite(raw.scrollY) ? raw.scrollY : 0,
    selectedCustomPlanId: typeof raw.selectedCustomPlanId === "string" ? raw.selectedCustomPlanId : null,
    selectedCustomDay: safeInt(raw.selectedCustomDay),
    sessionStage: raw.sessionStage === "cardio" ? "cardio" : "lifting",
    activeExerciseIndex: safeInt(raw.activeExerciseIndex),
  };
}


function epley1RM(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

type Challenge = { name: string; desc: string; done: boolean; progress: string };
type PerformanceReport = {
  score: number;
  rank: string;
  emoji: string;
  message: string;
  progress: number;
  volume: number;
  consistency: number;
  completion: number;
  recovery: number;
  streakBonus: number;
  restDays: number;
  uniqueDays: number;
  totalSets: number;
  currentStreak: number;
  fatigueWarning: boolean;
  deloadSuggestion: boolean;
  weeklyTrends: WeeklyTrendPoint[];
  challenges: Challenge[];
  hasData: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getComputedStreak(logs: LogSet[]): number {
  if (logs.length === 0) return readJson<number>(WEEK_STREAK_KEY, 0);
  const now = Date.now();
  let streak = 0;
  for (let w = 0; w < 52; w++) {
    const start = now - (w + 1) * 7 * DAY_MS;
    const end = now - w * 7 * DAY_MS;
    const hasLog = logs.some((l) => {
      const t = new Date(l.date).getTime();
      return t >= start && t <= end;
    });
    if (hasLog) {
      streak++;
    } else {
      if (w === 0) continue;
      break;
    }
  }
  const saved = readJson<number>(WEEK_STREAK_KEY, 0);
  return Math.max(streak, saved);
}

function computeWeeklyPerformance(logs: LogSet[], plannedDays: number, activePlan: DayPlan[]): PerformanceReport {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const thisWeek = logs.filter((l) => new Date(l.date).getTime() >= weekAgo);

  // 4-Week historical trends
  const weeklyTrends: WeeklyTrendPoint[] = [];
  for (let w = 3; w >= 0; w--) {
    const wStart = now - (w + 1) * 7 * DAY_MS;
    const wEnd = now - w * 7 * DAY_MS;
    const wLogs = logs.filter((l) => {
      const t = new Date(l.date).getTime();
      return t >= wStart && t < wEnd;
    });
    const label = w === 0 ? "สัปดาห์นี้" : w === 1 ? "สัปดาห์ก่อน" : `-${w} สัปดาห์`;
    const dStart = new Date(wStart).toLocaleDateString("th-TH", { month: "numeric", day: "numeric" });
    const dEnd = new Date(wEnd).toLocaleDateString("th-TH", { month: "numeric", day: "numeric" });
    if (wLogs.length === 0) {
      weeklyTrends.push({ label, score: 0, dateRange: `${dStart} - ${dEnd}` });
    } else {
      const uDays = new Set(wLogs.map((l) => getLocalDateKey(l.date))).size;
      const wPlannedSets = activePlan.reduce((s, d) => s + d.exercises.reduce((x, e) => x + e.sets, 0), 0);
      const wCompletion = wPlannedSets > 0 ? Math.min(100, (wLogs.length / wPlannedSets) * 100) : 0;
      const wConsistency = Math.min(100, (uDays / Math.max(1, plannedDays)) * 100);
      const wRest = 7 - uDays;
      const wRecovery = wRest >= 2 ? 100 : wRest === 1 ? 75 : 50;
      const wVol = Math.min(100, (wLogs.length / (plannedDays * 12)) * 100);
      const wScore = Math.round(wVol * 0.35 + wConsistency * 0.25 + wCompletion * 0.25 + wRecovery * 0.15);
      weeklyTrends.push({ label, score: Math.min(100, Math.max(10, wScore)), dateRange: `${dStart} - ${dEnd}` });
    }
  }

  // 🆕 Streak bonus (ต้องเก็บใน localStorage เพิ่ม)
  const currentStreak = readJson<number>("haitWeekStreak", 0);
  const streakBonus = Math.min(100, currentStreak * 10); // สูงสุด 10 สัปดาห์

  if (thisWeek.length === 0) {
    return {
      score: 0,
      rank: "—",
      emoji: "🌱",
      message: "สัปดาห์นี้ยังไม่มีเซตเลย เริ่มเซตแรกเพื่อปลุกคะแนนกันเลย!",
      progress: 0,
      volume: 0,
      consistency: 0,
      completion: 0,
      recovery: 100,
      streakBonus,
      restDays: 7,
      uniqueDays: 0,
      totalSets: 0,
      currentStreak,
      fatigueWarning: false,
      deloadSuggestion: currentStreak >= 4,
      weeklyTrends,
      challenges: [],
      hasData: false,
    };
  }

  // 1) STRENGTH: e1RM สัปดาห์นี้ vs สถิติเดิมทั้งหมด
  const bestBefore = new Map<string, number>();
  for (const l of logs) {
    if (new Date(l.date).getTime() >= weekAgo) continue;
    const e = epley1RM(l.weightLbs, l.reps);
    bestBefore.set(l.exerciseName, Math.max(bestBefore.get(l.exerciseName) ?? 0, e));
  }
  const bestThis = new Map<string, number>();
  for (const l of thisWeek) {
    const e = epley1RM(l.weightLbs, l.reps);
    bestThis.set(l.exerciseName, Math.max(bestThis.get(l.exerciseName) ?? 0, e));
  }
  let prCount = 0;
  let progressSum = 0;
  for (const [name, e] of bestThis) {
    const prev = bestBefore.get(name);
    if (!prev) {
      progressSum += 90;
      prCount++;
    } else if (e > prev) {
      progressSum += 100;
      prCount++;
    } else if (e >= prev * 0.95) {
      progressSum += 80;
    } else {
      progressSum += 55;
    }
  }
  const progress = progressSum / bestThis.size;

  // 2) VOLUME: เซต/กล้ามเนื้อ สัปดาห์นี้
  const muscleSets: Record<string, number> = {};
  for (const l of thisWeek) {
    const ex = exerciseByNameMap.get(l.exerciseName);
    if (!ex) continue;
    for (const m of ex.muscles) {
      const key =
        m.includes("Upper chest") || m === "Chest" || m.includes("Lower chest")
          ? "Chest"
          : m.includes("Lats") || m.includes("back") || m.toLowerCase().includes("traps")
            ? "Back"
            : m.includes("Quads")
              ? "Quads"
              : m.includes("Hamstrings")
                ? "Hamstrings"
                : m.includes("Glutes")
                  ? "Glutes"
                  : m.includes("Side delts")
                    ? "Side delts"
                    : m.includes("Rear delts")
                      ? "Rear delts"
                      : m.includes("Biceps")
                        ? "Biceps"
                        : m.includes("Triceps")
                          ? "Triceps"
                          : m.includes("Abs")
                            ? "Abs"
                            : m.includes("Calves")
                              ? "Calves"
                              : null;
      if (key) muscleSets[key] = (muscleSets[key] ?? 0) + 1;
    }
  }
  const volEntries = Object.values(muscleSets);
  // Volume ใหม่: ไม่ลงโทษคนเล่นเยอะ
  const volume = volEntries.length
    ? volEntries.reduce((s, n) => s + Math.min(100, (n / 12) * 100), 0) / volEntries.length
    : 0;
  const musclesOver10 = volEntries.filter((n) => n >= 10).length;

  // 3) CONSISTENCY: วันฝึกจริง vs แผน
  const uniqueDays = new Set(thisWeek.map((l) => getLocalDateKey(l.date))).size;
  const consistency = Math.min(100, (uniqueDays / Math.max(1, plannedDays)) * 100);

  // 4) COMPLETION: เซตจริง vs เซตแผนทั้งสัปดาห์
  const plannedSets = activePlan.reduce((s, d) => s + d.exercises.reduce((x, e) => x + e.sets, 0), 0);
  const completion = plannedSets > 0 ? Math.min(100, (thisWeek.length / plannedSets) * 100) : 0;

  // 🆕 Recovery score (ประเมินจาก rest days)
  const restDays = 7 - uniqueDays;
  const recovery = restDays >= 2 ? 100 : restDays === 1 ? 75 : 50; // ต้องพักอย่างน้อย 2 วัน

  // สูตรใหม่: สมดุล + มี safety net
  const score = Math.round(
    progress * 0.25 +        // ลดจาก 0.3 (ไม่ให้ progress ครอบงำ)
    volume * 0.25 +          // คงเดิม แต่แก้ cap
    consistency * 0.20 +     // ลดจาก 0.25
    completion * 0.15 +      // คงเดิม
    recovery * 0.10 +        // 🆕 ใหม่! พักผ่อนเพียงพอ = +คะแนน
    streakBonus * 0.05       // 🆕 ใหม่! สัปดาห์ต่อเนื่อง
  );

  // Update latest weekly trend point
  if (weeklyTrends.length > 0) {
    weeklyTrends[weeklyTrends.length - 1].score = score;
  }

  const fatigueWarning = restDays < 2 || (thisWeek.length >= 60 && restDays <= 2);
  const deloadSuggestion = currentStreak >= 4;

  // 🏅 Rank + 💙 คำให้กำลังใจ (คะแนนน้อย = กอดก่อน ไม่ด่า)
  const info =
    score >= 90
      ? { rank: "S+", emoji: "🏆", message: "โหดมาก! สัปดาห์นี้คุณคือเครื่องจักร Progressive Overload ตัวจริง!" }
      : score >= 80
        ? { rank: "S", emoji: "🔥", message: "ยอดเยี่ยม! แรงดีต่อเนื่อง กล้ามเนื้อกำลังโตชัดๆ!" }
        : score >= 70
          ? { rank: "A+", emoji: "💪", message: "เก่งมาก! อีกนิดเดียวแตะระดับ S แล้ว ลุยต่อ!" }
          : score >= 60
            ? { rank: "A", emoji: "✅", message: "มั่นคงมาก! รักษาความสม่ำเสมอแบบนี้ต่อไป!" }
            : score >= 45
              ? { rank: "B+", emoji: "🌱", message: "กำลังมา! เพิ่มน้ำหนักทีละนิด หรือบวกอีก 1 เซตต่อท่า คะแนนก็พุ่งแล้ว!" }
              : { rank: "B", emoji: "🤗", message: "สัปดาห์นี้เหนื่อยหน่อยไม่เป็นไร พักให้พอ นอนดีๆ แล้วกลับมาลุยใหม่ ร่างกายโตตอนพักนะ 💙" };

  const challenges: Challenge[] = [
    { name: "PR Hunter 🎯", desc: "ทำลายสถิติเดิมอย่างน้อย 1 ท่า", done: prCount >= 1, progress: `${Math.min(prCount, 1)}/1` },
    { name: "Full House 🏠", desc: "เล่นครบเซตตามแผนทั้งสัปดาห์", done: completion >= 100, progress: `${thisWeek.length}/${plannedSets}` },
    { name: "Volume King 👑", desc: "เก็บ 10+ เซต ใน 3 กลุ่มกล้ามเนื้อ", done: musclesOver10 >= 3, progress: `${Math.min(musclesOver10, 3)}/3` },
    { name: "Show Up 📅", desc: "เข้ายิมครบตามที่เลือกไว้", done: uniqueDays >= plannedDays, progress: `${uniqueDays}/${plannedDays}` },
  ];

  return {
    score,
    ...info,
    progress,
    volume,
    consistency,
    completion,
    recovery,
    streakBonus,
    restDays,
    uniqueDays,
    totalSets: thisWeek.length,
    currentStreak,
    fatigueWarning,
    deloadSuggestion,
    weeklyTrends,
    challenges,
    hasData: true,
  };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const roundedVal = Math.round(value);
  let statusBadge = "ต้องพักเพิ่ม";
  let barColor = "bg-rose-400";
  let badgeColor = "text-rose-200 border-rose-500/40 bg-rose-950/40";

  if (value >= 80) {
    statusBadge = "ดีเยี่ยม";
    barColor = "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]";
    badgeColor = "text-yellow-300 border-yellow-400/50 bg-yellow-950/40";
  } else if (value >= 60) {
    statusBadge = "ตามเกณฑ์";
    barColor = "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]";
    badgeColor = "text-sky-200 border-sky-400/50 bg-sky-950/40";
  } else if (value >= 40) {
    statusBadge = "ต้องพัฒนา";
    barColor = "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]";
    badgeColor = "text-yellow-200 border-yellow-400/60 bg-yellow-950/40";
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
        <span className="truncate pr-1">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-black border ${badgeColor}`}>
            [{statusBadge}]
          </span>
          <span className="text-zinc-200 font-bold">{roundedVal}</span>
        </div>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyPerformanceMiniChart({ trends }: { trends: WeeklyTrendPoint[] }) {
  if (!trends || trends.length === 0) return null;

  const maxScore = 100;
  const height = 65;
  const width = 280;
  const paddingX = 28;
  const paddingY = 14;

  const stepX = (width - paddingX * 2) / (trends.length - 1);
  const points = trends.map((t, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - (t.score / maxScore) * (height - paddingY * 2);
    return { x, y, score: t.score, label: t.label };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const lastScore = trends[trends.length - 1]?.score ?? 0;
  const prevScore = trends[trends.length - 2]?.score ?? 0;
  const diff = lastScore - prevScore;

  return (
    <div className="mt-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">📈 Progress 4 สัปดาห์</span>
        {prevScore > 0 && lastScore > 0 && (
          <span className={`text-[10px] font-black rounded-md px-1.5 py-0.5 ${diff >= 0 ? "bg-yellow-500/20 text-yellow-300" : "bg-zinc-800 text-zinc-400"}`}>
            {diff >= 0 ? `+${diff}` : diff} pts vs สัปดาห์ก่อน
          </span>
        )}
      </div>

      <div className="mt-2 flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={fillD} fill="url(#trendGrad)" />
          <path d={pathD} fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={p.score > 0 ? 3.5 : 2} fill="#facc15" stroke="#09090b" strokeWidth="2" />
              {p.score > 0 && (
                <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="bold">
                  {p.score}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-1 flex justify-between text-[10px] font-bold text-zinc-400 px-1">
        {trends.map((t, i) => (
          <span key={i} className={i === trends.length - 1 ? "text-yellow-300 font-black" : ""}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeeklyPerformanceCard({ report }: { report: PerformanceReport }) {
  return (
    <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-yellow-300">Weekly Performance</p>
            {report.currentStreak > 0 && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-300">
                🔥 {report.currentStreak}w streak
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-black">{report.hasData ? `${report.score}/100` : "—/100"}</p>
        </div>
        <span className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xl font-black text-yellow-300">
          {report.emoji} {report.rank}
        </span>
      </div>

      {/* Fatigue Warning Banner */}
      {report.fatigueWarning && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-400/50 bg-amber-950/40 p-2.5 text-xs text-amber-200">
          <span className="text-base shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">Fatigue Warning (แจ้งเตือนความล้า)</p>
            <p className="mt-0.5 text-zinc-300 text-[11px] leading-relaxed">
              สัปดาห์นี้เล่นหนักมาก ({report.uniqueDays} วันฝึก / {report.totalSets} เซต) พักเพิ่มอีก 1 วันไหม? กล้ามเนื้อโตตอนพักผ่อนนะ 💙
            </p>
          </div>
        </div>
      )}

      {/* Deload Week Suggestion */}
      {report.deloadSuggestion && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-sky-400/50 bg-sky-950/40 p-2.5 text-xs text-sky-200">
          <span className="text-base shrink-0">🔄</span>
          <div>
            <p className="font-bold text-sky-300">คำแนะนำ Deload Week (สัปดาห์ต่อเนื่อง {report.currentStreak}w)</p>
            <p className="mt-0.5 text-zinc-300 text-[11px] leading-relaxed">
              คุณฝึกหนักต่อเนื่องมา 4+ สัปดาห์แล้ว! แนะนำให้ Deload 1 สัปดาห์ โดยลดน้ำหนักลง 40–50% เพื่อให้ข้อต่อและ CNS ฟื้นตัวเต็มที่
            </p>
          </div>
        </div>
      )}

      {report.hasData && (
        <>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <ScoreBar label="Strength ↑" value={report.progress} />
            <ScoreBar label="Volume" value={report.volume} />
            <ScoreBar label="Consistency" value={report.consistency} />
            <ScoreBar label="Completion" value={report.completion} />
            <ScoreBar label="Recovery 😴" value={report.recovery} />
            <ScoreBar label="Streak 🔥" value={report.streakBonus} />
          </div>

          <WeeklyPerformanceMiniChart trends={report.weeklyTrends} />

          <div className="mt-3 space-y-2">
            {report.challenges.map((c) => (
              <div
                key={c.name}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${c.done ? "bg-yellow-500/10 text-yellow-300" : "bg-zinc-950 text-zinc-400"}`}
              >
                <span className="font-bold">{c.done ? "✅" : "⬜"} {c.name}</span>
                <span className="text-[10px] font-black">{c.progress}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-3 rounded-xl bg-zinc-950 px-3 py-2 text-xs text-zinc-300">{report.message}</p>
    </div>
  );
}

function ConfettiCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#fbbf24"];
    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.5,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 3,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 10,
    }));

    let animId: number;
    const startTime = Date.now();

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;
      const opacity = Math.max(0, 1 - elapsed / 3500);

      ctx.save();
      ctx.globalAlpha = opacity;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      ctx.restore();

      if (elapsed < 3500) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[120]" />;
}

function PrCelebrationModal({
  pr,
  bodyweightKg,
  onClose,
}: {
  pr: {
    exerciseName: string;
    machine?: string;
    recordType: "weight" | "reps" | "volume";
    oldVal: string;
    newVal: string;
  };
  bodyweightKg: number | null;
  onClose: () => void;
}) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 200]);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <ConfettiCanvas />
      <div className="relative w-full max-w-sm rounded-3xl border border-yellow-500/40 bg-zinc-950 p-6 text-center shadow-2xl shadow-yellow-500/20 animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-4xl shadow-lg shadow-yellow-500/20">
          🏆
        </div>

        <p className="mt-4 text-xs font-black uppercase tracking-widest text-yellow-400 font-bold">Personal Record!</p>
        <h3 className="mt-1 text-2xl font-black text-white">{pr.exerciseName}</h3>
        {pr.machine && (
          <span className="mt-1 inline-block rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-bold text-zinc-300">
            {pr.machine}
          </span>
        )}

        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {pr.recordType === "weight" ? "Max Weight Record" : pr.recordType === "reps" ? "Best Reps Record" : "Volume Record"}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
            <span>เดิม: {pr.oldVal}</span>
          </div>
          <div className="mt-1 flex items-center justify-between font-black text-yellow-300 text-sm">
            <span>ใหม่: {pr.newVal}</span>
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">PR 💥</span>
          </div>
        </div>

        {bodyweightKg && pr.recordType === "weight" && (
          <p className="mt-3 text-xs text-zinc-400">
            🏋️ Relative Strength:{" "}
            <span className="font-black text-yellow-300">
              {(Number(pr.newVal.split(" ")[0]) / bodyweightKg).toFixed(2)}x Bodyweight
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-yellow-400 text-black font-black py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-yellow-500/25 transition active:scale-95 hover:bg-yellow-300"
        >
          ลุยต่อเลย! 🔥
        </button>
      </div>
    </div>
  );
}

function BodyweightModal({
  currentWeight,
  logs,
  recordsMap,
  onSave,
  onClose,
}: {
  currentWeight: number | null;
  logs: BodyweightLog[];
  recordsMap: Record<string, ExerciseRecords>;
  onSave: (kg: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(currentWeight ? String(currentWeight) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);
    if (!isNaN(num) && num > 20 && num < 300) {
      onSave(Math.round(num * 10) / 10);
      onClose();
    }
  };

  const compoundExercises = [
    { name: "Barbell Bench Press", label: "Bench Press", key: "Barbell Bench Press" },
    { name: "Barbell Back Squat", label: "Back Squat", key: "Barbell Back Squat" },
    { name: "Barbell Deadlift", label: "Deadlift", key: "Barbell Deadlift" },
    { name: "Overhead Barbell Press", label: "Overhead Press", key: "Overhead Barbell Press" },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-2xl">
            ⚖️
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Bodyweight Tracking</h3>
            <p className="text-xs text-zinc-400">บันทึกน้ำหนักตัว & คำนวณความแข็งแกร่ง</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide">น้ำหนักตัวปัจจุบัน (กก. / kg)</label>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="เช่น 72.5"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base font-black text-white outline-none focus:border-yellow-400"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-2xl bg-yellow-400 text-black font-black px-5 font-black text-zinc-950 hover:bg-yellow-300 transition active:scale-95"
            >
              บันทึก
            </button>
          </div>
        </form>

        {currentWeight && (
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">🏋️ Relative Strength ({currentWeight} kg)</p>
            <div className="mt-3 space-y-2">
              {compoundExercises.map((c) => {
                const rec = recordsMap[c.key]?.maxWeight;
                if (!rec) return null;
                const prKg = Math.round(rec.weightLbs * 0.453592 * 10) / 10;
                const ratio = (prKg / currentWeight).toFixed(2);
                return (
                  <div key={c.key} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{c.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">{prKg} kg</span>
                      <span className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 font-black text-yellow-300">
                        {ratio}x BW
                      </span>
                    </div>
                  </div>
                );
              })}
              {!compoundExercises.some((c) => recordsMap[c.key]?.maxWeight) && (
                <p className="text-[11px] text-zinc-500">บันทึกเซต Compound เพื่อดูอัตราส่วนความแข็งแกร่งต่อน้ำหนักตัว</p>
              )}
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">ประวัติน้ำหนักย้อนหลัง</p>
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {logs.slice(0, 5).map((l, i) => (
                <div key={i} className="flex justify-between rounded-xl bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400">
                  <span>{new Date(l.date).toLocaleDateString("th-TH", { month: "short", day: "numeric" })}</span>
                  <span className="font-bold text-zinc-200">{l.weightKg} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type StrengthTier = "Beginner" | "Intermediate" | "Advanced" | "Elite";

export function evaluateRelativeStrength(
  exerciseName: string,
  loadType: LoadType,
  e1RMLbs: number,
  userBwLbs: number,
  gender: "male" | "female" = "male",
  unit: "kg" | "lbs" = "lbs",
  prescriptionReps = "8 to 12",
  userExperienceMonths = 12,
  forcedTier?: "Beginner" | "Intermediate" | "Advanced" | "Elite",
  userMuscleMassKg?: number
) {
  const n = exerciseName.toLowerCase();

  // 1. Precise Equipment & Biomechanical Flags
  const isExplicitMachine = loadType === "selectorized" || loadType === "plate-loaded" || loadType === "cable" || loadType === "smith";
  
  // Specific single-hand rows and pull movements
  const isSpecificSingleArm = n.includes("one arm") || n.includes("1 arm") || n.includes("meadows row") || n.includes("kroc row") || n.includes("bayesian");
  
  // Dumbbell flag (excludes explicit machines, but covers movements identified as dumbbell)
  const isDumbbell = loadType === "dumbbell" || (!isExplicitMachine && (n.includes("db ") || n.includes("db") || n.includes("dumbbell")));
  
  // Accurately capture ALL unilateral movements (single arm cables, lunges, step ups, kickbacks, single-leg, meadows, kroc)
  const isSingleArmLeg = !isDumbbell && (
    isSpecificSingleArm ||
    n.includes("single leg") || n.includes("bulgarian") || 
    n.includes("lunge") || n.includes("step up") ||
    n.includes("kickback") || n.includes("cable lat raise") || 
    n.includes("behind back cable") || n.includes("b-stance")
  );
  
  const isWeightedBodyweight = n.includes("weighted dip") || n.includes("weighted pull up");
  const isChestSupported = n.includes("chest supported") || n.includes("seal row") || n.includes("t-bar");
  const isBarbell = loadType === "barbell" && !isChestSupported;

  // 2. Physiological Muscle Mass Estimation (If user does not know InBody / SMM)
  const userBwKg = userBwLbs * 0.453592;
  const baseRatio = gender === "female" ? 0.28 : 0.38;
  const expBonus = gender === "female"
    ? Math.min(0.08, userExperienceMonths * 0.0012)
    : Math.min(0.10, userExperienceMonths * 0.0015);
  
  const effectiveSmmKg = userMuscleMassKg && userMuscleMassKg > 15
    ? userMuscleMassKg
    : userBwKg * (baseRatio + expBonus);
  
  const muscleEfficiencyModifier = Math.min(1.25, Math.max(0.75, effectiveSmmKg / (userBwKg * (gender === "female" ? 0.30 : 0.40))));

  // 3. Continuous Allometric Bodyweight Scaling (Smooth curve across all weights: 45kg to 130kg+)
  const baseRefLbs = gender === "female" ? 132.28 : 165.35;
  const safeUserBw = userBwLbs > 0 ? userBwLbs : baseRefLbs;
  const effectiveBwLbs = (baseRefLbs * Math.pow(safeUserBw / baseRefLbs, 0.67)) * muscleEfficiencyModifier;

  // 4. Ergonomically Calibrated Thresholds [Novice->Inter, Inter->Adv, Adv->Elite]
  let baseThresholds: [number, number, number];

  // -------------------------------------------------------------
  // 1. CHEST (24 Exercises)
  // -------------------------------------------------------------
  if (n === "bench press" || (n.includes("bench press") && !n.includes("incline") && !n.includes("decline") && !n.includes("smith") && !n.includes("close-grip") && !n.includes("db"))) {
    baseThresholds = [0.65, 0.92, 1.20];
  } else if (n.includes("incline barbell") || (n.includes("incline") && n.includes("bench") && isBarbell)) {
    baseThresholds = [0.58, 0.84, 1.10];
  } else if (n.includes("decline bench press") || (n.includes("decline") && n.includes("bench") && isBarbell)) {
    baseThresholds = [0.70, 1.00, 1.30];
  } else if (n.includes("flat db press") || (isDumbbell && (n.includes("flat") || (!n.includes("incline") && !n.includes("shoulder") && !n.includes("overhead"))) && (n.includes("press") || n.includes("bench")))) {
    baseThresholds = [0.36, 0.54, 0.72];
  } else if (n.includes("incline db press") || (isDumbbell && n.includes("incline") && (n.includes("press") || n.includes("bench")))) {
    baseThresholds = [0.36, 0.54, 0.72];
  } else if (n.includes("db flye") || (isDumbbell && n.includes("flye"))) {
    baseThresholds = [0.12, 0.19, 0.26];
  } else if (n.includes("pin-loaded chest press")) {
    baseThresholds = [0.58, 0.85, 1.12];
  } else if (n.includes("plate-loaded chest press")) {
    baseThresholds = [0.62, 0.90, 1.18];
  } else if (n.includes("converging cable chest press") || n.includes("converging cable")) {
    baseThresholds = [0.32, 0.48, 0.64];
  } else if (n.includes("incline converging chest press") || (n.includes("converging") && n.includes("incline"))) {
    baseThresholds = [0.30, 0.45, 0.60];
  } else if (n.includes("incline machine bench") || (n.includes("incline") && (n.includes("machine") || loadType === "selectorized") && (n.includes("press") || n.includes("bench")))) {
    baseThresholds = [0.50, 0.75, 0.98];
  } else if (n.includes("decline machine press") || (n.includes("decline") && (n.includes("machine") || loadType === "selectorized" || loadType === "plate-loaded") && n.includes("press"))) {
    baseThresholds = [0.70, 1.02, 1.35];
  } else if (n.includes("iso-lateral incline press") || (n.includes("iso") && n.includes("incline") && n.includes("press"))) {
    baseThresholds = [0.52, 0.76, 1.00];
  } else if (n.includes("iso-lateral chest press") || (n.includes("iso") && n.includes("chest press"))) {
    baseThresholds = [0.62, 0.90, 1.18];
  } else if (n.includes("machine chest press") || ((n.includes("chest press") || n.includes("machine press")) && !isDumbbell && !isBarbell)) {
    baseThresholds = [0.60, 0.88, 1.15];
  } else if (n.includes("incline smith machine") || (n.includes("smith") && n.includes("incline") && n.includes("bench"))) {
    baseThresholds = [0.60, 0.86, 1.12];
  } else if (n.includes("smith machine floor press") || (n.includes("smith") && n.includes("floor"))) {
    baseThresholds = [0.62, 0.90, 1.18];
  } else if (n.includes("smith machine press") || (n.includes("smith") && (n.includes("bench") || (n.includes("press") && !n.includes("shoulder"))))) {
    baseThresholds = [0.68, 0.96, 1.25];
  } else if (n.includes("pec deck")) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("seated cable pec flye") || (n.includes("cable") && n.includes("pec flye"))) {
    baseThresholds = [0.15, 0.24, 0.32];
  } else if (n.includes("low-to-high cable flye") || (n.includes("low") && n.includes("high") && n.includes("flye"))) {
    baseThresholds = [0.14, 0.22, 0.30];
  } else if (n.includes("high-to-low cable flye") || (n.includes("high") && n.includes("low") && n.includes("flye"))) {
    baseThresholds = [0.16, 0.26, 0.35];
  } else if (n.includes("cable crossover") || (n.includes("cable") && n.includes("flye"))) {
    baseThresholds = [0.15, 0.24, 0.32];
  } else if (n.includes("weighted dip")) {
    baseThresholds = [0.08, 0.20, 0.32];

  // -------------------------------------------------------------
  // 2. BACK (23 Exercises)
  // -------------------------------------------------------------
  } else if (n.includes("chest supported t-bar row") || (n.includes("t-bar") && (n.includes("supported") || n.includes("chest")))) {
    baseThresholds = [0.26, 0.40, 0.54]; // Single-sleeve central plate weight (Not divided by 2)
  } else if (n.includes("chest supported row") || (n.includes("chest supported") && isDumbbell)) {
    baseThresholds = [0.26, 0.40, 0.54]; // DB Row prone (Divided by 2 per hand)
  } else if (n.includes("seal row")) {
    baseThresholds = [0.48, 0.70, 0.92];
  } else if (n.includes("machine high row")) {
    baseThresholds = [0.45, 0.66, 0.86];
  } else if (n.includes("iso-lateral low row") || (n.includes("iso") && n.includes("low row"))) {
    baseThresholds = [0.46, 0.68, 0.88];
  } else if (n.includes("wide grip cable row") || (n.includes("wide") && n.includes("cable row"))) {
    baseThresholds = [0.35, 0.52, 0.70];
  } else if (n.includes("cable row") || (n.includes("seated cable") && n.includes("row"))) {
    baseThresholds = [0.38, 0.56, 0.75];
  } else if (n.includes("deficit pendlay row") || n.includes("pendlay")) {
    baseThresholds = [0.48, 0.70, 0.92];
  } else if (n.includes("barbell bent-over row") || (n.includes("bent") && n.includes("row")) || (isBarbell && n.includes("row"))) {
    baseThresholds = [0.50, 0.72, 0.95];
  } else if (n.includes("meadows row")) {
    baseThresholds = [0.28, 0.44, 0.60];
  } else if (n.includes("kroc row")) {
    baseThresholds = [0.42, 0.62, 0.82];
  } else if (n.includes("one arm db row") || (isDumbbell && n.includes("row"))) {
    baseThresholds = [0.38, 0.56, 0.75];
  } else if (n.includes("neutral grip lat pull down") || (n.includes("neutral") && (n.includes("pulldown") || n.includes("pull down")))) {
    baseThresholds = [0.45, 0.66, 0.86];
  } else if (n.includes("iso-lateral pulldown") || (n.includes("iso") && (n.includes("pulldown") || n.includes("pull down")))) {
    baseThresholds = [0.46, 0.68, 0.88];
  } else if (n.includes("widegrip lat pull down") || (n.includes("wide") && (n.includes("pulldown") || n.includes("pull down")))) {
    baseThresholds = [0.42, 0.62, 0.82];
  } else if (n.includes("one arm lat pull down") || (n.includes("one arm") && (n.includes("pulldown") || n.includes("pull down")))) {
    baseThresholds = [0.22, 0.34, 0.46];
  } else if (n.includes("weighted pull up")) {
    baseThresholds = [0.08, 0.20, 0.32];
  } else if (n.includes("assisted pull up machine") || n.includes("assisted pull")) {
    baseThresholds = [0.35, 0.52, 0.70];
  } else if (n.includes("straight arm pulldown") || n.includes("straight arm")) {
    baseThresholds = [0.20, 0.32, 0.44];
  } else if (n.includes("cable lat prayers") || n.includes("prayers")) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("pullover") || n.includes("pullovers")) {
    baseThresholds = [0.22, 0.34, 0.46];
  } else if (n.includes("smith machine shrug") || (n.includes("smith") && n.includes("shrug"))) {
    baseThresholds = [0.65, 0.95, 1.30];
  } else if (n.includes("shrug")) {
    baseThresholds = [0.60, 0.90, 1.25];
  } else if (n.includes("pulldown") || n.includes("pull down") || n.includes("pull up") || n.includes("chin")) {
    baseThresholds = [0.45, 0.66, 0.86];
  } else if (n.includes("row")) {
    baseThresholds = isBarbell ? [0.50, 0.72, 0.95] : [0.38, 0.56, 0.75];

  // -------------------------------------------------------------
  // 3. LEGS & LOWER BODY (32 Exercises)
  // -------------------------------------------------------------
  } else if (n.includes("hack squat") || n.includes("hack")) {
    baseThresholds = [0.85, 1.25, 1.65];
  } else if (n.includes("belt squat")) {
    baseThresholds = [0.80, 1.20, 1.55];
  } else if (n.includes("pendulum squat") || n.includes("pendulum")) {
    baseThresholds = [0.85, 1.25, 1.65];
  } else if (n.includes("v-squat machine") || n.includes("v-squat")) {
    baseThresholds = [0.80, 1.18, 1.52];
  } else if (n.includes("barbell back squat") || (isBarbell && n.includes("back squat")) || n === "squat") {
    baseThresholds = [0.75, 1.08, 1.40];
  } else if (n.includes("front squat")) {
    baseThresholds = [0.68, 0.98, 1.28];
  } else if (n.includes("smith machine squat feet forward") || (n.includes("smith") && n.includes("feet forward"))) {
    baseThresholds = [0.75, 1.10, 1.45];
  } else if (n.includes("smith machine squat") || (n.includes("smith") && n.includes("squat"))) {
    baseThresholds = [0.80, 1.15, 1.50];
  } else if (n.includes("45° leg press high foot") || (n.includes("leg press") && n.includes("high foot"))) {
    baseThresholds = [1.20, 1.75, 2.30];
  } else if (n.includes("leg press") && !n.includes("calf")) {
    baseThresholds = [1.30, 1.90, 2.50];
  } else if (n.includes("bulgarian split squat") || n.includes("bulgarian")) {
    baseThresholds = [0.22, 0.35, 0.48];
  } else if (n.includes("smith machine lunge ffe") || (n.includes("smith") && n.includes("lunge"))) {
    baseThresholds = [0.25, 0.40, 0.55];
  } else if (n.includes("lunge") || n.includes("lunges")) {
    baseThresholds = [0.20, 0.32, 0.44];
  } else if (n.includes("step ups") || n.includes("step up")) {
    baseThresholds = [0.20, 0.32, 0.44];
  } else if (n.includes("leg extension")) {
    baseThresholds = [0.30, 0.46, 0.62];
  } else if (n.includes("reverse nordic")) {
    baseThresholds = [0.15, 0.30, 0.45];
  } else if (n.includes("sissy squat")) {
    baseThresholds = [0.12, 0.25, 0.38];
  } else if (n.includes("seated hamstring curl") || (n.includes("seated") && n.includes("hamstring"))) {
    baseThresholds = [0.26, 0.40, 0.54];
  } else if (n.includes("lying leg curl") || n.includes("leg curl") || n.includes("hamstring curl")) {
    baseThresholds = [0.24, 0.38, 0.52];
  } else if (n.includes("nordic hamstring curl") || n.includes("nordic")) {
    baseThresholds = [0.18, 0.35, 0.50];
  } else if (n.includes("smith machine rdl") || (n.includes("smith") && n.includes("rdl"))) {
    baseThresholds = [0.92, 1.35, 1.75];
  } else if (n.includes("b-stance rdl") || n.includes("b-stance")) {
    baseThresholds = [0.45, 0.68, 0.90];
  } else if (n.includes("romanian deadlift") || n.includes("rdl")) {
    baseThresholds = [0.90, 1.30, 1.70];
  } else if (n.includes("trap bar deadlift") || n.includes("trap bar")) {
    baseThresholds = [1.00, 1.48, 1.95];
  } else if (n.includes("deadlift")) {
    baseThresholds = [0.95, 1.40, 1.85];
  } else if (n.includes("cable pull through") || n.includes("pull through")) {
    baseThresholds = [0.25, 0.40, 0.55];
  } else if (n.includes("glute hyperextension") || (n.includes("glute") && n.includes("hyperextension"))) {
    baseThresholds = [0.20, 0.35, 0.50];
  } else if (n.includes("45° back extension") || n.includes("back extension") || n.includes("hyperextension")) {
    baseThresholds = [0.20, 0.35, 0.50];
  } else if (n.includes("machine hip thrust") || n.includes("hip thrust")) {
    baseThresholds = [0.90, 1.35, 1.75];
  } else if (n.includes("kickbacks") || n.includes("kickback")) {
    baseThresholds = [0.12, 0.20, 0.28];
  } else if (n.includes("hip abduction") || n.includes("abduction")) {
    baseThresholds = [0.30, 0.45, 0.60];
  } else if (n.includes("hip adduction") || n.includes("adduction")) {
    baseThresholds = [0.30, 0.45, 0.60];

  // -------------------------------------------------------------
  // 4. SHOULDERS (14 Exercises)
  // -------------------------------------------------------------
  } else if (n.includes("smith machine shoulder press") || (n.includes("smith") && n.includes("shoulder"))) {
    baseThresholds = [0.42, 0.60, 0.78];
  } else if (n.includes("machine shoulder press") || (!isDumbbell && !isBarbell && n.includes("shoulder press"))) {
    baseThresholds = [0.40, 0.58, 0.75];
  } else if (n.includes("seated db overhead press") || (isDumbbell && (n.includes("overhead press") || n.includes("shoulder press")))) {
    baseThresholds = [0.32, 0.48, 0.64];
  } else if (n.includes("barbell overhead press") || (isBarbell && (n.includes("overhead press") || n.includes("military")))) {
    baseThresholds = [0.36, 0.54, 0.70];
  } else if (n.includes("behind back cable lat raise") || (n.includes("behind back") && n.includes("cable"))) {
    baseThresholds = [0.06, 0.10, 0.14];
  } else if (n.includes("cable lat raise")) {
    baseThresholds = [0.06, 0.10, 0.14];
  } else if (n.includes("atlantis machine lat raise") || (n.includes("machine") && (n.includes("lat raise") || n.includes("lateral raise")))) {
    baseThresholds = [0.08, 0.13, 0.18];
  } else if (n.includes("lean in db raise") || (n.includes("lean in") && n.includes("raise"))) {
    baseThresholds = [0.07, 0.11, 0.15];
  } else if (n.includes("db lateral raise") || n.includes("lat raise") || n.includes("lateral raise")) {
    baseThresholds = [0.06, 0.10, 0.14];
  } else if (n.includes("cable y raise") || n.includes("y raise")) {
    baseThresholds = [0.08, 0.13, 0.18];
  } else if (n.includes("reverse pec deck")) {
    baseThresholds = [0.12, 0.19, 0.26];
  } else if (n.includes("reverse cable crossover")) {
    baseThresholds = [0.12, 0.19, 0.26];
  } else if (n.includes("rope face pull") || n.includes("face pull")) {
    baseThresholds = [0.14, 0.22, 0.30];
  } else if (n.includes("db rear delt flye") || n.includes("rear delt")) {
    baseThresholds = [0.10, 0.16, 0.22];

  // -------------------------------------------------------------
  // 5. ARMS (18 Exercises)
  // -------------------------------------------------------------
  } else if (n.includes("overhead cable ext") || (n.includes("cable") && n.includes("overhead") && n.includes("ext"))) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("katana cable") || n.includes("katana")) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("1 arm db overhead") || (isDumbbell && n.includes("overhead") && (n.includes("tricep") || n.includes("ext")))) {
    baseThresholds = [0.16, 0.25, 0.34];
  } else if (n.includes("barbell skullcrusher") || (isBarbell && n.includes("skullcrusher"))) {
    baseThresholds = [0.22, 0.32, 0.44];
  } else if (n.includes("db skullcrusher") || (isDumbbell && n.includes("skullcrusher"))) {
    baseThresholds = [0.20, 0.30, 0.40];
  } else if (n.includes("machine triceps extension") || (n.includes("machine") && n.includes("tricep"))) {
    baseThresholds = [0.22, 0.32, 0.44];
  } else if (n.includes("triceps pressdown bar") || n.includes("pressdown bar")) {
    baseThresholds = [0.22, 0.32, 0.44];
  } else if (n.includes("rope tricep pushdown") || (n.includes("rope") && (n.includes("pushdown") || n.includes("pressdown")))) {
    baseThresholds = [0.20, 0.30, 0.40];
  } else if (n.includes("close-grip bench press") || n.includes("close-grip")) {
    baseThresholds = [0.50, 0.72, 0.95];
  } else if (n.includes("face away bayesian curl") || n.includes("bayesian")) {
    baseThresholds = [0.16, 0.25, 0.34];
  } else if (n.includes("incline curl")) {
    baseThresholds = [0.15, 0.24, 0.32];
  } else if (n.includes("standing db curl")) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("ez bar curl") || (n.includes("ez") && n.includes("curl"))) {
    baseThresholds = [0.22, 0.32, 0.44];
  } else if (n.includes("db preacher curl")) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("machine preacher curl")) {
    baseThresholds = [0.20, 0.30, 0.40];
  } else if (n.includes("db hammer curl")) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("cable rope hammer curl") || (n.includes("rope") && n.includes("hammer"))) {
    baseThresholds = [0.18, 0.28, 0.38];
  } else if (n.includes("straight bar cable curl") || (n.includes("straight bar") && n.includes("curl"))) {
    baseThresholds = [0.20, 0.30, 0.40];
  } else if (n.includes("curl")) {
    baseThresholds = isDumbbell ? [0.18, 0.28, 0.38] : [0.22, 0.32, 0.44];
  } else if (n.includes("tricep") || n.includes("extension") || n.includes("pushdown") || n.includes("pressdown")) {
    baseThresholds = [0.20, 0.30, 0.40];

  // -------------------------------------------------------------
  // 6. ABS & CALVES (9 Exercises)
  // -------------------------------------------------------------
  } else if (n.includes("cable crunch")) {
    baseThresholds = [0.25, 0.40, 0.55];
  } else if (n.includes("machine abs crunch") || n.includes("abs crunch") || n.includes("crunch")) {
    baseThresholds = [0.25, 0.40, 0.55];
  } else if (n.includes("hanging knee raise")) {
    baseThresholds = [0.10, 0.25, 0.40];
  } else if (n.includes("captain's chair knee raise") || n.includes("captain")) {
    baseThresholds = [0.10, 0.25, 0.40];
  } else if (n.includes("hanging leg raise")) {
    baseThresholds = [0.12, 0.28, 0.42];
  } else if (n.includes("ab wheel rollout") || n.includes("ab wheel")) {
    baseThresholds = [0.12, 0.28, 0.42];
  } else if (n.includes("seated calf raise") || (n.includes("seated") && n.includes("calf"))) {
    baseThresholds = [0.75, 1.10, 1.45];
  } else if (n.includes("standing calf raise") || (n.includes("standing") && n.includes("calf"))) {
    baseThresholds = [0.80, 1.20, 1.60];
  } else if (n.includes("leg press calf raise") || (n.includes("leg press") && n.includes("calf"))) {
    baseThresholds = [1.00, 1.45, 1.90];
  } else if (n.includes("calf")) {
    baseThresholds = [0.75, 1.10, 1.45];
  } else {
    baseThresholds = [0.25, 0.40, 0.55];
  }

  // 5. Gender Scaling Factor
  const femaleFactor = gender === "female" ? 0.70 : 1.0;
  const thresholds = baseThresholds.map((t) => Math.round(t * femaleFactor * 100) / 100);

  // 6. Active Tier Determination
  let tier: "Beginner" | "Intermediate" | "Advanced" | "Elite" = "Beginner";
  const hasHistory = Number.isFinite(e1RMLbs) && e1RMLbs > 0;

  const rawRatio = effectiveBwLbs > 0 ? e1RMLbs / effectiveBwLbs : 0;
  const effectiveRatioForTier = (!isWeightedBodyweight && (isDumbbell || isSingleArmLeg))
    ? rawRatio * 2
    : rawRatio;

  if (forcedTier) {
    tier = forcedTier;
  } else if (!hasHistory) {
    tier = userExperienceMonths >= 36 ? "Advanced" : userExperienceMonths >= 12 ? "Intermediate" : "Beginner";
  } else {
    if (effectiveRatioForTier >= thresholds[2]) tier = "Elite";
    else if (effectiveRatioForTier >= thresholds[1]) tier = "Advanced";
    else if (effectiveRatioForTier >= thresholds[0]) tier = "Intermediate";
    else tier = "Beginner";
  }

  // 5. Separate Ratio for "Starting Prescription" vs "Next Tier Target"
  let prescriptionRatio: number;
  let nextTierLabel = "Intermediate";

  if (!hasHistory) {
    prescriptionRatio = tier === "Beginner" 
      ? thresholds[0] * 0.75 
      : tier === "Intermediate" 
      ? thresholds[0] 
      : tier === "Advanced" 
      ? thresholds[1] 
      : thresholds[2];
    nextTierLabel = tier === "Beginner" ? "Intermediate" : tier === "Intermediate" ? "Advanced" : "Elite";
  } else {
    if (tier === "Beginner") {
      prescriptionRatio = thresholds[0];
      nextTierLabel = "Intermediate";
    } else if (tier === "Intermediate") {
      prescriptionRatio = thresholds[1];
      nextTierLabel = "Advanced";
    } else if (tier === "Advanced") {
      prescriptionRatio = thresholds[2];
      nextTierLabel = "Elite";
    } else {
      prescriptionRatio = thresholds[2];
      nextTierLabel = "ระดับสูงสุด";
    }
  }

  // 6. Target Working Reps from prescription
  const repMatch = prescriptionReps.match(/\d+/g);
  const targetWorkingReps = repMatch ? parseInt(repMatch[0], 10) : 8;

  // 7. Reverse Epley Target Weight Computation
  const targetTotalE1RMLbs = prescriptionRatio * effectiveBwLbs;
  let targetTotalWorkingLbs = targetTotalE1RMLbs / (1 + targetWorkingReps / 30);

  // Divide by 2 for dumbbells and single limb movements
  if (!isWeightedBodyweight && (isDumbbell || isSingleArmLeg)) {
    targetTotalWorkingLbs = targetTotalWorkingLbs / 2;
  }

  // 7. Snap to Standard Gym Steps
  let targetDisplayWeight: number;
  if (unit === "kg") {
    const targetWorkingKg = targetTotalWorkingLbs * 0.453592;
    const step = isDumbbell ? 1 : 2.5;
    targetDisplayWeight = Math.max(step, Math.round(targetWorkingKg / step) * step);
    targetDisplayWeight = Math.round(targetDisplayWeight * 10) / 10;
  } else {
    const step = isDumbbell ? 2.5 : 5;
    targetDisplayWeight = Math.max(step, Math.round(targetTotalWorkingLbs / step) * step);
    targetDisplayWeight = Math.round(targetDisplayWeight * 10) / 10;
  }

  const labelMap = {
    Beginner: "🌱 NOVICE",
    Intermediate: "💪 INTERMEDIATE",
    Advanced: "🔥 ADVANCED",
    Elite: "🏆 ELITE",
  };

  const badgeClassMap = {
    Beginner: "border-zinc-800 bg-zinc-950 text-zinc-400",
    Intermediate: "border-yellow-500/40 bg-zinc-900 text-yellow-400",
    Advanced: "border-zinc-500 bg-zinc-800 text-zinc-100",
    Elite: "border-yellow-400 bg-yellow-400/20 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.25)]",
  };

  // Only true iso-lateral dual-handled machines display "ข้างละ" (Exclude single-sleeve T-Bar)
  const isIsoLateral = loadType === "plate-loaded" && (n.includes("iso-lateral") || n.includes("iso ")) && !n.includes("t-bar");
  
  let sideDetail = "";
  if (isDumbbell || isSingleArmLeg) {
    sideDetail = " (ต่อข้าง)";
  } else if (isIsoLateral) {
    const perSide = Math.round((targetDisplayWeight / 2) * 10) / 10;
    sideDetail = ` (ข้างละ ${perSide} ${unit})`;
  } else if (isWeightedBodyweight) {
    sideDetail = " (แผ่นถ่วงเพิ่ม)";
  }

  let actionableMessage = "";
  if (tier === "Elite" && hasHistory) {
    actionableMessage = "🏆 ระดับสูงสุด (Elite): มุ่งเน้นการรักษาฟอร์มและการพัฒนาต่อเนื่อง";
  } else if (!hasHistory) {
    actionableMessage = `🎯 แนะนำเริ่มต้น (${tier}): ยก ${targetDisplayWeight} ${unit}${sideDetail} × ${targetWorkingReps} ครั้ง`;
  } else {
    actionableMessage = `🎯 สู่ระดับ ${nextTierLabel}: ยก ${targetDisplayWeight} ${unit}${sideDetail} × ${targetWorkingReps} ครั้ง`;
  }

  const ratio = effectiveBwLbs > 0 ? e1RMLbs / effectiveBwLbs : 0;

  return {
    tier,
    label: labelMap[tier],
    badgeClass: badgeClassMap[tier],
    actionableMessage,
    targetDisplayWeight,
    targetWorkingReps,
    nextTierLabel,
    ratio,
  };
}

function playCountdownBeep(freq = 660) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {}
}

export default function Page() {
  const initialUiState = sanitizeUiState(readJson<PersistedUiState | null>(UI_STATE_KEY, null));

  const [mode, setMode] = useState<AppMode>(initialUiState.mode);
  const [days, setDays] = useState<3 | 4 | 5>(initialUiState.days);
  const [fiveDayMode, setFiveDayMode] = useState<"twoLegDays" | "oneLegDay">(initialUiState.fiveDayMode);
  const [selectedDay, setSelectedDay] = useState(initialUiState.selectedDay);
  const [logs, setLogs] = useState<LogSet[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, ExerciseRecords>>(() => loadPermanentRecords());
  const [historyRange, setHistoryRange] = useState<"all" | "30d" | "14d">("all");
  const [machineTags, setMachineTags] = useState<Record<string, string>>(() => readJson<Record<string, string>>(MACHINE_TAGS_KEY, {}));
  const [favoriteMachines, setFavoriteMachines] = useState<Record<string, string>>(() => readJson<Record<string, string>>(FAVORITE_MACHINES_KEY, {}));
  const [inputs, setInputs] = useState<Record<string, SetInput[]>>(() => readJson<Record<string, SetInput[]>>(SET_INPUTS_KEY, {}));
  const [restTimer, setRestTimer] = useState<RestTimerState>(() => {
    const saved = readJson<RestTimerState | null>(REST_TIMER_KEY, null);
    if (saved && saved.running && saved.targetEndTimestamp) {
      const remaining = Math.max(0, Math.ceil((saved.targetEndTimestamp - Date.now()) / 1000));
      if (remaining > 0) {
        return {
          ...saved,
          secondsLeft: remaining,
        };
      }
    }
    return { exerciseId: null, secondsLeft: 0, totalSeconds: 0, running: false };
  });
  const [restTimerEnabled, setRestTimerEnabled] = useState(true);
  const [restModeMap, setRestModeMap] = useState<Record<string, RestMode>>({});
  const [customRestMap, setCustomRestMap] = useState<Record<string, number>>({});
  const [librarySearch, setLibrarySearch] = useState("");
  const [showLibrary, setShowLibrary] = useState(initialUiState.showLibrary);
  const [showHistory, setShowHistory] = useState(initialUiState.showHistory);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>(() => readJson<CustomPlan[]>(CUSTOM_PLANS_KEY, [createStarterCustomPlan()]));
  const [selectedCustomPlanId, setSelectedCustomPlanId] = useState<string | null>(initialUiState.selectedCustomPlanId);
  const [selectedCustomDay, setSelectedCustomDay] = useState(initialUiState.selectedCustomDay);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseGroupFilter, setExerciseGroupFilter] = useState<MuscleGroup | "All">("All");
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(initialUiState.activeExerciseIndex ?? 0);
  const [compactList, setCompactList] = useState(true);
  const [substituteMap, setSubstituteMap] = useState<Record<string, string>>(() => readJson<Record<string, string>>(SUBSTITUTE_KEY, {}));
  const [presetSetsMap, setPresetSetsMap] = useState<Record<string, number>>(() => readJson<Record<string, number>>(PRESET_SETS_KEY, {}));
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>(() => readJson<CardioLog[]>(CARDIO_LOGS_KEY, []));
  const [manualTierMap, setManualTierMap] = useState<Record<string, "Beginner" | "Intermediate" | "Advanced" | "Elite">>({});

  // Active Session Engine & Accordion States (Hevy/Strong Style)
  const savedActiveSession = useMemo(() => {
    return readJson<{ isRunning: boolean; elapsedSeconds: number; lastSavedAt: number } | null>(ACTIVE_SESSION_KEY, null);
  }, []);

  const [isSessionRunning, setIsSessionRunning] = useState<boolean>(() => {
    return savedActiveSession?.isRunning ?? false;
  });

  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(() => {
    if (!savedActiveSession) return 0;
    if (savedActiveSession.isRunning && savedActiveSession.lastSavedAt) {
      const additionalSec = Math.floor((Date.now() - savedActiveSession.lastSavedAt) / 1000);
      return Math.max(0, (savedActiveSession.elapsedSeconds || 0) + additionalSec);
    }
    return savedActiveSession.elapsedSeconds || 0;
  });

  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [showFinishCelebration, setShowFinishCelebration] = useState(false);
  const [finishedWorkoutStats, setFinishedWorkoutStats] = useState<{ durationStr: string; totalSets: number; totalVolumeKg: number } | null>(null);

  useEffect(() => {
    if (!isSessionRunning) return;
    const timer = setInterval(() => {
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSessionRunning]);

  // Persist active session state to localStorage
  useEffect(() => {
    if (isSessionRunning || sessionElapsedSeconds > 0) {
      writeLocalJson(ACTIVE_SESSION_KEY, {
        isRunning: isSessionRunning,
        elapsedSeconds: sessionElapsedSeconds,
        lastSavedAt: Date.now(),
      });
    } else {
      writeLocalJson(ACTIVE_SESSION_KEY, null);
    }
  }, [isSessionRunning, sessionElapsedSeconds]);

  function formatStopwatch(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  }

  function toggleExerciseAccordion(exerciseId: string) {
    setExpandedExercises((prev) => {
      const isCurrentlyExpanded = prev[exerciseId] ?? true;
      return {
        ...prev,
        [exerciseId]: !isCurrentlyExpanded,
      };
    });
  }

  function handleTriggerFinishWorkout(dayTitle: string, currentDayExercises: PlanExercise[]) {
    let totalSetsDone = 0;
    let totalVol = 0;
    const allCompletedSets: LogSet[] = [];
    const todayKey = getLocalDateKey(new Date());

    currentDayExercises.forEach((ex) => {
      const trimmedTag = (machineTags[ex.id] ?? "").trim();
      const effUnit = getEffectiveUnitForExercise(ex.name, trimmedTag);
      const exInputs = normalizeSetInputs(inputs[ex.id], ex.sets);

      exInputs.forEach((s, idx) => {
        const w = parseFloat(s.weightLbs) || 0;
        const r = parseFloat(s.reps) || 0;
        if (s.done && w > 0 && r > 0) {
          totalSetsDone += 1;
          const wLbs = effUnit === "kg" ? convertWeight(w, "kg", "lbs") : w;
          totalVol += wLbs * r;
          allCompletedSets.push({
            exerciseId: ex.id,
            exerciseName: ex.name,
            weightLbs: wLbs,
            reps: r,
            setNumber: idx + 1,
            date: new Date().toISOString(),
            machine: trimmedTag || undefined,
            unit: effUnit,
            rawValue: w,
          });
        }
      });
    });

    if (allCompletedSets.length > 0) {
      // 1. Check for any PRs
      for (const s of allCompletedSets) {
        const prCheck = checkIsPr(recordsMap, s);
        if (prCheck) {
          setPrCelebration({
            exerciseName: s.exerciseName,
            machine: s.machine,
            recordType: prCheck.type,
            oldVal: prCheck.oldVal,
            newVal: prCheck.newVal,
          });
          break;
        }
      }

      // 2. Persist Logs (deduplicated by exercise, set, and date)
      setLogs((old) => {
        const without = old.filter(
          (l) =>
            !allCompletedSets.some(
              (c) =>
                c.exerciseName === l.exerciseName &&
                (c.machine || "") === (l.machine || "") &&
                c.setNumber === l.setNumber &&
                getLocalDateKey(l.date) === todayKey
            )
        );
        const updated = [...without, ...allCompletedSets];
        writeLocalJson(LATEST_LOGS_KEY, updated);
        return updated;
      });

      // 3. Update Records Map
      setRecordsMap((old) => {
        let updated = { ...old };
        for (const s of allCompletedSets) {
          updated = updateRecordsWithSet(updated, s);
        }
        writeLocalJson(PERMANENT_RECORDS_KEY, updated);
        writeLocalJson(LEGACY_STATS_KEY, updated);
        return updated;
      });

      // 4. Reset inputs for completed exercises respecting custom set counts
      setInputs((old) => {
        const nextInputs = { ...old };
        currentDayExercises.forEach((ex) => {
          const assignedSets = presetSetsMap[ex.id] || ex.sets;
          nextInputs[ex.id] = createDefaultSetInputs(assignedSets);
        });
        writeLocalJson(SET_INPUTS_KEY, nextInputs);
        return nextInputs;
      });
    }

    const durationStr = formatStopwatch(sessionElapsedSeconds);
    const totalVolumeKg = Math.round(totalVol * 0.453592);

    setFinishedWorkoutStats({
      durationStr,
      totalSets: totalSetsDone,
      totalVolumeKg,
    });
    setIsSessionRunning(false);
    setShowFinishCelebration(true);
  }

  // Cardio Quick-Input State
  const [cardioType, setCardioType] = useState<"treadmill" | "incline_walk" | "rower" | "bike" | "outdoor">("treadmill");
  const [cardioDuration, setCardioDuration] = useState<string>("");
  const [cardioDistance, setCardioDistance] = useState<string>("");
  const [cardioPaceSpeed, setCardioPaceSpeed] = useState<string>("");
  const [cardioSavedToast, setCardioSavedToast] = useState(false);

  // Stage 1 Unit Hierarchy State (haitMachineUnitsV1, haitExerciseUnitsV1, haitUserProfileV1)
  const [exerciseUnits, setExerciseUnits] = useState<Record<string, WeightUnit>>(() => getExerciseUnitsMap());
  // PR Edit Modal State
  const [editingPrExercise, setEditingPrExercise] = useState<{ name: string; machine?: string } | null>(null);
  const [editPrWeight, setEditPrWeight] = useState<string>("");
  const [editPrReps, setEditPrReps] = useState<string>("");
  const [editPrUnit, setEditPrUnit] = useState<WeightUnit>("kg");
  const [machineUnits, setMachineUnits] = useState<Record<string, WeightUnit>>(() => getMachineUnitsMap());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getUserProfile());

  const globalWeightUnit: WeightUnit = userProfile?.preferredWeightUnit || "kg";
  const currentGender: Gender = userProfile?.gender || "male";

  function getEffectiveUnitForExercise(exerciseName: string, machineTag?: string): WeightUnit {
    const trimmed = (machineTag ?? "").trim();
    if (trimmed && machineUnits[trimmed]) {
      return machineUnits[trimmed];
    }
    if (exerciseUnits[exerciseName]) {
      return exerciseUnits[exerciseName];
    }
    return globalWeightUnit;
  }

  function handleToggleExerciseUnit(exercise: PlanExercise, machineTag?: string, defaultSets?: number) {
    const currentUnit = getEffectiveUnitForExercise(exercise.name, machineTag);
    const targetUnit: WeightUnit = currentUnit === "kg" ? "lbs" : "kg";
    const isIso = exercise.movement.toLowerCase().includes("isolation") || exercise.movement.toLowerCase().includes("curl") || exercise.movement.toLowerCase().includes("raise") || exercise.movement.toLowerCase().includes("ext");

    const trimmed = (machineTag ?? "").trim();
    if (trimmed) {
      saveMachineUnit(trimmed, targetUnit);
      setMachineUnits((prev) => ({ ...prev, [trimmed]: targetUnit }));
    }
    saveExerciseUnit(exercise.name, targetUnit);
    setExerciseUnits((prev) => ({ ...prev, [exercise.name]: targetUnit }));

    const setsCount = defaultSets || exercise.sets;
    setInputs((old: Record<string, SetInput[]>) => {
      const cur = normalizeSetInputs(old[exercise.id], setsCount);
      const converted = cur.map((s) => {
        const numVal = parseFloat(s.weightLbs);
        if (!Number.isFinite(numVal) || numVal <= 0) return s;
        const convertedVal = convertAndSnapWeight(numVal, currentUnit, targetUnit, isIso);
        return { ...s, weightLbs: String(convertedVal) };
      });
      const nextInputs = { ...old, [exercise.id]: converted };
      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function handleSetGlobalUnit(newUnit: WeightUnit) {
    if (userProfile) {
      const updated: UserProfile = { ...userProfile, preferredWeightUnit: newUnit, updatedAt: new Date().toISOString() };
      saveUserProfile(updated);
      setUserProfile(updated);
    } else {
      const fresh: UserProfile = {
        gender: "male",
        age: 25,
        heightCm: 175,
        weightKg: 70,
        expMonths: 12,
        daysPerWeek: days,
        goal: "hypertrophy",
        injuries: [],
        preferredWeightUnit: newUnit,
        updatedAt: new Date().toISOString(),
      };
      saveUserProfile(fresh);
      setUserProfile(fresh);
    }
  }

  function handleSetGender(newGender: Gender) {
    if (userProfile) {
      const updated: UserProfile = { ...userProfile, gender: newGender, updatedAt: new Date().toISOString() };
      saveUserProfile(updated);
      setUserProfile(updated);
    } else {
      const fresh: UserProfile = {
        gender: newGender,
        age: 25,
        heightCm: 175,
        weightKg: 70,
        expMonths: 12,
        daysPerWeek: days,
        goal: "hypertrophy",
        injuries: [],
        preferredWeightUnit: globalWeightUnit,
        updatedAt: new Date().toISOString(),
      };
      saveUserProfile(fresh);
      setUserProfile(fresh);
    }
  }

  // Stage 2 Trainer Assessment Modal state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);

  function handleApplyAssessmentPlan(targetDays: 3 | 4 | 5, profile: UserProfile) {
    saveUserProfile(profile);
    setUserProfile(profile);
    setBodyweightEntry(getCurrentBodyweight());
    setDays(targetDays);
    setMode("today");

    // Auto-plan generator based on days & experience:
    // Novice (<6m): 2 sets/ex, Beginner (6-12m): 3 sets/ex, Inter/Adv (>12m): template default sets
    let targetSetsPerEx = 3;
    if (profile.expMonths < 6) {
      targetSetsPerEx = 2;
    } else if (profile.expMonths <= 12) {
      targetSetsPerEx = 3;
    } else {
      targetSetsPerEx = 4;
    }

    const planToUse = targetDays === 5 && fiveDayMode === "oneLegDay" ? fiveDayLegOncePlan : presetPlans[targetDays];
    const newPresetSets: Record<string, number> = {};
    const newInputs: Record<string, SetInput[]> = { ...inputs };

    planToUse.forEach((d) => {
      d.exercises.forEach((ex) => {
        const assignedSets = profile.expMonths > 12 ? ex.sets : targetSetsPerEx;
        newPresetSets[ex.id] = assignedSets;

        // Pre-fill weights based on biomechanical calculation
        const muscleInfo = evaluateMuscleMass(profile.gender, profile.weightKg, profile.muscleMassKg, profile.muscleMassMode);
        const result = calculatePrescriptionWeight(ex.name, ex.load, ex.reps, profile, muscleInfo.modifier);
        const effectiveU = resolveEffectiveUnit(ex.name, undefined, profile.preferredWeightUnit, exerciseUnits, machineUnits);
        const isIso = ex.movement.toLowerCase().includes("isolation") || ex.movement.toLowerCase().includes("curl") || ex.movement.toLowerCase().includes("raise") || ex.movement.toLowerCase().includes("ext");
        const prefillVal = effectiveU === "kg"
          ? result.hardwareWeightKg
          : convertAndSnapWeight(result.hardwareWeightKg, "kg", "lbs", isIso);

        newInputs[ex.id] = Array.from({ length: assignedSets }, () => ({
          weightLbs: String(prefillVal),
          reps: ex.reps.split(" ")[0] || "10",
          done: false,
        }));
      });
    });

    setPresetSetsMap(newPresetSets);
    writeLocalJson(PRESET_SETS_KEY, newPresetSets);
    setInputs(newInputs);
    writeLocalJson(SET_INPUTS_KEY, newInputs);
  }

  // Substitution Modal State
  const [substituteModalExercise, setSubstituteModalExercise] = useState<PlanExercise | null>(null);
  const [substituteSearch, setSubstituteSearch] = useState("");
  const [substituteFilter, setSubstituteFilter] = useState<"movement" | "group" | "all">("movement");

  // PR Celebration Modal & Bodyweight State
  const [prCelebration, setPrCelebration] = useState<{
    exerciseName: string;
    machine?: string;
    recordType: "weight" | "reps" | "volume";
    oldVal: string;
    newVal: string;
  } | null>(null);

  const [bodyweightKg, setBodyweightKg] = useState<number | null>(() => readJson<number | null>(CURRENT_BODYWEIGHT_KEY, null));
  const [bodyweightLogs, setBodyweightLogs] = useState<BodyweightLog[]>(() => readJson<BodyweightLog[]>(BODYWEIGHT_LOGS_KEY, []));
  const [isBwModalOpen, setIsBwModalOpen] = useState(false);

  function handleSaveBodyweight(kg: number) {
    setBodyweightKg(kg);
    const newEntry: BodyweightLog = {
      date: new Date().toISOString(),
      weightKg: kg,
    };
    setBodyweightLogs((old) => [newEntry, ...old.filter((o) => getLocalDateKey(o.date) !== getLocalDateKey(newEntry.date))]);
  }

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Migration State (M2)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showMigrationToast, setShowMigrationToast] = useState(false);

  // Weekly Trend Scores (T2)
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(WEEKLY_SCORES_KEY);
      return raw ? (JSON.parse(raw) as WeeklyScore[]) : [];
    } catch { return []; }
  });

  // Bodyweight & Relative Strength (R2)
  const [showBodyweightModal, setShowBodyweightModal] = useState(false);
  const [bodyweightEntry, setBodyweightEntry] = useState<BodyweightEntry | null>(() => getCurrentBodyweight());

  // Notification Settings (N3)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Weekly Schedule & Rest Day Planner
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() => {
    return readJson<WeeklySchedule>(WEEKLY_SCHEDULE_KEY, DEFAULT_WEEKLY_SCHEDULE);
  });

  function handleToggleScheduleDay(dayKey: keyof WeeklySchedule) {
    setWeeklySchedule((prev) => {
      const next = { ...prev, [dayKey]: !prev[dayKey] };
      writeLocalJson(WEEKLY_SCHEDULE_KEY, next);
      return next;
    });
  }

  // Profile & Settings Modal (U1)
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Focus Mode & Progressive Session Flow State (Lifting vs Cardio)
  const [sessionStage, setSessionStage] = useState<"lifting" | "cardio">(initialUiState.sessionStage ?? "lifting");
  const [showAnatomyModal, setShowAnatomyModal] = useState(false);
  const [showSetupDrawer, setShowSetupDrawer] = useState(false);
  // Session exercise custom order overrides (key: `${mode}_${activeDayIndex}`, value: list of exercise IDs)
  const [sessionExerciseOrders, setSessionExerciseOrders] = useState<Record<string, string[]>>({});

  // Editable Profile Display Name for Home Dashboard
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window === "undefined") return "Athlete";
    return window.localStorage.getItem("haitUserName") || "Athlete";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  function handleSaveUserName() {
    const trimmed = tempName.trim() || "Athlete";
    setUserName(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("haitUserName", trimmed);
    }
    setIsEditingName(false);
  }

  useEffect(() => {
    if (!hasCompletedOnboarding()) setShowOnboarding(true);
  }, []);

  const presetPlans = useMemo(() => makePresetPlans(), []);
  const fiveDayLegOncePlan = useMemo(() => makeFiveDayLegOncePlan(), []);

  const selectedCustomPlan = useMemo(() => {
    if (customPlans.length === 0) return null;
    return customPlans.find((plan) => plan.id === selectedCustomPlanId) ?? customPlans[0];
  }, [customPlans, selectedCustomPlanId]);

  const activePresetPlan = days === 5 && fiveDayMode === "oneLegDay" ? fiveDayLegOncePlan : presetPlans[days];
  const isPresetLike = mode === "today" || mode === "preset" || mode === "dashboard";
  const activePlan = isPresetLike ? activePresetPlan : selectedCustomPlan?.days ?? [];
  const activeDayIndex = isPresetLike ? selectedDay : selectedCustomDay;
  const rawDay = activePlan[activeDayIndex] ?? activePlan[0];

  const currentDayKey = `${mode}_${activeDayIndex}`;
  const day = useMemo(() => {
    if (!rawDay) return rawDay;
    const customOrder = sessionExerciseOrders[currentDayKey];

    // 1. Resolve substituted identities first
    const resolvedExercises = rawDay.exercises.map((base) => {
      const subName = substituteMap[base.id];
      return subName ? applyExerciseIdentity(base, subName) : base;
    });

    if (!customOrder || customOrder.length === 0) {
      return { ...rawDay, exercises: resolvedExercises };
    }

    // 2. Sort according to custom order
    const sorted = [...resolvedExercises].sort((a, b) => {
      const idxA = customOrder.indexOf(a.id);
      const idxB = customOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return { ...rawDay, exercises: sorted };
  }, [rawDay, sessionExerciseOrders, currentDayKey, substituteMap]);

  // Smart Weekly Schedule Resolver
  const todayDayOfWeek = useMemo(() => {
    const daysArr: (keyof WeeklySchedule)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return daysArr[new Date().getDay()];
  }, []);

  // Dashboard Workout Resolver: ALWAYS bind to active plan if current day has exercises
  const dashboardDay = useMemo(() => {
    if (day && Array.isArray(day.exercises) && day.exercises.length > 0) {
      return day;
    }
    const presetList = days === 5 && fiveDayMode === "oneLegDay" ? fiveDayLegOncePlan : presetPlans[days];
    const safePresetIndex = selectedDay < presetList.length ? selectedDay : 0;
    return presetList[safePresetIndex] || presetList[0];
  }, [day, days, fiveDayMode, fiveDayLegOncePlan, presetPlans, selectedDay]);

  const dashboardMuscleSummary = useMemo(() => {
    return buildPlannedMuscleSummary(dashboardDay?.exercises ?? []);
  }, [dashboardDay]);

  const isTodayScheduledRest = useMemo(() => {
    return !weeklySchedule[todayDayOfWeek];
  }, [weeklySchedule, todayDayOfWeek]);

  function moveSessionExercise(currentIndex: number, direction: -1 | 1) {
    if (!day || !day.exercises) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= day.exercises.length) return;

    if (mode === "custom") {
      reorderCustomExercises(currentIndex, targetIndex);
      return;
    }

    const currentIds = day.exercises.map((e) => e.id);
    const [movedId] = currentIds.splice(currentIndex, 1);
    currentIds.splice(targetIndex, 0, movedId);
    setSessionExerciseOrders((prev) => ({
      ...prev,
      [currentDayKey]: currentIds,
    }));
  }

  useEffect(() => {
    const parsed = readJson<LogSet[]>(LATEST_LOGS_KEY, []);
    if (Array.isArray(parsed)) {
      setLogs(parsed);
      let calculatedRecords: Record<string, ExerciseRecords> = {};
      setRecordsMap((current) => {
        let updated = current;
        for (const log of parsed) {
          updated = updateRecordsWithSet(updated, log);
        }
        calculatedRecords = updated;
        return updated;
      });

      // Auto-migration สำหรับผู้ใช้เก่า
      if (!hasMigrated() && parsed.length > 0) {
        const result = runMigration(parsed, calculatedRecords, days);
        if (result) {
          setMigrationResult(result);
          setShowMigrationToast(true);
          setTimeout(() => setShowMigrationToast(false), 8000);
        }
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [days]);

  useEffect(() => {
    writeLocalJson(LATEST_LOGS_KEY, logs);
  }, [logs]);

  // Persist permanent PR records to localStorage whenever they change
  useEffect(() => {
    writeLocalJson(PERMANENT_RECORDS_KEY, recordsMap);
    writeLocalJson(LEGACY_STATS_KEY, recordsMap);
  }, [recordsMap]);

  // Persist UI state to localStorage on every state change
  useEffect(() => {
    writeLocalJson<PersistedUiState>(UI_STATE_KEY, {
      mode, days, selectedDay, fiveDayMode,
      showHistory, showLibrary,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      selectedCustomPlanId: selectedCustomPlan?.id ?? null,
      selectedCustomDay,
      sessionStage,
      activeExerciseIndex,
    });
  }, [mode, days, selectedDay, fiveDayMode, showHistory, showLibrary, selectedCustomPlan?.id, selectedCustomDay, sessionStage, activeExerciseIndex]);

  useEffect(() => writeLocalJson(SET_INPUTS_KEY, inputs), [inputs]);
  useEffect(() => writeLocalJson(CUSTOM_PLANS_KEY, customPlans), [customPlans]);
  useEffect(() => writeLocalJson(SUBSTITUTE_KEY, substituteMap), [substituteMap]);
  useEffect(() => writeLocalJson(MACHINE_TAGS_KEY, machineTags), [machineTags]);
  useEffect(() => writeLocalJson(PRESET_SETS_KEY, presetSetsMap), [presetSetsMap]);
  useEffect(() => {
    if (bodyweightKg !== null) writeLocalJson(CURRENT_BODYWEIGHT_KEY, bodyweightKg);
  }, [bodyweightKg]);
  useEffect(() => writeLocalJson(BODYWEIGHT_LOGS_KEY, bodyweightLogs), [bodyweightLogs]);
  useEffect(() => writeLocalJson(CARDIO_LOGS_KEY, cardioLogs), [cardioLogs]);
  useEffect(() => {
    const streak = getComputedStreak(logs);
    writeLocalJson(WEEK_STREAK_KEY, streak);
  }, [logs]);

  function handleSaveCardioLog(data: {
    type: "treadmill" | "incline_walk" | "rower" | "bike" | "outdoor";
    durationMin: number;
    distanceKm?: number;
    paceOrSpeed?: string;
    inclinePercent?: number;
    notes?: string;
  }) {
    const newLog: CardioLog = {
      id: makeId("cardio"),
      date: new Date().toISOString(),
      type: data.type,
      durationMin: data.durationMin,
      distanceKm: data.distanceKm,
      paceOrSpeed: data.paceOrSpeed,
      inclinePercent: data.inclinePercent,
      notes: data.notes,
    };

    setCardioLogs((prev) => [newLog, ...prev]);
    setCardioSavedToast(true);
    setTimeout(() => setCardioSavedToast(false), 3500);
  }

  function handleDeleteCardioLog(id: string) {
    setCardioLogs((prev) => prev.filter((c) => c.id !== id));
  }

  function updatePresetExerciseSets(exerciseId: string, newSets: number) {
    const safeSets = Math.max(1, Math.min(10, newSets));
    setPresetSetsMap((old) => ({ ...old, [exerciseId]: safeSets }));
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId], safeSets);
      let updated: SetInput[];
      if (current.length < safeSets) {
        updated = [...current, ...createDefaultSetInputs(safeSets - current.length)];
      } else if (current.length > safeSets) {
        updated = current.slice(0, safeSets);
      } else {
        updated = current;
      }
      const nextInputs = { ...old, [exerciseId]: updated };
      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function updateMachineTag(exerciseId: string, tag: string) {
    setMachineTags((old) => {
      const next = { ...old, [exerciseId]: tag };
      writeLocalJson(MACHINE_TAGS_KEY, next);
      return next;
    });
  }

  function toggleFavoriteMachine(exerciseName: string, tag: string) {
    if (!tag.trim()) return;
    setFavoriteMachines((old) => {
      const copy = { ...old };
      if (copy[exerciseName] === tag) {
        delete copy[exerciseName];
      } else {
        copy[exerciseName] = tag;
      }
      writeLocalJson(FAVORITE_MACHINES_KEY, copy);
      return copy;
    });
  }

  // Persist rest timer state for resilience against refresh
  useEffect(() => {
    if (restTimer.running && restTimer.secondsLeft > 0) {
      writeLocalJson(REST_TIMER_KEY, restTimer);
    } else {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(REST_TIMER_KEY);
      }
    }
  }, [restTimer]);

  // Save scroll position on page hide / background (mobile-safe)
  useEffect(() => {
    const saveScrollState = () => {
      const current = readJson<PersistedUiState>(UI_STATE_KEY, {
        mode, days, selectedDay, fiveDayMode,
        showHistory, showLibrary, scrollY: 0,
        selectedCustomPlanId: selectedCustomPlan?.id ?? null,
        selectedCustomDay,
      });
      writeLocalJson<PersistedUiState>(UI_STATE_KEY, { ...current, scrollY: window.scrollY });
    };
    const onVisChange = () => { if (document.hidden) saveScrollState(); };
    window.addEventListener("beforeunload", saveScrollState);
    window.addEventListener("pagehide", saveScrollState);
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      saveScrollState();
      window.removeEventListener("beforeunload", saveScrollState);
      window.removeEventListener("pagehide", saveScrollState);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [mode, days, selectedDay, fiveDayMode, showHistory, showLibrary, selectedCustomPlan?.id, selectedCustomDay]);

  useEffect(() => {
    if (hasRestoredScroll) return;
    const saved = readJson<PersistedUiState>(UI_STATE_KEY, {
      mode,
      days,
      selectedDay,
      fiveDayMode,
      showHistory,
      showLibrary,
      scrollY: 0,
      selectedCustomPlanId: selectedCustomPlan?.id ?? null,
      selectedCustomDay,
    });

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: saved.scrollY ?? 0, behavior: "instant" as ScrollBehavior });
      setHasRestoredScroll(true);
    });
  }, [hasRestoredScroll, mode, days, selectedDay, fiveDayMode, showHistory, showLibrary, selectedCustomPlan?.id, selectedCustomDay]);

  useEffect(() => {
    if (isPresetLike && selectedDay >= activePresetPlan.length) setSelectedDay(0);
    if (mode === "custom" && selectedCustomDay >= activePlan.length) setSelectedCustomDay(0);
    if (activeExerciseIndex >= (day?.exercises.length ?? 0)) setActiveExerciseIndex(0);
  }, [mode, selectedDay, selectedCustomDay, activePresetPlan.length, activePlan.length, isPresetLike, activeExerciseIndex, day?.exercises.length]);

  // Robust timestamp-based interval + visibility sync (no drift on tab backgrounding/phone lock)
  useEffect(() => {
    if (!restTimer.running || !restTimer.targetEndTimestamp) return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((restTimer.targetEndTimestamp! - now) / 1000));

      if (remaining <= 0) {
        notifyRestDone(restTimer.exerciseName);
        setRestTimer((current) => ({
          ...current,
          running: false,
          secondsLeft: 0,
          targetEndTimestamp: undefined,
        }));
      } else {
        if (remaining === 3 || remaining === 2 || remaining === 1) {
          playCountdownBeep(740);
        }
        setRestTimer((current) => {
          if (!current.running) return current;
          return {
            ...current,
            secondsLeft: remaining,
          };
        });
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 500);

    const onVisibilityOrFocus = () => {
      if (!document.hidden) {
        tick();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, [restTimer.running, restTimer.targetEndTimestamp, restTimer.exerciseName]);

  const restProgress = restTimer.totalSeconds > 0 ? Math.round(((restTimer.totalSeconds - restTimer.secondsLeft) / restTimer.totalSeconds) * 100) : 0;

  function startRestTimer(exercise: PlanExercise, currentWeightLbs?: number, lastReps?: number) {
    if (!restTimerEnabled) return;
    requestNotificationPermission();

    const mode = restModeMap[exercise.id] ?? "normal";
    const userBw = bodyweightEntry?.lbs ?? (userProfile?.weightKg ? userProfile.weightKg * 2.20462 : null);
    const weightLbs = currentWeightLbs ?? (prMap[exercise.name]?.weightLbs || 0);
    const reps = lastReps ?? 10;
    const seconds = customRestMap[exercise.id] ?? getRestSecondsByMode(exercise, mode, weightLbs, userBw, reps);
    const targetEnd = Date.now() + seconds * 1000;

    setRestTimer({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      secondsLeft: seconds,
      totalSeconds: seconds,
      running: true,
      targetEndTimestamp: targetEnd,
    });
  }

  function adjustRestSeconds(exercise: PlanExercise, deltaSeconds: number) {
    const mode = restModeMap[exercise.id] ?? "normal";
    const current = customRestMap[exercise.id] ?? getRestSecondsByMode(exercise, mode);
    const next = Math.max(30, current + deltaSeconds);

    setCustomRestMap((old) => ({
      ...old,
      [exercise.id]: next,
    }));

    setRestTimer((currentTimer) => {
      if (currentTimer.exerciseId !== exercise.id) return currentTimer;

      if (currentTimer.running && currentTimer.targetEndTimestamp) {
        const newSecondsLeft = Math.max(5, currentTimer.secondsLeft + deltaSeconds);
        const newTargetEnd = Date.now() + newSecondsLeft * 1000;
        return {
          ...currentTimer,
          secondsLeft: newSecondsLeft,
          totalSeconds: Math.max(currentTimer.totalSeconds, newSecondsLeft),
          targetEndTimestamp: newTargetEnd,
        };
      }

      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        secondsLeft: next,
        totalSeconds: next,
        running: false,
      };
    });
  }

  function setRestMode(exercise: PlanExercise, mode: RestMode) {
    const seconds = getRestSecondsByMode(exercise, mode);

    setRestModeMap((old) => ({
      ...old,
      [exercise.id]: mode,
    }));

    setCustomRestMap((old) => ({
      ...old,
      [exercise.id]: seconds,
    }));

    setRestTimer((currentTimer) => {
      if (currentTimer.exerciseId !== exercise.id || currentTimer.running) return currentTimer;

      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        secondsLeft: seconds,
        totalSeconds: seconds,
        running: false,
      };
    });
  }

  function stopRestTimer() {
    setRestTimer((current) => ({
      ...current,
      running: false,
      secondsLeft: 0,
      targetEndTimestamp: undefined,
    }));
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REST_TIMER_KEY);
    }
  }

  const prMap = useMemo(() => {
    const best: Record<string, LogSet> = {};

    for (const [exerciseName, records] of Object.entries(recordsMap)) {
      if (records.maxWeight) best[exerciseName] = records.maxWeight;
    }

    return best;
  }, [recordsMap]);

  const filteredHistoryLogs = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (historyRange === "14d") return sorted.filter((item) => isWithinLastDays(item.date, 14));
    if (historyRange === "30d") return sorted.filter((item) => isWithinLastDays(item.date, 30));
    return sorted;
  }, [logs, historyRange]);

  const lastSetMap = useMemo(() => {
    const latest: Record<string, Record<number, LogSet>> = {};

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const log of sortedLogs) {
      const key = getEffectiveExerciseKey(log.exerciseName, log.machine);
      latest[key] = latest[key] ?? {};

      if (!latest[key][log.setNumber]) {
        latest[key][log.setNumber] = log;
      }

      if (log.machine) {
        latest[log.exerciseName] = latest[log.exerciseName] ?? {};
        if (!latest[log.exerciseName][log.setNumber]) {
          latest[log.exerciseName][log.setNumber] = log;
        }
      }
    }

    return latest;
  }, [logs]);

  // Priority 1: Last Used Machine Variant per Exercise from logs
  const lastUsedMachineMap = useMemo(() => {
    const map: Record<string, string> = {};
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const log of sorted) {
      if (!map[log.exerciseName] && log.machine) {
        map[log.exerciseName] = log.machine;
      }
    }
    return map;
  }, [logs]);


  const exerciseLookup = useMemo(() => {
    return exerciseLibrary.reduce<Record<string, Exercise>>((acc, item) => {
      acc[item.name] = item;
      return acc;
    }, {});
  }, []);

  const loggedMuscleSummary = useMemo(() => {
    return buildTodayMuscleSummary(logs, exerciseLookup);
  }, [logs, exerciseLookup]);

  const plannedMuscleSummary = useMemo(() => {
    return buildPlannedMuscleSummary(day?.exercises ?? []);
  }, [day]);

  const activeMuscleSummary = loggedMuscleSummary.hasData ? loggedMuscleSummary : plannedMuscleSummary;

  const filteredCardioLogs = useMemo(() => {
    const sorted = [...cardioLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (historyRange === "14d") return sorted.filter((item) => isWithinLastDays(item.date, 14));
    if (historyRange === "30d") return sorted.filter((item) => isWithinLastDays(item.date, 30));
    return sorted;
  }, [cardioLogs, historyRange]);

  const recentLogsByDate = useMemo(() => {
    return filteredHistoryLogs.reduce<Record<string, LogSet[]>>((acc, item) => {
      const key = new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short", day: "numeric" }).format(new Date(item.date));
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredHistoryLogs]);

  const recentCardioLogsByDate = useMemo(() => {
    return filteredCardioLogs.reduce<Record<string, CardioLog[]>>((acc, item) => {
      const key = new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short", day: "numeric" }).format(new Date(item.date));
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredCardioLogs]);

  // Combined sorted list of all unique dates with either lifting or cardio logs
  const allHistoryDates = useMemo(() => {
    const dateSet = new Set<string>();
    Object.keys(recentLogsByDate).forEach((d) => dateSet.add(d));
    Object.keys(recentCardioLogsByDate).forEach((d) => dateSet.add(d));
    return Array.from(dateSet);
  }, [recentLogsByDate, recentCardioLogsByDate]);

  const weeklyVolumeSummary = useMemo(() => getWeeklyVolumeSummary(activePlan), [activePlan]);

  const performanceReport = useMemo(
    () => computeWeeklyPerformance(logs, days, activePlan),
    [logs, days, activePlan]
  );

  // บันทึก weekly score ทุกครั้งที่ performanceReport เปลี่ยน (สัปดาห์ละครั้ง) (T2)
  useEffect(() => {
    if (!performanceReport.hasData) return;
    if (typeof window === "undefined") return;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // วันอาทิตย์
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();

    setWeeklyScores((prev) => {
      const existing = prev.find((s) => s.weekStart === weekStartISO);
      let next: WeeklyScore[];
      if (existing) {
        // อัปเดต score ถ้าดีกว่าเดิม
        if (performanceReport.score > existing.score) {
          next = prev.map((s) =>
            s.weekStart === weekStartISO
              ? { ...s, score: performanceReport.score, rank: performanceReport.rank }
              : s
          );
        } else {
          return prev; // ไม่อัปเดต
        }
      } else {
        // เพิ่มสัปดาห์ใหม่
        next = [
          ...prev,
          {
            weekStart: weekStartISO,
            score: performanceReport.score,
            rank: performanceReport.rank,
          },
        ];
      }
      // เก็บเฉพาะ 8 สัปดาห์ล่าสุด
      next = next
        .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
        .slice(-8);

      try {
        window.localStorage.setItem(WEEKLY_SCORES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [performanceReport.score, performanceReport.hasData, performanceReport.rank]);

  // Notification scheduler — ตรวจสอบทุกนาทีว่าถึงเวลาเตือนหรือยัง (N3)
  useEffect(() => {
    const cleanup = startNotificationScheduler(days);
    return cleanup;
  }, [days]);

  const filteredLibrary = useMemo(() => {
    const keyword = librarySearch.trim().toLowerCase();
    if (!keyword) return exerciseLibrary;
    return exerciseLibrary.filter((item) => item.name.toLowerCase().includes(keyword) || item.group.toLowerCase().includes(keyword) || item.movement.toLowerCase().includes(keyword));
  }, [librarySearch]);

  const filteredExercisePicker = useMemo(() => {
    const keyword = exerciseSearch.trim().toLowerCase();
    return exerciseLibrary.filter((item) => {
      const groupMatch = exerciseGroupFilter === "All" || item.group === exerciseGroupFilter;
      const keywordMatch = !keyword || item.name.toLowerCase().includes(keyword) || item.movement.toLowerCase().includes(keyword) || item.group.toLowerCase().includes(keyword);
      return groupMatch && keywordMatch;
    });
  }, [exerciseSearch, exerciseGroupFilter]);

  const substituteCandidates = useMemo(() => {
    if (!substituteModalExercise) return [];
    const keyword = substituteSearch.trim().toLowerCase();
    const relatedMovements = getRelatedMovements(substituteModalExercise.movement);

    const ranked = exerciseLibrary.map((ex) => ({
      exercise: ex,
      score: calculateMuscleMatchScore(substituteModalExercise, ex),
      isRelatedMovement: relatedMovements.includes(ex.movement),
    }));

    let listRanked = ranked;
    if (substituteFilter === "movement") {
      const filtered = ranked.filter(
        (item) =>
          item.exercise.group === substituteModalExercise.group &&
          (item.isRelatedMovement || item.exercise.name === substituteModalExercise.name) &&
          item.score > 0
      );
      listRanked = filtered.length > 0 ? filtered : ranked.filter((item) => item.exercise.group === substituteModalExercise.group);
    } else if (substituteFilter === "group") {
      listRanked = ranked.filter((item) => item.exercise.group === substituteModalExercise.group);
    }

    // RELATED MOVEMENT FIRST, then current exercise on top, then by muscle score
    listRanked.sort((a, b) => {
      if (a.exercise.name === substituteModalExercise.name) return -1;
      if (b.exercise.name === substituteModalExercise.name) return 1;
      if (a.isRelatedMovement !== b.isRelatedMovement) return a.isRelatedMovement ? -1 : 1;
      return b.score - a.score;
    });

    let list = listRanked.map((item) => item.exercise);

    if (keyword) {
      list = list.filter(
        (ex) =>
          ex.name.toLowerCase().includes(keyword) ||
          ex.movement.toLowerCase().includes(keyword) ||
          ex.group.toLowerCase().includes(keyword) ||
          ex.muscles.some((m) => m.toLowerCase().includes(keyword))
      );
    }

    return list;
  }, [substituteModalExercise, substituteSearch, substituteFilter]);

  const handleSetInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    exercise: PlanExercise,
    baseExerciseId: string,
    setIndex: number,
    field: "weightLbs" | "reps",
    machineTag?: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "weightLbs") {
        const repsInput = document.getElementById(`rep-input-${baseExerciseId}-${setIndex}`);
        repsInput?.focus();
      } else if (field === "reps") {
        saveSingleSet(exercise, setIndex, machineTag);
        const nextWeightInput = document.getElementById(`weight-input-${baseExerciseId}-${setIndex + 1}`);
        if (nextWeightInput) {
          nextWeightInput.focus();
        }
      }
    }
  };

  function addManualSet(exerciseId: string, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId], defaultSets);
      const nextInputs = {
        ...old,
        [exerciseId]: [
          ...current,
          {
            weightLbs: "",
            reps: "",
            done: false,
          },
        ],
      };
      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function removeManualSet(exerciseId: string, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId], defaultSets);

      if (current.length <= 1) return old;

      const nextInputs = {
        ...old,
        [exerciseId]: current.slice(0, -1),
      };
      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function updateSet(exerciseId: string, setIndex: number, field: keyof SetInput, value: string | boolean, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId], defaultSets);
      const updated = current.map((set, index) => {
        if (index !== setIndex) return set;

        const nextSet = { ...set, [field]: value };

        if (field === "weightLbs" || field === "reps") {
          nextSet.done = false;
        }

        return nextSet;
      });

      const nextInputs = {
        ...old,
        [exerciseId]: updated,
      };

      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function stepReps(exerciseId: string, setIndex: number, delta: number, defaultSets: number, fallbackReps = 10) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId], defaultSets);
      const updated = current.map((set, index) => {
        if (index !== setIndex) return set;

        const currentNum = parseInt(String(set.reps).trim(), 10);
        let nextVal: number;
        if (Number.isFinite(currentNum) && currentNum > 0) {
          nextVal = Math.max(1, Math.min(100, currentNum + delta));
        } else {
          const base = fallbackReps > 0 ? fallbackReps : 10;
          nextVal = delta > 0 ? base : Math.max(1, base - 1);
        }

        return { ...set, reps: String(nextVal), done: false };
      });

      const nextInputs = {
        ...old,
        [exerciseId]: updated,
      };

      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function stepWeight(
    exercise: PlanExercise,
    setIndex: number,
    deltaStepCount: number,
    machineTag?: string,
    defaultSets?: number,
    fallbackWeight = 0
  ) {
    const effectiveUnit = getEffectiveUnitForExercise(exercise.name, machineTag);
    const isIso = exercise.movement.toLowerCase().includes("isolation") || exercise.movement.toLowerCase().includes("curl") || exercise.movement.toLowerCase().includes("raise") || exercise.movement.toLowerCase().includes("ext");
    const stepSize = getSnapStep(effectiveUnit, isIso);
    const setsCount = defaultSets || exercise.sets;

    setInputs((old) => {
      const current = normalizeSetInputs(old[exercise.id], setsCount);
      const updated = current.map((set, index) => {
        if (index !== setIndex) return set;

        const currentVal = parseFloat(String(set.weightLbs).trim());
        let nextVal: number;
        if (Number.isFinite(currentVal) && currentVal > 0) {
          nextVal = Math.max(0, snapWeight(currentVal + deltaStepCount * stepSize, stepSize));
        } else {
          const base = fallbackWeight > 0 ? fallbackWeight : stepSize;
          nextVal = deltaStepCount > 0 ? base : Math.max(0, base - stepSize);
        }

        return { ...set, weightLbs: nextVal > 0 ? String(nextVal) : "", done: false };
      });

      const nextInputs = {
        ...old,
        [exercise.id]: updated,
      };

      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function saveSingleSet(exercise: PlanExercise, setIndex: number, machineTag?: string) {
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id], exercise.sets);
    const item = exerciseInputs[setIndex];

    if (!item) return;

    const enteredVal = Number(item.weightLbs);
    const reps = Number(item.reps);

    if (!Number.isFinite(enteredVal) || !Number.isFinite(reps) || enteredVal <= 0 || reps <= 0) return;

    // Toggle UI state only; rest timer still triggers
    setInputs((old) => {
      const current = normalizeSetInputs(old[exercise.id], exercise.sets);
      const updated = current.map((set, index) => (index === setIndex ? { ...set, done: true } : set));
      const newInputs = { ...old, [exercise.id]: updated };
      writeLocalJson(SET_INPUTS_KEY, newInputs);
      return newInputs;
    });

    // Start rest timer after marking set as done
    const effectiveUnit = getEffectiveUnitForExercise(exercise.name, machineTag);
    const weightInLbs = effectiveUnit === "kg" ? convertWeight(enteredVal, "kg", "lbs") : enteredVal;
    startRestTimer(exercise, weightInLbs, reps);

    // Auto advance focus to the next set row
    const nextWeightInput = document.getElementById(`weight-input-${exercise.id}-${setIndex + 1}`);
    if (nextWeightInput) {
      setTimeout(() => (nextWeightInput as HTMLInputElement)?.focus(), 50);
    }
  }

  function saveAllSets(exercise: PlanExercise, machineTag?: string) {
    const trimmedTag = (machineTag ?? "").trim();
    const effectiveUnit = getEffectiveUnitForExercise(exercise.name, machineTag);
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id], exercise.sets);

    const validSets: LogSet[] = exerciseInputs
      .map((item, index) => {
        const entered = Number(item.weightLbs);
        const reps = Number(item.reps);
        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          weightLbs: effectiveUnit === "kg" ? convertWeight(entered, "kg", "lbs") : entered,
          reps: reps,
          setNumber: index + 1,
          date: new Date().toISOString(),
          machine: trimmedTag || undefined,
          unit: effectiveUnit,
          rawValue: entered,
        };
      })
      .filter((item) => Number.isFinite(item.weightLbs) && Number.isFinite(item.reps) && item.weightLbs > 0 && item.reps > 0);

    if (validSets.length === 0) return;

    for (const s of validSets) {
      const prCheck = checkIsPr(recordsMap, s);
      if (prCheck) {
        setPrCelebration({
          exerciseName: s.exerciseName,
          machine: trimmedTag || undefined,
          recordType: prCheck.type,
          oldVal: prCheck.oldVal,
          newVal: prCheck.newVal,
        });
        break;
      }
    }

    const todayKey = getLocalDateKey(new Date());
    setLogs((old) => {
      const without = old.filter(
        (l) =>
          !(
            l.exerciseName === exercise.name &&
            (l.machine || "") === trimmedTag &&
            getLocalDateKey(l.date) === todayKey &&
            validSets.some((v) => v.setNumber === l.setNumber)
          )
      );
      const updated = [...without, ...validSets];
      writeLocalJson(LATEST_LOGS_KEY, updated);
      return updated;
    });

    setRecordsMap((old) => {
      let updated = { ...old };
      for (const s of validSets) {
        updated = updateRecordsWithSet(updated, s);
      }
      writeLocalJson(PERMANENT_RECORDS_KEY, updated);
      writeLocalJson(LEGACY_STATS_KEY, updated);
      return updated;
    });

    startRestTimer(exercise);

    setInputs((old) => {
      const nextInputs = {
        ...old,
        [exercise.id]: createDefaultSetInputs(exercise.sets),
      };
      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function exportLogsToCsv() {
    if (logs.length === 0) return;
    const headers = ["Date", "Exercise", "Machine", "Set", "Weight", "Unit", "Normalized_Weight_Lbs", "Reps"];
    const rows = logs.map((log) => {
      const displayVal = log.rawValue ?? (log.unit === "kg" ? Math.round(log.weightLbs * 0.453592 * 100) / 100 : Math.round(log.weightLbs * 100) / 100);
      const displayUnit = log.unit || "lbs";
      const normalizedLbs = Math.round(log.weightLbs * 100) / 100;
      return [
        safeCsvCell(new Date(log.date).toISOString().replace("T", " ").slice(0, 19)),
        safeCsvCell(log.exerciseName),
        safeCsvCell(log.machine || "-"),
        safeCsvCell(log.setNumber),
        safeCsvCell(displayVal),
        safeCsvCell(displayUnit),
        safeCsvCell(normalizedLbs),
        safeCsvCell(log.reps),
      ];
    });
    const csvContent = [headers.map(safeCsvCell).join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `workout_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "ต้องการล้างประวัติการฝึก (Workout Logs) หรือไม่?\n\n(หมายเหตุ: สถิติน้ำหนักสูงสุด PR และ Records จะยังคงถูกเก็บรักษาไว้ถาวร)"
      )
    ) {
      return;
    }
    setLogs([]);
    window.localStorage.removeItem(LATEST_LOGS_KEY);
  }

  function createNewCustomPlan() {
    const plan = createStarterCustomPlan();
    setCustomPlans((old) => [...old, plan]);
    setSelectedCustomPlanId(plan.id);
    setSelectedCustomDay(0);
    setMode("custom");
  }

  

  

  function updateCustomPlanName(name: string) {
    if (!selectedCustomPlan) return;
    setCustomPlans((old) => old.map((plan) => (plan.id === selectedCustomPlan.id ? { ...plan, name } : plan)));
  }

  function deleteCustomPlan() {
    if (!selectedCustomPlan) return;
    if (customPlans.length <= 1) {
      const plan = createStarterCustomPlan();
      setCustomPlans([plan]);
      setSelectedCustomPlanId(plan.id);
      setSelectedCustomDay(0);
      return;
    }
    const nextPlans = customPlans.filter((plan) => plan.id !== selectedCustomPlan.id);
    setCustomPlans(nextPlans);
    setSelectedCustomPlanId(nextPlans[0]?.id ?? null);
    setSelectedCustomDay(0);
  }

  function addCustomDay() {
    if (!selectedCustomPlan) return;
    const dayId = makeId("c_day");
    const newDay = makeDay(dayId, `Custom Day ${selectedCustomPlan.days.length + 1}`, "Choose target muscles then press Recommend", ["Chest"], []);
    setCustomPlans((old) => old.map((plan) => (plan.id === selectedCustomPlan.id ? { ...plan, days: [...plan.days, newDay] } : plan)));
    setSelectedCustomDay(selectedCustomPlan.days.length);
  }

  function updateCustomDay(dayId: string, updater: (day: DayPlan) => DayPlan) {
    if (!selectedCustomPlan) return;
    setCustomPlans((old) =>
      old.map((plan) =>
        plan.id === selectedCustomPlan.id ? { ...plan, days: plan.days.map((item) => (item.id === dayId ? updater(item) : item)) } : plan
      )
    );
  }

  function deleteCustomDay(dayId: string) {
    if (!selectedCustomPlan) return;
    const nextDays = selectedCustomPlan.days.filter((item) => item.id !== dayId);
    const safeDays = nextDays.length > 0 ? nextDays : [makeDay("c_d1", "Custom Day 1", "Choose target muscles then press Recommend", ["Chest"], [])];
    setCustomPlans((old) => old.map((plan) => (plan.id === selectedCustomPlan.id ? { ...plan, days: safeDays } : plan)));
    setSelectedCustomDay(0);
  }

  function toggleDayFocus(group: MuscleGroup) {
    if (!day) return;
    updateCustomDay(day.id, (current) => {
      const exists = current.focus.includes(group);
      const nextFocus = exists ? current.focus.filter((item) => item !== group) : [...current.focus, group];
      return { ...current, focus: nextFocus.length > 0 ? nextFocus : [group] };
    });
  }

  function recommendIntoCurrentDay() {
    if (!day || mode !== "custom") return;
    updateCustomDay(day.id, (current) => ({ ...current, subtitle: "Recommended from Jeff-inspired movement order", exercises: recommendForGroups(day.focus) }));
  }

  function addExerciseToCurrentDay(name: string) {
    if (!day || mode !== "custom") return;
    const exercise = toPlanExercise(name);
    updateCustomDay(day.id, (current) => ({ ...current, exercises: [...current.exercises, exercise] }));
  }

  function removeExerciseFromCurrentDay(exerciseId: string) {
    if (!day || mode !== "custom") return;
    updateCustomDay(day.id, (current) => ({ ...current, exercises: current.exercises.filter((item) => item.id !== exerciseId) }));
  }

  function reorderCustomExercises(from: number, to: number) {
    if (!day || mode !== "custom") return;
    updateCustomDay(day.id, (current) => {
      const items = [...current.exercises];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...current, exercises: items };
    });
  }

  function updateCustomExercise(exerciseId: string, patch: Partial<PlanExercise>) {
    if (!day || mode !== "custom") return;
    updateCustomDay(day.id, (current) => ({ ...current, exercises: current.exercises.map((item) => (item.id === exerciseId ? { ...item, ...patch } : item)) }));
  }

  function substituteExercise(currentExercise: PlanExercise, newName: string) {
    const next = toPlanExercise(newName);

    // Clear machine override for this slot so the new exercise starts with its own default equipment
    setMachineTags((old) => {
      const copy = { ...old };
      delete copy[currentExercise.id];
      writeLocalJson(MACHINE_TAGS_KEY, copy);
      return copy;
    });

    // Clear input fields so stale weights from previous exercise do not leak
    setInputs((old) => {
      const copy = { ...old };
      delete copy[currentExercise.id];
      writeLocalJson(SET_INPUTS_KEY, copy);
      return copy;
    });

    if (mode === "custom") {
      updateCustomExercise(currentExercise.id, {
        name: next.name,
        group: next.group,
        movement: next.movement,
        muscles: next.muscles,
        reps: next.reps,
        sets: next.sets,
        warmup: next.warmup,
        load: next.load,
      });
      return;
    }

    setSubstituteMap((old) => {
      const copy = { ...old };
      if (newName === currentExercise.name) {
        delete copy[currentExercise.id];
        return copy;
      }
      copy[currentExercise.id] = newName;
      return copy;
    });
  }


  const visibleExercises = useMemo(() => {
    if (!day) return [];
    if (!compactList) return day.exercises;
    const selected = day.exercises[activeExerciseIndex];
    return selected ? [selected] : [];
  }, [day, compactList, activeExerciseIndex]);


  const pageMeta = {
    dashboard: {
      eyebrow: "Home",
      title: "Dashboard",
      description: "ภาพรวมกิจกรรมและสถิติการฝึก",
    },
    today: {
      eyebrow: "Workout",
      title: "Today",
      description: "เล่นทีละท่าแบบง่ายๆ",
    },
    preset: {
      eyebrow: "Preset",
      title: "Program",
      description: "เลือกโปรแกรมที่ต้องการ",
    },
    custom: {
      eyebrow: "Builder",
      title: "Custom",
      description: "สร้างและแก้ตารางเอง",
    },
    history: {
      eyebrow: "Permanent",
      title: "History",
      description: "ประวัติการฝึกและสถิติ",
    },
    library: {
      eyebrow: "Exercise",
      title: "Library",
      description: "รวมท่าที่มีใน gym",
    },
  }[mode];

  return (
    <main className="min-h-screen bg-black pb-40 text-zinc-50 sm:pb-32">
      <section className="sticky top-0 z-20 border-b border-zinc-900 bg-black/95 px-4 py-2.5 backdrop-blur pt-[calc(env(safe-area-inset-top)+0.625rem)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/hait-logo.png" alt="HA IT logo" className="h-8 w-8 rounded-xl bg-white object-contain p-1" />
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-yellow-300">
                <Dumbbell size={14} /> HA IT
              </p>
              <h1 className="text-base font-black leading-tight sm:text-lg">Workout Tracker</h1>
            </div>
          </div>

          {mode === "dashboard" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAssessmentModal(true)}
                className="flex items-center gap-1 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1.5 text-xs font-black text-yellow-300 transition hover:bg-yellow-500/20 active:scale-95"
                aria-label="Trainer Assessment"
                title="แบบประเมินตนเองและเป้าหมาย"
              >
                <Activity size={14} className="text-yellow-400" />
                <span>{userProfile ? "ผลประเมิน" : "ประเมินตัวเอง"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBodyweightModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
                aria-label="Manage bodyweight"
                title="จัดการน้ำหนักตัว"
              >
                <Scale size={14} className="text-yellow-400" />
                <span>
                  {bodyweightEntry
                    ? globalWeightUnit === "kg"
                      ? `${Math.round(bodyweightEntry.lbs * 0.453592 * 10) / 10} kg`
                      : `${Math.round(bodyweightEntry.lbs)} lbs`
                    : "—"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowNotificationSettings(true)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
                aria-label="Notification settings"
                title="ตั้งค่าการแจ้งเตือน"
              >
                <Bell size={15} className="text-yellow-400" />
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
                aria-label="Profile and Settings"
                title="โปรไฟล์และการตั้งค่า"
              >
                <Cog size={15} className="text-yellow-400" />
              </button>
              {performanceReport.currentStreak > 0 && (
                <span className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-black text-amber-300">
                  <span>🔥</span>
                  <span>{performanceReport.currentStreak}w</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 1. Sticky Active Session Topbar (Hevy/Strong Style) */}
        {["today", "preset", "custom"].includes(mode) && day && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/80 mx-auto flex max-w-5xl items-center justify-between gap-3">
            {/* Left: Overview label / workout badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#FFE500]" />
                <span>{day.title}</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                {day.exercises.length} ท่า
              </span>
            </div>

            {/* Center: Large Digital Session Stopwatch with Manual Start/Pause Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-xl shadow-inner">
                <Activity size={14} className={`text-yellow-400 ${isSessionRunning ? "animate-bounce" : "opacity-40"}`} />
                <span className="font-mono font-black text-base sm:text-lg tracking-tight text-white tabular-nums">
                  {formatStopwatch(sessionElapsedSeconds)}
                </span>
              </div>

              {/* Start / Pause / Resume Button */}
              {!isSessionRunning && sessionElapsedSeconds === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsSessionRunning(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(250,204,21,0.3)] transition active:scale-95"
                  title="เริ่มจับเวลาเวิร์กเอาต์"
                >
                  <Play size={13} className="fill-black stroke-[2.5]" />
                  <span>START</span>
                </button>
              ) : isSessionRunning ? (
                <button
                  type="button"
                  onClick={() => setIsSessionRunning(false)}
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                  title="หยุดชั่วคราว"
                >
                  <Pause size={13} className="fill-amber-300" />
                  <span className="hidden sm:inline">PAUSE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSessionRunning(true)}
                  className="flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-yellow-300 border border-yellow-500/40 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition active:scale-95"
                  title="จับเวลาต่อ"
                >
                  <Play size={13} className="fill-yellow-300" />
                  <span className="hidden sm:inline">RESUME</span>
                </button>
              )}
            </div>

            {/* Right: Prominent Volt Yellow Finish Button */}
            <button
              type="button"
              onClick={() => handleTriggerFinishWorkout(day.title, day.exercises)}
              className="flex items-center gap-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black px-3.5 py-1.5 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(250,204,21,0.35)] transition active:scale-95"
            >
              <Check size={15} className="stroke-[3]" />
              <span>Finish</span>
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-yellow-300">{pageMeta.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black">{pageMeta.title}</h2>

          {["today", "preset", "custom"].includes(mode) && (
            <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
              {/* Left: Compact Split / Plan Selector Pill & Mode Menu */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSetupDrawer((prev) => !prev)}
                  className="h-8 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 text-xs font-bold text-zinc-200 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                  title="สลับโปรแกรมหรือปรับแต่งจำนวนวัน"
                >
                  <SlidersHorizontal size={13} className="text-yellow-400" />
                  <span>
                    {mode === "custom"
                      ? `${selectedCustomPlan?.name || "Custom"} ▾`
                      : `${days} Days Split ▾`}
                  </span>
                </button>

                {/* Compact Mode Pill (Preset vs Custom) */}
                <div className="flex items-center bg-zinc-950 p-0.5 rounded-xl border border-zinc-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMode("today")}
                    className={`h-7 px-2.5 rounded-lg transition ${
                      mode === "today"
                        ? "bg-yellow-400 text-black font-black shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("preset")}
                    className={`h-7 px-2.5 rounded-lg transition ${
                      mode === "preset"
                        ? "bg-yellow-400 text-black font-black shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("custom")}
                    className={`h-7 px-2.5 rounded-lg transition ${
                      mode === "custom"
                        ? "bg-yellow-400 text-black font-black shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Right: Sleek iOS-style Segmented Lifting vs Cardio Toggle Pill */}
              {day && (
                <div className="flex items-center h-8 p-0.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSessionStage("lifting")}
                    className={`h-7 px-3 rounded-lg flex items-center gap-1.5 transition ${
                      sessionStage === "lifting"
                        ? "bg-yellow-400 text-black font-black shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Dumbbell size={13} />
                    <span>เวท ({day.exercises.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionStage("cardio")}
                    className={`h-7 px-3 rounded-lg flex items-center gap-1.5 transition ${
                      sessionStage === "cardio"
                        ? "bg-yellow-400 text-black font-black shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Activity size={13} />
                    <span>คาร์ดิโอ</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sleek Day Switcher Pill Strip */}
          {["today", "preset", "custom"].includes(mode) && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activePlan.map((item, index) => {
                const isActive = activeDayIndex === index;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isPresetLike) setSelectedDay(index);
                      else setSelectedCustomDay(index);
                      setActiveExerciseIndex(0);
                    }}
                    className={`h-8 shrink-0 rounded-lg px-3.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? "bg-yellow-400 text-black font-black shadow-sm"
                        : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <CalendarDays size={13} className={isActive ? "text-black" : "text-zinc-400"} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Setup drawer: Extracted out of active lifting view into collapsible controls */}
          {(showSetupDrawer || mode === "preset" || mode === "custom") && (
            <div className="mt-3 space-y-2.5 pt-2 border-t border-zinc-800/80 animate-in fade-in duration-150">
              {(mode === "today" || mode === "preset") && (
                <div className="rounded-xl bg-zinc-950 p-3">
                  <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Training days</label>
                  <div className="relative">
                    <select
                      value={days}
                      onChange={(event) => {
                        setDays(Number(event.target.value) as 3 | 4 | 5);
                        setSelectedDay(0);
                        setActiveExerciseIndex(0);
                      }}
                      className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold outline-none"
                    >
                      <option value={3}>3 days Full Body</option>
                      <option value={4}>4 days Upper / Lower</option>
                      <option value={5}>5 days Split</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-3 text-zinc-400" size={18} />
                  </div>
                </div>
              )}

              {mode === "custom" && selectedCustomPlan && (
                <div className="rounded-xl bg-zinc-950 p-3">
                  <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Custom plan</label>
                  <div className="relative">
                    <select
                      value={selectedCustomPlan?.id ?? ""}
                      onChange={(event) => {
                        setSelectedCustomPlanId(event.target.value);
                        setSelectedCustomDay(0);
                        setActiveExerciseIndex(0);
                      }}
                      className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold outline-none"
                    >
                      {customPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-3 text-zinc-400" size={18} />
                  </div>
                </div>
              )}

              {(mode === "today" || mode === "preset") && days === 5 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-zinc-500">5 day split type</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setFiveDayMode("twoLegDays"); setSelectedDay(0); }} className={`rounded-xl px-3 py-2.5 text-xs font-black ${fiveDayMode === "twoLegDays" ? "bg-yellow-400 text-black font-black" : "bg-zinc-900 text-zinc-300"}`}>2 Leg Days</button>
                    <button onClick={() => { setFiveDayMode("oneLegDay"); setSelectedDay(0); }} className={`rounded-xl px-3 py-2.5 text-xs font-black ${fiveDayMode === "oneLegDay" ? "bg-yellow-400 text-black font-black" : "bg-zinc-900 text-zinc-300"}`}>1 Leg Day</button>
                  </div>
                </div>
              )}

              {/* Weekly Training Schedule (Mon-Sun) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase text-zinc-400">📅 ตารางวันฝึกประจำสัปดาห์ (Weekly Schedule)</p>
                  <span className="text-[10px] text-zinc-500">เลือกวันที่ซ้อม vs พัก</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(
                    [
                      { key: "mon", label: "จ." },
                      { key: "tue", label: "อ." },
                      { key: "wed", label: "พ." },
                      { key: "thu", label: "พฤ." },
                      { key: "fri", label: "ศ." },
                      { key: "sat", label: "ส." },
                      { key: "sun", label: "อา." },
                    ] as const
                  ).map((d) => {
                    const active = weeklySchedule[d.key];
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => handleToggleScheduleDay(d.key)}
                        className={`py-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                          active
                            ? "bg-yellow-400 text-black font-black shadow-sm"
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                        }`}
                      >
                        <span>{d.label}</span>
                        <span className="text-[9px] font-mono">{active ? "ซ้อม" : "พัก"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DEDICATED HOME DASHBOARD (mode === "dashboard")                           */}
        {/* ========================================================================= */}
        {mode === "dashboard" && (
          <div className="mt-3 space-y-4">
            {/* A. Personalized Profile Card with Inline Editable Name */}
            <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-14 w-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(250,204,21,0.35)] shrink-0">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveUserName();
                            if (e.key === "Escape") setIsEditingName(false);
                          }}
                          autoFocus
                          placeholder="ชื่อของคุณ"
                          className="rounded-lg bg-zinc-900 border border-yellow-400 px-2.5 py-1 text-sm font-black text-white outline-none w-36 sm:w-48"
                        />
                        <button
                          type="button"
                          onClick={handleSaveUserName}
                          className="rounded-lg bg-yellow-400 px-2.5 py-1 text-xs font-black text-black"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="text-xs text-zinc-400 px-1 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-black text-white font-mono truncate">
                          {userName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setTempName(userName);
                            setIsEditingName(true);
                          }}
                          className="text-zinc-500 hover:text-yellow-400 transition"
                          title="แก้ไขชื่อผู้ใช้"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded-md bg-yellow-400/10 border border-yellow-500/30 px-2 py-0.5 font-bold text-yellow-300">
                        {userProfile ? `Exp ${userProfile.expMonths}m` : "Intermediate"}
                      </span>
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                        {bodyweightEntry ? `${Math.round(bodyweightEntry.lbs * 0.453592)} kg` : userProfile?.weightKg ? `${userProfile.weightKg} kg` : "70 kg"}
                      </span>
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-zinc-400">
                        {days} Days Split
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-zinc-400 hover:text-yellow-400 transition shrink-0"
                  title="เปิดการตั้งค่าโปรไฟล์"
                >
                  <User size={18} />
                </button>
              </div>
            </div>

            {/* B. "Today's Workout" Visual Hero Card or Rest Day Card */}
            {isTodayScheduledRest ? (
              <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-black text-yellow-300 uppercase tracking-wider">
                      <span>😴 REST & RECOVERY DAY</span>
                    </span>
                    <h3 className="mt-2 text-xl sm:text-2xl font-black text-white tracking-tight">
                      วันนี้เป็นวันพักผ่อน (Rest Day) 😴
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                      ร่างกายกำลังซ่อมแซมและสร้างกล้ามเนื้อ (Hypertrophy เกิดขึ้นขณะพักผ่อน) ดื่มน้ำ ทานโปรตีนให้เพียงพอ และนอนหลับให้เต็มอิ่ม 💙
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("today");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2.5 text-xs font-black text-yellow-300 hover:bg-yellow-400/20 transition active:scale-95"
                      >
                        ⚡ ซ้อมต่อ / เลือกวันเอง
                      </button>
                    </div>
                  </div>

                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-4xl shrink-0 self-center sm:self-auto">
                    🛋️
                  </div>
                </div>
              </div>
            ) : dashboardDay ? (
              <div className="rounded-3xl border border-yellow-500/30 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-4 sm:p-5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Program focus, muscles, and estimated time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-black text-yellow-300 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#FFE500]" />
                        <span>TODAY'S WORKOUT</span>
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 font-bold">
                        {dashboardDay.exercises.length} ท่า · ประมาณ 45-60 นาที
                      </span>
                    </div>

                    <h3 className="mt-2 text-xl sm:text-2xl font-black text-white tracking-tight">
                      วันนี้เล่น: <span className="text-yellow-300">{dashboardDay.title}</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{dashboardDay.subtitle}</p>

                    {/* Target Muscle Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {dashboardDay.focus.map((focusGroup, idx) => (
                        <span
                          key={focusGroup}
                          className="inline-flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-zinc-900/90 px-2.5 py-1 text-xs font-bold text-yellow-300"
                        >
                          <span className={idx === 0 ? "text-yellow-400" : "text-purple-400"}>●</span>
                          <span>{focusGroup}</span>
                        </span>
                      ))}
                      {dashboardMuscleSummary.primary.slice(0, 3).map((r) => (
                        <span
                          key={r}
                          className="rounded-lg bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-400"
                        >
                          {MUSCLE_REGION_LABELS[r]}
                        </span>
                      ))}
                    </div>

                    {/* Direct CTA Button */}
                    <div className="mt-4 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSessionStage("lifting");
                          setMode("today");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black py-3 px-6 font-black uppercase tracking-wider text-sm shadow-[0_0_25px_rgba(250,204,21,0.4)] transition active:scale-[0.98]"
                      >
                        <Play size={16} className="fill-black stroke-[2.5]" />
                        <span>▶ เริ่มเวิร์กเอาต์วันนี้</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Integrated 3D Anatomical Muscle Figure with Volt Yellow & Purple highlights */}
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-2.5 shrink-0 self-center sm:self-auto shadow-inner">
                    <div className="text-center">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1">Front</p>
                      <RealisticAnatomyFigure
                        side="front"
                        primary={dashboardMuscleSummary.primary}
                        secondary={dashboardMuscleSummary.secondary}
                        compact
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1">Back</p>
                      <RealisticAnatomyFigure
                        side="back"
                        primary={dashboardMuscleSummary.primary}
                        secondary={dashboardMuscleSummary.secondary}
                        compact
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* C. Performance Overview with Apple-Style Activity Ring & Embedded 6-Component Breakdown */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-2xl space-y-4">
              <AppleActivityRing
                score={performanceReport.hasData ? performanceReport.score : 0}
                rank={performanceReport.rank}
                weeklyScores={weeklyScores}
                streakWeeks={performanceReport.currentStreak}
                onOpenScoreDetails={() => setShowScoreModal(true)}
              />

              {/* Directly Embedded 6 Component Score Breakdown */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                    📊 การคำนวณคะแนน 6 องค์ประกอบ (Scoring Breakdown)
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono">100% Total Weight</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <ScoreBar label="Strength (25%)" value={performanceReport.progress} />
                  <ScoreBar label="Volume (25%)" value={performanceReport.volume} />
                  <ScoreBar label="Consistency (20%)" value={performanceReport.consistency} />
                  <ScoreBar label="Completion (15%)" value={performanceReport.completion} />
                  <ScoreBar label="Recovery 😴 (10%)" value={performanceReport.recovery} />
                  <ScoreBar label="Streak 🔥 (5%)" value={performanceReport.streakBonus} />
                </div>

                {/* 4-Week Mini Trend Chart */}
                <WeeklyPerformanceMiniChart trends={performanceReport.weeklyTrends} />
              </div>
            </div>

            {/* Quick Status Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Current Streak</p>
                <p className="mt-1 text-lg font-black text-amber-300 font-mono flex items-center gap-1">
                  <span>🔥</span>
                  <span>{performanceReport.currentStreak} Weeks</span>
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Weekly Target</p>
                <p className="mt-1 text-lg font-black text-yellow-300 font-mono">
                  {days} Days / Week
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bodyweight</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-lg font-black text-white font-mono">
                    {bodyweightEntry ? `${Math.round(bodyweightEntry.lbs * 0.453592 * 10) / 10} kg` : "70 kg"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowBodyweightModal(true)}
                    className="text-[11px] font-bold text-yellow-400 hover:underline"
                  >
                    อัปเดต
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "history" && (
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black"><ClipboardList size={18} /> History Log</h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">บันทึกประวัติการฝึกและสถิติถาวร (Permanent Records)</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 rounded-xl bg-zinc-950 p-1">
                  <button
                    onClick={() => setHistoryRange("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${historyRange === "all" ? "bg-yellow-400 text-black font-black" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setHistoryRange("30d")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${historyRange === "30d" ? "bg-yellow-400 text-black font-black" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    30 วัน
                  </button>
                  <button
                    onClick={() => setHistoryRange("14d")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${historyRange === "14d" ? "bg-yellow-400 text-black font-black" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    14 วัน
                  </button>
                </div>
                {logs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportLogsToCsv}
                      className="flex items-center gap-1.5 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs font-bold text-yellow-300 transition hover:bg-yellow-500/20"
                      aria-label="Export history to CSV"
                    >
                      <Download size={15} /> Export CSV
                    </button>
                    <button
                      onClick={clearHistory}
                      className="rounded-2xl border border-red-500/40 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                      aria-label="Clear history"
                      title="Clear history logs"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {filteredHistoryLogs.length === 0 && filteredCardioLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
                {logs.length === 0 && cardioLogs.length === 0 ? "No workout log yet. Save working sets or cardio sessions first." : "ไม่พบประวัติการฝึกในช่วงเวลาที่เลือก"}
              </div>
            ) : (
              <div className="space-y-3 pr-1">
                {allHistoryDates.map((date) => {
                  const liftItems = recentLogsByDate[date] || [];
                  const cardioItems = recentCardioLogsByDate[date] || [];

                  return (
                    <div key={date} className="rounded-2xl bg-zinc-950 p-3">
                      <h4 className="mb-3 text-sm font-black text-yellow-300">{date}</h4>
                      <div className="space-y-2">
                        {/* Cardio Sessions */}
                        {cardioItems.map((c) => {
                          const typeLabelMap: Record<string, string> = {
                            treadmill: "Treadmill Run",
                            incline_walk: "Incline Walk",
                            rower: "Rower",
                            bike: "Bike",
                            outdoor: "Outdoor Run",
                          };
                          const label = typeLabelMap[c.type] || c.type;

                          return (
                            <div key={c.id} className="rounded-2xl border border-yellow-500/30 bg-zinc-900/90 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center flex-wrap gap-1.5">
                                    <span className="rounded-md bg-yellow-400 text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                      ⚡ CARDIO
                                    </span>
                                    <span className="font-bold text-zinc-100">{label}</span>
                                    {c.distanceKm !== undefined && (
                                      <span className="rounded-md bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-500/20 font-mono">
                                        {c.distanceKm} km
                                      </span>
                                    )}
                                    <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 font-mono">
                                      {c.durationMin} min
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    {formatShortDate(c.date)}
                                    {c.paceOrSpeed ? ` · ${c.paceOrSpeed}` : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right">
                                    <p className="whitespace-nowrap text-sm font-black text-yellow-300 font-mono">
                                      {c.distanceKm ? `${c.distanceKm} km · ` : ""}{c.durationMin} min
                                    </p>
                                    {c.paceOrSpeed && (
                                      <p className="text-[10px] text-zinc-400 font-mono">
                                        {c.paceOrSpeed}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteCardioLog(c.id)}
                                    className="p-1 text-zinc-600 hover:text-red-400 transition"
                                    title="Delete cardio log"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Lifting Sets */}
                        {liftItems.map((item, index) => (
                          <div key={`${item.date}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold leading-tight flex items-center flex-wrap gap-1.5">
                                  <span>{item.exerciseName}</span>
                                  {item.machine && (
                                    <span className="rounded-md bg-yellow-400/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-500/20">
                                      {item.machine}
                                    </span>
                                  )}
                                </p>
                                <p className="mt-1 text-[11px] text-zinc-500">{formatShortDate(item.date)} · Set {item.setNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="whitespace-nowrap text-sm font-black text-yellow-300">
                                  {item.rawValue !== undefined && item.unit
                                    ? `${item.rawValue} ${item.unit}`
                                    : `${Math.round(item.weightLbs * 10) / 10} lbs`}
                                  {" × "}{item.reps}
                                </p>
                                {item.unit === "kg" && item.rawValue !== undefined && (
                                  <p className="text-[10px] text-zinc-500">
                                    ≈ {Math.round(item.weightLbs * 10) / 10} lbs
                                  </p>
                                )}
                                {item.unit === "lbs" && item.rawValue !== undefined && (
                                  <p className="text-[10px] text-zinc-500">
                                    ≈ {Math.round(item.weightLbs * 0.453592 * 10) / 10} kg
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Progress Photos Tracking */}
            <div className="mt-5">
              <ProgressPhotos />
            </div>
          </div>
        )}

        {mode === "library" && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2">
              <Search size={18} className="text-zinc-500" />
              <input
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent py-2 outline-none"
              />
            </div>

            <div className="space-y-2">
              {allGroups.map((group) => {
                const names = filteredLibrary.filter((item) => item.group === group);
                if (names.length === 0) return null;

                return (
                  <details key={group} className="rounded-2xl bg-zinc-950 p-3" open={librarySearch.trim().length > 0}>
                    <summary className="cursor-pointer text-sm font-black text-yellow-300">
                      <Library size={14} className="mr-2 inline" /> {group} · {names.length}
                    </summary>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {names.map((item) => (
                        <a
                          key={item.name}
                          href={youtubeSearch(`${item.name} proper form`)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-zinc-900 px-3 py-3 text-sm text-zinc-300"
                        >
                          <span className="font-bold">{item.name}</span>
                          <span className="mt-1 block text-xs text-zinc-500">
                            {item.movement} · {LOAD_LABELS[getLoadType(item)]} · {item.tier}
                          </span>
                        </a>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {mode === "custom" && selectedCustomPlan && (
          <details className="mt-4 rounded-3xl border border-yellow-400/20 bg-zinc-900 p-4">
            <summary className="cursor-pointer text-base font-black text-yellow-300">Plan settings</summary>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Plan name</label>
                <input
                  value={selectedCustomPlan.name}
                  onChange={(event) => updateCustomPlanName(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-black outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={createNewCustomPlan}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-3 py-3 text-xs font-black text-zinc-300"
                >
                  <Plus size={15} /> New
                </button>
                <button
                  onClick={addCustomDay}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-black font-black px-3 py-3 text-xs font-black text-zinc-950"
                >
                  <Plus size={15} /> Day
                </button>
                <button
                  onClick={deleteCustomPlan}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-black text-red-300"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          </details>
        )}

        {mode === "custom" && day && (
          <details className="mt-4 rounded-3xl border border-yellow-400/20 bg-zinc-900 p-4">
            <summary className="cursor-pointer text-base font-black text-yellow-300">
              🛠️ Drag & Drop Plan Builder ({day.title})
            </summary>
            <div className="mt-4">
              <PlanBuilder
                exercises={day.exercises}
                library={exerciseLibrary}
                onAdd={addExerciseToCurrentDay}
                onRemove={removeExerciseFromCurrentDay}
                onReorder={reorderCustomExercises}
              />
            </div>
          </details>
        )}

        {(mode === "today" || mode === "preset" || mode === "custom") && day && (
          <>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
              {mode === "custom" ? (
                <div className="mb-3 grid gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={day.title}
                      onChange={(event) => updateCustomDay(day.id, (current) => ({ ...current, title: event.target.value }))}
                      className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg font-black outline-none"
                    />
                    <button
                      onClick={() => deleteCustomDay(day.id)}
                      className="shrink-0 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300"
                      aria-label="Delete day"
                    >
                      <MinusCircle size={18} />
                    </button>
                  </div>

                  <details className="rounded-2xl bg-zinc-950 p-3">
                    <summary className="cursor-pointer text-xs font-bold text-zinc-300">
                      Targets & recommend
                    </summary>

                    <div className="mt-3">
                      <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Target muscles</p>
                      <div className="flex flex-wrap gap-2">
                        {allGroups.map((group) => (
                          <button
                            key={group}
                            onClick={() => toggleDayFocus(group)}
                            className={`rounded-full px-3 py-2 text-xs font-bold ${
                              day.focus.includes(group) ? "bg-yellow-400 text-black font-black" : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={recommendIntoCurrentDay}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 text-black font-black px-4 py-3 text-sm font-black text-zinc-950"
                      >
                        <Sparkles size={16} /> Recommend
                      </button>
                    </div>
                  </details>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-black sm:text-xl">{day.title}</h2>
                  <p className="mt-1 text-xs text-zinc-500 sm:text-sm">{day.subtitle}</p>
                </>
              )}

              <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-400">Target:</span>
                  {day.focus.map((focus) => (
                    <span key={focus} className="rounded-lg bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-1 text-xs font-bold text-yellow-300">
                      {focus}
                    </span>
                  ))}
                  {/* Compact Anatomy Pill (i) button */}
                  <button
                    type="button"
                    onClick={() => setShowAnatomyModal(true)}
                    className="flex items-center gap-1 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-300 hover:bg-yellow-500/20 transition active:scale-95"
                    title="เปิดแผนภาพกายวิภาค 3D"
                    aria-label="View anatomical muscle diagram"
                  >
                    <Info size={13} />
                    <span>3D Anatomy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Exercise Queue & Reordering Carousel (Rendered when in lifting stage) */}
            {sessionStage === "lifting" && (
              <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white">คิวลำดับท่าฝึก</h3>
                    <span className="text-[11px] text-zinc-500 font-bold">
                      {activeExerciseIndex + 1}/{day.exercises.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompactList((value) => !value)}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:border-yellow-500/30 transition"
                    >
                      {compactList ? "แสดงท่าเดียว (Focus)" : "แสดงทุกท่า (All)"}
                    </button>
                  </div>
                </div>

                {/* Queue Carousel with Reorder (←/→) and Quick Substitute button */}
                <div className="flex snap-x gap-2 overflow-x-auto pb-1.5 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {day.exercises.map((item, index) => {
                    const isSelected = activeExerciseIndex === index;
                    return (
                      <div
                        key={item.id}
                        className={`min-w-[130px] max-w-[150px] shrink-0 snap-start rounded-xl p-2.5 flex flex-col justify-between transition border ${
                          isSelected
                            ? "bg-zinc-900 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.25)]"
                            : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700"
                        }`}
                      >
                        {/* Top: Set # + Move buttons */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveExerciseIndex(index);
                              setCompactList(true);
                            }}
                            className={`text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                              isSelected ? "bg-yellow-400 text-black font-black" : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            #{index + 1}
                          </button>

                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSessionExercise(index, -1);
                                if (activeExerciseIndex === index) setActiveExerciseIndex(index - 1);
                                else if (activeExerciseIndex === index - 1) setActiveExerciseIndex(index);
                              }}
                              className="h-6 w-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 transition"
                              title="ย้ายไปก่อนหน้า"
                              aria-label="Move exercise earlier"
                            >
                              <ChevronLeft size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={index === day.exercises.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSessionExercise(index, 1);
                                if (activeExerciseIndex === index) setActiveExerciseIndex(index + 1);
                                else if (activeExerciseIndex === index + 1) setActiveExerciseIndex(index);
                              }}
                              className="h-6 w-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 transition"
                              title="ย้ายไปถัดไป"
                              aria-label="Move exercise later"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Title button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveExerciseIndex(index);
                            setCompactList(true);
                          }}
                          className="text-left w-full my-1 group"
                        >
                          <span className={`line-clamp-2 text-xs font-bold leading-4 transition ${
                            isSelected ? "text-yellow-300 font-black" : "text-zinc-300 group-hover:text-white"
                          }`}>
                            {substituteMap[item.id] || item.name}
                          </span>
                        </button>

                        {/* Bottom: Quick Swap equipment/variant button */}
                        <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 font-mono">{item.sets} Sets</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveExerciseIndex(index);
                              setSubstituteModalExercise(item);
                              setSubstituteSearch("");
                              setSubstituteFilter("movement");
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 hover:text-yellow-300 transition py-0.5 px-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40"
                            title="สลับท่าหรือเครื่องเล่นนี้"
                          >
                            <ArrowLeftRight size={11} />
                            <span>สลับ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sessionStage === "lifting" && (
              <>
                <details className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-zinc-300">Volume</summary>
                  <p className="mt-2 text-xs text-zinc-400">Direct weekly sets</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {weeklyVolumeSummary.map(([muscle, sets]) => (
                      <div key={muscle} className="rounded-2xl bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">{muscle}</p>
                        <p className="mt-1 text-lg font-black">{sets} sets / week</p>
                      </div>
                    ))}
                  </div>
                </details>

                {mode === "custom" && selectedCustomPlan && (
                  <>
                    <div className="mt-4">
                  <MuscleTapBuilder
                    exercises={exerciseLibrary}
                    onPick={(name) => addExerciseToCurrentDay(name)}
                    currentExercises={day?.exercises.map((e) => ({ name: e.name, sets: e.sets })) ?? []}
                  />
                </div>

                <details className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                  <summary className="cursor-pointer text-xs text-zinc-400 font-bold">
                    <Plus size={16} className="mr-2 inline" /> วิธีเก่า: ค้นหาจากชื่อ / กลุ่มกล้ามเนื้อ
                  </summary>

                <div className="mt-4">
                  <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr]">
                    <select
                      value={exerciseGroupFilter}
                      onChange={(event) => setExerciseGroupFilter(event.target.value as MuscleGroup | "All")}
                      className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="All">All groups</option>
                      {allGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                      <Search size={16} className="text-zinc-500" />
                      <input
                        value={exerciseSearch}
                        onChange={(event) => setExerciseSearch(event.target.value)}
                        placeholder="Search"
                        className="w-full bg-transparent py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {filteredExercisePicker.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => addExerciseToCurrentDay(item.name)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-zinc-950 px-3 py-3 text-left"
                      >
                        <span>
                          <span className="block font-bold">{item.name}</span>
                          <span className="text-xs text-zinc-500">
                            {item.group} · {item.movement} · {LOAD_LABELS[getLoadType(item)]} · {item.tier}
                          </span>
                        </span>
                        <Plus size={18} className="text-yellow-300" />
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            </>
          )}
          </>
        )}

            {/* Exercise Cards Grid — ONLY during lifting stage */}
            {sessionStage === "lifting" && (
            <div className="mt-4 grid gap-4">
              {visibleExercises.map((baseExercise) => {
                const index = day.exercises.findIndex((item) => item.id === baseExercise.id);
                const selectedSubstitute = substituteMap[baseExercise.id];
                const exercise = mode === "custom" || !selectedSubstitute ? baseExercise : applyExerciseIdentity(baseExercise, selectedSubstitute);
                const lastUsedMachine = lastUsedMachineMap[exercise.name] || "";
                const favMachine = favoriteMachines[exercise.name] || "";
                // Priority 1: Last played machine (from logs)
                // Priority 2: Favorite machine (starred)
                // Priority 3: Assessed / anatomical default (exercise.load)
                const autoResolvedMachine = lastUsedMachine || favMachine || "";
                const currentMachine = machineTags[baseExercise.id] !== undefined ? machineTags[baseExercise.id] : autoResolvedMachine;
                const isFavoriteMachine = Boolean(currentMachine && favoriteMachines[exercise.name] === currentMachine);
                const effectiveLoad: LoadType = currentMachine
                  ? mapMachineVariantToLoad(currentMachine, exercise.load)
                  : (exercise.load || getLoadType(exercise));
                const effectiveKey = getEffectiveExerciseKey(exercise.name, currentMachine);
                const records = recordsMap[effectiveKey] ?? (currentMachine ? {} : recordsMap[exercise.name]) ?? {};
                const pr = records.maxWeight ?? prMap[effectiveKey] ?? (currentMachine ? undefined : prMap[exercise.name]);
                const warmups = exercise.warmup ? getWarmupSets(pr?.weightLbs) : [];
                const restMode = restModeMap[baseExercise.id] ?? "normal";
                const selectedRestSeconds = customRestMap[baseExercise.id] ?? getRestSecondsByMode({ ...exercise, id: baseExercise.id }, restMode);
                const effectiveSets = (mode === "preset" || mode === "today") && presetSetsMap[baseExercise.id]
                  ? presetSetsMap[baseExercise.id]
                  : exercise.sets;
                const rawSetInputs = inputs[baseExercise.id];
                const currentSetInputs = normalizeSetInputs(rawSetInputs, effectiveSets);
                const alternatives = getAlternatives(exercise);
                const effectiveUnit = getEffectiveUnitForExercise(exercise.name, currentMachine);
    const isIso = exercise.movement.toLowerCase().includes("isolation") || exercise.movement.toLowerCase().includes("curl") || exercise.movement.toLowerCase().includes("raise") || exercise.movement.toLowerCase().includes("ext");

    const aiWeightSuggestion = userProfile ? (() => {
      const muscleMass = userProfile.muscleMassKg ?? Math.round(userProfile.weightKg * 0.42);
      const muscleMode = userProfile.muscleMassMode ?? "smm";
      const muscleInfo = evaluateMuscleMass(currentGender, userProfile.weightKg, muscleMass, muscleMode);
      const safeModifier = Number.isFinite(muscleInfo.modifier) && muscleInfo.modifier > 0 ? muscleInfo.modifier : 1.0;
      const bioRes = calculatePrescriptionWeight(exercise.name, effectiveLoad, exercise.reps, userProfile, safeModifier, currentMachine);
      return effectiveUnit === "lbs"
        ? Math.round(bioRes.hardwareWeightKg * 2.20462 * 10) / 10
        : bioRes.hardwareWeightKg;
    })() : 0;

    // Check set #1 from inputs or logs (Set numbers start at 1, not 0)
    const inputWeightSet1 = parseFloat(currentSetInputs[0]?.weightLbs);
    const inputRepsSet1 = parseFloat(currentSetInputs[0]?.reps);
    const lastSet1 = lastSetMap[effectiveKey]?.[1] ?? (!currentMachine ? lastSetMap[exercise.name]?.[1] : undefined);
    const lastSet1Weight = lastSet1 ? (lastSet1.rawValue ?? lastSet1.weightLbs) : 0;
    const lastSet1Unit = lastSet1?.unit ?? "lbs";
    const lastSet1InLbs = lastSet1Unit === "kg" ? convertWeight(lastSet1Weight, "kg", "lbs") : lastSet1Weight;

    const loggedWeightSet1 = lastSet1Weight > 0
      ? (lastSet1Unit === effectiveUnit ? lastSet1Weight : (effectiveUnit === "kg" ? Math.round(lastSet1InLbs * 0.453592 * 10) / 10 : Math.round(lastSet1InLbs * 10) / 10))
      : undefined;
    const loggedRepsSet1 = lastSet1?.reps;
    const prWeight = pr?.weightLbs ? (effectiveUnit === "kg" ? Math.round(pr.weightLbs * 0.453592) : pr.weightLbs) : 0;

    const userBwLbs = bodyweightEntry?.lbs ?? (userProfile?.weightKg ? userProfile.weightKg * 2.20462 : 0);

    // Only calculate e1RM if real history exists; otherwise keep as 0 to trigger !hasHistory
    const e1RMLbs = (pr?.weightLbs && pr.weightLbs > 0)
      ? epley1RM(pr.weightLbs, pr.reps || 1)
      : (Number.isFinite(inputWeightSet1) && inputWeightSet1 > 0)
      ? epley1RM(effectiveUnit === "kg" ? inputWeightSet1 * 2.20462 : inputWeightSet1, inputRepsSet1 > 0 ? inputRepsSet1 : 8)
      : (lastSet1InLbs > 0)
      ? epley1RM(lastSet1InLbs, loggedRepsSet1 ? Number(loggedRepsSet1) : 8)
      : 0;

    const forcedTier = manualTierMap[baseExercise.id];
    const strengthTierInfo = userBwLbs > 0
      ? evaluateRelativeStrength(
          exercise.name,
          effectiveLoad,
          e1RMLbs,
          userBwLbs,
          currentGender,
          effectiveUnit,
          exercise.reps,
          userProfile?.expMonths ?? 12,
          forcedTier,
          userProfile?.muscleMassKg
        )
      : null;

    // Cleanly synchronize baseline working weight: use logged/input weight first, then tier target weight
    const fallbackStartingWeight = strengthTierInfo?.targetDisplayWeight ?? (effectiveUnit === "kg" ? 20 : 45);

    const baselineWorkingWeight = 
      (Number.isFinite(inputWeightSet1) && inputWeightSet1 > 0) ? inputWeightSet1 :
      (loggedWeightSet1 !== undefined && loggedWeightSet1 > 0) ? loggedWeightSet1 :
      (prWeight > 0) ? prWeight :
      fallbackStartingWeight;

    const warmupInfo = getIntelligentWarmup(
      exercise,
      index,
      day.exercises,
      baselineWorkingWeight,
      effectiveUnit,
      effectiveLoad
    );

                const isExpanded = expandedExercises[baseExercise.id] ?? true;
                const completedSetsCount = currentSetInputs.filter((s) => s.done).length;

                return (
                  <article key={baseExercise.id} className="rounded-3xl bg-[#121214] border border-zinc-800/60 shadow-xl overflow-hidden w-full max-w-full transition-all">
                    {/* Accordion Exercise Header Bar (Clickable to Expand/Collapse) */}
                    <div
                      onClick={() => toggleExerciseAccordion(baseExercise.id)}
                      className="cursor-pointer p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-[#161619] transition select-none"
                    >
                      {/* Left: Exercise Number + Name + Completed Sets Badge */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-zinc-500">#{index + 1}</span>
                          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white font-mono break-words leading-snug">
                            {exercise.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-mono ${
                            completedSetsCount === effectiveSets
                              ? "bg-yellow-400 text-black font-black shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                              : completedSetsCount > 0
                              ? "bg-yellow-400/20 text-yellow-300 border border-yellow-500/30"
                              : "bg-zinc-800/80 text-zinc-400"
                          }`}>
                            <span>{effectiveSets} Sets</span>
                            <span>·</span>
                            <span>{completedSetsCount}/{effectiveSets}</span>
                          </span>
                          <span className="text-[11px] text-zinc-500 hidden sm:inline">
                            {LOAD_LABELS[effectiveLoad]}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions (Substitute / YouTube / Delete) + Chevron Indicator */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSubstituteModalExercise(baseExercise);
                            setSubstituteSearch("");
                            setSubstituteFilter("movement");
                          }}
                          className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-xs font-bold text-yellow-400 hover:border-yellow-400 transition active:scale-95"
                          title="เปลี่ยนท่าสำรอง หรือสลับเครื่องเล่น"
                        >
                          <RotateCcw size={14} />
                          <span className="hidden sm:inline">สลับท่า/เครื่อง</span>
                        </button>
                        <a
                          href={youtubeSearch(`${exercise.name} proper form`)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-300 hover:text-white transition"
                          aria-label="Watch demo"
                          title="ดูคลิปสอนฟอร์ม"
                        >
                          <PlayCircle size={18} />
                        </a>
                        {mode === "custom" && (
                          <button
                            onClick={() => removeExerciseFromCurrentDay(baseExercise.id)}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                            aria-label="Remove exercise"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExerciseAccordion(baseExercise.id)}
                          className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 hover:text-yellow-400 transition"
                          aria-label={isExpanded ? "Collapse exercise" : "Expand exercise"}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Expanded Body */}
                    {isExpanded && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-zinc-900/80 pt-3">
                        <div className="mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs font-bold text-yellow-300">{exercise.group}</span>
                            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-400">{exercise.movement}</span>
                            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-400">
                              {LOAD_LABELS[effectiveLoad]}
                            </span>
                            {mode === "preset" && substituteMap[baseExercise.id] && (
                              <span className="rounded-full bg-blue-400/10 px-2.5 py-0.5 text-xs font-bold text-blue-300">Subbed</span>
                            )}
                            {exercise.warmup ? (
                              <span className="rounded-full bg-orange-400/10 px-2.5 py-0.5 text-xs font-bold text-orange-300">
                                <Flame className="mr-1 inline" size={11} /> Warmup
                              </span>
                            ) : null}
                          </div>

                          {strengthTierInfo && (
                            <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 rounded-xl bg-zinc-950/80 border border-zinc-800 p-2.5">
                              {/* Interactive Click-to-Cycle Tier Badge */}
                              <button
                                type="button"
                                onClick={() => {
                                  const order: ("Beginner" | "Intermediate" | "Advanced" | "Elite")[] = ["Beginner", "Intermediate", "Advanced", "Elite"];
                                  const nextIdx = (order.indexOf(strengthTierInfo.tier) + 1) % order.length;
                                  setManualTierMap((prev) => ({ ...prev, [baseExercise.id]: order[nextIdx] }));
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black uppercase transition active:scale-95 ${strengthTierInfo.badgeClass}`}
                                title="แตะเพื่อสลับระดับเป้าหมายที่ต้องการคำนวณ"
                              >
                                <span>{strengthTierInfo.label}</span>
                                <span className="text-[10px] text-zinc-500 font-normal">✎</span>
                              </button>

                              {/* Clear Actionable Goal Message */}
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-bold text-yellow-300">
                                  {strengthTierInfo.actionableMessage}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                    {/* [Order 2] Integrated 3D Muscle & Target Strip (Inline Layout) */}
                    <ExerciseMusclePreviewCard exercise={exercise} />

                    {/* [Order 3] Compact Machine Dropdown Selector */}
                    <div className="mb-3 rounded-xl border border-zinc-800/80 bg-zinc-950 p-2.5 space-y-2 w-full">
                      <div className="flex items-center gap-2 min-w-0 w-full">
                        <Dumbbell className="text-yellow-400 shrink-0" size={14} />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">เครื่อง:</span>

                        <div className="relative flex-1 min-w-0">
                          {(() => {
                            const exNameLower = exercise.name.toLowerCase();
                            const isRow = exNameLower.includes("row");
                            const isChest = exNameLower.includes("press") || exNameLower.includes("bench") || exNameLower.includes("chest");
                            const isPulldown = exNameLower.includes("pulldown") || exNameLower.includes("pull down") || exNameLower.includes("lat pull");

                            const contextualMachineOptions = isRow
                              ? ["Standard Selectorized", "Chest-Supported Machine", "Iso-Lateral High Row", "Iso-Lateral Low Row", "Seated Cable (Free)", "T-Bar Supported"]
                              : isChest
                              ? ["Standard Machine Press", "Incline Machine Press", "Decline Machine Press", "Iso-Lateral Flat", "Iso-Lateral Incline", "Converging Cable"]
                              : isPulldown
                              ? ["Lat Pulldown (Pin-Loaded)", "Iso-Lateral Front Pulldown", "Dual Cable Pulldown"]
                              : ["Pin-Selectorized", "Plate-Loaded", "Cable", "Barbell", "Dumbbell", "Smith Machine"];

                            return (
                              <select
                                value={currentMachine || ""}
                                onChange={(e) => updateMachineTag(baseExercise.id, e.target.value)}
                                className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-2.5 pr-8 text-xs font-bold text-zinc-100 outline-none focus:border-yellow-400 transition"
                              >
                                <option value="">เครื่องมาตรฐาน ({LOAD_LABELS[exercise.load || getLoadType(exercise)]})</option>
                                {contextualMachineOptions.map((tag) => (
                                  <option key={tag} value={tag}>
                                    {tag} {lastUsedMachine === tag ? "● ล่าสุด" : ""} {favoriteMachines[exercise.name] === tag ? "⭐" : ""}
                                  </option>
                                ))}
                                {currentMachine && !contextualMachineOptions.includes(currentMachine) && (
                                  <option value={currentMachine}>{currentMachine} (กำหนดเอง) {favoriteMachines[exercise.name] === currentMachine ? "⭐" : ""}</option>
                                )}
                              </select>
                            );
                          })()}
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 text-zinc-400" size={14} />
                        </div>
                      </div>

                      {/* Auxiliary Controls (Star ⭐, Unit ⚙️, Reset) in clean compact sub-bar */}
                      {currentMachine && (
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-900">
                          <button
                            type="button"
                            onClick={() => toggleFavoriteMachine(exercise.name, currentMachine)}
                            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition border ${
                              isFavoriteMachine
                                ? "border-amber-400/40 bg-amber-400/20 text-amber-300"
                                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                            }`}
                            title={isFavoriteMachine ? "ลบเครื่องโปรด" : "ตั้งเป็นเครื่องประจำ"}
                          >
                            <Star size={11} className={isFavoriteMachine ? "fill-amber-400 text-amber-400" : ""} />
                            <span>{isFavoriteMachine ? "เครื่องโปรด ⭐" : "ตั้งเป็นเครื่องประจำ"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleExerciseUnit({ ...exercise, id: baseExercise.id, sets: effectiveSets }, currentMachine, effectiveSets)}
                            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-yellow-300 hover:border-yellow-400 transition"
                            title="สลับหน่วยน้ำหนัก"
                          >
                            ⚙️ หน่วย: {effectiveUnit}
                          </button>

                          <button
                            type="button"
                            onClick={() => updateMachineTag(baseExercise.id, "")}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 py-0.5"
                            title="รีเซ็ตเครื่องเป็นค่าเริ่มต้น"
                          >
                            รีเซ็ต
                          </button>
                        </div>
                      )}
                    </div>

                    {/* [Order 4] SMART WARMUP STRIP */}
                    {warmupInfo && (
                      <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 w-full">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold flex items-center gap-1.5 text-zinc-300">
                            {warmupInfo.type === "full" && <span className="text-yellow-400">⚡</span>}
                            {warmupInfo.type === "acclimation" && <span className="text-yellow-400">🔥</span>}
                            {warmupInfo.type === "skip" && <span className="text-zinc-500">✓</span>}
                            <span>
                              {warmupInfo.type === "skip"
                                ? warmupInfo.headline
                                : warmupInfo.type === "acclimation"
                                ? warmupInfo.headline
                                : `ลำดับ Warmup แนะนำ (${effectiveLoad === "dumbbell" ? "ดัมเบล" : effectiveLoad === "cable" ? "เคเบิล" : "เครื่องเล่น"} 1-2 เซต)`}
                            </span>
                          </span>
                        </div>

                        {warmupInfo.steps.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 w-full">
                            {warmupInfo.steps.map((st, sIdx) => {
                              const isIso = effectiveLoad === "plate-loaded" && (exercise.name.toLowerCase().includes("iso-lateral") || exercise.name.toLowerCase().includes("iso ")) && !exercise.name.toLowerCase().includes("t-bar");
                              const perSideText = isIso ? ` (ข้างละ ${Math.round((st.weight / 2) * 10) / 10})` : "";
                              return (
                                <div
                                  key={sIdx}
                                  className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold border border-yellow-500/40 bg-yellow-950/30 text-yellow-300"
                                >
                                  <span>{st.label}:</span>
                                  <span className="font-black text-white">{st.weight} {effectiveUnit}{perSideText}</span>
                                  <span className="text-zinc-400">× {st.reps}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* [Order 5] PRIMARY ZONE: Working Sets Table (Zepp Athletic Standard) */}
                    <div className="mb-3 rounded-2xl bg-black/40 p-2.5 sm:p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase text-zinc-400">Working sets</p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            Plan {effectiveSets} · Log {currentSetInputs.length}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => removeManualSet(baseExercise.id, effectiveSets)}
                            className="flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 disabled:opacity-40 transition hover:bg-zinc-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-yellow-400 select-none"
                            disabled={currentSetInputs.length <= 1}
                            aria-label="Remove last set"
                            type="button"
                          >
                            <span className="text-base font-black leading-none">−</span> Set
                          </button>
                          <button
                            onClick={() => addManualSet(baseExercise.id, effectiveSets)}
                            className="flex items-center gap-1 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black active:scale-95 transition focus-visible:ring-2 focus-visible:ring-yellow-400 select-none"
                            aria-label="Add additional set"
                            type="button"
                          >
                            <span className="text-base font-black leading-none">+</span> Set
                          </button>
                        </div>
                      </div>

                      <div className="mb-2 grid grid-cols-[28px_1fr_1fr_40px] gap-1.5 sm:gap-2 items-center text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-1">
                        <span className="w-7 text-center font-mono font-bold text-xs text-zinc-400">SET</span>
                        <div className="flex items-center justify-center gap-1">
                          <span>WEIGHT ({effectiveUnit.toUpperCase()})</span>
                          <button
                            type="button"
                            onClick={() => handleToggleExerciseUnit({ ...exercise, id: baseExercise.id, sets: effectiveSets }, currentMachine, effectiveSets)}
                            className="text-yellow-400 hover:underline text-[9px]"
                          >⇄</button>
                        </div>
                        <span className="text-center">REPS</span>
                        <span className="text-center">DONE</span>
                      </div>

                      <div className="space-y-2">
                        {currentSetInputs.map((set, setIndex) => {
                          const latestSet = lastSetMap[effectiveKey]?.[setIndex + 1];
                          const fallbackRepVal = latestSet ? Number(latestSet.reps) : 10;
                          const fallbackWeightVal = latestSet
                            ? latestSet.unit === effectiveUnit
                              ? (latestSet.rawValue ?? latestSet.weightLbs)
                              : convertAndSnapWeight(latestSet.weightLbs, "lbs", effectiveUnit, isIso)
                            : 0;

                          const aiWeightSuggestion = userProfile ? (() => {
                            const muscleMass = userProfile.muscleMassKg ?? Math.round(userProfile.weightKg * 0.42);
                            const muscleMode = userProfile.muscleMassMode ?? "smm";
                            const muscleInfo = evaluateMuscleMass(currentGender, userProfile.weightKg, muscleMass, muscleMode);
                            const safeModifier = Number.isFinite(muscleInfo.modifier) && muscleInfo.modifier > 0 ? muscleInfo.modifier : 1.0;
                            const bioRes = calculatePrescriptionWeight(exercise.name, effectiveLoad, exercise.reps, userProfile, safeModifier, currentMachine);
                            return effectiveUnit === "lbs"
                              ? Math.round(bioRes.hardwareWeightKg * 2.20462 * 10) / 10
                              : bioRes.hardwareWeightKg;
                          })() : 0;

                          const effectivePlaceholderWeight = fallbackWeightVal > 0 
                            ? fallbackWeightVal 
                            : (strengthTierInfo?.targetDisplayWeight ?? 0);

                          return (
                            <div key={setIndex} className="rounded-2xl bg-[#141416] p-2 hover:bg-[#18181c] transition">
                              {/* Compact Benchmark Note */}
                              {latestSet && (
                                <p className="text-[10px] text-zinc-500 font-mono truncate px-1 mb-0.5">
                                  ครั้งก่อน: <span className="text-yellow-400/90 font-bold">{latestSet.rawValue ?? latestSet.weightLbs} {latestSet.unit || "lbs"} × {latestSet.reps} reps</span>
                                </p>
                              )}

                              <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-1.5 sm:gap-2 items-center">
                                {/* Set Number */}
                                <div className="w-7 text-center font-mono font-bold text-xs text-zinc-400">
                                  {String(setIndex + 1).padStart(2, '0')}
                                </div>

                                {/* Weight Input Box */}
                                <div className="flex flex-col w-full min-w-0">
                                  <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 px-1 h-10 w-full overflow-hidden focus-within:border-yellow-400 transition">
                                    <button
                                      type="button"
                                      onClick={() => stepWeight({ ...exercise, id: baseExercise.id, sets: effectiveSets }, setIndex, -1, currentMachine, effectiveSets, effectivePlaceholderWeight)}
                                      className="w-7 h-9 flex items-center justify-center text-zinc-400 hover:text-yellow-400 active:scale-90 text-sm font-bold shrink-0 select-none"
                                    >−</button>
                                    <input
                                      id={`weight-input-${baseExercise.id}-${setIndex}`}
                                      inputMode="decimal"
                                      value={set.weightLbs}
                                      onChange={(e) => updateSet(baseExercise.id, setIndex, "weightLbs", e.target.value, effectiveSets)}
                                      onKeyDown={(e) => handleSetInputKeyDown(e, { ...exercise, id: baseExercise.id, sets: effectiveSets }, baseExercise.id, setIndex, "weightLbs", currentMachine)}
                                      className="w-full text-center font-mono font-black text-base text-white bg-transparent outline-none tabular-nums p-0 min-w-0"
                                      placeholder={String(effectivePlaceholderWeight || 0)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => stepWeight({ ...exercise, id: baseExercise.id, sets: effectiveSets }, setIndex, 1, currentMachine, effectiveSets, effectivePlaceholderWeight)}
                                      className="w-7 h-9 flex items-center justify-center text-zinc-400 hover:text-yellow-400 active:scale-90 text-sm font-bold shrink-0 select-none"
                                    >+</button>
                                  </div>
                                  {effectiveLoad === "plate-loaded" && (exercise.name.toLowerCase().includes("iso-lateral") || exercise.name.toLowerCase().includes("iso ")) && !exercise.name.toLowerCase().includes("t-bar") && (
                                    (() => {
                                      const totalW = parseFloat(set.weightLbs) || effectivePlaceholderWeight || 0;
                                      const perSideW = Math.round((totalW / 2) * 10) / 10;
                                      return (
                                        <span className="block text-[9px] font-mono text-zinc-500 text-center mt-0.5 truncate">
                                          {totalW > 0 ? `(ข้างละ ${perSideW} ${effectiveUnit})` : ""}
                                        </span>
                                      );
                                    })()
                                  )}
                                </div>

                                {/* Reps Input Box */}
                                <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 px-1 h-10 w-full overflow-hidden focus-within:border-yellow-400 transition">
                                  <button
                                    type="button"
                                    onClick={() => stepReps(baseExercise.id, setIndex, -1, effectiveSets, fallbackRepVal)}
                                    className="w-7 h-9 flex items-center justify-center text-zinc-400 hover:text-yellow-400 active:scale-90 text-sm font-bold shrink-0 select-none"
                                  >−</button>
                                  <input
                                    id={`rep-input-${baseExercise.id}-${setIndex}`}
                                    inputMode="numeric"
                                    value={set.reps}
                                    onChange={(e) => updateSet(baseExercise.id, setIndex, "reps", e.target.value, effectiveSets)}
                                    onKeyDown={(e) => handleSetInputKeyDown(e, { ...exercise, id: baseExercise.id, sets: effectiveSets }, baseExercise.id, setIndex, "reps", currentMachine)}
                                    className="w-full text-center font-mono font-black text-base text-white bg-transparent outline-none tabular-nums p-0 min-w-0"
                                    placeholder={latestSet ? String(latestSet.reps) : "0"}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => stepReps(baseExercise.id, setIndex, 1, effectiveSets, fallbackRepVal)}
                                    className="w-7 h-9 flex items-center justify-center text-zinc-400 hover:text-yellow-400 active:scale-90 text-sm font-bold shrink-0 select-none"
                                  >+</button>
                                </div>

                                {/* Done Checkmark */}
                                <button
                                  type="button"
                                  onClick={() => saveSingleSet({ ...exercise, id: baseExercise.id, sets: effectiveSets }, setIndex, currentMachine)}
                                  className={`w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center shrink-0 transition active:scale-90 border ${
                                    set.done
                                      ? "bg-yellow-400 border-yellow-300 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                                      : "bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-yellow-400 hover:text-yellow-400"
                                  }`}
                                >
                                  <Check className={set.done ? "stroke-[3]" : "stroke-[1.5] opacity-40"} size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => saveAllSets({ ...exercise, id: baseExercise.id, sets: effectiveSets }, currentMachine)}
                        aria-label="Finish working sets and clear inputs"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest h-10 py-2 text-xs shadow-lg shadow-yellow-500/20 active:scale-[0.99] transition focus-visible:ring-2 focus-visible:ring-yellow-400"
                      >
                        <Save size={16} /> Finish & clear
                      </button>

                      {/* RPE Quick Feedback Strip */}
                      <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                        {[
                          { val: 6, label: "สบายมาก", col: "border-zinc-800 text-zinc-400 hover:border-yellow-400" },
                          { val: 7, label: "พอดี", col: "border-zinc-800 text-zinc-300 hover:border-yellow-400" },
                          { val: 8, label: "เริ่มล้า", col: "border-yellow-500/30 text-yellow-400 hover:border-yellow-400" },
                          { val: 9, label: "หนักมาก", col: "border-yellow-500/60 text-yellow-300 hover:border-yellow-400" },
                          { val: 10, label: "RPE 10 (Max)", col: "border-red-500/50 text-red-400 hover:border-red-400" },
                        ].map((r) => (
                          <button
                            key={r.val}
                            type="button"
                            onClick={() => saveAllSets({ ...exercise, id: baseExercise.id, sets: effectiveSets }, currentMachine)}
                            className={`rounded-lg border bg-zinc-950 py-1.5 text-center transition active:scale-95 ${r.col}`}
                          >
                            <span className="block font-black text-xs tabular-nums font-mono">{r.val}</span>
                            <span className="text-[9px] block leading-tight">{r.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* [Order 6] Secondary Tools Accordion (Progressive Disclosure) */}
                    <details className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3">
                      <summary className="cursor-pointer py-1 text-xs font-bold text-zinc-400 hover:text-yellow-400 font-bold transition flex items-center justify-between">
                        <span>🏆 สถิติเดิม PR, Warmup & การตั้งค่าเพิ่มเติม</span>
                        <ChevronDown size={14} className="text-zinc-500" />
                      </summary>

                      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-3">
                        {/* Records & Relative Strength Grid */}
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                            <Trophy size={14} /> Records {currentMachine && <span className="text-yellow-400 font-bold font-semibold normal-case">({currentMachine})</span>}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-zinc-900 px-3 py-2 cursor-pointer hover:border-yellow-400 border border-transparent transition" onClick={() => {
                    setEditingPrExercise({ name: exercise.name, machine: currentMachine });
                    setEditPrWeight(records.maxWeight ? (records.maxWeight.rawValue !== undefined ? records.maxWeight.rawValue.toString() : (records.maxWeight.unit === "kg" ? (records.maxWeight.weightLbs * 0.453592).toFixed(1) : records.maxWeight.weightLbs.toString())) : "");
                    setEditPrReps(records.maxWeight?.reps?.toString() ?? "");
                    setEditPrUnit(records.maxWeight?.unit ?? "kg");
                  }}>
                              <p className="text-[10px] font-bold uppercase text-zinc-500">Max</p>
                              <div className="mt-1">
                                {records.maxWeight ? (
                                  <>
                                    <p className="text-sm font-black text-yellow-300">
                                      {records.maxWeight.rawValue !== undefined && records.maxWeight.unit
                                        ? `${records.maxWeight.rawValue} ${records.maxWeight.unit}`
                                        : `${Math.round(records.maxWeight.weightLbs * 10) / 10} lbs`}
                                      {" × "}{records.maxWeight.reps}
                                    </p>
                    <span className="text-[10px] text-yellow-400 font-bold">แก้ไข/ประวัติ ✎</span>
                                    <p className="text-[10px] text-zinc-500">
                                      {records.maxWeight.unit === "kg" && records.maxWeight.rawValue !== undefined
                                        ? `(${Math.round(records.maxWeight.weightLbs * 10) / 10} lbs)`
                                        : `(${Math.round(records.maxWeight.weightLbs * 0.453592 * 10) / 10} kg)`}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm font-black text-zinc-500">—</p>
                                )}
                              </div>
                            </div>
                            <div className="rounded-xl bg-zinc-900 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase text-zinc-500">Reps</p>
                              <div className="mt-1">
                                {records.bestReps ? (
                                  <>
                                    <p className="text-sm font-black text-zinc-100">
                                      {records.bestReps.rawValue !== undefined && records.bestReps.unit
                                        ? `${records.bestReps.rawValue} ${records.bestReps.unit}`
                                        : `${Math.round(records.bestReps.weightLbs * 10) / 10} lbs`}
                                      {" × "}{records.bestReps.reps}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                      {records.bestReps.unit === "kg" && records.bestReps.rawValue !== undefined
                                        ? `(${Math.round(records.bestReps.weightLbs * 10) / 10} lbs)`
                                        : `(${Math.round(records.bestReps.weightLbs * 0.453592 * 10) / 10} kg)`}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm font-black text-zinc-500">—</p>
                                )}
                              </div>
                            </div>
                            <div className="rounded-xl bg-zinc-900 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase text-zinc-500">Volume</p>
                              <p className="mt-1 text-sm font-black text-zinc-100">{records.bestVolume ? `${Math.round(records.bestVolume.weightLbs * records.bestVolume.reps)}` : "—"}</p>
                            </div>
                            <div className="rounded-xl bg-zinc-900 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase text-zinc-500">Warmup</p>
                              <p className="mt-1 text-sm font-black text-zinc-100">{exercise.warmup && warmups.length > 0 ? `${warmups[0].weight}/${warmups[1].weight}/${warmups[2].weight}` : "Skip"}</p>
                            </div>
                            {bodyweightEntry && records.maxWeight && (() => {
                              const ratio = records.maxWeight.weightLbs / bodyweightEntry.lbs;
                              const isBench = exercise.name.toLowerCase().includes("bench press");
                              const isSquat = exercise.name.toLowerCase().includes("squat");
                              const isDL = exercise.name.toLowerCase().includes("deadlift");
                              const target = isBench ? 1.5 : isSquat ? 2.0 : isDL ? 2.5 : null;

                              return (
                                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 col-span-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase text-yellow-300">Relative Strength</p>
                                    {target && (
                                      <span className="text-[10px] text-zinc-400 font-medium">
                                        เป้าหมาย: {target}× BW
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-baseline justify-between">
                                    <p className="text-sm font-black text-yellow-300">
                                      {ratio.toFixed(2)}× BW
                                    </p>
                                    {target && (
                                      <span className={`text-[10px] font-bold ${ratio >= target ? "text-yellow-300" : "text-amber-400"}`}>
                                        {ratio >= target ? "✓ บรรลุเป้าหมาย" : `ขาดอีก ${(target - ratio).toFixed(2)}×`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Edit target sets & reps */}
{editingPrExercise && (
  <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-xl bg-zinc-950 p-6 border border-zinc-800">
      <h2 className="text-lg font-bold text-yellow-300 mb-4">
        Edit PR - {editingPrExercise.name}{editingPrExercise.machine ? ` (${editingPrExercise.machine})` : ''}
      </h2>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <input
          type="number"
          placeholder="Weight"
          value={editPrWeight}
          onChange={e => setEditPrWeight(e.target.value)}
          className="rounded-xl bg-zinc-900 p-2 text-zinc-100"
        />
        <select
          value={editPrUnit}
          onChange={e => setEditPrUnit(e.target.value as WeightUnit)}
          className="rounded-xl bg-zinc-900 p-2 text-zinc-100"
        >
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>
      </div>
      <input
        type="number"
        placeholder="Reps"
        value={editPrReps}
        onChange={e => setEditPrReps(e.target.value)}
        className="w-full rounded-xl bg-zinc-900 p-2 mb-4 text-zinc-100"
      />
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setEditingPrExercise(null)}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200"
        >Cancel</button>
        <button
          onClick={() => {
            const weightNum = Number(editPrWeight);
            const repsNum = Number(editPrReps);
            if (!weightNum || !repsNum) return;
            const weightLbs = editPrUnit === 'kg' ? convertWeight(weightNum, 'kg', 'lbs') : weightNum;
            const key = getEffectiveExerciseKey(editingPrExercise.name, editingPrExercise.machine);
            setRecordsMap(prev => {
              const rec = { ...(prev[key] ?? {}) };
              rec.maxWeight = {
                exerciseId: '',
                exerciseName: editingPrExercise.name,
                weightLbs,
                reps: repsNum,
                setNumber: 0,
                date: new Date().toISOString(),
                machine: editingPrExercise.machine,
                unit: editPrUnit,
                rawValue: weightNum,
              };
              return { ...prev, [key]: { ...rec } };
            });
            setEditingPrExercise(null);
          }}
          className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-black"
        >Save</button>
      </div>
      <h3 className="text-sm font-bold text-zinc-400 mb-2">Recent Sets</h3>
      <ul className="max-h-48 overflow-y-auto mb-4">
        {logs
          .filter(l => getEffectiveExerciseKey(l.exerciseName, l.machine) === getEffectiveExerciseKey(editingPrExercise.name, editingPrExercise.machine))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((log, idx) => (
            <li key={idx} className="flex justify-between items-center text-sm py-1 border-b border-zinc-800">
              <span>{log.reps}× {log.unit === 'kg' ? `${log.rawValue} kg` : `${log.weightLbs} lbs`}</span>
              <button
                onClick={() => {
                  setLogs(old => old.filter((_, i) => i !== logs.indexOf(log)));
                  // simple PR recalculation placeholder: remove maxWeight if it matches deleted log
                  const key = getEffectiveExerciseKey(log.exerciseName, log.machine);
                  setRecordsMap(prev => {
                    const newMap = { ...prev };
                    const rec = newMap[key];
                    if (rec && rec.maxWeight && rec.maxWeight.date === log.date) {
                      delete rec.maxWeight;
                    }
                    return newMap;
                  });
                }}
                className="text-xs text-red-500"
              >Delete</button>
            </li>
          ))}
      </ul>
    </div>
  </dialog>
)}
                        {(mode === "custom" || mode === "preset" || mode === "today") && (
                          <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3">
                            <p className="text-xs font-bold text-zinc-400 mb-2">Edit target sets & reps</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="mb-1 block text-xs font-bold text-zinc-500">Target Sets</label>
                                <div className="flex items-stretch rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden focus-within:border-yellow-400 transition">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (mode === "custom") {
                                        updateCustomExercise(baseExercise.id, { sets: Math.max(1, exercise.sets - 1) });
                                      } else {
                                        updatePresetExerciseSets(baseExercise.id, effectiveSets - 1);
                                      }
                                    }}
                                    className="flex w-8 items-center justify-center text-zinc-400 hover:text-yellow-300 hover:bg-zinc-800 active:scale-90 transition font-black text-base select-none"
                                    aria-label="Decrease sets"
                                  >
                                    −
                                  </button>
                                  <input
                                    inputMode="numeric"
                                    value={effectiveSets}
                                    onChange={(event) => {
                                      const val = Math.max(1, Number(event.target.value) || 1);
                                      if (mode === "custom") {
                                        updateCustomExercise(baseExercise.id, { sets: val });
                                      } else {
                                        updatePresetExerciseSets(baseExercise.id, val);
                                      }
                                    }}
                                    className="w-full min-w-0 bg-transparent px-0.5 py-3 text-center text-sm font-bold outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (mode === "custom") {
                                        updateCustomExercise(baseExercise.id, { sets: Math.min(10, exercise.sets + 1) });
                                      } else {
                                        updatePresetExerciseSets(baseExercise.id, effectiveSets + 1);
                                      }
                                    }}
                                    className="flex w-8 items-center justify-center text-zinc-400 hover:text-yellow-300 hover:bg-zinc-800 active:scale-90 transition font-black text-base select-none"
                                    aria-label="Increase sets"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-bold text-zinc-500">Target Reps</label>
                                <input
                                  value={exercise.reps}
                                  onChange={(event) => {
                                    if (mode === "custom") {
                                      updateCustomExercise(baseExercise.id, { reps: event.target.value });
                                    }
                                  }}
                                  readOnly={mode !== "custom"}
                                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 outline-none text-sm font-bold"
                                />
                              </div>

                              {mode === "custom" && (
                                <button
                                  onClick={() => updateCustomExercise(baseExercise.id, { warmup: !exercise.warmup })}
                                  className={`mt-5 rounded-2xl px-2 py-3 text-xs font-black ${
                                    exercise.warmup ? "bg-orange-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                                  }`}
                                >
                                  Warmup
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Substitute Exercise Action */}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSubstituteModalExercise(baseExercise);
                              setSubstituteSearch("");
                              setSubstituteFilter("movement");
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-3 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-yellow-400"
                            aria-label={`Substitute ${exercise.name}`}
                          >
                            <span className="flex items-center gap-2">
                              <RotateCcw size={14} className="text-yellow-400 font-bold" />
                              <span>Substitute Exercise</span>
                            </span>
                            <span className="rounded-lg bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400">
                              {selectedSubstitute ? "Modified" : "Choose"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </details>

                    {compactList && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1))}
                          className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 disabled:opacity-30 transition hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-yellow-400 active:scale-95"
                          disabled={activeExerciseIndex === 0}
                          aria-label="Go to previous exercise"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveExerciseIndex(Math.min(day.exercises.length - 1, activeExerciseIndex + 1))}
                          className="rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2.5 text-xs font-black uppercase tracking-wider disabled:opacity-30 transition shadow-md shadow-yellow-500/20 focus-visible:ring-2 focus-visible:ring-yellow-400 active:scale-95"
                          disabled={activeExerciseIndex >= day.exercises.length - 1}
                          aria-label="Go to next exercise"
                        >
                          Next
                        </button>
                      </div>
                    )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            )}

            {/* Render Cardio Controller ONLY when sessionStage is "cardio" */}
            {sessionStage === "cardio" && (
              <div className="mt-4 animate-in fade-in duration-150">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-xl">
                  <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 font-bold">
                        ⚡
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">คาร์ดิโอ & ปรับสภาพร่างกาย (Cardio / Zone 2)</h3>
                        <p className="text-[11px] text-zinc-500">บันทึกกิจกรรมคาร์ดิโอเพื่อเสริมการฟื้นตัวและระบบหัวใจ</p>
                      </div>
                    </div>
                  </div>
                  <CardioController
                    onSaveCardioLog={handleSaveCardioLog}
                    savedToast={cardioSavedToast}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Floating Sticky Rest Timer Pill (Mobile & Desktop) */}
      {restTimer.running && restTimer.secondsLeft > 0 && (
        <aside
          aria-label="Active rest timer"
          className="fixed bottom-16 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-yellow-500/40 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 text-black font-black opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
                </span>
                <p className="truncate text-xs font-bold text-zinc-400">
                  {restTimer.exerciseName ? `Rest · ${restTimer.exerciseName}` : "Rest Timer"}
                </p>
              </div>
              <p className="mt-0.5 text-xl font-black tracking-tight text-yellow-300">
                {formatRestTime(restTimer.secondsLeft)}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const ex = day?.exercises.find((e) => e.id === restTimer.exerciseId) ?? {
                    id: restTimer.exerciseId ?? "",
                    name: restTimer.exerciseName ?? "",
                    group: "Chest" as MuscleGroup,
                    sets: 3,
                    reps: "8-12",
                    warmup: false,
                    muscles: [] as string[],
                    movement: "",
                    load: "bodyweight" as LoadType,
                  };
                  adjustRestSeconds(ex, -30);
                }}
                className="min-h-[44px] px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95 font-mono"
                aria-label="Subtract 30 seconds from rest timer"
              >
                −30s
              </button>
              <button
                type="button"
                onClick={() => {
                  const ex = day?.exercises.find((e) => e.id === restTimer.exerciseId) ?? {
                    id: restTimer.exerciseId ?? "",
                    name: restTimer.exerciseName ?? "",
                    group: "Chest" as MuscleGroup,
                    sets: 3,
                    reps: "8-12",
                    warmup: false,
                    muscles: [] as string[],
                    movement: "",
                    load: "bodyweight" as LoadType,
                  };
                  adjustRestSeconds(ex, 30);
                }}
                className="min-h-[44px] px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition active:scale-95 font-mono"
                aria-label="Add 30 seconds to rest timer"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={stopRestTimer}
                className="min-h-[44px] px-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-black text-red-300 transition hover:bg-red-500/20 active:scale-95"
                aria-label="Skip / Stop rest timer"
              >
                Skip
              </button>
            </div>
          </div>

          {restTimer.totalSeconds > 0 && (
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-yellow-400 text-black font-black transition-all duration-300 ease-linear"
                style={{ width: `${restProgress}%` }}
              />
            </div>
          )}
        </aside>
      )}

      {/* Searchable Exercise Substitute Modal / Combobox */}
      {substituteModalExercise && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="substitute-dialog-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-zinc-800 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 font-bold">
                    Substitute Exercise
                  </p>
                  <h3 id="substitute-dialog-title" className="mt-0.5 truncate text-lg font-black">
                    {substituteModalExercise.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSubstituteModalExercise(null)}
                  className="rounded-xl bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-yellow-400"
                  aria-label="Close substitution modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5">
                <Search size={16} className="text-zinc-400" />
                <input
                  autoFocus
                  value={substituteSearch}
                  onChange={(e) => setSubstituteSearch(e.target.value)}
                  placeholder="Search replacement exercise..."
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
                  aria-label="Search replacement exercise"
                />
                {substituteSearch && (
                  <button
                    type="button"
                    onClick={() => setSubstituteSearch("")}
                    className="text-zinc-500 hover:text-zinc-300"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSubstituteFilter("movement")}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                    substituteFilter === "movement"
                      ? "bg-yellow-400 text-black font-black"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Related Movements
                </button>
                <button
                  type="button"
                  onClick={() => setSubstituteFilter("group")}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                    substituteFilter === "group"
                      ? "bg-yellow-400 text-black font-black"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {substituteModalExercise.group}
                </button>
                <button
                  type="button"
                  onClick={() => setSubstituteFilter("all")}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                    substituteFilter === "all"
                      ? "bg-yellow-400 text-black font-black"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  All Library
                </button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {substituteCandidates.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No matching exercises found. Try a different search term or category.
                </div>
              ) : (
                substituteCandidates.map((candidate) => {
                  const isSelected =
                    (mode === "custom" && substituteModalExercise.name === candidate.name) ||
                    (mode !== "custom" &&
                      (substituteMap[substituteModalExercise.id] === candidate.name ||
                        (!substituteMap[substituteModalExercise.id] && substituteModalExercise.name === candidate.name)));

                  const focusPct = Math.round(FOCUS_EFFICIENCY[candidate.load] * 100);
                  const isRelatedMovement = getRelatedMovements(substituteModalExercise.movement).includes(candidate.movement);

                  const tierStyles = {
                    "S+": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
                    "S": "bg-teal-500/20 text-teal-300 border-teal-500/30",
                    "A+": "bg-blue-500/20 text-blue-300 border-blue-500/30",
                    "A": "bg-zinc-800 text-zinc-400 border-zinc-700",
                  }[candidate.tier] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";

                  return (
                    <button
                      key={candidate.name}
                      type="button"
                      onClick={() => {
                        substituteExercise(substituteModalExercise, candidate.name);
                        setSubstituteModalExercise(null);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                        isSelected
                          ? "border-yellow-400/50 bg-yellow-500/10 text-zinc-100"
                          : isRelatedMovement
                            ? "border-yellow-400/25 bg-yellow-500/5 text-zinc-300 hover:border-yellow-500/40 hover:bg-zinc-900"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-zinc-100">{candidate.name}</p>
                          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-black ${tierStyles}`}>
                            {candidate.tier}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {candidate.group} · {candidate.movement}
                          {isRelatedMovement && <span className="ml-1.5 rounded-md border border-yellow-500/30 bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-black text-yellow-300">Same Movement</span>}
                          <span className={`ml-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${focusPct >= 90 ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" : focusPct >= 70 ? "border-zinc-700 bg-zinc-900 text-zinc-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
                            {LOAD_LABELS[candidate.load]} · {focusPct}%
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                          {candidate.muscles.join(", ")}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-black font-black">
                          <Check size={16} />
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-xl bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:bg-yellow-400 text-black font-black hover:text-zinc-950 transition">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            {mode !== "custom" && substituteMap[substituteModalExercise.id] && (
              <div className="border-t border-zinc-800 bg-zinc-900/40 p-3 flex justify-between items-center">
                <span className="text-xs text-zinc-400">Original: {substituteModalExercise.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    substituteExercise(substituteModalExercise, substituteModalExercise.name);
                    setSubstituteModalExercise(null);
                  }}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Reset to Original
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {prCelebration && (
        <PrCelebrationModal
          pr={prCelebration}
          bodyweightKg={bodyweightKg}
          onClose={() => setPrCelebration(null)}
        />
      )}

      {isBwModalOpen && (
        <BodyweightModal
          currentWeight={bodyweightKg}
          logs={bodyweightLogs}
          recordsMap={recordsMap}
          onSave={handleSaveBodyweight}
          onClose={() => setIsBwModalOpen(false)}
        />
      )}



      {/* Migration Toast for upgraded users */}
      {showMigrationToast && migrationResult && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-yellow-500/40 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur-md max-w-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-yellow-300">นำเข้าข้อมูลเดิมสำเร็จ — Streak {migrationResult.weekStreak} สัปดาห์</p>
              <p className="mt-0.5 text-xs text-zinc-300">
                ประเมินระดับ: {migrationResult.level === "advanced" ? "ขั้นสูง (Advanced)" : migrationResult.level === "intermediate" ? "ปานกลาง (Intermediate)" : "มือใหม่ (Beginner)"}
                {migrationResult.estimatedBodyweightLbs ? ` · น้ำหนักตัว ~${migrationResult.estimatedBodyweightLbs} lbs` : ""}
              </p>
            </div>
            <button
              onClick={() => setShowMigrationToast(false)}
              className="text-zinc-500 hover:text-zinc-300 shrink-0"
              aria-label="Close"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bodyweight & Relative Strength Manager */}
      <BodyweightManager
        open={showBodyweightModal}
        onClose={() => {
          setShowBodyweightModal(false);
          setBodyweightEntry(getCurrentBodyweight());
        }}
        preferredUnit={globalWeightUnit}
        onSaveSuccess={() => {
          const freshBw = getCurrentBodyweight();
          setBodyweightEntry(freshBw);
          const freshProf = getUserProfile();
          if (freshProf) setUserProfile(freshProf);
        }}
        currentPrs={prMap}
      />

      {/* Notification Settings Modal */}
      <NotificationSettings
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* Onboarding Wizard for new users */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={(result) => {
            setDays(result.days);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Profile & Settings Modal */}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        logsCount={logs.length}
        recordsCount={Object.keys(recordsMap).length}
        streak={performanceReport.currentStreak}
        preferredUnit={globalWeightUnit}
        onUnitChange={handleSetGlobalUnit}
        onExportLogs={exportLogsToCsv}
        onOpenAssessment={() => setShowAssessmentModal(true)}
        currentGender={userProfile?.gender || "male"}
        onGenderChange={handleSetGender}
      />

      {/* Trainer Assessment Modal (Stage 2) */}
      <TrainerAssessment
        open={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        onApplyPlan={handleApplyAssessmentPlan}
      />

      {/* Weekly Score & Methodology Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-400 font-bold" size={20} />
                <h2 className="text-base sm:text-lg font-black text-white">Weekly Performance Breakdown</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="rounded-full bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Section A: Performance Card */}
              <div>
                <WeeklyPerformanceCard report={performanceReport} />
              </div>

              {/* Section B: Scoring Methodology */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-base">📖</span>
                  <h3 className="text-sm font-black text-zinc-200">เกณฑ์และวิธีการคิดคะแนน (Scoring Methodology)</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                    <p className="font-bold text-yellow-400 font-bold flex items-center gap-1.5">
                      <span>🏋️ Strength (25%)</span>
                    </p>
                    <p className="mt-1 text-zinc-300 leading-relaxed">
                      คำนวณจาก e1RM (สูตร Epley) สัปดาห์นี้เทียบกับสถิติเดิมทั้งหมด หากทำลาย PR ได้ 100 คะแนนเต็ม, ยกได้ 95%+ ได้ 80 คะแนน
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                    <p className="font-bold text-yellow-400 font-bold flex items-center gap-1.5">
                      <span>📦 Volume (25%)</span>
                    </p>
                    <p className="mt-1 text-zinc-300 leading-relaxed">
                      วัดจากจำนวนเซตจริงต่อกลุ่มกล้ามเนื้อ เทียบกับเป้าหมาย Hypertrophy (เป้าหมาย 10–12 เซต/กล้ามเนื้อ/สัปดาห์)
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                    <p className="font-bold text-yellow-400 font-bold flex items-center gap-1.5">
                      <span>📅 Consistency (20%)</span>
                    </p>
                    <p className="mt-1 text-zinc-300 leading-relaxed">
                      วัดจากอัตราส่วนวันที่เข้ายิมจริง เทียบกับจำนวนวันฝึกที่เลือกไว้ในตาราง (3, 4, หรือ 5 วัน)
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                    <p className="font-bold text-yellow-400 font-bold flex items-center gap-1.5">
                      <span>🎯 Completion (15%)</span>
                    </p>
                    <p className="mt-1 text-zinc-300 leading-relaxed">
                      เปอร์เซ็นต์เซตที่เล่นสำเร็จจริง เทียบกับจำนวนเซตทั้งหมดตามแผนในสัปดาห์
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                    <p className="font-bold text-yellow-400 font-bold flex items-center gap-1.5">
                      <span>😴 Recovery (10%)</span>
                    </p>
                    <p className="mt-1 text-zinc-300 leading-relaxed">
                      การพักฟื้น ร่างกายต้องการวันพักอย่างน้อย 2 วัน/สัปดาห์ (พัก ≥2 วัน = 100, พัก 1 วัน = 75, ไม่พักเลย = 50)
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3">
                    <p className="font-bold text-yellow-400 font-bold flex items-center gap-1.5">
                      <span>🔥 Streak Bonus (5%)</span>
                    </p>
                    <p className="mt-1 text-zinc-300 leading-relaxed">
                      โบนัสวินัยต่อเนื่อง เพิ่มสัปดาห์ละ 10 คะแนน (สะสมสูงสุด 10 สัปดาห์ = 100 คะแนน)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800/80 p-3 bg-zinc-950">
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-[0.99]"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Workout Finished Celebration Sheet (Summary Modal - Apple HIG / Hevy Style) */}
      {showFinishCelebration && finishedWorkoutStats && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-250">
          <div className="relative w-full max-w-md overflow-hidden rounded-t-[32px] sm:rounded-3xl border border-zinc-800/90 bg-zinc-950 p-6 sm:p-7 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
            {/* Top Glow & Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.4)] mb-4">
                <Trophy size={34} className="text-yellow-400 stroke-[2.5]" />
              </div>
              <span className="text-xs font-mono font-black uppercase tracking-widest text-yellow-400 bg-yellow-950/40 border border-yellow-800/40 px-3 py-1 rounded-full mb-1">
                WORKOUT COMPLETED!
              </span>
              <h2 className="text-2xl sm:text-3xl font-mono font-black text-white uppercase tracking-tight mt-1">
                ยอดเยี่ยมมาก! 🎉
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                คุณทำตามแผนการฝึกของวันนี้สำเร็จแล้ว บันทึกข้อมูลเข้าสู่ระบบเรียบร้อย
              </p>
            </div>

            {/* Stats Metric Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5 my-6">
              <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">เวลาฝึก</p>
                <p className="text-lg font-mono font-black text-white mt-1 tabular-nums">
                  {finishedWorkoutStats.durationStr}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">เซ็ตที่สำเร็จ</p>
                <p className="text-lg font-mono font-black text-yellow-300 mt-1 tabular-nums">
                  {finishedWorkoutStats.totalSets}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Total Volume</p>
                <p className="text-lg font-mono font-black text-white mt-1 tabular-nums">
                  {finishedWorkoutStats.totalVolumeKg} <span className="text-[10px] text-zinc-400">kg</span>
                </p>
              </div>
            </div>

            {/* Full Width Done / บันทึกผล Button */}
            <button
              type="button"
              onClick={() => {
                setShowFinishCelebration(false);
                setSessionElapsedSeconds(0);
                setIsSessionRunning(false);
                writeLocalJson(ACTIVE_SESSION_KEY, null);
                setMode("dashboard");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black py-4 text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(250,204,21,0.4)] transition active:scale-[0.98]"
            >
              <Check size={18} className="stroke-[3]" />
              <span>Done / บันทึกผล</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D Anatomy Figure Modal Sheet (De-emphasized from main scroll area) */}
      {showAnatomyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Anatomical Overview</p>
                <h3 className="text-base font-black text-white">{day ? day.title : "Daily Muscle Map"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAnatomyModal(false)}
                className="rounded-xl bg-zinc-900 p-2 text-zinc-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                <span className="font-bold">{activeMuscleSummary.summaryText}</span>
                <span className="text-[11px] text-zinc-500">{activeMuscleSummary.sourceLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-3 text-center">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Anterior (Front)</p>
                  <RealisticAnatomyFigure side="front" primary={activeMuscleSummary.primary} secondary={activeMuscleSummary.secondary} />
                </div>
                <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-3 text-center">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Posterior (Back)</p>
                  <RealisticAnatomyFigure side="back" primary={activeMuscleSummary.primary} secondary={activeMuscleSummary.secondary} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAnatomyModal(false)}
              className="mt-5 w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {[
            ["dashboard", "Home", Home],
            ["workout", "Workout", Dumbbell],
            ["stats", "Stats", Trophy],
            ["library", "Library", Library],
            ["profile", "Profile", User],
          ].map(([key, label, Icon]) => {
            const isTabActive =
              (key === "dashboard" && mode === "dashboard") ||
              (key === "workout" && ["today", "preset", "custom"].includes(mode)) ||
              (key === "stats" && mode === "history") ||
              (key === "library" && mode === "library");

            return (
              <button
                key={key as string}
                type="button"
                onClick={() => {
                  if (key === "dashboard") setMode("dashboard");
                  else if (key === "workout") setMode("today");
                  else if (key === "stats") setMode("history");
                  else if (key === "library") setMode("library");
                  else setShowProfileModal(true);
                }}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] sm:text-[11px] transition active:scale-95 ${
                  isTabActive
                    ? "bg-yellow-400 text-black font-black uppercase tracking-wider shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 font-medium"
                }`}
              >
                <Icon size={18} />
                <span>{label as string}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}