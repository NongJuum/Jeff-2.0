"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Dumbbell,
  Flame,
  Library,
  MinusCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Abs & Calves";
type AppMode = "today" | "preset" | "custom" | "history" | "library";

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

type LogSet = {
  exerciseId: string;
  exerciseName: string;
  weightLbs: number;
  reps: number;
  setNumber: number;
  date: string;
  machine?: string;
};

type ExerciseRecords = {
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

function findExercise(name: string) {
  return exerciseLibrary.find((exercise) => exercise.name === name) ?? exerciseLibrary[0];
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

    "front calf muscle": { sets: 4, reps: "8 to 15", warmup: false },
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

function toPlanExercise(name: string): PlanExercise {
  const exercise = findExercise(name);
  const prescription = getPrescription(exercise);
  return {
    id: makeId("ex"),
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

function makeDay(title: string, subtitle: string, focus: MuscleGroup[], exerciseNames: string[]): DayPlan {
  return {
    id: makeId("day"),
    title,
    subtitle,
    focus,
    exercises: exerciseNames
      .map((n) => exerciseLibrary.find((e) => e.name === n))
      .filter((e): e is Exercise => Boolean(e))
      .map((e) => toPlanExercise(e.name)),
  };
}

function makePresetPlans() {
  return {
    3: [
      makeDay("Day 1 Full Body A", "Squat, horizontal press, row, hamstrings, delts, arms", ["Chest", "Back", "Legs", "Shoulders", "Arms"], ["Hack Squat", "Machine Chest Press", "Chest Supported Row", "Seated Hamstring Curl", "Cable Lat Raise", "Overhead Cable Ext"]),
      makeDay("Day 2 Full Body B", "Hinge, vertical pull, incline press, quads, rear delts, biceps", ["Legs", "Back", "Chest", "Shoulders", "Arms"], ["Romanian Deadlift RDL", "Neutral Grip Lat Pull Down", "Incline DB Press", "Leg Extension", "Reverse Pec Deck", "Face Away Bayesian Curl"]),
      makeDay("Day 3 Full Body C", "Belt squat, lower chest, row, glutes, delts, abs", ["Legs", "Chest", "Back", "Shoulders", "Abs & Calves"], ["Belt Squat", "Decline Machine Press", "Cable Row", "Machine Hip Thrust", "Cable Lat Raise", "Cable Crunch"]),
    ],
    4: [
      makeDay("Day 1 Upper A", "Mid chest, lats, side delts, upper traps, triceps long", ["Chest", "Back", "Shoulders", "Arms"], ["Iso-Lateral Chest Press", "Seated Cable Pec Flye", "Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Raise", "DB Shrug", "Overhead Cable Ext"]),
      makeDay("Day 2 Lower A", "Quad bias, hamstrings, glutes, soleus", ["Legs", "Abs & Calves"], ["Belt Squat", "Leg Extension", "Seated Hamstring Curl", "Machine Hip Thrust", "Seated Calf Raise"]),
      makeDay("Day 3 Upper B", "Upper+lower chest, lat width, rear delts, lower traps, biceps", ["Chest", "Back", "Shoulders", "Arms"], ["Iso-Lateral Incline Press", "Decline Machine Press", "Iso-Lateral Pulldown", "Cable Row", "Reverse Pec Deck", "Rope Face Pull", "Face Away Bayesian Curl"]),
      makeDay("Day 4 Lower B", "Hinge, glute press, quads, hamstrings, abs, gastroc", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Bulgarian Split Squat", "Seated Hamstring Curl", "Cable Crunch", "Standing Calf Raise"]),
    ],
    5: [
      makeDay("Day 1 Chest + Back A", "Horizontal press, row, incline press, vertical pull, flye", ["Chest", "Back"], ["Machine Chest Press", "Chest Supported Row", "Incline DB Press", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye"]),
      makeDay("Day 2 Legs Quad Bias", "Squat press, leg curl, quad isolation, glute, soleus", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Seated Calf Raise"]),
      makeDay("Day 3 Shoulders + Arms", "Shoulder press, side delt, rear delt, lower traps, biceps, triceps long", ["Shoulders", "Arms"], ["Machine Shoulder Press", "Cable Lat Raise", "Reverse Pec Deck", "Cable Y Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 4 Chest + Back B", "Row bias, lat isolation, lower chest, rear delt, upper traps", ["Back", "Chest", "Shoulders"], ["Cable Row", "Straight Arm Pulldown", "Decline Machine Press", "Pec Deck", "Rope Face Pull", "DB Shrug"]),
      makeDay("Day 5 Legs Posterior Bias", "Hinge, glute press, hamstring curl, glute, abs, gastroc", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Seated Hamstring Curl", "Machine Hip Thrust", "Cable Crunch", "Standing Calf Raise"]),
    ],
  } satisfies Record<3 | 4 | 5, DayPlan[]>;
}

function makeFiveDayLegOncePlan() {
  return [
    makeDay("Day 1 Push", "Chest press, incline, flye, side delt, triceps", ["Chest", "Shoulders", "Arms"], ["Machine Chest Press", "Incline DB Press", "Seated Cable Pec Flye", "Cable Lat Raise", "Overhead Cable Ext"]),
    makeDay("Day 2 Pull", "Row, pulldown, lat isolation, rear delt, biceps", ["Back", "Shoulders", "Arms"], ["Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Prayers", "Reverse Pec Deck", "Face Away Bayesian Curl"]),
    makeDay("Day 3 Legs Only", "Single weekly leg day with complete lower-body coverage", ["Legs", "Abs & Calves"], ["Hack Squat", "Romanian Deadlift RDL", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Standing Calf Raise"]),
    makeDay("Day 4 Upper A", "Chest and back volume without extra leg fatigue", ["Chest", "Back", "Shoulders"], ["Incline Machine Bench", "Cable Row", "Pec Deck", "Widegrip Lat Pull Down", "Rope Face Pull"]),
    makeDay("Day 5 Upper B + Arms", "Upper pump with direct arm work", ["Back", "Chest", "Shoulders", "Arms"], ["Machine Chest Press", "Chest Supported Row", "Cable Lat Raise", "Machine Preacher Curl", "Triceps Pressdown Bar"]),
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
  return Array.from(new Set(names)).slice(0, maxExercises).map(toPlanExercise);
}

function createStarterCustomPlan() {
  return {
    id: makeId("plan"),
    name: "My Custom Split",
    days: [makeDay("Custom Day 1", "Choose target muscles then press Recommend", ["Chest", "Back"], ["Machine Chest Press", "Chest Supported Row"])],
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

function getRestSeconds(exercise: PlanExercise) {
  const movement = exercise.movement.toLowerCase();
  const name = exercise.name.toLowerCase();

  const isMachineCompound =
    name.includes("machine") ||
    name.includes("smith") ||
    name.includes("leg press") ||
    name.includes("hack squat") ||
    name.includes("pendulum") ||
    name.includes("belt squat") ||
    name.includes("v-squat");

  if ((movement === "hinge" && !name.includes("pull through")) || name.includes("deadlift") || name.includes("rdl")) {
    return 210;
  }

  if (
    movement.includes("press") ||
    movement.includes("row") ||
    movement.includes("vertical pull") ||
    movement.includes("squat") ||
    movement.includes("glute bridge") ||
    movement.includes("glute press")
  ) {
    return isMachineCompound ? 150 : 180;
  }

  if (exercise.group === "Abs & Calves") {
    return 60;
  }

  if (
    movement.includes("flye") ||
    movement.includes("raise") ||
    movement.includes("curl") ||
    movement.includes("triceps") ||
    movement.includes("isolation") ||
    movement.includes("rear delt")
  ) {
    return 120;
  }

  return 120;
}

function formatRestTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getRestSecondsByMode(exercise: PlanExercise, mode: RestMode) {
  const normal = getRestSeconds(exercise);

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

function normalizeSetInputs(raw: SetInput[], sets: number) {
  if (raw.length > sets) return raw.slice(0, sets);
  if (raw.length < sets) return [...raw, ...createDefaultSetInputs(sets - raw.length)];
  return raw;
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

function getMuscleRegionFill(region: MuscleRegion, primary: MuscleRegion[], secondary: MuscleRegion[]) {
  const check = (r: MuscleRegion) => {
    if (primary.includes(r)) return 1;
    if (secondary.includes(r)) return 2;
    if (r === "chest" && (primary.includes("lowerChest") || primary.includes("chest"))) return 1;
    if (r === "chest" && (secondary.includes("lowerChest") || secondary.includes("chest"))) return 2;
    if (r === "upperBack" && (primary.includes("upperTraps") || primary.includes("upperBack"))) return 1;
    if (r === "upperBack" && (secondary.includes("upperTraps") || secondary.includes("upperBack"))) return 2;
    if (r === "midBack" && (primary.includes("lowerTraps") || primary.includes("midBack"))) return 1;
    if (r === "midBack" && (secondary.includes("lowerTraps") || secondary.includes("midBack"))) return 2;
    if (r === "triceps" && (primary.includes("tricepsLong") || primary.includes("triceps"))) return 1;
    if (r === "triceps" && (secondary.includes("tricepsLong") || secondary.includes("triceps"))) return 2;
    return 0;
  };

  const res = check(region);
  if (res === 1) return "#dc2626";
  if (res === 2) return "#fbbf24";
  return "#52525b";
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

      {/* Secondary Muscles Glow Mask (Warm Amber Glow) */}
      {secondaryIds.map((id) => (
        <div
          key={`sec-${id}`}
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            maskImage: `url('/anatomy/${side}/${id}.png')`,
            WebkitMaskImage: `url('/anatomy/${side}/${id}.png')`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            backgroundColor: "#f59e0b",
            filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.95)) brightness(1.2)",
            opacity: 0.85,
          }}
        />
      ))}

      {/* Primary Muscles Glow Mask (Vibrant Emerald Neon Glow) */}
      {primaryIds.map((id) => (
        <div
          key={`pri-${id}`}
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            maskImage: `url('/anatomy/${side}/${id}.png')`,
            WebkitMaskImage: `url('/anatomy/${side}/${id}.png')`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            backgroundColor: "#10b981",
            filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 1)) drop-shadow(0 0 16px rgba(16, 185, 129, 0.7)) brightness(1.35)",
            opacity: 0.95,
          }}
        />
      ))}
    </div>
  );
}

function MusclePreviewFigure(props: {
  side: "front" | "back";
  primary: MuscleRegion[];
  secondary: MuscleRegion[];
  compact?: boolean;
}) {
  return <RealisticAnatomyFigure {...props} />;
}

function DayMuscleOverviewCard({ summary }: { summary: MuscleSummary }) {
  return (
    <details className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">Daily Muscle Map · 3D Anatomy</p>
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
  const [showDiagram, setShowDiagram] = useState(false);
  const { primary, secondary } = getExercisePreviewRegions(exercise);
  const primaryLabels = primary.map((item) => MUSCLE_REGION_LABELS[item]);
  const secondaryLabels = secondary.map((item) => MUSCLE_REGION_LABELS[item]);

  return (
    <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Target Muscles</p>
          <p className="mt-0.5 truncate text-xs">
            <span className="font-semibold text-emerald-400">{primaryLabels.length > 0 ? primaryLabels.join(", ") : "—"}</span>
            {secondaryLabels.length > 0 ? <span> · <span className="text-amber-300">{secondaryLabels.join(", ")}</span></span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDiagram((prev) => !prev)}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-expanded={showDiagram}
          aria-label={showDiagram ? "Hide muscle diagram" : "Show muscle diagram"}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          {showDiagram ? "Hide 3D Anatomy" : "View 3D Anatomy"}
        </button>
      </div>

      {showDiagram && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80">
          <div className="mb-2.5 flex items-center justify-between text-[11px]">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Anatomy Explorer</span>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" /> Primary
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" /> Secondary
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
    mode: "today",
    days: 4,
    selectedDay: 0,
    fiveDayMode: "twoLegDays",
    showHistory: false,
    showLibrary: false,
    scrollY: 0,
    selectedCustomPlanId: null,
    selectedCustomDay: 0,
  };
  if (!raw || typeof raw !== "object") return fallback;
  const modes: AppMode[] = ["today", "preset", "custom", "history", "library"];
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
  challenges: Challenge[];
  hasData: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function computeWeeklyPerformance(logs: LogSet[], plannedDays: number, activePlan: DayPlan[]): PerformanceReport {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const thisWeek = logs.filter((l) => new Date(l.date).getTime() >= weekAgo);

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

  // 2) VOLUME: เซต/กล้ามเนื้อ สัปดาห์นี้ (โซนทอง 10–20 เซต)
  const lib = exerciseLibrary.reduce<Record<string, Exercise>>((a, e) => {
    a[e.name] = e;
    return a;
  }, {});
  const muscleSets: Record<string, number> = {};
  for (const l of thisWeek) {
    const ex = lib[l.exerciseName];
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
  const volume = volEntries.length
    ? volEntries.reduce((s, n) => s + (n >= 10 && n <= 20 ? 100 : n < 10 ? (n / 10) * 100 : 85), 0) / volEntries.length
    : 0;
  const musclesOver10 = volEntries.filter((n) => n >= 10).length;

  // 3) CONSISTENCY: วันฝึกจริง vs แผน
  const uniqueDays = new Set(thisWeek.map((l) => getLocalDateKey(l.date))).size;
  const consistency = Math.min(100, (uniqueDays / Math.max(1, plannedDays)) * 100);

  // 4) COMPLETION: เซตจริง vs เซตแผนทั้งสัปดาห์
  const plannedSets = activePlan.reduce((s, d) => s + d.exercises.reduce((x, e) => x + e.sets, 0), 0);
  const completion = plannedSets > 0 ? Math.min(100, (thisWeek.length / plannedSets) * 100) : 0;

  const score = Math.round(progress * 0.3 + volume * 0.3 + consistency * 0.25 + completion * 0.15);

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

  return { score, ...info, progress, volume, consistency, completion, challenges, hasData: true };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold text-zinc-400">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-900">
        <div
          className={`h-full rounded-full ${value >= 80 ? "bg-emerald-400" : value >= 60 ? "bg-teal-400" : value >= 40 ? "bg-amber-400" : "bg-zinc-600"}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyPerformanceCard({ report }: { report: PerformanceReport }) {
  return (
    <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">Weekly Performance</p>
          <p className="mt-1 text-2xl font-black">{report.hasData ? `${report.score}/100` : "—/100"}</p>
        </div>
        <span className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xl font-black text-emerald-300">
          {report.emoji} {report.rank}
        </span>
      </div>

      {report.hasData && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ScoreBar label="Strength ↑" value={report.progress} />
            <ScoreBar label="Volume" value={report.volume} />
            <ScoreBar label="Consistency" value={report.consistency} />
            <ScoreBar label="Completion" value={report.completion} />
          </div>
          <div className="mt-3 space-y-2">
            {report.challenges.map((c) => (
              <div
                key={c.name}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${c.done ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-950 text-zinc-400"}`}
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
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [compactList, setCompactList] = useState(true);
  const [substituteMap, setSubstituteMap] = useState<Record<string, string>>(() => readJson<Record<string, string>>(SUBSTITUTE_KEY, {}));

  // Substitution Modal State
  const [substituteModalExercise, setSubstituteModalExercise] = useState<PlanExercise | null>(null);
  const [substituteSearch, setSubstituteSearch] = useState("");
  const [substituteFilter, setSubstituteFilter] = useState<"movement" | "group" | "all">("movement");

  const presetPlans = useMemo(() => makePresetPlans(), []);
  const fiveDayLegOncePlan = useMemo(() => makeFiveDayLegOncePlan(), []);

  const selectedCustomPlan = useMemo(() => {
    if (customPlans.length === 0) return null;
    return customPlans.find((plan) => plan.id === selectedCustomPlanId) ?? customPlans[0];
  }, [customPlans, selectedCustomPlanId]);

  const activePresetPlan = days === 5 && fiveDayMode === "oneLegDay" ? fiveDayLegOncePlan : presetPlans[days];
  const isPresetLike = mode === "today" || mode === "preset";
  const activePlan = isPresetLike ? activePresetPlan : selectedCustomPlan?.days ?? [];
  const activeDayIndex = isPresetLike ? selectedDay : selectedCustomDay;
  const day = activePlan[activeDayIndex] ?? activePlan[0];

  useEffect(() => {
    const parsed = readJson<LogSet[]>(LATEST_LOGS_KEY, []);
    if (Array.isArray(parsed)) {
      setLogs(parsed);
      setRecordsMap((current) => {
        let updated = current;
        for (const log of parsed) {
          updated = updateRecordsWithSet(updated, log);
        }
        return updated;
      });
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

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
    });
  }, [mode, days, selectedDay, fiveDayMode, showHistory, showLibrary, selectedCustomPlan?.id, selectedCustomDay]);

  useEffect(() => writeLocalJson(SET_INPUTS_KEY, inputs), [inputs]);
  useEffect(() => writeLocalJson(CUSTOM_PLANS_KEY, customPlans), [customPlans]);
  useEffect(() => writeLocalJson(SUBSTITUTE_KEY, substituteMap), [substituteMap]);
  useEffect(() => writeLocalJson(MACHINE_TAGS_KEY, machineTags), [machineTags]);

  function updateMachineTag(exerciseId: string, tag: string) {
    setMachineTags((old) => {
      const next = { ...old, [exerciseId]: tag };
      writeLocalJson(MACHINE_TAGS_KEY, next);
      return next;
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

  function startRestTimer(exercise: PlanExercise) {
    if (!restTimerEnabled) return;
    requestNotificationPermission();

    const mode = restModeMap[exercise.id] ?? "normal";
    const seconds = customRestMap[exercise.id] ?? getRestSecondsByMode(exercise, mode);
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

  const recentLogs = filteredHistoryLogs;

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

  const recentLogsByDate = useMemo(() => {
    return recentLogs.reduce<Record<string, LogSet[]>>((acc, item) => {
      const key = new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short", day: "numeric" }).format(new Date(item.date));
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [recentLogs]);

  const weeklyVolumeSummary = useMemo(() => getWeeklyVolumeSummary(activePlan), [activePlan]);

  const performanceReport = useMemo(
    () => computeWeeklyPerformance(logs, days, activePlan),
    [logs, days, activePlan]
  );

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
    field: "weightLbs" | "reps"
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "weightLbs") {
        const repsInput = document.getElementById(`rep-input-${baseExerciseId}-${setIndex}`);
        repsInput?.focus();
      } else if (field === "reps") {
        saveSingleSet(exercise, setIndex);
        const nextWeightInput = document.getElementById(`weight-input-${baseExerciseId}-${setIndex + 1}`);
        if (nextWeightInput) {
          nextWeightInput.focus();
        }
      }
    }
  };

  function addManualSet(exerciseId: string, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);
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
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);

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
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);
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
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);
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

  function saveSingleSet(exercise: PlanExercise, setIndex: number, machineTag?: string) {
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
    const item = exerciseInputs[setIndex];

    if (!item) return;

    const weightLbs = Number(item.weightLbs);
    const reps = Number(item.reps);

    if (!Number.isFinite(weightLbs) || !Number.isFinite(reps) || weightLbs <= 0 || reps <= 0) return;

    if (!item.done) {
      const trimmedTag = (machineTag ?? "").trim();
      const logSet: LogSet = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weightLbs,
        reps,
        setNumber: setIndex + 1,
        date: new Date().toISOString(),
        machine: trimmedTag || undefined,
      };

      const todayKey = getLocalDateKey(logSet.date);
      setLogs((old) => {
        const without = old.filter(
          (l) =>
            !(
              l.exerciseName === logSet.exerciseName &&
              (l.machine || "") === (logSet.machine || "") &&
              l.setNumber === logSet.setNumber &&
              getLocalDateKey(l.date) === todayKey
            )
        );
        return [...without, logSet];
      });

      setRecordsMap((old) => updateRecordsWithSet(old, logSet));

      // Auto start rest timer on completing working set
      startRestTimer(exercise);
    }

    setInputs((old) => {
      const current = normalizeSetInputs(old[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
      const updated = current.map((set, index) => (index === setIndex ? { ...set, done: true } : set));
      const nextInputs = {
        ...old,
        [exercise.id]: updated,
      };

      writeLocalJson(SET_INPUTS_KEY, nextInputs);
      return nextInputs;
    });
  }

  function saveAllSets(exercise: PlanExercise, machineTag?: string) {
    const trimmedTag = (machineTag ?? "").trim();
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
    const validSets: LogSet[] = exerciseInputs
      .map((item, index) => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weightLbs: Number(item.weightLbs),
        reps: Number(item.reps),
        setNumber: index + 1,
        date: new Date().toISOString(),
        machine: trimmedTag || undefined,
        alreadySaved: item.done,
      }))
      .filter((item) => Number.isFinite(item.weightLbs) && Number.isFinite(item.reps) && item.weightLbs > 0 && item.reps > 0 && !item.alreadySaved)
      .map(({ alreadySaved, ...item }) => item);

    if (validSets.length > 0) {
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
        return [...without, ...validSets];
      });

      setRecordsMap((old) => {
        let updated = old;
        for (const s of validSets) {
          updated = updateRecordsWithSet(updated, s);
        }
        return updated;
      });

      startRestTimer(exercise);
    }

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
    const headers = ["Date", "Exercise", "Machine", "Set", "Weight (lbs)", "Reps"];
    const rows = logs.map((log) => [
      safeCsvCell(new Date(log.date).toISOString().replace("T", " ").slice(0, 19)),
      safeCsvCell(log.exerciseName),
      safeCsvCell(log.machine || "-"),
      safeCsvCell(log.setNumber),
      safeCsvCell(log.weightLbs),
      safeCsvCell(log.reps),
    ]);
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
    const newDay = makeDay(`Custom Day ${selectedCustomPlan.days.length + 1}`, "Choose target muscles then press Recommend", ["Chest"], []);
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
    const safeDays = nextDays.length > 0 ? nextDays : [makeDay("Custom Day 1", "Choose target muscles then press Recommend", ["Chest"], [])];
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

  function updateCustomExercise(exerciseId: string, patch: Partial<PlanExercise>) {
    if (!day || mode !== "custom") return;
    updateCustomDay(day.id, (current) => ({ ...current, exercises: current.exercises.map((item) => (item.id === exerciseId ? { ...item, ...patch } : item)) }));
  }

  function substituteExercise(currentExercise: PlanExercise, newName: string) {
    const next = toPlanExercise(newName);

    if (mode === "custom") {
      updateCustomExercise(currentExercise.id, {
        name: next.name,
        group: next.group,
        movement: next.movement,
        muscles: next.muscles,
        reps: next.reps,
        sets: next.sets,
        warmup: next.warmup,
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
    <main className="min-h-screen bg-zinc-950 pb-40 text-zinc-50 sm:pb-32">
      <section className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2.5 backdrop-blur pt-[calc(env(safe-area-inset-top)+0.625rem)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/hait-logo.png" alt="HA IT logo" className="h-8 w-8 rounded-xl bg-white object-contain p-1" />
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
                <Dumbbell size={14} /> HA IT
              </p>
              <h1 className="text-base font-black leading-tight sm:text-lg">Workout Tracker</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-300">{pageMeta.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black">{pageMeta.title}</h2>
          

          {(mode === "today" || mode === "preset") && (
            <div className="mt-3 rounded-xl bg-zinc-950 p-3">
              <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Training days</label>
              <div className="relative">
                <select
                  value={days}
                  onChange={(event) => {
                    setDays(Number(event.target.value) as 3 | 4 | 5);
                    setSelectedDay(0);
                    setActiveExerciseIndex(0);
                  }}
                  className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value={3}>3 days Full Body</option>
                  <option value={4}>4 days Upper / Lower</option>
                  <option value={5}>5 days Split</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-zinc-400" size={20} />
              </div>
            </div>
          )}

          {mode === "custom" && selectedCustomPlan && (
            <div className="mt-3 rounded-xl bg-zinc-950 p-3">
              <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Custom plan</label>
              <div className="relative">
                <select
                  value={selectedCustomPlan?.id ?? ""}
                  onChange={(event) => {
                    setSelectedCustomPlanId(event.target.value);
                    setSelectedCustomDay(0);
                    setActiveExerciseIndex(0);
                  }}
                  className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none"
                >
                  {customPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-zinc-400" size={20} />
              </div>
            </div>
          )}
        </div>

        {(mode === "today" || mode === "preset" || mode === "custom") && (
          <WeeklyPerformanceCard report={performanceReport} />
        )}

        {(mode === "today" || mode === "preset") && days === 5 && (
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-zinc-500">5 day split type</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setFiveDayMode("twoLegDays"); setSelectedDay(0); }} className={`rounded-2xl px-3 py-3 text-sm font-black ${fiveDayMode === "twoLegDays" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}>2 Leg Days</button>
              <button onClick={() => { setFiveDayMode("oneLegDay"); setSelectedDay(0); }} className={`rounded-2xl px-3 py-3 text-sm font-black ${fiveDayMode === "oneLegDay" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}>1 Leg Day</button>
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
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${historyRange === "all" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setHistoryRange("30d")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${historyRange === "30d" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    30 วัน
                  </button>
                  <button
                    onClick={() => setHistoryRange("14d")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${historyRange === "14d" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    14 วัน
                  </button>
                </div>
                {logs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportLogsToCsv}
                      className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
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

            {filteredHistoryLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
                {logs.length === 0 ? "No workout log yet. Save working sets first." : "ไม่พบประวัติการฝึกในช่วงเวลาที่เลือก"}
              </div>
            ) : (
              <div className="space-y-3 pr-1">
                {Object.entries(recentLogsByDate).map(([date, items]) => (
                  <div key={date} className="rounded-2xl bg-zinc-950 p-3">
                    <h4 className="mb-3 text-sm font-black text-emerald-300">{date}</h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={`${item.date}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold leading-tight flex items-center flex-wrap gap-1.5">
                                <span>{item.exerciseName}</span>
                                {item.machine && (
                                  <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                                    {item.machine}
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-[11px] text-zinc-500">{formatShortDate(item.date)} · Set {item.setNumber}</p>
                            </div>
                            <p className="whitespace-nowrap text-sm font-black text-emerald-300">{item.weightLbs} lbs × {item.reps}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <summary className="cursor-pointer text-sm font-black text-emerald-300">
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
          <details className="mt-4 rounded-3xl border border-emerald-400/20 bg-zinc-900 p-4">
            <summary className="cursor-pointer text-base font-black text-emerald-300">Plan settings</summary>

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
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-3 py-3 text-xs font-black text-zinc-950"
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

        {(mode === "today" || mode === "preset" || mode === "custom") && (
          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activePlan.map((item, index) => (
              <button key={item.id} onClick={() => {
                if (isPresetLike) setSelectedDay(index);
                else setSelectedCustomDay(index);
                setActiveExerciseIndex(0);
              }} className={`min-w-[136px] snap-start rounded-xl px-3 py-2.5 text-left transition ${activeDayIndex === index ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"}`}>
                <CalendarDays size={16} />
                <p className="mt-1 line-clamp-2 text-sm font-bold leading-5">{item.title}</p>
                <p className="mt-1 hidden text-[11px] opacity-70 sm:block">{item.subtitle}</p>
              </button>
            ))}
          </div>
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
                              day.focus.includes(group) ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={recommendIntoCurrentDay}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950"
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

              <div className="mt-2 flex flex-wrap gap-1.5">
                {day.focus.map((focus) => (
                  <span key={focus} className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300">{focus}</span>
                ))}
              </div>

              <DayMuscleOverviewCard summary={activeMuscleSummary} />
            </div>

            <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">Exercises</h3>
                  
                </div>
                <button
                  onClick={() => setCompactList((value) => !value)}
                  className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300"
                >
                  {compactList ? "All" : "Focus"}
                </button>
              </div>

              <div className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {day.exercises.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveExerciseIndex(index);
                      setCompactList(true);
                    }}
                    className={`min-w-[96px] snap-start rounded-xl px-3 py-2.5 text-left text-xs ${
                      activeExerciseIndex === index ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"
                    }`}
                  >
                    <span className="block text-[11px] font-bold">#{index + 1}</span>
                    <span className="mt-1 line-clamp-3 block text-sm font-semibold leading-5">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
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

            {mode === "custom" && (
              <details className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <summary className="cursor-pointer text-xs font-bold text-zinc-300">
                  <Plus size={16} className="mr-2 inline" /> Add exercise
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
                        <Plus size={18} className="text-emerald-300" />
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            )}

            <div className="mt-4 grid gap-4">
              {visibleExercises.map((baseExercise) => {
                const index = day.exercises.findIndex((item) => item.id === baseExercise.id);
                const selectedSubstitute = substituteMap[baseExercise.id];
                const exercise = mode === "custom" || !selectedSubstitute ? baseExercise : applyExerciseIdentity(baseExercise, selectedSubstitute);
                const currentMachine = machineTags[baseExercise.id] || "";
                const effectiveKey = getEffectiveExerciseKey(exercise.name, currentMachine);
                const records = recordsMap[effectiveKey] ?? (currentMachine ? recordsMap[exercise.name] : {}) ?? {};
                const pr = records.maxWeight ?? prMap[effectiveKey] ?? prMap[exercise.name];
                const warmups = exercise.warmup ? getWarmupSets(pr?.weightLbs) : [];
                const restMode = restModeMap[baseExercise.id] ?? "normal";
                const selectedRestSeconds = customRestMap[baseExercise.id] ?? getRestSecondsByMode({ ...exercise, id: baseExercise.id }, restMode);
                const rawSetInputs = inputs[baseExercise.id] ?? createDefaultSetInputs(exercise.sets);
                const setInputs = normalizeSetInputs(rawSetInputs, exercise.sets);
                const alternatives = getAlternatives(exercise);

                return (
                  <article key={baseExercise.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-400">#{index + 1}</span>
                          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{exercise.group}</span>
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">{exercise.movement}</span>
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">
                            {LOAD_LABELS[getLoadType(exercise)]}
                          </span>
                          {mode === "preset" && substituteMap[baseExercise.id] && <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300">Subbed</span>}
                          {exercise.warmup ? <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-300"><Flame className="mr-1 inline" size={12} /> Warmup</span> : <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">No warmup</span>}
                        </div>

                        <h3 className="mt-2 text-lg font-black leading-snug sm:text-xl">{exercise.name}</h3>
                        <p className="mt-1 text-sm text-zinc-400">{exercise.sets} hard working sets × {exercise.reps} reps</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a href={youtubeSearch(`${exercise.name} proper form`)} target="_blank" rel="noreferrer" className="rounded-2xl bg-zinc-50 p-3 text-zinc-950" aria-label="Watch demo"><PlayCircle size={22} /></a>
                        {mode === "custom" && <button onClick={() => removeExerciseFromCurrentDay(baseExercise.id)} className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300" aria-label="Remove exercise"><Trash2 size={18} /></button>}
                      </div>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {exercise.muscles.map((muscle) => <span key={muscle} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{muscle}</span>)}
                    </div>

                    <ExerciseMusclePreviewCard exercise={exercise} />

                    {mode === "custom" && (
                      <details className="mb-3 rounded-xl bg-zinc-950 p-3">
                        <summary className="cursor-pointer text-xs font-bold text-zinc-300">Edit</summary>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-500">Sets</label>
                            <div className="flex items-stretch rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden focus-within:border-emerald-400 transition">
                              <button
                                type="button"
                                onClick={() => updateCustomExercise(baseExercise.id, { sets: Math.max(1, exercise.sets - 1) })}
                                className="flex w-7 sm:w-8 items-center justify-center text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 active:scale-90 transition font-black text-base select-none"
                                aria-label="Decrease sets"
                              >
                                −
                              </button>
                              <input
                                inputMode="numeric"
                                value={exercise.sets}
                                onChange={(event) => updateCustomExercise(baseExercise.id, { sets: Math.max(1, Number(event.target.value) || 1) })}
                                className="w-full min-w-0 bg-transparent px-0.5 py-3 text-center text-sm font-bold outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateCustomExercise(baseExercise.id, { sets: Math.min(10, exercise.sets + 1) })}
                                className="flex w-7 sm:w-8 items-center justify-center text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 active:scale-90 transition font-black text-base select-none"
                                aria-label="Increase sets"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-500">Reps</label>
                            <input
                              value={exercise.reps}
                              onChange={(event) => updateCustomExercise(baseExercise.id, { reps: event.target.value })}
                              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 outline-none"
                            />
                          </div>

                          <button
                            onClick={() => updateCustomExercise(baseExercise.id, { warmup: !exercise.warmup })}
                            className={`mt-5 rounded-2xl px-2 py-3 text-xs font-black ${
                              exercise.warmup ? "bg-orange-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            Warmup
                          </button>
                        </div>
                      </details>
                    )}

                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSubstituteModalExercise(baseExercise);
                          setSubstituteSearch("");
                          setSubstituteFilter("movement");
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-xl bg-zinc-950 px-3.5 py-3 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Substitute ${exercise.name}`}
                      >
                        <span className="flex items-center gap-2">
                          <RotateCcw size={14} className="text-emerald-400" />
                          <span>Substitute Exercise</span>
                        </span>
                        <span className="rounded-lg bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">
                          {selectedSubstitute ? "Modified" : "Choose"}
                        </span>
                      </button>
                    </div>

                    {/* Machine / Equipment Variant Selector */}
                    <div className="mb-3 rounded-xl bg-zinc-950 p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          <Dumbbell size={12} className="text-emerald-400" />
                          เครื่อง / Machine:
                        </span>
                        {currentMachine && (
                          <button
                            type="button"
                            onClick={() => updateMachineTag(baseExercise.id, "")}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300"
                          >
                            ล้างแท็ก
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["Pin Stack", "Plate-Loaded", "North Fitness", "Hammer", "เครื่อง 1", "เครื่อง 2"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => updateMachineTag(baseExercise.id, currentMachine === tag ? "" : tag)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              currentMachine === tag
                                ? "bg-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/20"
                                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                        <input
                          type="text"
                          placeholder="+ พิมพ์ชื่อเครื่องเอง..."
                          value={currentMachine}
                          onChange={(e) => updateMachineTag(baseExercise.id, e.target.value)}
                          className="min-w-[120px] flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                    </div>

                    <div className="mb-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                          <Trophy size={14} /> Records {currentMachine && <span className="text-emerald-400 font-semibold normal-case">({currentMachine})</span>}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-zinc-900 px-3 py-2"><p className="text-[10px] font-bold uppercase text-zinc-500">Max</p><p className="mt-1 text-sm font-black text-emerald-300">{records.maxWeight ? `${records.maxWeight.weightLbs} × ${records.maxWeight.reps}` : "—"}</p></div>
                          <div className="rounded-xl bg-zinc-900 px-3 py-2"><p className="text-[10px] font-bold uppercase text-zinc-500">Reps</p><p className="mt-1 text-sm font-black text-zinc-100">{records.bestReps ? `${records.bestReps.weightLbs} × ${records.bestReps.reps}` : "—"}</p></div>
                          <div className="rounded-xl bg-zinc-900 px-3 py-2"><p className="text-[10px] font-bold uppercase text-zinc-500">Volume</p><p className="mt-1 text-sm font-black text-zinc-100">{records.bestVolume ? `${records.bestVolume.weightLbs} × ${records.bestVolume.reps}` : "—"}</p></div>
                          <div className="rounded-xl bg-zinc-900 px-3 py-2"><p className="text-[10px] font-bold uppercase text-zinc-500">Warmup</p><p className="mt-1 text-sm font-black text-zinc-100">{exercise.warmup && warmups.length > 0 ? `${warmups[0].weight}/${warmups[1].weight}/${warmups[2].weight}` : "Skip"}</p></div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold uppercase text-zinc-500">Rest</p>
                            <p className="mt-1 text-2xl font-black text-emerald-300">
                              {restTimer.exerciseId === baseExercise.id && restTimer.secondsLeft > 0
                                ? formatRestTime(restTimer.secondsLeft)
                                : formatRestTime(selectedRestSeconds)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRestTimerEnabled((value) => !value)}
                              className={`rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                restTimerEnabled ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-400"
                              }`}
                              aria-label={restTimerEnabled ? "Disable rest timer" : "Enable rest timer"}
                              type="button"
                            >
                              {restTimerEnabled ? "On" : "Off"}
                            </button>
                            <button
                              onClick={() =>
                                restTimer.exerciseId === baseExercise.id && restTimer.running
                                  ? stopRestTimer()
                                  : startRestTimer({ ...exercise, id: baseExercise.id })
                              }
                              className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
                              aria-label={restTimer.exerciseId === baseExercise.id && restTimer.running ? "Stop rest timer" : "Start rest timer"}
                              type="button"
                            >
                              {restTimer.exerciseId === baseExercise.id && restTimer.running ? "Stop" : "Start"}
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[["short", "Short"], ["normal", "Normal"], ["heavy", "Heavy"]].map(([mode, label]) => (
                            <button
                              key={mode}
                              onClick={() => setRestMode({ ...exercise, id: baseExercise.id }, mode as RestMode)}
                              className={`rounded-xl px-2 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                restMode === mode ? "bg-zinc-50 text-zinc-950" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                              }`}
                              aria-label={`Set rest preset ${label}`}
                              type="button"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => adjustRestSeconds({ ...exercise, id: baseExercise.id }, -30)}
                            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
                            aria-label="Decrease rest by 30 seconds"
                            type="button"
                          >
                            −30s
                          </button>
                          <button
                            onClick={() => adjustRestSeconds({ ...exercise, id: baseExercise.id }, 30)}
                            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
                            aria-label="Increase rest by 30 seconds"
                            type="button"
                          >
                            +30s
                          </button>
                        </div>
                        {restTimer.exerciseId === baseExercise.id && restTimer.totalSeconds > 0 && (
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
                            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${restProgress}%` }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-950 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase text-zinc-500">Working sets</p>
                          <p className="mt-0.5 text-[11px] text-zinc-600">
                            Plan {exercise.sets} · Log {setInputs.length}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => removeManualSet(baseExercise.id, exercise.sets)}
                            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 disabled:opacity-40 transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
                            disabled={setInputs.length <= 1}
                            aria-label="Remove last set"
                            type="button"
                          >
                            − Set
                          </button>
                          <button
                            onClick={() => addManualSet(baseExercise.id, exercise.sets)}
                            className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
                            aria-label="Add additional set"
                            type="button"
                          >
                            + Set
                          </button>
                        </div>
                      </div>

                      <div className="mb-2 grid grid-cols-[38px_1fr_1.35fr_42px] gap-2 text-[11px] font-bold uppercase text-zinc-500">
                        <span>Set</span><span>lbs</span><span>Reps</span><span>Save</span>
                      </div>
                      <div className="space-y-2">
                        {setInputs.map((set, setIndex) => {
                          const latestSet = lastSetMap[effectiveKey]?.[setIndex + 1] ?? lastSetMap[exercise.name]?.[setIndex + 1];
                          const fallbackRepVal = latestSet ? Number(latestSet.reps) : 10;

                          return (
                            <div key={setIndex} className="grid grid-cols-[38px_1fr_1.35fr_42px] gap-2">
                              <div className="flex items-center justify-center font-black text-zinc-400">{setIndex + 1}</div>
                              <input
                                id={`weight-input-${baseExercise.id}-${setIndex}`}
                                inputMode="decimal"
                                value={set.weightLbs}
                                onChange={(event) => updateSet(baseExercise.id, setIndex, "weightLbs", event.target.value, exercise.sets)}
                                onKeyDown={(event) => handleSetInputKeyDown(event, { ...exercise, id: baseExercise.id }, baseExercise.id, setIndex, "weightLbs")}
                                aria-label={`Weight in pounds for set ${setIndex + 1}`}
                                className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
                                placeholder={latestSet ? String(latestSet.weightLbs) : "0"}
                              />
                              <div className="flex items-stretch rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400 transition">
                                <button
                                  type="button"
                                  onClick={() => stepReps(baseExercise.id, setIndex, -1, exercise.sets, fallbackRepVal)}
                                  className="flex w-7 sm:w-8 items-center justify-center text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 active:scale-90 transition font-black text-lg select-none"
                                  aria-label={`Decrease reps for set ${setIndex + 1}`}
                                >
                                  −
                                </button>
                                <input
                                  id={`rep-input-${baseExercise.id}-${setIndex}`}
                                  inputMode="numeric"
                                  value={set.reps}
                                  onChange={(event) => updateSet(baseExercise.id, setIndex, "reps", event.target.value, exercise.sets)}
                                  onKeyDown={(event) => handleSetInputKeyDown(event, { ...exercise, id: baseExercise.id }, baseExercise.id, setIndex, "reps")}
                                  aria-label={`Reps for set ${setIndex + 1}`}
                                  className="w-full min-w-0 bg-transparent px-0.5 py-3 text-center text-base font-semibold outline-none"
                                  placeholder={latestSet ? String(latestSet.reps) : "0"}
                                />
                                <button
                                  type="button"
                                  onClick={() => stepReps(baseExercise.id, setIndex, 1, exercise.sets, fallbackRepVal)}
                                  className="flex w-7 sm:w-8 items-center justify-center text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 active:scale-90 transition font-black text-lg select-none"
                                  aria-label={`Increase reps for set ${setIndex + 1}`}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => saveSingleSet({ ...exercise, id: baseExercise.id }, setIndex, currentMachine)}
                                aria-label={`Save set ${setIndex + 1}`}
                                className={`rounded-2xl border transition active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                                  set.done
                                    ? "border-emerald-400 bg-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/20"
                                    : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600"
                                }`}
                              >
                                <Check size={18} className="mx-auto" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => saveAllSets({ ...exercise, id: baseExercise.id }, currentMachine)}
                        aria-label="Finish working sets and clear inputs"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 active:scale-[0.99] transition hover:bg-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Save size={18} /> Finish & clear
                      </button>
                    </div>

                    {compactList && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1))}
                          className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-300 disabled:opacity-40 transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
                          disabled={activeExerciseIndex === 0}
                          aria-label="Go to previous exercise"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setActiveExerciseIndex(Math.min(day.exercises.length - 1, activeExerciseIndex + 1))}
                          className="rounded-xl bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 disabled:opacity-40 transition hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-400"
                          disabled={activeExerciseIndex >= day.exercises.length - 1}
                          aria-label="Go to next exercise"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Floating Sticky Rest Timer Pill (Mobile & Desktop) */}
      {restTimer.running && restTimer.secondsLeft > 0 && (
        <aside
          aria-label="Active rest timer"
          className="fixed bottom-16 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-emerald-500/40 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md transition-all duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="truncate text-xs font-bold text-zinc-400">
                  {restTimer.exerciseName ? `Rest · ${restTimer.exerciseName}` : "Rest Timer"}
                </p>
              </div>
              <p className="mt-0.5 text-xl font-black tracking-tight text-emerald-300">
                {formatRestTime(restTimer.secondsLeft)}
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:bg-zinc-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Add 30 seconds to rest timer"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={stopRestTimer}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Stop rest timer"
              >
                Stop
              </button>
            </div>
          </div>

          {restTimer.totalSeconds > 0 && (
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-300 ease-linear"
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
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Substitute Exercise
                  </p>
                  <h3 id="substitute-dialog-title" className="mt-0.5 truncate text-lg font-black">
                    {substituteModalExercise.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSubstituteModalExercise(null)}
                  className="rounded-xl bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-emerald-400"
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
                      ? "bg-emerald-400 text-zinc-950"
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
                      ? "bg-emerald-400 text-zinc-950"
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
                      ? "bg-emerald-400 text-zinc-950"
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
                    "S+": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
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
                          ? "border-emerald-500/50 bg-emerald-500/10 text-zinc-100"
                          : isRelatedMovement
                            ? "border-emerald-500/25 bg-emerald-500/5 text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-900"
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
                          {isRelatedMovement && <span className="ml-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-black text-emerald-300">Same Movement</span>}
                          <span className={`ml-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${focusPct >= 90 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : focusPct >= 70 ? "border-zinc-700 bg-zinc-900 text-zinc-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
                            {LOAD_LABELS[candidate.load]} · {focusPct}%
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                          {candidate.muscles.join(", ")}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-zinc-950">
                          <Check size={16} />
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-xl bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:bg-emerald-400 hover:text-zinc-950 transition">
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

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-2 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1.5">
          {[
            ["today", "Today"],
            ["preset", "Preset"],
            ["custom", "Custom"],
            ["history", "Log"],
            ["library", "Library"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key as AppMode)}
              className={`rounded-xl py-2.5 text-[11px] font-medium ${
                mode === key ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}