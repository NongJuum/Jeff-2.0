import { describe, it, expect } from "vitest";
import {
  findProgramById,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  recommendPrograms,
  getNextProgramTrainingDate,
  isJeffProgramComplete,
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

