import { describe, it, expect } from "vitest";
import {
  calculatePrescriptionWeight,
  quantizeToHardware,
  getDefaultMechanicalProfile,
  type UserProfile,
  getExerciseStrengthCategory,
  getIntelligentWarmup,
  STANDARD_EQUIPMENT_DEFAULTS,
} from "../lib/assessment";

describe("Biomechanical Engine & Hardware Quantization", () => {
  // Case 1: M 70kg Novice Barbell Bench -> added plates 0kg, total bar 20kg ("คานเปล่า 20 kg")
  it("Case 1: M 70kg Novice Barbell Bench -> คานเปล่า 20 kg (added plates 0kg)", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 25,
      heightCm: 175,
      weightKg: 70,
      expMonths: 3, // Novice (<6m) -> modifier 0.45
      daysPerWeek: 3,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const res = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", profile);
    expect(res.tareWeightKg).toBe(20);
    expect(res.platesPerSideKg).toBe(0);
    expect(res.hardwareWeightKg).toBe(20);
    expect(res.displayNote).toContain("คานเปล่า 20 kg");
  });

  // Case 2: M 70kg Novice DB Bench -> 10 kg per hand
  it("Case 2: M 70kg Novice DB Bench -> 10 kg per hand", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 25,
      heightCm: 175,
      weightKg: 70,
      expMonths: 3, // Novice (<6m) -> modifier 0.45
      daysPerWeek: 3,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const res = calculatePrescriptionWeight("Flat DB Press", "dumbbell", "6 to 10", profile);
    expect(res.isPerHand).toBe(true);
    expect(res.hardwareWeightKg).toBe(7.5);
    expect(res.hardwareWeightKg).toBeLessThanOrEqual(res.targetWeightKg);
    expect(res.displayNote).toContain("7.5 kg");
  });

  // Case 3: M 70kg Inter Cable Lat Raise (2:1) -> conservatively snapped down to 5 kg pin per side
  it("Case 3: M 70kg Inter Cable Lat Raise (2:1) -> 7.5 kg pin per side", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 26,
      heightCm: 175,
      weightKg: 70,
      expMonths: 18, // Intermediate (1-2y) -> modifier 0.85
      daysPerWeek: 4,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const res = calculatePrescriptionWeight("Cable Lat Raise", "cable", "6 to 10", profile);
    expect(res.hardwareWeightKg).toBe(5);
    expect(res.displayNote).toContain("5 kg");
    expect(res.displayNote).toContain("สลักพิน");
    expect(res.displayNote).toContain("ต่อฝั่ง");
  });

  // Case 4: M 70kg beginner (8m) 45° Leg Press -> standardized external plate-load estimate
  it("Case 4: M 70kg beginner 45° Leg Press uses standardized external load without an angle multiplier", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 26,
      heightCm: 175,
      weightKg: 70,
      expMonths: 8, // Intermediate (6-12m) -> modifier 0.65, safety factor 0.92
      daysPerWeek: 4,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const res = calculatePrescriptionWeight("45° Leg Press", "plate-loaded", "8 to 12", profile);
    expect(res.hardwareWeightKg).toBe(55);
    expect(res.displayNote).toContain("55 kg");
  });

  // Case 5: F 60kg Novice DB Lat Raise -> hits 2.0-2.5 kg floor
  it("Case 5: F 60kg Novice DB Lat Raise -> hits 2.0-2.5 kg floor", () => {
    const profile: UserProfile = {
      gender: "female",
      age: 24,
      heightCm: 160,
      weightKg: 60,
      expMonths: 2, // Novice (<6m) -> modifier 0.45
      daysPerWeek: 3,
      goal: "fitness",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const res = calculatePrescriptionWeight("DB Lateral Raise", "dumbbell", "12 to 20", profile);
    expect(res.hardwareWeightKg).toBeGreaterThanOrEqual(2.0);
    expect(res.hardwareWeightKg).toBeLessThanOrEqual(2.5);
    expect(res.displayNote).toMatch(/2(\.0|\.5)? kg/);
  });

  it("Case 6: Dynamic recalculation when switching machine variants (Barbell -> Smith -> Cable)", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 28,
      heightCm: 180,
      weightKg: 80,
      expMonths: 24, // Advanced modifier 1.0
      daysPerWeek: 4,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const barbellRes = calculatePrescriptionWeight("Bench Press", "barbell", "6 to 10", profile);
    const smithRes = calculatePrescriptionWeight("Bench Press", "smith", "6 to 10", profile);
    const cableRes = calculatePrescriptionWeight("Bench Press", "cable", "6 to 10", profile);

    // Barbell tare is 20kg, Smith tare is 11kg, Cable tare is 0kg
    expect(barbellRes.tareWeightKg).toBe(20);
    expect(smithRes.tareWeightKg).toBe(11);
    expect(cableRes.tareWeightKg).toBe(0);

    // Ensure weights differ and do not blindly carry over incompatible values
    expect(barbellRes.hardwareWeightKg).not.toBe(cableRes.hardwareWeightKg);
  });

  it("supports explicit single-arm cable variants with per-side pin loads", () => {
    const mech = getDefaultMechanicalProfile("cable", "Cable Curl (Single-Arm)");
    expect(mech.isPerHand).toBe(true);
    expect(mech.pulleyRatio).toBe(2);
    expect(getExerciseStrengthCategory("Cable Curl (Single-Arm)")).toBe("Bicep");
  });

  it("supports explicit dual-arm cable variants as two independent stacks", () => {
    const mech = getDefaultMechanicalProfile("cable", "Cable Curl (Dual-Arm, Two Stacks)");
    expect(mech.isPerHand).toBe(true);
    expect(mech.pulleyRatio).toBe(2);
    expect(getExerciseStrengthCategory("Cable Curl (Dual-Arm, Two Stacks)")).toBe("Bicep");
  });

  it("applies explicit execution profiles before crossover-name heuristics", () => {
    const single = getDefaultMechanicalProfile("cable", "Reverse Cable Crossover (Single-Arm)");
    const dual = getDefaultMechanicalProfile("cable", "Reverse Cable Crossover (Dual-Arm, Two Stacks)");
    expect(single.isPerHand).toBe(true);
    expect(single.pulleyRatio).toBe(2);
    expect(dual.isPerHand).toBe(true);
    expect(dual.pulleyRatio).toBe(2);
  });

  it("calculates cable pin weight with proper pulley advantage physics (2:1 requires 2x pin weight of 1:1)", () => {
    const profile: UserProfile = {
      gender: "male", age: 26, heightCm: 175, weightKg: 70, expMonths: 24,
      daysPerWeek: 4, goal: "hypertrophy", injuries: [], preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };
    const direct1to1 = calculatePrescriptionWeight("Cable Curl (Single-Arm)", "cable", "8 to 12", profile, 1, "", 1);
    const standard2to1 = calculatePrescriptionWeight("Cable Curl (Single-Arm)", "cable", "8 to 12", profile, 1, "", 2);
    const highAdvantage3to1 = calculatePrescriptionWeight("Cable Curl (Single-Arm)", "cable", "8 to 12", profile, 1, "", 3);

    // Mechanical physics: On a 2:1 pulley, each kg at the pin produces 0.5 kg of force at the handle.
    // Therefore, to produce the required force F, pin weight must be 2 * F.
    // On a 1:1 direct pulley, pin weight is 1 * F.
    expect(standard2to1.targetWeightKg).toBeCloseTo(direct1to1.targetWeightKg * 2, 0);
    expect(highAdvantage3to1.targetWeightKg).toBeCloseTo(direct1to1.targetWeightKg * 3, 0);
    expect(standard2to1.displayNote).toContain("2:1");
    expect(direct1to1.displayNote).toContain("1:1");
    expect(highAdvantage3to1.displayNote).toContain("3:1");
  });

  it("applies safety factor separated from muscle mass modifier", () => {
    const noviceProfile: UserProfile = {
      gender: "male", age: 26, heightCm: 175, weightKg: 70, expMonths: 3,
      daysPerWeek: 4, goal: "hypertrophy", injuries: ["lowerBack"], preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };
    const advancedProfile: UserProfile = {
      gender: "male", age: 26, heightCm: 175, weightKg: 70, expMonths: 30,
      daysPerWeek: 4, goal: "hypertrophy", injuries: [], preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    // Novice with back injury on deadlift should receive significant safety discount
    const noviceDeadlift = calculatePrescriptionWeight("Deadlift", "barbell", "5 to 8", noviceProfile, 1.0);
    const advancedDeadlift = calculatePrescriptionWeight("Deadlift", "barbell", "5 to 8", advancedProfile, 1.0);

    expect(noviceDeadlift.targetWeightKg).toBeLessThan(advancedDeadlift.targetWeightKg);
    expect(noviceDeadlift.displayNote).toContain("คาน");
  });
});



describe("Safety factor covers machine-specific exercise categories", () => {
  it("applies the back-injury reduction to chest-supported and cable row categories", async () => {
    const { getSafetyFactor } = await import("../lib/assessment");
    expect(getSafetyFactor(30, ["lowerBack"], "ChestSupportedRow").safetyFactor).toBe(0.88);
    expect(getSafetyFactor(30, ["lowerBack"], "SeatedCableRow").safetyFactor).toBe(0.88);
  });

  it("applies the shoulder-injury reduction to machine incline press", async () => {
    const { getSafetyFactor } = await import("../lib/assessment");
    expect(getSafetyFactor(30, ["shoulder"], "InclineMachinePress").safetyFactor).toBe(0.88);
  });

  it("applies the wrist-injury reduction to triceps work", async () => {
    const { getSafetyFactor } = await import("../lib/assessment");
    expect(getSafetyFactor(30, ["wrist"], "Tricep").safetyFactor).toBe(0.92);
  });


  it("applies back and shoulder reductions to additional relevant categories", async () => {
    const { getSafetyFactor } = await import("../lib/assessment");
    expect(getSafetyFactor(30, ["lowerBack"], "HipThrust").safetyFactor).toBe(0.88);
    expect(getSafetyFactor(30, ["lowerBack"], "LegPress").safetyFactor).toBe(0.88);
    expect(getSafetyFactor(30, ["shoulder"], "LatPull").safetyFactor).toBe(0.88);
  });

  it("does not apply injury adjustments to unrelated categories", async () => {
    const { getSafetyFactor } = await import("../lib/assessment");
    expect(getSafetyFactor(30, ["lowerBack"], "Bicep").safetyFactor).toBe(1.0);
  });
});


describe("Hardware quantization safety and unit invariants", () => {
  const profile = {
    leverageRatio: 1, camModifier: 1, pulleyRatio: 1, frictionCoeff: 0,
    angleThetaDeg: 0, isPerHand: false, bilateralDeficit: false,
    minHardwareStep: 2.5, tareWeight: 0,
  };

  it("rounds machine loads down rather than up when a suitable increment exists", () => {
    const result = quantizeToHardware(9.9, profile, false, false, "kg");
    expect(result.hardwareWeightKg).toBe(7.5);
    expect(result.hardwareExceedsTarget).toBe(false);
  });

  it("warns when the minimum available load exceeds the target", () => {
    const result = quantizeToHardware(1.2, profile, true, false, "kg");
    expect(result.hardwareWeightKg).toBe(2.5);
    expect(result.hardwareExceedsTarget).toBe(true);
    expect(result.displayNote).toContain("ห้ามฝืน");
  });

  it("keeps per-side plate mass in kg even when display unit is lbs", () => {
    const bar = { ...profile, tareWeight: 20, minHardwareStep: 1.25 };
    const result = quantizeToHardware(60, bar, false, false, "lbs");
    expect(result.platesPerSideKg).toBeCloseTo(42.5 * 0.45359237, 2);
    expect(result.displayNote).toContain("lbs");
  });

  it("warns when an empty bar exceeds the calculated target", () => {
    const bar = { ...profile, tareWeight: 20 };
    const result = quantizeToHardware(14, bar, false, false, "kg");
    expect(result.hardwareWeightKg).toBe(20);
    expect(result.hardwareExceedsTarget).toBe(true);
    expect(result.displayNote).toContain("เลือกอุปกรณ์/โหลดที่เบากว่า");
  });
});


describe("Warmup recommendations stay within feasible loads", () => {
  const exercise = { id: "1", name: "Bench Press", group: "Chest", movement: "compound", muscles: ["chest"], warmup: true, load: "barbell" };

  it("does not prescribe a barbell warmup lighter than the bar itself", () => {
    const result = getIntelligentWarmup(exercise, 0, [exercise], 15, "kg", "barbell");
    expect(result.type).toBe("skip");
    expect(result.note).toContain("คานเปล่าหนักกว่า");
    expect(result.steps).toHaveLength(0);
  });

  it("never rounds warmup loads above the working load", () => {
    const result = getIntelligentWarmup(exercise, 0, [exercise], 30, "kg", "barbell");
    expect(result.steps.every((step) => step.weight <= 30)).toBe(true);
    expect(result.steps.every((step) => step.weight >= 20)).toBe(true);
  });

  it("does not invent a lighter warmup load when the stack's minimum equals the work weight", () => {
    const machineExercise = { ...exercise, load: "selectorized" };
    const result = getIntelligentWarmup(machineExercise, 0, [machineExercise], 2.5, "kg", "selectorized");
    expect(result.type).toBe("skip");
    expect(result.steps).toHaveLength(0);
  });
});


describe("Standard commercial equipment midpoint defaults", () => {
  it("uses consistent baseline assumptions for common commercial machines", () => {
    expect(STANDARD_EQUIPMENT_DEFAULTS.olympicBarKg).toBe(20);
    expect(STANDARD_EQUIPMENT_DEFAULTS.smithEffectiveBarKg).toBe(11);
    expect(STANDARD_EQUIPMENT_DEFAULTS.standardStackPulleyRatio).toBe(1);
    expect(STANDARD_EQUIPMENT_DEFAULTS.functionalTrainerPulleyRatio).toBe(2);
    expect(getDefaultMechanicalProfile("plate-loaded", "Hammer Strength Chest Press").leverageRatio).toBe(1);
    expect(getDefaultMechanicalProfile("plate-loaded", "Hammer Strength Chest Press").minHardwareStep).toBe(5);
    expect(getDefaultMechanicalProfile("selectorized", "Life Fitness Chest Press").minHardwareStep).toBe(5);
  });

  it("uses 1:1 for common pulldown stacks and 2:1 for functional-trainer isolation cables", () => {
    const pulldown = getDefaultMechanicalProfile("cable", "Lat Pulldown");
    const curl = getDefaultMechanicalProfile("cable", "Cable Curl");
    expect(pulldown.pulleyRatio).toBe(1);
    expect(curl.pulleyRatio).toBe(2);
  });
});
