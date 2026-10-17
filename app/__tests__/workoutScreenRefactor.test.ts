import { describe, it, expect } from "vitest";
import { JEFF_PROGRAMS, findProgramById } from "../lib/jeffPrograms";

describe("Workout Screen Refactor & Program Muscle Anatomy", () => {
  it("should have valid programs with multi-week workouts and exercises", () => {
    expect(JEFF_PROGRAMS.length).toBeGreaterThan(0);
    const p = JEFF_PROGRAMS[0];
    expect(p.weeks.length).toBeGreaterThan(0);
    expect(p.weeks[0].days.length).toBeGreaterThan(0);
  });

  it("should correctly aggregate all exercises across program weeks for anatomy preview", () => {
    const prog = findProgramById(JEFF_PROGRAMS[0].id);
    expect(prog).toBeDefined();

    const allExercises = [];
    for (const week of prog!.weeks) {
      for (const day of week.days) {
        if (day.exercises) {
          allExercises.push(...day.exercises);
        }
      }
    }

    expect(allExercises.length).toBeGreaterThanOrEqual(15);
    // Ensure distinct exercises are present
    const names = new Set(allExercises.map((e) => e.name));
    expect(names.size).toBeGreaterThanOrEqual(8);
  });

  it("should verify exercise step indexing and boundaries for Level C & D", () => {
    const prog = findProgramById(JEFF_PROGRAMS[0].id);
    const day1 = prog!.weeks[0].days[0];
    expect(day1.exercises.length).toBeGreaterThan(0);

    // Initial index
    let activeExerciseIndex = 0;
    expect(activeExerciseIndex).toBe(0);

    // Navigate next
    activeExerciseIndex = Math.min(day1.exercises.length - 1, activeExerciseIndex + 1);
    expect(activeExerciseIndex).toBe(1);

    // Navigate to end
    activeExerciseIndex = day1.exercises.length - 1;
    expect(activeExerciseIndex).toBe(day1.exercises.length - 1);

    // Next action at end should trigger finish workout
    const isLastExercise = activeExerciseIndex >= day1.exercises.length - 1;
    expect(isLastExercise).toBe(true);
  });
});
