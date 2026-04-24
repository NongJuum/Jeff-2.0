"use client";

import { useEffect, useMemo, useState } from "react";
import { Dumbbell, Repeat2, Trophy, PlayCircle, Flame, Save, CalendarDays } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  tier: "S+" | "S" | "A+" | "A";
  muscles: string[];
  equipment: string[];
  sets: number;
  reps: string;
  warmup: boolean;
  warmupNote?: string;
  alternatives: string[];
  demoQuery: string;
};

type DayPlan = {
  title: string;
  focus: string[];
  exerciseIds: string[];
};

type LogSet = {
  exerciseId: string;
  weightLbs: number;
  reps: number;
  date: string;
};

const exercises: Record<string, Exercise> = {
  machineChestPress: {
    id: "machineChestPress",
    name: "Machine Chest Press",
    tier: "S+",
    muscles: ["Chest", "Front delts", "Triceps"],
    equipment: ["machine"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    warmupNote: "2 to 3 ramp up sets before hard sets",
    alternatives: ["Incline Dumbbell Press", "Bench Press", "Smith Machine Bench Press"],
    demoQuery: "machine chest press proper form Jeff Nippard"
  },
  seatedCableFlye: {
    id: "seatedCableFlye",
    name: "Seated Cable Pec Flye",
    tier: "S",
    muscles: ["Chest"],
    equipment: ["cable"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Cable Crossover", "Pec Deck", "Dumbbell Flye"],
    demoQuery: "seated cable pec flye proper form"
  },
  latPulldown: {
    id: "latPulldown",
    name: "Neutral Grip Lat Pulldown",
    tier: "S",
    muscles: ["Lats", "Upper back", "Biceps"],
    equipment: ["cable"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    warmupNote: "1 to 2 ramp up sets",
    alternatives: ["Wide Grip Pulldown", "Pull Up", "One Arm Lat Pulldown"],
    demoQuery: "neutral grip lat pulldown proper form Jeff Nippard"
  },
  chestSupportedRow: {
    id: "chestSupportedRow",
    name: "Chest Supported Row",
    tier: "S",
    muscles: ["Mid back", "Lats", "Rear delts"],
    equipment: ["machine", "dumbbell"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    warmupNote: "1 to 2 ramp up sets",
    alternatives: ["Cable Row", "Deficit Pendlay Row", "One Arm Dumbbell Row"],
    demoQuery: "chest supported row proper form Jeff Nippard"
  },
  cableLateralRaise: {
    id: "cableLateralRaise",
    name: "Cable Lateral Raise",
    tier: "S+",
    muscles: ["Side delts"],
    equipment: ["cable"],
    sets: 3,
    reps: "12 to 20",
    warmup: false,
    alternatives: ["Lean In Dumbbell Lateral Raise", "Cable Y Raise", "Machine Lateral Raise"],
    demoQuery: "cable lateral raise proper form Jeff Nippard"
  },
  reversePecDeck: {
    id: "reversePecDeck",
    name: "Reverse Pec Deck",
    tier: "S",
    muscles: ["Rear delts", "Upper back"],
    equipment: ["machine"],
    sets: 2,
    reps: "12 to 20",
    warmup: false,
    alternatives: ["Reverse Cable Crossover", "Rope Face Pull", "Bent Over Rear Delt Raise"],
    demoQuery: "reverse pec deck proper form"
  },
  hackSquat: {
    id: "hackSquat",
    name: "Hack Squat",
    tier: "S+",
    muscles: ["Quads", "Glutes"],
    equipment: ["machine"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    warmupNote: "3 ramp up sets recommended",
    alternatives: ["Barbell Back Squat", "Smith Machine Squat", "45 Degree Leg Press"],
    demoQuery: "hack squat proper form Jeff Nippard"
  },
  legExtension: {
    id: "legExtension",
    name: "Leg Extension",
    tier: "A",
    muscles: ["Quads"],
    equipment: ["machine"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Reverse Nordic", "Front Squat", "45 Degree Leg Press"],
    demoQuery: "leg extension proper form"
  },
  seatedLegCurl: {
    id: "seatedLegCurl",
    name: "Seated Leg Curl",
    tier: "S",
    muscles: ["Hamstrings"],
    equipment: ["machine"],
    sets: 3,
    reps: "8 to 12",
    warmup: true,
    warmupNote: "1 light feeler set",
    alternatives: ["Lying Leg Curl", "Nordic Curl", "Romanian Deadlift"],
    demoQuery: "seated leg curl proper form Jeff Nippard"
  },
  romanianDeadlift: {
    id: "romanianDeadlift",
    name: "Romanian Deadlift",
    tier: "A",
    muscles: ["Hamstrings", "Glutes", "Erectors"],
    equipment: ["barbell", "dumbbell"],
    sets: 3,
    reps: "6 to 10",
    warmup: true,
    warmupNote: "2 to 3 ramp up sets; hinge pattern needs prep",
    alternatives: ["Dumbbell RDL", "Good Morning", "45 Degree Back Extension"],
    demoQuery: "Romanian deadlift proper form Jeff Nippard"
  },
  walkingLunge: {
    id: "walkingLunge",
    name: "Walking Lunge",
    tier: "S",
    muscles: ["Glutes", "Quads"],
    equipment: ["dumbbell"],
    sets: 2,
    reps: "10 to 12 each leg",
    warmup: false,
    alternatives: ["Bulgarian Split Squat", "Smith Machine Lunge", "Leg Press"],
    demoQuery: "walking lunge proper form glutes"
  },
  bayesianCurl: {
    id: "bayesianCurl",
    name: "Bayesian Cable Curl",
    tier: "A",
    muscles: ["Biceps"],
    equipment: ["cable"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Incline Dumbbell Curl", "EZ Bar Curl", "Machine Preacher Curl"],
    demoQuery: "Bayesian cable curl proper form Jeff Nippard"
  },
  overheadCableTriceps: {
    id: "overheadCableTriceps",
    name: "Overhead Cable Triceps Extension",
    tier: "S+",
    muscles: ["Triceps long head"],
    equipment: ["cable"],
    sets: 2,
    reps: "10 to 15",
    warmup: false,
    alternatives: ["Barbell Skullcrusher", "Katana Cable Extension", "Dumbbell Overhead Extension"],
    demoQuery: "overhead cable triceps extension proper form Jeff Nippard"
  },
  calfRaise: {
    id: "calfRaise",
    name: "Standing Calf Raise",
    tier: "A",
    muscles: ["Calves"],
    equipment: ["machine"],
    sets: 3,
    reps: "8 to 15",
    warmup: false,
    alternatives: ["Seated Calf Raise", "Leg Press Calf Raise"],
    demoQuery: "standing calf raise proper form"
  }
};

const plans: Record<3 | 4 | 5, DayPlan[]> = {
  3: [
    { title: "Day 1 Full Body A", focus: ["Chest", "Back", "Quads", "Side delts", "Arms"], exerciseIds: ["machineChestPress", "latPulldown", "hackSquat", "cableLateralRaise", "bayesianCurl", "overheadCableTriceps"] },
    { title: "Day 2 Full Body B", focus: ["Hamstrings", "Chest", "Rows", "Rear delts", "Glutes"], exerciseIds: ["romanianDeadlift", "seatedCableFlye", "chestSupportedRow", "reversePecDeck", "walkingLunge", "calfRaise"] },
    { title: "Day 3 Full Body C", focus: ["Quads", "Back", "Chest", "Hamstrings", "Delts"], exerciseIds: ["legExtension", "latPulldown", "machineChestPress", "seatedLegCurl", "cableLateralRaise", "overheadCableTriceps"] }
  ],
  4: [
    { title: "Day 1 Upper A", focus: ["Chest", "Lats", "Side delts", "Biceps", "Triceps"], exerciseIds: ["machineChestPress", "latPulldown", "seatedCableFlye", "cableLateralRaise", "bayesianCurl", "overheadCableTriceps"] },
    { title: "Day 2 Lower A", focus: ["Quads", "Hamstrings", "Glutes", "Calves"], exerciseIds: ["hackSquat", "seatedLegCurl", "walkingLunge", "legExtension", "calfRaise"] },
    { title: "Day 3 Upper B", focus: ["Rows", "Chest", "Rear delts", "Arms"], exerciseIds: ["chestSupportedRow", "machineChestPress", "reversePecDeck", "latPulldown", "bayesianCurl", "overheadCableTriceps"] },
    { title: "Day 4 Lower B", focus: ["Hamstrings", "Quads", "Glutes", "Calves"], exerciseIds: ["romanianDeadlift", "legExtension", "walkingLunge", "seatedLegCurl", "calfRaise"] }
  ],
  5: [
    { title: "Day 1 Chest + Back", focus: ["Chest", "Back"], exerciseIds: ["machineChestPress", "latPulldown", "seatedCableFlye", "chestSupportedRow"] },
    { title: "Day 2 Legs Quad Bias", focus: ["Quads", "Calves"], exerciseIds: ["hackSquat", "legExtension", "walkingLunge", "calfRaise"] },
    { title: "Day 3 Shoulders + Arms", focus: ["Side delts", "Rear delts", "Biceps", "Triceps"], exerciseIds: ["cableLateralRaise", "reversePecDeck", "bayesianCurl", "overheadCableTriceps"] },
    { title: "Day 4 Back + Chest", focus: ["Back", "Chest"], exerciseIds: ["chestSupportedRow", "latPulldown", "machineChestPress", "seatedCableFlye"] },
    { title: "Day 5 Legs Posterior Bias", focus: ["Hamstrings", "Glutes", "Calves"], exerciseIds: ["romanianDeadlift", "seatedLegCurl", "walkingLunge", "calfRaise"] }
  ]
};

function youtubeSearch(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export default function Page() {
  const [days, setDays] = useState<3 | 4 | 5>(4);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeMap, setActiveMap] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<LogSet[]>([]);
  const [inputs, setInputs] = useState<Record<string, { weightLbs: string; reps: string }>>({});

  useEffect(() => {
    const raw = localStorage.getItem("trainingLogs");
    if (raw) setLogs(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem("trainingLogs", JSON.stringify(logs));
  }, [logs]);

  const day = plans[days][selectedDay] ?? plans[days][0];

  const prMap = useMemo(() => {
    const best: Record<string, LogSet> = {};
    for (const log of logs) {
      const current = best[log.exerciseId];
      const score = log.weightLbs * log.reps;
      const currentScore = current ? current.weightLbs * current.reps : -1;
      if (!current || score > currentScore || (score === currentScore && log.weightLbs > current.weightLbs)) {
        best[log.exerciseId] = log;
      }
    }
    return best;
  }, [logs]);

  function getActiveExercise(baseId: string) {
    const selectedName = activeMap[baseId];
    if (!selectedName || selectedName === exercises[baseId].name) return exercises[baseId];
    const base = exercises[baseId];
    return {
      ...base,
      id: `${baseId}:${selectedName}`,
      name: selectedName,
      tier: base.tier,
      demoQuery: `${selectedName} proper form`
    };
  }

  function saveSet(exerciseId: string) {
    const data = inputs[exerciseId];
    const weightLbs = Number(data?.weightLbs);
    const reps = Number(data?.reps);
    if (!weightLbs || !reps) return;
    setLogs((old) => [...old, { exerciseId, weightLbs, reps, date: new Date().toISOString() }]);
    setInputs((old) => ({ ...old, [exerciseId]: { weightLbs: "", reps: "" } }));
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-50 md:px-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                <Dumbbell size={16} /> A-tier Training Planner
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Jeff Inspired Workout App</h1>
              <p className="mt-3 max-w-2xl text-zinc-400">
                Auto split planner, substitutions, warmup flags, lbs logging and instant PR replacement.
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-950 p-3">
              <label className="mb-2 block text-sm text-zinc-400">Training days</label>
              <select
                value={days}
                onChange={(e) => {
                  setDays(Number(e.target.value) as 3 | 4 | 5);
                  setSelectedDay(0);
                }}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg font-semibold"
              >
                <option value={3}>3 days Full Body</option>
                <option value={4}>4 days Upper Lower</option>
                <option value={5}>5 days Bodypart Split</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {plans[days].map((d, index) => (
            <button
              key={d.title}
              onClick={() => setSelectedDay(index)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                selectedDay === index ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <CalendarDays className="mr-2 inline" size={16} />
              {d.title}
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-2xl font-bold">{day.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {day.focus.map((m) => (
              <span key={m} className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{m}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {day.exerciseIds.map((baseId, index) => {
            const ex = getActiveExercise(baseId);
            const pr = prMap[ex.id] || prMap[baseId];
            const options = [exercises[baseId].name, ...exercises[baseId].alternatives];

            return (
              <article key={`${baseId}-${index}`} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-950 px-3 py-1 text-sm text-zinc-400">#{index + 1}</span>
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm font-bold text-amber-300">{ex.tier} Tier</span>
                      {ex.warmup ? (
                        <span className="rounded-full bg-orange-400/10 px-3 py-1 text-sm text-orange-300">
                          <Flame className="mr-1 inline" size={14} /> Warmup
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400">No specific warmup</span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold">{ex.name}</h3>
                    <p className="mt-2 text-zinc-400">
                      {ex.sets} sets × {ex.reps} reps · lbs
                    </p>
                    {ex.warmupNote && <p className="mt-1 text-sm text-orange-200">{ex.warmupNote}</p>}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {ex.muscles.map((m) => (
                        <span key={m} className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">{m}</span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-zinc-400">
                          <Repeat2 className="mr-1 inline" size={15} /> Substitute if equipment is busy
                        </label>
                        <select
                          value={activeMap[baseId] ?? exercises[baseId].name}
                          onChange={(e) => setActiveMap((old) => ({ ...old, [baseId]: e.target.value }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3"
                        >
                          {options.map((name) => <option key={name}>{name}</option>)}
                        </select>
                      </div>

                      <a
                        href={youtubeSearch(ex.demoQuery)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-3 font-bold text-zinc-950 hover:bg-emerald-300"
                      >
                        <PlayCircle size={18} /> Watch demo
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4">
                    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                      <p className="text-sm text-zinc-400">Current PR</p>
                      <div className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-300">
                        <Trophy size={24} />
                        {pr ? `${pr.weightLbs} lbs × ${pr.reps}` : "No record"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm text-zinc-400">Weight lbs</label>
                        <input
                          inputMode="decimal"
                          value={inputs[ex.id]?.weightLbs ?? ""}
                          onChange={(e) => setInputs((old) => ({ ...old, [ex.id]: { ...(old[ex.id] ?? { reps: "" }), weightLbs: e.target.value } }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3"
                          placeholder="135"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-zinc-400">Reps</label>
                        <input
                          inputMode="numeric"
                          value={inputs[ex.id]?.reps ?? ""}
                          onChange={(e) => setInputs((old) => ({ ...old, [ex.id]: { ...(old[ex.id] ?? { weightLbs: "" }), reps: e.target.value } }))}
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3"
                          placeholder="8"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveSet(ex.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-zinc-950 hover:bg-emerald-300"
                    >
                      <Save size={18} /> Save set and update PR
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}