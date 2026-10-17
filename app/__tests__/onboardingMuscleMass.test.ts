import { describe, it, expect } from "vitest";
import { evaluateMuscleMass, type UserProfile, type MuscleMassMode } from "../lib/assessment";
import { convertInputWeight } from "../lib/units";

describe("Muscle Mass Support & Onboarding Profile", () => {
  it("evaluates muscle mass correctly for male (SMM)", () => {
    // 70 kg weight, 30 kg SMM -> 42.9% -> high threshold for SMM is > 36%
    const res = evaluateMuscleMass("male", 70, 30, "smm");
    expect(res.percentage).toBe(42.9);
    expect(res.rating).toBe("high");
    expect(res.modifier).toBe(1.05);
  });

  it("evaluates muscle mass correctly for female (SMM normal range)", () => {
    // 55 kg weight, 14.5 kg SMM -> 26.4% -> normal is 24-29%
    const res = evaluateMuscleMass("female", 55, 14.5, "smm");
    expect(res.percentage).toBe(26.4);
    expect(res.rating).toBe("normal");
    expect(res.modifier).toBe(1.0);
  });

  it("evaluates total muscle mass mode correctly", () => {
    // 80 kg weight, 35 kg Total muscle -> 43.8% -> normal range for male total is 38-44%
    const res = evaluateMuscleMass("male", 80, 35, "total");
    expect(res.percentage).toBe(43.8);
    expect(res.rating).toBe("normal");
    expect(res.modifier).toBe(1.0);
  });

  it("gracefully handles zero or missing muscle mass", () => {
    const res = evaluateMuscleMass("male", 70, undefined, "smm");
    expect(res.percentage).toBe(0);
    expect(res.rating).toBe("normal");
    expect(res.label).toBe("มาตรฐานทั่วไป");
  });

  it("converts muscle mass accurately between kg and lbs", () => {
    // 30 kg -> lbs
    const lbsStr = convertInputWeight("30", "kg", "lbs");
    expect(Number(lbsStr)).toBeCloseTo(66.1, 1);

    // convert back
    const kgStr = convertInputWeight(lbsStr, "lbs", "kg");
    expect(Number(kgStr)).toBeCloseTo(30, 1);
  });

  it("preserves muscleMassKg and muscleMassMode in UserProfile schema", () => {
    const profile: UserProfile = {
      gender: "male",
      age: 28,
      heightCm: 178,
      weightKg: 75,
      muscleMassKg: 32.5,
      muscleMassMode: "smm",
      expMonths: 18,
      daysPerWeek: 4,
      goal: "hypertrophy",
      injuries: [],
      preferredWeightUnit: "kg",
      updatedAt: new Date().toISOString(),
    };

    expect(profile.muscleMassKg).toBe(32.5);
    expect(profile.muscleMassMode).toBe("smm");
  });
});
