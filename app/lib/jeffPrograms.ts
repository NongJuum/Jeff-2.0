// Jeff Nippard Training Programs Database
// Extracted and structured from official program PDFs

export type ProgramLevel = "beginner" | "intermediate" | "advanced" | "all";
export type ProgramGoal = "strength" | "hypertrophy" | "powerbuilding" | "fitness" | "fat_loss";
export type ProgramSplit =
  | "full_body"
  | "upper_lower"
  | "push_pull_legs"
  | "bodypart"
  | "at_home"
  | "powerbuilding";
export type ProgramEquipment = "full_gym" | "dumbbells_only" | "bodyweight" | "barbell_rack";

export interface JeffExercise {
  name: string;
  sets: number;
  reps: string;
  rpe?: number;
  rest?: string;
  notes?: string;
  warmupSets?: number;
}

export interface JeffWorkoutDay {
  dayLabel: string; // e.g. "Day 1", "Monday"
  focusLabel: string; // e.g. "Chest & Triceps", "Lower Body"
  exercises: JeffExercise[];
}

export interface JeffProgramWeek {
  weekNumber: number;
  label?: string; // e.g. "Accumulation", "Deload Week"
  days: JeffWorkoutDay[];
}

export interface JeffProgram {
  id: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  level: ProgramLevel[];
  goals: ProgramGoal[];
  split: ProgramSplit;
  equipment: ProgramEquipment;
  daysPerWeek: number;
  durationWeeks: number;
  emoji: string;
  color: string; // Tailwind-compatible gradient or solid
  highlights: string[];
  bestFor: string;
  notFor?: string;
  pdfName: string;
  weeks: JeffProgramWeek[];
  // Scheduled training days (for calendar, 0=Mon...6=Sun)
  defaultScheduleDays: number[];
}

// ─────────────────────────────────────────────────────────────────
// 1. FUNDAMENTALS HYPERTROPHY — FULL BODY (3x/week)
// ─────────────────────────────────────────────────────────────────
const fundamentalsFullBody: JeffProgram = {
  id: "fundamentals_full_body",
  name: "Fundamentals: Full Body",
  shortName: "Fundamentals FB",
  description: "Full body training 3x/week — perfect intro to structured hypertrophy",
  longDescription:
    "Jeff Nippard's science-based Fundamentals Hypertrophy Program Full Body split trains every muscle group each session. 8 weeks of progressive overload with alternating workouts A/B/C to prevent adaptation.",
  level: ["beginner", "intermediate"],
  goals: ["hypertrophy", "fitness"],
  split: "full_body",
  equipment: "full_gym",
  daysPerWeek: 3,
  durationWeeks: 8,
  emoji: "🌱",
  color: "from-emerald-600 to-teal-700",
  highlights: [
    "ฝึกทุกกลุ่มกล้ามเนื้อทุกครั้ง",
    "Progressive overload แบบ linear",
    "เหมาะมือใหม่–กลาง",
    "ใช้เวลา ~60 นาที/ครั้ง",
  ],
  bestFor: "มือใหม่หรือคนที่เพิ่งเริ่มฝึกอย่างจริงจัง",
  notFor: "คนที่ต้องการฝึกมากกว่า 3 วัน/สัปดาห์",
  pdfName: "Fundamentals Hypertrophy Program",
  defaultScheduleDays: [0, 2, 4], // Mon, Wed, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Foundation Block — Weeks 1–4",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Full Body A",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "Sit back and down, 15° toe flare, drive knees out" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "10", rpe: 8, rest: "3-4min", notes: "Bring DB all the way to shoulders, torso upright" },
            { name: "Single-Arm Pulldown", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Start with non-dominant arm, match reps" },
            { name: "Barbell Hip Thrust", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Tuck chin and ribcage, only move hips. Use pad" },
            { name: "Pec Deck", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Keep scapulae retracted, pull inner elbows together" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Protract scapulae, sweep weight out and back" },
            { name: "Cable Lat Raise", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Lean away from machine, arms straight out" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Full Body B",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "3", rpe: 8, rest: "3-4min", warmupSets: 4, notes: "Brace lats, chest tall, hips high, pull slack out first" },
            { name: "Barbell Bench Press", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "45° elbow tuck, squeeze shoulder blades" },
            { name: "Lat Pulldown", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Pull elbows straight down, 1.5-second squeeze at bottom" },
            { name: "Romanian Deadlift", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Neutral lower back, hips back, don't round spine" },
            { name: "Cable Flye", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Scapulae retracted, pull inner elbows together" },
            { name: "DB Lateral Raise", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Control the movement, don't swing" },
            { name: "Crunch", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Focus on flexing spine, don't yank head" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Full Body C",
          exercises: [
            { name: "Front Squat", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "Elbows high and forward, upright torso" },
            { name: "Incline DB Press", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Scapulae retracted and depressed, controlled descent" },
            { name: "Cable Row", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Pull elbows back, squeeze shoulder blades" },
            { name: "Leg Extension", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Squeeze quads to make weight move" },
            { name: "Lying Leg Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Squeeze hamstrings to make weight move" },
            { name: "Rope Face Pull", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Pull to forehead, external rotation at end" },
            { name: "EZ Bar Curl", sets: 3, reps: "10", rpe: 8, rest: "1-2min", notes: "Keep elbows stationary, squeeze biceps at top" },
          ],
        },
      ],
    },
    {
      weekNumber: 5,
      label: "Intensification Block — Weeks 5–8",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Full Body A (Intensification)",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "5", rpe: 8, rest: "3-4min", warmupSets: 4, notes: "Brace lats, chest tall, hips high" },
            { name: "Goblet Squat", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Hold DB under chin, sit back and down" },
            { name: "Barbell Bench Press", sets: 3, reps: "8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "45° elbow tuck, squeeze shoulder blades" },
            { name: "Lat Pulldown", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Pull elbows down to sides" },
            { name: "Leg Press", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Medium foot placement, don't round lower back" },
            { name: "Lying Leg Curl", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Squeeze hamstrings all the way through ROM" },
            { name: "Standing Calf Raise", sets: 3, reps: "8", rpe: 8, rest: "1-2min", notes: "Press to toes, stretch calves at bottom" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Full Body B (Intensification)",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Sit back and down, drive knees out" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "10", rpe: 8, rest: "3-4min", notes: "Full ROM, torso upright" },
            { name: "Single-Arm Pulldown", sets: 3, reps: "12", rpe: 9, rest: "2-3min", notes: "Match reps both arms" },
            { name: "Barbell Hip Thrust", sets: 3, reps: "8", rpe: 9, rest: "2-3min", notes: "Only move hips, use pad" },
            { name: "Pec Deck", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Retract scapulae" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Protract scapulae" },
            { name: "Cable Lat Raise", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Lean away, arms straight" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Full Body C (Intensification)",
          exercises: [
            { name: "Romanian Deadlift", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Keep neutral spine, slow eccentric" },
            { name: "Incline DB Press", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Control descent, powerful press" },
            { name: "Cable Row", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Squeeze shoulder blades at end" },
            { name: "Leg Extension", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Slow eccentric for quad pump" },
            { name: "Bicycle Crunch", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Flex and rotate spine, opposite elbow to knee" },
            { name: "EZ Bar Curl", sets: 3, reps: "10", rpe: 8, rest: "1-2min", notes: "Full ROM, squeeze at top" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Full extension at bottom" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 2. FUNDAMENTALS HYPERTROPHY — UPPER/LOWER (4x/week)
// ─────────────────────────────────────────────────────────────────
const fundamentalsUpperLower: JeffProgram = {
  id: "fundamentals_upper_lower",
  name: "Fundamentals: Upper/Lower",
  shortName: "Fundamentals U/L",
  description: "Upper/Lower split 4x/week — balanced hypertrophy approach",
  longDescription:
    "Jeff's Fundamentals Upper/Lower split provides twice-per-week frequency for each muscle group. Ideal progression from full body training with more exercise variety.",
  level: ["beginner", "intermediate"],
  goals: ["hypertrophy", "fitness"],
  split: "upper_lower",
  equipment: "full_gym",
  daysPerWeek: 4,
  durationWeeks: 8,
  emoji: "💪",
  color: "from-blue-600 to-indigo-700",
  highlights: [
    "แบ่งซ้อนท่อน บน/ล่าง",
    "ฝึกแต่ละกลุ่ม 2x/สัปดาห์",
    "เหมาะระดับกลาง",
    "Progressive overload ชัดเจน",
  ],
  bestFor: "คนที่ฝึกมาแล้ว 6+ เดือนและต้องการ volume มากขึ้น",
  pdfName: "Fundamentals Hypertrophy Program",
  defaultScheduleDays: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Foundation Block",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Lower Body A",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "Sit back and down, 15° toe flare, drive knees out" },
            { name: "Romanian Deadlift", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Neutral lower back, set hips back, no rounding" },
            { name: "Barbell Hip Thrust", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Chin and ribcage down, only move hips. Use pad" },
            { name: "Leg Extension", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Squeeze quads to move the weight" },
            { name: "Lying Leg Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Squeeze hamstrings through the movement" },
            { name: "Machine Hip Abduction", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Keep butt in seat, squeeze glutes" },
            { name: "Crunch", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Focus on spine flexion, don't pull neck" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Upper Body A",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "5", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "45° elbow tuck, stay firm on bench" },
            { name: "Lat Pulldown", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Pull elbows down, 1.5-second squeeze" },
            { name: "Dumbbell Overhead Press", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Neutral grip, press overhead" },
            { name: "Cable Row", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Pull elbows back, squeeze shoulder blades" },
            { name: "Pec Deck", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Retract scapulae, pull inner elbows" },
            { name: "DB Lateral Raise", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Control the movement, slight forward lean" },
            { name: "Rope Face Pull", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Pull to forehead height" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Lower Body B",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "5", rpe: 8, rest: "3-4min", warmupSets: 4, notes: "Brace lats, chest tall, pull slack before lift" },
            { name: "Leg Press", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Medium foot placement, no lower back rounding" },
            { name: "Lying Leg Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Squeeze hamstrings through ROM" },
            { name: "Leg Extension", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Slow eccentric for quad pump" },
            { name: "Standing Calf Raise", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Full stretch at bottom, press all the way up" },
            { name: "Crunch", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Controlled, focus on abs" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Upper Body B",
          exercises: [
            { name: "Incline DB Press", sets: 3, reps: "8", rpe: 8, rest: "3-4min", notes: "Scapulae retracted and depressed" },
            { name: "Weighted Pull Up", sets: 3, reps: "5", rpe: 8, rest: "3-4min", warmupSets: 2, notes: "Dead hang start, full ROM" },
            { name: "Cable Row", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Neutral grip, pull elbows back" },
            { name: "DB Rear Delt Flye", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Slight bend in elbows, squeeze rear delts" },
            { name: "Cable Lat Raise", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Lean away, arms straight out" },
            { name: "EZ Bar Curl", sets: 3, reps: "10", rpe: 8, rest: "1-2min", notes: "Elbows stationary, squeeze at top" },
            { name: "Overhead Cable Ext", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Full stretch overhead, squeeze at extension" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 3. FUNDAMENTALS HYPERTROPHY — BODY PART SPLIT (5x/week)
// ─────────────────────────────────────────────────────────────────
const fundamentalsBodypart: JeffProgram = {
  id: "fundamentals_bodypart",
  name: "Fundamentals: Bodypart Split",
  shortName: "Fundamentals Bodypart",
  description: "Classic 5-day bodypart split — chest/back/legs/shoulders/arms",
  longDescription:
    "Jeff's Fundamentals Bodypart Split follows the classic Chest+Tri / Back+Bi / Legs / Shoulders / Arms structure over 8 weeks with progressive overload every 4 weeks.",
  level: ["intermediate", "advanced"],
  goals: ["hypertrophy"],
  split: "bodypart",
  equipment: "full_gym",
  daysPerWeek: 5,
  durationWeeks: 8,
  emoji: "🏋️",
  color: "from-purple-600 to-violet-700",
  highlights: [
    "Classic 5-day bodypart split",
    "High volume per muscle group",
    "8 weeks progressive overload",
    "เหมาะระดับกลาง-สูง",
  ],
  bestFor: "คนที่ฝึกมาแล้ว 1+ ปี และต้องการ volume สูงต่อกลุ่มกล้าม",
  pdfName: "Fundamentals Hypertrophy Program",
  defaultScheduleDays: [0, 1, 2, 3, 4], // Mon-Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Foundation Block — Weeks 1–4",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Chest & Triceps",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "45° elbow tuck, squeeze shoulder blades, stay firm on bench" },
            { name: "Incline DB Press", sets: 3, reps: "8", rpe: 8, rest: "2-3min", notes: "Keep scapulae retracted and depressed" },
            { name: "Cable Flye", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Keep scapulae retracted, pull inner elbows together" },
            { name: "Weighted Dip", sets: 3, reps: "10", rpe: 7, rest: "1-2min", notes: "45° elbow tuck, lean torso forward 15°" },
            { name: "DB Skullcrusher", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Keep elbows inline with top of head" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Full extension at bottom" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Back & Biceps",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "5", rpe: 8, rest: "3-4min", warmupSets: 4, notes: "Brace lats, chest tall, hips high" },
            { name: "Weighted Pull Up", sets: 3, reps: "6", rpe: 8, rest: "3-4min", warmupSets: 2, notes: "Full ROM, dead hang start" },
            { name: "Cable Row", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Pull elbows back, squeeze shoulder blades" },
            { name: "DB Rear Delt Flye", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Slight bend in elbows, squeeze rear delts" },
            { name: "EZ Bar Curl", sets: 3, reps: "10", rpe: 8, rest: "1-2min", notes: "Elbows stationary, squeeze at top" },
            { name: "Incline Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Full stretch at bottom, squeeze at top" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Legs",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "Sit back and down, 15° toe flare" },
            { name: "Romanian Deadlift", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Neutral spine, hips back, no rounding" },
            { name: "Leg Press", sets: 3, reps: "12", rpe: 8, rest: "2-3min", notes: "Medium foot placement" },
            { name: "Lying Leg Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Squeeze hamstrings through ROM" },
            { name: "Leg Extension", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Squeeze quads at top" },
            { name: "Standing Calf Raise", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Full stretch at bottom" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Shoulders",
          exercises: [
            { name: "Barbell Overhead Press", sets: 3, reps: "6", rpe: 7, rest: "3-4min", warmupSets: 3, notes: "Squeeze glutes, press up and slightly back" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "10", rpe: 8, rest: "2-3min", notes: "Full ROM to shoulders" },
            { name: "DB Lateral Raise", sets: 4, reps: "15", rpe: 9, rest: "1-2min", notes: "Arms straight out to sides" },
            { name: "Cable Lat Raise", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Lean away, constant tension" },
            { name: "Rope Face Pull", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Pull to forehead, external rotation" },
            { name: "DB Shrug", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Full ROM up and down" },
          ],
        },
        {
          dayLabel: "Day 5",
          focusLabel: "Arms",
          exercises: [
            { name: "EZ Bar Curl", sets: 3, reps: "10", rpe: 8, rest: "1-2min", notes: "Elbows stationary, squeeze at top" },
            { name: "Incline Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Full stretch, no swinging" },
            { name: "Machine Preacher Curl", sets: 3, reps: "12", rpe: 9, rest: "1-2min", notes: "Full ROM, squeeze at top" },
            { name: "DB Hammer Curl", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Neutral grip, keep elbows back" },
            { name: "Overhead Cable Ext", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Full stretch at top, squeeze at bottom" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15", rpe: 9, rest: "1-2min", notes: "Full extension, spread rope at bottom" },
            { name: "Barbell Skullcrusher", sets: 3, reps: "10", rpe: 8, rest: "1-2min", notes: "Keep elbows inline, control descent" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 4. POWERBUILDING 3.0 (5x/week)
// ─────────────────────────────────────────────────────────────────
const powerbuilding30: JeffProgram = {
  id: "powerbuilding_30",
  name: "Powerbuilding 3.0",
  shortName: "Powerbuilding 3.0",
  description: "Combine strength + size — squat/bench/deadlift + hypertrophy work",
  longDescription:
    "Jeff Nippard's signature Powerbuilding 3.0 program combines the Big 3 powerlifts with strategic hypertrophy accessories. Uses block periodization with accumulation and intensification phases over 10 weeks.",
  level: ["intermediate", "advanced"],
  goals: ["powerbuilding", "strength", "hypertrophy"],
  split: "powerbuilding",
  equipment: "barbell_rack",
  daysPerWeek: 5,
  durationWeeks: 10,
  emoji: "⚡",
  color: "from-amber-500 to-orange-600",
  highlights: [
    "Squat + Bench + Deadlift หนักทุกสัปดาห์",
    "Block Periodization 10 สัปดาห์",
    "เพิ่มทั้ง strength และ size",
    "Deload สัปดาห์ที่ 5 และ 10",
  ],
  bestFor: "คนที่ต้องการแข็งแกร่งและใหญ่ขึ้นพร้อมกัน",
  notFor: "มือใหม่หรือคนที่ยังไม่ชำนาญ Big 3",
  pdfName: "Powerbuilding 3.0",
  defaultScheduleDays: [0, 1, 2, 3, 4], // Mon-Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Accumulation Block 1 (Weeks 1–4)",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Squat + Shoulders + Arms",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "6", rpe: 7, rest: "3-5min", warmupSets: 4, notes: "75% 1RM, sit back and down, upper back tight to bar" },
            { name: "Barbell Overhead Press", sets: 3, reps: "8", rpe: 7, rest: "2-3min", warmupSets: 3, notes: "Squeeze glutes, press up and slightly back" },
            { name: "Romanian Deadlift", sets: 2, reps: "8-10", rpe: 7, rest: "2-3min", notes: "Short ROM, set hips back, keep shins vertical" },
            { name: "Cable Lat Raise", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Focus on contracting delts" },
            { name: "Rope Face Pull", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Mind-muscle with rear delts" },
            { name: "EZ Bar Curl", sets: 3, reps: "10", rpe: 9, rest: "1-2min", notes: "Squeeze biceps at top" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Bench + Hypertrophy",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "5", rpe: 7, rest: "3-5min", warmupSets: 4, notes: "75% 1RM, tuck elbows, leg drive" },
            { name: "Incline DB Press", sets: 3, reps: "8-10", rpe: 8, rest: "2-3min", notes: "Scapulae retracted and depressed" },
            { name: "Pec Deck", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Squeeze inner elbows together" },
            { name: "Chest Supported Row", sets: 3, reps: "8-10", rpe: 9, rest: "1-2min", notes: "Minimize cheating, pull elbows back" },
            { name: "Overhead Cable Ext", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Constant tension on triceps" },
            { name: "Incline Curl", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Full stretch at bottom" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Deadlift + Back",
          exercises: [
            { name: "Deadlift", sets: 2, reps: "4", rpe: 7, rest: "3-5min", warmupSets: 4, notes: "77.5% 1RM, pull slack out before lifting" },
            { name: "Pause Deadlift", sets: 3, reps: "3", rpe: 7, rest: "2-4min", notes: "70% 1RM, 1-second pause at bottom" },
            { name: "Lat Pulldown", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Pull elbows to sides, 1.5-second squeeze" },
            { name: "Cable Row", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Neutral grip, pull elbows back" },
            { name: "Straight Arm Pulldown", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Constant tension on lats" },
            { name: "DB Hammer Curl", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Neutral grip, control throughout" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Squat Accessory + Legs",
          exercises: [
            { name: "Hack Squat", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Full depth, drive through heels" },
            { name: "Lying Leg Curl", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Squeeze hamstrings through ROM" },
            { name: "Leg Extension", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Slow eccentric" },
            { name: "Machine Hip Thrust", sets: 3, reps: "10-12", rpe: 8, rest: "1-2min", notes: "Only move hips" },
            { name: "Seated Calf Raise", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Full stretch at bottom" },
            { name: "Crunch", sets: 3, reps: "15-20", rpe: 8, rest: "1-2min", notes: "Control spine flexion" },
          ],
        },
        {
          dayLabel: "Day 5",
          focusLabel: "Bench Accessory + Shoulders",
          exercises: [
            { name: "Incline Smith Machine Bench", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Slightly wider grip, controlled descent" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Full ROM, press overhead" },
            { name: "Cable Lat Raise", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Lean away, arms straight out" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Protract scapulae, sweep weight back" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Spread rope at bottom for full extension" },
            { name: "Barbell Skullcrusher", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Keep elbows inline with head" },
          ],
        },
      ],
    },
    {
      weekNumber: 5,
      label: "Semi-Deload Week",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Squat + Overhead (Light)",
          exercises: [
            { name: "Back Squat", sets: 2, reps: "5", rpe: 5, rest: "3-5min", warmupSets: 4, notes: "75% 1RM, AVOID FAILURE this week" },
            { name: "Barbell Overhead Press", sets: 2, reps: "8", rpe: 6, rest: "2-3min", notes: "70% 1RM, focus on technique" },
            { name: "Romanian Deadlift", sets: 2, reps: "8-10", rpe: 6, rest: "2-3min", notes: "Lighter weight, focus on form" },
            { name: "Chest Supported Row", sets: 3, reps: "8-10", rpe: 9, rest: "1-2min", notes: "Can go heavier on accessories" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 5. COMEBACK PROGRAM — PPL (6x/week)
// ─────────────────────────────────────────────────────────────────
const comebackPPL: JeffProgram = {
  id: "comeback_ppl",
  name: "Comeback: Push/Pull/Legs",
  shortName: "Comeback PPL",
  description: "Return from a training break — Push/Pull/Legs 6x/week bridge program",
  longDescription:
    "Jeff's Comeback Program is designed to bridge the gap from detraining back to full progressive training. The PPL variant runs 6 days/week with lower intensity in weeks 1-2, ramping up progressively.",
  level: ["intermediate", "advanced"],
  goals: ["hypertrophy", "fitness"],
  split: "push_pull_legs",
  equipment: "full_gym",
  daysPerWeek: 6,
  durationWeeks: 4,
  emoji: "🔄",
  color: "from-cyan-600 to-sky-700",
  highlights: [
    "กลับมาฝึกหลังหยุดพัก",
    "PPL 6 วัน/สัปดาห์",
    "ค่อยๆ เพิ่ม intensity",
    "ใช้ได้หลังหยุดฝึก 1+ เดือน",
  ],
  bestFor: "คนที่กลับมาฝึกหลังหยุดพักนาน 1 เดือนขึ้นไป",
  notFor: "คนที่ฝึกต่อเนื่องไม่ได้หยุด",
  pdfName: "Comeback Program",
  defaultScheduleDays: [0, 1, 2, 3, 4, 5], // Mon-Sat
  weeks: [
    {
      weekNumber: 1,
      label: "Re-Introduction Week",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Push A",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "10", rpe: 7, rest: "2-3min", warmupSets: 3, notes: "50-60% 1RM, focus on technique" },
            { name: "Incline DB Press", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Controlled movement, light weight" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Full ROM, not to failure" },
            { name: "Cable Lat Raise", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Light weight, mind-muscle connection" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Controlled tempo" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Pull A",
          exercises: [
            { name: "Weighted Pull Up", sets: 3, reps: "8", rpe: 7, rest: "2-3min", warmupSets: 2, notes: "Bodyweight or light, focus on form" },
            { name: "Cable Row", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Squeeze shoulder blades" },
            { name: "Lat Pulldown", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Pull elbows down to sides" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Rear delt focus" },
            { name: "EZ Bar Curl", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Light weight, feel the muscle" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Legs A",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "10", rpe: 7, rest: "2-3min", warmupSets: 3, notes: "50% 1RM, technique focus" },
            { name: "Romanian Deadlift", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Light weight, feel the stretch" },
            { name: "Leg Extension", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Light, controlled" },
            { name: "Lying Leg Curl", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Squeeze hamstrings" },
            { name: "Standing Calf Raise", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Full ROM" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Push B",
          exercises: [
            { name: "Incline DB Press", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Slight increase from Day 1" },
            { name: "Machine Chest Press", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Controlled movement" },
            { name: "Cable Lat Raise", sets: 4, reps: "15", rpe: 8, rest: "1-2min", notes: "Consistent tension" },
            { name: "Overhead Cable Ext", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Full stretch on triceps" },
          ],
        },
        {
          dayLabel: "Day 5",
          focusLabel: "Pull B",
          exercises: [
            { name: "Chest Supported Row", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Minimize momentum" },
            { name: "Neutral Grip Lat Pull Down", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Full stretch at top" },
            { name: "Cable Lat Raise", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Rear delt isolation" },
            { name: "Incline Curl", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Full stretch" },
            { name: "DB Hammer Curl", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Neutral grip" },
          ],
        },
        {
          dayLabel: "Day 6",
          focusLabel: "Legs B",
          exercises: [
            { name: "Leg Press", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Medium foot placement" },
            { name: "Bulgarian Split Squat", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Bodyweight or light DBs" },
            { name: "Lying Leg Curl", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Slow eccentric" },
            { name: "Machine Hip Thrust", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Only move hips" },
            { name: "Seated Calf Raise", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Full stretch" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 6. COMEBACK PROGRAM — UPPER/LOWER (4x/week)
// ─────────────────────────────────────────────────────────────────
const comebackUpperLower: JeffProgram = {
  id: "comeback_upper_lower",
  name: "Comeback: Upper/Lower",
  shortName: "Comeback U/L",
  description: "Return from a training break — Upper/Lower 4x/week bridge program",
  longDescription:
    "The 4-day Comeback Upper/Lower bridge uses the same progressive re-introduction philosophy but suits those with 4 training days available.",
  level: ["beginner", "intermediate"],
  goals: ["hypertrophy", "fitness"],
  split: "upper_lower",
  equipment: "full_gym",
  daysPerWeek: 4,
  durationWeeks: 4,
  emoji: "🔄",
  color: "from-teal-600 to-cyan-700",
  highlights: [
    "กลับมาฝึกหลังหยุดพัก",
    "Upper/Lower 4 วัน/สัปดาห์",
    "ความเข้มน้อยกว่า PPL version",
    "ใช้ได้หลังหยุดฝึก 1+ เดือน",
  ],
  bestFor: "คนที่กลับมาฝึกและมีเวลาฝึกแค่ 4 วัน/สัปดาห์",
  notFor: "คนที่ฝึกต่อเนื่องไม่ได้หยุด",
  pdfName: "Comeback Program",
  defaultScheduleDays: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Re-Introduction Week",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Upper A",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "10", rpe: 7, rest: "2-3min", warmupSets: 3, notes: "50-60% 1RM, technique focus" },
            { name: "Lat Pulldown", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Pull elbows down" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Full ROM" },
            { name: "Cable Row", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Squeeze shoulder blades" },
            { name: "Cable Lat Raise", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Light, mind-muscle" },
            { name: "EZ Bar Curl", sets: 3, reps: "12", rpe: 7, rest: "1-2min", notes: "Controlled" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Full extension" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Lower A",
          exercises: [
            { name: "Back Squat", sets: 3, reps: "10", rpe: 7, rest: "2-3min", warmupSets: 3, notes: "50% 1RM, technique" },
            { name: "Romanian Deadlift", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Light, feel the stretch" },
            { name: "Leg Extension", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Light, controlled" },
            { name: "Lying Leg Curl", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Hamstring squeeze" },
            { name: "Standing Calf Raise", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Full ROM" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Upper B",
          exercises: [
            { name: "Incline DB Press", sets: 3, reps: "10", rpe: 7, rest: "2-3min", notes: "Upper chest focus" },
            { name: "Weighted Pull Up", sets: 3, reps: "8", rpe: 7, rest: "2-3min", warmupSets: 2, notes: "Bodyweight if needed" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Rear delt" },
            { name: "Pec Deck", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Squeeze at center" },
            { name: "Overhead Cable Ext", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Triceps stretch" },
            { name: "Incline Curl", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Biceps stretch" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Lower B",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "8", rpe: 7, rest: "3-4min", warmupSets: 4, notes: "50% 1RM, technique focus" },
            { name: "Leg Press", sets: 3, reps: "12", rpe: 7, rest: "2-3min", notes: "Medium stance" },
            { name: "Lying Leg Curl", sets: 3, reps: "12", rpe: 8, rest: "1-2min", notes: "Slow and controlled" },
            { name: "Machine Hip Thrust", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Glute squeeze" },
            { name: "Seated Calf Raise", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Full stretch" },
            { name: "Cable Crunch", sets: 3, reps: "15", rpe: 8, rest: "1-2min", notes: "Spine flexion focus" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 7. THE ESSENTIALS PROGRAM (3x/week)
// ─────────────────────────────────────────────────────────────────
const essentials3x: JeffProgram = {
  id: "essentials_3x",
  name: "The Essentials Program",
  shortName: "Essentials 3x",
  description: "Core essential movements 3x/week — for time-constrained lifters",
  longDescription:
    "Jeff's Essentials Program focuses on the most effective movements per muscle group in a 3x/week full-body format. Perfect for busy individuals who want maximum results with minimum time.",
  level: ["beginner", "intermediate"],
  goals: ["hypertrophy", "fitness", "strength"],
  split: "full_body",
  equipment: "full_gym",
  daysPerWeek: 3,
  durationWeeks: 12,
  emoji: "⏱️",
  color: "from-green-600 to-emerald-700",
  highlights: [
    "เน้นท่าที่คุ้มค่าที่สุด",
    "ฝึก 3 วัน/สัปดาห์",
    "~45-60 นาที/ครั้ง",
    "เหมาะคนมีเวลาจำกัด",
  ],
  bestFor: "คนยุ่งที่ต้องการผลลัพธ์สูงสุดในเวลาน้อยที่สุด",
  pdfName: "The Essentials Program - 3xweek",
  defaultScheduleDays: [0, 2, 4], // Mon, Wed, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Phase 1 — Building the Base",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Essential Full Body A",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Key upper body strength movement" },
            { name: "Back Squat", sets: 3, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Primary lower body compound" },
            { name: "Weighted Pull Up", sets: 3, reps: "6-8", rpe: 8, rest: "2-3min", warmupSets: 2, notes: "Best vertical pull for lat width" },
            { name: "Romanian Deadlift", sets: 3, reps: "8-10", rpe: 8, rest: "2-3min", notes: "Hip hinge pattern mastery" },
            { name: "Pec Deck", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Chest isolation finisher" },
            { name: "Cable Lat Raise", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Side delt isolation" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Essential Full Body B",
          exercises: [
            { name: "Deadlift", sets: 2, reps: "4-6", rpe: 8, rest: "3-5min", warmupSets: 4, notes: "Key strength indicator and total body builder" },
            { name: "Barbell Overhead Press", sets: 3, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Overhead strength and shoulder mass" },
            { name: "Chest Supported Row", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Horizontal pull for back thickness" },
            { name: "Leg Press", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Quad dominant lower body" },
            { name: "Seated Hamstring Curl", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Best hamstring isolation" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Rear delt health and thickness" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Essential Full Body C",
          exercises: [
            { name: "Incline DB Press", sets: 3, reps: "8-10", rpe: 8, rest: "3-4min", notes: "Upper chest development" },
            { name: "Hack Squat", sets: 3, reps: "8-12", rpe: 8, rest: "3-4min", warmupSets: 2, notes: "Best quad builder in gym" },
            { name: "Neutral Grip Lat Pull Down", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Lat width and thickness" },
            { name: "Seated Hamstring Curl", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Hamstring isolation" },
            { name: "Machine Shoulder Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Shoulder pressing strength" },
            { name: "Face Away Bayesian Curl", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Biceps stretch position" },
            { name: "Overhead Cable Ext", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Triceps long head stretch" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 8. PURE BODYBUILDING PHASE 2 (5x/week)
// ─────────────────────────────────────────────────────────────────
const pureBodybuildingPhase2: JeffProgram = {
  id: "pure_bodybuilding_p2",
  name: "Pure Bodybuilding Phase 2",
  shortName: "Pure BB Phase 2",
  description: "Advanced bodybuilding split — maximum hypertrophy focus",
  longDescription:
    "Jeff Nippard's Pure Bodybuilding Phase 2 is designed for intermediate-advanced lifters seeking maximum muscle hypertrophy. Features an optimized bodypart split with high weekly volume.",
  level: ["intermediate", "advanced"],
  goals: ["hypertrophy"],
  split: "bodypart",
  equipment: "full_gym",
  daysPerWeek: 5,
  durationWeeks: 12,
  emoji: "💎",
  color: "from-pink-600 to-rose-700",
  highlights: [
    "Volume สูงสุดต่อกลุ่มกล้าม",
    "Advanced techniques",
    "12 สัปดาห์",
    "เหมาะ intermediate-advanced",
  ],
  bestFor: "คนที่ฝึกมาแล้ว 2+ ปี และต้องการ maximize muscle growth",
  notFor: "มือใหม่และ intermediate ที่ยังไม่ชำนาญ technique",
  pdfName: "Pure Bodybuilding Phase 2",
  defaultScheduleDays: [0, 1, 2, 3, 4], // Mon-Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Accumulation Phase",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Chest + Triceps",
          exercises: [
            { name: "Barbell Bench Press", sets: 4, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 4, notes: "Control eccentric, explosive concentric" },
            { name: "Incline DB Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Upper chest focus, scapulae retracted" },
            { name: "Incline Machine Bench", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Stretch at bottom, squeeze at top" },
            { name: "Pec Deck", sets: 4, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Constant tension, inner elbows together" },
            { name: "Seated Cable Pec Flye", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Maximum chest stretch" },
            { name: "Overhead Cable Ext", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Full stretch on long head" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Spread rope at bottom" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Back + Biceps",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "4-6", rpe: 8, rest: "3-5min", warmupSets: 4, notes: "Strength focus" },
            { name: "Weighted Pull Up", sets: 4, reps: "6-8", rpe: 8, rest: "2-3min", warmupSets: 2, notes: "Full ROM" },
            { name: "Chest Supported Row", sets: 4, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Minimize momentum" },
            { name: "Iso-Lateral Pulldown", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Alternating arms" },
            { name: "Straight Arm Pulldown", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Lat isolation" },
            { name: "DB Shrug", sets: 3, reps: "12-15", rpe: 8, rest: "1-2min", notes: "Full ROM up and back" },
            { name: "Face Away Bayesian Curl", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Maximum stretch" },
            { name: "Incline Curl", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Full stretch at bottom" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Shoulders",
          exercises: [
            { name: "Barbell Overhead Press", sets: 4, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Strength movement for shoulders" },
            { name: "Machine Shoulder Press", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Constant tension" },
            { name: "Cable Lat Raise", sets: 4, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Lean away, maximum side delt activation" },
            { name: "Behind Back Cable Lat Raise", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Different angle for side delts" },
            { name: "Reverse Pec Deck", sets: 4, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Rear delt mass builder" },
            { name: "Rope Face Pull", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "External rotation health" },
            { name: "DB Shrug", sets: 3, reps: "12-15", rpe: 8, rest: "1-2min", notes: "Upper traps" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Legs",
          exercises: [
            { name: "Hack Squat", sets: 4, reps: "8-12", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Quad-dominant, full depth" },
            { name: "Romanian Deadlift", sets: 3, reps: "8-10", rpe: 8, rest: "2-3min", notes: "Hamstring stretch focus" },
            { name: "Leg Press", sets: 3, reps: "10-15", rpe: 8, rest: "2-3min", notes: "Volume work for quads" },
            { name: "Seated Hamstring Curl", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Best hamstring isolation" },
            { name: "Leg Extension", sets: 4, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Quad isolation" },
            { name: "Machine Hip Thrust", sets: 3, reps: "10-12", rpe: 8, rest: "1-2min", notes: "Glute focus" },
            { name: "Seated Calf Raise", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Soleus focus" },
          ],
        },
        {
          dayLabel: "Day 5",
          focusLabel: "Arms",
          exercises: [
            { name: "EZ Bar Curl", sets: 4, reps: "8-12", rpe: 8, rest: "1-2min", notes: "Strength movement for biceps" },
            { name: "Incline Curl", sets: 3, reps: "10-12", rpe: 9, rest: "1-2min", notes: "Long head stretch" },
            { name: "Machine Preacher Curl", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Peak contraction" },
            { name: "Face Away Bayesian Curl", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Maximum stretch" },
            { name: "DB Hammer Curl", sets: 3, reps: "12-15", rpe: 8, rest: "1-2min", notes: "Brachialis and brachioradialis" },
            { name: "Barbell Skullcrusher", sets: 4, reps: "8-12", rpe: 8, rest: "1-2min", notes: "Triceps mass builder" },
            { name: "Overhead Cable Ext", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Long head emphasis" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Pump finisher" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 9. BODYBUILDING TRANSFORMATION SYSTEM — BEGINNER (3x/week)
// ─────────────────────────────────────────────────────────────────
const bbTransformationBeginner: JeffProgram = {
  id: "bb_transformation_beginner",
  name: "Bodybuilding Transformation: Beginner",
  shortName: "BB Transform Beginner",
  description: "Complete beginner bodybuilding system — builds from ground up",
  longDescription:
    "Jeff Nippard's Bodybuilding Transformation System for beginners. A comprehensive program designed to teach fundamental movement patterns, build a base of strength, and start hypertrophy.",
  level: ["beginner"],
  goals: ["hypertrophy", "fitness"],
  split: "full_body",
  equipment: "full_gym",
  daysPerWeek: 3,
  durationWeeks: 16,
  emoji: "🌱",
  color: "from-lime-600 to-green-700",
  highlights: [
    "ระบบครบสำหรับมือใหม่",
    "เน้นเทคนิคที่ถูกต้อง",
    "16 สัปดาห์ transformation",
    "ฝึก 3 วัน/สัปดาห์",
  ],
  bestFor: "มือใหม่สมบูรณ์ที่ต้องการระบบครบตั้งแต่ต้น",
  pdfName: "The_Bodybuilding_Transformation_System_-_Beginner",
  defaultScheduleDays: [0, 2, 4], // Mon, Wed, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Foundation Phase — Technique Focus",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Full Body A",
          exercises: [
            { name: "Hack Squat", sets: 3, reps: "8-12", rpe: 7, rest: "3-4min", warmupSets: 2, notes: "Learn the pattern, control every rep" },
            { name: "Machine Chest Press", sets: 3, reps: "8-12", rpe: 7, rest: "2-3min", notes: "Find the right seat position" },
            { name: "Chest Supported Row", sets: 3, reps: "8-12", rpe: 7, rest: "2-3min", notes: "Focus on squeeze, minimize momentum" },
            { name: "Machine Shoulder Press", sets: 3, reps: "10-12", rpe: 7, rest: "2-3min", notes: "Full ROM, control descent" },
            { name: "Seated Hamstring Curl", sets: 3, reps: "10-15", rpe: 7, rest: "1-2min", notes: "Squeeze hamstrings throughout" },
            { name: "Cable Lat Raise", sets: 3, reps: "15-20", rpe: 7, rest: "1-2min", notes: "Light weight, feel the muscle" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Full Body B",
          exercises: [
            { name: "Romanian Deadlift", sets: 3, reps: "8-10", rpe: 7, rest: "3-4min", notes: "Hip hinge pattern, neutral spine" },
            { name: "Neutral Grip Lat Pull Down", sets: 3, reps: "10-12", rpe: 7, rest: "2-3min", notes: "Pull elbows down to sides" },
            { name: "Incline DB Press", sets: 3, reps: "10-12", rpe: 7, rest: "2-3min", notes: "Controlled, feel upper chest" },
            { name: "Leg Extension", sets: 3, reps: "12-15", rpe: 7, rest: "1-2min", notes: "Quad squeeze at top" },
            { name: "Pec Deck", sets: 3, reps: "12-15", rpe: 7, rest: "1-2min", notes: "Slow and controlled" },
            { name: "Overhead Cable Ext", sets: 3, reps: "12-15", rpe: 7, rest: "1-2min", notes: "Feel the stretch on triceps" },
            { name: "EZ Bar Curl", sets: 3, reps: "10-12", rpe: 7, rest: "1-2min", notes: "Elbow stationary, squeeze at top" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Full Body C",
          exercises: [
            { name: "45° Leg Press", sets: 3, reps: "10-15", rpe: 7, rest: "2-3min", notes: "Medium foot placement, full ROM" },
            { name: "Cable Row", sets: 3, reps: "10-12", rpe: 7, rest: "2-3min", notes: "Squeeze shoulder blades" },
            { name: "Incline Machine Bench", sets: 3, reps: "10-12", rpe: 7, rest: "2-3min", notes: "Upper chest focus" },
            { name: "Lying Leg Curl", sets: 3, reps: "12-15", rpe: 7, rest: "1-2min", notes: "Slow eccentric" },
            { name: "Rope Face Pull", sets: 3, reps: "15-20", rpe: 7, rest: "1-2min", notes: "Rear delt and rotator cuff" },
            { name: "Face Away Bayesian Curl", sets: 3, reps: "12-15", rpe: 7, rest: "1-2min", notes: "Stretch at bottom" },
            { name: "Cable Crunch", sets: 3, reps: "15-20", rpe: 7, rest: "1-2min", notes: "Spine flexion, not hip flexion" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 10. BODYBUILDING TRANSFORMATION SYSTEM — INTERMEDIATE/ADVANCED
// ─────────────────────────────────────────────────────────────────
const bbTransformationIntAdv: JeffProgram = {
  id: "bb_transformation_int_adv",
  name: "Bodybuilding Transformation: Int/Adv",
  shortName: "BB Transform Int/Adv",
  description: "Advanced transformation system — maximize muscle and fat loss simultaneously",
  longDescription:
    "Jeff Nippard's Bodybuilding Transformation System for Intermediate and Advanced lifters. Higher volume, more complex training techniques, and more specific periodization over 16 weeks.",
  level: ["intermediate", "advanced"],
  goals: ["hypertrophy", "fat_loss"],
  split: "bodypart",
  equipment: "full_gym",
  daysPerWeek: 5,
  durationWeeks: 16,
  emoji: "🔥",
  color: "from-orange-500 to-red-600",
  highlights: [
    "สร้างกล้ามและลดไขมันพร้อมกัน",
    "Advanced periodization",
    "16 สัปดาห์ transformation",
    "5 วัน/สัปดาห์",
  ],
  bestFor: "คนที่ฝึกมาแล้ว 1+ ปี ต้องการ body recomposition อย่างจริงจัง",
  pdfName: "The_Bodybuilding_Transformation_System_-_Intermediate_Advanced",
  defaultScheduleDays: [0, 1, 2, 3, 4],
  weeks: [
    {
      weekNumber: 1,
      label: "Foundation Phase",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Chest + Shoulders (Push)",
          exercises: [
            { name: "Barbell Bench Press", sets: 4, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 4, notes: "Primary chest strength" },
            { name: "Incline DB Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Upper chest development" },
            { name: "Pec Deck", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Chest isolation" },
            { name: "Dumbbell Seated Shoulder Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Shoulder overhead strength" },
            { name: "Cable Lat Raise", sets: 4, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Side delt isolation" },
            { name: "Rope Face Pull", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Shoulder health" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Back + Biceps (Pull)",
          exercises: [
            { name: "Deadlift", sets: 3, reps: "5-6", rpe: 8, rest: "3-5min", warmupSets: 4, notes: "Strength focus" },
            { name: "Chest Supported Row", sets: 4, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Back thickness" },
            { name: "Weighted Pull Up", sets: 3, reps: "6-8", rpe: 8, rest: "2-3min", warmupSets: 2, notes: "Lat width" },
            { name: "Neutral Grip Lat Pull Down", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Volume work" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Rear delt" },
            { name: "Face Away Bayesian Curl", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Biceps stretch" },
            { name: "EZ Bar Curl", sets: 3, reps: "10-12", rpe: 8, rest: "1-2min", notes: "Biceps strength" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Legs (Quad Focus)",
          exercises: [
            { name: "Hack Squat", sets: 4, reps: "8-12", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Primary quad builder" },
            { name: "45° Leg Press", sets: 3, reps: "10-15", rpe: 8, rest: "2-3min", notes: "Volume for quads" },
            { name: "Leg Extension", sets: 4, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Quad isolation" },
            { name: "Romanian Deadlift", sets: 3, reps: "8-10", rpe: 8, rest: "2-3min", notes: "Hamstring stretch" },
            { name: "Seated Hamstring Curl", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Hamstring isolation" },
            { name: "Standing Calf Raise", sets: 4, reps: "8-15", rpe: 9, rest: "1-2min", notes: "Gastroc focus" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Shoulders + Triceps",
          exercises: [
            { name: "Barbell Overhead Press", sets: 4, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Shoulder strength" },
            { name: "Cable Lat Raise", sets: 4, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Side delt" },
            { name: "Behind Back Cable Lat Raise", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Side delt from different angle" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Rear delt" },
            { name: "Overhead Cable Ext", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Triceps long head" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Triceps pump" },
            { name: "Barbell Skullcrusher", sets: 3, reps: "8-12", rpe: 8, rest: "1-2min", notes: "Triceps mass" },
          ],
        },
        {
          dayLabel: "Day 5",
          focusLabel: "Legs (Posterior Focus) + Abs",
          exercises: [
            { name: "Romanian Deadlift", sets: 4, reps: "8-10", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Hamstring and glute dominant" },
            { name: "Machine Hip Thrust", sets: 4, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Maximum glute activation" },
            { name: "Seated Hamstring Curl", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Hamstring isolation" },
            { name: "Bulgarian Split Squat", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Unilateral leg work" },
            { name: "Seated Calf Raise", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Soleus focus" },
            { name: "Cable Crunch", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Abs isolation" },
            { name: "Hanging Leg Raise", sets: 3, reps: "10-15", rpe: 8, rest: "1-2min", notes: "Lower abs and hip flexors" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 11. C.A.R.D. WORKOUT (At-Home, No Equipment)
// ─────────────────────────────────────────────────────────────────
const cardWorkout: JeffProgram = {
  id: "card_workout",
  name: "C.A.R.D. Workout",
  shortName: "C.A.R.D.",
  description: "Creative At-home Randomized Drills — no equipment needed",
  longDescription:
    "Jeff Nippard's C.A.R.D. Workout stands for Creative At-home Randomized Drills. Uses a card-based system for randomized bodyweight training. No equipment needed — can be done anywhere.",
  level: ["beginner", "intermediate", "advanced"],
  goals: ["fitness", "fat_loss"],
  split: "at_home",
  equipment: "bodyweight",
  daysPerWeek: 3,
  durationWeeks: 8,
  emoji: "🃏",
  color: "from-slate-600 to-zinc-700",
  highlights: [
    "ไม่ต้องใช้อุปกรณ์",
    "ทำได้ทุกที่",
    "ระบบสุ่มไม่เบื่อ",
    "เหมาะทุกระดับ",
  ],
  bestFor: "คนที่ไม่มียิมหรือต้องการฝึกที่บ้าน",
  pdfName: "C.A.R.D. Workout",
  defaultScheduleDays: [0, 2, 4], // Mon, Wed, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "C.A.R.D. System",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Upper Body CARD",
          exercises: [
            { name: "Push-ups", sets: 3, reps: "Max (AMRAP)", rpe: 8, rest: "1-2min", notes: "Control eccentric, full ROM. Feet elevated = harder" },
            { name: "Wide Push-ups", sets: 3, reps: "Max", rpe: 8, rest: "1-2min", notes: "Wider than shoulder width, chest focus" },
            { name: "Diamond Push-ups", sets: 3, reps: "Max", rpe: 8, rest: "1-2min", notes: "Hands close together, triceps focus" },
            { name: "Pike Push-ups", sets: 3, reps: "Max", rpe: 8, rest: "1-2min", notes: "Hips high, shoulder press pattern" },
            { name: "Bodyweight Rows", sets: 3, reps: "Max", rpe: 8, rest: "1-2min", notes: "Use a table or low bar, pull chest to hands" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Lower Body CARD",
          exercises: [
            { name: "Bodyweight Back Squat", sets: 3, reps: "15-20", rpe: 7, rest: "1-2min", notes: "Full depth, control descent" },
            { name: "Bulgarian Split Squat", sets: 3, reps: "10-12 each leg", rpe: 8, rest: "1-2min", notes: "Back foot elevated, front knee over toes" },
            { name: "Romanian Deadlift", sets: 3, reps: "15", rpe: 7, rest: "1-2min", notes: "Bodyweight, hip hinge pattern" },
            { name: "Glute Bridge", sets: 3, reps: "20", rpe: 7, rest: "1-2min", notes: "Single leg for more difficulty" },
            { name: "Nordic Hamstring Curl", sets: 3, reps: "5-8", rpe: 9, rest: "2min", notes: "Partner holds ankles, hardest bodyweight hamstring exercise" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Full Body CARD",
          exercises: [
            { name: "Bodyweight Back Squat", sets: 2, reps: "15", rpe: 7, rest: "1min", notes: "Warm up for full body" },
            { name: "Push-ups", sets: 2, reps: "Max", rpe: 8, rest: "1min", notes: "Control throughout" },
            { name: "Reverse Nordic", sets: 3, reps: "8-12", rpe: 9, rest: "2min", notes: "Quad isolation bodyweight" },
            { name: "Hanging Knee Raise", sets: 3, reps: "15-20", rpe: 8, rest: "1min", notes: "From a bar or door frame" },
            { name: "Bodyweight Rows", sets: 3, reps: "Max", rpe: 8, rest: "1-2min", notes: "Back training without equipment" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 12. MUSCLE LADDER BONUS PROGRAM
// ─────────────────────────────────────────────────────────────────
const muscleLadder: JeffProgram = {
  id: "muscle_ladder",
  name: "Muscle Ladder Program",
  shortName: "Muscle Ladder",
  description: "Jeff's signature scientific approach — ladder of muscle building principles",
  longDescription:
    "The Muscle Ladder represents Jeff Nippard's most evolved training philosophy. Covers all principles from beginner basics to elite-level optimization with scientific backing.",
  level: ["intermediate", "advanced"],
  goals: ["hypertrophy", "strength"],
  split: "bodypart",
  equipment: "full_gym",
  daysPerWeek: 4,
  durationWeeks: 8,
  emoji: "🪜",
  color: "from-yellow-500 to-amber-600",
  highlights: [
    "Science-based approach",
    "Jeff's most evolved philosophy",
    "Ladder of principles",
    "4 วัน/สัปดาห์",
  ],
  bestFor: "คนที่ต้องการ evidence-based approach สำหรับ muscle building",
  pdfName: "The Muscle Ladder Get Jacked Using Science",
  defaultScheduleDays: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
  weeks: [
    {
      weekNumber: 1,
      label: "Building the Ladder",
      days: [
        {
          dayLabel: "Day 1",
          focusLabel: "Push (Chest + Shoulders + Triceps)",
          exercises: [
            { name: "Barbell Bench Press", sets: 3, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Primary pressing strength" },
            { name: "Incline DB Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Upper chest activation" },
            { name: "Machine Shoulder Press", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Shoulder strength and size" },
            { name: "Cable Lat Raise", sets: 4, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Side delt isolation" },
            { name: "Pec Deck", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Chest isolation" },
            { name: "Overhead Cable Ext", sets: 3, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Triceps long head" },
            { name: "Rope Tricep Pushdown", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Triceps pump" },
          ],
        },
        {
          dayLabel: "Day 2",
          focusLabel: "Pull (Back + Biceps)",
          exercises: [
            { name: "Weighted Pull Up", sets: 3, reps: "6-8", rpe: 8, rest: "3-4min", warmupSets: 2, notes: "Best lat exercise" },
            { name: "Chest Supported Row", sets: 3, reps: "8-12", rpe: 8, rest: "2-3min", notes: "Back thickness" },
            { name: "Iso-Lateral Pulldown", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Lat isolation" },
            { name: "Cable Row", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Horizontal pull" },
            { name: "Reverse Pec Deck", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Rear delt" },
            { name: "Face Away Bayesian Curl", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Biceps stretch" },
            { name: "DB Hammer Curl", sets: 3, reps: "12-15", rpe: 8, rest: "1-2min", notes: "Brachialis" },
          ],
        },
        {
          dayLabel: "Day 3",
          focusLabel: "Legs (Quad Focus)",
          exercises: [
            { name: "Hack Squat", sets: 4, reps: "8-12", rpe: 8, rest: "3-4min", warmupSets: 3, notes: "Primary quad mass builder" },
            { name: "Romanian Deadlift", sets: 3, reps: "8-10", rpe: 8, rest: "2-3min", notes: "Hamstring and glute strength" },
            { name: "Leg Extension", sets: 4, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Quad isolation" },
            { name: "Seated Hamstring Curl", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Best hamstring isolation" },
            { name: "Machine Hip Thrust", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Glute focus" },
            { name: "Seated Calf Raise", sets: 4, reps: "10-15", rpe: 9, rest: "1-2min", notes: "Calf isolation" },
          ],
        },
        {
          dayLabel: "Day 4",
          focusLabel: "Upper Body (Hypertrophy Emphasis)",
          exercises: [
            { name: "Incline Machine Bench", sets: 3, reps: "10-12", rpe: 8, rest: "2-3min", notes: "Upper chest" },
            { name: "Machine High Row", sets: 3, reps: "10-15", rpe: 8, rest: "2-3min", notes: "Upper back" },
            { name: "Cable Lat Raise", sets: 3, reps: "15-20", rpe: 9, rest: "1-2min", notes: "Side delts" },
            { name: "Seated Cable Pec Flye", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Chest isolation" },
            { name: "Straight Arm Pulldown", sets: 3, reps: "12-15", rpe: 9, rest: "1-2min", notes: "Lat isolation" },
            { name: "EZ Bar Curl", sets: 3, reps: "10-12", rpe: 8, rest: "1-2min", notes: "Biceps strength" },
            { name: "Barbell Skullcrusher", sets: 3, reps: "10-12", rpe: 8, rest: "1-2min", notes: "Triceps mass" },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// MASTER PROGRAMS LIST (sorted by recommended order)
// ─────────────────────────────────────────────────────────────────
export const JEFF_PROGRAMS: JeffProgram[] = [
  // Sorted by level of advancement
  cardWorkout,                    // Beginner, at-home
  bbTransformationBeginner,       // Beginner, gym
  essentials3x,                   // Beginner-Intermediate
  fundamentalsFullBody,           // Beginner-Intermediate
  comebackUpperLower,             // Beginner-Intermediate (returning)
  fundamentalsUpperLower,         // Intermediate
  comebackPPL,                    // Intermediate-Advanced (returning)
  fundamentalsBodypart,           // Intermediate-Advanced
  muscleLadder,                   // Intermediate-Advanced
  powerbuilding30,                // Intermediate-Advanced (powerbuilding)
  pureBodybuildingPhase2,         // Intermediate-Advanced (advanced hypertrophy)
  bbTransformationIntAdv,         // Intermediate-Advanced (transformation)
];

// ─────────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────────
export interface ProgramRecommendation {
  program: JeffProgram;
  score: number;
  reasons: string[];
  matchBadge: "Perfect Match" | "Great Match" | "Good Match";
}

export interface ProfileRecommendationContext {
  level?: "beginner" | "intermediate" | "advanced";
  goal?: "strength" | "hypertrophy" | "fitness";
  daysPerWeek?: number;
  hasGymAccess?: boolean;
  injuries?: string[];
  expMonths?: number;
}

export function recommendPrograms(
  level: "beginner" | "intermediate" | "advanced",
  goal: "strength" | "hypertrophy" | "fitness",
  daysPerWeek: 3 | 4 | 5 | 6,
  hasGymAccess: boolean = true,
  profileContext?: ProfileRecommendationContext
): ProgramRecommendation[] {
  const results: ProgramRecommendation[] = [];

  for (const program of JEFF_PROGRAMS) {
    let score = 0;
    const reasons: string[] = [];

    // Equipment filter
    if (!hasGymAccess && program.equipment !== "bodyweight") continue;

    // Level match
    if (program.level.includes(level)) {
      score += 30;
      reasons.push(`เหมาะสำหรับระดับ ${level === "beginner" ? "มือใหม่" : level === "intermediate" ? "กลาง" : "สูง"}`);
    } else if (
      (level === "intermediate" && program.level.includes("beginner")) ||
      (level === "advanced" && program.level.includes("intermediate"))
    ) {
      score += 10;
    }

    // Goal match
    const goalMap: Record<string, ProgramGoal[]> = {
      strength: ["strength", "powerbuilding"],
      hypertrophy: ["hypertrophy", "powerbuilding"],
      fitness: ["fitness", "hypertrophy"],
    };
    const matchedGoals = goalMap[goal] ?? [];
    if (program.goals.some((g) => matchedGoals.includes(g))) {
      score += 25;
      reasons.push(`ตรงกับเป้าหมาย ${goal === "strength" ? "เพิ่มแรง" : goal === "hypertrophy" ? "เพิ่มกล้าม" : "สุขภาพดี"}`);
    }

    // Days per week match
    const dayDiff = Math.abs(program.daysPerWeek - daysPerWeek);
    if (dayDiff === 0) {
      score += 25;
      reasons.push(`ฝึก ${program.daysPerWeek} วัน/สัปดาห์ ตรงกับที่คุณต้องการ`);
    } else if (dayDiff === 1) {
      score += 15;
      reasons.push(`ฝึก ${program.daysPerWeek} วัน/สัปดาห์ ใกล้เคียงกับที่ต้องการ`);
    } else if (dayDiff === 2) {
      score += 5;
    }

    // Injury-safe bonus / penalty
    if (profileContext?.injuries && profileContext.injuries.length > 0) {
      const hasBackInjury = profileContext.injuries.includes("lowerBack");
      if (hasBackInjury) {
        if (program.id === "card_workout" || program.id === "the_essentials_3x") {
          score += 15;
          reasons.push("ความเค้นต่อหลังส่วนล่างต่ำ ปลอดภัยต่อการฟื้นฟูหลัง");
        } else if (program.id === "powerbuilding_3_0") {
          score -= 20; // Heavy deadlifts/squats may aggravate back injury
        }
      }
    }

    if (score >= 30) {
      results.push({
        program,
        score,
        reasons,
        matchBadge:
          score >= 75 ? "Perfect Match" : score >= 55 ? "Great Match" : "Good Match",
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────
export const ACTIVE_JEFF_PROGRAM_KEY = "haitActiveJeffProgramV1";
export const JEFF_PROGRAM_START_DATE_KEY = "haitJeffProgramStartDateV1";
export const JEFF_PROGRAM_SCHEDULE_KEY = "haitJeffProgramScheduleV1";

export interface ActiveJeffProgramState {
  programId: string;
  startDate: string; // ISO date YYYY-MM-DD
  currentWeek: number; // 1-indexed
  currentDayIndex: number; // 0-indexed day within current week
  completedDays: string[]; // ISO date keys of completed workout days (e.g. "2026-10-15")
  scheduleDays: number[]; // 0=Mon ... 6=Sun
}

export function getActiveJeffProgram(): ActiveJeffProgramState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_JEFF_PROGRAM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveJeffProgram(state: ActiveJeffProgramState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_JEFF_PROGRAM_KEY, JSON.stringify(state));
  } catch {}
}

export function clearActiveJeffProgram(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACTIVE_JEFF_PROGRAM_KEY);
  } catch {}
}

export function findProgramById(id: string): JeffProgram | undefined {
  return JEFF_PROGRAMS.find((p) => p.id === id);
}

export function getProgramCurrentWeek(state: ActiveJeffProgramState): JeffProgramWeek | null {
  const program = findProgramById(state.programId);
  if (!program) return null;
  // Find the week template closest to current week
  const sortedWeeks = [...program.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  let matchedWeek = sortedWeeks[0];
  for (const week of sortedWeeks) {
    if (week.weekNumber <= state.currentWeek) matchedWeek = week;
    else break;
  }
  return matchedWeek;
}

export function getProgramDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNextProgramTrainingDate(
  state: ActiveJeffProgramState,
  fromDate: Date = new Date()
): string | null {
  const scheduleDays = Array.isArray(state.scheduleDays)
    ? state.scheduleDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];
  if (scheduleDays.length === 0) return null;

  const fromKey = getProgramDateKey(fromDate);
  const firstKey = state.startDate && state.startDate > fromKey ? state.startDate : fromKey;
  const current = new Date(`${firstKey}T12:00:00`);
  if (!Number.isFinite(current.getTime())) return null;

  // Find the next scheduled date within the following week, respecting a future start date.
  for (let offset = 0; offset <= 7; offset += 1) {
    const dayOfWeek = (current.getDay() + 6) % 7; // Mon=0 ... Sun=6
    if (scheduleDays.includes(dayOfWeek)) return getProgramDateKey(current);
    current.setDate(current.getDate() + 1);
  }
  return null;
}

export function isJeffProgramComplete(state: ActiveJeffProgramState): boolean {
  const program = findProgramById(state.programId);
  if (!program) return false;
  return state.completedDays.length >= program.durationWeeks * program.daysPerWeek;
}

export function getProgramScheduledDates(
  startDate: string,
  scheduleDays: number[],
  totalWeeks: number
): string[] {
  const dates: string[] = [];
  // Parse at local noon to avoid UTC date shifts around midnight and DST boundaries.
  const start = new Date(`${startDate}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || totalWeeks <= 0) return dates;
  const end = new Date(start);
  end.setDate(end.getDate() + totalWeeks * 7);

  const current = new Date(start);
  while (current < end) {
    const dayOfWeek = (current.getDay() + 6) % 7; // Mon=0 ... Sun=6
    if (scheduleDays.includes(dayOfWeek)) dates.push(getProgramDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Calendar-aware schedule resolver:
 * Checks whether a given calendar date is scheduled as a training day,
 * and if so, maps which program workout day index (Day 1, Day 2, etc.) corresponds to it.
 */
export function resolveProgramDayForDate(
  state: ActiveJeffProgramState,
  date: Date = new Date()
): { isTrainingDay: boolean; scheduledDayIndex: number; isCompleted: boolean; dateKey: string } {
  const dateKey = getProgramDateKey(date);
  const dayOfWeek0to6 = (date.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const scheduleDays = Array.isArray(state.scheduleDays) ? state.scheduleDays : [];
  const isAfterStartDate = !state.startDate || dateKey >= state.startDate;
  const isTrainingDay = isAfterStartDate && scheduleDays.includes(dayOfWeek0to6);
  const isCompleted = state.completedDays.includes(dateKey);

  // Calendar decides whether today is a training day; workout progression stays sequential.
  // Never map Monday back to Day 1 every week: currentDayIndex advances only on completion.
  const weekData = getProgramCurrentWeek(state);
  const dayCount = weekData?.days.length || 1;
  const scheduledDayIndex = Math.max(0, Math.min(state.currentDayIndex || 0, dayCount - 1));

  return {
    isTrainingDay,
    scheduledDayIndex,
    isCompleted,
    dateKey,
  };
}

/**
 * Advance program progression after finishing a session:
 * Marks date completed and advances day/week without corrupting calendar mapping.
 */
export function advanceJeffProgramAfterFinish(
  currentState: ActiveJeffProgramState,
  completedDateKey: string,
  completedDayIndex: number = currentState.currentDayIndex
): ActiveJeffProgramState {
  // Never advance an already completed program or count a duplicate Finish action twice.
  if (isJeffProgramComplete(currentState) || currentState.completedDays.includes(completedDateKey)) {
    return currentState;
  }

  const program = findProgramById(currentState.programId);
  const weekData = getProgramCurrentWeek(currentState);
  const totalDaysInWeek = weekData?.days.length || currentState.scheduleDays.length || 4;
  const updatedCompleted = [...currentState.completedDays, completedDateKey];
  const safeCompletedIndex = Number.isInteger(completedDayIndex)
    ? Math.max(0, Math.min(completedDayIndex, totalDaysInWeek - 1))
    : currentState.currentDayIndex;

  // If the user intentionally chose a later day from the day switcher, progress follows
  // that completed workout. Choosing an earlier day must never move progress backwards.
  let nextDayIdx = Math.max(currentState.currentDayIndex, safeCompletedIndex) + 1;
  let nextWeek = currentState.currentWeek;

  if (nextDayIdx >= totalDaysInWeek) {
    nextDayIdx = 0;
    nextWeek = Math.min(program?.durationWeeks || 8, currentState.currentWeek + 1);
  }

  return {
    ...currentState,
    completedDays: updatedCompleted,
    currentDayIndex: nextDayIdx,
    currentWeek: nextWeek,
  };
}
