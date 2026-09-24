import { describe, it, expect } from "vitest";
import {
  calculatePrescriptionWeight,
  quantizeToHardware,
  getDefaultMechanicalProfile,
  type UserProfile,
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
    expect(res.hardwareWeightKg).toBe(10);
    expect(res.displayNote).toContain("10 kg");
  });

  // Case 3: M 70kg Inter Cable Lat Raise (2:1) -> 7.5 kg pin per side
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
    expect(res.hardwareWeightKg).toBe(7.5);
    expect(res.displayNote).toContain("7.5 kg");
  });

  // Case 4: M 70kg Inter 45° Leg Press -> 85 kg plates total (no double angle)
  it("Case 4: M 70kg Inter 45° Leg Press -> 85 kg plates total", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 26,
      heightCm: 175,
      weightKg: 70,
      expMonths: 8, // Intermediate (6-12m) -> modifier 0.65
      daysPerWeek: 4,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    const res = calculatePrescriptionWeight("45° Leg Press", "plate-loaded", "8 to 12", profile);
    expect(res.hardwareWeightKg).toBe(85);
    expect(res.displayNote).toContain("85 kg");
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
});

