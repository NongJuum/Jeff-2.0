import { describe, it, expect } from "vitest";
import {
  findProgramById,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  getNextProgramTrainingDate,
  isJeffProgramComplete,
  detectMissedSessions,
  planRescheduledSessions,
  resolveRescheduledSession,
  cancelRescheduledSession,
  getProgramScheduledDates,
  resolveProgramDefinition,
  type ActiveJeffProgramState,
  type SchedulingModel,
  type MissedSessionPolicy,
  type UniversalProgramDefinition,
} from "../lib/jeffPrograms";

describe("Universal Workout Scheduling Engine — Split Matrix & Training Frequencies", () => {
  const splitTestCases = [
    {
      splitName: "2-Day Full Body",
      splitType: "full_body",
      daysPerWeek: 2,
      scheduleDays: [1, 4], // Tue, Fri
      durationWeeks: 4,
    },
    {
      splitName: "3-Day Full Body",
      splitType: "full_body",
      daysPerWeek: 3,
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri
      durationWeeks: 8,
    },
    {
      splitName: "4-Day Upper / Lower",
      splitType: "upper_lower",
      daysPerWeek: 4,
      scheduleDays: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
      durationWeeks: 8,
    },
    {
      splitName: "5-Day Bodypart / Bro Split",
      splitType: "bodypart",
      daysPerWeek: 5,
      scheduleDays: [0, 1, 2, 3, 4], // Mon-Fri
      durationWeeks: 10,
    },
    {
      splitName: "6-Day Push / Pull / Legs",
      splitType: "push_pull_legs",
      daysPerWeek: 6,
      scheduleDays: [0, 1, 2, 3, 4, 5], // Mon-Sat
      durationWeeks: 12,
    },
  ];

  it.each(splitTestCases)(
    "correctly schedules training and rest days for $splitName ($daysPerWeek days/wk)",
    ({ splitType, daysPerWeek, scheduleDays, durationWeeks }) => {
      const state: ActiveJeffProgramState = {
        programId: `test_${splitType}_${daysPerWeek}d`,
        startDate: "2026-10-12", // Monday
        currentWeek: 1,
        currentDayIndex: 0,
        completedDays: [],
        scheduleDays,
        schedulingModel: "fixed_weekday",
        customProgramDefinition: {
          id: `test_${splitType}_${daysPerWeek}d`,
          name: `${daysPerWeek}-Day Split`,
          splitType,
          daysPerWeek,
          durationWeeks,
          cycleLengthDays: 7,
          defaultScheduleDays: scheduleDays,
          weeks: [
            {
              weekNumber: 1,
              days: Array.from({ length: daysPerWeek }, (_, i) => ({
                dayLabel: `Day ${i + 1}`,
                focusLabel: `Workout ${i + 1}`,
              })),
            },
          ],
        },
      };

      // Check all 7 days of the week starting from Monday 2026-10-12
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const testDate = new Date(2026, 9, 12 + dayOffset, 12);
        const dayOfWeek = dayOffset; // 0=Mon ... 6=Sun
        const isScheduled = scheduleDays.includes(dayOfWeek);
        const resolution = resolveProgramDayForDate(state, testDate);

        expect(resolution.isTrainingDay).toBe(isScheduled);
        expect(resolution.isRestDay).toBe(!isScheduled);
        if (isScheduled) {
          expect(resolution.reason).toBe("scheduled_session");
        } else {
          expect(resolution.reason).toBe("scheduled_rest");
        }
      }
    }
  );

  it("handles non-7-day microcycles (e.g. 4-day cycle: 3 days on, 1 day off)", () => {
    // 3 on, 1 off cycle: Days 0, 1, 2 train, Day 3 rest
    const customDef: UniversalProgramDefinition = {
      id: "cycle_3on1off",
      name: "3 On 1 Off Rotation",
      cycleLengthDays: 4,
      cyclePattern: [true, true, true, false],
      durationWeeks: 6,
      days: [
        { dayLabel: "Push", focusLabel: "Chest & Shoulders" },
        { dayLabel: "Pull", focusLabel: "Back & Biceps" },
        { dayLabel: "Legs", focusLabel: "Quads & Hamstrings" },
      ],
    };

    const state: ActiveJeffProgramState = {
      programId: "cycle_3on1off",
      startDate: "2026-10-12", // Monday (Day 0)
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [],
      schedulingModel: "cycle_pattern",
      cycleLengthDays: 4,
      cyclePattern: [true, true, true, false],
      customProgramDefinition: customDef,
    };

    // Day 0 (Mon 10-12): Train
    const d0 = resolveProgramDayForDate(state, new Date(2026, 9, 12, 12));
    expect(d0.isTrainingDay).toBe(true);
    expect(d0.isRestDay).toBe(false);

    // Day 1 (Tue 10-13): Train
    const d1 = resolveProgramDayForDate(state, new Date(2026, 9, 13, 12));
    expect(d1.isTrainingDay).toBe(true);

    // Day 2 (Wed 10-14): Train
    const d2 = resolveProgramDayForDate(state, new Date(2026, 9, 14, 12));
    expect(d2.isTrainingDay).toBe(true);

    // Day 3 (Thu 10-15): REST (Pattern index 3 = false)
    const d3 = resolveProgramDayForDate(state, new Date(2026, 9, 15, 12));
    expect(d3.isTrainingDay).toBe(false);
    expect(d3.isRestDay).toBe(true);

    // Day 4 (Fri 10-16): Cycle repeats -> Train!
    const d4 = resolveProgramDayForDate(state, new Date(2026, 9, 16, 12));
    expect(d4.isTrainingDay).toBe(true);
  });

  it("handles 8-day microcycles (e.g. 4 on 1 off 2 on 1 off)", () => {
    const pattern = [true, true, true, true, false, true, true, false]; // 8-day cycle
    const state: ActiveJeffProgramState = {
      programId: "cycle_8day",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [],
      schedulingModel: "cycle_pattern",
      cycleLengthDays: 8,
      cyclePattern: pattern,
    };

    // Days 0..3: Train
    for (let i = 0; i < 4; i++) {
      const res = resolveProgramDayForDate(state, new Date(2026, 9, 12 + i, 12));
      expect(res.isTrainingDay).toBe(true);
    }
    // Day 4: Rest
    expect(resolveProgramDayForDate(state, new Date(2026, 9, 16, 12)).isTrainingDay).toBe(false);
    // Days 5..6: Train
    expect(resolveProgramDayForDate(state, new Date(2026, 9, 17, 12)).isTrainingDay).toBe(true);
    expect(resolveProgramDayForDate(state, new Date(2026, 9, 18, 12)).isTrainingDay).toBe(true);
    // Day 7: Rest
    expect(resolveProgramDayForDate(state, new Date(2026, 9, 19, 12)).isTrainingDay).toBe(false);
    // Day 8: Cycle repeats -> Train!
    expect(resolveProgramDayForDate(state, new Date(2026, 9, 20, 12)).isTrainingDay).toBe(true);
  });
});

describe("Universal Workout Scheduling Engine — Sequential Rotation Model", () => {
  it("advances purely in sequence without accumulating calendar missed-session backlogs", () => {
    const customDef: UniversalProgramDefinition = {
      id: "seq_ppl",
      name: "Sequential PPL",
      days: [
        { dayLabel: "Push", focusLabel: "Chest & Triceps" },
        { dayLabel: "Pull", focusLabel: "Back & Biceps" },
        { dayLabel: "Legs", focusLabel: "Legs & Core" },
      ],
    };

    let state: ActiveJeffProgramState = {
      programId: "seq_ppl",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0, // at Push
      completedDays: [],
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri preferred
      schedulingModel: "sequential_rotation",
      customProgramDefinition: customDef,
    };

    // On Monday (training day): recommends Push (index 0)
    const mon = resolveProgramDayForDate(state, new Date(2026, 9, 12, 12));
    expect(mon.isTrainingDay).toBe(true);
    expect(mon.scheduledDayIndex).toBe(0);

    // Complete Push on Monday
    state = advanceJeffProgramAfterFinish(state, "2026-10-12", 0);
    expect(state.completedDays).toEqual(["2026-10-12"]);
    expect(state.currentDayIndex).toBe(1); // Pull is next

    // Tuesday is a rest day (not in [0, 2, 4])
    const tue = resolveProgramDayForDate(state, new Date(2026, 9, 13, 12));
    expect(tue.isTrainingDay).toBe(false);
    expect(tue.isRestDay).toBe(true);

    // User is busy and misses Wednesday and Friday
    // In sequential rotation, detectMissedSessions should NOT create synthetic make-up backlogs!
    state = detectMissedSessions(state, new Date(2026, 9, 18, 12));
    expect(state.rescheduledSessions ?? []).toHaveLength(0);

    // When user returns on the following Monday (2026-10-19):
    // The next workout waiting for them is still Pull (index 1)! No sessions lost!
    const nextMon = resolveProgramDayForDate(state, new Date(2026, 9, 19, 12));
    expect(nextMon.isTrainingDay).toBe(true);
    expect(nextMon.scheduledDayIndex).toBe(1);
    expect(nextMon.isRescheduledMakeUp).toBe(false);
  });
});

describe("Universal Workout Scheduling Engine — Missed Session Policies", () => {
  it("policy 'skip_and_maintain': drops missed sessions without creating make-up backlog", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "skip_and_maintain",
    };

    // User completes Monday
    state = advanceJeffProgramAfterFinish(state, "2026-10-12", 0);

    // Wednesday 2026-10-14 is missed
    state = detectMissedSessions(state, new Date(2026, 9, 15, 12));

    // Under skip_and_maintain: no pending rescheduled sessions are created
    expect(state.rescheduledSessions ?? []).toHaveLength(0);
    // But Wednesday is marked as skipped
    expect(state.skippedDates).toContain("2026-10-14");

    // On Friday 2026-10-16: recurring schedule is maintained cleanly
    const fri = resolveProgramDayForDate(state, new Date(2026, 9, 16, 12));
    expect(fri.isTrainingDay).toBe(true);
    expect(fri.isRescheduledMakeUp).toBe(false);
  });

  it("policy 'reschedule_to_rest_day': places make-up session onto upcoming rest day", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4], // Mon, Wed, Fri
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "reschedule_to_rest_day",
    };

    // Monday 2026-10-12 was missed
    state = detectMissedSessions(state, new Date(2026, 9, 13, 8)); // Tuesday morning
    state = planRescheduledSessions(state, new Date(2026, 9, 13, 8));

    expect(state.rescheduledSessions).toHaveLength(1);
    const session = state.rescheduledSessions![0];
    expect(session.status).toBe("pending");
    // Under reschedule_to_rest_day, Tuesday (a rest day) is chosen as make-up slot!
    expect(session.targetDateKey).toBe("2026-10-13");

    // On Tuesday 2026-10-13, resolution now shows training day due to make-up!
    const tueRes = resolveProgramDayForDate(state, new Date(2026, 9, 13, 12));
    expect(tueRes.isTrainingDay).toBe(true);
    expect(tueRes.isRescheduledMakeUp).toBe(true);
    expect(tueRes.scheduledDayIndex).toBe(0);
  });
});

describe("Universal Workout Scheduling Engine — Multiple Missed Sessions & Boundary Transitions", () => {
  it("handles multiple consecutive missed sessions deterministically", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_upper_lower", // 4-day: Mon, Tue, Thu, Fri
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 1, 3, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "shift_sequence",
    };

    // User missed Mon (10-12) and Tue (10-13)
    // Checking on Wednesday (10-14):
    state = detectMissedSessions(state, new Date(2026, 9, 14, 12));
    expect(state.rescheduledSessions).toHaveLength(2);

    const s1 = state.rescheduledSessions![0];
    const s2 = state.rescheduledSessions![1];
    expect(s1.originalDateKey).toBe("2026-10-12");
    expect(s1.dayIndex).toBe(0); // Day 1
    expect(s2.originalDateKey).toBe("2026-10-13");
    expect(s2.dayIndex).toBe(1); // Day 2

    // Repeated detection on later dates does not duplicate
    state = detectMissedSessions(state, new Date(2026, 9, 15, 12));
    expect(state.rescheduledSessions).toHaveLength(2);

    // Plan sessions: Thursday (10-15) and Friday (10-16) are scheduled training days
    state = planRescheduledSessions(state, new Date(2026, 9, 14, 12));
    expect(state.rescheduledSessions![0].targetDateKey).toBe("2026-10-15");
    expect(state.rescheduledSessions![1].targetDateKey).toBe("2026-10-16");

    // On Thursday: recommends Day 1 make-up
    const thuRes = resolveProgramDayForDate(state, new Date(2026, 9, 15, 12));
    expect(thuRes.scheduledDayIndex).toBe(0);
    expect(thuRes.isRescheduledMakeUp).toBe(true);

    // User completes Day 1 on Thursday
    state = advanceJeffProgramAfterFinish(state, "2026-10-15", 0);
    expect(state.rescheduledSessions![0].status).toBe("completed");

    // On Friday: recommends Day 2 make-up
    const friRes = resolveProgramDayForDate(state, new Date(2026, 9, 16, 12));
    expect(friRes.scheduledDayIndex).toBe(1);
    expect(friRes.isRescheduledMakeUp).toBe(true);

    // User completes Day 2 on Friday
    state = advanceJeffProgramAfterFinish(state, "2026-10-16", 1);
    expect(state.rescheduledSessions![1].status).toBe("completed");

    // Saturday and Sunday are fixed rest days: strictly preserved!
    const satRes = resolveProgramDayForDate(state, new Date(2026, 9, 17, 12));
    expect(satRes.isTrainingDay).toBe(false);
    expect(satRes.isRestDay).toBe(true);

    const sunRes = resolveProgramDayForDate(state, new Date(2026, 9, 18, 12));
    expect(sunRes.isTrainingDay).toBe(false);
    expect(sunRes.isRestDay).toBe(true);
  });

  it("handles pending sessions crossing week/cycle boundaries seamlessly", () => {
    let state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body", // 3-day (Mon, Wed, Fri)
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 2, // at Day 3
      completedDays: ["2026-10-12", "2026-10-14"],
      scheduleDays: [0, 2, 4],
      schedulingModel: "fixed_weekday",
    };

    // Friday 2026-10-16 (Week 1 Day 3) missed
    // User opens app on next week Monday 2026-10-19:
    state = planRescheduledSessions(
      detectMissedSessions(state, new Date(2026, 9, 19, 10)),
      new Date(2026, 9, 19, 10)
    );

    expect(state.rescheduledSessions).toHaveLength(1);
    const session = state.rescheduledSessions![0];
    expect(session.sourceWeek).toBe(1);
    expect(session.dayIndex).toBe(2);
    expect(session.targetDateKey).toBe("2026-10-19"); // Scheduled for Monday of Week 2

    // Monday recommends Week 1 Day 3 make-up
    const monRes = resolveProgramDayForDate(state, new Date(2026, 9, 19, 12));
    expect(monRes.isTrainingDay).toBe(true);
    expect(monRes.isRescheduledMakeUp).toBe(true);
    expect(monRes.scheduledDayIndex).toBe(2);

    // Complete Week 1 Day 3 on Monday
    state = advanceJeffProgramAfterFinish(state, "2026-10-19", 2);
    // Program progression rolls over cleanly to Week 2 Day 1 (index 0)
    expect(state.currentWeek).toBe(2);
    expect(state.currentDayIndex).toBe(0);

    // Wednesday of Week 2 (2026-10-21) recommends Week 2 Day 1
    const wedRes = resolveProgramDayForDate(state, new Date(2026, 9, 21, 12));
    expect(wedRes.isTrainingDay).toBe(true);
    expect(wedRes.isRescheduledMakeUp).toBe(false);
    expect(wedRes.scheduledDayIndex).toBe(0);
  });
});

describe("Universal Workout Scheduling Engine — Persistence, Invariants & Edge Cases", () => {
  it("maintains strict consistency after JSON serialization and reload", () => {
    const originalState: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 2,
      currentDayIndex: 1,
      completedDays: ["2026-10-12", "2026-10-14", "2026-10-16", "2026-10-19"],
      scheduleDays: [0, 2, 4],
      schedulingModel: "fixed_weekday",
      missedSessionPolicy: "shift_sequence",
      rescheduledSessions: [
        {
          id: "missed_2026-10-16_d2",
          originalDateKey: "2026-10-16",
          targetDateKey: "2026-10-19",
          sourceWeek: 1,
          dayIndex: 2,
          dayLabel: "Day 3",
          focusLabel: "Full Body C",
          status: "completed",
          resolvedAt: "2026-10-19",
        },
      ],
    };

    const serialized = JSON.stringify(originalState);
    const reloadedState: ActiveJeffProgramState = JSON.parse(serialized);

    const date = new Date(2026, 9, 21, 12);
    const resOriginal = resolveProgramDayForDate(originalState, date);
    const resReloaded = resolveProgramDayForDate(reloadedState, date);

    expect(resReloaded).toEqual(resOriginal);
    expect(resReloaded.isTrainingDay).toBe(true);
    expect(resReloaded.scheduledDayIndex).toBe(1);
  });

  it("handles invalid or empty configurations gracefully without crashing", () => {
    const corruptedState: ActiveJeffProgramState = {
      programId: "non_existent_program_xyz",
      startDate: "invalid-date",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [],
    };

    // Must not throw exception
    expect(() => resolveProgramDayForDate(corruptedState, new Date())).not.toThrow();
    expect(() => detectMissedSessions(corruptedState, new Date())).not.toThrow();
    expect(() => planRescheduledSessions(corruptedState, new Date())).not.toThrow();
    expect(() => advanceJeffProgramAfterFinish(corruptedState, "2026-10-20")).not.toThrow();
    expect(() => isJeffProgramComplete(corruptedState)).not.toThrow();

    const dates = getProgramScheduledDates("invalid", [], 4);
    expect(dates).toEqual([]);
  });

  it("preserves workout history: finishing a workout never modifies underlying program definition", () => {
    const originalProgram = findProgramById("fundamentals_full_body");
    const originalWeek1DayCount = originalProgram?.weeks[0].days.length;

    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };

    const advancedState = advanceJeffProgramAfterFinish(state, "2026-10-12", 0);
    expect(advancedState.completedDays).toEqual(["2026-10-12"]);

    const afterProgram = findProgramById("fundamentals_full_body");
    expect(afterProgram?.weeks[0].days.length).toBe(originalWeek1DayCount);
  });

  it("completion idempotency: finishing the exact same session date twice does not double count volume or days", () => {
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };

    const step1 = advanceJeffProgramAfterFinish(state, "2026-10-12", 0);
    expect(step1.completedDays).toHaveLength(1);

    // Call finish again for the exact same date
    const step2 = advanceJeffProgramAfterFinish(step1, "2026-10-12", 0);
    expect(step2.completedDays).toHaveLength(1);
    expect(step2.currentDayIndex).toBe(step1.currentDayIndex);
    expect(step2.currentWeek).toBe(step1.currentWeek);
  });
});
