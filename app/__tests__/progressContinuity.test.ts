// app/__tests__/progressContinuity.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  type ActiveJeffProgramState,
  getActiveJeffProgram,
  saveActiveJeffProgram,
  clearActiveJeffProgram,
  getProgramProgressArchive,
  saveProgramProgressArchive,
  detectMissedSessions,
  planRescheduledSessions,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  getProgramDateKey,
  ACTIVE_JEFF_PROGRAM_KEY,
  PROGRAM_PROGRESS_ARCHIVE_KEY,
} from "../lib/jeffPrograms";
import { runMigration, hasMigrated } from "../lib/migration";
import { hasCompletedOnboarding, ONBOARDING_KEY } from "../components/OnboardingWizard";
import type { LogSet } from "../page";

// Mock localStorage for Vitest
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

describe("CRITICAL BUG FIX: Workout Progress Continuity & Day 4 Protection", () => {
  // Scenario 1: User at Day 4 remains at Day 4 after application initialization
  it("Scenario 1: A user at Day 4 remains at the correct progression point after initialization", () => {
    const day4State: ActiveJeffProgramState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3, // Day 4 (0-indexed)
      completedDays: ["2026-10-01", "2026-10-03", "2026-10-05"],
      scheduleDays: [0, 2, 3, 4],
    };
    mockStorage[ACTIVE_JEFF_PROGRAM_KEY] = JSON.stringify(day4State);

    const restored = getActiveJeffProgram();
    expect(restored).not.toBeNull();
    expect(restored?.currentDayIndex).toBe(3); // Preserved at Day 4
    expect(restored?.currentWeek).toBe(1);
    expect(restored?.completedDays).toHaveLength(3);
  });

  // Scenario 2: Existing progress survives a simulated application update with legacy keys
  it("Scenario 2: Existing progress survives a simulated application update from legacy keys", () => {
    // User had progress stored under legacy key 'haitActiveJeffProgram' prior to app update
    const legacyState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3, // Day 4
      completedDays: ["2026-10-01", "2026-10-03", "2026-10-05"],
      scheduleDays: [0, 2, 3, 4],
    };
    mockStorage["haitActiveJeffProgram"] = JSON.stringify(legacyState);

    // New version boots up
    const restored = getActiveJeffProgram();
    expect(restored).not.toBeNull();
    expect(restored?.currentDayIndex).toBe(3);
    // Verified that it migrated into the active storage key
    expect(mockStorage[ACTIVE_JEFF_PROGRAM_KEY]).toBeTruthy();
    const migratedState = JSON.parse(mockStorage[ACTIVE_JEFF_PROGRAM_KEY]);
    expect(migratedState.currentDayIndex).toBe(3);
  });

  // Scenario 3: Loading persisted state asynchronously or missing UI state does not overwrite progress
  it("Scenario 3: Empty UI state does not overwrite active program progress", () => {
    const day4State: ActiveJeffProgramState = {
      programId: "upper_lower_4x",
      startDate: "2026-10-01",
      currentWeek: 2,
      currentDayIndex: 3, // Day 4
      completedDays: ["2026-10-01", "2026-10-02", "2026-10-04", "2026-10-05", "2026-10-08", "2026-10-09", "2026-10-11"],
      scheduleDays: [0, 1, 3, 4],
    };
    saveActiveJeffProgram(day4State);

    // Simulate UI state key upgrade (haitUiStateV5 missing)
    expect(mockStorage["haitUiStateV5"]).toBeUndefined();

    // Verify active program maintains authoritative progression
    const active = getActiveJeffProgram();
    expect(active?.currentDayIndex).toBe(3);
    expect(active?.currentWeek).toBe(2);
  });

  // Scenario 4: Migration preserves active program, progression, completed sessions, and prevents onboarding wizard
  it("Scenario 4: Migration preserves active program, progression, and prevents onboarding popups", () => {
    const day4State: ActiveJeffProgramState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3,
      completedDays: ["2026-10-01", "2026-10-03", "2026-10-05"],
      scheduleDays: [0, 2, 3, 4],
    };
    mockStorage[ACTIVE_JEFF_PROGRAM_KEY] = JSON.stringify(day4State);

    const logs: LogSet[] = [
      { exerciseId: "1", date: "2026-10-01T10:00:00.000Z", exerciseName: "Bench Press", setNumber: 1, weightLbs: 225, reps: 5 },
      { exerciseId: "2", date: "2026-10-03T10:00:00.000Z", exerciseName: "Barbell Back Squat", setNumber: 1, weightLbs: 315, reps: 5 },
      { exerciseId: "3", date: "2026-10-05T10:00:00.000Z", exerciseName: "Deadlift", setNumber: 1, weightLbs: 405, reps: 5 },
    ];
    mockStorage["trainingLatestV2"] = JSON.stringify(logs);

    // Existing user should NOT be treated as needing onboarding
    expect(hasCompletedOnboarding()).toBe(true);

    const migResult = runMigration(logs, {}, 4);
    expect(migResult).not.toBeNull();
    expect(mockStorage["haitOnboardingV2"]).toBeTruthy();
    expect(mockStorage[ACTIVE_JEFF_PROGRAM_KEY]).toBeTruthy();

    const restored = getActiveJeffProgram();
    expect(restored?.currentDayIndex).toBe(3);
  });

  // Scenario 5: Running migration more than once is idempotent and preserves progress
  it("Scenario 5: Running the same migration more than once does not alter or reset state", () => {
    const logs: LogSet[] = [
      { exerciseId: "1", date: "2026-10-01T10:00:00.000Z", exerciseName: "Bench Press", setNumber: 1, weightLbs: 185, reps: 8 },
    ];
    const firstRun = runMigration(logs, {}, 4);
    expect(firstRun).not.toBeNull();
    expect(hasMigrated()).toBe(true);

    // Second run should be a no-op
    const secondRun = runMigration(logs, {}, 4);
    expect(secondRun).toBeNull();
  });

  // Scenario 6: Switching programs archives and restores per-program progress
  it("Scenario 6: Switching between programs preserves per-program Day 4 progress without cross-reset", () => {
    // 1. User starts Program A at Day 4
    const progA: ActiveJeffProgramState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3, // Day 4
      completedDays: ["2026-10-01", "2026-10-03", "2026-10-05"],
      scheduleDays: [0, 2, 3, 4],
    };
    saveActiveJeffProgram(progA);

    // 2. User switches to Program B at Day 2
    const progB: ActiveJeffProgramState = {
      programId: "upper_lower_4x",
      startDate: "2026-10-08",
      currentWeek: 1,
      currentDayIndex: 1, // Day 2
      completedDays: ["2026-10-08"],
      scheduleDays: [0, 1, 3, 4],
    };
    saveActiveJeffProgram(progB);

    // Verify Prog B is active
    expect(getActiveJeffProgram()?.programId).toBe("upper_lower_4x");
    expect(getActiveJeffProgram()?.currentDayIndex).toBe(1);

    // Verify Prog A was safely archived in haitProgramProgressArchiveV1
    const archive = getProgramProgressArchive();
    expect(archive["pure_bodybuilding_phase1_4x"]).toBeDefined();
    expect(archive["pure_bodybuilding_phase1_4x"].currentDayIndex).toBe(3);
  });

  // Scenario 7: Recalculating missed sessions does not restart the program or create make-ups for Day 1
  it("Scenario 7: Recalculating missed sessions does not generate Day 1 make-up when user is at Day 4", () => {
    const day4State: ActiveJeffProgramState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3, // User is at Day 4
      completedDays: ["2026-10-01"], // Only 1 date recorded in completedDays
      scheduleDays: [0, 2, 3, 4], // Mon, Wed, Thu, Fri
    };

    // Evaluate missed sessions on 2026-10-15 (after several scheduled dates)
    const afterDetection = detectMissedSessions(day4State, new Date("2026-10-15T12:00:00"));

    // Crucial check: make-up obligations must NOT be created for earlier workouts (Week 1 Days 1-3)
    const pending = (afterDetection.rescheduledSessions ?? []).filter((s) => s.status === "pending");
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].dayIndex).toBe(3); // First make-up session must be Day 4
    expect(pending[0].sourceWeek).toBe(1);

    for (const session of pending) {
      const seq = (session.sourceWeek - 1) * 4 + session.dayIndex;
      expect(seq).toBeGreaterThanOrEqual(3);
    }
  });

  // Scenario 8: Genuinely new user with no state receives correct initial setup
  it("Scenario 8: Genuinely new user with no state receives correct initial setup", () => {
    expect(hasCompletedOnboarding()).toBe(false);
    expect(getActiveJeffProgram()).toBeNull();
  });

  // Scenario 9: Incomplete progression state reconstructs completed days from workout history
  it("Scenario 9: Incomplete progression state reconstructs completed days from workout history", () => {
    const rawState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3,
      completedDays: [], // Empty due to legacy format
      scheduleDays: [0, 2, 3, 4],
    };
    mockStorage[ACTIVE_JEFF_PROGRAM_KEY] = JSON.stringify(rawState);

    // Workout history exists in trainingLatestV2
    const logs: LogSet[] = [
      { exerciseId: "1", date: "2026-10-01T10:00:00.000Z", exerciseName: "Bench Press", setNumber: 1, weightLbs: 200, reps: 5 },
      { exerciseId: "2", date: "2026-10-03T10:00:00.000Z", exerciseName: "Squat", setNumber: 1, weightLbs: 275, reps: 5 },
      { exerciseId: "3", date: "2026-10-05T10:00:00.000Z", exerciseName: "Deadlift", setNumber: 1, weightLbs: 315, reps: 5 },
    ];
    mockStorage["trainingLatestV2"] = JSON.stringify(logs);

    const restored = getActiveJeffProgram();
    expect(restored).not.toBeNull();
    expect(restored?.currentDayIndex).toBe(3); // Day 4 preserved
    expect(restored?.completedDays.length).toBeGreaterThan(0); // Reconciled from logs
  });

  // Scenario 10: Calendar and next-workout recommendation agree with restored Day 4 state
  it("Scenario 10: Calendar and next-workout recommendation agree with restored Day 4 state", () => {
    const day4State: ActiveJeffProgramState = {
      programId: "pure_bodybuilding_phase1_4x",
      startDate: "2026-10-01",
      currentWeek: 1,
      currentDayIndex: 3, // Day 4
      completedDays: ["2026-10-01", "2026-10-03", "2026-10-05"],
      scheduleDays: [0, 2, 3, 4], // Mon, Wed, Thu, Fri
    };

    // When checking a date before program start (e.g., browsing calendar backwards)
    const beforeStart = resolveProgramDayForDate(day4State, new Date("2026-09-20T12:00:00"));
    expect(beforeStart.scheduledDayIndex).toBe(3); // Must NOT reset to 0

    // Advance Day 4 finish
    const afterDay4 = advanceJeffProgramAfterFinish(day4State, "2026-10-06", 3);
    expect(afterDay4.completedDays).toContain("2026-10-06");
    // Since 4x program has 4 days in week 1, completing Day 4 (index 3) advances to Week 2 Day 1 (index 0)
    expect(afterDay4.currentWeek).toBe(2);
    expect(afterDay4.currentDayIndex).toBe(0);
  });
});
