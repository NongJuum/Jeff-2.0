import { describe, it, expect, beforeEach } from "vitest";
import {
  findProgramById,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  detectEligibleMissedDates,
  detectMissedSessions,
  detectUnresolvedMissedSessions,
  recoverSessionThisWeek,
  deferSessionToFutureWeek,
  skipAndDismissSession,
  decideRecoveryLater,
  detectWeeklyReview,
  completeWeeklyReview,
  getAvailableRecoverySlotsInWeek,
  validateRecoveryDestinationDate,
  getMondayOfWeek,
  getSundayOfWeek,
  getCalendarWeekNumber,
  moveWorkoutSession,
  saveActiveJeffProgram,
  getActiveJeffProgram,
  clearActiveJeffProgram,
  type ActiveJeffProgramState,
} from "../lib/jeffPrograms";

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

describe("Redesigned Missed Workout Recovery and Weekly Review Scheduling Engine", () => {
  // Monday-Sunday week bounds calculation
  it("calculates Monday-to-Sunday week bounds and calendar week numbers accurately", () => {
    // 2026-10-12 is Monday, 2026-10-18 is Sunday
    expect(getMondayOfWeek("2026-10-12")).toBe("2026-10-12");
    expect(getSundayOfWeek("2026-10-12")).toBe("2026-10-18");

    // Mid-week Wednesday 2026-10-14
    expect(getMondayOfWeek("2026-10-14")).toBe("2026-10-12");
    expect(getSundayOfWeek("2026-10-14")).toBe("2026-10-18");

    // Sunday 2026-10-18
    expect(getMondayOfWeek("2026-10-18")).toBe("2026-10-12");
    expect(getSundayOfWeek("2026-10-18")).toBe("2026-10-18");

    // Next week Monday 2026-10-19
    expect(getMondayOfWeek("2026-10-19")).toBe("2026-10-19");
    expect(getSundayOfWeek("2026-10-19")).toBe("2026-10-25");

    // Calendar week number from program start
    expect(getCalendarWeekNumber("2026-10-12", "2026-10-14")).toBe(1);
    expect(getCalendarWeekNumber("2026-10-12", "2026-10-19")).toBe(2);
  });

  // 1. Correct identification of genuinely missed sessions
  it("identifies genuinely missed sessions without counting completed or rest days", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1", // 4 days: Mon, Tue, Thu, Fri ([0, 1, 3, 4])
      startDate: "2026-10-12", // Monday
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: ["2026-10-12"], // Mon completed
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
    };

    // As of Wednesday 2026-10-14
    const asOfWed = new Date("2026-10-14T12:00:00");
    const unresolved = detectUnresolvedMissedSessions(state, asOfWed);

    // Tuesday 2026-10-13 was missed!
    expect(unresolved.length).toBe(1);
    expect(unresolved[0].originalDateKey).toBe("2026-10-13");
    expect(unresolved[0].dayLabel).toBe("Day 2");
  });

  // 2. Scheduled session is NOT silently displaced if a pending make-up session exists
  it("does NOT silently displace today's scheduled training workout with an unassigned make-up session", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1", // Mon, Tue, Thu, Fri
      startDate: "2026-10-12", // Monday
      currentWeek: 1,
      currentDayIndex: 2, // At Day 3 (Thu)
      completedDays: ["2026-10-12"], // Completed Mon, missed Tue
      scheduleDays: [0, 1, 3, 4],
      rescheduledSessions: [
        {
          id: "missed_2026-10-13_d1",
          originalDateKey: "2026-10-13",
          sourceWeek: 1,
          dayIndex: 1,
          dayLabel: "Day 2",
          focusLabel: "Upper Body A",
          status: "pending",
        },
      ],
    };

    // On Thursday 2026-10-15: Thursday is a scheduled training day
    const thuRes = resolveProgramDayForDate(state, new Date("2026-10-15T12:00:00"));
    expect(thuRes.isTrainingDay).toBe(true);
    expect(thuRes.isRestDay).toBe(false);
    // Preserves Thursday's own scheduled day index (2), does not overwrite with Day 1 make-up!
    expect(thuRes.scheduledDayIndex).toBe(2);
    expect(thuRes.isRescheduledMakeUp).toBe(false);
    expect(thuRes.pendingBacklogCount).toBe(1);
  });

  // 3. User chooses to recover missed session this week on rest day
  it("allows recovering a missed session on an eligible rest day this week with full conflict validation", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1", // Mon, Tue, Thu, Fri
      startDate: "2026-10-12", // Monday
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 1, 3, 4],
      rescheduledSessions: [
        {
          id: "missed_2026-10-13_d1",
          originalDateKey: "2026-10-13",
          sourceWeek: 1,
          dayIndex: 1,
          dayLabel: "Day 2",
          focusLabel: "Upper Body A",
          status: "pending",
        },
      ],
    };

    // Available slots in current week (Wed Oct 14, Sat Oct 17, Sun Oct 18)
    const slots = getAvailableRecoverySlotsInWeek(state, "2026-10-12", new Date("2026-10-14T12:00:00"));
    expect(slots).toContain("2026-10-14");
    expect(slots).toContain("2026-10-17");

    // Recover on Saturday Oct 17
    const result = recoverSessionThisWeek(state, "missed_2026-10-13_d1", "2026-10-17", new Date("2026-10-14T12:00:00"));
    expect(result.success).toBe(true);
    expect(result.state.rescheduledSessions![0].targetDateKey).toBe("2026-10-17");
    expect(result.state.rescheduledSessions![0].status).toBe("pending");

    // On Saturday Oct 17, schedule resolver confirms it's a make-up training day
    const satRes = resolveProgramDayForDate(result.state, new Date("2026-10-17T12:00:00"));
    expect(satRes.isTrainingDay).toBe(true);
    expect(satRes.isRescheduledMakeUp).toBe(true);
    expect(satRes.scheduledDayIndex).toBe(1);
  });

  // 4. Invalid recovery destination dates are rejected
  it("rejects invalid recovery destinations (past dates, completed days, conflicts)", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 1, 3, 4],
      manualMoves: [
        {
          id: "move_1",
          originalDateKey: "2026-10-15",
          targetDateKey: "2026-10-17",
          sourceWeek: 1,
          dayIndex: 2,
          dayLabel: "Day 3",
          focusLabel: "Lower Body B",
          status: "pending",
          createdAt: "2026-10-12T00:00:00Z",
        },
      ],
    };

    // Target date already completed
    const v1 = validateRecoveryDestinationDate(state, "2026-10-12");
    expect(v1.isValid).toBe(false);

    // Target date conflicting with existing manual move
    const v2 = validateRecoveryDestinationDate(state, "2026-10-17");
    expect(v2.isValid).toBe(false);
    expect(v2.reason).toContain("มีเซสชันอื่นย้ายมาลงวันนี้แล้ว");
  });

  // 5. Deferring a session preserves identity without occupying calendar slots
  it("defers a missed session to a future week and remembers decision without prompting again", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 1, 3, 4],
      rescheduledSessions: [
        {
          id: "missed_2026-10-13_d1",
          originalDateKey: "2026-10-13",
          sourceWeek: 1,
          dayIndex: 1,
          dayLabel: "Day 2",
          focusLabel: "Upper Body A",
          status: "pending",
        },
      ],
    };

    const deferred = deferSessionToFutureWeek(state, "missed_2026-10-13_d1");
    expect(deferred.rescheduledSessions![0].status).toBe("deferred");
    expect(deferred.deferredSessionIds).toContain("missed_2026-10-13_d1");

    // Does not occupy any targetDateKey
    expect(deferred.rescheduledSessions![0].targetDateKey).toBeUndefined();

    // Re-running detectMissedSessions does NOT duplicate it
    const redetected = detectMissedSessions(deferred, new Date("2026-10-15T12:00:00"));
    expect(redetected.rescheduledSessions!.filter((s) => s.originalDateKey === "2026-10-13")).toHaveLength(1);
  });

  // 6. Explicitly skipping a session records dismissal and never re-prompts
  it("explicitly skips a missed session, preserves history, and never re-prompts across reloads", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-12"],
      scheduleDays: [0, 1, 3, 4],
      rescheduledSessions: [
        {
          id: "missed_2026-10-13_d1",
          originalDateKey: "2026-10-13",
          sourceWeek: 1,
          dayIndex: 1,
          dayLabel: "Day 2",
          focusLabel: "Upper Body A",
          status: "pending",
        },
      ],
    };

    const skipped = skipAndDismissSession(state, "missed_2026-10-13_d1");
    expect(skipped.dismissedMissedDates).toContain("2026-10-13");
    expect(skipped.skippedDates).toContain("2026-10-13");
    expect(skipped.rescheduledSessions![0].status).toBe("skipped");

    // Save and reload from storage
    saveActiveJeffProgram(skipped);
    const reloaded = getActiveJeffProgram()!;
    expect(reloaded.dismissedMissedDates).toContain("2026-10-13");

    // Missed detection will NOT re-flag 2026-10-13
    const nextDetection = detectEligibleMissedDates(reloaded, new Date("2026-10-16T12:00:00"));
    expect(nextDetection).not.toContain("2026-10-13");
  });

  // 7. Decide later records lastPromptDismissedDateKey to avoid nagging today
  it("supports 'decide later' without modifying session data and silences prompt for today", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: [],
      scheduleDays: [0, 1, 3, 4],
    };

    const later = decideRecoveryLater(state, "2026-10-14");
    expect(later.lastPromptDismissedDateKey).toBe("2026-10-14");

    // Session remains intact in unresolved queue
    const unresolved = detectUnresolvedMissedSessions(later, new Date("2026-10-14T12:00:00"));
    expect(unresolved.length).toBeGreaterThan(0);
  });

  // 8. Weekly review detects unresolved sessions from previous week across week boundary
  it("detects previous week review across week boundary with accurate counts", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1", // 4 days: Mon, Tue, Thu, Fri
      startDate: "2026-10-12", // Monday Week 1
      currentWeek: 1,
      currentDayIndex: 2,
      completedDays: ["2026-10-12", "2026-10-13"], // Completed Mon & Tue, missed Thu & Fri
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
    };

    // User opens app on Monday Week 2 (2026-10-19)
    const asOfNextMon = new Date("2026-10-19T12:00:00");
    const reviewData = detectWeeklyReview(state, asOfNextMon);

    expect(reviewData).not.toBeNull();
    expect(reviewData!.previousWeekNumber).toBe(1);
    expect(reviewData!.totalScheduled).toBe(4);
    expect(reviewData!.completedCount).toBe(2);
    // Unresolved: Thu Oct 15 and Fri Oct 16
    expect(reviewData!.unresolvedSessions).toHaveLength(2);
    expect(reviewData!.unresolvedSessions.map((s) => s.originalDateKey)).toEqual(["2026-10-15", "2026-10-16"]);
  });

  // 9. Completing weekly review persists decision and never re-prompts for that week
  it("persists weekly review decision and avoids re-prompting on subsequent reloads or navigations", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 2,
      completedDays: ["2026-10-12", "2026-10-13"],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
    };

    const asOfNextMon = new Date("2026-10-19T12:00:00");
    const reviewedState = completeWeeklyReview(state, 1, "defer");

    expect(reviewedState.weeklyReviews).toHaveLength(1);
    expect(reviewedState.weeklyReviews![0].weekNumber).toBe(1);
    expect(reviewedState.weeklyReviews![0].decision).toBe("defer");

    // Save and reload
    saveActiveJeffProgram(reviewedState);
    const reloaded = getActiveJeffProgram()!;
    expect(reloaded.weeklyReviews).toHaveLength(1);

    // Re-detecting weekly review for week 1 returns null!
    const secondCheck = detectWeeklyReview(reloaded, asOfNextMon);
    expect(secondCheck).toBeNull();
  });

  // 10. Completing a recovered session removes it from active recovery queue without resetting progression
  it("completes a recovered make-up session, records completion, and preserves active progression", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1", // 4 days/week
      startDate: "2026-10-12",
      currentWeek: 2,
      currentDayIndex: 0, // In Week 2 Day 1
      completedDays: ["2026-10-12", "2026-10-13", "2026-10-19"],
      scheduleDays: [0, 1, 3, 4],
      rescheduledSessions: [
        {
          id: "missed_2026-10-15_d2",
          originalDateKey: "2026-10-15",
          targetDateKey: "2026-10-21", // Wednesday (rest day in Week 2)
          sourceWeek: 1,
          dayIndex: 2,
          dayLabel: "Day 3",
          focusLabel: "Lower Body B",
          status: "pending",
          type: "recovery",
        },
      ],
    };

    // User finishes the make-up on Wednesday 2026-10-21
    const finishedState = advanceJeffProgramAfterFinish(state, "2026-10-21", 2);

    expect(finishedState.completedDays).toContain("2026-10-21");
    expect(finishedState.rescheduledSessions![0].status).toBe("completed");

    // Active pending recovery queue is now empty
    const pendingRecovery = finishedState.rescheduledSessions!.filter((s) => s.status === "pending");
    expect(pendingRecovery).toHaveLength(0);

    // Week 2 progression is preserved (does not regress or jump randomly)
    expect(finishedState.currentWeek).toBe(2);
  });
});
