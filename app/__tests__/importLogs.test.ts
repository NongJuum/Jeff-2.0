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

  it("parses Thai CSV headers correctly (วันที่, ท่าฝึก, เครื่อง, เซต, น้ำหนัก, หน่วย, จำนวนครั้ง)", () => {
    const thaiCsv = `วันที่,ท่าฝึก,เครื่อง,เซต,น้ำหนัก,หน่วย,จำนวนครั้ง
2026-10-16 09:00:00,Lat Pulldown,Plate-Loaded Wide,1,50,kg,10
2026-10-16 09:02:00,Lat Pulldown,Plate-Loaded Wide,2,55,kg,8`;

    const logs = parseWorkoutCsv(thaiCsv);
    expect(logs).toHaveLength(2);
    expect(logs[0].exerciseName).toBe("Lat Pulldown");
    expect(logs[0].machine).toBe("Plate-Loaded Wide");
    expect(logs[0].setNumber).toBe(1);
    expect(logs[0].rawValue).toBe(50);
    expect(logs[0].unit).toBe("kg");
    expect(logs[0].reps).toBe(10);
  });

  it("parses full JSON backup bundle with metadata for cache clear recovery", async () => {
    const { parseWorkoutJsonWithMetadata } = await import("../components/ImportModal");
    const fullBackup = JSON.stringify({
      version: 2,
      exportDate: "2026-10-17T09:00:00.000Z",
      app: "HA IT Workout Tracker",
      logs: [
        {
          exerciseName: "Bench Press",
          setNumber: 1,
          weightLbs: 220.46,
          reps: 8,
          unit: "kg",
          rawValue: 100,
          date: "2026-10-17T08:30:00.000Z",
        },
      ],
      records: {
        ex_bench_press: {
          weightLbs: 220.46,
          reps: 8,
          date: "2026-10-17T08:30:00.000Z",
          setNumber: 1,
        },
      },
      machineStartingResistances: {
        "smith_bench::Smith Machine 1": 15,
      },
      pulleyRatios: {
        "cable_fly::Cable Cross": "2:1",
      },
      cableMachineConfigs: {
        "lat_pulldown::Dual Lat": {
          ratio: "2:1",
          labelMeaning: "single_cable_tension",
          contributingSides: 2,
          labelScope: "per_side",
        },
      },
      favoriteMachines: {
        chest_press: "Prime Incline",
      },
      userProfile: {
        unit: "kg",
        experience: "advanced",
      },
    });

    const parsed = parseWorkoutJsonWithMetadata(fullBackup);
    expect(parsed.logs).toHaveLength(1);
    expect(parsed.logs[0].exerciseName).toBe("Bench Press");
    expect(parsed.backupData).toBeDefined();
    expect(parsed.backupData?.recordsMap).toHaveProperty("ex_bench_press");
    expect(parsed.backupData?.machineStartingResistances).toEqual({
      "smith_bench::Smith Machine 1": 15,
    });
    expect(parsed.backupData?.pulleyRatios).toEqual({
      "cable_fly::Cable Cross": "2:1",
    });
    expect(parsed.backupData?.cableMachineConfigs).toBeDefined();
    expect(parsed.backupData?.favoriteMachines).toEqual({
      chest_press: "Prime Incline",
    });
    expect(parsed.backupData?.userProfile?.unit).toBe("kg");
  });

  it("parses raw localStorage dump JSON before cache clear", async () => {
    const { parseWorkoutJsonWithMetadata } = await import("../components/ImportModal");
    const rawStorageDump = JSON.stringify({
      trainingLatestV2: JSON.stringify([
        {
          exerciseName: "Squat",
          setNumber: 1,
          weightLbs: 315,
          reps: 5,
          unit: "lbs",
          rawValue: 315,
          date: "2026-10-16",
        },
      ]),
      haitPermanentRecordsV1: JSON.stringify({
        ex_squat: { weightLbs: 315, reps: 5, date: "2026-10-16" },
      }),
      machineStartingResistances: JSON.stringify({
        "leg_press::Hack Squat": 45,
      }),
    });

    const parsed = parseWorkoutJsonWithMetadata(rawStorageDump);
    expect(parsed.logs).toHaveLength(1);
    expect(parsed.logs[0].exerciseName).toBe("Squat");
    expect(parsed.backupData?.recordsMap).toHaveProperty("ex_squat");
    expect(parsed.backupData?.machineStartingResistances).toEqual({
      "leg_press::Hack Squat": 45,
    });
  });
});

