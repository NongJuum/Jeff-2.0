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

type LoadType =
  | "barbell" | "dumbbell" | "selectorized" | "plate-loaded"
  | "smith" | "cable" | "bodyweight" | "specialty";

type Exercise = {
  name: string;
  group: MuscleGroup;
  movement: string;
  muscles: string[];
  tier: "S+" | "S" | "A+" | "A";
  load?: LoadType;
};

type PlanExercise = {
  id: string;
  name: string;
  group: MuscleGroup;
  sets: number;
  reps: string;
  warmup: boolean;
  muscles: string[];
  movement: string;
  load?: LoadType;
};

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

function writeSessionJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* fallback to local storage */ }
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
  { name: "Bench Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Cable Crossover", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "A" },
  { name: "DB Flye", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "A" },
  { name: "Decline Bench Press", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Decline Machine Press", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A+" },
  { name: "Flat DB Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A" },
  { name: "High-to-Low Cable Flye", group: "Chest", movement: "chest flye", muscles: ["Lower chest"], tier: "A" },
  { name: "Incline Barbell Bench Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Incline DB Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+" },
  { name: "Incline Machine Bench", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+" },
  { name: "Incline Smith Machine Bench", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Iso-Lateral Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+", load: "plate-loaded" },
  { name: "Iso-Lateral Incline Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S+", load: "plate-loaded" },
  { name: "Low-to-High Cable Flye", group: "Chest", movement: "chest flye", muscles: ["Upper chest"], tier: "A" },
  { name: "Machine Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+" },
  { name: "Machine Dip", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A" },
  { name: "MTS Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S", load: "selectorized" },
  { name: "MTS Incline Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S", load: "selectorized" },
  { name: "Pec Deck", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "S" },
  { name: "Seated Cable Pec Flye", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "S" },
  { name: "Smith Machine Floor Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Triceps", "Front delts"], tier: "A" },
  { name: "Smith Machine Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Weighted Dip", group: "Chest", movement: "decline press", muscles: ["Lower chest", "Front delts", "Triceps"], tier: "A" },

  { name: "Assisted Pull Up Machine", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "A" },
  { name: "Barbell Bent-Over Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Erectors"], tier: "A" },
  { name: "Cable Lat Prayers", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A" },
  { name: "Cable Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S" },
  { name: "Cable Rows", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S" },
  { name: "Chest Supported Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S+" },
  { name: "Chest Supported T-Bar Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "S" },
  { name: "DB Shrug", group: "Back", movement: "shrug", muscles: ["Upper traps"], tier: "A" },
  { name: "Deficit Pendlay Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Erectors"], tier: "A" },
  { name: "Iso-Lateral High Row", group: "Back", movement: "row", muscles: ["Upper back", "Lats", "Rear delts"], tier: "S", load: "plate-loaded" },
  { name: "Iso-Lateral Low Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "S", load: "plate-loaded" },
  { name: "Iso-Lateral Pulldown", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S", load: "plate-loaded" },
  { name: "Kroc Row", group: "Back", movement: "row", muscles: ["Upper back", "Lats", "Grip"], tier: "A" },
  { name: "Machine High Row", group: "Back", movement: "row", muscles: ["Upper back", "Lats", "Rear delts"], tier: "S" },
  { name: "Meadows Row", group: "Back", movement: "row", muscles: ["Lats", "Upper back"], tier: "A" },
  { name: "MTS Lat Pulldown", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "A+", load: "selectorized" },
  { name: "MTS Seated Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "A+", load: "selectorized" },
  { name: "Neutral Grip Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S" },
  { name: "One Arm DB Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "A" },
  { name: "One Arm Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats"], tier: "A" },
  { name: "Seal Row", group: "Back", movement: "row", muscles: ["Mid back", "Rear delts"], tier: "S" },
  { name: "Smith Machine Shrug", group: "Back", movement: "shrug", muscles: ["Upper traps"], tier: "A" },
  { name: "Straight Arm Pulldown", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A" },
  { name: "Weighted Pull Up", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S" },
  { name: "Wide Grip Cable Row", group: "Back", movement: "row", muscles: ["Upper back", "Rear delts"], tier: "A" },
  { name: "Widegrip Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "A" },
  { name: "DB Pullovers", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A" },

  { name: "45° Back Extension", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "45° Glute Hyperextension", group: "Legs", movement: "glute isolation", muscles: ["Glutes", "Hamstrings"], tier: "A" },
  { name: "45° Leg Press", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "45° Leg Press High Foot", group: "Legs", movement: "glute press", muscles: ["Glutes", "Hamstrings", "Quads"], tier: "A" },
  { name: "B-Stance RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes"], tier: "A" },
  { name: "Barbell Back Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Belt Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S+" },
  { name: "Bulgarian Split Squat", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "S" },
  { name: "Cable Pull Through", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes"], tier: "A" },
  { name: "Deadlift", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "Front Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Hack Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S+" },
  { name: "Kickbacks", group: "Legs", movement: "glute isolation", muscles: ["Glutes"], tier: "A" },
  { name: "Leg Extension", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A" },
  { name: "Lunges", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Lying Leg Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "A" },
  { name: "Machine Hip Abduction", group: "Legs", movement: "glute isolation", muscles: ["Glutes"], tier: "A" },
  { name: "Machine Hip Adduction", group: "Legs", movement: "hip adduction", muscles: ["Adductors"], tier: "A" },
  { name: "Machine Hip Thrust", group: "Legs", movement: "glute bridge", muscles: ["Glutes", "Hamstrings"], tier: "S" },
  { name: "Nordic Hamstring Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "A" },
  { name: "Pendulum Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S" },
  { name: "Reverse Nordic", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A" },
  { name: "Romanian Deadlift RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "Seated Hamstring Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "S+" },
  { name: "Sissy Squat", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A" },
  { name: "Smith Machine Lunge FFE", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Smith Machine RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "Smith Machine Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Smith Machine Squat Feet Forward", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Step Ups High Box", group: "Legs", movement: "single leg", muscles: ["Glutes", "Quads"], tier: "A" },
  { name: "Trap Bar Deadlift", group: "Legs", movement: "hinge", muscles: ["Quads", "Glutes", "Erectors"], tier: "A" },
  { name: "V-Squat Machine", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },

  { name: "Atlantis Machine Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S" },
  { name: "Barbell Overhead Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A" },
  { name: "Behind Back Cable Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S" },
  { name: "Cable Y Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts", "Lower traps"], tier: "A" },
  { name: "Cable Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S+" },
  { name: "DB Lateral Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "A" },
  { name: "DB Rear Delt Flye", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "A" },
  { name: "Iso-Lateral Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A+", load: "plate-loaded" },
  { name: "Lean In DB Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "A" },
  { name: "Machine Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A" },
  { name: "MTS Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A+", load: "selectorized" },
  { name: "Reverse Cable Crossover", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "A" },
  { name: "Reverse Pec Deck", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "S" },
  { name: "Rope Face Pull", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back", "Lower traps"], tier: "A" },
  { name: "Seated DB Overhead Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A" },
  { name: "Smith Machine Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A" },

  { name: "1 Arm DB Overhead", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "A" },
  { name: "Barbell Skullcrusher", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A" },
  { name: "Cable Rope Hammer Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Close-Grip Bench Press", group: "Arms", movement: "horizontal press", muscles: ["Triceps", "Chest", "Front delts"], tier: "A" },
  { name: "DB Hammer Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "DB Preacher Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "DB Skullcrusher", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A" },
  { name: "EZ Bar Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Face Away Bayesian Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Incline Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Katana Cable", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "A" },
  { name: "Machine Preacher Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Machine Triceps Extension", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A" },
  { name: "Overhead Cable Ext", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "S+" },
  { name: "Rope Tricep Pushdown", group: "Arms", movement: "triceps pressdown", muscles: ["Triceps"], tier: "A" },
  { name: "Standing DB Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Straight Bar Cable Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Triceps Pressdown Bar", group: "Arms", movement: "triceps pressdown", muscles: ["Triceps"], tier: "A" },

  { name: "Ab Wheel Rollout", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A" },
  { name: "Cable Crunch", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A" },
  { name: "Captain's Chair Knee Raise", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "S" },
  { name: "Front Calf Muscle", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "A" },
  { name: "Hanging Knee Raise", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "S" },
  { name: "Hanging Leg Raise", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A" },
  { name: "Leg Press Calf Raise", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "A" },
  { name: "Machine Abs Crunch", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A" },
  { name: "Seated Calf Raise", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "S" },
  { name: "Standing Calf Raise", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "A" },
];

const allGroups: MuscleGroup[] = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Abs & Calves"];

function findExercise(name: string) {
  return exerciseLibrary.find((exercise) => exercise.name === name) ?? exerciseLibrary[0];
}

const LOAD_LABELS: Record<LoadType, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  selectorized: "Selectorized (Stack)",
  "plate-loaded": "Plate-Loaded (Iso)",
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
  return { id: makeId("day"), title, subtitle, focus, exercises: exerciseNames.map(toPlanExercise) };
}

function makePresetPlans() {
  return {
    3: [
      makeDay("Day 1 Full Body A", "Squat, horizontal press, row, hamstrings, delts, arms", ["Chest", "Back", "Legs", "Shoulders", "Arms"], ["Hack Squat", "Machine Chest Press", "Chest Supported Row", "Seated Hamstring Curl", "Cable Lat Raise", "Overhead Cable Ext"]),
      makeDay("Day 2 Full Body B", "Hinge, vertical pull, incline press, quads, rear delts, biceps", ["Legs", "Back", "Chest", "Shoulders", "Arms"], ["Romanian Deadlift RDL", "Neutral Grip Lat Pull Down", "Incline DB Press", "Leg Extension", "Reverse Pec Deck", "Face Away Bayesian Curl"]),
      makeDay("Day 3 Full Body C", "Leg press, lower chest, row, glutes, delts, calves or abs", ["Legs", "Chest", "Back", "Shoulders", "Abs & Calves"], ["45° Leg Press", "High-to-Low Cable Flye", "Cable Row", "Machine Hip Thrust", "Cable Lat Raise", "Cable Crunch"]),
    ],
    4: [
      makeDay("Day 1 Upper A", "Mid chest, lats, side delts, upper traps, triceps long", ["Chest", "Back", "Shoulders", "Arms"], ["Machine Chest Press", "Seated Cable Pec Flye", "Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Raise", "DB Shrug", "Overhead Cable Ext"]),
      makeDay("Day 2 Lower A", "Quad bias, Hamstrings, Glutes, Soleus", ["Legs", "Abs & Calves"], ["Hack Squat", "Leg Extension", "Seated Hamstring Curl", "Machine Hip Thrust", "Seated Calf Raise"]),
      makeDay("Day 3 Upper B", "Upper + lower chest, lat width, rear delts, lower traps, biceps", ["Chest", "Back", "Shoulders", "Arms"], ["Incline DB Press", "High-to-Low Cable Flye", "Widegrip Lat Pull Down", "Cable Row", "Reverse Pec Deck", "Rope Face Pull", "Face Away Bayesian Curl"]),
      makeDay("Day 4 Lower B", "Hinge, Leg Press, Quads, Abs, Gastroc", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Bulgarian Split Squat", "Lying Leg Curl", "Cable Crunch", "Standing Calf Raise"]),
    ],
    5: [
      makeDay("Day 1 Chest + Back A", "Horizontal press, row, incline press, vertical pull, flye", ["Chest", "Back"], ["Machine Chest Press", "Chest Supported Row", "Incline DB Press", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye"]),
      makeDay("Day 2 Legs Quad Bias", "Squat press, leg curl, quad isolation, glute, soleus", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Seated Calf Raise"]),
      makeDay("Day 3 Shoulders + Arms", "Shoulder press, side delt, rear delt, lower traps, biceps, triceps long", ["Shoulders", "Arms"], ["Machine Shoulder Press", "Cable Lat Raise", "Reverse Pec Deck", "Cable Y Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 4 Chest + Back B", "Row bias, lat isolation, lower chest, rear delt, upper traps", ["Back", "Chest", "Shoulders"], ["Cable Row", "Cable Lat Prayers", "High-to-Low Cable Flye", "Pec Deck", "Rope Face Pull", "DB Shrug"]),
      makeDay("Day 5 Legs Posterior Bias", "Hinge, squat press, hamstring curl, glute, abs or calves", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Lying Leg Curl", "Machine Hip Thrust", "Cable Crunch", "Standing Calf Raise"]),
    ],
  } satisfies Record<3 | 4 | 5, DayPlan[]>;
}

function makeFiveDayLegOncePlan() {
  return [
    makeDay("Day 1 Push", "Chest press, incline, flye, side delt, triceps", ["Chest", "Shoulders", "Arms"], ["Machine Chest Press", "Incline DB Press", "Seated Cable Pec Flye", "Cable Lat Raise", "Overhead Cable Ext"]),
    makeDay("Day 2 Pull", "Row, pulldown, lat isolation, rear delt, biceps", ["Back", "Shoulders", "Arms"], ["Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Prayers", "Reverse Pec Deck", "Face Away Bayesian Curl"]),
    makeDay("Day 3 Legs Only", "Single weekly leg day with complete lower-body coverage", ["Legs", "Abs & Calves"], ["Hack Squat", "Romanian Deadlift RDL", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Front Calf Muscle"]),
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

function inferGroupsFromText(text: string): MuscleGroup[] {
  const lower = text.toLowerCase();
  const groups: MuscleGroup[] = [];
  const add = (group: MuscleGroup) => {
    if (!groups.includes(group)) groups.push(group);
  };

  if (lower.includes("chest") || lower.includes("อก") || lower.includes("push")) add("Chest");
  if (lower.includes("back") || lower.includes("pull") || lower.includes("หลัง") || lower.includes("lat")) add("Back");
  if (lower.includes("leg") || lower.includes("ขา") || lower.includes("quad") || lower.includes("hamstring") || lower.includes("glute")) add("Legs");
  if (lower.includes("shoulder") || lower.includes("ไหล่") || lower.includes("delt")) add("Shoulders");
  if (lower.includes("arm") || lower.includes("แขน") || lower.includes("bicep") || lower.includes("tricep")) add("Arms");
  if (lower.includes("abs") || lower.includes("core") || lower.includes("calf") || lower.includes("หน้าท้อง") || lower.includes("น่อง")) add("Abs & Calves");

  if (groups.length === 0) return ["Chest", "Back"];
  return groups;
}

function inferDayCountFromText(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("5") || lower.includes("five")) return 5;
  if (lower.includes("3") || lower.includes("three")) return 3;
  return 4;
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
  "Upper traps": ["upperTraps"],
  "Lower traps": ["lowerTraps"],
  Erectors: ["erectors"],
  Abs: ["abs"],
  Glutes: ["glutes"],
  Quads: ["quads"],
  Hamstrings: ["hamstrings"],
  Calves: ["calves"],
  Adductors: ["quads"],
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

type StabilityClass = "machine" | "cable" | "freeweight";

const STABILITY_LABELS: Record<StabilityClass, string> = {
  machine: "Machine · high stability",
  cable: "Cable · medium stability",
  freeweight: "Free weight · stabilizer demand",
};

function getStabilityClass(ex: { name: string }): StabilityClass {
  const n = ex.name.toLowerCase();
  if (n.includes("cable") || n.includes("katana")) return "cable";
  if (
    n.includes("machine") || n.includes("smith") || n.includes("mts") || n.includes("iso-lateral") ||
    n.includes("hack squat") || n.includes("pendulum") || n.includes("leg press") ||
    n.includes("leg extension") || n.includes("leg curl") || n.includes("hamstring curl") ||
    n.includes("pec deck") || n.includes("atlantis") || n.includes("calf raise") ||
    n.includes("hip abduction") || n.includes("hip thrust") || n.includes("preacher") ||
    n.includes("abs crunch") || n.includes("belt squat") || n.includes("v-squat")
  ) return "machine";
  return "freeweight";
}

function calculateMuscleMatchScore(
  target: Pick<PlanExercise, "group" | "movement" | "muscles" | "name"> & { load?: LoadType },
  candidate: Exercise
): number {
  if (target.group !== candidate.group) return -1;

  const targetRegions = getExercisePreviewRegions(target);
  const candidateRegions = getExercisePreviewRegions(candidate);

  let score = 0;

  // Primary muscle matching (highest weight)
  for (const region of targetRegions.primary) {
    if (candidateRegions.primary.includes(region)) {
      score += 4;
    } else if (candidateRegions.secondary.includes(region)) {
      score += 2;
    }
  }

  // Secondary muscle matching
  for (const region of targetRegions.secondary) {
    if (candidateRegions.primary.includes(region)) {
      score += 2;
    } else if (candidateRegions.secondary.includes(region)) {
      score += 1;
    }
  }

  // Movement pattern bonus
  const related = getRelatedMovements(target.movement);
  if (candidate.movement === target.movement) {
    score += 2;
  } else if (related.includes(candidate.movement)) {
    score += 1;
  }

  // Stability / weight-system similarity bonus
  const targetStability = getStabilityClass(target);
  const candidateStability = getStabilityClass(candidate);
  if (targetStability === candidateStability) score += 1.5;
  else if (targetStability === "cable" || candidateStability === "cable") score += 0.5;

  // Same specific load type extra bonus
  if (getLoadType(candidate) === getLoadType({ name: target.name, load: target.load })) {
    score += 0.5;
  }

  // Tier bonus as slight tie breaker
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


function getLocalDateKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function MusclePreviewFigure({
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
  const fill = (region: MuscleRegion) => getMuscleRegionFill(region, primary, secondary);
  const stroke = "#09090b";

  return (
    <svg viewBox="0 0 220 320" className={compact ? "h-28 w-full" : "h-40 w-full"} aria-hidden="true">
      {/* ===== Body silhouette (head, neck, torso, arms, legs) ===== */}
      <g fill="#18181b" stroke="#71717a" strokeWidth="2.5" strokeLinejoin="round">
        <circle cx="110" cy="25" r="14" />
        <path d="M103 37 C105 42 115 42 117 37 L119 49 L101 49 Z" />
        <path d="M80 51 C92 47 128 47 140 51 C149 55 153 64 153 76 C153 94 149 114 145 132 C142 147 139 158 137 168 L83 168 C81 158 78 147 75 132 C71 114 67 94 67 76 C67 64 71 55 80 51 Z" />
        <path d="M67 55 C58 59 51 68 48 80 C45 94 44 110 46 126 C48 142 51 158 55 172 C56 177 60 180 64 179 C68 178 70 174 69 169 C66 156 63 142 62 128 C61 114 61 100 63 88 C65 77 68 67 73 60 Z" />
        <path d="M153 55 C162 59 169 68 172 80 C175 94 176 110 174 126 C172 142 169 158 165 172 C164 177 160 180 156 179 C152 178 150 174 151 169 C154 156 157 142 158 128 C159 114 159 100 157 88 C155 77 152 67 147 60 Z" />
        <path d="M83 170 C80 188 80 206 84 222 C86 231 88 240 89 249 C90 264 91 282 92 300 L104 300 C104 284 104 268 104 252 C104 242 106 232 108 223 C111 207 111 188 109 170 Z" />
        <path d="M137 170 C140 188 140 206 136 222 C134 231 132 240 131 249 C130 264 129 282 128 300 L116 300 C116 284 116 268 116 252 C116 242 114 232 112 223 C109 207 109 188 111 170 Z" />
      </g>

      {side === "front" ? (
        <g stroke={stroke} strokeWidth="2" strokeLinejoin="round">
          <path d="M74 55 C68 58 63 65 61 73 C66 76 73 73 78 66 C77 61 76 57 74 55 Z" fill={fill("frontDelts")} />
          <path d="M146 55 C152 58 157 65 159 73 C154 76 147 73 142 66 C143 61 144 57 146 55 Z" fill={fill("frontDelts")} />
          <path d="M60 62 C54 69 50 78 49 88 C54 89 60 84 63 76 C62 71 61 66 60 62 Z" fill={fill("sideDelts")} />
          <path d="M160 62 C166 69 170 78 171 88 C166 89 160 84 157 76 C158 71 159 66 160 62 Z" fill={fill("sideDelts")} />
          <path d="M85 60 C93 56 103 57 109 63 L109 74 C100 72 91 68 85 64 Z" fill={fill("upperChest")} />
          <path d="M135 60 C127 56 117 57 111 63 L111 74 C120 72 129 68 135 64 Z" fill={fill("upperChest")} />
          <path d="M83 66 C91 64 102 68 109 76 L109 98 C99 102 89 99 83 91 C80 83 81 72 83 66 Z" fill={fill("chest")} />
          <path d="M137 66 C129 64 118 68 111 76 L111 98 C121 102 131 99 137 91 C140 83 139 72 137 66 Z" fill={fill("chest")} />
          <path d="M56 92 C51 100 49 112 51 122 C55 126 61 124 64 116 C65 106 62 97 56 92 Z" fill={fill("biceps")} />
          <path d="M164 92 C169 100 171 112 169 122 C165 126 159 124 156 116 C155 106 158 97 164 92 Z" fill={fill("biceps")} />
          <path d="M97 104 L123 104 C126 120 126 138 122 154 L98 154 C94 138 94 120 97 104 Z" fill={fill("abs")} />
          <path d="M84 106 C88 118 89 134 87 148 C82 140 79 124 80 110 Z" fill={fill("obliques")} />
          <path d="M136 106 C132 118 131 134 133 148 C138 140 141 124 140 110 Z" fill={fill("obliques")} />
          <path d="M85 174 C94 172 103 176 105 186 C106 200 105 216 103 230 C96 232 89 228 86 218 C83 204 83 188 85 174 Z" fill={fill("quads")} />
          <path d="M135 174 C126 172 117 176 115 186 C114 200 115 216 117 230 C124 232 131 228 134 218 C137 204 137 188 135 174 Z" fill={fill("quads")} />
          <path d="M90 246 C95 246 99 252 99 260 C99 270 97 280 96 288 L91 288 C89 276 88 260 90 246 Z" fill={fill("calves")} />
          <path d="M130 246 C125 246 121 252 121 260 C121 270 123 280 124 288 L129 288 C131 276 132 260 130 246 Z" fill={fill("calves")} />
        </g>
      ) : (
        <g stroke={stroke} strokeWidth="2" strokeLinejoin="round">
          <path d="M96 50 C102 46 118 46 124 50 C132 58 142 62 150 64 C144 70 134 70 126 66 C119 62 113 60 110 60 C107 60 101 62 94 66 C86 70 76 70 70 64 C78 62 88 58 96 50 Z" fill={fill("upperBack")} />
          <path d="M92 74 L128 74 C126 86 124 96 121 104 L99 104 C96 96 94 86 92 74 Z" fill={fill("midBack")} />
          <path d="M78 78 C84 84 90 94 93 108 C94 118 93 128 90 136 C82 128 76 114 74 100 C74 92 75 84 78 78 Z" fill={fill("lats")} />
          <path d="M142 78 C136 84 130 94 127 108 C126 118 127 128 130 136 C138 128 144 114 146 100 C146 92 145 84 142 78 Z" fill={fill("lats")} />
          <path d="M101 136 L108 136 C107 148 106 158 105 166 L99 166 C99 156 100 146 101 136 Z" fill={fill("erectors")} />
          <path d="M119 136 L112 136 C113 148 114 158 115 166 L121 166 C121 156 120 146 119 136 Z" fill={fill("erectors")} />
          <path d="M74 55 C68 58 63 65 61 73 C66 76 73 73 78 66 C77 61 76 57 74 55 Z" fill={fill("rearDelts")} />
          <path d="M146 55 C152 58 157 65 159 73 C154 76 147 73 142 66 C143 61 144 57 146 55 Z" fill={fill("rearDelts")} />
          <path d="M60 62 C54 69 50 78 49 88 C54 89 60 84 63 76 C62 71 61 66 60 62 Z" fill={fill("rearDelts")} />
          <path d="M160 62 C166 69 170 78 171 88 C166 89 160 84 157 76 C158 71 159 66 160 62 Z" fill={fill("rearDelts")} />
          <path d="M56 92 C51 100 49 112 51 122 C55 126 61 124 64 116 C65 106 62 97 56 92 Z" fill={fill("triceps")} />
          <path d="M164 92 C169 100 171 112 169 122 C165 126 159 124 156 116 C155 106 158 97 164 92 Z" fill={fill("triceps")} />
          <path d="M86 170 C96 168 106 172 108 180 C107 190 100 196 92 194 C85 190 83 180 86 170 Z" fill={fill("glutes")} />
          <path d="M134 170 C124 168 114 172 112 180 C113 190 120 196 128 194 C135 190 137 180 134 170 Z" fill={fill("glutes")} />
          <path d="M86 198 C94 196 102 200 104 208 C104 220 102 232 100 240 C93 240 87 234 85 224 C84 214 84 206 86 198 Z" fill={fill("hamstrings")} />
          <path d="M134 198 C126 196 118 200 116 208 C116 220 118 232 120 240 C127 240 133 234 135 224 C136 214 136 206 134 198 Z" fill={fill("hamstrings")} />
          <path d="M89 246 C94 244 100 246 102 252 C102 262 100 272 98 280 L92 280 C90 268 88 256 89 246 Z" fill={fill("calves")} />
          <path d="M131 246 C126 244 120 246 118 252 C118 262 120 272 122 280 L128 280 C130 268 132 256 131 246 Z" fill={fill("calves")} />
        </g>
      )}
    </svg>
  );
}



function DayMuscleOverviewCard({ summary }: { summary: MuscleSummary }) {
  return (
    <details className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">Muscle Overview</p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">{summary.hasData ? summary.summaryText : "Show day muscle map"}</p>
        </div>
        <span className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300">Show</span>
      </summary>
      <p className="mt-2 text-[11px] text-zinc-500">{summary.sourceLabel}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-zinc-900 px-2 py-2">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500">Front</p>
          <MusclePreviewFigure side="front" primary={summary.primary} secondary={summary.secondary} compact />
        </div>
        <div className="rounded-xl bg-zinc-900 px-2 py-2">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500">Back</p>
          <MusclePreviewFigure side="back" primary={summary.primary} secondary={summary.secondary} compact />
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
            <span className="font-semibold text-red-400">{primaryLabels.length > 0 ? primaryLabels.join(", ") : "—"}</span>
            {secondaryLabels.length > 0 ? <span> · <span className="text-amber-300">{secondaryLabels.join(", ")}</span></span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDiagram((prev) => !prev)}
          className="shrink-0 rounded-xl bg-zinc-900 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-expanded={showDiagram}
          aria-label={showDiagram ? "Hide muscle diagram" : "Show muscle diagram"}
        >
          {showDiagram ? "Hide Map" : "View Map"}
        </button>
      </div>

      {showDiagram && (
        <div className="mt-3 pt-2 border-t border-zinc-800/80">
          <div className="mb-2 flex items-center justify-end gap-3 text-[10px] text-zinc-500">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" /> Primary</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Secondary</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-zinc-900 px-2 py-2">
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500">Front</p>
              <MusclePreviewFigure side="front" primary={primary} secondary={secondary} compact />
            </div>
            <div className="rounded-xl bg-zinc-900 px-2 py-2">
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500">Back</p>
              <MusclePreviewFigure side="back" primary={primary} secondary={secondary} compact />
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


export default function Page() {
  const initialUiState = sanitizeUiState(readJson<PersistedUiState | null>(UI_STATE_KEY, null));

  const [mode, setMode] = useState<AppMode>(initialUiState.mode);
  const [days, setDays] = useState<3 | 4 | 5>(initialUiState.days);
  const [fiveDayMode, setFiveDayMode] = useState<"twoLegDays" | "oneLegDay">(initialUiState.fiveDayMode);
  const [selectedDay, setSelectedDay] = useState(initialUiState.selectedDay);
  const [logs, setLogs] = useState<LogSet[]>([]);
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
    if (Array.isArray(parsed)) setLogs(parsed);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    writeLocalJson(LATEST_LOGS_KEY, logs);
  }, [logs]);

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

  const recordsMap = useMemo(() => {
    const records: Record<string, ExerciseRecords> = {};

    for (const log of logs) {
      const current = records[log.exerciseName] ?? {};

      const maxWeight = current.maxWeight;
      const bestReps = current.bestReps;
      const bestVolume = current.bestVolume;

      const logVolume = log.weightLbs * log.reps;
      const bestVolumeScore = bestVolume ? bestVolume.weightLbs * bestVolume.reps : -1;

      records[log.exerciseName] = {
        maxWeight:
          !maxWeight ||
          log.weightLbs > maxWeight.weightLbs ||
          (log.weightLbs === maxWeight.weightLbs && log.reps > maxWeight.reps)
            ? log
            : maxWeight,
        bestReps:
          !bestReps ||
          log.reps > bestReps.reps ||
          (log.reps === bestReps.reps && log.weightLbs > bestReps.weightLbs)
            ? log
            : bestReps,
        bestVolume:
          !bestVolume ||
          logVolume > bestVolumeScore ||
          (logVolume === bestVolumeScore && log.weightLbs > bestVolume.weightLbs)
            ? log
            : bestVolume,
      };
    }

    return records;
  }, [logs]);

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

  // Persist computed stats whenever logs change (reuses recordsMap — no duplicate work)
  useEffect(() => {
    writeLocalJson("trainingStatsV2", recordsMap);
  }, [recordsMap]);

  const recentLogs = useMemo(() => logs.filter((item) => isWithinLastDays(item.date, 14)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [logs]);

  const lastSetMap = useMemo(() => {
    const latest: Record<string, Record<number, LogSet>> = {};

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const log of sortedLogs) {
      latest[log.exerciseName] = latest[log.exerciseName] ?? {};

      if (!latest[log.exerciseName][log.setNumber]) {
        latest[log.exerciseName][log.setNumber] = log;
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

  function saveSingleSet(exercise: PlanExercise, setIndex: number) {
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
    const item = exerciseInputs[setIndex];

    if (!item) return;

    const weightLbs = Number(item.weightLbs);
    const reps = Number(item.reps);

    if (!Number.isFinite(weightLbs) || !Number.isFinite(reps) || weightLbs <= 0 || reps <= 0) return;

    if (!item.done) {
      const logSet: LogSet = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weightLbs,
        reps,
        setNumber: setIndex + 1,
        date: new Date().toISOString(),
      };

      setLogs((old) => {
        const without = old.filter(l => l.exerciseName !== logSet.exerciseName || l.setNumber !== logSet.setNumber);
        return [...without, logSet];
      });

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

  function saveAllSets(exercise: PlanExercise) {
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
    const validSets = exerciseInputs
      .map((item, index) => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weightLbs: Number(item.weightLbs),
        reps: Number(item.reps),
        setNumber: index + 1,
        date: new Date().toISOString(),
        alreadySaved: item.done,
      }))
      .filter((item) => Number.isFinite(item.weightLbs) && Number.isFinite(item.reps) && item.weightLbs > 0 && item.reps > 0 && !item.alreadySaved)
      .map(({ alreadySaved, ...item }) => item);

    if (validSets.length > 0) {
      setLogs((old) => {
        const without = old.filter(
          (l) =>
            !(
              l.exerciseName === exercise.name &&
              validSets.some((v) => v.setNumber === l.setNumber)
            )
        );
        return [...without, ...validSets];
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
    const headers = ["Date", "Exercise", "Set", "Weight (lbs)", "Reps"];
    const rows = logs.map((log) => [
      safeCsvCell(new Date(log.date).toISOString().replace("T", " ").slice(0, 19)),
      safeCsvCell(log.exerciseName),
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
      eyebrow: "Temporary",
      title: "History",
      description: "ย้อนหลัง 14 วัน",
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black"><ClipboardList size={18} /> History Log</h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">Temporary record from the last 14 days only.</p>
              </div>
              {recentLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportLogsToCsv}
                    className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    aria-label="Export history to CSV"
                  >
                    <Download size={15} /> Export CSV
                  </button>
                  <button
                    onClick={clearHistory}
                    className="rounded-2xl border border-red-500/40 bg-red-500/10 p-2.5 text-red-300 transition hover:bg-red-500/20"
                    aria-label="Clear history"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {recentLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">No workout log yet. Save working sets first.</div>
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
                              <p className="font-bold leading-tight">{item.exerciseName}</p>
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
                const records = recordsMap[exercise.name] ?? {};
                const pr = records.maxWeight ?? prMap[exercise.name];
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
                            <input
                              inputMode="numeric"
                              value={exercise.sets}
                              onChange={(event) => updateCustomExercise(baseExercise.id, { sets: Math.max(1, Number(event.target.value) || 1) })}
                              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 outline-none"
                            />
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

                    <div className="mb-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500"><Trophy size={14} /> Records</p>
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

                      <div className="mb-2 grid grid-cols-[46px_1fr_1fr_42px] gap-2 text-[11px] font-bold uppercase text-zinc-500">
                        <span>Set</span><span>lbs</span><span>Reps</span><span>Save</span>
                      </div>
                      <div className="space-y-2">
                        {setInputs.map((set, setIndex) => {
                          const latestSet = lastSetMap[exercise.name]?.[setIndex + 1];

                          return (
                            <div key={setIndex} className="grid grid-cols-[46px_1fr_1fr_42px] gap-2">
                              <div className="flex items-center font-black text-zinc-400">{setIndex + 1}</div>
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
                              <input
                                id={`rep-input-${baseExercise.id}-${setIndex}`}
                                inputMode="numeric"
                                value={set.reps}
                                onChange={(event) => updateSet(baseExercise.id, setIndex, "reps", event.target.value, exercise.sets)}
                                onKeyDown={(event) => handleSetInputKeyDown(event, { ...exercise, id: baseExercise.id }, baseExercise.id, setIndex, "reps")}
                                aria-label={`Reps for set ${setIndex + 1}`}
                                className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
                                placeholder={latestSet ? String(latestSet.reps) : "0"}
                              />
                              <button
                                onClick={() => saveSingleSet({ ...exercise, id: baseExercise.id }, setIndex)}
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
                        onClick={() => saveAllSets({ ...exercise, id: baseExercise.id })}
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
                    muscles: [],
                    movement: "",
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
                          <span className="ml-1.5 inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                            {STABILITY_LABELS[getStabilityClass(candidate)]}
                          </span>
                          {isRelatedMovement && (
                            <span className="ml-1.5 inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-black text-emerald-300">
                              Same Movement
                            </span>
                          )}
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