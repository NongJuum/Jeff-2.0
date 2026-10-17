import { describe, it, expect } from "vitest";
import { parseWorkoutCsv, parseWorkoutJson } from "../components/ImportModal";

describe("Workout Data Import Parsers", () => {
  it("parses exported standard HA IT CSV correctly", () => {
    const csvData = `Date,Exercise,Machine,Set,Weight,Unit,Normalized_Weight_Lbs,Reps
2026-10-15 10:30:00,Incline Dumbbell Press,-,1,28,kg,61.73,10
2026-10-15 10:32:00,Incline Dumbbell Press,-,2,30,kg,66.14,8
2026-10-15 10:40:00,Smith Machine Bench,Smith Standard,1,60,kg,132.28,12`;

    const logs = parseWorkoutCsv(csvData);
    expect(logs).toHaveLength(3);

    expect(logs[0].exerciseName).toBe("Incline Dumbbell Press");
    expect(logs[0].machine).toBeUndefined();
    expect(logs[0].setNumber).toBe(1);
    expect(logs[0].rawValue).toBe(28);
    expect(logs[0].unit).toBe("kg");
    expect(logs[0].weightLbs).toBe(61.73);
    expect(logs[0].reps).toBe(10);

    expect(logs[2].exerciseName).toBe("Smith Machine Bench");
    expect(logs[2].machine).toBe("Smith Standard");
    expect(logs[2].setNumber).toBe(1);
    expect(logs[2].reps).toBe(12);
  });

  it("handles CSV without Normalized_Weight_Lbs column by calculating from Weight and Unit", () => {
    const csvData = `Date,Exercise,Set,Weight,Unit,Reps
2026-10-10,Barbell Squat,1,100,kg,5
2026-10-10,Barbell Squat,2,225,lbs,5`;

    const logs = parseWorkoutCsv(csvData);
    expect(logs).toHaveLength(2);

    expect(logs[0].exerciseName).toBe("Barbell Squat");
    expect(logs[0].unit).toBe("kg");
    expect(logs[0].weightLbs).toBeCloseTo(220.46, 1);
    expect(logs[0].rawValue).toBe(100);

    expect(logs[1].exerciseName).toBe("Barbell Squat");
    expect(logs[1].unit).toBe("lbs");
    expect(logs[1].weightLbs).toBe(225);
    expect(logs[1].rawValue).toBe(225);
  });

  it("parses JSON array format correctly", () => {
    const jsonData = JSON.stringify([
      {
        exerciseName: "Cable Lat Raise",
        setNumber: 1,
        weightLbs: 25,
        reps: 15,
        unit: "lbs",
        rawValue: 25,
        date: "2026-10-12T08:00:00.000Z",
      },
      {
        exerciseName: "Cable Lat Raise",
        setNumber: 2,
        weightLbs: 30,
        reps: 12,
        unit: "lbs",
        rawValue: 30,
        date: "2026-10-12T08:02:00.000Z",
      },
    ]);

    const logs = parseWorkoutJson(jsonData);
    expect(logs).toHaveLength(2);
    expect(logs[0].exerciseName).toBe("Cable Lat Raise");
    expect(logs[0].weightLbs).toBe(25);
    expect(logs[1].reps).toBe(12);
  });

  it("parses JSON bundle object with { logs: [...] }", () => {
    const jsonBundle = JSON.stringify({
      version: 2,
      exportDate: "2026-10-16",
      logs: [
        {
          exercise: "Leg Press",
          set: 1,
          weight: 180,
          unit: "kg",
          reps: 12,
        },
      ],
    });

    const logs = parseWorkoutJson(jsonBundle);
    expect(logs).toHaveLength(1);
    expect(logs[0].exerciseName).toBe("Leg Press");
    expect(logs[0].setNumber).toBe(1);
    expect(logs[0].rawValue).toBe(180);
    expect(logs[0].weightLbs).toBeCloseTo(396.83, 1);
  });
});
