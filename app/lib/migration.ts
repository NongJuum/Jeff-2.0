// app/lib/migration.ts
"use client";

import type { LogSet, ExerciseRecords } from "../page";

export type MigrationResult = {
  level: "beginner" | "intermediate" | "advanced";
  goal: "strength" | "hypertrophy" | "fitness";
  days: 3 | 4 | 5;
  estimatedBodyweightLbs?: number;
  weekStreak: number;
  migratedAt: string;
};

const MIGRATION_KEY = "haitMigrationV1";
const ONBOARDING_KEY = "haitOnboardingV1";
const STREAK_KEY = "haitWeekStreak";
const BODYWEIGHT_KEY = "haitBodyweight";

function getLocalDateKey(value: string | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * คำนวณ week streak จาก logs ย้อนหลัง
 * สัปดาห์ที่มีฝึกอย่างน้อย 1 วัน = 1 streak
 */
function calculateStreakFromLogs(logs: LogSet[]): number {
  if (logs.length === 0) return 0;

  const uniqueDays = new Set(logs.map((l) => getLocalDateKey(l.date)));
  let streak = 0;
  const now = new Date();

  // ตรวจสอบย้อนหลัง 52 สัปดาห์ (1 ปี)
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekOffset * 7 - 6);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weekOffset * 7);

    const hasWorkoutThisWeek = Array.from(uniqueDays).some((dayStr) => {
      const d = new Date(dayStr);
      return d >= weekStart && d <= weekEnd;
    });

    if (hasWorkoutThisWeek) {
      streak++;
    } else if (weekOffset > 0) {
      // อนุญาตให้สัปดาห์ปัจจุบัน (weekOffset=0) ว่างได้
      break;
    }
  }

  return streak;
}

/**
 * ประเมิน level จาก PR ที่ดีที่สุดของผู้ใช้
 */
function estimateLevel(recordsMap: Record<string, ExerciseRecords>): "beginner" | "intermediate" | "advanced" {
  const benchPR = recordsMap["Bench Press"]?.maxWeight?.weightLbs ?? 0;
  const squatPR = recordsMap["Barbell Back Squat"]?.maxWeight?.weightLbs ?? 0;
  const deadliftPR = recordsMap["Deadlift"]?.maxWeight?.weightLbs ?? 0;

  const totalBig3 = benchPR + squatPR + deadliftPR;

  // เกณฑ์โดยประมาณ (lbs)
  if (totalBig3 >= 1000) return "advanced";
  if (totalBig3 >= 500) return "intermediate";
  return "beginner";
}

/**
 * ประเมินน้ำหนักตัวจากอัตราส่วน strength-to-weight มาตรฐาน
 * Bench ≈ 1x BW, Squat ≈ 1.5x BW สำหรับ intermediate
 */
function estimateBodyweightLbs(
  recordsMap: Record<string, ExerciseRecords>,
  level: "beginner" | "intermediate" | "advanced"
): number | undefined {
  const benchPR = recordsMap["Bench Press"]?.maxWeight?.weightLbs;
  const squatPR = recordsMap["Barbell Back Squat"]?.maxWeight?.weightLbs;

  const ratios = {
    beginner: { bench: 0.75, squat: 1.0 },
    intermediate: { bench: 1.0, squat: 1.5 },
    advanced: { bench: 1.5, squat: 2.0 },
  }[level];

  const estimates: number[] = [];
  if (benchPR && benchPR > 50) estimates.push(benchPR / ratios.bench);
  if (squatPR && squatPR > 100) estimates.push(squatPR / ratios.squat);

  if (estimates.length === 0) return undefined;

  const avg = estimates.reduce((a, b) => a + b, 0) / estimates.length;
  return Math.round(avg / 5) * 5; // ปัดเป็นเลขคูณ 5
}

/**
 * ตรวจสอบว่าเคย migrate แล้วหรือยัง
 */
export function hasMigrated(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MIGRATION_KEY) !== null;
  } catch {
    return true;
  }
}

/**
 * เรียกใช้ migration — รันครั้งเดียวหลังอัปเดต v2.1 → v3.0
 */
export function runMigration(
  logs: LogSet[],
  recordsMap: Record<string, ExerciseRecords>,
  currentDays: 3 | 4 | 5
): MigrationResult | null {
  if (typeof window === "undefined") return null;
  if (hasMigrated()) return null;

  const level = estimateLevel(recordsMap);
  const weekStreak = calculateStreakFromLogs(logs);
  const estimatedBW = estimateBodyweightLbs(recordsMap, level);

  const result: MigrationResult = {
    level,
    goal: "hypertrophy", // default ที่ปลอดภัยที่สุด
    days: currentDays,
    estimatedBodyweightLbs: estimatedBW,
    weekStreak,
    migratedAt: new Date().toISOString(),
  };

  try {
    // 1. บันทึก migration marker
    window.localStorage.setItem(MIGRATION_KEY, JSON.stringify(result));

    // 2. สร้าง onboarding result อัตโนมัติ (ข้าม wizard)
    const onboarding = { level, goal: "hypertrophy", days: currentDays };
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));

    // 3. บันทึก streak
    window.localStorage.setItem(STREAK_KEY, String(weekStreak));

    // 4. บันทึก bodyweight (ถ้าประเมินได้)
    if (estimatedBW) {
      window.localStorage.setItem(BODYWEIGHT_KEY, JSON.stringify({
        lbs: estimatedBW,
        updatedAt: new Date().toISOString(),
      }));
    }
  } catch {
    // quota exceeded — ไม่ crash
  }

  return result;
}

/**
 * ดึงข้อมูล migration ที่เคยทำไว้
 */
export function getMigrationResult(): MigrationResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MIGRATION_KEY);
    return raw ? (JSON.parse(raw) as MigrationResult) : null;
  } catch {
    return null;
  }
}
