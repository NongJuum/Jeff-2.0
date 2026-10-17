import { describe, it, expect } from "vitest";
import { JEFF_PROGRAMS, findProgramById } from "../lib/jeffPrograms";

describe("Program Activation & Muscle Summary Crash Prevention", () => {
  it("all Jeff Nippard programs have valid structure and can be inspected without throwing", () => {
    expect(JEFF_PROGRAMS.length).toBeGreaterThan(0);
    for (const prog of JEFF_PROGRAMS) {
      expect(prog.id).toBeTruthy();
      expect(prog.weeks.length).toBeGreaterThan(0);
      for (const week of prog.weeks) {
        expect(week.days.length).toBeGreaterThan(0);
        for (const day of week.days) {
          expect(day.exercises.length).toBeGreaterThan(0);
          for (const ex of day.exercises) {
            expect(ex.name).toBeTruthy();
            expect(ex.sets).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("findProgramById locates existing programs", () => {
    const prog = findProgramById("fundamentals_hypertrophy") || findProgramById(JEFF_PROGRAMS[0].id);
    expect(prog).toBeDefined();
  });
});
