import { describe, it, expect } from "vitest";
import {
  findProgramById,
  resolveProgramDayForDate,
  advanceJeffProgramAfterFinish,
  recommendPrograms,
  type ActiveJeffProgramState,
} from "../lib/jeffPrograms";

describe("Jeff Nippard Calendar Schedule & Program Progression", () => {
  const mockProgram = findProgramById("fundamentals_full_body");

  it("finds program by ID", () => {
    expect(mockProgram).toBeDefined();
    expect(mockProgram?.daysPerWeek).toBe(3);
  });

  it("resolveProgramDayForDate detects training days vs rest days accurately", () => {
    // Schedule: Mon(0), Wed(2), Fri(4)
    const state: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12", // Monday
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };

    // Monday (Oct 12, 2026) -> Day 1 (index 0)
    const mon = new Date("2026-10-12T10:00:00Z");
    const monRes = resolveProgramDayForDate(state, mon);
    expect(monRes.isTrainingDay).toBe(true);
    expect(monRes.scheduledDayIndex).toBe(0);

    // Tuesday (Oct 13, 2026) -> Rest day
    const tue = new Date("2026-10-13T10:00:00Z");
    const tueRes = resolveProgramDayForDate(state, tue);
    expect(tueRes.isTrainingDay).toBe(false);

    // Wednesday (Oct 14, 2026) -> Day 2 (index 1)
    const wed = new Date("2026-10-14T10:00:00Z");
    const wedRes = resolveProgramDayForDate(state, wed);
    expect(wedRes.isTrainingDay).toBe(true);
    expect(wedRes.scheduledDayIndex).toBe(1);

    // Friday (Oct 16, 2026) -> Day 3 (index 2)
    const fri = new Date("2026-10-16T10:00:00Z");
    const friRes = resolveProgramDayForDate(state, fri);
    expect(friRes.isTrainingDay).toBe(true);
    expect(friRes.scheduledDayIndex).toBe(2);
  });

  it("advanceJeffProgramAfterFinish advances day and rolls over week", () => {
    const initialState: ActiveJeffProgramState = {
      programId: "fundamentals_full_body",
      startDate: "2026-10-12",
      currentWeek: 1,
      currentDayIndex: 0,
      completedDays: [],
      scheduleDays: [0, 2, 4],
    };

    // Finish Day 1
    const afterDay1 = advanceJeffProgramAfterFinish(initialState, "2026-10-12");
    expect(afterDay1.completedDays).toContain("2026-10-12");
    expect(afterDay1.currentDayIndex).toBe(1);
    expect(afterDay1.currentWeek).toBe(1);

    // Finish Day 2
    const afterDay2 = advanceJeffProgramAfterFinish(afterDay1, "2026-10-14");
    expect(afterDay2.completedDays).toHaveLength(2);
    expect(afterDay2.currentDayIndex).toBe(2);
    expect(afterDay2.currentWeek).toBe(1);

    // Finish Day 3 (last workout of week) -> Rolls over to Week 2, Day index 0
    const afterDay3 = advanceJeffProgramAfterFinish(afterDay2, "2026-10-16");
    expect(afterDay3.completedDays).toHaveLength(3);
    expect(afterDay3.currentDayIndex).toBe(0);
    expect(afterDay3.currentWeek).toBe(2);
  });

  it("recommendPrograms considers profile injuries and experience", () => {
    const recsWithBackInjury = recommendPrograms("intermediate", "strength", 3, true, {
      injuries: ["lowerBack"],
      expMonths: 12,
    });
    expect(recsWithBackInjury.length).toBeGreaterThan(0);
    // Heavy powerbuilding deadlifts should not be top recommendation when back injured
    expect(recsWithBackInjury[0].program.id).not.toBe("powerbuilding_3_0");
  });
});
