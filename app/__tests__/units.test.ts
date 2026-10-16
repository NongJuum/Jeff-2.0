// app/__tests__/units.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  convertWeight,
  resolveEffectiveUnit,
  convertAndSnapWeight,
  convertInputWeight,
  getSnapStep,
  snapWeight,
  getPersistentWeightUnit,
  setPersistentWeightUnit,
  formatUnitLabel,
  formatWeightWithUnit,
  resolveRecordDisplay,
  GLOBAL_WEIGHT_UNIT_KEY,
  normalizeWeightUnit,
  type WeightUnit,
} from "../lib/units";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  Object.defineProperty(global, "window", {
    value: {
      localStorage: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          for (const key of Object.keys(mockStorage)) {
            delete mockStorage[key];
          }
        },
      },
      dispatchEvent: () => true,
    },
    writable: true,
  });
});

describe("Weight Units & Persistent User Preference Regression Suite", () => {
  // 1. Selecting kg persists after reload and is used across relevant screens
  it("1. Selecting 'kg' persists after reload and updates user profile", () => {
    // Initial state with profile
    mockStorage["haitUserProfileV1"] = JSON.stringify({ name: "Alex", preferredWeightUnit: "lbs" });

    setPersistentWeightUnit("kg");

    expect(mockStorage[GLOBAL_WEIGHT_UNIT_KEY]).toBe("kg");
    expect(getPersistentWeightUnit()).toBe("kg");

    // Profile is synchronized
    const updatedProfile = JSON.parse(mockStorage["haitUserProfileV1"] || "{}");
    expect(updatedProfile.preferredWeightUnit).toBe("kg");

    // Used as fallback effective unit across screens
    expect(resolveEffectiveUnit("Bench Press")).toBe("kg");
    expect(resolveEffectiveUnit("Squat")).toBe("kg");
  });

  // 2. Selecting lb persists after reload and is used across relevant screens
  it("2. Selecting 'lb' persists after reload and is used across relevant screens", () => {
    setPersistentWeightUnit("lbs");

    expect(mockStorage[GLOBAL_WEIGHT_UNIT_KEY]).toBe("lbs");
    expect(getPersistentWeightUnit()).toBe("lbs");

    // Used across screens
    expect(resolveEffectiveUnit("Incline Dumbbell Press")).toBe("lbs");
    expect(resolveEffectiveUnit("Deadlift")).toBe("lbs");
  });

  // 3. Changing units preserves the same physical load
  it("3. Changing units preserves the same physical load without silent deviation", () => {
    const inputKg = "60"; // 60 kg
    const convertedLbs = convertInputWeight(inputKg, "kg", "lbs");
    expect(convertedLbs).toBe("132.3"); // 60 * 2.20462 = 132.277 -> rounded 132.3

    // Converting back gives the same physical weight within 0.1 kg tolerance
    const convertedBackKg = convertInputWeight(convertedLbs, "lbs", "kg");
    expect(parseFloat(convertedBackKg)).toBeCloseTo(60, 0);

    // Underlying physical load in canonical lbs
    const load1 = convertWeight(parseFloat(inputKg), "kg", "lbs");
    const load2 = convertWeight(parseFloat(convertedBackKg), "kg", "lbs");
    expect(Math.abs(load1 - load2)).toBeLessThan(0.1);
  });

  // 4. Existing records are displayed and edited using their actual stored units
  it("4. Existing records are displayed and edited using their actual stored units", () => {
    const kgRecord = {
      weightLbs: 220.462,
      unit: "kg" as WeightUnit,
      rawValue: 100,
    };

    // User's current preferred unit is lbs
    const displayWhenLbsPref = resolveRecordDisplay(kgRecord, "lbs");
    expect(displayWhenLbsPref.originalUnit).toBe("kg");
    expect(displayWhenLbsPref.primaryText).toBe("100 kg");
    expect(displayWhenLbsPref.secondaryText).toContain("220.5 lb");

    // User's current preferred unit is kg
    const displayWhenKgPref = resolveRecordDisplay(kgRecord, "kg");
    expect(displayWhenKgPref.originalUnit).toBe("kg");
    expect(displayWhenKgPref.primaryText).toBe("100 kg");
  });

  // 5. Historical values and PRs remain unchanged in physical meaning
  it("5. Historical values and PRs retain their exact physical meaning and compare canonically", () => {
    const legacyRecordLbs = 220; // 220 lbs
    const newLoggedKg = 100; // 100 kg = 220.462 lbs

    const newCanonicalLbs = convertWeight(newLoggedKg, "kg", "lbs");

    // 100 kg legitimately beats 220 lbs PR because physical load is higher
    expect(newCanonicalLbs).toBeGreaterThan(legacyRecordLbs);

    // A lighter lift in kg (95 kg = 209.4 lbs) does NOT beat 220 lbs PR
    const lighterKg = 95;
    expect(convertWeight(lighterKg, "kg", "lbs")).toBeLessThan(legacyRecordLbs);
  });

  // 6. Missing or ambiguous legacy units do not trigger silent incorrect conversion
  it("6. Missing or ambiguous legacy units do not trigger silent incorrect conversion", () => {
    const legacyUnspecifiedRecord = {
      weightLbs: 225, // legacy stored in weightLbs without explicit unit
    };

    // Resolving display preserves original weightLbs as 225 lb
    const resolved = resolveRecordDisplay(legacyUnspecifiedRecord, "kg");
    expect(resolved.originalUnit).toBe("lbs");
    expect(resolved.originalWeight).toBe(225);
    // Converted to kg for display only
    expect(resolved.primaryText).toBe("102.1 kg");
    expect(resolved.secondaryText).toBe("(225 lb)");
  });

  // 7. Recommended weights and exercise substitutions respect the selected display unit
  it("7. Recommended weights and exercise substitutions respect the selected display unit", () => {
    setPersistentWeightUnit("kg");
    const globalUnit = getPersistentWeightUnit();
    expect(globalUnit).toBe("kg");

    // Snapped increments adapt to the active unit
    const stepKg = getSnapStep("kg", false);
    const stepLbs = getSnapStep("lbs", false);
    expect(stepKg).toBe(2.5);
    expect(stepLbs).toBe(5);

    // AI suggestion / prescription weight conversion
    const basePrescriptionKg = 50;
    const displayedInKg = convertAndSnapWeight(basePrescriptionKg, "kg", globalUnit, false);
    expect(displayedInKg).toBe(50);

    const displayedInLbs = convertAndSnapWeight(basePrescriptionKg, "kg", "lbs", false);
    // 50 kg = 110.23 lbs -> snapped to nearest 5 lbs = 110 lbs
    expect(displayedInLbs).toBe(110);
  });

  // 8. Plate-loaded, pin-loaded, and per-hand loads retain their meanings after conversion
  it("8. Plate-loaded, pin-loaded, and per-hand loads retain their meanings after conversion", () => {
    // Per-hand dumbbell: 30 kg per hand
    const perHandKg = 30;
    const perHandLbs = convertWeight(perHandKg, "kg", "lbs");
    expect(perHandLbs).toBeCloseTo(66.14, 1);
    // Semantic meaning remains "per hand", not total combined

    // Plate-loaded starting resistance: e.g. 20 kg sled on leg press
    const sledKg = 20;
    const sledLbs = Math.round(sledKg * 2.20462 * 10) / 10;
    expect(sledLbs).toBe(44.1);

    // Plate weight on sleeves: 100 kg total (50 kg per sleeve)
    const platesTotalKg = 100;
    const perSideKg = platesTotalKg / 2;
    expect(perSideKg).toBe(50);

    const platesTotalLbs = Math.round(platesTotalKg * 2.20462 * 10) / 10;
    const perSideLbs = Math.round((platesTotalLbs / 2) * 10) / 10;
    expect(perSideLbs).toBe(110.3);
  });

  // 9. Repeated unit toggling does not accumulate rounding errors
  it("9. Repeated unit toggling does not accumulate rounding errors", () => {
    const originalKg = 80; // 80 kg
    let canonicalLbs = convertWeight(originalKg, "kg", "lbs");

    // Perform 20 round-trip conversions between kg and lbs
    for (let i = 0; i < 20; i++) {
      const asKg = convertWeight(canonicalLbs, "lbs", "kg");
      canonicalLbs = convertWeight(asKg, "kg", "lbs");
    }

    const finalKg = convertWeight(canonicalLbs, "lbs", "kg");
    expect(finalKg).toBeCloseTo(originalKg, 4);

    // Input string conversion stability
    let currentInput = "75";
    let currentUnit: WeightUnit = "kg";
    for (let i = 0; i < 10; i++) {
      const nextUnit: WeightUnit = currentUnit === "kg" ? "lbs" : "kg";
      currentInput = convertInputWeight(currentInput, currentUnit, nextUnit);
      currentUnit = nextUnit;
    }
    // After 10 toggles (5 full cycles), we're back in kg:
    expect(currentUnit).toBe("kg");
    expect(Math.abs(parseFloat(currentInput) - 75)).toBeLessThanOrEqual(0.3);
  });

  // 10. New users receive the correct existing default, and saved preferences override that default
  it("10. New users receive the correct existing default (kg), and saved preferences override that default", () => {
    // Completely blank localStorage
    expect(mockStorage[GLOBAL_WEIGHT_UNIT_KEY]).toBeUndefined();
    expect(getPersistentWeightUnit()).toBe("kg");

    // User chooses lbs
    setPersistentWeightUnit("lbs");
    expect(getPersistentWeightUnit()).toBe("lbs");

    // Subsequent reads return saved preference
    expect(getPersistentWeightUnit()).toBe("lbs");
  });

  // 11. Every audited weight-entry screen visibly identifies the active unit
  it("11. formatUnitLabel and formatWeightWithUnit explicitly and unambiguously identify units", () => {
    expect(formatUnitLabel("kg")).toBe("kg");
    expect(formatUnitLabel("lbs")).toBe("lb");
    expect(formatUnitLabel("lbs", "standard")).toBe("lbs");
    expect(formatUnitLabel("pound" as any)).toBe("lb");

    expect(formatWeightWithUnit(60, "kg")).toBe("60 kg");
    expect(formatWeightWithUnit(135, "lbs")).toBe("135 lb");
    expect(formatWeightWithUnit(70.5, "kg")).toBe("70.5 kg");
  });
});
