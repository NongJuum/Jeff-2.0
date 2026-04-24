"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Flame,
  Library,
  MessageCircle,
  MinusCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";

type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Abs & Calves";
type AppMode = "preset" | "custom" | "coach";

type Exercise = {
  name: string;
  group: MuscleGroup;
  movement: string;
  muscles: string[];
  tier: "S+" | "S" | "A+" | "A";
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

type LogSet = {
  exerciseId: string;
  exerciseName: string;
  weightLbs: number;
  reps: number;
  setNumber: number;
  date: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: CustomPlan;
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
const CHAT_KEY = "haitCoachChatV1";

const isBrowser = () => typeof window !== "undefined";

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionJson<T>(key: string, value: T) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function writeLocalJson<T>(key: string, value: T) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const exerciseLibrary: Exercise[] = [
  { name: "Bench Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Cable Crossover", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "A" },
  { name: "DB Flye", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "A" },
  { name: "Flat DB Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Incline DB Press", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S" },
  { name: "Incline Machine Bench", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "S" },
  { name: "Incline Smith Machine Bench", group: "Chest", movement: "incline press", muscles: ["Upper chest", "Front delts", "Triceps"], tier: "A" },
  { name: "Machine Chest Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "S+" },
  { name: "Pec Deck", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "S" },
  { name: "Seated Cable Pec Flye", group: "Chest", movement: "chest flye", muscles: ["Chest"], tier: "S" },
  { name: "Smith Machine Floor Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Triceps", "Front delts"], tier: "A" },
  { name: "Smith Machine Press", group: "Chest", movement: "horizontal press", muscles: ["Chest", "Front delts", "Triceps"], tier: "A" },

  { name: "Cable Lat Prayers", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A" },
  { name: "Cable Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S" },
  { name: "Cable Rows", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S" },
  { name: "Chest Supported Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Rear delts"], tier: "S" },
  { name: "Deficit Pendlay Row", group: "Back", movement: "row", muscles: ["Mid back", "Lats", "Erectors"], tier: "A" },
  { name: "Kroc Row", group: "Back", movement: "row", muscles: ["Upper back", "Lats", "Grip"], tier: "A" },
  { name: "Meadows Row", group: "Back", movement: "row", muscles: ["Lats", "Upper back"], tier: "A" },
  { name: "Neutral Grip Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S" },
  { name: "One Arm DB Row", group: "Back", movement: "row", muscles: ["Lats", "Mid back"], tier: "A" },
  { name: "One Arm Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats"], tier: "A" },
  { name: "Weighted Pull Up", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "S" },
  { name: "Wide Grip Cable Row", group: "Back", movement: "row", muscles: ["Upper back", "Rear delts"], tier: "A" },
  { name: "Widegrip Lat Pull Down", group: "Back", movement: "vertical pull", muscles: ["Lats", "Upper back", "Biceps"], tier: "A" },
  { name: "DB Pullovers", group: "Back", movement: "lat isolation", muscles: ["Lats"], tier: "A" },

  { name: "45° Back Extension", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "45° Leg Press", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "45° Leg Press High Foot", group: "Legs", movement: "glute press", muscles: ["Glutes", "Hamstrings", "Quads"], tier: "A" },
  { name: "Barbell Back Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Bulgarian Split Squat", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "S" },
  { name: "Deadlift", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "Front Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Hack Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S+" },
  { name: "Kickbacks", group: "Legs", movement: "glute isolation", muscles: ["Glutes"], tier: "A" },
  { name: "Leg Extension", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A" },
  { name: "Lunges", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Lying Leg Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "A" },
  { name: "Machine Hip Abduction", group: "Legs", movement: "glute isolation", muscles: ["Glutes"], tier: "A" },
  { name: "Machine Hip Thrust", group: "Legs", movement: "glute bridge", muscles: ["Glutes", "Hamstrings"], tier: "S" },
  { name: "Pendulum Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "S" },
  { name: "Reverse Nordic", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A" },
  { name: "Romanian Deadlift RDL", group: "Legs", movement: "hinge", muscles: ["Hamstrings", "Glutes", "Erectors"], tier: "A" },
  { name: "Seated Hamstring Curl", group: "Legs", movement: "hamstring curl", muscles: ["Hamstrings"], tier: "S" },
  { name: "Sissy Squat", group: "Legs", movement: "quad isolation", muscles: ["Quads"], tier: "A" },
  { name: "Smith Machine Lunge FFE", group: "Legs", movement: "single leg", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Smith Machine Squat", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Smith Machine Squat Feet Forward", group: "Legs", movement: "squat press", muscles: ["Quads", "Glutes"], tier: "A" },
  { name: "Step Ups High Box", group: "Legs", movement: "single leg", muscles: ["Glutes", "Quads"], tier: "A" },

  { name: "Atlantis Machine Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S" },
  { name: "Behind Back Cable Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S" },
  { name: "Cable Y Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "A" },
  { name: "Cable Lat Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "S+" },
  { name: "Lean In DB Raise", group: "Shoulders", movement: "lateral raise", muscles: ["Side delts"], tier: "A" },
  { name: "Machine Shoulder Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A" },
  { name: "Reverse Cable Crossover", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "A" },
  { name: "Reverse Pec Deck", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "S" },
  { name: "Rope Face Pull", group: "Shoulders", movement: "rear delt", muscles: ["Rear delts", "Upper back"], tier: "A" },
  { name: "Seated DB Overhead Press", group: "Shoulders", movement: "shoulder press", muscles: ["Front delts", "Side delts", "Triceps"], tier: "A" },

  { name: "1 Arm DB Overhead", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "A" },
  { name: "Barbell Skullcrusher", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A" },
  { name: "DB Preacher Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "DB Skullcrusher", group: "Arms", movement: "triceps extension", muscles: ["Triceps"], tier: "A" },
  { name: "EZ Bar Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Face Away Bayesian Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Incline Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Katana Cable", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "A" },
  { name: "Machine Preacher Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Overhead Cable Ext", group: "Arms", movement: "triceps overhead", muscles: ["Triceps long head"], tier: "S+" },
  { name: "Standing DB Curl", group: "Arms", movement: "biceps curl", muscles: ["Biceps"], tier: "A" },
  { name: "Triceps Pressdown Bar", group: "Arms", movement: "triceps pressdown", muscles: ["Triceps"], tier: "A" },

  { name: "Cable Crunch", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A" },
  { name: "Front Calf Muscle", group: "Abs & Calves", movement: "calves", muscles: ["Calves"], tier: "A" },
  { name: "Machine Abs Crunch", group: "Abs & Calves", movement: "abs", muscles: ["Abs"], tier: "A" },
];

const allGroups: MuscleGroup[] = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Abs & Calves"];

function findExercise(name: string) {
  return exerciseLibrary.find((exercise) => exercise.name === name) ?? exerciseLibrary[0];
}

function getPrescription(exercise: Exercise) {
  const movement = exercise.movement;
  const name = exercise.name.toLowerCase();

  if (exercise.group === "Arms") return { sets: 4, reps: "10 to 15", warmup: false };
  if (exercise.group === "Abs & Calves") return { sets: 3, reps: movement === "calves" ? "8 to 15" : "10 to 15", warmup: false };
  if (movement === "hinge") return { sets: 2, reps: name.includes("deadlift") && !name.includes("romanian") ? "3 to 6" : "6 to 10", warmup: true };
  if (movement.includes("flye") || movement.includes("isolation") || movement.includes("curl") || movement.includes("raise") || movement.includes("rear delt")) {
    return { sets: 3, reps: movement.includes("raise") || movement.includes("rear delt") || movement.includes("glute isolation") ? "12 to 20" : "10 to 15", warmup: false };
  }
  if (movement === "single leg") return { sets: 3, reps: "8 to 12 each leg", warmup: false };
  if (movement === "lat isolation") return { sets: 3, reps: "12 to 15", warmup: false };
  if (movement === "vertical pull" && name.includes("weighted")) return { sets: 3, reps: "5 to 8", warmup: true };
  return { sets: 3, reps: movement.includes("incline") || movement.includes("row") || movement.includes("vertical pull") || movement.includes("glute bridge") ? "8 to 12" : "6 to 10", warmup: true };
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
  };
}

function makeDay(title: string, subtitle: string, focus: MuscleGroup[], exerciseNames: string[]): DayPlan {
  return { id: makeId("day"), title, subtitle, focus, exercises: exerciseNames.map(toPlanExercise) };
}

function makePresetPlans() {
  return {
    3: [
      makeDay("Day 1 Full Body A", "Chest first, then back, quads, delts, arms", ["Chest", "Back", "Legs", "Shoulders", "Arms"], ["Machine Chest Press", "Neutral Grip Lat Pull Down", "Hack Squat", "Cable Lat Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 2 Full Body B", "Posterior chain, row, chest isolation, rear delts", ["Legs", "Back", "Chest", "Shoulders", "Abs & Calves"], ["Romanian Deadlift RDL", "Chest Supported Row", "Seated Cable Pec Flye", "Reverse Pec Deck", "Machine Hip Thrust", "Front Calf Muscle"]),
      makeDay("Day 3 Full Body C", "Quads, vertical pull, incline chest, hamstrings, core", ["Legs", "Back", "Chest", "Shoulders", "Abs & Calves"], ["Leg Extension", "Neutral Grip Lat Pull Down", "Incline DB Press", "Seated Hamstring Curl", "Cable Lat Raise", "Cable Crunch"]),
    ],
    4: [
      makeDay("Day 1 Upper A", "Chest, lats, side delts, biceps, triceps", ["Chest", "Back", "Shoulders", "Arms"], ["Machine Chest Press", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye", "Cable Lat Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 2 Lower A", "Quad bias with hamstrings and calves", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Machine Hip Thrust", "Leg Extension", "Front Calf Muscle"]),
      makeDay("Day 3 Upper B", "Rows, incline press, rear delts, arms", ["Back", "Chest", "Shoulders", "Arms"], ["Chest Supported Row", "Incline DB Press", "Cable Lat Prayers", "Reverse Pec Deck", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 4 Lower B", "Posterior bias with quads and abs", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "Leg Extension", "Machine Hip Thrust", "Seated Hamstring Curl", "Cable Crunch"]),
    ],
    5: [
      makeDay("Day 1 Chest + Back", "Press, pull, flye, row", ["Chest", "Back"], ["Machine Chest Press", "Neutral Grip Lat Pull Down", "Incline DB Press", "Chest Supported Row", "Seated Cable Pec Flye"]),
      makeDay("Day 2 Legs Quad Bias", "Squat pattern first, then accessories", ["Legs", "Abs & Calves"], ["Hack Squat", "Leg Extension", "Machine Hip Thrust", "Front Calf Muscle"]),
      makeDay("Day 3 Shoulders + Arms", "Delts first, then biceps and triceps", ["Shoulders", "Arms"], ["Machine Shoulder Press", "Cable Lat Raise", "Reverse Pec Deck", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 4 Back + Chest", "Row bias with chest support work", ["Back", "Chest"], ["Chest Supported Row", "Cable Lat Prayers", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye", "Incline DB Press"]),
      makeDay("Day 5 Legs Posterior Bias", "Hinge, hamstrings, glutes, abs", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "Seated Hamstring Curl", "Machine Hip Thrust", "Cable Crunch", "Front Calf Muscle"]),
    ],
  } satisfies Record<3 | 4 | 5, DayPlan[]>;
}

function makeFiveDayLegOncePlan() {
  return [
    makeDay("Day 1 Push", "Chest, shoulders, triceps", ["Chest", "Shoulders", "Arms"], ["Machine Chest Press", "Incline DB Press", "Cable Lat Raise", "Overhead Cable Ext"]),
    makeDay("Day 2 Pull", "Back thickness, lats, biceps", ["Back", "Arms"], ["Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Prayers", "Face Away Bayesian Curl"]),
    makeDay("Day 3 Legs Only", "One leg day with quad, hamstring, glute, calf", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Machine Hip Thrust", "Leg Extension", "Front Calf Muscle"]),
    makeDay("Day 4 Upper A", "Chest and back with shoulder accessory", ["Chest", "Back", "Shoulders"], ["Machine Chest Press", "Chest Supported Row", "Seated Cable Pec Flye", "Reverse Pec Deck"]),
    makeDay("Day 5 Upper B + Arms", "Back, incline chest, delts, arms", ["Back", "Chest", "Shoulders", "Arms"], ["Neutral Grip Lat Pull Down", "Incline DB Press", "Cable Lat Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
  ];
}

function recommendForGroups(groups: MuscleGroup[]) {
  const names: string[] = [];
  if (groups.includes("Chest")) names.push("Machine Chest Press", "Incline DB Press", "Seated Cable Pec Flye");
  if (groups.includes("Back")) names.push("Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Prayers");
  if (groups.includes("Legs")) names.push("Hack Squat", "Romanian Deadlift RDL", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust");
  if (groups.includes("Shoulders")) {
    names.push("Cable Lat Raise", "Reverse Pec Deck");
    if (!groups.includes("Chest")) names.unshift("Machine Shoulder Press");
  }
  if (groups.includes("Arms")) names.push("Face Away Bayesian Curl", "Overhead Cable Ext");
  if (groups.includes("Abs & Calves")) names.push("Cable Crunch", "Front Calf Muscle");
  return Array.from(new Set(names)).map(toPlanExercise);
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

function buildCoachPlanFromText(text: string) {
  const lower = text.toLowerCase();
  const dayCount = inferDayCountFromText(text);
  const planName = lower.includes("ลดเวลา") || lower.includes("busy") || lower.includes("short") ? "AI Short Hypertrophy Split" : "AI Recommended Split";

  if (dayCount === 3) {
    return {
      id: makeId("plan"),
      name: planName,
      days: [
        makeDay("AI Full Body A", "Press, pull, squat, delts, arms", ["Chest", "Back", "Legs", "Shoulders", "Arms"], ["Machine Chest Press", "Neutral Grip Lat Pull Down", "Hack Squat", "Cable Lat Raise", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
        makeDay("AI Full Body B", "Hinge, row, chest isolation, glutes, calves", ["Legs", "Back", "Chest", "Abs & Calves"], ["Romanian Deadlift RDL", "Chest Supported Row", "Seated Cable Pec Flye", "Machine Hip Thrust", "Front Calf Muscle"]),
        makeDay("AI Full Body C", "Quad isolation, incline chest, hamstring, rear delt, core", ["Legs", "Chest", "Back", "Shoulders", "Abs & Calves"], ["Leg Extension", "Incline DB Press", "Seated Hamstring Curl", "Reverse Pec Deck", "Cable Crunch"]),
      ],
    } satisfies CustomPlan;
  }

  if (dayCount === 5 && (lower.includes("1 leg") || lower.includes("leg 1") || lower.includes("ขา 1") || lower.includes("ขาวันเดียว"))) {
    return { id: makeId("plan"), name: "AI 5 Day One Leg Split", days: makeFiveDayLegOncePlan().map((day) => ({ ...day, id: makeId("day") })) } satisfies CustomPlan;
  }

  if (dayCount === 5) {
    return { id: makeId("plan"), name: "AI 5 Day Hypertrophy Split", days: makePresetPlans()[5].map((day) => ({ ...day, id: makeId("day") })) } satisfies CustomPlan;
  }

  return {
    id: makeId("plan"),
    name: planName,
    days: makePresetPlans()[4].map((day) => ({ ...day, id: makeId("day") })),
  } satisfies CustomPlan;
}

function summarizePlan(plan: CustomPlan) {
  return `${plan.name}\n${plan.days
    .map((day, index) => {
      const exercises = day.exercises.map((exercise) => `${exercise.name} ${exercise.sets}x${exercise.reps}`).join(", ");
      return `Day ${index + 1}: ${day.title}\n${exercises}`;
    })
    .join("\n\n")}`;
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

function getAlternatives(exercise: PlanExercise) {
  return exerciseLibrary
    .filter((candidate) => candidate.group === exercise.group && candidate.movement === exercise.movement && candidate.name !== exercise.name)
    .slice(0, 6)
    .map((candidate) => candidate.name);
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
        if (muscle.includes("Upper chest") || muscle === "Chest") summary.Chest += exercise.sets;
        if (muscle.includes("Lats") || muscle.includes("Mid back") || muscle.includes("Upper back")) summary.Back += exercise.sets;
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
  if (raw.length === sets) return raw;
  return [...raw.slice(0, sets), ...createDefaultSetInputs(Math.max(0, sets - raw.length))];
}

export default function Page() {
  const initialUiState = readJson<PersistedUiState>(UI_STATE_KEY, {
    mode: "preset",
    days: 4,
    selectedDay: 0,
    fiveDayMode: "twoLegDays",
    showHistory: false,
    showLibrary: false,
    scrollY: 0,
    selectedCustomPlanId: null,
    selectedCustomDay: 0,
  });

  const [mode, setMode] = useState<AppMode>(initialUiState.mode);
  const [days, setDays] = useState<3 | 4 | 5>(initialUiState.days);
  const [fiveDayMode, setFiveDayMode] = useState<"twoLegDays" | "oneLegDay">(initialUiState.fiveDayMode);
  const [selectedDay, setSelectedDay] = useState(initialUiState.selectedDay);
  const [logs, setLogs] = useState<LogSet[]>([]);
  const [inputs, setInputs] = useState<Record<string, SetInput[]>>(() => readJson<Record<string, SetInput[]>>(SET_INPUTS_KEY, {}));
  const [librarySearch, setLibrarySearch] = useState("");
  const [showLibrary, setShowLibrary] = useState(initialUiState.showLibrary);
  const [showHistory, setShowHistory] = useState(initialUiState.showHistory);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>(() => readJson<CustomPlan[]>(CUSTOM_PLANS_KEY, [createStarterCustomPlan()]));
  const [selectedCustomPlanId, setSelectedCustomPlanId] = useState<string | null>(initialUiState.selectedCustomPlanId);
  const [selectedCustomDay, setSelectedCustomDay] = useState(initialUiState.selectedCustomDay);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseGroupFilter, setExerciseGroupFilter] = useState<MuscleGroup | "All">("All");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    readJson<ChatMessage[]>(CHAT_KEY, [
      {
        id: makeId("msg"),
        role: "assistant",
        content:
          "พิมพ์เป้าหมายมาได้เลย เช่น “จัด 4 วัน เน้นอกหลัง แขนไม่เบา” หรือ “ทำ 5 วัน แต่ขาแค่วันเดียว” แล้วกด Save Plan เพื่อบันทึกตารางจากแชทได้ทันที",
      },
    ])
  );
  const [chatInput, setChatInput] = useState("");

  const presetPlans = useMemo(() => makePresetPlans(), []);
  const fiveDayLegOncePlan = useMemo(() => makeFiveDayLegOncePlan(), []);

  const selectedCustomPlan = useMemo(() => {
    if (customPlans.length === 0) return null;
    return customPlans.find((plan) => plan.id === selectedCustomPlanId) ?? customPlans[0];
  }, [customPlans, selectedCustomPlanId]);

  const activePresetPlan = days === 5 && fiveDayMode === "oneLegDay" ? fiveDayLegOncePlan : presetPlans[days];
  const activePlan = mode === "preset" ? activePresetPlan : selectedCustomPlan?.days ?? [];
  const activeDayIndex = mode === "preset" ? selectedDay : selectedCustomDay;
  const day = activePlan[activeDayIndex] ?? activePlan[0];

  useEffect(() => {
    const raw = window.localStorage.getItem("trainingLogsV2");
    if (raw) {
      const parsed = JSON.parse(raw) as LogSet[];
      setLogs(parsed.filter((item) => isWithinLastDays(item.date, 14)));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("trainingLogsV2", JSON.stringify(logs.filter((item) => isWithinLastDays(item.date, 14))));
  }, [logs]);

  useEffect(() => {
    writeSessionJson<PersistedUiState>(UI_STATE_KEY, {
      mode,
      days,
      selectedDay,
      fiveDayMode,
      showHistory,
      showLibrary,
      scrollY: isBrowser() ? window.scrollY : 0,
      selectedCustomPlanId: selectedCustomPlan?.id ?? null,
      selectedCustomDay,
    });
  }, [mode, days, selectedDay, fiveDayMode, showHistory, showLibrary, selectedCustomPlan?.id, selectedCustomDay]);

  useEffect(() => writeSessionJson(SET_INPUTS_KEY, inputs), [inputs]);
  useEffect(() => writeLocalJson(CUSTOM_PLANS_KEY, customPlans), [customPlans]);
  useEffect(() => writeSessionJson(CHAT_KEY, chatMessages), [chatMessages]);

  useEffect(() => {
    const saveScroll = () => {
      const current = readJson<PersistedUiState>(UI_STATE_KEY, {
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
      writeSessionJson<PersistedUiState>(UI_STATE_KEY, { ...current, scrollY: window.scrollY });
    };

    window.addEventListener("pagehide", saveScroll);
    window.addEventListener("visibilitychange", saveScroll);
    window.addEventListener("beforeunload", saveScroll);
    return () => {
      saveScroll();
      window.removeEventListener("pagehide", saveScroll);
      window.removeEventListener("visibilitychange", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
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
    if (mode === "preset" && selectedDay >= activePresetPlan.length) setSelectedDay(0);
    if (mode === "custom" && selectedCustomDay >= activePlan.length) setSelectedCustomDay(0);
  }, [mode, selectedDay, selectedCustomDay, activePresetPlan.length, activePlan.length]);

  const prMap = useMemo(() => {
    const best: Record<string, LogSet> = {};
    for (const log of logs) {
      const current = best[log.exerciseName];
      const score = log.weightLbs * log.reps;
      const currentScore = current ? current.weightLbs * current.reps : -1;
      if (!current || score > currentScore || (score === currentScore && log.weightLbs > current.weightLbs)) best[log.exerciseName] = log;
    }
    return best;
  }, [logs]);

  const recentLogs = useMemo(() => logs.filter((item) => isWithinLastDays(item.date, 14)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [logs]);

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

  function updateSet(exerciseId: string, setIndex: number, field: keyof SetInput, value: string | boolean, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);
      const updated = current.map((set, index) => (index === setIndex ? { ...set, [field]: value } : set));
      return { ...old, [exerciseId]: updated };
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
      }))
      .filter((item) => item.weightLbs > 0 && item.reps > 0);

    if (validSets.length === 0) return;
    setLogs((old) => [...old, ...validSets]);
    setInputs((old) => ({ ...old, [exercise.id]: createDefaultSetInputs(exercise.sets) }));
  }

  function clearHistory() {
    setLogs([]);
    window.localStorage.removeItem("trainingLogsV2");
  }

  function createNewCustomPlan() {
    const plan = createStarterCustomPlan();
    setCustomPlans((old) => [...old, plan]);
    setSelectedCustomPlanId(plan.id);
    setSelectedCustomDay(0);
    setMode("custom");
  }

  function savePlanFromChat(plan: CustomPlan) {
    const savedPlan = {
      ...plan,
      id: makeId("plan"),
      name: plan.name,
      days: plan.days.map((dayItem) => ({
        ...dayItem,
        id: makeId("day"),
        exercises: dayItem.exercises.map((exercise) => ({ ...exercise, id: makeId("ex") })),
      })),
    };

    setCustomPlans((old) => [...old, savedPlan]);
    setSelectedCustomPlanId(savedPlan.id);
    setSelectedCustomDay(0);
    setMode("custom");

    const confirmation: ChatMessage = {
      id: makeId("msg"),
      role: "assistant",
      content: `Saved: ${savedPlan.name}. เปิดไปที่ Custom แล้วเลือกตารางนี้ได้เลย`,
    };
    setChatMessages((old) => [...old, confirmation]);
  }

  function sendCoachMessage() {
    const text = chatInput.trim();
    if (!text) return;

    const userMessage: ChatMessage = { id: makeId("msg"), role: "user", content: text };
    const generatedPlan = buildCoachPlanFromText(text);
    const targetGroups = inferGroupsFromText(text);
    const response: ChatMessage = {
      id: makeId("msg"),
      role: "assistant",
      content:
        `จัดให้แล้วจากเป้าหมาย: ${targetGroups.join(", ")}\n\n${summarizePlan(generatedPlan)}\n\nกด Save Plan เพื่อบันทึกตารางนี้เข้า Custom ได้เลย`,
      plan: generatedPlan,
    };

    setChatMessages((old) => [...old, userMessage, response]);
    setChatInput("");
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
      updateCustomExercise(currentExercise.id, { name: next.name, group: next.group, movement: next.movement, muscles: next.muscles, reps: next.reps, sets: next.sets, warmup: next.warmup });
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-28 text-zinc-50">
      <section className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/hait-logo.png" alt="HA IT logo" className="h-9 w-9 rounded-xl bg-white object-contain p-1" />
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
                <Dumbbell size={14} /> HA IT
              </p>
              <h1 className="text-lg font-black leading-tight">Workout Tracker</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowHistory((value) => !value)} className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold">
              History
            </button>
            <button onClick={() => setShowLibrary((value) => !value)} className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold">
              Library
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-[1fr_0.75fr]">
          <div>
            <p className="text-sm text-zinc-400">Preset + Custom + AI Coach</p>
            <h2 className="mt-1 text-2xl font-black">Build your own split</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Use preset splits, custom builder, or chat with HA IT Coach to generate a plan and save it directly.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-zinc-950 p-2">
              {[
                ["preset", "Preset"],
                ["custom", "Custom"],
                ["coach", "Coach"],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setMode(key as AppMode)} className={`rounded-2xl py-3 text-sm font-black ${mode === key ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"}`}>
                  {label}
                </button>
              ))}
            </div>

            {mode === "preset" ? (
              <div className="rounded-2xl bg-zinc-950 p-3">
                <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Training days</label>
                <div className="relative">
                  <select value={days} onChange={(event) => { setDays(Number(event.target.value) as 3 | 4 | 5); setSelectedDay(0); }} className="w-full appearance-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base font-black outline-none">
                    <option value={3}>3 days Full Body</option>
                    <option value={4}>4 days Upper / Lower</option>
                    <option value={5}>5 days Split</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-4 text-zinc-400" size={20} />
                </div>
              </div>
            ) : mode === "custom" ? (
              <div className="rounded-2xl bg-zinc-950 p-3">
                <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Custom plan</label>
                <div className="relative">
                  <select value={selectedCustomPlan?.id ?? ""} onChange={(event) => { setSelectedCustomPlanId(event.target.value); setSelectedCustomDay(0); }} className="w-full appearance-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base font-black outline-none">
                    {customPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-4 text-zinc-400" size={20} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-zinc-950 p-3">
                <p className="text-xs font-bold uppercase text-emerald-300">HA IT Coach</p>
                <p className="mt-1 text-sm text-zinc-400">Generate a plan from chat, then save to Custom.</p>
              </div>
            )}
          </div>
        </div>

        {mode === "coach" && (
          <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400 p-3 text-zinc-950">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black">HA IT Coach</h3>
                <p className="text-sm text-zinc-400">Rule-based AI coach inside the app. It can generate and save plans without an API key.</p>
              </div>
            </div>

            <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-3xl bg-zinc-950 p-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`rounded-3xl p-3 ${message.role === "user" ? "ml-8 bg-emerald-400 text-zinc-950" : "mr-8 bg-zinc-900 text-zinc-100"}`}>
                  <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase opacity-70">
                    {message.role === "assistant" ? <Bot size={14} /> : <MessageCircle size={14} />}
                    {message.role === "assistant" ? "HA IT Coach" : "You"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  {message.plan && (
                    <button onClick={() => savePlanFromChat(message.plan!)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-zinc-950">
                      <Save size={16} /> Save Plan to Custom
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  "จัด 4 วัน เน้น hypertrophy แขนไม่เบา",
                  "ทำ 5 วัน แต่ขาแค่วันเดียว",
                  "จัด 3 วัน full body เล่นไม่เกิน 1 ชั่วโมง",
                ].map((prompt) => (
                  <button key={prompt} onClick={() => setChatInput(prompt)} className="min-w-fit rounded-full bg-zinc-950 px-3 py-2 text-xs font-bold text-zinc-300">
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="พิมพ์เป้าหมาย เช่น จัด 4 วัน เน้นอกหลัง แขนไม่เบา" className="min-h-[56px] flex-1 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
                <button onClick={sendCoachMessage} className="rounded-2xl bg-emerald-400 p-4 text-zinc-950">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "preset" && days === 5 && (
          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-zinc-500">5 day split type</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setFiveDayMode("twoLegDays"); setSelectedDay(0); }} className={`rounded-2xl px-3 py-3 text-sm font-black ${fiveDayMode === "twoLegDays" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}>2 Leg Days</button>
              <button onClick={() => { setFiveDayMode("oneLegDay"); setSelectedDay(0); }} className={`rounded-2xl px-3 py-3 text-sm font-black ${fiveDayMode === "oneLegDay" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}>1 Leg Day</button>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black"><ClipboardList size={18} /> History Log</h3>
                <p className="mt-1 text-sm text-zinc-400">Temporary record from the last 14 days only.</p>
              </div>
              {recentLogs.length > 0 && <button onClick={clearHistory} className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300" aria-label="Clear history"><Trash2 size={18} /></button>}
            </div>

            {recentLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">No workout log yet. Save working sets first.</div>
            ) : (
              <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                {Object.entries(recentLogsByDate).map(([date, items]) => (
                  <div key={date} className="rounded-2xl bg-zinc-950 p-3">
                    <h4 className="mb-3 text-sm font-black text-emerald-300">{date}</h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={`${item.date}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold leading-tight">{item.exerciseName}</p>
                              <p className="mt-1 text-xs text-zinc-500">{formatShortDate(item.date)} · Set {item.setNumber}</p>
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

        {showLibrary && (
          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2">
              <Search size={18} className="text-zinc-500" />
              <input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search exercise, movement or muscle" className="w-full bg-transparent py-2 outline-none" />
            </div>

            <div className="max-h-96 overflow-y-auto pr-1">
              {allGroups.map((group) => {
                const names = filteredLibrary.filter((item) => item.group === group);
                if (names.length === 0) return null;
                return (
                  <div key={group} className="mb-5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-300"><Library size={14} /> {group}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {names.map((item) => (
                        <a key={item.name} href={youtubeSearch(`${item.name} proper form`)} target="_blank" rel="noreferrer" className="rounded-2xl bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
                          <span className="font-bold">{item.name}</span>
                          <span className="ml-2 text-xs text-zinc-500">{item.movement}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mode === "custom" && selectedCustomPlan && (
          <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="mb-2 block text-xs font-bold uppercase text-emerald-300">Custom builder</label>
                <input value={selectedCustomPlan.name} onChange={(event) => updateCustomPlanName(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-black outline-none" />
              </div>
              <button onClick={deleteCustomPlan} className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300" aria-label="Delete plan"><Trash2 size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={createNewCustomPlan} className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-3 py-3 text-sm font-black text-zinc-300"><Plus size={16} /> New Plan</button>
              <button onClick={addCustomDay} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-3 py-3 text-sm font-black text-zinc-950"><Plus size={16} /> Add Day</button>
            </div>
          </div>
        )}

        {mode !== "coach" && (
          <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2">
            {activePlan.map((item, index) => (
              <button key={item.id} onClick={() => (mode === "preset" ? setSelectedDay(index) : setSelectedCustomDay(index))} className={`min-w-[180px] snap-start rounded-3xl px-4 py-3 text-left transition ${activeDayIndex === index ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"}`}>
                <CalendarDays size={16} />
                <p className="mt-2 font-black">{item.title}</p>
                <p className="mt-1 text-xs opacity-80">{item.subtitle}</p>
              </button>
            ))}
          </div>
        )}

        {mode !== "coach" && day && (
          <>
            <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
              {mode === "custom" ? (
                <div className="mb-4 grid gap-3">
                  <div className="flex items-center gap-2">
                    <Pencil size={16} className="text-zinc-500" />
                    <input value={day.title} onChange={(event) => updateCustomDay(day.id, (current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-xl font-black outline-none" />
                    <button onClick={() => deleteCustomDay(day.id)} className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300" aria-label="Delete day"><MinusCircle size={18} /></button>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase text-zinc-500">Target muscles</p>
                    <div className="flex flex-wrap gap-2">
                      {allGroups.map((group) => (
                        <button key={group} onClick={() => toggleDayFocus(group)} className={`rounded-full px-3 py-2 text-xs font-bold ${day.focus.includes(group) ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                          {group}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={recommendIntoCurrentDay} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 text-base font-black text-zinc-950">
                    <Sparkles size={18} /> Recommend from Jeff-inspired order
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black">{day.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{day.subtitle}</p>
                </>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {day.focus.map((focus) => (
                  <span key={focus} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">{focus}</span>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black">Weekly hard set check</h3>
                  <p className="mt-1 text-xs text-zinc-400">Direct planned sets from this split. Presses/pulls still add extra indirect arm work.</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">Volume</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {weeklyVolumeSummary.map(([muscle, sets]) => (
                  <div key={muscle} className="rounded-2xl bg-zinc-950 p-3">
                    <p className="text-xs text-zinc-500">{muscle}</p>
                    <p className="mt-1 text-lg font-black">{sets} sets / week</p>
                  </div>
                ))}
              </div>
            </div>

            {mode === "custom" && (
              <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black"><Plus size={16} /> Add exercise</h3>
                <div className="grid gap-2 sm:grid-cols-[0.8fr_1fr]">
                  <select value={exerciseGroupFilter} onChange={(event) => setExerciseGroupFilter(event.target.value as MuscleGroup | "All")} className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold outline-none">
                    <option value="All">All groups</option>
                    {allGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                  <div className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                    <Search size={16} className="text-zinc-500" />
                    <input value={exerciseSearch} onChange={(event) => setExerciseSearch(event.target.value)} placeholder="Search exercise" className="w-full bg-transparent py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {filteredExercisePicker.map((item) => (
                    <button key={item.name} onClick={() => addExerciseToCurrentDay(item.name)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-zinc-950 px-3 py-3 text-left">
                      <span>
                        <span className="block font-bold">{item.name}</span>
                        <span className="text-xs text-zinc-500">{item.group} · {item.movement} · {item.tier}</span>
                      </span>
                      <Plus size={18} className="text-emerald-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-4">
              {day.exercises.map((exercise, index) => {
                const pr = prMap[exercise.name];
                const warmups = exercise.warmup ? getWarmupSets(pr?.weightLbs) : [];
                const rawSetInputs = inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets);
                const setInputs = normalizeSetInputs(rawSetInputs, exercise.sets);
                const alternatives = getAlternatives(exercise);

                return (
                  <article key={exercise.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-400">#{index + 1}</span>
                          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{exercise.group}</span>
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">{exercise.movement}</span>
                          {exercise.warmup ? <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-300"><Flame className="mr-1 inline" size={12} /> Warmup</span> : <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">No warmup</span>}
                        </div>

                        <h3 className="mt-3 text-2xl font-black leading-tight">{exercise.name}</h3>
                        <p className="mt-1 text-sm text-zinc-400">Target: {exercise.sets} hard working sets × {exercise.reps} reps</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a href={youtubeSearch(`${exercise.name} proper form`)} target="_blank" rel="noreferrer" className="rounded-2xl bg-zinc-50 p-3 text-zinc-950" aria-label="Watch demo"><PlayCircle size={22} /></a>
                        {mode === "custom" && <button onClick={() => removeExerciseFromCurrentDay(exercise.id)} className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300" aria-label="Remove exercise"><Trash2 size={18} /></button>}
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {exercise.muscles.map((muscle) => <span key={muscle} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{muscle}</span>)}
                    </div>

                    {mode === "custom" && (
                      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-950 p-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-zinc-500">Sets</label>
                          <input inputMode="numeric" value={exercise.sets} onChange={(event) => updateCustomExercise(exercise.id, { sets: Math.max(1, Number(event.target.value) || 1) })} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-zinc-500">Reps</label>
                          <input value={exercise.reps} onChange={(event) => updateCustomExercise(exercise.id, { reps: event.target.value })} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 outline-none" />
                        </div>
                        <button onClick={() => updateCustomExercise(exercise.id, { warmup: !exercise.warmup })} className={`mt-5 rounded-2xl px-2 py-3 text-xs font-black ${exercise.warmup ? "bg-orange-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>
                          Warmup
                        </button>
                      </div>
                    )}

                    {alternatives.length > 0 && (
                      <div className="mb-4 rounded-2xl bg-zinc-950 p-3">
                        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500"><RotateCcw size={14} /> Same pattern substitutions</label>
                        <select value={exercise.name} onChange={(event) => { if (mode === "custom") substituteExercise(exercise, event.target.value); }} disabled={mode !== "custom"} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base font-bold outline-none disabled:opacity-60">
                          <option>{exercise.name}</option>
                          {alternatives.map((name) => <option key={name}>{name}</option>)}
                        </select>
                        {mode !== "custom" && <p className="mt-2 text-xs text-zinc-500">Substitution editing is available in Custom mode.</p>}
                      </div>
                    )}

                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500"><Trophy size={14} /> Current PR</p>
                        <p className="mt-2 text-2xl font-black text-emerald-300">{pr ? `${pr.weightLbs} lbs × ${pr.reps}` : "No record"}</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500"><BarChart3 size={14} /> Warmup from PR</p>
                        {exercise.warmup ? (
                          warmups.length > 0 ? (
                            <div className="mt-2 space-y-1 text-sm">
                              {warmups.map((item) => <p key={item.label}><span className="text-zinc-500">{item.label}:</span> <span className="font-bold">{item.weight} lbs</span> <span className="text-zinc-400">× {item.reps}</span></p>)}
                            </div>
                          ) : <p className="mt-2 text-sm text-zinc-400">Save a PR first</p>
                        ) : <p className="mt-2 text-sm text-zinc-400">Skip specific warmup</p>}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-950 p-3">
                      <div className="mb-3 grid grid-cols-[46px_1fr_1fr_42px] gap-2 text-xs font-bold uppercase text-zinc-500">
                        <span>Set</span><span>lbs</span><span>Reps</span><span>Done</span>
                      </div>
                      <div className="space-y-2">
                        {setInputs.map((set, setIndex) => (
                          <div key={setIndex} className="grid grid-cols-[46px_1fr_1fr_42px] gap-2">
                            <div className="flex items-center font-black text-zinc-400">{setIndex + 1}</div>
                            <input inputMode="decimal" value={set.weightLbs} onChange={(event) => updateSet(exercise.id, setIndex, "weightLbs", event.target.value, exercise.sets)} className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400" placeholder={pr?.weightLbs ? String(pr.weightLbs) : "135"} />
                            <input inputMode="numeric" value={set.reps} onChange={(event) => updateSet(exercise.id, setIndex, "reps", event.target.value, exercise.sets)} className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400" placeholder="8" />
                            <button onClick={() => updateSet(exercise.id, setIndex, "done", !set.done, exercise.sets)} className={`rounded-2xl border ${set.done ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-500"}`}>
                              <Check size={18} className="mx-auto" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => saveAllSets(exercise)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 text-base font-black text-zinc-950 active:scale-[0.99]">
                        <Save size={18} /> Save all working sets
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2">
          {[
            ["preset", "Preset"],
            ["custom", "Custom"],
            ["coach", "Coach"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setMode(key as AppMode)} className={`rounded-2xl py-3 text-sm font-black ${mode === key ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"}`}>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
