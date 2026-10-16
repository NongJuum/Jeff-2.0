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

export type RescheduledSessionStatus = "pending" | "completed" | "skipped" | "deferred" | "dismissed" | "declined";

export type SchedulingModel =
  | "fixed_weekday"       // Bound to specific days of week (0=Mon...6=Sun)
  | "sequential_rotation" // Rotates through sessions in order whenever trained
  | "cycle_pattern";      // Repeating microcycle of N days (e.g. 3 on 1 off)

export type MissedSessionPolicy =
  | "shift_sequence"            // Missed workout shifts to next training day; rest days preserved
  | "reschedule_to_next_available" // Alias / standard for shift_sequence
  | "reschedule_to_rest_day"    // Place make-up session onto nearest upcoming rest day
  | "skip_and_maintain";        // Missed session skipped; calendar stays fixed

export interface RescheduledSession {
  id: string; // Unique, deterministic ID: e.g. "missed_2026-10-16_d3"
  originalDateKey: string; // Date originally scheduled
  targetDateKey?: string; // Planned slot for make-up
  sourceWeek: number; // Program week or cycle index (1-indexed)
  dayIndex: number; // 0-based day within week/cycle
  dayLabel: string; // e.g. "Day 4"
  focusLabel: string; // e.g. "Upper Body A"
  status: RescheduledSessionStatus;
  resolvedAt?: string; // Date key when completed or explicitly skipped
  type?: "recovery" | "manual_move";
  recoveryPlanId?: string;
  decision?: "scheduled" | "deferred" | "declined" | "awaiting_decision";
  deferredUntilWeek?: number;
  decisionDateKey?: string;
}

export type RecoveryPlanStatus =
  | "not_offered"
  | "awaiting_user_decision"
  | "declined"
  | "proposed"
  | "active"
  | "completed"
  | "cancelled"
  | "deferred";

export interface RecoveryPlanSession {
  id: string;
  originalDateKey: string;
  targetDateKey: string;
  sourceWeek: number;
  dayIndex: number;
  dayLabel: string;
  focusLabel: string;
  status: "pending" | "completed" | "skipped" | "deferred" | "declined";
  resolvedAt?: string;
  decision?: "scheduled" | "deferred" | "declined";
}

export interface RecoveryPlan {
  id: string;
  createdAt: string;
  status: RecoveryPlanStatus;
  sessions: RecoveryPlanSession[];
  dismissedDates?: string[];
  completedAt?: string;
}

export interface WeeklyReviewRecord {
  weekNumber: number;
  reviewedAtDateKey: string;
  unresolvedSessionIds: string[];
  decision: "recover_this_week" | "defer" | "skip" | "decide_later";
}

export interface WeeklyReviewData {
  previousWeekNumber: number;
  totalScheduled: number;
  completedCount: number;
  unresolvedSessions: RescheduledSession[];
  availableSlotsInCurrentWeek: string[];
}

export interface ManualScheduleMove {
  id: string;
  originalDateKey: string;
  targetDateKey: string;
  sourceWeek: number;
  dayIndex: number;
  dayLabel: string;
  focusLabel: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
}

export interface UniversalWorkoutDay {
  dayLabel: string;
  focusLabel: string;
  exercises?: JeffExercise[];
}

export interface UniversalProgramWeek {
  weekNumber: number;
  label?: string;
  days: UniversalWorkoutDay[];
}

export interface UniversalProgramDefinition {
  id: string;
  name: string;
  splitType?: string;
  daysPerWeek?: number;
  durationWeeks?: number;
  cycleLengthDays?: number;
  cyclePattern?: boolean[];
  defaultScheduleDays?: number[];
  defaultSchedulingModel?: SchedulingModel;
  defaultMissedSessionPolicy?: MissedSessionPolicy;
  weeks?: UniversalProgramWeek[];
  days?: UniversalWorkoutDay[];
}

export interface ProgramDayResolution {
  isTrainingDay: boolean;
  scheduledDayIndex: number;
  isCompleted: boolean;
  dateKey: string;
  isRescheduledMakeUp?: boolean;
  rescheduledSession?: RescheduledSession;
  isManualMove?: boolean;
  manualMove?: ManualScheduleMove;
  pendingBacklogCount?: number;
  isRestDay: boolean;
  cycleNumber: number;
  reason?: "scheduled_session" | "make_up_session" | "manual_move" | "scheduled_rest" | "program_completed" | "before_start";
}

export interface ActiveJeffProgramState {
  programId: string;
  startDate: string; // ISO date YYYY-MM-DD
  currentWeek: number; // 1-indexed
  currentDayIndex: number; // 0-indexed day within current week
  completedDays: string[]; // ISO date keys of completed workout days (e.g. "2026-10-15")
  scheduleDays: number[]; // 0=Mon ... 6=Sun
  rescheduledSessions?: RescheduledSession[];
  skippedDates?: string[]; // Date keys explicitly skipped
  // Recovery & Manual Scheduling extensions
  recoveryPlan?: RecoveryPlan;
  dismissedMissedDates?: string[]; // Date keys user chose "ไม่แทรกโปรแกรมที่พลาด" (never re-prompt)
  manualMoves?: ManualScheduleMove[]; // User-moved sessions
  weeklyReviews?: WeeklyReviewRecord[]; // Recorded reviews to prevent duplicate prompts
  deferredSessionIds?: string[]; // Sessions deferred to later
  lastPromptDismissedDateKey?: string; // Date key when user chose "decide later"
  // Universal engine extensions
  schedulingModel?: SchedulingModel;
  cycleLengthDays?: number; // Defaults to 7 for weekly splits; can be any integer >= 1
  cyclePattern?: boolean[]; // For cycle_pattern: e.g. [true, true, true, false]
  missedSessionPolicy?: MissedSessionPolicy;
  completedSessionIds?: string[];
  skippedSessionIds?: string[];
  customProgramDefinition?: UniversalProgramDefinition;
}

export const PROGRAM_PROGRESS_ARCHIVE_KEY = "haitProgramProgressArchiveV1";

export function getProgramProgressArchive(): Record<string, Partial<ActiveJeffProgramState>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRAM_PROGRESS_ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgramProgressArchive(programId: string, progress: Partial<ActiveJeffProgramState>): void {
  if (typeof window === "undefined" || !programId) return;
  try {
    const archive = getProgramProgressArchive();
    archive[programId] = {
      ...archive[programId],
      ...progress,
      programId,
    };
    window.localStorage.setItem(PROGRAM_PROGRESS_ARCHIVE_KEY, JSON.stringify(archive));
  } catch {}
}

export function getActiveJeffProgram(): ActiveJeffProgramState | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = window.localStorage.getItem(ACTIVE_JEFF_PROGRAM_KEY);
    // Legacy storage key fallback across app updates
    if (!raw) {
      const legacyKeys = ["haitActiveJeffProgram", "activeJeffProgram", "jeffProgramActive"];
      for (const k of legacyKeys) {
        const legacyVal = window.localStorage.getItem(k);
        if (legacyVal) {
          raw = legacyVal;
          try {
            window.localStorage.setItem(ACTIVE_JEFF_PROGRAM_KEY, legacyVal);
          } catch {}
          break;
        }
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.programId) return null;

    // Sanitize state to guarantee data integrity across updates
    const def = findProgramById(parsed.programId);
    const parsedScheduleDays = Array.isArray(parsed.scheduleDays)
      ? parsed.scheduleDays
          .map((d: unknown) => Number(d))
          .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];
    const effectiveScheduleDays = parsedScheduleDays.length > 0
      ? parsedScheduleDays
      : (def?.defaultScheduleDays || [0, 2, 4]);

    const sanitized: ActiveJeffProgramState = {
      ...parsed,
      programId: String(parsed.programId),
      startDate: typeof parsed.startDate === "string" ? parsed.startDate : getProgramDateKey(),
      currentWeek: Number.isInteger(parsed.currentWeek) && parsed.currentWeek >= 1 ? parsed.currentWeek : 1,
      currentDayIndex: Number.isInteger(parsed.currentDayIndex) && parsed.currentDayIndex >= 0 ? parsed.currentDayIndex : 0,
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter((d: unknown): d is string => typeof d === "string") : [],
      scheduleDays: effectiveScheduleDays,
      rescheduledSessions: Array.isArray(parsed.rescheduledSessions) ? parsed.rescheduledSessions : [],
      skippedDates: Array.isArray(parsed.skippedDates) ? parsed.skippedDates : [],
      recoveryPlan: parsed.recoveryPlan && typeof parsed.recoveryPlan === "object" ? parsed.recoveryPlan : undefined,
      dismissedMissedDates: Array.isArray(parsed.dismissedMissedDates) ? parsed.dismissedMissedDates : [],
      manualMoves: Array.isArray(parsed.manualMoves) ? parsed.manualMoves : [],
      weeklyReviews: Array.isArray(parsed.weeklyReviews) ? parsed.weeklyReviews : [],
      deferredSessionIds: Array.isArray(parsed.deferredSessionIds) ? parsed.deferredSessionIds : [],
      lastPromptDismissedDateKey: typeof parsed.lastPromptDismissedDateKey === "string" ? parsed.lastPromptDismissedDateKey : undefined,
    };

    // Reconcile completedDays from workout history if completedDays is empty
    if (sanitized.completedDays.length === 0) {
      try {
        const logsRaw = window.localStorage.getItem("trainingLatestV2");
        if (logsRaw) {
          const logs = JSON.parse(logsRaw);
          if (Array.isArray(logs) && logs.length > 0) {
            const dateKeys = Array.from(new Set(logs.map((l: any) => getProgramDateKey(new Date(l.date))))).filter(Boolean);
            if (dateKeys.length > 0) {
              sanitized.completedDays = dateKeys;
            }
          }
        }
      } catch {}
    }

    return sanitized;
  } catch {
    return null;
  }
}

export function saveActiveJeffProgram(state: ActiveJeffProgramState): void {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(ACTIVE_JEFF_PROGRAM_KEY, JSON.stringify(state));
    saveProgramProgressArchive(state.programId, {
      currentWeek: state.currentWeek,
      currentDayIndex: state.currentDayIndex,
      completedDays: state.completedDays,
      startDate: state.startDate,
      scheduleDays: state.scheduleDays,
      recoveryPlan: state.recoveryPlan,
      dismissedMissedDates: state.dismissedMissedDates,
      manualMoves: state.manualMoves,
      weeklyReviews: state.weeklyReviews,
      deferredSessionIds: state.deferredSessionIds,
      lastPromptDismissedDateKey: state.lastPromptDismissedDateKey,
    });
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

/**
 * Resolves the universal program structure from an active state,
 * supporting built-in Jeff programs, custom definitions, or resilient fallbacks.
 */
export function resolveProgramDefinition(state: ActiveJeffProgramState): UniversalProgramDefinition {
  if (state.customProgramDefinition) {
    return state.customProgramDefinition;
  }
  const found = findProgramById(state.programId);
  if (found) {
    return {
      id: found.id,
      name: found.name,
      splitType: found.split,
      daysPerWeek: found.daysPerWeek,
      durationWeeks: found.durationWeeks,
      cycleLengthDays: 7,
      defaultScheduleDays: found.defaultScheduleDays,
      defaultSchedulingModel: "fixed_weekday",
      defaultMissedSessionPolicy: "shift_sequence",
      weeks: found.weeks,
    };
  }
  const scheduleCount = Array.isArray(state.scheduleDays) && state.scheduleDays.length > 0
    ? state.scheduleDays.length
    : 3;
  return {
    id: state.programId || "custom_program",
    name: "Custom Workout Program",
    daysPerWeek: scheduleCount,
    durationWeeks: 8,
    cycleLengthDays: state.cycleLengthDays || 7,
    defaultScheduleDays: state.scheduleDays || [0, 2, 4],
    defaultSchedulingModel: state.schedulingModel || "fixed_weekday",
    defaultMissedSessionPolicy: state.missedSessionPolicy || "shift_sequence",
    weeks: [
      {
        weekNumber: 1,
        days: Array.from({ length: scheduleCount }, (_, i) => ({
          dayLabel: `Day ${i + 1}`,
          focusLabel: `Workout ${i + 1}`,
          exercises: [],
        })),
      },
    ],
  };
}

export function getProgramCurrentWeek(state: ActiveJeffProgramState): JeffProgramWeek | null {
  const def = resolveProgramDefinition(state);
  if (def.weeks && def.weeks.length > 0) {
    const sortedWeeks = [...def.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    let matchedWeek = sortedWeeks[0];
    for (const week of sortedWeeks) {
      if (week.weekNumber <= state.currentWeek) matchedWeek = week;
      else break;
    }
    return {
      weekNumber: matchedWeek.weekNumber,
      label: matchedWeek.label,
      days: matchedWeek.days.map((d) => ({
        dayLabel: d.dayLabel,
        focusLabel: d.focusLabel,
        exercises: d.exercises || [],
      })),
    };
  }
  if (def.days && def.days.length > 0) {
    return {
      weekNumber: state.currentWeek,
      days: def.days.map((d) => ({
        dayLabel: d.dayLabel,
        focusLabel: d.focusLabel,
        exercises: d.exercises || [],
      })),
    };
  }
  return null;
}

export function getProgramDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves the effective scheduling model for an active program.
 */
export function getProgramSchedulingModel(state: ActiveJeffProgramState): SchedulingModel {
  if (state.schedulingModel) return state.schedulingModel;
  const legacyConfig = (state as any).scheduleConfig;
  if (legacyConfig?.model) return legacyConfig.model;
  const def = resolveProgramDefinition(state);
  if (def.defaultSchedulingModel) return def.defaultSchedulingModel;
  if (state.cyclePattern && state.cyclePattern.length > 0) return "cycle_pattern";
  return "fixed_weekday";
}

/**
 * Resolves the effective missed session policy for an active program.
 */
export function getProgramMissedPolicy(state: ActiveJeffProgramState): MissedSessionPolicy {
  if (state.missedSessionPolicy) return state.missedSessionPolicy;
  const legacyConfig = (state as any).scheduleConfig;
  if (legacyConfig?.missedPolicy) return legacyConfig.missedPolicy;
  const def = resolveProgramDefinition(state);
  return def.defaultMissedSessionPolicy || "shift_sequence";
}

/**
 * Checks whether a given calendar date is scheduled as a training day under the program's policy.
 */
export function isDateScheduledTrainingDay(
  state: ActiveJeffProgramState,
  date: Date
): boolean {
  const dateKey = getProgramDateKey(date);
  if (state.startDate && dateKey < state.startDate) return false;

  const model = getProgramSchedulingModel(state);
  const def = resolveProgramDefinition(state);
  const rawList = state.scheduleDays !== undefined
    ? state.scheduleDays
    : ((state as any).scheduleConfig?.scheduleDays !== undefined
        ? (state as any).scheduleConfig.scheduleDays
        : def.defaultScheduleDays || [0, 2, 4]);

  const scheduleDays: number[] = Array.isArray(rawList)
    ? rawList
        .map((d: any) => Number(d))
        .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];

  // Safe local noon date for timezone-independent day-of-week calculation
  const localDate = new Date(`${dateKey}T12:00:00`);
  const dayOfWeek = (localDate.getDay() + 6) % 7;

  if (model === "sequential_rotation") {
    if (scheduleDays.length === 0) return true;
    return scheduleDays.includes(dayOfWeek);
  }

  if (model === "cycle_pattern") {
    const cycleLength = state.cycleLengthDays || 4;
    const pattern = state.cyclePattern || [true, true, true, false];
    const startDate = new Date(`${state.startDate || dateKey}T12:00:00`);
    const targetDate = new Date(`${dateKey}T12:00:00`);
    const diffDays = Math.round((targetDate.getTime() - startDate.getTime()) / 86400000);
    if (diffDays < 0) return false;
    const cycleIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength;
    return Boolean(pattern[cycleIndex]);
  }

  // fixed_weekday
  if (scheduleDays.length === 0) return false;
  return scheduleDays.includes(dayOfWeek);
}

export function getNextProgramTrainingDate(
  state: ActiveJeffProgramState,
  fromDate: Date = new Date()
): string | null {
  const fromKey = getProgramDateKey(fromDate);
  const firstKey = state.startDate && state.startDate > fromKey ? state.startDate : fromKey;
  const current = new Date(`${firstKey}T12:00:00`);
  if (!Number.isFinite(current.getTime())) return null;

  const model = getProgramSchedulingModel(state);
  const maxLookahead = model === "cycle_pattern" ? Math.max(14, (state.cycleLengthDays || 4) * 2) : 14;

  for (let offset = 0; offset <= maxLookahead; offset += 1) {
    if (isDateScheduledTrainingDay(state, current)) {
      return getProgramDateKey(current);
    }
    current.setDate(current.getDate() + 1);
  }
  return null;
}

export function isJeffProgramComplete(state: ActiveJeffProgramState): boolean {
  const def = resolveProgramDefinition(state);
  const totalWeeks = def.durationWeeks || 8;
  const daysInCycle = def.days?.length || def.weeks?.[0]?.days.length || def.daysPerWeek || state.scheduleDays?.length || 3;
  const totalPlannedSessions = totalWeeks * daysInCycle;
  return state.completedDays.length >= totalPlannedSessions;
}

export function getProgramScheduledDates(
  startDate: string,
  scheduleDays: number[],
  totalWeeks: number,
  schedulingModel: SchedulingModel = "fixed_weekday",
  cycleLengthDays: number = 7,
  cyclePattern: boolean[] = []
): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || totalWeeks <= 0) return dates;

  const mockState: ActiveJeffProgramState = {
    programId: "preview",
    startDate,
    currentWeek: 1,
    currentDayIndex: 0,
    completedDays: [],
    scheduleDays,
    schedulingModel,
    cycleLengthDays,
    cyclePattern,
  };

  const totalCalendarDays = totalWeeks * (schedulingModel === "cycle_pattern" ? cycleLengthDays : 7);
  const end = new Date(start);
  end.setDate(end.getDate() + totalCalendarDays);

  const current = new Date(start);
  while (current < end) {
    if (isDateScheduledTrainingDay(mockState, current)) {
      dates.push(getProgramDateKey(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Detects missed training sessions between program startDate and asOfDate.
 * Respects scheduling model and missed session policy:
 * - sequential_rotation: no calendar backlogs; sequence waits for user.
 * - skip_and_maintain: drops missed slots without creating pending make-ups.
 * - shift_sequence / reschedule_to_next_available: tracks make-up obligations deterministically.
 */
export function detectMissedSessions(
  state: ActiveJeffProgramState,
  asOfDate: Date = new Date()
): ActiveJeffProgramState {
  if (!state.startDate) return state;
  const asOfKey = getProgramDateKey(asOfDate);
  if (asOfKey <= state.startDate) return state;

  const model = getProgramSchedulingModel(state);
  if (model === "sequential_rotation") {
    // Sequential programs advance purely by workout completion without date-bound missed slots.
    return state;
  }

  const policy = getProgramMissedPolicy(state);
  const def = resolveProgramDefinition(state);
  const weekData = getProgramCurrentWeek(state);
  const daysInCycle = weekData?.days.length || def.days?.length || (Array.isArray(state.scheduleDays) ? state.scheduleDays.length : 0) || 4;

  const existingRescheduled = state.rescheduledSessions ? [...state.rescheduledSessions] : [];
  const existingPending = existingRescheduled.filter((s) => s.status === "pending");
  const trackedDates = new Set<string>([
    ...state.completedDays,
    ...(state.skippedDates ?? []),
    ...(state.dismissedMissedDates ?? []),
    ...(state.completedSessionIds ?? []),
    ...existingRescheduled.map((s) => s.originalDateKey),
  ]);

  let current = new Date(`${state.startDate}T12:00:00`);
  if (!Number.isFinite(current.getTime())) return state;

  const pastScheduledDates: string[] = [];
  while (getProgramDateKey(current) < asOfKey) {
    const dKey = getProgramDateKey(current);
    if (isDateScheduledTrainingDay(state, current)) {
      pastScheduledDates.push(dKey);
    }
    current.setDate(current.getDate() + 1);
  }

  if (policy === "skip_and_maintain") {
    const newSkipped = new Set(state.skippedDates ?? []);
    pastScheduledDates.forEach((dKey) => {
      if (!state.completedDays.includes(dKey)) {
        newSkipped.add(dKey);
      }
    });
    return {
      ...state,
      skippedDates: Array.from(newSkipped),
    };
  }

  const progressionSeq = Math.max(0, (Math.max(1, state.currentWeek) - 1) * daysInCycle + Math.max(0, state.currentDayIndex));
  const recordedCompletedCount = Array.isArray(state.completedDays) ? state.completedDays.length : 0;
  const recordedSkippedCount = Array.isArray(state.skippedDates) ? state.skippedDates.length : 0;
  const totalResolved = Math.max(progressionSeq, recordedCompletedCount + recordedSkippedCount);
  const totalTrackedOrResolved = totalResolved + existingPending.length;
  const newObligations: RescheduledSession[] = [];

  for (let i = 0; i < pastScheduledDates.length; i++) {
    const dKey = pastScheduledDates[i];
    if (!trackedDates.has(dKey) && totalTrackedOrResolved + newObligations.length < pastScheduledDates.length) {
      const targetSeq = totalTrackedOrResolved + newObligations.length;
      const targetDayIndex = targetSeq % daysInCycle;
      const targetWeek = Math.floor(targetSeq / daysInCycle) + 1;
      const dayDef = weekData?.days[targetDayIndex];
      newObligations.push({
        id: `missed_${dKey}_d${targetDayIndex}`,
        originalDateKey: dKey,
        sourceWeek: targetWeek,
        dayIndex: targetDayIndex,
        dayLabel: dayDef?.dayLabel || `Day ${targetDayIndex + 1}`,
        focusLabel: dayDef?.focusLabel || "Make-up Workout",
        status: "pending",
      });
      trackedDates.add(dKey);
    }
  }

  // Check if any scheduled session was displaced because a past slot was used for an earlier make-up
  const deficit = pastScheduledDates.length - (totalTrackedOrResolved + newObligations.length);
  if (deficit > 0) {
    for (let d = 0; d < deficit; d++) {
      const targetSeq = totalTrackedOrResolved + newObligations.length;
      const targetDayIndex = targetSeq % daysInCycle;
      const targetWeek = Math.floor(targetSeq / daysInCycle) + 1;
      const fallbackDate = pastScheduledDates[pastScheduledDates.length - 1 - d] || asOfKey;
      const sessionKey = `${fallbackDate}_displaced_${targetDayIndex}`;
      if (!existingRescheduled.some((s) => s.id === sessionKey || (s.originalDateKey === fallbackDate && s.dayIndex === targetDayIndex))) {
        const dayDef = weekData?.days[targetDayIndex];
        newObligations.push({
          id: sessionKey,
          originalDateKey: fallbackDate,
          sourceWeek: targetWeek,
          dayIndex: targetDayIndex,
          dayLabel: dayDef?.dayLabel || `Day ${targetDayIndex + 1}`,
          focusLabel: dayDef?.focusLabel || "Make-up Workout",
          status: "pending",
        });
      }
    }
  }

  if (newObligations.length === 0) return state;

  return {
    ...state,
    rescheduledSessions: [...existingRescheduled, ...newObligations],
  };
}

/**
 * Places pending make-up sessions into upcoming available training slots,
 * respecting fixed rest days, recovery, and program structure.
 */
export function planRescheduledSessions(
  state: ActiveJeffProgramState,
  asOfDate: Date = new Date()
): ActiveJeffProgramState {
  if (!state.rescheduledSessions || state.rescheduledSessions.length === 0) {
    return state;
  }

  const asOfKey = getProgramDateKey(asOfDate);
  const pendingSessions = state.rescheduledSessions.filter((s) => s.status === "pending");
  if (pendingSessions.length === 0) return state;

  const policy = getProgramMissedPolicy(state);
  const reservedDates = new Set<string>([
    ...state.completedDays,
    ...(state.skippedDates ?? []),
  ]);

  state.rescheduledSessions.forEach((s) => {
    if (s.status === "pending" && s.targetDateKey && s.targetDateKey >= asOfKey) {
      reservedDates.add(s.targetDateKey);
    }
  });

  let cursor = new Date(`${asOfKey}T12:00:00`);
  const updatedSessions = [...state.rescheduledSessions];
  let changed = false;

  for (let i = 0; i < updatedSessions.length; i++) {
    const session = updatedSessions[i];
    if (session.status !== "pending") continue;

    if (session.targetDateKey && session.targetDateKey >= asOfKey) {
      continue;
    }

    let foundSlot: string | null = null;
    const lookahead = new Date(cursor);
    for (let offset = 0; offset < 56; offset++) {
      const candidateKey = getProgramDateKey(lookahead);
      const isCandidateTrainingDay = isDateScheduledTrainingDay(state, lookahead);

      const isValidSlot = policy === "reschedule_to_rest_day"
        ? !isCandidateTrainingDay && !reservedDates.has(candidateKey)
        : isCandidateTrainingDay && !reservedDates.has(candidateKey);

      if (isValidSlot) {
        foundSlot = candidateKey;
        reservedDates.add(candidateKey);
        lookahead.setDate(lookahead.getDate() + 1);
        cursor = new Date(lookahead);
        break;
      }
      lookahead.setDate(lookahead.getDate() + 1);
    }

    if (foundSlot) {
      updatedSessions[i] = {
        ...session,
        targetDateKey: foundSlot,
      };
      changed = true;
    }
  }

  if (!changed) return state;

  return {
    ...state,
    rescheduledSessions: updatedSessions,
  };
}

/**
 * Resolves a temporary rescheduled obligation through completion or explicit skip.
 * Once resolved, the obligation is permanently cleared from active make-up obligations
 * and the application returns to the original recurring schedule.
 */
export function resolveRescheduledSession(
  state: ActiveJeffProgramState,
  sessionId: string,
  action: "complete" | "skip",
  completedDateKey?: string
): ActiveJeffProgramState {
  if (!state.rescheduledSessions || state.rescheduledSessions.length === 0) {
    return state;
  }

  const targetIdx = state.rescheduledSessions.findIndex((s) => s.id === sessionId);
  if (targetIdx === -1) return state;

  const targetSession = state.rescheduledSessions[targetIdx];
  const resolvedDate = completedDateKey || getProgramDateKey();
  const updatedSessions = [...state.rescheduledSessions];

  // Update manualMoves if applicable
  const updatedMoves = (state.manualMoves ?? []).map((m) =>
    m.id === sessionId
      ? { ...m, status: action === "complete" ? ("completed" as const) : ("cancelled" as const), completedAt: resolvedDate }
      : m
  );

  // Update recoveryPlan if applicable
  let updatedRecoveryPlan = state.recoveryPlan;
  let newDismissed = state.dismissedMissedDates ?? [];

  if (updatedRecoveryPlan && (updatedRecoveryPlan.status === "active" || updatedRecoveryPlan.status === "proposed" || updatedRecoveryPlan.status === "awaiting_user_decision")) {
    const updatedPlanSessions = updatedRecoveryPlan.sessions.map((s) => {
      if (s.id === sessionId || s.originalDateKey === targetSession.originalDateKey) {
        return {
          ...s,
          status: action === "complete" ? ("completed" as const) : ("skipped" as const),
          resolvedAt: resolvedDate,
        };
      }
      return s;
    });

    const allPlanResolved = updatedPlanSessions.every((s) => s.status === "completed" || s.status === "skipped");
    updatedRecoveryPlan = {
      ...updatedRecoveryPlan,
      sessions: updatedPlanSessions,
      status: allPlanResolved ? "completed" : updatedRecoveryPlan.status,
      completedAt: allPlanResolved ? resolvedDate : updatedRecoveryPlan.completedAt,
    };

    if (allPlanResolved) {
      newDismissed = Array.from(new Set([...newDismissed, ...updatedPlanSessions.map((s) => s.originalDateKey)]));
    }
  }

  if (action === "complete") {
    updatedSessions[targetIdx] = {
      ...targetSession,
      status: "completed",
      resolvedAt: resolvedDate,
    };
    const alreadyCompleted = state.completedDays.includes(resolvedDate);
    const updatedCompleted = alreadyCompleted ? state.completedDays : [...state.completedDays, resolvedDate];

    const def = resolveProgramDefinition(state);
    const weekData = getProgramCurrentWeek(state);
    const totalDaysInWeek = weekData?.days.length || def.days?.length || (Array.isArray(state.scheduleDays) ? state.scheduleDays.length : 0) || 4;

    let nextDayIdx = state.currentDayIndex;
    let nextWeek = state.currentWeek;

    if (targetSession.sourceWeek === state.currentWeek) {
      if (targetSession.dayIndex === state.currentDayIndex) {
        nextDayIdx = targetSession.dayIndex + 1;
      } else if (targetSession.dayIndex > state.currentDayIndex) {
        nextDayIdx = targetSession.dayIndex + 1;
      }
      if (nextDayIdx >= totalDaysInWeek) {
        nextDayIdx = 0;
        nextWeek = Math.min(def.durationWeeks || 8, state.currentWeek + 1);
      }
    }

    const updatedDeferred = (state.deferredSessionIds ?? []).filter((id) => id !== sessionId && id !== targetSession.id);

    return {
      ...state,
      rescheduledSessions: updatedSessions,
      completedDays: updatedCompleted,
      currentDayIndex: nextDayIdx,
      currentWeek: nextWeek,
      manualMoves: updatedMoves,
      recoveryPlan: updatedRecoveryPlan,
      dismissedMissedDates: newDismissed,
      deferredSessionIds: updatedDeferred,
    };
  } else {
    // Explicit skip
    updatedSessions[targetIdx] = {
      ...targetSession,
      status: "skipped",
      resolvedAt: resolvedDate,
    };
    const skipped = new Set(state.skippedDates ?? []);
    skipped.add(targetSession.originalDateKey);
    if (targetSession.targetDateKey) {
      skipped.add(targetSession.targetDateKey);
    }

    return {
      ...state,
      rescheduledSessions: updatedSessions,
      skippedDates: Array.from(skipped),
      manualMoves: updatedMoves,
      recoveryPlan: updatedRecoveryPlan,
      dismissedMissedDates: newDismissed,
    };
  }
}

/**
 * Cancels a temporary rescheduling adjustment without falsely completing or skipping the workout.
 */
export function cancelRescheduledSession(
  state: ActiveJeffProgramState,
  sessionId: string
): ActiveJeffProgramState {
  if (!state.rescheduledSessions) return state;
  const updatedSessions = state.rescheduledSessions.map((s) => {
    if (s.id === sessionId && s.status === "pending") {
      const { targetDateKey, ...rest } = s;
      return rest as RescheduledSession;
    }
    return s;
  });
  return {
    ...state,
    rescheduledSessions: updatedSessions,
  };
}

/**
 * Detects past scheduled training dates that were missed and are eligible for recovery.
 * Respects dismissed dates, completed sessions, and sequential rotation.
 */
export function detectEligibleMissedDates(
  state: ActiveJeffProgramState,
  asOfDate: Date = new Date()
): string[] {
  if (!state.startDate) return [];
  const asOfKey = getProgramDateKey(asOfDate);
  if (asOfKey <= state.startDate) return [];

  const model = getProgramSchedulingModel(state);
  if (model === "sequential_rotation") return [];

  const existingRescheduled = state.rescheduledSessions ? [...state.rescheduledSessions] : [];
  const activeRecoveryDates = state.recoveryPlan && (state.recoveryPlan.status === "active" || state.recoveryPlan.status === "awaiting_user_decision")
    ? state.recoveryPlan.sessions.map((s) => s.originalDateKey)
    : [];

  const trackedDates = new Set<string>([
    ...state.completedDays,
    ...(state.skippedDates ?? []),
    ...(state.dismissedMissedDates ?? []),
    ...existingRescheduled.map((s) => s.originalDateKey),
    ...activeRecoveryDates,
  ]);

  let current = new Date(`${state.startDate}T12:00:00`);
  if (!Number.isFinite(current.getTime())) return [];

  const pastScheduledDates: string[] = [];
  while (getProgramDateKey(current) < asOfKey) {
    const dKey = getProgramDateKey(current);
    if (isDateScheduledTrainingDay(state, current)) {
      pastScheduledDates.push(dKey);
    }
    current.setDate(current.getDate() + 1);
  }

  return pastScheduledDates.filter((dKey) => !trackedDates.has(dKey));
}

/**
 * Builds a finite recovery plan proposal for user confirmation.
 * Never forces sessions into consecutive days; distributes them safely across upcoming slots.
 */
export function buildRecoveryPlan(
  state: ActiveJeffProgramState,
  asOfDate: Date = new Date()
): RecoveryPlan | null {
  const eligibleDates = detectEligibleMissedDates(state, asOfDate);
  if (eligibleDates.length === 0) {
    if (state.recoveryPlan && (state.recoveryPlan.status === "active" || state.recoveryPlan.status === "awaiting_user_decision")) {
      return state.recoveryPlan;
    }
    return null;
  }

  const asOfKey = getProgramDateKey(asOfDate);
  const def = resolveProgramDefinition(state);
  const weekData = getProgramCurrentWeek(state);
  const daysInCycle = weekData?.days.length || def.days?.length || (Array.isArray(state.scheduleDays) ? state.scheduleDays.length : 0) || 4;
  const policy = getProgramMissedPolicy(state);

  const progressionSeq = Math.max(0, (Math.max(1, state.currentWeek) - 1) * daysInCycle + Math.max(0, state.currentDayIndex));
  const existingPending = (state.rescheduledSessions ?? []).filter((s) => s.status === "pending");
  const totalTrackedOrResolved = Math.max(progressionSeq, state.completedDays.length + (state.skippedDates?.length || 0)) + existingPending.length;

  const reservedDates = new Set<string>([
    ...state.completedDays,
    ...(state.skippedDates ?? []),
    ...(state.dismissedMissedDates ?? []),
    ...existingPending.map((s) => s.targetDateKey || s.originalDateKey),
  ]);

  const proposedSessions: RecoveryPlanSession[] = [];
  let cursor = new Date(`${asOfKey}T12:00:00`);

  for (let i = 0; i < eligibleDates.length; i++) {
    const origKey = eligibleDates[i];
    const targetSeq = totalTrackedOrResolved + proposedSessions.length;
    const targetDayIndex = targetSeq % daysInCycle;
    const targetWeek = Math.floor(targetSeq / daysInCycle) + 1;
    const dayDef = weekData?.days[targetDayIndex];

    let foundSlot: string | null = null;
    const lookahead = new Date(cursor);
    for (let offset = 0; offset < 56; offset++) {
      const candidateKey = getProgramDateKey(lookahead);
      const isCandidateTrainingDay = isDateScheduledTrainingDay(state, lookahead);

      const isValidSlot = policy === "reschedule_to_rest_day"
        ? !isCandidateTrainingDay && !reservedDates.has(candidateKey)
        : isCandidateTrainingDay && !reservedDates.has(candidateKey);

      if (isValidSlot) {
        foundSlot = candidateKey;
        reservedDates.add(candidateKey);
        lookahead.setDate(lookahead.getDate() + 1);
        cursor = new Date(lookahead);
        break;
      }
      lookahead.setDate(lookahead.getDate() + 1);
    }

    proposedSessions.push({
      id: `rec_${origKey}_d${targetDayIndex}`,
      originalDateKey: origKey,
      targetDateKey: foundSlot || origKey,
      sourceWeek: targetWeek,
      dayIndex: targetDayIndex,
      dayLabel: dayDef?.dayLabel || `Day ${targetDayIndex + 1}`,
      focusLabel: dayDef?.focusLabel || "Make-up Workout",
      status: "pending",
    });
  }

  return {
    id: `rec_plan_${asOfKey}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "awaiting_user_decision",
    sessions: proposedSessions,
    dismissedDates: [],
  };
}

/**
 * Confirms and activates a proposed recovery plan, scheduling its finite sessions.
 */
export function confirmRecoveryPlan(
  state: ActiveJeffProgramState,
  planToConfirm?: RecoveryPlan
): ActiveJeffProgramState {
  const plan = planToConfirm || state.recoveryPlan;
  if (!plan || plan.sessions.length === 0) return state;

  const activePlan: RecoveryPlan = {
    ...plan,
    status: "active",
  };

  const newObligations: RescheduledSession[] = plan.sessions.map((s) => {
    const existing = (state.rescheduledSessions ?? []).find((e) => e.id === s.id);
    return {
      id: s.id,
      originalDateKey: s.originalDateKey,
      targetDateKey: s.targetDateKey,
      sourceWeek: s.sourceWeek,
      dayIndex: s.dayIndex,
      dayLabel: s.dayLabel,
      focusLabel: s.focusLabel,
      status: (existing?.status ?? (s.status === "declined" ? "skipped" : s.status ?? "pending")) as RescheduledSessionStatus,
      type: "recovery",
      recoveryPlanId: activePlan.id,
    };
  });

  const existingRescheduled = (state.rescheduledSessions ?? []).filter(
    (s) => !newObligations.some((n) => n.id === s.id)
  );

  return {
    ...state,
    recoveryPlan: activePlan,
    rescheduledSessions: [...existingRescheduled, ...newObligations],
  };
}

/**
 * Declines inserting missed sessions into upcoming schedule.
 * Records dismissed dates to avoid re-prompting and leaves upcoming calendar clean.
 */
export function declineRecoveryPlan(
  state: ActiveJeffProgramState,
  planId?: string
): ActiveJeffProgramState {
  const targetPlan = state.recoveryPlan;
  const datesToDismiss = targetPlan && targetPlan.sessions.length > 0
    ? targetPlan.sessions.map((s) => s.originalDateKey)
    : detectEligibleMissedDates(state);

  const updatedDismissed = Array.from(new Set([
    ...(state.dismissedMissedDates ?? []),
    ...datesToDismiss,
  ]));

  const updatedRescheduled = (state.rescheduledSessions ?? []).filter(
    (s) => s.type !== "recovery" && !datesToDismiss.includes(s.originalDateKey)
  );

  const declinedPlan: RecoveryPlan = targetPlan
    ? {
        ...targetPlan,
        status: "declined",
        dismissedDates: datesToDismiss,
      }
    : {
        id: `rec_declined_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "declined",
        sessions: [],
        dismissedDates: datesToDismiss,
      };

  return {
    ...state,
    recoveryPlan: declinedPlan,
    dismissedMissedDates: updatedDismissed,
    rescheduledSessions: updatedRescheduled,
  };
}

/**
 * Cancels an active or proposed recovery plan, clearing recovery-only sessions.
 */
export function cancelRecoveryPlan(
  state: ActiveJeffProgramState
): ActiveJeffProgramState {
  if (!state.recoveryPlan) return state;

  const planId = state.recoveryPlan.id;
  const updatedRescheduled = (state.rescheduledSessions ?? []).filter(
    (s) => s.recoveryPlanId !== planId
  );

  return {
    ...state,
    recoveryPlan: {
      ...state.recoveryPlan,
      status: "cancelled",
    },
    rescheduledSessions: updatedRescheduled,
  };
}

/**
 * Monday-to-Sunday week calculations using device local time.
 */
export function getMondayOfWeek(date: Date | string): string {
  const d = typeof date === "string" ? new Date(`${date}T12:00:00`) : new Date(date);
  const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const mon = new Date(d);
  mon.setDate(mon.getDate() - dayOfWeek);
  return getProgramDateKey(mon);
}

export function getSundayOfWeek(date: Date | string): string {
  const monKey = getMondayOfWeek(date);
  const mon = new Date(`${monKey}T12:00:00`);
  mon.setDate(mon.getDate() + 6);
  return getProgramDateKey(mon);
}

export function getCalendarWeekNumber(startDate: string, targetDate: Date | string): number {
  const startMon = new Date(`${getMondayOfWeek(startDate)}T12:00:00`);
  const targetMon = new Date(`${getMondayOfWeek(targetDate)}T12:00:00`);
  const diffWeeks = Math.round((targetMon.getTime() - startMon.getTime()) / (7 * 86400000));
  return Math.max(1, diffWeeks + 1);
}

/**
 * Validates a proposed recovery destination date against current program constraints,
 * rest days, completed days, and existing manual moves/recovery sessions.
 */
export function validateRecoveryDestinationDate(
  state: ActiveJeffProgramState,
  targetDateKey: string,
  fromDateKey?: string,
  asOfDate: Date = new Date()
): { isValid: boolean; reason?: string } {
  const asOfKey = getProgramDateKey(asOfDate);
  if (targetDateKey < asOfKey) {
    return { isValid: false, reason: "ไม่สามารถเลือกวันที่ในอดีตได้" };
  }
  if (fromDateKey && targetDateKey === fromDateKey) {
    return { isValid: false, reason: "วันเป้าหมายต้องไม่ใช่วันเดิมที่พลาด" };
  }
  if (state.completedDays.includes(targetDateKey)) {
    return { isValid: false, reason: "วันนี้ฝึกเสร็จสิ้นแล้ว" };
  }
  const hasMoveConflict = (state.manualMoves ?? []).some(
    (m) => m.status === "pending" && m.targetDateKey === targetDateKey
  );
  if (hasMoveConflict) {
    return { isValid: false, reason: "มีเซสชันอื่นย้ายมาลงวันนี้แล้ว" };
  }
  const hasRecoveryConflict = (state.rescheduledSessions ?? []).some(
    (s) => s.status === "pending" && s.targetDateKey === targetDateKey && (!fromDateKey || s.originalDateKey !== fromDateKey)
  );
  if (hasRecoveryConflict) {
    return { isValid: false, reason: "มีเซสชันชดเชยอื่นกำหนดลงวันนี้แล้ว" };
  }
  return { isValid: true };
}

/**
 * Returns available recovery slots within a given week (Monday to Sunday)
 * targeting non-conflicting rest days or free days.
 */
export function getAvailableRecoverySlotsInWeek(
  state: ActiveJeffProgramState,
  weekMondayKey: string,
  asOfDate: Date = new Date()
): string[] {
  const asOfKey = getProgramDateKey(asOfDate);
  const mon = new Date(`${weekMondayKey}T12:00:00`);
  const slots: string[] = [];

  for (let i = 0; i < 7; i++) {
    const candidate = new Date(mon);
    candidate.setDate(mon.getDate() + i);
    const candidateKey = getProgramDateKey(candidate);

    if (candidateKey < asOfKey) continue;
    const validation = validateRecoveryDestinationDate(state, candidateKey, undefined, asOfDate);
    if (!validation.isValid) continue;

    // Prefer rest days
    const isScheduledTraining = isDateScheduledTrainingDay(state, candidate);
    if (!isScheduledTraining) {
      slots.push(candidateKey);
    }
  }

  // If no rest days available, check if any training day has no scheduled workout or is uncompleted
  if (slots.length === 0) {
    for (let i = 0; i < 7; i++) {
      const candidate = new Date(mon);
      candidate.setDate(mon.getDate() + i);
      const candidateKey = getProgramDateKey(candidate);
      if (candidateKey < asOfKey) continue;
      const validation = validateRecoveryDestinationDate(state, candidateKey, undefined, asOfDate);
      if (validation.isValid) {
        slots.push(candidateKey);
      }
    }
  }

  return slots;
}

/**
 * Finds all genuine unresolved missed sessions that are awaiting recovery decisions.
 */
export function detectUnresolvedMissedSessions(
  state: ActiveJeffProgramState,
  asOfDate: Date = new Date()
): RescheduledSession[] {
  const model = getProgramSchedulingModel(state);
  if (model === "sequential_rotation") return [];

  const eligibleDates = detectEligibleMissedDates(state, asOfDate);
  const def = resolveProgramDefinition(state);
  const weekData = getProgramCurrentWeek(state);
  const daysInCycle = weekData?.days.length || def.days?.length || (Array.isArray(state.scheduleDays) ? state.scheduleDays.length : 0) || 4;

  const existingRescheduled = state.rescheduledSessions ? [...state.rescheduledSessions] : [];
  const results: RescheduledSession[] = [];

  // 1. Existing pending sessions without targetDateKey or with targetDateKey in past
  const asOfKey = getProgramDateKey(asOfDate);
  existingRescheduled.forEach((s) => {
    if (s.status === "pending" && (!s.targetDateKey || s.targetDateKey < asOfKey)) {
      if (!state.completedDays.includes(s.originalDateKey) && !state.dismissedMissedDates?.includes(s.originalDateKey)) {
        results.push(s);
      }
    }
  });

  // 2. Newly detected missed dates not yet in rescheduledSessions
  for (const dateKey of eligibleDates) {
    if (!results.some((r) => r.originalDateKey === dateKey)) {
      const dateObj = new Date(`${dateKey}T12:00:00`);
      const sourceWeek = getCalendarWeekNumber(state.startDate, dateObj);
      const dayOfWeek = (dateObj.getDay() + 6) % 7;
      const schedIndex = state.scheduleDays.indexOf(dayOfWeek);
      const dayIndex = schedIndex >= 0 ? schedIndex % daysInCycle : 0;
      const dayDef = weekData?.days[dayIndex];

      results.push({
        id: `missed_${dateKey}_d${dayIndex}`,
        originalDateKey: dateKey,
        sourceWeek,
        dayIndex,
        dayLabel: dayDef?.dayLabel || `Day ${dayIndex + 1}`,
        focusLabel: dayDef?.focusLabel || "Make-up Workout",
        status: "pending",
      });
    }
  }

  return results;
}

/**
 * Recovers a missed session within the current week on a chosen or recommended date.
 */
export function recoverSessionThisWeek(
  state: ActiveJeffProgramState,
  sessionId: string,
  targetDateKey: string,
  asOfDate: Date = new Date()
): { success: boolean; state: ActiveJeffProgramState; error?: string } {
  const validation = validateRecoveryDestinationDate(state, targetDateKey, undefined, asOfDate);
  if (!validation.isValid) {
    return { success: false, state, error: validation.reason };
  }

  const existingRescheduled = state.rescheduledSessions ? [...state.rescheduledSessions] : [];
  let targetSession = existingRescheduled.find((s) => s.id === sessionId);

  if (!targetSession) {
    const unresolved = detectUnresolvedMissedSessions(state);
    targetSession = unresolved.find((s) => s.id === sessionId || s.originalDateKey === sessionId);
  }

  if (!targetSession) {
    return { success: false, state, error: "ไม่พบเซสชันที่ต้องการชดเชย" };
  }

  const updatedSession: RescheduledSession = {
    ...targetSession,
    targetDateKey,
    status: "pending",
    decision: "scheduled",
    type: "recovery",
  };

  const updatedRescheduled = [
    ...existingRescheduled.filter((s) => s.id !== targetSession!.id && s.originalDateKey !== targetSession!.originalDateKey),
    updatedSession,
  ];

  const updatedDeferred = (state.deferredSessionIds ?? []).filter((id) => id !== targetSession!.id);

  return {
    success: true,
    state: {
      ...state,
      rescheduledSessions: updatedRescheduled,
      deferredSessionIds: updatedDeferred,
    },
  };
}

/**
 * Defers recovery of a missed session to a future week.
 * Preserves the session record without occupying upcoming week slots or nagging repeatedly.
 */
export function deferSessionToFutureWeek(
  state: ActiveJeffProgramState,
  sessionId: string
): ActiveJeffProgramState {
  const existingRescheduled = state.rescheduledSessions ? [...state.rescheduledSessions] : [];
  let targetSession = existingRescheduled.find((s) => s.id === sessionId);

  if (!targetSession) {
    const unresolved = detectUnresolvedMissedSessions(state);
    targetSession = unresolved.find((s) => s.id === sessionId || s.originalDateKey === sessionId);
  }

  if (!targetSession) return state;

  const deferredSession: RescheduledSession = {
    ...targetSession,
    targetDateKey: undefined,
    status: "deferred",
    decision: "deferred",
    type: "recovery",
  };

  const updatedRescheduled = [
    ...existingRescheduled.filter((s) => s.id !== targetSession!.id && s.originalDateKey !== targetSession!.originalDateKey),
    deferredSession,
  ];

  const updatedDeferred = Array.from(new Set([...(state.deferredSessionIds ?? []), targetSession.id]));

  return {
    ...state,
    rescheduledSessions: updatedRescheduled,
    deferredSessionIds: updatedDeferred,
  };
}

/**
 * Explicitly skips and dismisses a missed session.
 * Preserves workout history, records dismissal, and never re-prompts for this date.
 */
export function skipAndDismissSession(
  state: ActiveJeffProgramState,
  sessionId: string
): ActiveJeffProgramState {
  const existingRescheduled = state.rescheduledSessions ? [...state.rescheduledSessions] : [];
  let targetSession = existingRescheduled.find((s) => s.id === sessionId);

  if (!targetSession) {
    const unresolved = detectUnresolvedMissedSessions(state);
    targetSession = unresolved.find((s) => s.id === sessionId || s.originalDateKey === sessionId);
  }

  const origKey = targetSession?.originalDateKey || sessionId;
  const updatedDismissed = Array.from(new Set([...(state.dismissedMissedDates ?? []), origKey]));
  const updatedSkipped = Array.from(new Set([...(state.skippedDates ?? []), origKey]));

  const updatedRescheduled = existingRescheduled.map((s) => {
    if (s.id === sessionId || s.originalDateKey === origKey) {
      return {
        ...s,
        status: "skipped" as const,
        decision: "declined" as const,
        targetDateKey: undefined,
      };
    }
    return s;
  });

  return {
    ...state,
    dismissedMissedDates: updatedDismissed,
    skippedDates: updatedSkipped,
    rescheduledSessions: updatedRescheduled,
  };
}

/**
 * Dismisses the recovery prompt for today without discarding or altering unresolved sessions.
 * Provides an unobtrusive backlog affordance.
 */
export function decideRecoveryLater(
  state: ActiveJeffProgramState,
  asOfDateKey: string = getProgramDateKey()
): ActiveJeffProgramState {
  return {
    ...state,
    lastPromptDismissedDateKey: asOfDateKey,
  };
}

/**
 * Detects whether a weekly review is needed across week boundaries.
 * Evaluates the completed previous week, checks whether review was already recorded,
 * and identifies genuinely unresolved sessions.
 */
export function detectWeeklyReview(
  state: ActiveJeffProgramState,
  asOfDate: Date = new Date()
): WeeklyReviewData | null {
  const model = getProgramSchedulingModel(state);
  if (model === "sequential_rotation" || !state.startDate) return null;

  const asOfKey = getProgramDateKey(asOfDate);
  const currentWeekMondayKey = getMondayOfWeek(asOfDate);
  const startWeekMondayKey = getMondayOfWeek(state.startDate);

  // Still in first week, no previous week to review yet
  if (currentWeekMondayKey <= startWeekMondayKey) return null;

  // Previous week definition
  const prevSundayDate = new Date(`${currentWeekMondayKey}T12:00:00`);
  prevSundayDate.setDate(prevSundayDate.getDate() - 1);
  const prevSundayKey = getProgramDateKey(prevSundayDate);
  const prevMondayKey = getMondayOfWeek(prevSundayDate);

  const prevWeekNumber = getCalendarWeekNumber(state.startDate, prevSundayDate);

  // If this week was already reviewed, do not re-prompt! (Decision persistence)
  if (state.weeklyReviews?.some((r) => r.weekNumber === prevWeekNumber)) {
    return null;
  }

  // Collect scheduled sessions for previous week
  let cursor = new Date(`${prevMondayKey}T12:00:00`);
  const scheduledDates: string[] = [];
  const completedDates: string[] = [];
  const unresolvedSessions: RescheduledSession[] = [];

  const def = resolveProgramDefinition(state);
  const weekData = getProgramCurrentWeek(state);
  const daysInCycle = weekData?.days.length || def.days?.length || (Array.isArray(state.scheduleDays) ? state.scheduleDays.length : 0) || 4;

  for (let i = 0; i < 7; i++) {
    const dKey = getProgramDateKey(cursor);
    if (isDateScheduledTrainingDay(state, cursor)) {
      scheduledDates.push(dKey);
      if (state.completedDays.includes(dKey)) {
        completedDates.push(dKey);
      } else {
        const isDismissed = state.dismissedMissedDates?.includes(dKey) || state.skippedDates?.includes(dKey);
        const hasUpcomingRecovery = (state.rescheduledSessions ?? []).some(
          (s) => s.originalDateKey === dKey && s.status === "pending" && s.targetDateKey && s.targetDateKey >= asOfKey
        );
        const isAlreadyDeferred = state.deferredSessionIds?.some((id) => id.includes(dKey)) ||
          (state.rescheduledSessions ?? []).some((s) => s.originalDateKey === dKey && s.status === "deferred");

        if (!isDismissed && !hasUpcomingRecovery && !isAlreadyDeferred) {
          const dayOfWeek = (cursor.getDay() + 6) % 7;
          const schedIndex = state.scheduleDays.indexOf(dayOfWeek);
          const dayIndex = schedIndex >= 0 ? schedIndex % daysInCycle : 0;
          const dayDef = weekData?.days[dayIndex];

          unresolvedSessions.push({
            id: `missed_${dKey}_d${dayIndex}`,
            originalDateKey: dKey,
            sourceWeek: prevWeekNumber,
            dayIndex,
            dayLabel: dayDef?.dayLabel || `Day ${dayIndex + 1}`,
            focusLabel: dayDef?.focusLabel || "Incomplete Session",
            status: "pending",
          });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (unresolvedSessions.length === 0) return null;

  const availableSlotsInCurrentWeek = getAvailableRecoverySlotsInWeek(state, currentWeekMondayKey, asOfDate);

  return {
    previousWeekNumber: prevWeekNumber,
    totalScheduled: scheduledDates.length,
    completedCount: completedDates.length,
    unresolvedSessions,
    availableSlotsInCurrentWeek,
  };
}

/**
 * Completes weekly review for a specific week number, persists the user's decision,
 * and executes the chosen recovery or deferral actions.
 */
export function completeWeeklyReview(
  state: ActiveJeffProgramState,
  weekNumber: number,
  decision: "recover_this_week" | "defer" | "skip" | "decide_later",
  sessionAssignments?: Record<string, string>
): ActiveJeffProgramState {
  let updatedState = { ...state };
  const reviewSessions = detectWeeklyReview(state)?.unresolvedSessions || [];
  const sessionIds = reviewSessions.map((s) => s.id);

  if (decision === "recover_this_week") {
    reviewSessions.forEach((s) => {
      const targetDate = sessionAssignments?.[s.id];
      if (targetDate) {
        const res = recoverSessionThisWeek(updatedState, s.id, targetDate);
        if (res.success) {
          updatedState = res.state;
        }
      }
    });
  } else if (decision === "defer") {
    reviewSessions.forEach((s) => {
      updatedState = deferSessionToFutureWeek(updatedState, s.id);
    });
  } else if (decision === "skip") {
    reviewSessions.forEach((s) => {
      updatedState = skipAndDismissSession(updatedState, s.id);
    });
  } else if (decision === "decide_later") {
    updatedState = decideRecoveryLater(updatedState);
  }

  const reviewRecord: WeeklyReviewRecord = {
    weekNumber,
    reviewedAtDateKey: getProgramDateKey(),
    unresolvedSessionIds: sessionIds,
    decision,
  };

  const updatedReviews = [
    ...(updatedState.weeklyReviews ?? []).filter((r) => r.weekNumber !== weekNumber),
    reviewRecord,
  ];

  return {
    ...updatedState,
    weeklyReviews: updatedReviews,
  };
}

/**
 * Evaluates candidate move dates for a workout session with conflict detection.
 */
export function getValidMoveDates(
  state: ActiveJeffProgramState,
  fromDateKey: string,
  lookaheadDays: number = 21
): {
  dateKey: string;
  isScheduledTrainingDay: boolean;
  isRestDay: boolean;
  isAlreadyCompleted: boolean;
  hasConflict: boolean;
  conflictReason?: string;
  canMove: boolean;
  isValid: boolean;
}[] {
  const result = [];
  const fromDate = new Date(`${fromDateKey}T12:00:00`);
  const start = new Date(fromDate);
  start.setDate(start.getDate() - 3);

  const totalDays = lookaheadDays + 4;
  const pendingMoves = (state.manualMoves ?? []).filter((m) => m.status === "pending");

  for (let offset = 0; offset <= totalDays; offset++) {
    const candidate = new Date(start);
    candidate.setDate(candidate.getDate() + offset);
    const candidateKey = getProgramDateKey(candidate);

    const isScheduledTraining = isDateScheduledTrainingDay(state, candidate);
    const isCompleted = state.completedDays.includes(candidateKey);
    const isSameDay = candidateKey === fromDateKey;
    const isMovedToThisDay = pendingMoves.some((m) => m.targetDateKey === candidateKey);
    const isRescheduledToThisDay = (state.rescheduledSessions ?? []).some(
      (s) => s.status === "pending" && s.targetDateKey === candidateKey && s.originalDateKey !== fromDateKey
    );

    let hasConflict = false;
    let conflictReason: string | undefined = undefined;

    if (isSameDay) {
      hasConflict = true;
      conflictReason = "วันเดิมที่เลือกไว้";
    } else if (isCompleted) {
      hasConflict = true;
      conflictReason = "ฝึกเสร็จสิ้นแล้ว";
    } else if (isMovedToThisDay) {
      hasConflict = true;
      conflictReason = "มีเซสชันอื่นย้ายมาลงวันนี้แล้ว";
    } else if (isRescheduledToThisDay) {
      hasConflict = true;
      conflictReason = "มีเซสชันชดเชยกำหนดลงวันนี้แล้ว";
    }

    result.push({
      dateKey: candidateKey,
      isScheduledTrainingDay: isScheduledTraining,
      isRestDay: !isScheduledTraining,
      isAlreadyCompleted: isCompleted,
      hasConflict,
      conflictReason,
      canMove: !hasConflict,
      isValid: !hasConflict,
    });
  }

  return result;
}

/**
 * Manually moves a scheduled workout session from one date to another.
 * Never marks as completed or duplicates history.
 */
export function moveWorkoutSession(
  state: ActiveJeffProgramState,
  fromDateKey: string,
  toDateKey: string
): { success: boolean; error?: string; state: ActiveJeffProgramState } {
  if (fromDateKey === toDateKey) {
    return { success: false, error: "Target date must be different from source date", state };
  }
  if (state.completedDays.includes(toDateKey)) {
    return { success: false, error: "Cannot move workout to an already completed date", state };
  }
  const pendingMoves = (state.manualMoves ?? []).filter((m) => m.status === "pending");
  if (pendingMoves.some((m) => m.targetDateKey === toDateKey)) {
    return { success: false, error: "Another session has already been moved to this date", state };
  }
  const pendingRecovery = (state.rescheduledSessions ?? []).filter((s) => s.status === "pending");
  if (pendingRecovery.some((s) => s.targetDateKey === toDateKey && s.originalDateKey !== fromDateKey)) {
    return { success: false, error: "Another session has already been scheduled for recovery on this date", state };
  }

  const weekData = getProgramCurrentWeek(state);

  const existingPending = (state.rescheduledSessions ?? []).find(
    (s) => s.status === "pending" && (s.targetDateKey === fromDateKey || s.originalDateKey === fromDateKey)
  );

  let sourceDayIndex = state.currentDayIndex;
  let sourceWeek = state.currentWeek;
  let dayLabel = `Day ${sourceDayIndex + 1}`;
  let focusLabel = "Workout Session";

  if (existingPending) {
    sourceDayIndex = existingPending.dayIndex;
    sourceWeek = existingPending.sourceWeek;
    dayLabel = existingPending.dayLabel;
    focusLabel = existingPending.focusLabel;
  } else {
    const resolution = resolveProgramDayForDate(state, new Date(`${fromDateKey}T12:00:00`));
    sourceDayIndex = resolution.scheduledDayIndex;
    sourceWeek = resolution.cycleNumber;
    const dayDef = weekData?.days[sourceDayIndex];
    if (dayDef) {
      dayLabel = dayDef.dayLabel;
      focusLabel = dayDef.focusLabel;
    }
  }

  const moveId = `manual_move_${fromDateKey}_to_${toDateKey}_d${sourceDayIndex}`;
  const move: ManualScheduleMove = {
    id: moveId,
    originalDateKey: fromDateKey,
    targetDateKey: toDateKey,
    sourceWeek,
    dayIndex: sourceDayIndex,
    dayLabel,
    focusLabel,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const moveRescheduled: RescheduledSession = {
    id: moveId,
    originalDateKey: fromDateKey,
    targetDateKey: toDateKey,
    sourceWeek,
    dayIndex: sourceDayIndex,
    dayLabel,
    focusLabel,
    status: "pending",
    type: "manual_move",
  };

  const updatedMoves = [
    ...(state.manualMoves ?? []).filter((m) => m.originalDateKey !== fromDateKey),
    move,
  ];

  const updatedRescheduled = [
    ...(state.rescheduledSessions ?? []).filter((s) => s.originalDateKey !== fromDateKey || s.type !== "manual_move"),
    moveRescheduled,
  ];

  return {
    success: true,
    state: {
      ...state,
      manualMoves: updatedMoves,
      rescheduledSessions: updatedRescheduled,
    },
  };
}

/**
 * Cancels a pending manual move, returning the session to its original scheduled slot.
 */
export function cancelManualMove(
  state: ActiveJeffProgramState,
  moveId: string
): ActiveJeffProgramState {
  if (!state.manualMoves && !state.rescheduledSessions) return state;
  const updatedMoves = (state.manualMoves ?? []).filter((m) => m.id !== moveId);
  const updatedRescheduled = (state.rescheduledSessions ?? []).filter((s) => s.id !== moveId);
  return {
    ...state,
    manualMoves: updatedMoves,
    rescheduledSessions: updatedRescheduled,
  };
}

export type EligibleSessionOption = {
  id: string;
  dayIndex: number;
  sourceWeek: number;
  dayLabel: string;
  focusLabel: string;
  type: "missed_recovery" | "next_scheduled" | "current_week";
  rescheduledSessionId?: string;
  hasConflict: boolean;
  conflictReason?: string;
};

/**
 * Returns the eligible workout sessions that a user can select to train on a given date.
 * Includes pending missed/make-up sessions, the next progression workout, and current-week sessions.
 */
export function getEligibleSessionsForDate(
  state: ActiveJeffProgramState,
  targetDateKey: string = getProgramDateKey()
): EligibleSessionOption[] {
  const result: EligibleSessionOption[] = [];
  const isTargetCompleted = state.completedDays.includes(targetDateKey);
  const weekData = getProgramCurrentWeek(state);
  const def = resolveProgramDefinition(state);
  const days = weekData?.days || def.days || [];
  const currentWeek = state.currentWeek || 1;

  // 1. Pending missed/make-up sessions
  const pendingRescheduled = (state.rescheduledSessions ?? []).filter((s) => s.status === "pending");
  for (const s of pendingRescheduled) {
    result.push({
      id: s.id,
      dayIndex: s.dayIndex,
      sourceWeek: s.sourceWeek,
      dayLabel: s.dayLabel,
      focusLabel: s.focusLabel,
      type: "missed_recovery",
      rescheduledSessionId: s.id,
      hasConflict: isTargetCompleted,
      conflictReason: isTargetCompleted ? "วันนี้ฝึกเสร็จสิ้นแล้ว" : undefined,
    });
  }

  // 2. Next scheduled session according to progression
  const safeDayIndex = Math.max(0, Math.min(state.currentDayIndex || 0, Math.max(0, days.length - 1)));
  const nextDayDef = days[safeDayIndex];
  if (nextDayDef && !result.some((r) => r.dayIndex === safeDayIndex && r.sourceWeek === currentWeek)) {
    result.push({
      id: `progression_w${currentWeek}_d${safeDayIndex}`,
      dayIndex: safeDayIndex,
      sourceWeek: currentWeek,
      dayLabel: nextDayDef.dayLabel,
      focusLabel: nextDayDef.focusLabel,
      type: "next_scheduled",
      hasConflict: isTargetCompleted,
      conflictReason: isTargetCompleted ? "วันนี้ฝึกเสร็จสิ้นแล้ว" : undefined,
    });
  }

  // 3. Other sessions in current week
  days.forEach((d, idx) => {
    if (!result.some((r) => r.dayIndex === idx && r.sourceWeek === currentWeek)) {
      result.push({
        id: `week_w${currentWeek}_d${idx}`,
        dayIndex: idx,
        sourceWeek: currentWeek,
        dayLabel: d.dayLabel,
        focusLabel: d.focusLabel,
        type: "current_week",
        hasConflict: isTargetCompleted,
        conflictReason: isTargetCompleted ? "วันนี้ฝึกเสร็จสิ้นแล้ว" : undefined,
      });
    }
  });

  return result;
}

/**
 * Schedules an intentional one-time training session override for today.
 * Preserves recurring rest days and normal schedule configuration.
 */
export function scheduleTodayOverride(
  state: ActiveJeffProgramState,
  option: { dayIndex: number; sourceWeek?: number; rescheduledSessionId?: string },
  todayDateKey: string = getProgramDateKey()
): { success: boolean; error?: string; state: ActiveJeffProgramState } {
  if (state.completedDays.includes(todayDateKey)) {
    return {
      success: false,
      error: "วันนี้ฝึกเสร็จสิ้นแล้ว ไม่สามารถจัดเซสชันซ้ำในวันเดียวกันได้",
      state,
    };
  }

  const def = resolveProgramDefinition(state);
  const weekData = getProgramCurrentWeek(state);
  const targetWeek = option.sourceWeek || state.currentWeek || 1;
  const dayDef = weekData?.days[option.dayIndex] || def.days?.[option.dayIndex];
  const dayLabel = dayDef?.dayLabel || `Day ${option.dayIndex + 1}`;
  const focusLabel = dayDef?.focusLabel || "Workout Session";

  // If selecting a pending make-up session, re-target it to today
  if (option.rescheduledSessionId) {
    const pendingList = state.rescheduledSessions ?? [];
    const targetSession = pendingList.find((s) => s.id === option.rescheduledSessionId);
    if (targetSession) {
      const updatedRescheduled = pendingList.map((s) =>
        s.id === option.rescheduledSessionId ? { ...s, targetDateKey: todayDateKey } : s
      );
      const effectiveStartDate = state.startDate && todayDateKey < state.startDate ? todayDateKey : state.startDate;
      return {
        success: true,
        state: {
          ...state,
          startDate: effectiveStartDate,
          rescheduledSessions: updatedRescheduled,
        },
      };
    }
  }

  // Otherwise, create a one-time manual move targeted to today without mutating recurring scheduleDays
  const moveId = `override_${todayDateKey}_d${option.dayIndex}_${Date.now()}`;
  const move: ManualScheduleMove = {
    id: moveId,
    originalDateKey: todayDateKey,
    targetDateKey: todayDateKey,
    sourceWeek: targetWeek,
    dayIndex: option.dayIndex,
    dayLabel,
    focusLabel,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const moveRescheduled: RescheduledSession = {
    id: moveId,
    originalDateKey: todayDateKey,
    targetDateKey: todayDateKey,
    sourceWeek: targetWeek,
    dayIndex: option.dayIndex,
    dayLabel,
    focusLabel,
    status: "pending",
    type: "manual_move",
  };

  const filteredMoves = (state.manualMoves ?? []).filter((m) => m.targetDateKey !== todayDateKey);
  const filteredRescheduled = (state.rescheduledSessions ?? []).filter(
    (s) => s.targetDateKey !== todayDateKey || s.type !== "manual_move"
  );

  const effectiveStartDate = state.startDate && todayDateKey < state.startDate ? todayDateKey : state.startDate;

  return {
    success: true,
    state: {
      ...state,
      startDate: effectiveStartDate,
      manualMoves: [...filteredMoves, move],
      rescheduledSessions: [...filteredRescheduled, moveRescheduled],
    },
  };
}

/**
 * Universal Calendar-aware schedule resolver:
 * Evaluates configured training/rest days, manual moves, recovery sessions, and progression.
 * Returns authoritative schedule status and day recommendation for any date.
 */
export function resolveProgramDayForDate(
  state: ActiveJeffProgramState,
  date: Date = new Date()
): ProgramDayResolution {
  const dateKey = getProgramDateKey(date);
  const isCompleted = state.completedDays.includes(dateKey);
  const pendingSessions = (state.rescheduledSessions ?? []).filter((s) => s.status === "pending");

  const safeCurrentDayIndex = Number.isInteger(state.currentDayIndex)
    ? Math.max(0, state.currentDayIndex)
    : 0;

  if (isJeffProgramComplete(state)) {
    return {
      isTrainingDay: false,
      scheduledDayIndex: safeCurrentDayIndex,
      cycleNumber: state.currentWeek,
      isCompleted: true,
      dateKey,
      isRestDay: true,
      reason: "program_completed",
    };
  }

  // 1. Check if a manual move or one-time override is targeted TO this date
  const activeManualMoves = (state.manualMoves ?? []).filter((m) => m.status === "pending");
  const moveTargetedToDate = activeManualMoves.find((m) => m.targetDateKey === dateKey);
  if (moveTargetedToDate) {
    return {
      isTrainingDay: true,
      scheduledDayIndex: moveTargetedToDate.dayIndex,
      cycleNumber: moveTargetedToDate.sourceWeek,
      isCompleted,
      dateKey,
      isManualMove: true,
      manualMove: moveTargetedToDate,
      pendingBacklogCount: pendingSessions.length,
      isRestDay: false,
      reason: "manual_move",
    };
  }

  // 1b. Check if a pending rescheduled/recovery session is targeted specifically for this date
  const targetedSession = pendingSessions.find((s) => s.targetDateKey === dateKey);
  if (targetedSession) {
    const isMove = targetedSession.type === "manual_move";
    return {
      isTrainingDay: true,
      scheduledDayIndex: targetedSession.dayIndex,
      cycleNumber: targetedSession.sourceWeek,
      isCompleted,
      dateKey,
      isRescheduledMakeUp: !isMove,
      rescheduledSession: targetedSession,
      isManualMove: isMove,
      pendingBacklogCount: pendingSessions.length,
      isRestDay: false,
      reason: isMove ? "manual_move" : "make_up_session",
    };
  }

  const isAfterStartDate = !state.startDate || dateKey >= state.startDate;
  if (!isAfterStartDate) {
    return {
      isTrainingDay: false,
      scheduledDayIndex: safeCurrentDayIndex,
      cycleNumber: Math.max(1, state.currentWeek || 1),
      isCompleted: false,
      dateKey,
      isRestDay: true,
      reason: "before_start",
    };
  }

  // 2. Check if a scheduled session was moved AWAY from this date
  const moveAwayFromDate = activeManualMoves.find((m) => m.originalDateKey === dateKey);
  if (moveAwayFromDate) {
    return {
      isTrainingDay: false,
      scheduledDayIndex: safeCurrentDayIndex,
      cycleNumber: state.currentWeek,
      isCompleted,
      dateKey,
      isManualMove: true,
      manualMove: moveAwayFromDate,
      pendingBacklogCount: pendingSessions.length,
      isRestDay: true,
      reason: "scheduled_rest",
    };
  }

  const model = getProgramSchedulingModel(state);
  const isScheduledTraining = isDateScheduledTrainingDay(state, date);

  // Sequential rotation: workouts advance linearly when trained
  if (model === "sequential_rotation") {
    const weekData = getProgramCurrentWeek(state);
    const dayCount = weekData?.days.length || 1;
    const scheduledDayIndex = Math.max(0, Math.min(state.currentDayIndex || 0, dayCount - 1));
    return {
      isTrainingDay: isScheduledTraining,
      scheduledDayIndex,
      cycleNumber: state.currentWeek,
      isCompleted,
      dateKey,
      isRescheduledMakeUp: false,
      pendingBacklogCount: 0,
      isRestDay: !isScheduledTraining,
      reason: isScheduledTraining ? "scheduled_session" : "scheduled_rest",
    };
  }

  // 4. If today is a scheduled training day and there is a pending make-up session targeted specifically for today:
  const isRecoveryDeclined = state.recoveryPlan?.status === "declined";
  if (isScheduledTraining && pendingSessions.length > 0 && !isRecoveryDeclined) {
    const candidateSession = pendingSessions.find((s) => s.targetDateKey === dateKey);

    if (candidateSession) {
      const isMove = candidateSession.type === "manual_move";
      return {
        isTrainingDay: true,
        scheduledDayIndex: candidateSession.dayIndex,
        cycleNumber: candidateSession.sourceWeek,
        isCompleted,
        dateKey,
        isRescheduledMakeUp: !isMove,
        rescheduledSession: candidateSession,
        isManualMove: isMove,
        pendingBacklogCount: pendingSessions.length,
        isRestDay: false,
        reason: isMove ? "manual_move" : "make_up_session",
      };
    }
  }

  // 5. Normal recurring program schedule
  const weekData = getProgramCurrentWeek(state);
  const dayCount = weekData?.days.length || 1;
  const scheduledDayIndex = Math.max(0, Math.min(state.currentDayIndex || 0, dayCount - 1));

  return {
    isTrainingDay: isScheduledTraining,
    scheduledDayIndex,
    cycleNumber: state.currentWeek,
    isCompleted,
    dateKey,
    isRescheduledMakeUp: false,
    rescheduledSession: undefined,
    pendingBacklogCount: isRecoveryDeclined ? 0 : pendingSessions.length,
    isRestDay: !isScheduledTraining,
    reason: isScheduledTraining ? "scheduled_session" : "scheduled_rest",
  };
}

/**
 * Advance program progression after finishing a session:
 * Marks date completed, resolves any corresponding make-up or manual move exactly once,
 * and advances day/week without corrupting calendar mapping.
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

  // Check if this completion fulfills an active pending manual move or make-up obligation
  const pendingList = (currentState.rescheduledSessions ?? []).filter((s) => s.status === "pending");
  const matchingRescheduled = pendingList.find(
    (s) =>
      s.targetDateKey === completedDateKey ||
      (s.sourceWeek === currentState.currentWeek && s.dayIndex === completedDayIndex && !s.targetDateKey)
  );

  if (matchingRescheduled) {
    return resolveRescheduledSession(currentState, matchingRescheduled.id, "complete", completedDateKey);
  }

  // Check if matching a pending manual move directly
  const matchingMove = (currentState.manualMoves ?? []).find(
    (m) =>
      m.status === "pending" &&
      (m.targetDateKey === completedDateKey ||
        (m.sourceWeek === currentState.currentWeek && m.dayIndex === completedDayIndex && !m.targetDateKey))
  );
  if (matchingMove) {
    return resolveRescheduledSession(currentState, matchingMove.id, "complete", completedDateKey);
  }

  const def = resolveProgramDefinition(currentState);
  const weekData = getProgramCurrentWeek(currentState);
  const totalDaysInWeek = weekData?.days.length || def.days?.length || (Array.isArray(currentState.scheduleDays) ? currentState.scheduleDays.length : 0) || 4;
  const updatedCompleted = [...currentState.completedDays, completedDateKey];
  const safeCompletedIndex = Number.isInteger(completedDayIndex)
    ? Math.max(0, Math.min(completedDayIndex, totalDaysInWeek - 1))
    : currentState.currentDayIndex;

  let nextDayIdx = Math.max(currentState.currentDayIndex, safeCompletedIndex) + 1;
  let nextWeek = currentState.currentWeek;

  if (nextDayIdx >= totalDaysInWeek) {
    nextDayIdx = 0;
    nextWeek = Math.min(def.durationWeeks || 8, currentState.currentWeek + 1);
  }

  return {
    ...currentState,
    completedDays: updatedCompleted,
    currentDayIndex: nextDayIdx,
    currentWeek: nextWeek,
  };
}

