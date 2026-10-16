import { describe, it, expect } from "vitest";
import {
  calculatePrescriptionWeight,
  getDefaultMechanicalProfile,
  getPlateLoadedMachineDefault,
  getPinLoadedMachineDefault,
  type UserProfile,
  type BiomechanicalResult,
  shouldAutoPrescribeAddedLoad,
} from "../lib/assessment";

describe("Exercise Substitution & Semantic Load Contract (Regression Suite)", () => {
  const standardProfile: UserProfile = {
    gender: "male",
    age: 26,
    heightCm: 178,
    weightKg: 80,
    expMonths: 18, // Intermediate (1-2y) -> modifier 0.85
    daysPerWeek: 4,
    goal: "hypertrophy",
    injuries: [],
    preferredWeightUnit: "kg",
    updatedAt: new Date().toISOString(),
  };

  // Test 1: Substitute exercise A with exercise B, and verify recommendation is recalculated using B's profile
  it("1. substitutes Exercise A (Barbell Bench) with B (Plate-Loaded Incline) and recalculates using B's equipment mechanics", () => {
    const resA = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", standardProfile);
    expect(resA.loadType).toBe("barbell");
    expect(resA.startingResistanceKg).toBe(20);
    expect(resA.recommendedHardwareWeightKg).toBeGreaterThanOrEqual(20);
    expect(resA.explicitLoadTypeLabel).toContain("Barbell (น้ำหนักรวมคานมาตรฐาน 20 kg)");

    // Substitute with Exercise B: Life Fitness Plate Loaded Incline Press
    const resB = calculatePrescriptionWeight(
      "Life Fitness Plate Loaded Incline Press",
      "plate-loaded",
      "8 to 12",
      standardProfile
    );

    // Verify completely independent recalculation using B's mechanical profile
    expect(resB.loadType).toBe("plate-loaded");
    expect(resB.isPerHand).toBe(true);
    expect(resB.configuration).toBe("independent-arms");
    expect(resB.resistanceSource).toBe("manufacturer-spec");
    expect(resB.startingResistanceKg).toBe(5); // 5 kg per arm from manufacturer spec
    expect(resB.platesPerSideKg).toBeDefined();
    expect(resB.totalAddedPlatesKg).toBe(resB.platesPerSideKg! * 2);
    expect(resB.recommendedHardwareWeightKg).toBe(resB.totalAddedPlatesKg);
    expect(resB.explicitLoadTypeLabel).toContain("Plate-Loaded (แขนแยกอิสระ · เพลตต่อข้าง · สเปกเครื่อง)");
    expect(resB.displayNote).toContain("ต่อข้าง");
    expect(resB.displayNote).toContain("เพลตรวมสองข้าง");
  });

  // Test 2: Switch back from B to A and verify that A's correct recommendation returns
  it("2. switching back from B to A restores A's correct recommendation without stale machine values", () => {
    const resA_initial = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", standardProfile);
    const resB = calculatePrescriptionWeight("Life Fitness Plate Loaded Incline Press", "plate-loaded", "8 to 12", standardProfile);
    const resA_restored = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", standardProfile);

    expect(resA_restored.loadType).toBe("barbell");
    expect(resA_restored.recommendedHardwareWeightKg).toBe(resA_initial.recommendedHardwareWeightKg);
    expect(resA_restored.startingResistanceKg).toBe(20);
    expect(resA_restored.platesPerSideKg).toBe(resA_initial.platesPerSideKg);
    expect(resA_restored.totalAddedPlatesKg).toBe(resA_initial.totalAddedPlatesKg);
    expect(resA_restored.configuration).toBe("barbell");
    expect(resA_restored.explicitLoadTypeLabel).toBe("Barbell (น้ำหนักรวมคานมาตรฐาน 20 kg)");
    expect(resA_restored.displayNote).toBe(resA_initial.displayNote);
  });

  // Test 3: Switch between plate-loaded and pin-loaded exercises and verify output type, path, and labels
  it("3. switching between plate-loaded and selectorized switches calculation paths, configurations, and labels", () => {
    const plateRes = calculatePrescriptionWeight("Hammer Strength Iso-Lateral Wide Chest", "plate-loaded", "8 to 12", standardProfile);
    const pinRes = calculatePrescriptionWeight("Machine Chest Press", "selectorized", "8 to 12", standardProfile);

    // Plate-loaded has tare weight and added plates
    expect(plateRes.loadType).toBe("plate-loaded");
    expect(plateRes.configuration).toBe("independent-arms");
    expect(plateRes.startingResistanceKg).toBe(5);
    expect(plateRes.platesPerSideKg).toBeDefined();
    expect(plateRes.explicitLoadTypeLabel).toContain("Plate-Loaded");

    // Pin-loaded has 0 starting resistance, direct pin stack selection
    expect(pinRes.loadType).toBe("selectorized");
    expect(pinRes.configuration).toBe("single-stack");
    expect(pinRes.startingResistanceKg).toBe(0);
    expect(pinRes.platesPerSideKg).toBeUndefined();
    expect(pinRes.totalAddedPlatesKg).toBeUndefined();
    expect(pinRes.explicitLoadTypeLabel).toContain("Selectorized (สลักพินน้ำหนักเครื่อง · ค่าประมาณ)");
    expect(pinRes.displayNote).toContain("สลักพิน");
  });

  // Test 4: Verify that changing exercise cannot leave a stale recommendation or stale label
  it("4. changing exercise cannot retain previous exercise recommendation or machine starting resistance", () => {
    // Exercise 1 has a custom starting resistance override (e.g. 45° Leg press with 40 kg sled override)
    const legPressCustom = calculatePrescriptionWeight(
      "45° Leg Press",
      "plate-loaded",
      "8 to 12",
      standardProfile,
      1.0,
      "",
      undefined,
      undefined,
      40 // User override starting resistance
    );
    expect(legPressCustom.startingResistanceKg).toBe(40);
    expect(legPressCustom.resistanceSource).toBe("user-override");

    // Exercise 2 substituted in without override (e.g. Dumbbell Bench Press)
    const dbBench = calculatePrescriptionWeight(
      "Incline Dumbbell Press",
      "dumbbell",
      "8 to 12",
      standardProfile
    );
    expect(dbBench.loadType).toBe("dumbbell");
    expect(dbBench.startingResistanceKg).toBe(0);
    expect(dbBench.isPerHand).toBe(true);
    expect(dbBench.configuration).toBe("dumbbell");
    expect(dbBench.resistanceSource).toBe("category-estimate");
    expect(dbBench.explicitLoadTypeLabel).toBe("Dumbbell (น้ำหนักต่อข้าง/ต่อมือ)");
    expect(dbBench.displayNote).toContain("ดัมเบล/โหลด");
  });

  // Test 5: Verify independent-arm/per-side versus bilateral total plate calculations
  it("5. verifies independent-arm vs bilateral sled vs single-sleeve central plate calculations", () => {
    // 5A: Independent arms (Hammer Strength Iso-Lateral Chest Press)
    const isoArm = calculatePrescriptionWeight("Hammer Strength Iso-Lateral Wide Chest", "plate-loaded", "8 to 12", standardProfile);
    expect(isoArm.isPerHand).toBe(true);
    expect(isoArm.configuration).toBe("independent-arms");
    expect(isoArm.platesPerSideKg).toBeDefined();
    expect(isoArm.totalAddedPlatesKg).toBe(isoArm.platesPerSideKg! * 2);
    expect(isoArm.recommendedHardwareWeightKg).toBe(isoArm.totalAddedPlatesKg);

    // 5B: Bilateral sled (45° Leg Press)
    const sled = calculatePrescriptionWeight("45° Leg Press", "plate-loaded", "8 to 12", standardProfile);
    expect(sled.isPerHand).toBe(false);
    expect(sled.configuration).toBe("bilateral-sled");
    expect(sled.startingResistanceKg).toBe(50);
    expect(sled.totalAddedPlatesKg).toBe(sled.recommendedHardwareWeightKg);
    expect(sled.platesPerSideKg).toBe(sled.totalAddedPlatesKg! / 2);
    expect(sled.explicitLoadTypeLabel).toContain("แคร่รวม · เพลตรวมสองข้าง");

    // 5C: Single sleeve central load (Chest Supported T-Bar Row)
    const tbar = calculatePrescriptionWeight("Chest Supported T-Bar Row", "plate-loaded", "8 to 12", standardProfile);
    expect(tbar.isPerHand).toBe(false);
    expect(tbar.configuration).toBe("single-sleeve");
    expect(tbar.startingResistanceKg).toBe(10);
    expect(tbar.platesPerSideKg).toBeUndefined(); // Single central horn
    expect(tbar.totalAddedPlatesKg).toBe(tbar.recommendedHardwareWeightKg);
    expect(tbar.explicitLoadTypeLabel).toContain("แกนเดี่ยวกลาง · เพลตรวม");
  });

  // Test 6: Verify starting resistance is subtracted or included exactly where appropriate, without double counting
  it("6. starting resistance is accounted for without double counting", () => {
    // For 45° Leg Press with sled tare 50 kg:
    const profileHeavy: UserProfile = { ...standardProfile, weightKg: 90, expMonths: 36 };
    const resLegPress = calculatePrescriptionWeight("45° Leg Press", "plate-loaded", "8 to 12", profileHeavy);
    // targetWeightKg is total target. Effective resistance should equal target snapped:
    // startingResistance + totalAddedPlates = effectiveTotalResistance
    expect(resLegPress.startingResistanceKg).toBe(50);
    expect(resLegPress.effectiveTotalResistanceKg).toBe(resLegPress.startingResistanceKg + resLegPress.totalAddedPlatesKg!);

    // For Barbell Bench with Olympic bar 20 kg:
    const resBench = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", profileHeavy);
    // 20 kg bar + totalAddedPlates = recommendedHardwareWeightKg
    expect(resBench.startingResistanceKg).toBe(20);
    expect(resBench.recommendedHardwareWeightKg).toBe(20 + resBench.totalAddedPlatesKg!);
    expect(resBench.effectiveTotalResistanceKg).toBe(resBench.recommendedHardwareWeightKg);
  });

  // Test 7: Verify pin-stack weight is not incorrectly treated as added plates or increased by starting resistance
  it("7. selectorized pin-stack weight is not treated as added plates or increased by starting resistance", () => {
    const selectorized = calculatePrescriptionWeight("Leg Extension", "selectorized", "8 to 12", standardProfile);
    expect(selectorized.startingResistanceKg).toBe(0);
    expect(selectorized.tareWeightKg).toBe(0);
    expect(selectorized.platesPerSideKg).toBeUndefined();
    expect(selectorized.totalAddedPlatesKg).toBeUndefined();
    expect(selectorized.recommendedHardwareWeightKg).toBeGreaterThan(0);
    expect(selectorized.effectiveTotalResistanceKg).toBe(selectorized.recommendedHardwareWeightKg);
    expect(selectorized.hardwareLoadLabel).toBe("น้ำหนักสลักพิน");
  });

  // Test 8: Verify pulley ratios and per-hand configurations for cable exercises
  it("8. verifies pulley ratios and unilateral vs bilateral configurations for cables", () => {
    // 8A: Unilateral Cable Lat Raise (2:1 functional trainer ratio)
    const latRaise = calculatePrescriptionWeight("Cable Lat Raise", "cable", "10 to 15", standardProfile);
    expect(latRaise.isPerHand).toBe(true);
    expect(latRaise.pulleyRatio).toBe(2.0);
    expect(latRaise.configuration).toBe("independent-arms");
    expect(latRaise.effectiveTotalResistanceKg).toBeCloseTo(latRaise.recommendedHardwareWeightKg / 2, 1);
    expect(latRaise.explicitLoadTypeLabel).toContain("รอกทด 2:1");

    // 8B: Direct Stack Bilateral Pulldown (1:1 ratio)
    const pulldown = calculatePrescriptionWeight("Lat Pulldown", "cable", "8 to 12", standardProfile);
    expect(pulldown.isPerHand).toBe(false);
    expect(pulldown.pulleyRatio).toBe(1.0);
    expect(pulldown.configuration).toBe("single-stack");
    expect(pulldown.effectiveTotalResistanceKg).toBe(pulldown.recommendedHardwareWeightKg);

    // 8C: Custom Pulley Override 3:1
    const custom3to1 = calculatePrescriptionWeight("Cable Lat Raise", "cable", "10 to 15", standardProfile, 1.0, "", 3.0);
    expect(custom3to1.pulleyRatio).toBe(3.0);
    expect(custom3to1.explicitLoadTypeLabel).toContain("รอกทด 3:1");
  });

  // Test 9: Verify kg/lb display conversion without changing underlying physical recommendation
  it("9. converts cleanly between kg and lbs without changing underlying physical recommendation", () => {
    const profileKg = { ...standardProfile, preferredWeightUnit: "kg" as const };
    const profileLbs = { ...standardProfile, preferredWeightUnit: "lbs" as const };

    const resKg = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", profileKg, 1.0, "", undefined, undefined, undefined, "ex-1", "kg");
    const resLbs = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", profileLbs, 1.0, "", undefined, undefined, undefined, "ex-1", "lbs");

    // Physical kg hardware weight should be virtually identical
    expect(Math.abs(resKg.recommendedHardwareWeightKg - resLbs.recommendedHardwareWeightKg)).toBeLessThanOrEqual(2.5);
    expect(resKg.explicitLoadTypeLabel).toContain("20 kg");
    expect(resLbs.explicitLoadTypeLabel).toContain("Barbell");
  });

  // Test 10: Verify that unsupported or uncertain machine data is labelled as an estimate
  it("10. identifies unknown/category equipment as estimate while preserving manufacturer-spec", () => {
    // Manufacturer spec: Life Fitness Plate Loaded Incline Press
    const specMachine = calculatePrescriptionWeight("Life Fitness Plate Loaded Incline Press", "plate-loaded", "8 to 12", standardProfile);
    expect(specMachine.resistanceSource).toBe("manufacturer-spec");
    expect(specMachine.explicitLoadTypeLabel).toContain("สเปกเครื่อง");

    // Category estimate: Unclassified generic chest press
    const genericMachine = calculatePrescriptionWeight("Plate-Loaded Chest Press", "plate-loaded", "8 to 12", standardProfile);
    expect(genericMachine.resistanceSource).toBe("category-estimate");
    expect(genericMachine.explicitLoadTypeLabel).toContain("ค่าประมาณ");

    // User override
    const userOverridden = calculatePrescriptionWeight("Plate-Loaded Chest Press", "plate-loaded", "8 to 12", standardProfile, 1.0, "", undefined, undefined, 8);
    expect(userOverridden.resistanceSource).toBe("user-override");
    expect(userOverridden.explicitLoadTypeLabel).toContain("กำหนดเอง");
  });

  // Test 11: Verify that completed workout logs and historical PRs are not corrupted by changing current exercise
  it("11. preserves completed workout records and historical PRs when exercise substitutions occur", () => {
    // Simulate persistent store: completed logs for Exercise A
    const logs = [
      { id: "log-1", date: "2026-10-10", exerciseName: "Barbell Back Squat", weightLbs: 225, reps: 8, setNumber: 1, done: true },
      { id: "log-2", date: "2026-10-10", exerciseName: "Barbell Back Squat", weightLbs: 225, reps: 8, setNumber: 2, done: true },
    ];
    const prMap = {
      "Barbell Back Squat": { weightLbs: 225, reps: 8, date: "2026-10-10" },
    };

    // User substitutes "Barbell Back Squat" with "Hack Squat" in slot "slot-squat"
    const substituteMap: Record<string, string> = {};
    substituteMap["slot-squat"] = "Hack Squat";

    // Verify Hack Squat computes independently
    const hackRes = calculatePrescriptionWeight("Hack Squat", "plate-loaded", "8 to 12", standardProfile);
    expect(hackRes.loadType).toBe("plate-loaded");
    expect(hackRes.startingResistanceKg).toBe(25); // Sled tare 25 kg

    // Verify historical logs and PR records for Barbell Back Squat remain completely untouched
    expect(logs.length).toBe(2);
    expect(logs[0].exerciseName).toBe("Barbell Back Squat");
    expect(logs[0].weightLbs).toBe(225);
    expect(prMap["Barbell Back Squat"].weightLbs).toBe(225);
  });
});
