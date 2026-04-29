"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Flame,
  Library,  MinusCircle,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Search,  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";

type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Abs & Calves";
type AppMode = "today" | "preset" | "custom" | "history" | "library";

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

type RestTimerState = {
  exerciseId: string | null;
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
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

function persistSetInputsNow(nextInputs: Record<string, SetInput[]>) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(SET_INPUTS_KEY, JSON.stringify(nextInputs));
  } catch {
    // Ignore storage errors.
  }
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

  const individual: Record<string, { sets: number; reps: string; warmup: boolean }> = {
    "machine chest press": { sets: 3, reps: "6 to 10", warmup: true },
    "bench press": { sets: 3, reps: "5 to 8", warmup: true },
    "flat db press": { sets: 3, reps: "8 to 12", warmup: true },
    "incline db press": { sets: 3, reps: "8 to 12", warmup: true },
    "incline machine bench": { sets: 3, reps: "8 to 12", warmup: true },
    "incline smith machine bench": { sets: 3, reps: "8 to 12", warmup: true },
    "smith machine press": { sets: 3, reps: "6 to 10", warmup: true },
    "smith machine floor press": { sets: 3, reps: "6 to 10", warmup: true },

    "pec deck": { sets: 4, reps: "10 to 15", warmup: false },
    "seated cable pec flye": { sets: 4, reps: "10 to 15", warmup: false },
    "cable crossover": { sets: 3, reps: "12 to 20", warmup: false },
    "db flye": { sets: 3, reps: "10 to 15", warmup: false },

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

    "face away bayesian curl": { sets: 4, reps: "10 to 15", warmup: false },
    "incline curl": { sets: 3, reps: "10 to 15", warmup: false },
    "machine preacher curl": { sets: 3, reps: "10 to 15", warmup: false },
    "db preacher curl": { sets: 3, reps: "10 to 15", warmup: false },
    "ez bar curl": { sets: 3, reps: "8 to 12", warmup: false },
    "standing db curl": { sets: 3, reps: "10 to 15", warmup: false },

    "overhead cable ext": { sets: 4, reps: "10 to 15", warmup: false },
    "katana cable": { sets: 3, reps: "10 to 15", warmup: false },
    "1 arm db overhead": { sets: 3, reps: "10 to 15", warmup: false },
    "barbell skullcrusher": { sets: 3, reps: "8 to 12", warmup: false },
    "db skullcrusher": { sets: 3, reps: "10 to 15", warmup: false },
    "triceps pressdown bar": { sets: 3, reps: "10 to 15", warmup: false },

    "cable crunch": { sets: 3, reps: "10 to 15", warmup: false },
    "machine abs crunch": { sets: 3, reps: "10 to 15", warmup: false },
    "front calf muscle": { sets: 4, reps: "8 to 15", warmup: false },
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
      makeDay("Day 3 Full Body C", "Leg press, chest isolation, row, glutes, delts, calves or abs", ["Legs", "Chest", "Back", "Shoulders", "Abs & Calves"], ["45° Leg Press", "Seated Cable Pec Flye", "Cable Row", "Machine Hip Thrust", "Cable Lat Raise", "Cable Crunch"]),
    ],
    4: [
      makeDay("Day 1 Upper A", "Press, row, pulldown, chest isolation, delts, triceps", ["Chest", "Back", "Shoulders", "Arms"], ["Machine Chest Press", "Chest Supported Row", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye", "Cable Lat Raise", "Overhead Cable Ext"]),
      makeDay("Day 2 Lower A", "Quad bias with hamstrings, glutes, calves", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Machine Hip Thrust", "Leg Extension", "Front Calf Muscle"]),
      makeDay("Day 3 Upper B", "Incline press, row, lat isolation, rear delts, biceps, triceps", ["Chest", "Back", "Shoulders", "Arms"], ["Incline DB Press", "Cable Row", "Cable Lat Prayers", "Reverse Pec Deck", "Face Away Bayesian Curl", "Triceps Pressdown Bar"]),
      makeDay("Day 4 Lower B", "Posterior bias with quads, abs, calves", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press", "Lying Leg Curl", "Bulgarian Split Squat", "Cable Crunch", "Front Calf Muscle"]),
    ],
    5: [
      makeDay("Day 1 Chest + Back A", "Horizontal press, row, incline press, vertical pull, flye", ["Chest", "Back"], ["Machine Chest Press", "Chest Supported Row", "Incline DB Press", "Neutral Grip Lat Pull Down", "Seated Cable Pec Flye"]),
      makeDay("Day 2 Legs Quad Bias", "Squat press, leg curl, quad isolation, glute, calf", ["Legs", "Abs & Calves"], ["Hack Squat", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust", "Front Calf Muscle"]),
      makeDay("Day 3 Shoulders + Arms", "Shoulder press, side delt, rear delt, biceps, triceps", ["Shoulders", "Arms"], ["Machine Shoulder Press", "Cable Lat Raise", "Reverse Pec Deck", "Face Away Bayesian Curl", "Overhead Cable Ext"]),
      makeDay("Day 4 Chest + Back B", "Row bias, lat isolation, chest press, flye, rear delt", ["Back", "Chest", "Shoulders"], ["Cable Row", "Cable Lat Prayers", "Incline Machine Bench", "Pec Deck", "Rope Face Pull"]),
      makeDay("Day 5 Legs Posterior Bias", "Hinge, squat press, hamstring curl, glute, abs or calves", ["Legs", "Abs & Calves"], ["Romanian Deadlift RDL", "45° Leg Press High Foot", "Lying Leg Curl", "Machine Hip Thrust", "Cable Crunch", "Front Calf Muscle"]),
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

  if (groups.includes("Chest")) names.push("Machine Chest Press", "Incline DB Press", "Seated Cable Pec Flye");
  if (groups.includes("Back")) names.push("Chest Supported Row", "Neutral Grip Lat Pull Down", "Cable Lat Prayers");
  if (groups.includes("Legs")) names.push("Hack Squat", "Romanian Deadlift RDL", "Seated Hamstring Curl", "Leg Extension", "Machine Hip Thrust");
  if (groups.includes("Shoulders")) {
    if (!groups.includes("Chest")) names.push("Machine Shoulder Press");
    names.push("Cable Lat Raise", "Reverse Pec Deck");
  }
  if (groups.includes("Arms")) names.push("Face Away Bayesian Curl", "Overhead Cable Ext");
  if (groups.includes("Abs & Calves")) names.push("Cable Crunch", "Front Calf Muscle");

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
    name.includes("pendulum");

  if (movement === "hinge" || name.includes("deadlift") || name.includes("rdl")) {
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
    return 90;
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

function createEmptySetInput(): SetInput {
  return {
    weightLbs: "",
    reps: "",
    done: false,
  };
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
  if (["horizontal press", "incline press"].includes(movement)) return ["horizontal press", "incline press"];
  if (["chest flye"].includes(movement)) return ["chest flye"];
  if (["row"].includes(movement)) return ["row"];
  if (["vertical pull", "lat isolation"].includes(movement)) return ["vertical pull", "lat isolation"];
  if (["squat press", "quad isolation"].includes(movement)) return ["squat press", "quad isolation", "single leg"];
  if (["hinge", "hamstring curl"].includes(movement)) return ["hinge", "hamstring curl"];
  if (["glute bridge", "glute isolation", "glute press"].includes(movement)) return ["glute bridge", "glute isolation", "glute press", "single leg"];
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
  const primary = exerciseLibrary.filter(
    (candidate) =>
      candidate.group === exercise.group &&
      related.includes(candidate.movement) &&
      candidate.name !== exercise.name
  );

  const fallback = exerciseLibrary.filter(
    (candidate) => candidate.group === exercise.group && candidate.name !== exercise.name
  );

  return Array.from(new Set([...primary, ...fallback].map((candidate) => candidate.name))).slice(0, 8);
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
  if (raw.length >= sets) return raw;
  return [...raw, ...createDefaultSetInputs(Math.max(0, sets - raw.length))];
}



type MuscleRegion =
  | "chest"
  | "upperChest"
  | "frontDelts"
  | "sideDelts"
  | "rearDelts"
  | "biceps"
  | "triceps"
  | "lats"
  | "midBack"
  | "upperBack"
  | "erectors"
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
  chest: "Chest",
  upperChest: "Upper chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  lats: "Lats",
  midBack: "Mid back",
  upperBack: "Upper back",
  erectors: "Erectors",
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
  "Front delts": ["frontDelts"],
  "Side delts": ["sideDelts"],
  "Rear delts": ["rearDelts"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  "Triceps long head": ["triceps"],
  Lats: ["lats"],
  "Mid back": ["midBack"],
  "Upper back": ["upperBack"],
  Erectors: ["erectors"],
  Abs: ["abs"],
  Glutes: ["glutes"],
  Quads: ["quads"],
  Hamstrings: ["hamstrings"],
  Calves: ["calves"],
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

function getMuscleRegionFill(region: MuscleRegion, primary: MuscleRegion[], secondary: MuscleRegion[]) {
  if (primary.includes(region)) return "#dc2626";
  if (secondary.includes(region)) return "#fbbf24";
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
      <g>
        <rect x="82" y="12" width="56" height="52" rx="24" fill="#18181b" stroke="#a1a1aa" strokeWidth="3" />
        <path d="M72 68 C84 58 136 58 148 68 C164 84 170 122 160 156 C151 188 142 224 134 244 L86 244 C78 224 69 188 60 156 C50 122 56 84 72 68 Z" fill="#18181b" stroke="#a1a1aa" strokeWidth="3" />
        <path d="M66 82 C42 96 31 122 26 160" fill="none" stroke="#a1a1aa" strokeWidth="7" strokeLinecap="round" />
        <path d="M154 82 C178 96 189 122 194 160" fill="none" stroke="#a1a1aa" strokeWidth="7" strokeLinecap="round" />
      </g>

      {side === "front" ? (
        <>
          <path d="M84 78 C92 70 104 69 110 78 L110 103 C100 111 87 109 79 99 C78 90 79 83 84 78 Z" fill={fill("chest")} stroke={stroke} strokeWidth="3" />
          <path d="M136 78 C128 70 116 69 110 78 L110 103 C120 111 133 109 141 99 C142 90 141 83 136 78 Z" fill={fill("chest")} stroke={stroke} strokeWidth="3" />
          <path d="M90 70 C98 65 122 65 130 70 C127 77 119 81 110 81 C101 81 93 77 90 70 Z" fill={fill("upperChest")} stroke={stroke} strokeWidth="3" />
          <path d="M67 74 C55 79 48 91 49 105 C62 107 75 99 80 87 C78 79 74 75 67 74 Z" fill={fill("frontDelts")} stroke={stroke} strokeWidth="3" />
          <path d="M153 74 C165 79 172 91 171 105 C158 107 145 99 140 87 C142 79 146 75 153 74 Z" fill={fill("frontDelts")} stroke={stroke} strokeWidth="3" />
          <path d="M50 102 C41 113 39 133 46 145 C57 140 62 122 57 106 Z" fill={fill("biceps")} stroke={stroke} strokeWidth="3" />
          <path d="M170 102 C179 113 181 133 174 145 C163 140 158 122 163 106 Z" fill={fill("biceps")} stroke={stroke} strokeWidth="3" />
          <path d="M96 108 L124 108 C130 125 128 145 119 160 L101 160 C92 145 90 125 96 108 Z" fill={fill("abs")} stroke={stroke} strokeWidth="3" />
          <path d="M78 108 C86 122 88 144 84 160 C75 150 68 128 70 112 Z" fill={fill("obliques")} stroke={stroke} strokeWidth="3" />
          <path d="M142 108 C134 122 132 144 136 160 C145 150 152 128 150 112 Z" fill={fill("obliques")} stroke={stroke} strokeWidth="3" />
          <path d="M80 166 C94 166 104 174 105 190 L101 238 C88 235 78 218 75 197 C73 184 74 174 80 166 Z" fill={fill("quads")} stroke={stroke} strokeWidth="3" />
          <path d="M140 166 C126 166 116 174 115 190 L119 238 C132 235 142 218 145 197 C147 184 146 174 140 166 Z" fill={fill("quads")} stroke={stroke} strokeWidth="3" />
          <path d="M84 218 C94 219 101 228 101 244 L82 244 C79 235 80 225 84 218 Z" fill={fill("calves")} stroke={stroke} strokeWidth="3" />
          <path d="M136 218 C126 219 119 228 119 244 L138 244 C141 235 140 225 136 218 Z" fill={fill("calves")} stroke={stroke} strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M82 72 C94 62 126 62 138 72 C145 86 148 103 145 119 L75 119 C72 103 75 86 82 72 Z" fill={fill("upperBack")} stroke={stroke} strokeWidth="3" />
          <path d="M76 114 C87 120 96 135 99 160 L82 168 C72 149 65 127 67 112 Z" fill={fill("lats")} stroke={stroke} strokeWidth="3" />
          <path d="M144 114 C133 120 124 135 121 160 L138 168 C148 149 155 127 153 112 Z" fill={fill("lats")} stroke={stroke} strokeWidth="3" />
          <path d="M96 122 L124 122 L119 158 L101 158 Z" fill={fill("midBack")} stroke={stroke} strokeWidth="3" />
          <path d="M103 156 L109 156 L107 190 L98 190 Z" fill={fill("erectors")} stroke={stroke} strokeWidth="3" />
          <path d="M111 156 L117 156 L122 190 L113 190 Z" fill={fill("erectors")} stroke={stroke} strokeWidth="3" />
          <path d="M67 74 C55 79 48 91 49 105 C62 107 75 99 80 87 C78 79 74 75 67 74 Z" fill={fill("rearDelts")} stroke={stroke} strokeWidth="3" />
          <path d="M153 74 C165 79 172 91 171 105 C158 107 145 99 140 87 C142 79 146 75 153 74 Z" fill={fill("rearDelts")} stroke={stroke} strokeWidth="3" />
          <path d="M50 102 C41 113 39 133 46 145 C57 140 62 122 57 106 Z" fill={fill("triceps")} stroke={stroke} strokeWidth="3" />
          <path d="M170 102 C179 113 181 133 174 145 C163 140 158 122 163 106 Z" fill={fill("triceps")} stroke={stroke} strokeWidth="3" />
          <path d="M86 162 C98 158 109 166 110 178 C105 191 93 198 80 192 C73 179 76 168 86 162 Z" fill={fill("glutes")} stroke={stroke} strokeWidth="3" />
          <path d="M134 162 C122 158 111 166 110 178 C115 191 127 198 140 192 C147 179 144 168 134 162 Z" fill={fill("glutes")} stroke={stroke} strokeWidth="3" />
          <path d="M82 190 C94 190 102 198 102 214 L98 244 L82 244 C76 225 74 203 82 190 Z" fill={fill("hamstrings")} stroke={stroke} strokeWidth="3" />
          <path d="M138 190 C126 190 118 198 118 214 L122 244 L138 244 C144 225 146 203 138 190 Z" fill={fill("hamstrings")} stroke={stroke} strokeWidth="3" />
          <path d="M84 220 C94 221 100 229 99 244 L82 244 C79 235 80 225 84 220 Z" fill={fill("calves")} stroke={stroke} strokeWidth="3" />
          <path d="M136 220 C126 221 120 229 121 244 L138 244 C141 235 140 225 136 220 Z" fill={fill("calves")} stroke={stroke} strokeWidth="3" />
        </>
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
  const { primary, secondary } = getExercisePreviewRegions(exercise);
  const primaryLabels = primary.map((item) => MUSCLE_REGION_LABELS[item]);
  const secondaryLabels = secondary.map((item) => MUSCLE_REGION_LABELS[item]);

  return (
    <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-zinc-500">Muscle</p>
          <p className="mt-1 text-xs text-zinc-500">
            <span className="text-red-400">{primaryLabels.length > 0 ? primaryLabels.join(", ") : "—"}</span>
            {secondaryLabels.length > 0 ? <span> · <span className="text-amber-300">{secondaryLabels.join(", ")}</span></span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" /> P</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> S</span>
        </div>
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
  );
}


export default function Page() {
  const initialUiState = readJson<PersistedUiState>(UI_STATE_KEY, {
    mode: "today",
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
  const [restTimer, setRestTimer] = useState<RestTimerState>({ exerciseId: null, secondsLeft: 0, totalSeconds: 0, running: false });
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
  useEffect(() => writeSessionJson(SUBSTITUTE_KEY, substituteMap), [substituteMap]);

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

  useEffect(() => {
    if (!restTimer.running || restTimer.secondsLeft <= 0) return;

    const intervalId = window.setInterval(() => {
      setRestTimer((current) => {
        if (!current.running) return current;

        const nextSeconds = Math.max(0, current.secondsLeft - 1);

        return {
          ...current,
          secondsLeft: nextSeconds,
          running: nextSeconds > 0,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [restTimer.running, restTimer.secondsLeft]);

  const restProgress = restTimer.totalSeconds > 0 ? Math.round(((restTimer.totalSeconds - restTimer.secondsLeft) / restTimer.totalSeconds) * 100) : 0;

  function startRestTimer(exercise: PlanExercise) {
    if (!restTimerEnabled) return;

    const mode = restModeMap[exercise.id] ?? "normal";
    const seconds = customRestMap[exercise.id] ?? getRestSecondsByMode(exercise, mode);

    setRestTimer({
      exerciseId: exercise.id,
      secondsLeft: seconds,
      totalSeconds: seconds,
      running: true,
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
      if (currentTimer.exerciseId !== exercise.id || currentTimer.running) return currentTimer;

      return {
        exerciseId: exercise.id,
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
    }));
  }

  const prMap = useMemo(() => {
    const best: Record<string, LogSet> = {};

    for (const [exerciseName, records] of Object.entries(recordsMap)) {
      if (records.maxWeight) best[exerciseName] = records.maxWeight;
    }

    return best;
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


  function addManualSet(exerciseId: string, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);
      return {
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
    });
  }

  function removeManualSet(exerciseId: string, defaultSets: number) {
    setInputs((old) => {
      const current = normalizeSetInputs(old[exerciseId] ?? createDefaultSetInputs(defaultSets), defaultSets);

      if (current.length <= 1) return old;

      return {
        ...old,
        [exerciseId]: current.slice(0, -1),
      };
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

      persistSetInputsNow(nextInputs);
      return nextInputs;
    });
  }

  function saveSingleSet(exercise: PlanExercise, setIndex: number) {
    const exerciseInputs = normalizeSetInputs(inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
    const item = exerciseInputs[setIndex];

    if (!item) return;

    const weightLbs = Number(item.weightLbs);
    const reps = Number(item.reps);

    if (weightLbs <= 0 || reps <= 0) return;

    if (!item.done) {
      const logSet: LogSet = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weightLbs,
        reps,
        setNumber: setIndex + 1,
        date: new Date().toISOString(),
      };

      setLogs((old) => [...old, logSet]);
    }

    setInputs((old) => {
      const current = normalizeSetInputs(old[exercise.id] ?? createDefaultSetInputs(exercise.sets), exercise.sets);
      const updated = current.map((set, index) => (index === setIndex ? { ...set, done: true } : set));
      const nextInputs = {
        ...old,
        [exercise.id]: updated,
      };

      persistSetInputsNow(nextInputs);
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
      .filter((item) => item.weightLbs > 0 && item.reps > 0 && !item.alreadySaved)
      .map(({ alreadySaved, ...item }) => item);

    if (validSets.length > 0) {
      setLogs((old) => [...old, ...validSets]);
      startRestTimer(exercise);
    }

    setInputs((old) => {
      const nextInputs = {
        ...old,
        [exercise.id]: createDefaultSetInputs(exercise.sets),
      };

      persistSetInputsNow(nextInputs);
      return nextInputs;
    });
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
      <section className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 py-2.5 backdrop-blur">
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
              {recentLogs.length > 0 && <button onClick={clearHistory} className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300" aria-label="Clear history"><Trash2 size={18} /></button>}
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
                          <span className="mt-1 block text-xs text-zinc-500">{item.movement} · {item.tier}</span>
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
                            {item.group} · {item.movement} · {item.tier}
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

                    {alternatives.length > 0 && (
                      <details className="mb-3 rounded-xl bg-zinc-950 p-3">
                        <summary className="cursor-pointer text-xs font-bold text-zinc-300">
                          <RotateCcw size={14} className="mr-2 inline" /> Substitute
                        </summary>

                        <div className="mt-3">
                          <select
                            value={exercise.name}
                            onChange={(event) => substituteExercise(baseExercise, event.target.value)}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium outline-none"
                          >
                            <option value={exercise.name}>{exercise.name}</option>
                            {alternatives.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-2 text-[11px] text-zinc-500">
                            Preset = session only, Custom = saved to plan.
                          </p>
                        </div>
                      </details>
                    )}

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
                        <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase text-zinc-500">Rest</p><p className="mt-1 text-2xl font-black text-emerald-300">{restTimer.exerciseId === baseExercise.id && restTimer.secondsLeft > 0 ? formatRestTime(restTimer.secondsLeft) : formatRestTime(selectedRestSeconds)}</p></div><div className="flex gap-2"><button onClick={() => setRestTimerEnabled((value) => !value)} className={`rounded-xl px-3 py-2 text-xs font-bold ${restTimerEnabled ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`} type="button">{restTimerEnabled ? "On" : "Off"}</button><button onClick={() => (restTimer.exerciseId === baseExercise.id && restTimer.running ? stopRestTimer() : startRestTimer({ ...exercise, id: baseExercise.id }))} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300" type="button">{restTimer.exerciseId === baseExercise.id && restTimer.running ? "Stop" : "Start"}</button></div></div>
                        <div className="mt-3 grid grid-cols-3 gap-2">{[["short", "Short"], ["normal", "Normal"], ["heavy", "Heavy"]].map(([mode, label]) => (<button key={mode} onClick={() => setRestMode({ ...exercise, id: baseExercise.id }, mode as RestMode)} className={`rounded-xl px-2 py-2 text-xs font-bold ${restMode === mode ? "bg-zinc-50 text-zinc-950" : "bg-zinc-900 text-zinc-400"}`} type="button">{label}</button>))}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => adjustRestSeconds({ ...exercise, id: baseExercise.id }, -30)} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300" type="button">−30s</button><button onClick={() => adjustRestSeconds({ ...exercise, id: baseExercise.id }, 30)} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300" type="button">+30s</button></div>
                        {restTimer.exerciseId === baseExercise.id && restTimer.totalSeconds > 0 && (<div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${restProgress}%` }} /></div>)}
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
                            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-300 disabled:opacity-40"
                            disabled={setInputs.length <= 1}
                            type="button"
                          >
                            − Set
                          </button>
                          <button
                            onClick={() => addManualSet(baseExercise.id, exercise.sets)}
                            className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-950"
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
                            <input inputMode="decimal" value={set.weightLbs} onChange={(event) => updateSet(baseExercise.id, setIndex, "weightLbs", event.target.value, exercise.sets)} className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400" placeholder={latestSet ? String(latestSet.weightLbs) : "0"} />
                            <input inputMode="numeric" value={set.reps} onChange={(event) => updateSet(baseExercise.id, setIndex, "reps", event.target.value, exercise.sets)} className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400" placeholder={latestSet ? String(latestSet.reps) : "0"} />
                            <button onClick={() => saveSingleSet({ ...exercise, id: baseExercise.id }, setIndex)} className={`rounded-2xl border ${set.done ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-500"}`}>
                              <Check size={18} className="mx-auto" />
                            </button>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => saveAllSets({ ...exercise, id: baseExercise.id })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 active:scale-[0.99]">
                        <Save size={18} /> Finish & clear
                      </button>
                    </div>

                    {compactList && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1))}
                          className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-300 disabled:opacity-40"
                          disabled={activeExerciseIndex === 0}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setActiveExerciseIndex(Math.min(day.exercises.length - 1, activeExerciseIndex + 1))}
                          className="rounded-xl bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 disabled:opacity-40"
                          disabled={activeExerciseIndex >= day.exercises.length - 1}
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