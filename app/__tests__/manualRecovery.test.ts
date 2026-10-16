import { describe, it, expect, beforeEach } from "vitest";
import {
  findProgramById,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  detectEligibleMissedDates,
  buildRecoveryPlan,
  confirmRecoveryPlan,
  declineRecoveryPlan,
  cancelRecoveryPlan,
  getValidMoveDates,
  moveWorkoutSession,
  cancelManualMove,
  saveActiveJeffProgram,
  getActiveJeffProgram,
  clearActiveJeffProgram,
  saveProgramProgressArchive,
  getProgramProgressArchive,
  type ActiveJeffProgramState,
  type SchedulingModel,
} from "../lib/jeffPrograms";
import { runMigration } from "../lib/migration";

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

describe("Manual Schedule Adjustment and User-Controlled Missed Workout Recovery", () => {
  const testProgramVariants: Array<{
    programId: string;
    model: SchedulingModel;
    splitName: string;
    scheduleDays: number[];
  }> = [
    { programId: "pure-bodybuilding-phase1", model: "fixed_weekday", splitName: "Upper / Lower (Fixed Week)", scheduleDays: [0, 1, 3, 4] },
    { programId: "hypertrophy-fundamentals", model: "fixed_weekday", splitName: "Full Body (3-Day)", scheduleDays: [0, 2, 4] },
    { programId: "glute-hypertrophy", model: "sequential_rotation", splitName: "Sequential Rotation", scheduleDays: [0, 1, 2, 3, 4] },
  ];

  // ─────────────────────────────────────────────────────────────────
  // 1. Manually moving a scheduled session updates calendar and persisted state without marking it completed
  // ─────────────────────────────────────────────────────────────────
  it.each(testProgramVariants)(
    "1. Manually moving a scheduled session updates calendar and persisted state without marking it completed ($splitName)",
    ({ programId, model, scheduleDays }) => {
      const state: ActiveJeffProgramState = {
        programId,
        startDate: "2026-10-12", // Monday
        currentWeek: 1,
        currentDayIndex: 0,
        completedDays: [],
        skippedDates: [],
        scheduleDays,
        schedulingModel: model,
        missedSessionPolicy: "reschedule_to_rest_day",
      };

      // Move Monday 2026-10-12 to Wednesday 2026-10-14 (normally a rest day)
      const moveResult = moveWorkoutSession(state, "2026-10-12", "2026-10-14");
      expect(moveResult.success).toBe(true);

      const updated = moveResult.state;
      expect(updated.manualMoves?.length).toBe(1);
      expect(updated.manualMoves![0].originalDateKey).toBe("2026-10-12");
      expect(updated.manualMoves![0].targetDateKey).toBe("2026-10-14");
      expect(updated.manualMoves![0].status).toBe("pending");

      // Verify source day is now treated as scheduled rest
      const sourceResolution = resolveProgramDayForDate(updated, new Date("2026-10-12T12:00:00"));
      expect(sourceResolution.isTrainingDay).toBe(false);
      expect(sourceResolution.isCompleted).toBe(false);

      // Verify target day is now treated as training day with reason 'manual_move'
      const targetResolution = resolveProgramDayForDate(updated, new Date("2026-10-14T12:00:00"));
      expect(targetResolution.isTrainingDay).toBe(true);
      expect(targetResolution.isCompleted).toBe(false);
      expect(targetResolution.reason).toBe("manual_move");
      expect(targetResolution.isManualMove).toBe(true);

      // Verify no completion has been fabricated
      expect(updated.completedDays).toHaveLength(0);
    }
  );

  // ─────────────────────────────────────────────────────────────────
  // 2. Declining recovery leaves the upcoming schedule free of recovery-only sessions
  // ─────────────────────────────────────────────────────────────────
  it("2. Declining recovery leaves the upcoming schedule free of recovery-only sessions", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05", // Monday last week
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [], // Missed all sessions last week
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const asOfToday = new Date("2026-10-14T12:00:00"); // Wednesday week 2
    const missedDates = detectEligibleMissedDates(state, asOfToday);
    expect(missedDates.length).toBeGreaterThan(0);

    const declinedState = declineRecoveryPlan(state);
    expect(declinedState.recoveryPlan?.status).toBe("declined");
    expect(declinedState.dismissedMissedDates?.length).toBeGreaterThan(0);

    // Any recovery-only rescheduledSessions should be cleared
    const pendingRecoverySessions = (declinedState.rescheduledSessions ?? []).filter(
      (s) => s.type === "recovery" && s.status === "pending"
    );
    expect(pendingRecoverySessions).toHaveLength(0);

    // Wednesday is a rest day, should remain rest day (not forced into recovery session)
    const wedResolution = resolveProgramDayForDate(declinedState, asOfToday);
    expect(wedResolution.isTrainingDay).toBe(false);
    expect(wedResolution.reason).toBe("scheduled_rest");
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. Declining recovery does not reset progression or fabricate history
  // ─────────────────────────────────────────────────────────────────
  it("3. Declining recovery does not reset progression or fabricate history", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 2,
      currentDayIndex: 2, // Already progressed to Day 3 (0-indexed 2)
      completedDays: ["2026-10-05", "2026-10-06"],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const declinedState = declineRecoveryPlan(state);

    // Progression must be intact
    expect(declinedState.currentWeek).toBe(2);
    expect(declinedState.currentDayIndex).toBe(2);
    expect(declinedState.completedDays).toEqual(["2026-10-05", "2026-10-06"]);
    expect(declinedState.completedDays).toHaveLength(2);
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Confirming recovery schedules exactly the eligible missed sessions
  // ─────────────────────────────────────────────────────────────────
  it("4. Confirming recovery schedules exactly the eligible missed sessions", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: ["2026-10-05"], // Completed Mon, missed Tue (2026-10-06)
      skippedDates: [],
      dismissedMissedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const asOfToday = new Date("2026-10-07T12:00:00"); // Wednesday
    const eligibleMissed = detectEligibleMissedDates(state, asOfToday);
    expect(eligibleMissed).toEqual(["2026-10-06"]);

    const proposedPlan = buildRecoveryPlan(state, asOfToday);
    expect(proposedPlan).not.toBeNull();
    expect(proposedPlan!.sessions).toHaveLength(1);
    expect(proposedPlan!.sessions[0].originalDateKey).toBe("2026-10-06");

    const confirmedState = confirmRecoveryPlan(state, proposedPlan!);
    expect(confirmedState.recoveryPlan?.status).toBe("active");
    expect(confirmedState.recoveryPlan?.sessions).toHaveLength(1);

    const pendingRecoverySessions = (confirmedState.rescheduledSessions ?? []).filter(
      (s) => s.type === "recovery" && s.status === "pending"
    );
    expect(pendingRecoverySessions).toHaveLength(1);
    expect(pendingRecoverySessions[0].originalDateKey).toBe("2026-10-06");
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Recalculating the calendar does not duplicate recovery sessions
  // ─────────────────────────────────────────────────────────────────
  it("5. Recalculating the calendar does not duplicate recovery sessions", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: ["2026-10-05"],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const asOfToday = new Date("2026-10-07T12:00:00");
    const plan = buildRecoveryPlan(state, asOfToday)!;
    const confirmedState = confirmRecoveryPlan(state, plan);

    // Call confirm again or buildRecoveryPlan again
    const recheckedPlan = buildRecoveryPlan(confirmedState, asOfToday);
    // Since active plan already exists for these missed dates, it should return existing plan
    expect(recheckedPlan?.id).toBe(confirmedState.recoveryPlan?.id);

    // Calling confirmRecoveryPlan again should be idempotent
    const reConfirmed = confirmRecoveryPlan(confirmedState, recheckedPlan!);
    const recoveryCount = (reConfirmed.rescheduledSessions ?? []).filter(
      (s) => s.type === "recovery" && s.status === "pending"
    ).length;
    expect(recoveryCount).toBe(1);
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Completing one recovery session updates only that session
  // ─────────────────────────────────────────────────────────────────
  it("6. Completing one recovery session updates only that session", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    // Missed Mon (2026-10-05) and Tue (2026-10-06)
    const asOfWed = new Date("2026-10-07T12:00:00");
    const plan = buildRecoveryPlan(state, asOfWed)!;
    expect(plan.sessions.length).toBe(2);

    const activeState = confirmRecoveryPlan(state, plan);
    const firstSession = activeState.recoveryPlan!.sessions[0];
    const targetDate = firstSession.targetDateKey || "2026-10-07";

    // Complete the first recovery session
    const updated = advanceJeffProgramAfterFinish(activeState, targetDate, firstSession.dayIndex);

    // First session in plan should be completed
    const updatedPlanSession = updated.recoveryPlan?.sessions.find((s) => s.id === firstSession.id);
    expect(updatedPlanSession?.status).toBe("completed");

    // Second session should still be pending
    const secondSession = updated.recoveryPlan!.sessions[1];
    const updatedSecond = updated.recoveryPlan?.sessions.find((s) => s.id === secondSession.id);
    expect(updatedSecond?.status).toBe("pending");

    // Plan itself is still active (not completed)
    expect(updated.recoveryPlan?.status).toBe("active");
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Completing all recovery sessions terminates the recovery plan exactly once
  // ─────────────────────────────────────────────────────────────────
  it("7. Completing all recovery sessions terminates the recovery plan exactly once", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const asOfWed = new Date("2026-10-07T12:00:00");
    const plan = buildRecoveryPlan(state, asOfWed)!;
    const activeState = confirmRecoveryPlan(state, plan);

    // Complete session 1
    const s1 = activeState.recoveryPlan!.sessions[0];
    const afterS1 = advanceJeffProgramAfterFinish(activeState, s1.targetDateKey || "2026-10-07", s1.dayIndex);

    // Complete session 2
    const s2 = afterS1.recoveryPlan!.sessions[1];
    const afterS2 = advanceJeffProgramAfterFinish(afterS1, s2.targetDateKey || "2026-10-10", s2.dayIndex);

    // Recovery plan must now be completed!
    expect(afterS2.recoveryPlan?.status).toBe("completed");
    expect(afterS2.recoveryPlan?.completedAt).toBeDefined();

    // Pending recovery sessions should be 0
    const pendingRecovery = (afterS2.rescheduledSessions ?? []).filter(
      (s) => s.type === "recovery" && s.status === "pending"
    );
    expect(pendingRecovery).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────
  // 8. Normal scheduling resumes after recovery completion
  // ─────────────────────────────────────────────────────────────────
  it("8. Normal scheduling resumes after recovery completion", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const asOfWed = new Date("2026-10-07T12:00:00");
    const plan = buildRecoveryPlan(state, asOfWed)!;
    const activeState = confirmRecoveryPlan(state, plan);

    // Complete all recovery sessions
    let curState = activeState;
    for (const session of activeState.recoveryPlan!.sessions) {
      curState = advanceJeffProgramAfterFinish(curState, session.targetDateKey || "2026-10-07", session.dayIndex);
    }
    expect(curState.recoveryPlan?.status).toBe("completed");

    // Look at Thursday 2026-10-08 (normally scheduled Day 3: Upper/Lower program Day 2)
    const thuResolution = resolveProgramDayForDate(curState, new Date("2026-10-08T12:00:00"));
    expect(thuResolution.isTrainingDay).toBe(true);
    // Reason should be normal scheduled training, not a recovery override
    expect(thuResolution.reason).toBe("scheduled_session");
  });

  // ─────────────────────────────────────────────────────────────────
  // 9. The same recovered sessions are not reintroduced after the plan finishes
  // ─────────────────────────────────────────────────────────────────
  it("9. The same recovered sessions are not reintroduced after the plan finishes", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const asOfWed = new Date("2026-10-07T12:00:00");
    const plan = buildRecoveryPlan(state, asOfWed)!;
    let curState = confirmRecoveryPlan(state, plan);

    for (const session of plan.sessions) {
      curState = advanceJeffProgramAfterFinish(curState, session.targetDateKey || "2026-10-07", session.dayIndex);
    }

    // Now check if detectEligibleMissedDates re-detects 2026-10-05 or 2026-10-06
    const asOfNextWeek = new Date("2026-10-12T12:00:00");
    const newlyMissed = detectEligibleMissedDates(curState, asOfNextWeek);
    expect(newlyMissed).not.toContain("2026-10-05");
    expect(newlyMissed).not.toContain("2026-10-06");
  });

  // ─────────────────────────────────────────────────────────────────
  // 10. A new missed workout during recovery is handled as a separate event according to policy
  // ─────────────────────────────────────────────────────────────────
  it("10. A new missed workout during recovery is handled as a separate event according to policy", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: ["2026-10-05"],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    // First recovery plan for 2026-10-06
    const plan1 = buildRecoveryPlan(state, new Date("2026-10-07T12:00:00"))!;
    const activeState = confirmRecoveryPlan(state, plan1);
    expect(activeState.recoveryPlan?.sessions.map((s) => s.originalDateKey)).toEqual(["2026-10-06"]);

    // User also misses Thursday 2026-10-08
    const asOfFri = new Date("2026-10-09T12:00:00");
    const newMissed = detectEligibleMissedDates(activeState, asOfFri);
    // It should detect Thursday 2026-10-08 as a new missed date, but NOT duplicate 2026-10-06
    expect(newMissed).toContain("2026-10-08");
    expect(newMissed).not.toContain("2026-10-06");
  });

  // ─────────────────────────────────────────────────────────────────
  // 11. Conflicting dates and rest days are handled safely
  // ─────────────────────────────────────────────────────────────────
  it("11. Conflicting dates and rest days are handled safely", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: ["2026-10-05", "2026-10-06"],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    // Cannot move to same date
    const sameDateMove = moveWorkoutSession(state, "2026-10-08", "2026-10-08");
    expect(sameDateMove.success).toBe(false);

    // Cannot move to already completed date
    const completedDateMove = moveWorkoutSession(state, "2026-10-08", "2026-10-05");
    expect(completedDateMove.success).toBe(false);
    expect(completedDateMove.error).toContain("completed");

    // Valid move to a rest day (2026-10-07 Wednesday) succeeds
    const validMove = moveWorkoutSession(state, "2026-10-08", "2026-10-07");
    expect(validMove.success).toBe(true);

    // Second move to same target date (2026-10-07) fails due to conflict
    const conflictMove = moveWorkoutSession(validMove.state, "2026-10-09", "2026-10-07");
    expect(conflictMove.success).toBe(false);
    expect(conflictMove.error).toContain("already been moved");

    // Inspect getValidMoveDates
    const validDates = getValidMoveDates(validMove.state, "2026-10-09", 7);
    const targetInValidDates = validDates.find((d) => d.dateKey === "2026-10-07");
    expect(targetInValidDates?.isValid).toBe(false);
    expect(targetInValidDates?.conflictReason).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────
  // 12. Recovery works for both fixed-week and sequential-rotation programs
  // ─────────────────────────────────────────────────────────────────
  it("12. Recovery works for both fixed-week and sequential-rotation programs", () => {
    // Sequential rotation program
    const seqState: ActiveJeffProgramState = {
      programId: "glute-hypertrophy",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 1,
      completedDays: ["2026-10-05"],
      skippedDates: [],
      scheduleDays: [0, 1, 2, 3, 4],
      schedulingModel: "sequential_rotation",
      missedSessionPolicy: "shift_sequence",
    };

    // For sequential rotation, missing a calendar day does NOT create a separate recovery backlog;
    // it simply waits for the next training day (shift_sequence)
    const asOfThu = new Date("2026-10-08T12:00:00");
    const seqMissed = detectEligibleMissedDates(seqState, asOfThu);
    expect(seqMissed).toHaveLength(0); // Sequential rotation self-shifts, no separate backlog needed

    // Fixed week program
    const fixedState: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    const fixedMissed = detectEligibleMissedDates(fixedState, asOfThu);
    expect(fixedMissed.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────
  // 13. Recovery survives app reloads and schema migrations
  // ─────────────────────────────────────────────────────────────────
  it("13. Recovery survives app reloads and schema migrations", () => {
    clearActiveJeffProgram();

    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: ["2026-10-05"],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      recoveryPlan: {
        id: "plan-test-123",
        status: "active",
        createdAt: "2026-10-07T10:00:00.000Z",
        sessions: [
          {
            id: "rec-session-1",
            originalDateKey: "2026-10-06",
            targetDateKey: "2026-10-07",
            sourceWeek: 1,
            dayIndex: 1,
            dayLabel: "Day 2",
            focusLabel: "Lower Body",
            status: "pending",
          },
        ],
      },
      manualMoves: [
        {
          id: "move-test-1",
          originalDateKey: "2026-10-08",
          targetDateKey: "2026-10-10",
          sourceWeek: 1,
          dayIndex: 2,
          dayLabel: "Day 3",
          focusLabel: "Upper Body",
          status: "pending",
          createdAt: "2026-10-07T10:00:00.000Z",
        },
      ],
      dismissedMissedDates: ["2026-10-01"],
    };

    // Save state to storage
    saveActiveJeffProgram(state);

    // Simulate reload
    const reloaded = getActiveJeffProgram();
    expect(reloaded).not.toBeNull();
    expect(reloaded!.recoveryPlan?.id).toBe("plan-test-123");
    expect(reloaded!.recoveryPlan?.status).toBe("active");
    expect(reloaded!.recoveryPlan?.sessions).toHaveLength(1);
    expect(reloaded!.manualMoves).toHaveLength(1);
    expect(reloaded!.manualMoves![0].targetDateKey).toBe("2026-10-10");
    expect(reloaded!.dismissedMissedDates).toContain("2026-10-01");

    // Also run migration runner to ensure it doesn't strip or corrupt recovery state
    const migrationResult = runMigration();
    expect(migrationResult).not.toBeNull();
    expect(migrationResult?.migratedAt).toBeDefined();

    const postMigration = getActiveJeffProgram();
    expect(postMigration!.recoveryPlan?.id).toBe("plan-test-123");
    expect(postMigration!.manualMoves).toHaveLength(1);
  });

  // ─────────────────────────────────────────────────────────────────
  // 14. The active program never silently resets to Day 1
  // ─────────────────────────────────────────────────────────────────
  it("14. The active program never silently resets to Day 1", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 2,
      currentDayIndex: 3, // Day 4
      completedDays: ["2026-10-05", "2026-10-06", "2026-10-08", "2026-10-09", "2026-10-12", "2026-10-13", "2026-10-15"],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
    };

    // Decline recovery
    const declined = declineRecoveryPlan(state);
    expect(declined.currentDayIndex).toBe(3);
    expect(declined.currentWeek).toBe(2);

    // Cancel a move
    const cancelledMove = cancelManualMove(state, "non-existent");
    expect(cancelledMove.currentDayIndex).toBe(3);

    // Cancel a recovery plan
    const cancelledRec = cancelRecoveryPlan(state);
    expect(cancelledRec.currentDayIndex).toBe(3);
  });

  // ─────────────────────────────────────────────────────────────────
  // 15. Manual moves and recovery do not corrupt workout history or PRs
  // ─────────────────────────────────────────────────────────────────
  it("15. Manual moves and recovery do not corrupt workout history or PRs", () => {
    const historyBefore = ["2026-10-05", "2026-10-06", "2026-10-08"];
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 3,
      completedDays: [...historyBefore],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
    };

    // Move workout from 2026-10-09 to 2026-10-10
    const moveRes = moveWorkoutSession(state, "2026-10-09", "2026-10-10");
    expect(moveRes.success).toBe(true);

    // completedDays should remain exactly unchanged
    expect(moveRes.state.completedDays).toEqual(historyBefore);

    // Cancel the move
    const cancelled = cancelManualMove(moveRes.state, moveRes.state.manualMoves![0].id);
    expect(cancelled.completedDays).toEqual(historyBefore);
  });

  // ─────────────────────────────────────────────────────────────────
  // 16. Repeated completion events, retries, or calendar recalculations are idempotent
  // ─────────────────────────────────────────────────────────────────
  it("16. Repeated completion events, retries, or calendar recalculations are idempotent", () => {
    const state: ActiveJeffProgramState = {
      programId: "pure-bodybuilding-phase1",
      startDate: "2026-10-05",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      skippedDates: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    // Complete Monday 2026-10-05 once
    const firstFinish = advanceJeffProgramAfterFinish(state, "2026-10-05", 0);
    expect(firstFinish.completedDays).toContain("2026-10-05");
    const countAfterFirst = firstFinish.completedDays.length;

    // Retry/repeat completion of same date
    const secondFinish = advanceJeffProgramAfterFinish(firstFinish, "2026-10-05", 0);
    // Should NOT duplicate the date in completedDays
    expect(secondFinish.completedDays.filter((d) => d === "2026-10-05")).toHaveLength(1);
    expect(secondFinish.completedDays.length).toBe(countAfterFirst);

    // Repeated calendar resolution
    const res1 = resolveProgramDayForDate(secondFinish, new Date("2026-10-05T12:00:00"));
    const res2 = resolveProgramDayForDate(secondFinish, new Date("2026-10-05T12:00:00"));
    expect(res1.isCompleted).toBe(true);
    expect(res2.isCompleted).toBe(true);
    expect(res1.scheduledDayIndex).toBe(res2.scheduledDayIndex);
  });
});
