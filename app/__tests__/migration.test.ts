// app/__tests__/migration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  runMigration,
  hasMigrated,
  getMigrationResult,
  type MigrationResult,
} from "../lib/migration";
import type { LogSet, ExerciseRecords } from "../page";

// Mock localStorage
const mockStorage: Record<string, string> = {};
beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  Object.defineProperty(global, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
      },
    },
    writable: true,
  });
});

describe("Stage 3 Migration (haitMigrationV1)", () => {
  it("Infer level from Big-3 PR sum correctly", () => {
    // Advanced: >= 1000 lbs
    const advRecords: Record<string, ExerciseRecords> = {
      "Bench Press": { maxWeight: { weightLbs: 300, reps: 1 } as LogSet },
      "Barbell Back Squat": { maxWeight: { weightLbs: 350, reps: 1 } as LogSet },
      "Deadlift": { maxWeight: { weightLbs: 400, reps: 1 } as LogSet },
    };
    const advResult = runMigration([], advRecords, 4);
    expect(advResult?.level).toBe("advanced");

    // Idempotent: second call returns null
    expect(hasMigrated()).toBe(true);
    expect(runMigration([], advRecords, 4)).toBe(null);

    // Reset for intermediate test
    delete mockStorage["haitMigrationV1"];
    const interRecords: Record<string, ExerciseRecords> = {
      "Bench Press": { maxWeight: { weightLbs: 200, reps: 1 } as LogSet },
      "Barbell Back Squat": { maxWeight: { weightLbs: 250, reps: 1 } as LogSet },
      "Deadlift": { maxWeight: { weightLbs: 200, reps: 1 } as LogSet },
    };
    const interResult = runMigration([], interRecords, 4);
    expect(interResult?.level).toBe("intermediate");

    // Reset for beginner test (<500 lbs)
    delete mockStorage["haitMigrationV1"];
    const begRecords: Record<string, ExerciseRecords> = {
      "Bench Press": { maxWeight: { weightLbs: 100, reps: 1 } as LogSet },
    };
    const begResult = runMigration([], begRecords, 4);
    expect(begResult?.level).toBe("beginner");
  });

  it("Computes weekly streak across past weeks without breaking on current empty week", () => {
    const now = new Date();
    // Log last week (e.g. 5 days ago) and 2 weeks ago (12 days ago)
    const logs: LogSet[] = [
      {
        exerciseId: "1",
        exerciseName: "Bench Press",
        weightLbs: 100,
        reps: 10,
        setNumber: 1,
        date: new Date(now.getTime() - 5 * 86400000).toISOString(),
      },
      {
        exerciseId: "1",
        exerciseName: "Bench Press",
        weightLbs: 100,
        reps: 10,
        setNumber: 1,
        date: new Date(now.getTime() - 12 * 86400000).toISOString(),
      },
    ];

    const result = runMigration(logs, {}, 3);
    expect(result?.weekStreak).toBeGreaterThanOrEqual(1);
    expect(mockStorage["haitOnboardingV1"]).toBeTruthy();
  });

  it("Sets onboarding status complete and bodyweight estimate", () => {
    const records: Record<string, ExerciseRecords> = {
      "Bench Press": { maxWeight: { weightLbs: 180, reps: 1 } as LogSet },
      "Barbell Back Squat": { maxWeight: { weightLbs: 270, reps: 1 } as LogSet },
      "Deadlift": { maxWeight: { weightLbs: 300, reps: 1 } as LogSet },
    };
    const result = runMigration([], records, 4);
    expect(result?.estimatedBodyweightLbs).toBeDefined();
    expect(result?.estimatedBodyweightLbs).toBeGreaterThan(150);
    expect(JSON.parse(mockStorage["haitOnboardingV1"])).toEqual({
      level: "intermediate",
      goal: "hypertrophy",
      days: 4,
    });
  });
});
