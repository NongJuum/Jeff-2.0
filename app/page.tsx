"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  PlayCircle,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Trophy,
} from "lucide-react";

type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Abs & Calves";

type Exercise = {
  id: string;
  name: string;
  group: MuscleGroup;
  muscles: string[];
  sets: number;
  reps: string;
  warmup: boolean;
  alternatives: string[];
  demoQuery: string;
};

type DayPlan = {
  title: string;
  subtitle: string;
  focus: MuscleGroup[];
  exerciseIds: string[];
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

const exerciseNamesByGroup: Record<MuscleGroup, string[]> = {
  Chest: [
    "Bench Press",
    "Cable Crossover",
    "DB Flye",
    "Flat DB Press",
    "Incline DB Press",
    "Incline Machine Bench",
    "Incline Smith Machine Bench",
    "Machine Chest Press",
    "Pec Deck",
    "Seated Cable Pec Flye",
    "Smith Machine Floor Press",
    "Smith Machine Press",
  ],
  Back: [
    "Cable Lat Prayers",
    "Cable Row",
    "Cable Rows",
    "Chest Supported Row",
    "Deficit Pendlay Row",
    "Kroc Row",
    "Meadows Row",
    "Neutral Grip Lat Pull Down",
    "One Arm DB Row",
    "One Arm Lat Pull Down",
    "Weighted Pull Up",
    "Wide Grip Cable Row",
    "Widegrip Lat Pull Down",
  ],
  Legs: [
    "45° Back Extension",
    "45° Leg Press",
    "45° Leg Press High Foot",
    "Barbell Back Squat",
    "Bulgarian Split Squat",
    "DB Pullovers",
    "Deadlift",
    "Front Squat",
    "Hack Squat",
    "Kickbacks",
    "Leg Extension",
    "Lunges",
    "Lying Leg Curl",
    "Machine Hip Abduction",
    "Machine Hip Thrust",
    "Pendulum Squat",
    "Reverse Nordic",
    "Romanian Deadlift RDL",
    "Seated Hamstring Curl",
    "Sissy Squat",
    "Smith Machine Lunge FFE",
    "Smith Machine Squat",
    "Smith Machine Squat Feet Forward",
    "Step Ups High Box",
  ],
  Shoulders: [
    "Atlantis Machine Lat Raise",
    "Behind Back Cable Lat Raise",
    "Cable Y Raise",
    "Cable Lat Raise",
    "Lean In DB Raise",
    "Machine Shoulder Press",
    "Reverse Cable Crossover",
    "Reverse Pec Deck",
    "Rope Face Pull",
    "Seated DB Overhead Press",
  ],
  Arms: [
    "1 Arm DB Overhead",
    "Barbell Skullcrusher",
    "DB Preacher Curl",
    "DB Skullcrusher",
    "EZ Bar Curl",
    "Face Away Bayesian Curl",
    "Incline Curl",
    "Katana Cable",
    "Machine Preacher Curl",
    "Overhead Cable Ext",
    "Standing DB Curl",
    "Triceps Pressdown Bar",
  ],
  "Abs & Calves": ["Cable Crunch", "Front Calf Muscle", "Machine Abs Crunch"],
};

const primaryExercises: Exercise[] = [
  {
    id: "machineChestPress",
    name: "Machine Chest Press",
    group: "Chest",
    muscles: ["Chest", "Front delts", "Triceps"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    alternatives: ["Incline Machine Bench", "Incline Smith Machine Bench", "Flat DB Press", "Bench Press"],
    demoQuery: "Machine Chest Press proper form",
  },
  {
    id: "inclineDbPress",
    name: "Incline DB Press",
    group: "Chest",
    muscles: ["Upper chest", "Front delts", "Triceps"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    alternatives: ["Incline Machine Bench", "Incline Smith Machine Bench", "Machine Chest Press", "Smith Machine Press"],
    demoQuery: "Incline Dumbbell Press proper form",
  },
  {
    id: "seatedCablePecFlye",
    name: "Seated Cable Pec Flye",
    group: "Chest",
    muscles: ["Chest"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Pec Deck", "Cable Crossover", "DB Flye"],
    demoQuery: "Seated Cable Pec Flye proper form",
  },
  {
    id: "neutralGripLatPulldown",
    name: "Neutral Grip Lat Pull Down",
    group: "Back",
    muscles: ["Lats", "Upper back", "Biceps"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    alternatives: ["Widegrip Lat Pull Down", "One Arm Lat Pull Down", "Weighted Pull Up", "Cable Lat Prayers"],
    demoQuery: "Neutral Grip Lat Pulldown proper form",
  },
  {
    id: "chestSupportedRow",
    name: "Chest Supported Row",
    group: "Back",
    muscles: ["Mid back", "Lats", "Rear delts"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    alternatives: ["Cable Row", "Wide Grip Cable Row", "One Arm DB Row", "Deficit Pendlay Row"],
    demoQuery: "Chest Supported Row proper form",
  },
  {
    id: "cableLatPrayers",
    name: "Cable Lat Prayers",
    group: "Back",
    muscles: ["Lats"],
    sets: 2,
    reps: "12 to 15",
    warmup: false,
    alternatives: ["One Arm Lat Pull Down", "Neutral Grip Lat Pull Down", "Widegrip Lat Pull Down"],
    demoQuery: "Cable Lat Prayers proper form",
  },
  {
    id: "hackSquat",
    name: "Hack Squat",
    group: "Legs",
    muscles: ["Quads", "Glutes"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    alternatives: ["Pendulum Squat", "Barbell Back Squat", "Smith Machine Squat", "45° Leg Press"],
    demoQuery: "Hack Squat proper form",
  },
  {
    id: "seatedHamstringCurl",
    name: "Seated Hamstring Curl",
    group: "Legs",
    muscles: ["Hamstrings"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    alternatives: ["Lying Leg Curl", "Romanian Deadlift RDL", "45° Back Extension"],
    demoQuery: "Seated Hamstring Curl proper form",
  },
  {
    id: "romanianDeadlift",
    name: "Romanian Deadlift RDL",
    group: "Legs",
    muscles: ["Hamstrings", "Glutes", "Erectors"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    alternatives: ["45° Back Extension", "Deadlift", "Machine Hip Thrust"],
    demoQuery: "Romanian Deadlift RDL proper form",
  },
  {
    id: "legExtension",
    name: "Leg Extension",
    group: "Legs",
    muscles: ["Quads"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Reverse Nordic", "Sissy Squat", "Front Squat", "45° Leg Press"],
    demoQuery: "Leg Extension proper form",
  },
  {
    id: "machineHipThrust",
    name: "Machine Hip Thrust",
    group: "Legs",
    muscles: ["Glutes"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    alternatives: ["Machine Hip Abduction", "Smith Machine Lunge FFE", "Bulgarian Split Squat"],
    demoQuery: "Machine Hip Thrust proper form",
  },
  {
    id: "cableLatRaise",
    name: "Cable Lat Raise",
    group: "Shoulders",
    muscles: ["Side delts"],
    sets: 3,
    reps: "12 to 20",
    warmup: false,
    alternatives: ["Atlantis Machine Lat Raise", "Behind Back Cable Lat Raise", "Cable Y Raise", "Lean In DB Raise"],
    demoQuery: "Cable Lateral Raise proper form",
  },
  {
    id: "reversePecDeck",
    name: "Reverse Pec Deck",
    group: "Shoulders",
    muscles: ["Rear delts", "Upper back"],
    sets: 2,
    reps: "12 to 20",
    warmup: false,
    alternatives: ["Reverse Cable Crossover", "Rope Face Pull"],
    demoQuery: "Reverse Pec Deck proper form",
  },
  {
    id: "machineShoulderPress",
    name: "Machine Shoulder Press",
    group: "Shoulders",
    muscles: ["Front delts", "Side delts", "Triceps"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    alternatives: ["Seated DB Overhead Press", "Smith Machine Press"],
    demoQuery: "Machine Shoulder Press proper form",
  },
  {
    id: "faceAwayBayesianCurl",
    name: "Face Away Bayesian Curl",
    group: "Arms",
    muscles: ["Biceps"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Incline Curl", "Machine Preacher Curl", "EZ Bar Curl", "Standing DB Curl"],
    demoQuery: "Face Away Bayesian Curl proper form",
  },
  {
    id: "overheadCableExt",
    name: "Overhead Cable Ext",
    group: "Arms",
    muscles: ["Triceps long head"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Katana Cable", "Barbell Skullcrusher", "DB Skullcrusher", "Triceps Pressdown Bar"],
    demoQuery: "Overhead Cable Triceps Extension proper form",
  },
  {
    id: "cableCrunch",
    name: "Cable Crunch",
    group: "Abs & Calves",
    muscles: ["Abs"],
    sets: 3,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Machine Abs Crunch"],
    demoQuery: "Cable Crunch proper form",
  },
  {
    id: "frontCalf",
    name: "Front Calf Muscle",
    group: "Abs & Calves",
    muscles: ["Calves"],
    sets: 3,
    reps: "8 to 15",
    warmup: false,
    alternatives: [],
    demoQuery: "Standing Calf Raise proper form",
  },
];

const exercises: Record<string, Exercise> = Object.fromEntries(primaryExercises.map((item) => [item.id, item]));

const plans: Record<3 | 4 | 5, DayPlan[]> = {
  3: [
    {
      title: "Day 1 Full Body A",
      subtitle: "Chest first, then back, quads, delts, arms",
      focus: ["Chest", "Back", "Legs", "Shoulders", "Arms"],
      exerciseIds: ["machineChestPress", "neutralGripLatPulldown", "hackSquat", "cableLatRaise", "faceAwayBayesianCurl", "overheadCableExt"],
    },
    {
      title: "Day 2 Full Body B",
      subtitle: "Posterior chain, row, chest isolation, rear delts",
      focus: ["Legs", "Back", "Chest", "Shoulders", "Abs & Calves"],
      exerciseIds: ["romanianDeadlift", "chestSupportedRow", "seatedCablePecFlye", "reversePecDeck", "machineHipThrust", "frontCalf"],
    },
    {
      title: "Day 3 Full Body C",
      subtitle: "Quads, vertical pull, incline chest, hamstrings, core",
      focus: ["Legs", "Back", "Chest", "Shoulders", "Abs & Calves"],
      exerciseIds: ["legExtension", "neutralGripLatPulldown", "inclineDbPress", "seatedHamstringCurl", "cableLatRaise", "cableCrunch"],
    },
  ],
  4: [
    {
      title: "Day 1 Upper A",
      subtitle: "Chest, lats, side delts, biceps, triceps",
      focus: ["Chest", "Back", "Shoulders", "Arms"],
      exerciseIds: ["machineChestPress", "neutralGripLatPulldown", "seatedCablePecFlye", "cableLatRaise", "faceAwayBayesianCurl", "overheadCableExt"],
    },
    {
      title: "Day 2 Lower A",
      subtitle: "Quad bias with hamstrings and calves",
      focus: ["Legs", "Abs & Calves"],
      exerciseIds: ["hackSquat", "seatedHamstringCurl", "machineHipThrust", "legExtension", "frontCalf"],
    },
    {
      title: "Day 3 Upper B",
      subtitle: "Rows, incline press, rear delts, arms",
      focus: ["Back", "Chest", "Shoulders", "Arms"],
      exerciseIds: ["chestSupportedRow", "inclineDbPress", "cableLatPrayers", "reversePecDeck", "faceAwayBayesianCurl", "overheadCableExt"],
    },
    {
      title: "Day 4 Lower B",
      subtitle: "Posterior bias with quads and abs",
      focus: ["Legs", "Abs & Calves"],
      exerciseIds: ["romanianDeadlift", "legExtension", "machineHipThrust", "seatedHamstringCurl", "cableCrunch"],
    },
  ],
  5: [
    {
      title: "Day 1 Chest + Back",
      subtitle: "Press, pull, flye, row",
      focus: ["Chest", "Back"],
      exerciseIds: ["machineChestPress", "neutralGripLatPulldown", "inclineDbPress", "chestSupportedRow", "seatedCablePecFlye"],
    },
    {
      title: "Day 2 Legs Quad Bias",
      subtitle: "Squat pattern first, then accessories",
      focus: ["Legs", "Abs & Calves"],
      exerciseIds: ["hackSquat", "legExtension", "machineHipThrust", "frontCalf"],
    },
    {
      title: "Day 3 Shoulders + Arms",
      subtitle: "Delts first, then biceps and triceps",
      focus: ["Shoulders", "Arms"],
      exerciseIds: ["machineShoulderPress", "cableLatRaise", "reversePecDeck", "faceAwayBayesianCurl", "overheadCableExt"],
    },
    {
      title: "Day 4 Back + Chest",
      subtitle: "Row bias with chest support work",
      focus: ["Back", "Chest"],
      exerciseIds: ["chestSupportedRow", "cableLatPrayers", "neutralGripLatPulldown", "seatedCablePecFlye", "inclineDbPress"],
    },
    {
      title: "Day 5 Legs Posterior Bias",
      subtitle: "Hinge, hamstrings, glutes, abs",
      focus: ["Legs", "Abs & Calves"],
      exerciseIds: ["romanianDeadlift", "seatedHamstringCurl", "machineHipThrust", "cableCrunch", "frontCalf"],
    },
  ],
};


const fiveDayLegOncePlan: DayPlan[] = [
  {
    title: "Day 1 Push",
    subtitle: "Chest, shoulders, triceps",
    focus: ["Chest", "Shoulders", "Arms"],
    exerciseIds: ["machineChestPress", "inclineDbPress", "cableLatRaise", "overheadCableExt"],
  },
  {
    title: "Day 2 Pull",
    subtitle: "Back thickness, lats, biceps",
    focus: ["Back", "Arms"],
    exerciseIds: ["chestSupportedRow", "neutralGripLatPulldown", "cableLatPrayers", "faceAwayBayesianCurl"],
  },
  {
    title: "Day 3 Legs Only",
    subtitle: "One leg day with quad, hamstring, glute, calf",
    focus: ["Legs", "Abs & Calves"],
    exerciseIds: ["hackSquat", "seatedHamstringCurl", "machineHipThrust", "legExtension", "frontCalf"],
  },
  {
    title: "Day 4 Upper A",
    subtitle: "Chest and back with shoulder accessory",
    focus: ["Chest", "Back", "Shoulders"],
    exerciseIds: ["machineChestPress", "chestSupportedRow", "seatedCablePecFlye", "reversePecDeck"],
  },
  {
    title: "Day 5 Upper B + Arms",
    subtitle: "Back, incline chest, delts, arms",
    focus: ["Back", "Chest", "Shoulders", "Arms"],
    exerciseIds: ["neutralGripLatPulldown", "inclineDbPress", "cableLatRaise", "faceAwayBayesianCurl", "overheadCableExt"],
  },
];

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

function isWithinLastDays(dateIso: string, daysBack: number) {
  const time = new Date(dateIso).getTime();
  if (Number.isNaN(time)) return false;
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  return time >= cutoff;
}

function formatShortDate(dateIso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

function getSamePatternAlternatives(base: Exercise) {
  const names = exerciseNamesByGroup[base.group];

  if (base.group === "Chest") {
    if (base.name.includes("Flye") || base.name.includes("Pec") || base.name.includes("Crossover")) {
      return names.filter((name) => name.includes("Flye") || name.includes("Pec") || name.includes("Crossover"));
    }
    if (base.name.includes("Incline")) {
      return names.filter((name) => name.includes("Incline") || name.includes("Machine Chest Press") || name.includes("Smith Machine Press"));
    }
    return names.filter((name) => name.includes("Press") || name.includes("Bench"));
  }

  if (base.group === "Back") {
    if (base.name.includes("Pull") || base.name.includes("Prayers")) {
      return names.filter((name) => name.includes("Pull") || name.includes("Prayers"));
    }
    return names.filter((name) => name.includes("Row"));
  }

  if (base.group === "Legs") {
    if (base.name.includes("Curl")) {
      return names.filter((name) => name.includes("Curl") || name.includes("Romanian") || name.includes("Back Extension"));
    }
    if (base.name.includes("Thrust") || base.name.includes("Abduction") || base.name.includes("Kickbacks")) {
      return names.filter((name) => name.includes("Thrust") || name.includes("Abduction") || name.includes("Kickbacks") || name.includes("Lunge") || name.includes("Bulgarian"));
    }
    if (base.name.includes("Romanian") || base.name.includes("Deadlift") || base.name.includes("Back Extension")) {
      return names.filter((name) => name.includes("Romanian") || name.includes("Deadlift") || name.includes("Back Extension") || name.includes("Curl"));
    }
    return names.filter((name) => name.includes("Squat") || name.includes("Press") || name.includes("Extension") || name.includes("Nordic") || name.includes("Sissy"));
  }

  if (base.group === "Shoulders") {
    if (base.name.includes("Press")) {
      return names.filter((name) => name.includes("Press"));
    }
    if (base.name.includes("Reverse") || base.name.includes("Face Pull")) {
      return names.filter((name) => name.includes("Reverse") || name.includes("Face Pull"));
    }
    return names.filter((name) => name.includes("Raise"));
  }

  if (base.group === "Arms") {
    if (base.muscles.some((m) => m.includes("Biceps")) || base.name.includes("Curl") || base.name.includes("Preacher")) {
      return names.filter((name) => name.includes("Curl") || name.includes("Preacher"));
    }
    return names.filter((name) => name.includes("Overhead") || name.includes("Skullcrusher") || name.includes("Katana") || name.includes("Triceps"));
  }

  return names;
}

function createDefaultSetInputs(sets: number): SetInput[] {
  return Array.from({ length: sets }, () => ({
    weightLbs: "",
    reps: "",
    done: false,
  }));
}

export default function Page() {
  const [days, setDays] = useState<3 | 4 | 5>(4);
  const [fiveDayMode, setFiveDayMode] = useState<"twoLegDays" | "oneLegDay">("twoLegDays");
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeMap, setActiveMap] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<LogSet[]>([]);
  const [inputs, setInputs] = useState<Record<string, SetInput[]>>({});
  const [librarySearch, setLibrarySearch] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("trainingLogsV2");
    if (raw) {
      const parsed = JSON.parse(raw) as LogSet[];
      setLogs(parsed.filter((item) => isWithinLastDays(item.date, 14)));
    }

    const rawMap = window.localStorage.getItem("activeExerciseMapV2");
    if (rawMap) setActiveMap(JSON.parse(rawMap));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("trainingLogsV2", JSON.stringify(logs.filter((item) => isWithinLastDays(item.date, 14))));
  }, [logs]);

  useEffect(() => {
    window.localStorage.setItem("activeExerciseMapV2", JSON.stringify(activeMap));
  }, [activeMap]);

  const activePlan = days === 5 && fiveDayMode === "oneLegDay" ? fiveDayLegOncePlan : plans[days];
  const day = activePlan[selectedDay] ?? activePlan[0];

  useEffect(() => {
    if (selectedDay >= activePlan.length) setSelectedDay(0);
  }, [activePlan.length, selectedDay]);

  const prMap = useMemo(() => {
    const best: Record<string, LogSet> = {};
    for (const log of logs) {
      const current = best[log.exerciseName];
      const score = log.weightLbs * log.reps;
      const currentScore = current ? current.weightLbs * current.reps : -1;

      if (!current || score > currentScore || (score === currentScore && log.weightLbs > current.weightLbs)) {
        best[log.exerciseName] = log;
      }
    }
    return best;
  }, [logs]);

  function getActiveExercise(baseId: string): Exercise {
    const selectedName = activeMap[baseId];
    if (!selectedName || selectedName === exercises[baseId].name) return exercises[baseId];

    const base = exercises[baseId];
    return {
      ...base,
      id: `${base.id}:${selectedName}`,
      name: selectedName,
      demoQuery: `${selectedName} proper form`,
    };
  }

  function updateSet(exerciseId: string, setIndex: number, field: keyof SetInput, value: string | boolean, defaultSets: number) {
    setInputs((old) => {
      const current = old[exerciseId] ?? createDefaultSetInputs(defaultSets);
      const updated = current.map((set, index) => (index === setIndex ? { ...set, [field]: value } : set));
      return {
        ...old,
        [exerciseId]: updated,
      };
    });
  }

  function saveAllSets(exercise: Exercise) {
    const exerciseInputs = inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets);
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

    setInputs((old) => ({
      ...old,
      [exercise.id]: createDefaultSetInputs(exercise.sets),
    }));
  }

  const filteredLibrary = useMemo(() => {
    const keyword = librarySearch.trim().toLowerCase();
    const all = Object.entries(exerciseNamesByGroup).flatMap(([group, names]) =>
      names.map((name) => ({
        group: group as MuscleGroup,
        name,
      }))
    );

    if (!keyword) return all;

    return all.filter((item) => item.name.toLowerCase().includes(keyword) || item.group.toLowerCase().includes(keyword));
  }, [librarySearch]);

  const recentLogs = useMemo(() => {
    return logs
      .filter((item) => isWithinLastDays(item.date, 14))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs]);

  const recentLogsByDate = useMemo(() => {
    return recentLogs.reduce<Record<string, LogSet[]>>((acc, item) => {
      const key = new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(item.date));

      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [recentLogs]);

  function clearHistory() {
    setLogs([]);
    window.localStorage.removeItem("trainingLogsV2");
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-28 text-zinc-50">
      <section className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-300">
              <Dumbbell size={14} /> Jeff 2.0
            </p>
            <h1 className="text-lg font-black leading-tight">Workout Tracker</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory((value) => !value)}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold"
            >
              History
            </button>
            <button
              onClick={() => setShowLibrary((value) => !value)}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold"
            >
              Library
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-[1fr_0.6fr]">
          <div>
            <p className="text-sm text-zinc-400">Mobile-first workout planner</p>
            <h2 className="mt-1 text-2xl font-black">3 / 4 / 5 day auto split</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Updated with your gym equipment list, multi-set logging, substitutions, PR display, and automatic warmup weight from previous best record.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-3">
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Training days</label>
            <div className="relative">
              <select
                value={days}
                onChange={(event) => {
                  setDays(Number(event.target.value) as 3 | 4 | 5);
                  setSelectedDay(0);
                }}
                className="w-full appearance-none rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base font-black outline-none"
              >
                <option value={3}>3 days Full Body</option>
                <option value={4}>4 days Upper / Lower</option>
                <option value={5}>5 days Split</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-4 text-zinc-400" size={20} />
            </div>
          </div>
        </div>


        {days === 5 && (
          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-zinc-500">5 day split type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setFiveDayMode("twoLegDays");
                  setSelectedDay(0);
                }}
                className={`rounded-2xl px-3 py-3 text-sm font-black ${
                  fiveDayMode === "twoLegDays" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"
                }`}
              >
                2 Leg Days
              </button>
              <button
                onClick={() => {
                  setFiveDayMode("oneLegDay");
                  setSelectedDay(0);
                }}
                className={`rounded-2xl px-3 py-3 text-sm font-black ${
                  fiveDayMode === "oneLegDay" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"
                }`}
              >
                1 Leg Day
              </button>
            </div>
          </div>
        )}


        {showHistory && (
          <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <ClipboardList size={18} /> History Log
                </h3>
                <p className="mt-1 text-sm text-zinc-400">Temporary record from the last 14 days only.</p>
              </div>

              {recentLogs.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-red-300"
                  aria-label="Clear history"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {recentLogs.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
                No workout log yet. Save working sets first.
              </div>
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
                            <p className="whitespace-nowrap text-sm font-black text-emerald-300">
                              {item.weightLbs} lbs × {item.reps}
                            </p>
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
              <input
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder="Search exercise or muscle group"
                className="w-full bg-transparent py-2 outline-none"
              />
            </div>

            <div className="max-h-96 overflow-y-auto pr-1">
              {Object.entries(
                filteredLibrary.reduce<Record<string, string[]>>((acc, item) => {
                  acc[item.group] = acc[item.group] ?? [];
                  acc[item.group].push(item.name);
                  return acc;
                }, {})
              ).map(([group, names]) => (
                <div key={group} className="mb-5">
                  <h3 className="mb-2 text-sm font-black text-emerald-300">{group}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {names.map((name) => (
                      <a
                        key={name}
                        href={youtubeSearch(`${name} proper form`)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-zinc-950 px-3 py-3 text-sm text-zinc-300"
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2">
          {activePlan.map((item, index) => (
            <button
              key={item.title}
              onClick={() => setSelectedDay(index)}
              className={`min-w-[180px] snap-start rounded-3xl px-4 py-3 text-left transition ${
                selectedDay === index ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"
              }`}
            >
              <CalendarDays size={16} />
              <p className="mt-2 font-black">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs opacity-80">{item.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-xl font-black">{day.title}</h2>
          <p className="mt-1 text-sm text-zinc-400">{day.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {day.focus.map((focus) => (
              <span key={focus} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">
                {focus}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          {day.exerciseIds.map((baseId, index) => {
            const exercise = getActiveExercise(baseId);
            const base = exercises[baseId];
            const pr = prMap[exercise.name];
            const basePr = prMap[base.name];
            const best = pr ?? basePr;
            const bestWeight = best?.weightLbs;
            const warmups = exercise.warmup ? getWarmupSets(bestWeight) : [];
            const setInputs = inputs[exercise.id] ?? createDefaultSetInputs(exercise.sets);
            const options = Array.from(new Set([base.name, ...base.alternatives, ...getSamePatternAlternatives(base)])).filter((name) => name !== "DB Pullovers");

            return (
              <article key={`${baseId}-${index}`} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-400">#{index + 1}</span>
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{exercise.group}</span>
                      {exercise.warmup ? (
                        <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-300">
                          <Flame className="mr-1 inline" size={12} /> Warmup
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">No warmup needed</span>
                      )}
                    </div>

                    <h3 className="mt-3 text-2xl font-black leading-tight">{exercise.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Target: {exercise.sets} working sets × {exercise.reps} reps
                    </p>
                  </div>

                  <a
                    href={youtubeSearch(exercise.demoQuery)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-zinc-50 p-3 text-zinc-950"
                    aria-label="Watch demo"
                  >
                    <PlayCircle size={22} />
                  </a>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {exercise.muscles.map((muscle) => (
                    <span key={muscle} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                      {muscle}
                    </span>
                  ))}
                </div>

                <div className="mb-4 rounded-2xl bg-zinc-950 p-3">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                    <RotateCcw size={14} /> Substitute machine if busy
                  </label>
                  <select
                    value={activeMap[baseId] ?? base.name}
                    onChange={(event) => setActiveMap((old) => ({ ...old, [baseId]: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base font-bold outline-none"
                  >
                    {options.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                      <Trophy size={14} /> Current PR
                    </p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">
                      {best ? `${best.weightLbs} lbs × ${best.reps}` : "No record"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                      <BarChart3 size={14} /> Warmup from PR
                    </p>
                    {exercise.warmup ? (
                      warmups.length > 0 ? (
                        <div className="mt-2 space-y-1 text-sm">
                          {warmups.map((item) => (
                            <p key={item.label}>
                              <span className="text-zinc-500">{item.label}:</span>{" "}
                              <span className="font-bold">{item.weight} lbs</span>{" "}
                              <span className="text-zinc-400">× {item.reps}</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-zinc-400">Save a PR first</p>
                      )
                    ) : (
                      <p className="mt-2 text-sm text-zinc-400">Skip specific warmup</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-3">
                  <div className="mb-3 grid grid-cols-[46px_1fr_1fr_42px] gap-2 text-xs font-bold uppercase text-zinc-500">
                    <span>Set</span>
                    <span>lbs</span>
                    <span>Reps</span>
                    <span>Done</span>
                  </div>

                  <div className="space-y-2">
                    {setInputs.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-[46px_1fr_1fr_42px] gap-2">
                        <div className="flex items-center font-black text-zinc-400">{setIndex + 1}</div>
                        <input
                          inputMode="decimal"
                          value={set.weightLbs}
                          onChange={(event) => updateSet(exercise.id, setIndex, "weightLbs", event.target.value, exercise.sets)}
                          className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400"
                          placeholder={bestWeight ? String(bestWeight) : "135"}
                        />
                        <input
                          inputMode="numeric"
                          value={set.reps}
                          onChange={(event) => updateSet(exercise.id, setIndex, "reps", event.target.value, exercise.sets)}
                          className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-base outline-none focus:border-emerald-400"
                          placeholder="8"
                        />
                        <button
                          onClick={() => updateSet(exercise.id, setIndex, "done", !set.done, exercise.sets)}
                          className={`rounded-2xl border ${
                            set.done ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-500"
                          }`}
                        >
                          <Check size={18} className="mx-auto" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => saveAllSets(exercise)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 text-base font-black text-zinc-950 active:scale-[0.99]"
                  >
                    <Save size={18} /> Save all working sets
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2">
          {[3, 4, 5].map((item) => (
            <button
              key={item}
              onClick={() => {
                setDays(item as 3 | 4 | 5);
                setSelectedDay(0);
              }}
              className={`rounded-2xl py-3 text-sm font-black ${
                days === item ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"
              }`}
            >
              {item} Days
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
