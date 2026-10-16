import { describe, it, expect } from "vitest";
import {
  findProgramById,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  recommendPrograms,
  getNextProgramTrainingDate,
  isJeffProgramComplete,
  detectMissedSessions,
  planRescheduledSessions,
  resolveRescheduledSession,
  cancelRescheduledSession,
  type ActiveJeffProgramState,
} from "../lib/jeffPrograms";
import { getExerciseDisplayName } from "../components/JeffProgramPicker";


describe("Jeff Nippard Calendar Schedule & Program Progression", () => {
  const mockProgram = findProgramById("fundamentals_full_body");

  it("finds program by ID", () => {
    expect(mockProgram).toBeDefined();
    expect(mockProgram?.daysPerWeek).toBe(3);
  });

  it("uses the selected weekly schedule only to determine training vs rest", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 2,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };

    const monday = resolveProgramDayForDate(state, new Date(2026, 9, 19, 12));
    expect(monday.isTrainingDay).toBe(true);
    // Monday of a new week must not reset progression to the Monday slot (Day 1).
    expect(monday.scheduledDayIndex).toBe(2);

    const tuesday = resolveProgramDayForDate(state, new Date(2026, 9, 20, 12));
    expect(tuesday.isTrainingDay).toBe(false);

    const wednesday = resolveProgramDayForDate(state, new Date(2026, 9, 21, 12));
    expect(wednesday.isTrainingDay).toBe(true);
    expect(wednesday.scheduledDayIndex).toBe(2);
  });

  it("does not schedule a program before its selected start date", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-14",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };
    const status = resolveProgramDayForDate(state, new Date(2026, 9, 12, 12));
    expect(status.isTrainingDay).toBe(false);
  });

  it("advances day and rolls over week after finishing each unique session date", () => {
    const initialState: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };

    const afterDay1 = advanceJeffProgramAfterFinish(initialState, "2026-10-12");
    expect(afterDay1.completedDays).toEqual(["2026-10-12"]);
    expect(afterDay1.currentDayIndex).toBe(1);
    expect(afterDay1.currentWeek).toBe(1);

    const afterDay2 = advanceJeffProgramAfterFinish(afterDay1, "2026-10-14");
    expect(afterDay2.completedDays).toHaveLength(2);
    expect(afterDay2.currentDayIndex).toBe(2);
    expect(afterDay2.currentWeek).toBe(1);

    const afterDay3 = advanceJeffProgramAfterFinish(afterDay2, "2026-10-16");
    expect(afterDay3.completedDays).toHaveLength(3);
    expect(afterDay3.currentDayIndex).toBe(0);
    expect(afterDay3.currentWeek).toBe(2);
  });

  it("does not advance twice if Finish is triggered again for the same date", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4],
    };
    expect(advanceJeffProgramAfterFinish(state, "2026-10-12")).toEqual(state);
  });

  it("advances from the selected workout day without moving progress backwards", () => {
    const initial: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };
    const afterSelectedDay3 = advanceJeffProgramAfterFinish(initial, "2026-10-12", 2);
    expect(afterSelectedDay3.currentWeek).toBe(2);
    expect(afterSelectedDay3.currentDayIndex).toBe(0);

    const stateAtDay3: ActiveJeffProgramState = { ...initial, currentDayIndex: 2 };
    const afterEarlierDay = advanceJeffProgramAfterFinish(stateAtDay3, "2026-10-13", 0);
    expect(afterEarlierDay.currentWeek).toBe(2);
    expect(afterEarlierDay.currentDayIndex).toBe(0);
  });

  it("finds the next training date while respecting a future program start date", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-21",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };
    expect(getNextProgramTrainingDate(state, new Date(2026, 9, 19, 12))).toBe("2026-10-21");
    expect(getNextProgramTrainingDate({ ...state, scheduleDays: [] }, new Date(2026, 9, 19, 12))).toBeNull();
  });

  it("marks a program complete after its planned number of sessions", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 8,
      currentDayIndex: 0,
      completedDays: Array.from({ length: 24 }, (_, i) => `2026-10-${String(i + 1).padStart(2, "0")}`),
      scheduleDays: [0, 2, 4],
    };
    expect(isJeffProgramComplete(state)).toBe(true);
    expect(advanceJeffProgramAfterFinish(state, "2026-11-20")).toEqual(state);
  });

  it("recommendPrograms considers profile injuries and experience", () => {
    const recsWithBackInjury = recommendPrograms("intermediate", "strength", 3, true, {
      injuries: ["lowerBack"],
      expMonths: 12,
    });
    expect(recsWithBackInjury.length).toBeGreaterThan(0);
    expect(recsWithBackInjury[0].program.id).not.toBe("powerbuilding_3_0");
  });

  it("preserves standard English exercise names across Thai and English UI", () => {
    const sampleExercises = [
      "Seated Calf Raise",
      "45° Leg Press",
      "Hammer Strength Chest Press",
      "Cable Lat Pulldown",
      "Romanian Deadlift",
      "Bulgarian Split Squat",
      "Pec Deck Fly",
    ];

    sampleExercises.forEach((name) => {
      expect(getExerciseDisplayName(name, "th")).toBe(name);
      expect(getExerciseDisplayName(name, "en")).toBe(name);
    });
  });
});

describe("Jeff Nippard Missed-Session Recovery & Return-to-Normal Invariant", () => {
  // Scenario from Section 1.2:
  // Mon: Day 1 (0)
  // Tue: Day 2 (1)
  // Wed: Rest  (2)
  // Thu: Day 3 (3)
  // Fri: Day 4 (4)
  // Sat: Day 5 (5)
  // Sun: Rest  (6)
  const fiveDaySchedule = [0, 1, 3, 4, 5]; // Mon, Tue, Thu, Fri, Sat

  it("handles Friday missed -> Saturday recommendation -> Sunday rest preserved -> Monday make-up", () => {
    // 2026-10-12 is Monday.
    // User completes Day 1 (Mon 10-12), Day 2 (Tue 10-13), Day 3 (Thu 10-15).
    // Friday (10-16) is missed.
    let state: ActiveJeffProgramState = {
      programId: "pure_bodybuilding_upper_lower", // 5-day or U/L
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 3, // at Day 4
      completedDays: ["2026-10-12", "2026-10-13", "2026-10-15"],
      scheduleDays: fiveDaySchedule,
    };

    // 1. On Saturday morning (2026-10-17):
    const stateSat = planRescheduledSessions(
      detectMissedSessions(state, new Date(2026, 9, 17, 10)),
      new Date(2026, 9, 17, 10)
    );
    // Friday 2026-10-16 is detected as a pending make-up session
    expect(stateSat.rescheduledSessions).toHaveLength(1);
    expect(stateSat.rescheduledSessions![0].originalDateKey).toBe("2026-10-16");
    expect(stateSat.rescheduledSessions![0].status).toBe("pending");

    // Saturday resolution: Saturday is a scheduled training day.
    // It recommends Day 4 (the missed session) so sequential progress stays intact.
    const satResolution = resolveProgramDayForDate(stateSat, new Date(2026, 9, 17, 12));
    expect(satResolution.isTrainingDay).toBe(true);
    expect(satResolution.isRescheduledMakeUp).toBe(true);
    expect(satResolution.scheduledDayIndex).toBe(3); // Day 4

    // User completes Day 4 on Saturday
    state = advanceJeffProgramAfterFinish(stateSat, "2026-10-17", 3);
    expect(state.completedDays).toContain("2026-10-17");
    // The Friday Day 4 obligation is now resolved!
    expect(state.rescheduledSessions![0].status).toBe("completed");

    // 2. Sunday (2026-10-18):
    // Day 5 (originally Saturday) is now missed or pending make-up.
    state = planRescheduledSessions(
      detectMissedSessions(state, new Date(2026, 9, 18, 12)),
      new Date(2026, 9, 18, 12)
    );
    const sunResolution = resolveProgramDayForDate(state, new Date(2026, 9, 18, 12));
    // CRITICAL INVARIANT: Sunday fixed rest is preserved! The app must NEVER force Sunday training!
    expect(sunResolution.isTrainingDay).toBe(false);

    // 3. Following Monday (2026-10-19):
    // App plans Day 5 make-up into the next available training slot: Monday!
    state = planRescheduledSessions(
      detectMissedSessions(state, new Date(2026, 9, 19, 12)),
      new Date(2026, 9, 19, 12)
    );
    const monResolution = resolveProgramDayForDate(state, new Date(2026, 9, 19, 12));
    expect(monResolution.isTrainingDay).toBe(true);
    expect(monResolution.isRescheduledMakeUp).toBe(true);
    expect(monResolution.scheduledDayIndex).toBe(4); // Day 5

    // 4. After completing Day 5 on Monday:
    state = advanceJeffProgramAfterFinish(state, "2026-10-19", 4);
    expect(state.completedDays).toContain("2026-10-19");
    const activePending = (state.rescheduledSessions ?? []).filter((s) => s.status === "pending");
    expect(activePending).toHaveLength(0);

    // 5. RETURN TO NORMAL INVARIANT:
    // On Tuesday (2026-10-20), there are NO active pending obligations.
    // The app returns to the recurring schedule and does NOT duplicate Day 5 or re-inject Day 4!
    const tueResolution = resolveProgramDayForDate(state, new Date(2026, 9, 20, 12));
    expect(tueResolution.isTrainingDay).toBe(true);
    expect(tueResolution.isRescheduledMakeUp).toBe(false);
    expect(tueResolution.pendingBacklogCount).toBe(0);
  });

  it("clears make-up obligation on explicit skip without recording fake completion", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri
    };

    // Wed 10-14 was missed
    state = detectMissedSessions(state, new Date(2026, 9, 16, 12));
    expect(state.rescheduledSessions).toHaveLength(1);
    const session = state.rescheduledSessions![0];
    expect(session.status).toBe("pending");

    // User explicitly skips Wednesday make-up session
    state = resolveRescheduledSession(state, session.id, "skip");
    expect(state.rescheduledSessions![0].status).toBe("skipped");
    expect(state.completedDays).not.toContain("2026-10-14");
    expect(state.skippedDates).toContain("2026-10-14");

    // Subsequent calendar checks do NOT re-generate this missed session
    state = detectMissedSessions(state, new Date(2026, 9, 17, 12));
    const wedSession = state.rescheduledSessions!.filter((s) => s.originalDateKey === "2026-10-14");
    expect(wedSession).toHaveLength(1);
    expect(wedSession[0].status).toBe("skipped");
  });

  it("does not create duplicate make-up obligations across multiple weeks", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri
    };

    // Day 1 (10-12) missed, Day 2 (10-14) missed
    state = detectMissedSessions(state, new Date(2026, 9, 15, 12));
    expect(state.rescheduledSessions).toHaveLength(2);

    // Call detectMissedSessions repeatedly on subsequent dates
    state = detectMissedSessions(state, new Date(2026, 9, 16, 12));
    state = detectMissedSessions(state, new Date(2026, 9, 20, 12));
    // Must strictly remain 1 entry per distinct missed date
    const dateKeys = state.rescheduledSessions!.map((s) => s.originalDateKey);
    const uniqueKeys = new Set(dateKeys);
    expect(dateKeys.length).toBe(uniqueKeys.size);
  });

  it("can cancel a temporary scheduling adjustment without falsifying completion", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 2, 4],
    };
    state = planRescheduledSessions(
      detectMissedSessions(state, new Date(2026, 9, 15, 12)),
      new Date(2026, 9, 15, 12)
    );
    const session = state.rescheduledSessions![0];
    expect(session.targetDateKey).toBeDefined();

    state = cancelRescheduledSession(state, session.id);
    const cancelled = state.rescheduledSessions!.find((s) => s.id === session.id);
    expect(cancelled?.targetDateKey).toBeUndefined();
    expect(cancelled?.status).toBe("pending");
    expect(state.completedDays).not.toContain("2026-10-14");
  });
});

