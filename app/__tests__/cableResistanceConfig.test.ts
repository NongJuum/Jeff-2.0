import { describe, it, expect } from "vitest";
import {
  calculateCableEffectiveResistance,
  calculateCableStackSettingFromTargetForce,
  resolveCableResistanceConfig,
  getCableMachineDefault,
  calculatePrescriptionWeight,
  quantizeToHardware,
  type CableResistanceConfig,
  type UserProfile,
  type MechanicalProfile,
} from "../lib/assessment";

describe("Machine-Specific Cable Resistance Configuration & Engine", () => {
  const baseProfile: UserProfile = {
    gender: "male",
    age: 26,
    heightCm: 175,
    weightKg: 70,
    expMonths: 24, // Advanced baseline
    daysPerWeek: 4,
    goal: "hypertrophy",
    injuries: [],
    preferredWeightUnit: "kg",
    updatedAt: new Date().toISOString(),
  };

  // 1. Single cable side with a manufacturer-rated per-handle label
  it("Test 1: Single cable side with a manufacturer-rated per-handle label (pulley ratio is not double-multiplied)", () => {
    const config: CableResistanceConfig = {
      stackLabelMeaning: "effective_resistance_per_handle",
      pulleyRatio: 2.0, // Internal 2:1 pulley
      contributingCableSides: 1,
      labelScope: "per_side",
      machineName: "Single-Arm Functional Cable",
    };

    const result = calculateCableEffectiveResistance(20, config);
    expect(result.labelledWeightKg).toBe(20);
    expect(result.effectivePerHandleKg).toBe(20);
    expect(result.effectiveCombinedResistanceKg).toBe(20);
    // Physical mass is effective resistance * pulley ratio
    expect(result.physicalStackMassKg).toBe(40);
    expect(result.displaySummary).toContain("20 kgf");

    // Inverse target calculation
    const target = calculateCableStackSettingFromTargetForce(20, config);
    expect(target.targetLabelledWeightKg).toBe(20);
    expect(target.targetEffectivePerHandleKg).toBe(20);
  });

  // 2. Two cable sides combined on one bar (Required Case: Dual Pulley Cable Pulldown)
  it("Test 2: Required Case - Dual Pulley Cable Pulldown: 20 kg per-side label produces approximately 40 kgf combined resistance", () => {
    // Machine profile defines manufacturer-rated effective resistance per handle,
    // connected via 2 cable sides to a single bar, with both stacks pinned at 20 kg.
    const config: CableResistanceConfig = {
      stackLabelMeaning: "effective_resistance_per_handle",
      pulleyRatio: 2.0,
      contributingCableSides: 2,
      labelScope: "per_side",
      machineName: "Dual Pulley Cable Pulldown",
    };

    const result = calculateCableEffectiveResistance(20, config);
    // Pin setting on each stack is 20 kg
    expect(result.labelledWeightKg).toBe(20);
    // Effective resistance per handle is 20 kgf
    expect(result.effectivePerHandleKg).toBe(20);
    // Expected combined resistance at the bar is printed resistance per side * 2 = 40 kgf
    expect(result.effectiveCombinedResistanceKg).toBe(40);
    expect(result.physicalStackMassKg).toBe(40);

    // Inverse prescription: When lifter needs 40 kgf total physiological force at the bar,
    // the machine must prescribe 20 kg pin setting per side.
    const inverse = calculateCableStackSettingFromTargetForce(40, config);
    expect(inverse.targetLabelledWeightKg).toBe(20);
    expect(inverse.targetEffectivePerHandleKg).toBe(20);
    expect(inverse.targetCombinedResistanceKg).toBe(40);

    // End-to-end prescription verification using machine tag
    const pulldownPrescription = calculatePrescriptionWeight(
      "Neutral Grip Lat Pull Down",
      "cable",
      "8 to 12",
      baseProfile,
      1.0,
      "Dual Pulley Cable Pulldown"
    );
    expect(pulldownPrescription.cableConfig?.stackLabelMeaning).toBe("effective_resistance_per_handle");
    expect(pulldownPrescription.cableConfig?.contributingCableSides).toBe(2);
    expect(pulldownPrescription.cableResult).toBeDefined();
    expect(pulldownPrescription.hardwareLoadLabel).toContain("2 สายดึงรวม");
  });

  // 3. Machine whose label represents physical stack mass
  it("Test 3: Machine whose label represents physical stack mass (force is reduced by pulley mechanical advantage)", () => {
    const config: CableResistanceConfig = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 2.0, // 2:1 mechanical advantage
      contributingCableSides: 1,
      labelScope: "per_side",
      machineName: "Physical Stack Functional Trainer",
    };

    // Lifter selects 40 kg physical mass plate
    const result = calculateCableEffectiveResistance(40, config);
    expect(result.labelledWeightKg).toBe(40);
    expect(result.physicalStackMassKg).toBe(40);
    // On a 2:1 pulley, 40 kg physical mass delivers 20 kgf effective force at the handle
    expect(result.effectivePerHandleKg).toBe(20);
    expect(result.effectiveCombinedResistanceKg).toBe(20);

    // Inverse target calculation: To achieve 20 kgf force, pin must be set to 40 kg
    const target = calculateCableStackSettingFromTargetForce(20, config);
    expect(target.targetLabelledWeightKg).toBe(40);
  });

  // 4. Machine whose displayed value already represents combined resistance
  it("Test 4: Machine whose displayed value already represents combined resistance (prevents double multiplication)", () => {
    const config: CableResistanceConfig = {
      stackLabelMeaning: "effective_resistance_per_handle",
      pulleyRatio: 2.0,
      contributingCableSides: 2,
      labelScope: "combined", // Label/console already shows combined total
      machineName: "Consolidated Dual Cable Station",
    };

    // Lifter sets 40 kg on the console/label
    const result = calculateCableEffectiveResistance(40, config);
    expect(result.labelledWeightKg).toBe(40);
    // Combined resistance must NOT be multiplied by 2 again! It remains 40 kgf.
    expect(result.effectiveCombinedResistanceKg).toBe(40);
    expect(result.effectivePerHandleKg).toBe(20);

    // Inverse target: Target 40 kgf combined -> Target label setting is 40 kg
    const target = calculateCableStackSettingFromTargetForce(40, config);
    expect(target.targetLabelledWeightKg).toBe(40);
    expect(target.targetEffectivePerHandleKg).toBe(20);
  });

  // 5. Different pulley ratios and cable arrangements
  it("Test 5: Different pulley ratios (1:1, 2:1, 3:1, 1:2) and cable arrangements", () => {
    // 1:1 Direct cable stack
    const direct1to1: CableResistanceConfig = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 1.0,
      contributingCableSides: 1,
      labelScope: "per_side",
    };
    const res1to1 = calculateCableEffectiveResistance(30, direct1to1);
    expect(res1to1.effectiveCombinedResistanceKg).toBe(30);

    // 3:1 High mechanical advantage
    const highAdvantage3to1: CableResistanceConfig = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 3.0,
      contributingCableSides: 1,
      labelScope: "per_side",
    };
    const res3to1 = calculateCableEffectiveResistance(60, highAdvantage3to1);
    expect(res3to1.effectiveCombinedResistanceKg).toBe(20);

    // 2 cables connected to 1 bar on physical stack 2:1
    const dualPhysical2to1: CableResistanceConfig = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 2.0,
      contributingCableSides: 2,
      labelScope: "per_side",
    };
    // 30 kg physical mass on each stack -> 15 kgf per handle * 2 = 30 kgf combined
    const resDual = calculateCableEffectiveResistance(30, dualPhysical2to1);
    expect(resDual.effectivePerHandleKg).toBe(15);
    expect(resDual.effectiveCombinedResistanceKg).toBe(30);

    // Inverted ratio 1:2 (pulleyRatio 0.5)
    const invertedRatio: CableResistanceConfig = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 0.5,
      contributingCableSides: 1,
      labelScope: "per_side",
    };
    const resInverted = calculateCableEffectiveResistance(20, invertedRatio);
    expect(resInverted.effectiveCombinedResistanceKg).toBe(40);
  });

  // 6. Preventing double multiplication
  it("Test 6: Prevents double multiplication under all configuration permutations", () => {
    const manufacturerRatedPerHandle: CableResistanceConfig = {
      stackLabelMeaning: "effective_resistance_per_handle",
      pulleyRatio: 2.0,
      contributingCableSides: 1,
      labelScope: "per_side",
    };
    // Should NOT multiply 20 kg by 2 or divide by 2
    const resA = calculateCableEffectiveResistance(20, manufacturerRatedPerHandle);
    expect(resA.effectiveCombinedResistanceKg).toBe(20);

    const manufacturerRatedCombined: CableResistanceConfig = {
      stackLabelMeaning: "effective_resistance_per_handle",
      pulleyRatio: 2.0,
      contributingCableSides: 2,
      labelScope: "combined",
    };
    // Should NOT multiply 40 kg by 2
    const resB = calculateCableEffectiveResistance(40, manufacturerRatedCombined);
    expect(resB.effectiveCombinedResistanceKg).toBe(40);

    const physicalCombined: CableResistanceConfig = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 2.0,
      contributingCableSides: 2,
      labelScope: "combined",
    };
    // 40 kg combined physical stack mass on 2:1 pulley -> 20 kgf combined resistance
    const resC = calculateCableEffectiveResistance(40, physicalCombined);
    expect(resC.effectiveCombinedResistanceKg).toBe(20);
  });

  // 7. Persistence and restoration of machine-specific settings
  it("Test 7: Persistence, restoration, and resolution of machine-specific cable overrides", () => {
    // Default lookup by name
    const defaultPulldown = getCableMachineDefault("Neutral Grip Lat Pull Down", "Dual Pulley Cable Pulldown");
    expect(defaultPulldown.stackLabelMeaning).toBe("effective_resistance_per_handle");
    expect(defaultPulldown.contributingCableSides).toBe(2);

    // User overrides the machine config (e.g. gym installed a 3:1 physical stack conversion)
    const userOverride: Partial<CableResistanceConfig> = {
      stackLabelMeaning: "physical_stack_mass",
      pulleyRatio: 3.0,
      notes: "Custom gym modification",
    };

    const resolved = resolveCableResistanceConfig("Neutral Grip Lat Pull Down", "Dual Pulley Cable Pulldown", userOverride);
    expect(resolved.stackLabelMeaning).toBe("physical_stack_mass");
    expect(resolved.pulleyRatio).toBe(3.0);
    // Preserves contributingCableSides: 2 from the base model
    expect(resolved.contributingCableSides).toBe(2);

    // Test passing the override directly to calculatePrescriptionWeight
    const pres = calculatePrescriptionWeight(
      "Neutral Grip Lat Pull Down",
      "cable",
      "8 to 12",
      baseProfile,
      1.0,
      "Dual Pulley Cable Pulldown",
      undefined,
      undefined,
      undefined,
      undefined,
      "kg",
      undefined,
      userOverride
    );
    expect(pres.cableConfig?.stackLabelMeaning).toBe("physical_stack_mass");
    expect(pres.cableConfig?.pulleyRatio).toBe(3.0);
  });

  // 8. Ensuring unrelated machines retain their existing behavior
  it("Test 8: Unrelated exercises and machines retain exact existing behavior", () => {
    // Barbell Bench Press
    const bench = calculatePrescriptionWeight("Bench Press", "barbell", "8 to 12", baseProfile);
    expect(bench.tareWeightKg).toBe(20);
    expect(bench.hardwareLoadLabel).toBe("น้ำหนักรวมคาน");
    expect(bench.cableConfig).toBeUndefined();

    // Dumbbell Bench Press
    const db = calculatePrescriptionWeight("Flat DB Press", "dumbbell", "8 to 12", baseProfile);
    expect(db.isPerHand).toBe(true);
    expect(db.hardwareLoadLabel).toBe("น้ำหนักดัมเบลต่อข้าง");
    expect(db.cableConfig).toBeUndefined();

    // Plate-Loaded 45° Leg Press
    const legPress = calculatePrescriptionWeight("45° Leg Press", "plate-loaded", "8 to 12", baseProfile);
    expect(legPress.startingResistanceKg).toBe(50);
    expect(legPress.cableConfig).toBeUndefined();

    // Standard Direct Cable (1:1 Lat Pulldown)
    const directPulldown = calculatePrescriptionWeight("Lat Pulldown (Pin-Loaded)", "cable", "8 to 12", baseProfile);
    expect(directPulldown.cableConfig?.pulleyRatio).toBe(1.0);
    expect(directPulldown.cableConfig?.stackLabelMeaning).toBe("physical_stack_mass");
  });

  // Quantization integration test
  it("Test 9: quantizeToHardware returns clear display notes distinguishing pin setting from combined resistance", () => {
    const dualPulleyConfig: CableResistanceConfig = {
      stackLabelMeaning: "effective_resistance_per_handle",
      pulleyRatio: 2.0,
      contributingCableSides: 2,
      labelScope: "per_side",
      machineName: "Dual Pulley Cable Pulldown",
    };

    const quantProfile: MechanicalProfile = {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: 2.0,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: true,
      bilateralDeficit: false,
      minHardwareStep: 2.5,
      tareWeight: 0,
      cableConfig: dualPulleyConfig,
    };

    // If target rawWeightKg is 20 kg per side
    const quantized = quantizeToHardware(20, quantProfile, false, true, "kg");
    expect(quantized.hardwareWeightKg).toBe(20);
    // Effective combined resistance at the bar is 40 kgf
    expect(quantized.effectiveHardwareWeightKg).toBe(40);
    expect(quantized.displayNote).toContain("เสียบสลักพินข้างละ 20 kg");
    expect(quantized.displayNote).toContain("40 kg");
    expect(quantized.displayNote).toContain("ผู้ผลิตระบุแรงต้านต่อข้าง");
    expect(quantized.cableResult?.effectiveCombinedResistanceKg).toBe(40);
  });
});
