import { describe, it, expect } from "vitest";
import {
  type ActiveJeffProgramState,
  resolveProgramDayForDate,
  isDateScheduledTrainingDay,
  getEligibleSessionsForDate,
  scheduleTodayOverride,
  moveWorkoutSession,
  getValidMoveDates,
  advanceJeffProgramAfterFinish,
  getProgramDateKey,
} from "../lib/jeffPrograms";
import {
  deriveTargetMusclesFromJeffWorkout,
  formatMuscleChips,
  formatThaiDateLabel,
  MUSCLE_REGION_THAI,
} from "../components/JeffProgramPicker";

describe("Train Today Scheduling & Selection Engine", () => {
  // Test date: Friday 2026-10-16
  const testFridayKey = "2026-10-16";
  const testFridayDate = new Date(`${testFridayKey}T12:00:00`);

  // 1. Selecting today's scheduled workout
  it("1. allows user to start or complete today's scheduled workout normally on a scheduled training day", () => {
    // 4-day Upper/Lower program configured for Mon(0), Tue(1), Thu(3), Fri(4)
    const state: ActiveJeffProgramState = {
      programId: "upper_lower",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 3, // Day 4 (Lower 2)
      completedDays: ["2026-10-12", "2026-10-13", "2026-10-15"],
      scheduleDays: [0, 1, 3, 4],
    };

    expect(isDateScheduledTrainingDay(state, testFridayDate)).toBe(true);

    const resolution = resolveProgramDayForDate(state, testFridayDate);
    expect(resolution.isTrainingDay).toBe(true);
    expect(resolution.isRestDay).toBe(false);
    expect(resolution.scheduledDayIndex).toBe(3);
    expect(resolution.reason).toBe("scheduled_session");

    // Eligible sessions for today should list the scheduled session
    const eligible = getEligibleSessionsForDate(state, testFridayKey);
    expect(eligible.length).toBeGreaterThan(0);
    const nextSession = eligible.find((s) => s.dayIndex === 3);
    expect(nextSession).toBeDefined();
    expect(nextSession?.hasConflict).toBe(false);
  });

  // 2. Selecting an eligible missed session for today
  it("2. allows user to select an eligible missed session for today", () => {
    // User missed Thursday (2026-10-15) Day 3
    const state: ActiveJeffProgramState = {
      programId: "upper_lower",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 2,
      completedDays: ["2026-10-12", "2026-10-13"],
      scheduleDays: [0, 1, 3, 4],
      rescheduledSessions: [
        {
          id: "rec_2026-10-15_d2",
          originalDateKey: "2026-10-15",
          targetDateKey: "2026-10-19", // initially rescheduled to next Monday
          sourceWeek: 1,
          dayIndex: 2,
          dayLabel: "Day 3",
          focusLabel: "Upper Body 2",
          status: "pending",
        },
      ],
    };

    const eligible = getEligibleSessionsForDate(state, testFridayKey);
    const missedOption = eligible.find((s) => s.rescheduledSessionId === "rec_2026-10-15_d2");
    expect(missedOption).toBeDefined();
    expect(missedOption?.type).toBe("missed_recovery");
    expect(missedOption?.hasConflict).toBe(false);

    // Re-target missed session to today
    const overrideResult = scheduleTodayOverride(
      state,
      {
        dayIndex: missedOption!.dayIndex,
        sourceWeek: missedOption!.sourceWeek,
        rescheduledSessionId: missedOption!.rescheduledSessionId,
      },
      testFridayKey
    );

    expect(overrideResult.success).toBe(true);
    const updatedState = overrideResult.state;
    const pendingSession = updatedState.rescheduledSessions?.find((s) => s.id === "rec_2026-10-15_d2");
    expect(pendingSession?.targetDateKey).toBe(testFridayKey);

    // Resolving Friday now gives this make-up session
    const resolution = resolveProgramDayForDate(updatedState, testFridayDate);
    expect(resolution.isTrainingDay).toBe(true);
    expect(resolution.isRescheduledMakeUp).toBe(true);
    expect(resolution.scheduledDayIndex).toBe(2);
  });

  // 3. Explicitly choosing to train today when today is a configured rest day
  it("3. allows user to explicitly choose an eligible session for today as a one-time rest-day override", () => {
    // 3-day split on Mon(0), Wed(2), Sat(5). Friday(4) is a rest day!
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 2,
      completedDays: ["2026-10-12", "2026-10-14"],
      scheduleDays: [0, 2, 5],
    };

    expect(isDateScheduledTrainingDay(state, testFridayDate)).toBe(false);
    const initialResolution = resolveProgramDayForDate(state, testFridayDate);
    expect(initialResolution.isRestDay).toBe(true);
    expect(initialResolution.isTrainingDay).toBe(false);

    // User chooses to train Day 3 (index 2) today on Friday
    const overrideResult = scheduleTodayOverride(
      state,
      { dayIndex: 2, sourceWeek: 1 },
      testFridayKey
    );
    expect(overrideResult.success).toBe(true);
    const updatedState = overrideResult.state;

    // Friday is now a training day via manual_move override
    const updatedResolution = resolveProgramDayForDate(updatedState, testFridayDate);
    expect(updatedResolution.isTrainingDay).toBe(true);
    expect(updatedResolution.isRestDay).toBe(false);
    expect(updatedResolution.scheduledDayIndex).toBe(2);
    expect(updatedResolution.reason).toBe("manual_move");
  });

  // 4. The rest-day UI / state still provides an appropriate scheduling action
  it("4. provides eligible sessions on a rest day for the user to choose", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4],
    };

    // Thursday (2026-10-15) is a rest day
    const restDate = new Date("2026-10-15T12:00:00");
    const resolution = resolveProgramDayForDate(state, restDate);
    expect(resolution.isRestDay).toBe(true);

    const eligible = getEligibleSessionsForDate(state, "2026-10-15");
    expect(eligible.length).toBeGreaterThan(0);
    // User can select the next workout (Day 2, index 1)
    expect(eligible.some((e) => e.dayIndex === 1 && e.type === "next_scheduled")).toBe(true);
  });

  // 5. Same-day move remaining a no-op or being rejected safely without blocking separate select-today flow
  it("5. safe rejection of same-day move without blocking dedicated select-today override", () => {
    const state: ActiveJeffProgramState = {
      programId: "upper_lower",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 3,
      completedDays: ["2026-10-12", "2026-10-13", "2026-10-15"],
      scheduleDays: [0, 1, 3, 4],
    };

    // Moving Friday to Friday is rejected safely
    const moveResult = moveWorkoutSession(state, testFridayKey, testFridayKey);
    expect(moveResult.success).toBe(false);
    expect(moveResult.error).toContain("Target date must be different");

    // Move date validator marks same date as conflict
    const moveDates = getValidMoveDates(state, testFridayKey);
    const sameDayCheck = moveDates.find((d) => d.dateKey === testFridayKey);
    expect(sameDayCheck?.hasConflict).toBe(true);
    expect(sameDayCheck?.conflictReason).toBe("วันเดิมที่เลือกไว้");

    // But dedicated scheduleTodayOverride functions without restriction
    const selectTodayResult = scheduleTodayOverride(
      state,
      { dayIndex: 3, sourceWeek: 1 },
      testFridayKey
    );
    expect(selectTodayResult.success).toBe(true);
  });

  // 6. Completed sessions and conflicting sessions remaining unavailable
  it("6. rejects scheduling an override on an already completed date", () => {
    const state: ActiveJeffProgramState = {
      programId: "upper_lower",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 4,
      completedDays: ["2026-10-12", "2026-10-13", "2026-10-15", testFridayKey], // Friday is already completed
      scheduleDays: [0, 1, 3, 4],
    };

    const eligible = getEligibleSessionsForDate(state, testFridayKey);
    expect(eligible.every((e) => e.hasConflict === true)).toBe(true);
    expect(eligible[0].conflictReason).toContain("เสร็จสิ้นแล้ว");

    const overrideResult = scheduleTodayOverride(
      state,
      { dayIndex: 0, sourceWeek: 2 },
      testFridayKey
    );
    expect(overrideResult.success).toBe(false);
    expect(overrideResult.error).toContain("ฝึกเสร็จสิ้นแล้ว");
  });

  // 7. Local date and weekday consistency
  it("7. correctly resolves weekdays at local noon without apparent day shifting", () => {
    const state: ActiveJeffProgramState = {
      programId: "upper_lower",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [4], // Friday only
    };

    // Test all 7 days of the week starting from Monday 2026-10-12
    const days = [
      { dateKey: "2026-10-12", isFri: false }, // Mon
      { dateKey: "2026-10-13", isFri: false }, // Tue
      { dateKey: "2026-10-14", isFri: false }, // Wed
      { dateKey: "2026-10-15", isFri: false }, // Thu
      { dateKey: "2026-10-16", isFri: true },  // Fri
      { dateKey: "2026-10-17", isFri: false }, // Sat
      { dateKey: "2026-10-18", isFri: false }, // Sun
    ];

    for (const d of days) {
      const dateObj = new Date(`${d.dateKey}T12:00:00`);
      expect(isDateScheduledTrainingDay(state, dateObj)).toBe(d.isFri);
    }
  });

  // 8. One-time overrides not changing recurring rest days
  it("8. preserves recurring scheduleDays when applying a one-time override", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri (Tue, Thu, Sat, Sun are rest)
    };

    // Override Thursday (2026-10-15)
    const result = scheduleTodayOverride(state, { dayIndex: 1, sourceWeek: 1 }, "2026-10-15");
    expect(result.success).toBe(true);

    // Recurring scheduleDays MUST remain strictly [0, 2, 4]
    expect(result.state.scheduleDays).toEqual([0, 2, 4]);

    // Next Thursday (2026-10-22) must STILL be a rest day!
    const nextThu = new Date("2026-10-22T12:00:00");
    const nextThuRes = resolveProgramDayForDate(result.state, nextThu);
    expect(nextThuRes.isRestDay).toBe(true);
    expect(nextThuRes.isTrainingDay).toBe(false);
  });

  // 9. Progression advancing only after completion
  it("9. advances progression only upon finish, not upon merely selecting today", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4],
    };

    // Selecting today on Thursday (2026-10-15)
    const overrideResult = scheduleTodayOverride(state, { dayIndex: 1, sourceWeek: 1 }, "2026-10-15");
    state = overrideResult.state;

    // currentDayIndex has NOT advanced yet!
    expect(state.currentDayIndex).toBe(1);
    expect(state.completedDays).toEqual(["2026-10-12"]);

    // Complete the workout
    state = advanceJeffProgramAfterFinish(state, "2026-10-15", 1);
    expect(state.completedDays).toEqual(["2026-10-12", "2026-10-15"]);
    expect(state.currentDayIndex).toBe(2); // Now advances to next workout!

    // Duplicate call to advanceJeffProgramAfterFinish on the same date is idempotent
    const duplicateState = advanceJeffProgramAfterFinish(state, "2026-10-15", 1);
    expect(duplicateState.currentDayIndex).toBe(2);
    expect(duplicateState.completedDays).toHaveLength(2);
  });

  // 10. No duplicate sessions after reload or repeated calendar recalculation
  it("10. remains idempotent across serialization and repeated resolution", () => {
    let state: ActiveJeffProgramState = {
      programId: "upper_lower",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 2,
      completedDays: ["2026-10-12", "2026-10-13"],
      scheduleDays: [0, 1, 3, 4],
    };

    const override = scheduleTodayOverride(state, { dayIndex: 2, sourceWeek: 1 }, testFridayKey);
    state = override.state;

    // Repeated resolution
    const res1 = resolveProgramDayForDate(state, testFridayDate);
    const res2 = resolveProgramDayForDate(state, testFridayDate);
    expect(res1.scheduledDayIndex).toBe(res2.scheduledDayIndex);
    expect(res1.isTrainingDay).toBe(res2.isTrainingDay);

    // Serialization & deserialization
    const serialized = JSON.stringify(state);
    const deserialized: ActiveJeffProgramState = JSON.parse(serialized);
    const resDeserialized = resolveProgramDayForDate(deserialized, testFridayDate);
    expect(resDeserialized.scheduledDayIndex).toBe(res1.scheduledDayIndex);
    expect(resDeserialized.isTrainingDay).toBe(true);
  });

  // 11. Behavior across fixed-week, sequential-rotation, and cycle-pattern programs
  it("11. functions universally across fixed-week, sequential-rotation, and cycle-pattern programs", () => {
    // A: Fixed-week 5-day bro split
    const fixedState: ActiveJeffProgramState = {
      programId: "body_part_split",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 4,
      completedDays: ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"],
      scheduleDays: [0, 1, 2, 3, 4], // Mon-Fri
      schedulingModel: "fixed_weekday",
    };
    expect(isDateScheduledTrainingDay(fixedState, testFridayDate)).toBe(true);
    const fixedRes = resolveProgramDayForDate(fixedState, testFridayDate);
    expect(fixedRes.isTrainingDay).toBe(true);

    // B: Sequential rotation (linear progression)
    const seqState: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4],
      schedulingModel: "sequential_rotation",
    };
    expect(isDateScheduledTrainingDay(seqState, testFridayDate)).toBe(true);
    const seqRes = resolveProgramDayForDate(seqState, testFridayDate);
    expect(seqRes.isTrainingDay).toBe(true);
    expect(seqRes.scheduledDayIndex).toBe(1);

    // C: Cycle pattern (3 on, 1 off)
    const cycleState: ActiveJeffProgramState = {
      programId: "custom_cycle",
      startDate: "2026-10-13", // Tue (Day 0: on), Wed (Day 1: on), Thu (Day 2: on), Fri 10-16 is Day 3: off (rest)
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [],
      schedulingModel: "cycle_pattern",
      cycleLengthDays: 4,
      cyclePattern: [true, true, true, false],
    };
    expect(isDateScheduledTrainingDay(cycleState, testFridayDate)).toBe(false);
    const cycleResBefore = resolveProgramDayForDate(cycleState, testFridayDate);
    expect(cycleResBefore.isRestDay).toBe(true);

    // User chooses one-time override to train on this cycle rest day
    const cycleOverride = scheduleTodayOverride(cycleState, { dayIndex: 0, sourceWeek: 1 }, testFridayKey);
    expect(cycleOverride.success).toBe(true);
    const cycleResAfter = resolveProgramDayForDate(cycleOverride.state, testFridayDate);
    expect(cycleResAfter.isTrainingDay).toBe(true);
    expect(cycleResAfter.scheduledDayIndex).toBe(0);
  });
});

describe("Today's Target Muscle Groups & Date Formatting", () => {
  it("derives target muscles accurately from workout focus and exercises", () => {
    const chestWorkout = {
      focusLabel: "Day 1: Chest & Triceps",
      exercises: [
        { name: "Barbell Bench Press", sets: 3, reps: "6-8" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-10" },
        { name: "Cable Flyes", sets: 3, reps: "12-15" },
        { name: "Triceps Pushdown", sets: 3, reps: "10-12" },
      ],
    };

    const derived = deriveTargetMusclesFromJeffWorkout(chestWorkout);
    expect(derived.primary).toContain("chest");
    expect(derived.primary).toContain("upperChest");
    expect(derived.secondary).toContain("triceps");
    // Ensure no duplication between primary and secondary
    for (const p of derived.primary) {
      expect(derived.secondary).not.toContain(p);
    }
  });

  it("derives pull / back muscles accurately", () => {
    const pullWorkout = {
      focusLabel: "Day 2: Pull (Back & Biceps)",
      exercises: [
        { name: "Barbell Deadlift", sets: 3, reps: "5" },
        { name: "Lat Pulldown", sets: 3, reps: "8-10" },
        { name: "Chest Supported Row", sets: 3, reps: "10-12" },
        { name: "Biceps Curl", sets: 3, reps: "12" },
      ],
    };

    const derived = deriveTargetMusclesFromJeffWorkout(pullWorkout);
    expect(derived.primary).toContain("lats");
    expect(derived.primary).toContain("midBack");
    expect(derived.secondary).toContain("biceps");
  });

  it("formats muscle chips into recognizable Thai labels without duplicate chips", () => {
    const regions = ["chest", "upperChest", "chest", "triceps", "tricepsLong"];
    const chips = formatMuscleChips(regions, "th");

    expect(chips).toContain("อกกลาง");
    expect(chips).toContain("อกบน");
    expect(chips).toContain("หลังแขน");
    // "อกกลาง" should only appear once
    expect(chips.filter((c) => c === "อกกลาง").length).toBe(1);
    // "หลังแขน" should only appear once (both triceps and tricepsLong map to หลังแขน)
    expect(chips.filter((c) => c === "หลังแขน").length).toBe(1);
  });

  it("formats clear Thai date labels with weekday and date", () => {
    // 2026-10-16 is Friday
    const date = new Date("2026-10-16T12:00:00");
    const thaiLabel = formatThaiDateLabel(date, "th");
    expect(thaiLabel).toBe("วันศุกร์ · 16 ต.ค.");

    const enLabel = formatThaiDateLabel(date, "en");
    expect(enLabel).toContain("Fri");
    expect(enLabel).toContain("16");
  });
});
