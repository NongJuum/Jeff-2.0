import { describe, it, expect } from "vitest";
import {
  calculatePrescriptionWeight,
  resolveCableResistanceConfig,
  calculateCableEffectiveResistance,
  getDefaultMechanicalProfile,
  STANDARD_EQUIPMENT_DEFAULTS,
  type UserProfile,
} from "../lib/assessment";

const mockProfile: UserProfile = {
  gender: "male",
  age: 28,
  weightKg: 75,
  heightCm: 175,
  expMonths: 12,
  daysPerWeek: 4,
  goal: "hypertrophy",
  injuries: [],
  preferredWeightUnit: "kg",
  updatedAt: new Date().toISOString(),
  muscleMassKg: 35,
  muscleMassMode: "smm",
};

describe("Phase 6 Regression Tests - Full Feature Restoration", () => {
  describe("1 & 2. Pulley-ratio options and effective resistance calculations", () => {
    it("pulley ratio 1:1, 2:1, and 3:1 compute correct hardware stack and effective load", () => {
      // Lat Pulldown or Cable Crossover
      const res1to1 = calculatePrescriptionWeight(
        "Cable Crossover",
        "cable",
        "10 reps",
        mockProfile,
        1.0,
        undefined,
        1 // 1:1
      );

      const res2to1 = calculatePrescriptionWeight(
        "Cable Crossover",
        "cable",
        "10 reps",
        mockProfile,
        1.0,
        undefined,
        2 // 2:1
      );

      const res3to1 = calculatePrescriptionWeight(
        "Cable Crossover",
        "cable",
        "10 reps",
        mockProfile,
        1.0,
        undefined,
        3 // 3:1
      );

      // Higher ratio means more mechanical advantage, so user must pin a heavier physical stack to achieve the same target muscle load
      expect(res1to1.pulleyRatio).toBe(1);
      expect(res2to1.pulleyRatio).toBe(2);
      expect(res3to1.pulleyRatio).toBe(3);

      expect(res2to1.recommendedHardwareWeightKg).toBeGreaterThanOrEqual(res1to1.recommendedHardwareWeightKg);
      expect(res3to1.recommendedHardwareWeightKg).toBeGreaterThanOrEqual(res2to1.recommendedHardwareWeightKg);

      // Explicit load label contains ratio
      expect(res1to1.explicitLoadTypeLabel).toContain("1:1");
      expect(res2to1.explicitLoadTypeLabel).toContain("2:1");
      expect(res3to1.explicitLoadTypeLabel).toContain("3:1");
    });
  });

  describe("4 & 5. Machine starting resistance editing, reset, and recalculation", () => {
    it("adjusting machine starting resistance changes the recommended added plates accordingly", () => {
      const exerciseName = "Iso-Lateral Chest Press";
      const defaultProfile = getDefaultMechanicalProfile("plate-loaded", exerciseName);
      const defaultTare = defaultProfile.tareWeight; // typically e.g. 7kg or 10kg

      // Default calculation with system starting resistance
      const resDefault = calculatePrescriptionWeight(
        exerciseName,
        "plate-loaded",
        "8 reps",
        mockProfile,
        1.0,
        undefined,
        undefined,
        undefined,
        defaultTare
      );

      // User override with a heavier starting sled/arm: 20kg
      const overrideTare = 20;
      const resOverride = calculatePrescriptionWeight(
        exerciseName,
        "plate-loaded",
        "8 reps",
        mockProfile,
        1.0,
        undefined,
        undefined,
        undefined,
        overrideTare
      );

      // Since the starting resistance is 20kg instead of defaultTare, added plates should decrease or remain safe
      expect(resOverride.startingResistanceKg).toBe(overrideTare);
      expect(resOverride.recommendedHardwareWeightKg).toBeLessThanOrEqual(resDefault.recommendedHardwareWeightKg);
      expect(resOverride.explicitLoadTypeLabel).toContain("Plate-Loaded");
      expect(resOverride.explicitLoadTypeLabel).toContain("กำหนดเอง");
      expect(resOverride.displayNote).toContain("แรงต้านเริ่มต้นประมาณ 20 kg");
    });

    it("smith machine bar weight correctly updates prescription plates", () => {
      // Default smith bar tare 7kg vs Olympic bar 20kg
      const resSmithDefault = calculatePrescriptionWeight(
        "Smith Machine Bench Press",
        "smith",
        "8 reps",
        mockProfile,
        1.0,
        undefined,
        undefined,
        undefined,
        STANDARD_EQUIPMENT_DEFAULTS.smithEffectiveBarKg
      );

      const resSmithHeavy = calculatePrescriptionWeight(
        "Smith Machine Bench Press",
        "smith",
        "8 reps",
        mockProfile,
        1.0,
        undefined,
        undefined,
        undefined,
        15 // custom 15kg smith bar
      );

      expect(resSmithDefault.explicitLoadTypeLabel).toContain("Smith Machine");
      expect(resSmithDefault.explicitLoadTypeLabel).toContain("รวมแรงต้านบาร์สมิท");
      expect(resSmithHeavy.startingResistanceKg).toBe(15);
      expect(resSmithHeavy.explicitLoadTypeLabel).toContain("15 kg");
      expect(resSmithHeavy.explicitLoadTypeLabel).toContain("กำหนดเอง");
    });
  });

  describe("6. Barbell labels explicitly explain bar inclusion", () => {
    it("barbell load explicitly indicates that standard 20 kg bar is included", () => {
      const res = calculatePrescriptionWeight(
        "Barbell Bench Press",
        "barbell",
        "8 reps",
        mockProfile,
        1.0
      );

      expect(res.explicitLoadTypeLabel).toBe("Barbell (น้ำหนักรวมคานมาตรฐาน 20 kg)");
      expect(res.displayNote).toContain("รวมคาน");
    });
  });

  describe("7. Dumbbell labels explicitly indicate weight per hand", () => {
    it("dumbbell prescription explicitly labels per-hand load", () => {
      const res = calculatePrescriptionWeight(
        "Dumbbell Bicep Curl",
        "dumbbell",
        "10 reps",
        mockProfile,
        1.0
      );

      expect(res.isPerHand).toBe(true);
      expect(res.explicitLoadTypeLabel).toBe("Dumbbell (น้ำหนักต่อข้าง/ต่อมือ)");
      expect(res.displayNote).toContain("ต่อข้าง");
    });
  });

  describe("8. Plate-loaded machine labels distinguish starting resistance from added plates", () => {
    it("distinguishes tare weight from added plates for unilateral / per-hand machines", () => {
      const res = calculatePrescriptionWeight(
        "Iso-Lateral Front Lat Pulldown",
        "plate-loaded",
        "10 reps",
        mockProfile,
        1.0
      );

      expect(res.explicitLoadTypeLabel).toContain("Plate-Loaded (แขนแยกอิสระ · เพลตต่อข้าง");
      expect(res.displayNote).toContain("ใส่เพลตข้างละ");
      expect(res.displayNote).toContain("แรงต้านเริ่มต้น");
    });

    it("distinguishes tare weight from added plates for bilateral sleds (e.g. Leg Press)", () => {
      const res = calculatePrescriptionWeight(
        "Leg Press",
        "plate-loaded",
        "10 reps",
        mockProfile,
        1.0
      );

      expect(res.explicitLoadTypeLabel).toContain("Plate-Loaded (แคร่รวม · เพลตรวมสองข้าง");
      expect(res.displayNote).toContain("ใส่เพลตเพิ่ม");
      expect(res.displayNote).toContain("ไม่รวมแรงต้านเครื่อง");
    });
  });

  describe("9. Selectorized machines do not receive an accidental extra resistance addition", () => {
    it("selectorized machine pin setting directly matches effective load without tare addition", () => {
      const res = calculatePrescriptionWeight(
        "Seated Cable Row",
        "selectorized",
        "10 reps",
        mockProfile,
        1.0
      );

      expect(res.startingResistanceKg).toBe(0);
      expect(res.explicitLoadTypeLabel).toContain("Selectorized");
      expect(res.displayNote).toContain("เสียบสลักพิน");
    });
  });

  describe("10. Single-side vs Dual-side cable configurations", () => {
    it("unilateral cable (1 cable) vs dual cable (2 cables to single bar) calculate correctly", () => {
      const unilateralCfg = resolveCableResistanceConfig("Lat Pulldown", "Dual Cable Pulldown", {
        pulleyRatio: 2,
        stackLabelMeaning: "physical_stack_mass",
        contributingCableSides: 1,
        labelScope: "per_side",
      });

      const dualCfg = resolveCableResistanceConfig("Lat Pulldown", "Dual Cable Pulldown", {
        pulleyRatio: 2,
        stackLabelMeaning: "physical_stack_mass",
        contributingCableSides: 2,
        labelScope: "per_side",
      });

      const uniRes = calculateCableEffectiveResistance(40, unilateralCfg);
      const dualRes = calculateCableEffectiveResistance(40, dualCfg);

      // Dual cables double the effective resistance on the bar compared to 1 cable
      expect(dualRes.effectiveCombinedResistanceKg).toBe(uniRes.effectiveCombinedResistanceKg * 2);
      expect(dualRes.displaySummary).toContain("2 สาย");
    });
  });
});
