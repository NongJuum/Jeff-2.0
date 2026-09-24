// app/__tests__/units.test.ts
import { describe, it, expect } from "vitest";
import {
  convertWeight,
  resolveEffectiveUnit,
  convertAndSnapWeight,
  getSnapStep,
  LBS_PER_KG,
} from "../lib/units";

describe("Stage 1 Units Hierarchy & Normalization", () => {
  it("Hierarchy: Exercise Override > Machine Mapping > Global", () => {
    const globalUnit = "kg";
    const machineMap = { "Pin Stack": "lbs" as const };
    const exerciseMap = { "Lat Pulldown": "kg" as const };

    // 1. When exercise override exists
    expect(resolveEffectiveUnit("Lat Pulldown", "Pin Stack", globalUnit, exerciseMap, machineMap)).toBe("kg");

    // 2. When only machine mapping exists
    expect(resolveEffectiveUnit("Chest Press", "Pin Stack", globalUnit, exerciseMap, machineMap)).toBe("lbs");

    // 3. When neither exists, fallback to global
    expect(resolveEffectiveUnit("Chest Press", "Unknown Machine", globalUnit, exerciseMap, machineMap)).toBe("kg");
  });

  it("Snap steps: kg (compound 2.5, iso 1.25), lbs (compound 5, iso 2.5)", () => {
    expect(getSnapStep("kg", false)).toBe(2.5);
    expect(getSnapStep("kg", true)).toBe(1.25);
    expect(getSnapStep("lbs", false)).toBe(5);
    expect(getSnapStep("lbs", true)).toBe(2.5);
  });

  it("Normalization: Logging 100 kg stores 100 kg UI, normalizes ~220.46 lbs, and beats 220 lbs PR", () => {
    const rawVal = 100; // 100 kg
    const normalizedLbs = convertWeight(rawVal, "kg", "lbs");
    expect(normalizedLbs).toBeCloseTo(220.46, 1);
    expect(normalizedLbs).toBeGreaterThan(220); // beats 220 lbs PR!
  });

  it("Snapping on unit toggle preserves physical increments", () => {
    // 100 lbs converted to kg compound (snapped to 2.5)
    // 100 lbs = 45.36 kg -> snapped to 45 kg
    const kgSnapped = convertAndSnapWeight(100, "lbs", "kg", false);
    expect(kgSnapped).toBe(45);

    // 20 kg converted to lbs compound (snapped to 5)
    // 20 kg = 44.09 lbs -> snapped to 45 lbs
    const lbsSnapped = convertAndSnapWeight(20, "kg", "lbs", false);
    expect(lbsSnapped).toBe(45);
  });
});
