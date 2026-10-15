// app/lib/assessment.ts
"use client";

import type { WeightUnit } from "./units";

export type Gender = "male" | "female";
export type FitnessGoal = "strength" | "hypertrophy" | "fitness";
export type MuscleMassMode = "smm" | "total";
export type ExperienceTier = "<6m" | "6-12m" | "1-2y" | ">2y";

export interface UserProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  muscleMassKg?: number;
  muscleMassMode?: MuscleMassMode;
  expMonths: number;
  daysPerWeek: 3 | 4 | 5;
  goal: FitnessGoal;
  injuries: string[]; // e.g. ["lowerBack", "shoulder", "knee", "wrist"]
  preferredWeightUnit: WeightUnit;
  updatedAt: string;
}

export const USER_PROFILE_KEY = "haitUserProfileV1";

export function getUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

/**
 * Asia-Pacific WHO BMI Cut-offs:
 * < 18.5: Underweight
 * 18.5 - 22.9: Normal
 * 23.0 - 24.9: Overweight / At Risk
 * 25.0 - 29.9: Obese I
 * >= 30.0: Obese II
 */
export function getAsiaPacificBmi(weightKg: number, heightCm: number): {
  bmi: number;
  category: "underweight" | "normal" | "overweight" | "obese1" | "obese2";
  label: string;
} {
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 0;
  if (bmi < 18.5) return { bmi, category: "underweight", label: "น้ำหนักต่ำกว่าเกณฑ์ (<18.5)" };
  if (bmi < 23.0) return { bmi, category: "normal", label: "สมส่วนตามเกณฑ์เอเชีย (18.5-22.9)" };
  if (bmi < 25.0) return { bmi, category: "overweight", label: "น้ำหนักเกินเกณฑ์ (23.0-24.9)" };
  if (bmi < 30.0) return { bmi, category: "obese1", label: "อ้วนระดับ 1 (25.0-29.9)" };
  return { bmi, category: "obese2", label: "อ้วนระดับ 2 (≥30.0)" };
}

/**
 * Muscle mass evaluator:
 * SMM mode (M: 31-36%, F: 24-29%)
 * Total muscle mode (M: 38-44%, F: 30-36%)
 */
export function evaluateMuscleMass(
  gender: Gender,
  weightKg: number,
  muscleMassKg?: number,
  mode: MuscleMassMode = "smm"
): { percentage: number; rating: "low" | "normal" | "high"; modifier: number; label: string } {
  if (!muscleMassKg || muscleMassKg <= 0 || weightKg <= 0) {
    return { percentage: 0, rating: "normal", modifier: 1.0, label: "มาตรฐานทั่วไป" };
  }

  const percentage = Number(((muscleMassKg / weightKg) * 100).toFixed(1));
  const isMale = gender === "male";

  let lowThreshold = isMale ? 31 : 24;
  let highThreshold = isMale ? 36 : 29;

  if (mode === "total") {
    lowThreshold = isMale ? 38 : 30;
    highThreshold = isMale ? 44 : 36;
  }

  if (percentage < lowThreshold) {
    return { percentage, rating: "low", modifier: 0.95, label: "มวลกล้ามเนื้อน้อยกว่าเกณฑ์ (-5%)" };
  }
  if (percentage > highThreshold) {
    return { percentage, rating: "high", modifier: 1.05, label: "มวลกล้ามเนื้อสูงกว่าเกณฑ์ (+5%)" };
  }
  return { percentage, rating: "normal", modifier: 1.0, label: "มวลกล้ามเนื้อเกณฑ์ปกติ" };
}

/**
 * 1RM Ratios to Bodyweight (Male / Female Baseline for Intermediate 100%)
 */
export const STRENGTH_RATIOS: Record<string, { male: number; female: number }> = {
  Deadlift: { male: 1.65, female: 1.10 },
  RDL: { male: 1.05, female: 0.70 },
  Squat: { male: 1.45, female: 0.95 },
  LegPress: { male: 2.00, female: 1.40 },
  LegExt: { male: 0.60, female: 0.40 },
  LegCurl: { male: 0.50, female: 0.35 },
  Bench: { male: 1.00, female: 0.60 },
  Incline: { male: 0.82, female: 0.50 },
  Flye: { male: 0.45, female: 0.30 },
  LatPull: { male: 0.95, female: 0.65 },
  Row: { male: 0.90, female: 0.58 },
  ChestSupportedRow: { male: 0.65, female: 0.45 },
  SeatedCableRow: { male: 0.50, female: 0.35 },
  IsoLateralHighRow: { male: 0.55, female: 0.38 },
  IsoLateralLowRow: { male: 0.58, female: 0.40 },
  InclineMachinePress: { male: 0.75, female: 0.50 },
  DeclineMachinePress: { male: 0.90, female: 0.60 },
  OHP: { male: 0.68, female: 0.42 },
  LatRaise: { male: 0.18, female: 0.12 },
  RearDelt: { male: 0.30, female: 0.20 },
  Shrug: { male: 1.40, female: 0.90 },
  Bicep: { male: 0.38, female: 0.24 },
  Tricep: { male: 0.42, female: 0.28 },
  // Seated calf machines have model-dependent lever arms and pad geometry.
  // Use a deliberately conservative working-load baseline, distinct from standing calf raises.
  SeatedCalf: { male: 0.45, female: 0.30 },
  Calf: { male: 0.65, female: 0.45 },
  LegPressCalf: { male: 0.70, female: 0.45 },
  HipThrust: { male: 1.60, female: 1.20 },
  HipHinge: { male: 0.75, female: 0.50 },
  HipIsolation: { male: 0.35, female: 0.25 },
  Abs: { male: 0.25, female: 0.18 },
};

/** Conservative relative-strength thresholds for exercises with highly machine-dependent resistance. */
export const RELATIVE_STRENGTH_THRESHOLDS = {
  seatedCalf: [0.35, 0.55, 0.75] as const,
  standingCalf: [0.45, 0.70, 0.95] as const,
  legPressCalf: [0.65, 1.00, 1.40] as const,
};

/** Bodyweight-only movements should not receive an automatic external-load suggestion. */
export function shouldAutoPrescribeAddedLoad(loadType: string, exerciseName: string): boolean {
  if (loadType !== "bodyweight") return true;
  const name = exerciseName.toLowerCase();
  return name.includes("weighted dip") || name.includes("weighted pull up");
}

/**
 * Experience Modifier (E_exp)
 * <6m: 0.45, 6-12m: 0.65, 1-2y: 0.85, >2y: 1.0
 */
export function getExperienceModifier(expMonths: number): { modifier: number; tier: ExperienceTier; label: string } {
  if (expMonths < 6) return { modifier: 0.45, tier: "<6m", label: "มือใหม่ (<6 เดือน)" };
  if (expMonths < 12) return { modifier: 0.65, tier: "6-12m", label: "เริ่มต้น (6-12 เดือน)" };
  if (expMonths < 24) return { modifier: 0.85, tier: "1-2y", label: "ระดับกลาง (1-2 ปี)" };
  return { modifier: 1.00, tier: ">2y", label: "มีประสบการณ์ (>2 ปี)" };
}

/**
 * Reps Modifier (R_rep)
 * 3-6: 0.85, 5-8: 0.80, 6-10: 0.75, 8-12: 0.70, 10-15: 0.65, 12-20: 0.60
 */
export function getRepsModifier(repsStr: string): number {
  const clean = repsStr.toLowerCase().replace(/each leg/g, "").trim();
  if (clean.includes("3 to 6") || clean.includes("3-6")) return 0.85;
  if (clean.includes("5 to 8") || clean.includes("5-8")) return 0.80;
  if (clean.includes("6 to 10") || clean.includes("6-10")) return 0.75;
  if (clean.includes("8 to 12") || clean.includes("8-12")) return 0.70;
  if (clean.includes("10 to 15") || clean.includes("10-15")) return 0.65;
  if (clean.includes("12 to 20") || clean.includes("12-20") || clean.includes("12 to 15")) return 0.60;
  return 0.70;
}

/**
 * Goal Modifier (G_goal)
 */
export function getGoalModifier(goal: FitnessGoal): number {
  if (goal === "strength") return 1.05;
  if (goal === "hypertrophy") return 1.00;
  return 0.92; // general fitness
}

/**
 * Mechanical Profile for gym equipment
 */
/**
 * Standardized midpoint assumptions for common commercial gym equipment.
 * These are starting defaults for Hammer Strength / Life Fitness-class gyms,
 * not manufacturer-specific resistance measurements. Override only when the
 * actual machine's stack ratio, unloaded carriage/bar, or plate increments are known.
 */
export const STANDARD_EQUIPMENT_DEFAULTS = {
  olympicBarKg: 20,
  smithEffectiveBarKg: 11, // midpoint estimate; counterbalance differs by model
  barbellTotalLoadStepKg: 2.5,
  selectorizedStackStepKg: 5,
  functionalTrainerStepKg: 2.5,
  plateLoadedStepKg: 5,
  standardStackPulleyRatio: 1,
  functionalTrainerPulleyRatio: 2,
  plateLoadedLeverageRatio: 1,
  legPressLeverageRatio: 1,
} as const;

export type MachineResistanceSource = "manufacturer-spec" | "category-estimate";

export interface PlateLoadedMachineDefault {
  aliases: string[];
  /** Unloaded resistance in kg per working arm, or total for bilateral sleds. */
  startingResistanceKg: number;
  /** true when target and plate amount are represented per side/arm. */
  perSide: boolean;
  /** kg of added plates per side, or total for bilateral sleds. */
  plateStepKg: number;
  source: MachineResistanceSource;
}

/**
 * Built-in commercial-machine defaults. Manufacturer specs are used only for
 * the matching model family; other entries are explicit category estimates.
 * These values are owned by the app, never required from the user.
 */
export const PLATE_LOADED_MACHINE_DEFAULTS: PlateLoadedMachineDefault[] = [
  // Named machine families in the exercise library. Values are per working arm
  // for independent-arm machines, and total for bilateral sled/carriage machines.
  { aliases: ["life fitness plate loaded incline press", "life fitness incline press"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "manufacturer-spec" },
  { aliases: ["hammer strength iso-lateral wide chest", "hammer strength wide chest"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "manufacturer-spec" },
  { aliases: ["45° leg press high foot", "45 degree leg press high foot", "45° leg press", "45 degree leg press", "linear leg press", "leg press calf raise", "leg press"], startingResistanceKg: 50, perSide: false, plateStepKg: 10, source: "category-estimate" },
  { aliases: ["hack squat", "v-squat machine", "v-squat", "pendulum squat"], startingResistanceKg: 25, perSide: false, plateStepKg: 10, source: "category-estimate" },
  { aliases: ["belt squat"], startingResistanceKg: 15, perSide: false, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["standing calf raise", "seated calf raise", "calf raise"], startingResistanceKg: 15, perSide: false, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["iso-lateral incline press", "incline converging chest press", "incline machine bench"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["iso-lateral chest press", "plate-loaded chest press", "machine chest press", "pin-loaded chest press", "chest press", "bench press", "incline press", "decline press", "wide chest"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["machine high row", "chest supported t-bar row", "iso-lateral low row", "iso-lateral pulldown", "high row", "low row", "pulldown", "pullover", "row"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["machine hip thrust", "hip thrust", "glute drive"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["leg extension", "seated hamstring curl", "lying leg curl", "hamstring curl"], startingResistanceKg: 5, perSide: false, plateStepKg: 5, source: "category-estimate" },
  { aliases: ["machine shoulder press", "shoulder press", "overhead press"], startingResistanceKg: 5, perSide: true, plateStepKg: 5, source: "category-estimate" },
];

export function getPlateLoadedMachineDefault(exerciseName: string, machineTag = ""): PlateLoadedMachineDefault {
  const name = `${exerciseName} ${machineTag}`.toLowerCase().replace(/\s+/g, " ").trim();
  // Match more specific aliases first so model names beat generic movement names.
  const matched = [...PLATE_LOADED_MACHINE_DEFAULTS]
    .sort((a, b) => Math.max(...b.aliases.map((alias) => alias.length)) - Math.max(...a.aliases.map((alias) => alias.length)))
    .find((entry) => entry.aliases.some((alias) => name.includes(alias)));
  // Safe app-owned fallback: never silently assume a plate-loaded machine starts at 0 kg.
  return matched ?? {
    aliases: ["unclassified plate-loaded machine"],
    startingResistanceKg: 5,
    perSide: true,
    plateStepKg: 5,
    source: "category-estimate",
  };
}

export type PinLoadedMachineDefault = {
  aliases: string[];
  /** Selectorized stacks already represent the selectable load; do not add this to the pin value. */
  stackStepKg: number;
  configuration: "single-stack" | "independent-arms";
  pulleyRatio: number;
  source: "manufacturer-spec" | "category-estimate";
};

/** Pin-stack defaults for every selectorized machine family in the exercise library. */
export const PIN_LOADED_MACHINE_DEFAULTS: PinLoadedMachineDefault[] = [
  { aliases: ["machine chest press", "pin-loaded chest press", "incline machine bench", "decline machine press"], stackStepKg: 5, configuration: "single-stack", pulleyRatio: 1, source: "category-estimate" },
  { aliases: ["pec deck", "reverse pec deck", "atlantis machine lat raise"], stackStepKg: 5, configuration: "single-stack", pulleyRatio: 1, source: "category-estimate" },
  { aliases: ["neutral grip lat pull down", "widegrip lat pull down", "assisted pull up machine"], stackStepKg: 5, configuration: "single-stack", pulleyRatio: 1, source: "category-estimate" },
  { aliases: ["leg extension", "seated hamstring curl", "lying leg curl"], stackStepKg: 5, configuration: "single-stack", pulleyRatio: 1, source: "category-estimate" },
  { aliases: ["machine hip thrust", "machine hip abduction", "machine hip adduction"], stackStepKg: 5, configuration: "single-stack", pulleyRatio: 1, source: "category-estimate" },
  { aliases: ["machine shoulder press", "machine triceps extension", "machine preacher curl", "machine abs crunch", "seated calf raise", "standing calf raise"], stackStepKg: 5, configuration: "single-stack", pulleyRatio: 1, source: "category-estimate" },
];

export function getPinLoadedMachineDefault(exerciseName: string, machineTag = ""): PinLoadedMachineDefault {
  const name = `${exerciseName} ${machineTag}`.toLowerCase().replace(/\s+/g, " ").trim();
  const matched = [...PIN_LOADED_MACHINE_DEFAULTS]
    .sort((a, b) => Math.max(...b.aliases.map((alias) => alias.length)) - Math.max(...a.aliases.map((alias) => alias.length)))
    .find((entry) => entry.aliases.some((alias) => name.includes(alias)));
  if (matched) return matched;
  // Safe generic pin-stack fallback; the selected pin value is the load itself.
  return { aliases: ["unclassified pin-loaded machine"], stackStepKg: 5, configuration: /single-arm|one arm|iso-lateral|dual-arm/.test(name) ? "independent-arms" : "single-stack", pulleyRatio: 1, source: "category-estimate" };
}

export interface MechanicalProfile {
  leverageRatio: number;
  camModifier: number;
  pulleyRatio: number;
  frictionCoeff: number;
  angleThetaDeg: number;
  isPerHand: boolean;
  bilateralDeficit: boolean;
  minHardwareStep: number;
  tareWeight: number; // bar/bar-start resistance in kg
  isPlateLoaded?: boolean;
}

export type BiomechanicalProfile = {
  baseRatio: { male: number; female: number };
  pulleyRatio: number;      // 1.0 = direct stack, 2.0 = functional trainer
  isPerHand: boolean;        // true = user plates/pins one arm at a time (Iso-Lateral / DB)
  stabilityFactor: number;  // 1.15 for chest-supported, 0.90 for free/core-loaded
  isPlateLoaded?: boolean;
};

export function resolveMechanicalProfile(exerciseName: string, machineTag = ""): BiomechanicalProfile {
  const text = `${exerciseName} ${machineTag}`.toLowerCase();

  // 1. Iso-Lateral / Hammer Machines (Weights loaded per side)
  const isIso = text.includes("iso-lateral") || text.includes("iso lateral") || text.includes("hammer") || text.includes("mts");
  const isChestSupported = text.includes("chest support") || text.includes("supported") || text.includes("seal row") || text.includes("t-bar");

  // 2. Row Category
  if (text.includes("high row")) {
    return { baseRatio: { male: 0.36, female: 0.24 }, pulleyRatio: 1.0, isPerHand: true, stabilityFactor: 1.15 };
  }
  if (text.includes("low row")) {
    return { baseRatio: { male: 0.38, female: 0.25 }, pulleyRatio: 1.0, isPerHand: true, stabilityFactor: 1.15 };
  }
  if (isChestSupported && text.includes("row")) {
    return { baseRatio: { male: 0.65, female: 0.44 }, pulleyRatio: 1.0, isPerHand: isIso, stabilityFactor: 1.15 };
  }
  if (text.includes("cable row") || text.includes("seated row")) {
    return { baseRatio: { male: 0.48, female: 0.32 }, pulleyRatio: 1.0, isPerHand: false, stabilityFactor: 0.90 };
  }

  // 3. Chest Press Category
  if (text.includes("incline")) {
    return { baseRatio: { male: isIso ? 0.35 : 0.65, female: isIso ? 0.23 : 0.42 }, pulleyRatio: 1.0, isPerHand: isIso, stabilityFactor: 1.10 };
  }
  if (text.includes("decline")) {
    return { baseRatio: { male: isIso ? 0.45 : 0.85, female: isIso ? 0.30 : 0.55 }, pulleyRatio: 1.0, isPerHand: isIso, stabilityFactor: 1.10 };
  }
  if (text.includes("chest press") || text.includes("bench")) {
    return { baseRatio: { male: isIso ? 0.40 : 0.78, female: isIso ? 0.26 : 0.50 }, pulleyRatio: 1.0, isPerHand: isIso, stabilityFactor: 1.05 };
  }

  // 4. Pulldowns
  if (text.includes("pulldown") || text.includes("pull down")) {
    return { baseRatio: { male: isIso ? 0.34 : 0.62, female: isIso ? 0.22 : 0.40 }, pulleyRatio: 1.0, isPerHand: isIso, stabilityFactor: 1.05 };
  }

  // 5. Default Fallbacks
  return { baseRatio: { male: 0.40, female: 0.25 }, pulleyRatio: 1.0, isPerHand: false, stabilityFactor: 1.0 };
}

export function getDefaultMechanicalProfile(load: string, exerciseName: string, pulleyRatioOverride?: number): MechanicalProfile {
  const lowerName = exerciseName.toLowerCase();

  // Plate-loaded specialty machines in the exercise library (not the trap bar)
  // use the same start-resistance subtraction as other plate-loaded machines.
  if (
    load === "specialty" &&
    ["hack squat", "belt squat", "pendulum squat", "v-squat"].some((name) => lowerName.includes(name))
  ) {
    const machine = getPlateLoadedMachineDefault(exerciseName);
    return {
      leverageRatio: STANDARD_EQUIPMENT_DEFAULTS.plateLoadedLeverageRatio,
      camModifier: 1,
      pulleyRatio: 1,
      frictionCoeff: 0,
      angleThetaDeg: 0,
      isPerHand: machine.perSide,
      bilateralDeficit: false,
      minHardwareStep: machine.plateStepKg,
      tareWeight: machine.startingResistanceKg,
      isPlateLoaded: true,
    };
  }

  // Special Overrides first:
  // Exclude calf raise from leg press override so it gets Calf category + proper ratio.
  if (
    (lowerName.includes("45° leg press") || lowerName.includes("45 degree leg press") || lowerName.includes("leg press")) &&
    !lowerName.includes("calf")
  ) {
    const machine = getPlateLoadedMachineDefault(exerciseName, "");
    return {
      leverageRatio: STANDARD_EQUIPMENT_DEFAULTS.legPressLeverageRatio,
      camModifier: 1.0,
      pulleyRatio: 1.0,
      frictionCoeff: 0.0,
      angleThetaDeg: 0,
      isPerHand: machine.perSide,
      bilateralDeficit: false,
      minHardwareStep: machine.plateStepKg,
      tareWeight: machine.startingResistanceKg,
      isPlateLoaded: true,
    };
  }

  // Explicit execution variants use a cable stack per working side.
  // Single-arm = one working side; dual-arm = two independent stacks, one per hand.
  // Keep the prescription expressed as pin weight PER SIDE; pulley ratio remains
  // a separate machine assumption and defaults to 2:1 for these cable variants.
  if (
    (lowerName.includes("(single-arm)") || lowerName.includes("(dual-arm")) &&
    load === "cable"
  ) {
    return {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: pulleyRatioOverride ?? 2.0,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: true,
      bilateralDeficit: false,
      minHardwareStep: 2.5,
      tareWeight: 0,
    };
  }

  // ─── Single-arm cable isolation on functional trainers ─────────────────────
  // isPerHand=true: force÷2 in calculatePrescriptionWeight, then ×2 via pulleyRatio=2.0
  // Net: rawKg = bilateral force = correct pin setting displayed to user.
  if (
    lowerName.includes("cable lat raise") ||
    lowerName.includes("cable lateral raise") ||
    lowerName.includes("behind back cable") ||
    lowerName.includes("cable y raise") ||
    lowerName.includes("cable rear delt") ||
    lowerName.includes("cable face pull") ||
    lowerName.includes("bayesian curl") ||
    lowerName.includes("cable curl") ||
    lowerName.includes("cable rope hammer") ||
    lowerName.includes("cable hammer") ||
    lowerName.includes("overhead cable ext") ||
    lowerName.includes("cable tricep") ||
    lowerName.includes("triceps pressdown") ||
    lowerName.includes("cable pressdown") ||
    lowerName.includes("cable kickback") ||
    lowerName.includes("glute kickback") ||
    lowerName.includes("katana")
  ) {
    return {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: 2.0, // 2:1 functional trainer; cancels isPerHand÷2
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: true,
      bilateralDeficit: false,
      minHardwareStep: 2.5,
      tareWeight: 0,
    };
  }

  // ─── Bilateral crossover cable flye (two-arm, shared stack) ─────────────────
  // Both arms pull against one shared stack (functional trainer split cable).
  // Force required = total bilateral chest force. No per-hand division.
  // pulleyRatio = 1.0: rawKg = force directly = pin setting.
  if (
    lowerName.includes("cable flye") ||
    lowerName.includes("cable crossover") ||
    lowerName.includes("pec flye")
  ) {
    return {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: 1.0, // direct: pin weight = bilateral force required
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: false,
      bilateralDeficit: false,
      minHardwareStep: 2.5,
      tareWeight: 0,
    };
  }

  // ─── Bilateral cable stack (pulldown / row) ───────────────────────────────
  if (
    lowerName.includes("lat pull down") ||
    lowerName.includes("lat pull") ||
    lowerName.includes("cable row") ||
    lowerName.includes("cable crunch") ||
    lowerName.includes("straight arm pulldown") ||
    lowerName.includes("cable lat prayers")
  ) {
    return {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: STANDARD_EQUIPMENT_DEFAULTS.standardStackPulleyRatio,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: false,
      bilateralDeficit: false,
      minHardwareStep: STANDARD_EQUIPMENT_DEFAULTS.selectorizedStackStepKg,
      tareWeight: 0,
    };
  }

  // Load-type Defaults:
  switch (load) {
    case "barbell":
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.0,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: STANDARD_EQUIPMENT_DEFAULTS.barbellTotalLoadStepKg,
        tareWeight: STANDARD_EQUIPMENT_DEFAULTS.olympicBarKg,
      };
    case "dumbbell":
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.0,
        angleThetaDeg: 0,
        isPerHand: true,
        bilateralDeficit: true,
        minHardwareStep: 2.5,
        tareWeight: 0,
      };
    case "smith":
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.05,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: STANDARD_EQUIPMENT_DEFAULTS.barbellTotalLoadStepKg,
        tareWeight: STANDARD_EQUIPMENT_DEFAULTS.smithEffectiveBarKg,
      };
    case "plate-loaded": {
      const machine = getPlateLoadedMachineDefault(exerciseName);
      return {
        leverageRatio: STANDARD_EQUIPMENT_DEFAULTS.plateLoadedLeverageRatio,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.0,
        angleThetaDeg: 0,
        isPerHand: machine.perSide,
        bilateralDeficit: false,
        minHardwareStep: machine.plateStepKg,
        tareWeight: machine.startingResistanceKg,
        isPlateLoaded: true,
      };
    }
    case "selectorized": {
      const machine = getPinLoadedMachineDefault(exerciseName);
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: machine.pulleyRatio,
        frictionCoeff: 0.0,
        angleThetaDeg: 0,
        isPerHand: machine.configuration === "independent-arms",
        bilateralDeficit: false,
        minHardwareStep: machine.stackStepKg,
        tareWeight: 0,
      };
    }
    case "cable": {
      // Single-arm isolation: isPerHand=true, pulleyRatio=2.0
      // (force÷2 × 2.0 = bilateral force = correct pin display)
      const lower = exerciseName.toLowerCase();
      const isIsolationSingleArm =
        lower.includes("curl") ||
        lower.includes("pressdown") ||
        lower.includes("tricep") ||
        lower.includes("katana") ||
        lower.includes("face pull") ||
        lower.includes("rear delt") ||
        lower.includes("kickback") ||
        (lower.includes("raise") && !lower.includes("row") && !lower.includes("press")) ||
        (lower.includes("overhead") && (lower.includes("extension") || lower.includes("ext")));
      if (isIsolationSingleArm) {
        return {
          leverageRatio: 1.0,
          camModifier: 1.0,
          pulleyRatio: STANDARD_EQUIPMENT_DEFAULTS.functionalTrainerPulleyRatio, // 2:1 functional trainer; cancels isPerHand÷2
          frictionCoeff: 0.05,
          angleThetaDeg: 0,
          isPerHand: true,
          bilateralDeficit: false,
          minHardwareStep: 2.5,
          tareWeight: 0,
        };
      }
      // Bilateral crossover flye: no per-hand split, pin = bilateral force
      const isBilateralFlye = lower.includes("flye") || lower.includes("crossover");
      if (isBilateralFlye) {
        return {
          leverageRatio: 1.0,
          camModifier: 1.0,
          pulleyRatio: 1.0, // direct: pin = bilateral force
          frictionCoeff: 0.05,
          angleThetaDeg: 0,
          isPerHand: false,
          bilateralDeficit: false,
          minHardwareStep: 2.5,
          tareWeight: 0,
        };
      }
      // Default cable fallback: use a common 2:1 functional-trainer assumption.
      // Lat pulldown and seated-row stacks are matched explicitly above at 1:1.
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: STANDARD_EQUIPMENT_DEFAULTS.functionalTrainerPulleyRatio,
        frictionCoeff: 0.05,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: 2.5,
        tareWeight: 0,
      };
    }
    case "bodyweight":
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.0,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: 2.5,
        tareWeight: 0,
      };
    default:
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.0,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: 2.5,
        tareWeight: 0,
      };
  }
}

/**
 * Match exercise name to its biological ratio category
 */
export function getExerciseStrengthCategory(exerciseName: string): string {
  const name = exerciseName.toLowerCase();
  if (name.includes("romanian") || name.includes("rdl")) return "RDL";
  if (name.includes("deadlift")) return "Deadlift";
  if (name.includes("cable lat prayer") || name.includes("straight arm pulldown")) return "LatPull";
  if (name.includes("leg press calf")) return "LegPressCalf";
  if (name.includes("seated calf")) return "SeatedCalf";
  if (name.includes("reverse nordic") || name.includes("sissy squat") || name.includes("sissy")) return "LegExt";
  if (name.includes("cable pull through") || name.includes("back extension") || name.includes("hyperextension")) return "HipHinge";
  if (name.includes("hip abduction") || name.includes("hip adduction") || name === "kickbacks" || name.includes("glute kickback")) return "HipIsolation";
  if (name.includes("ab wheel") || name.includes("knee raise") || name.includes("leg raise") || name.includes("captain's chair") || name.includes("crunch") || name.includes("rollout")) return "Abs";
  if (name.includes("lean in db raise")) return "LatRaise";
  if (name.includes("1 arm db overhead")) return "Tricep";
  // Calf check before leg press: "Leg Press Calf Raise" → Calf, not LegPress
  if (name.includes("calf") || name.includes("calves")) return "Calf";
  if (name.includes("leg press")) return "LegPress";
  if (name.includes("leg extension")) return "LegExt";
  if (name.includes("leg curl") || name.includes("hamstring curl")) return "LegCurl";
  if (name.includes("squat") || name.includes("v-squat") || name.includes("lunge") || name.includes("step up")) return "Squat";
  // Tricep kickback must be caught before hip thrust (which also matches "kickback")
  if ((name.includes("tricep") || name.includes("triceps")) && name.includes("kickback")) return "Tricep";
  // Glute/cable kickback: isolation movement, use RearDelt as proxy ratio (light)
  if (name.includes("kickback")) return "RearDelt";
  if (name.includes("hip thrust") || name.includes("glute")) return "HipThrust";
  if (name.includes("incline") && (name.includes("machine") || name.includes("plate") || name.includes("pin") || name.includes("iso"))) return "InclineMachinePress";
  if (name.includes("decline") && (name.includes("machine") || name.includes("plate") || name.includes("pin") || name.includes("iso"))) return "DeclineMachinePress";
  // rear delt before flye: "DB Rear Delt Flye" → RearDelt not Flye
  if (name.includes("rear delt") || name.includes("face pull") || name.includes("reverse pec deck") || name.includes("reverse cable crossover")) return "RearDelt";
  if (name.includes("flye") || name.includes("crossover") || name.includes("pec deck")) return "Flye";
  if (name.includes("bench") || name.includes("chest press") || name.includes("dip")) return "Bench";
  if (name.includes("lat pull") || name.includes("pull up") || name.includes("pulldown") || name.includes("pullover")) return "LatPull";
  if (name.includes("chest supported row") || name.includes("chest-supported row") || name.includes("seal row")) return "ChestSupportedRow";
  if (name.includes("high row")) return "IsoLateralHighRow";
  if (name.includes("low row") && (name.includes("iso") || name.includes("plate") || name.includes("hammer"))) return "IsoLateralLowRow";
  if (name.includes("seated cable row") || name.includes("cable row") || name.includes("seated row") || name.includes("low row")) return "SeatedCableRow";
  if (name.includes("iso-lateral") && name.includes("row")) return "IsoLateralHighRow";
  if (name.includes("row")) return "Row";
  if (name.includes("shrug")) return "Shrug";
  if (name.includes("lat raise") || name.includes("lateral raise") || name.includes("y raise")) return "LatRaise";
  if (name.includes("overhead press") || name.includes("shoulder press") || name.includes("ohp")) return "OHP";
  // curl: check BEFORE incline so "Incline DB Curl" → Bicep not Incline
  if (name.includes("curl") && !name.includes("leg curl") && !name.includes("hamstring")) return "Bicep";
  if (name.includes("incline")) return "Incline";
  if (name.includes("tricep") || name.includes("skullcrusher") || name.includes("pressdown") || name.includes("katana") ||
      (name.includes("overhead") && (name.includes("extension") || name.includes("ext")))) return "Tricep";
  if (name.includes("calf") || name.includes("calves")) return "Calf";
  return "Bench";
}

export interface BiomechanicalResult {
  exerciseName: string;
  targetWeightKg: number;
  hardwareWeightKg: number;
  /** Human-readable meaning of hardwareWeightKg. Plate-loaded values are added plate mass only; iso-lateral values are summed across both sides. */
  hardwareLoadLabel: string;
  /** Plate mass per side, always stored in kg regardless of display unit. */
  platesPerSideKg?: number;
  /** Effective machine resistance after adding the built-in starting resistance. */
  effectiveHardwareWeightKg?: number;
  tareWeightKg: number;
  isPerHand: boolean;
  minHardwareStep: number;
  /** True when the available hardware minimum exceeds the calculated target. */
  hardwareExceedsTarget: boolean;
  displayNote: string;
}
/**
 * Explicit Biomechanical Safety Factor (Conservative Load Margin)
 * Separated from muscle mass rating (SMM).
 * - Novice (<6m): 0.88 heuristic multiplier (not a guarantee of injury prevention)
 * - Beginner (6-12m): 0.92
 * - Intermediate (1-2y): 0.96
 * - Advanced (>2y): 1.00
 * - Injury adjustment: -0.12 for joint/back/knee and -0.08 for wrist
 */
export function getSafetyFactor(
  expMonths: number,
  injuries: string[] = [],
  exerciseCategory?: string
): { safetyFactor: number; reason: string } {
  let factor = 1.0;
  let reason = "ความพร้อมระดับปกติ";

  if (expMonths < 6) {
    factor = 0.88;
    reason = "มือใหม่ (<6 เดือน): เผื่อความปลอดภัย 12% เพื่อปรับตัวต่อฟอร์มการเล่น";
  } else if (expMonths < 12) {
    factor = 0.92;
    reason = "ผู้ฝึกเริ่มต้น (6-12 เดือน): เผื่อความปลอดภัย 8%";
  } else if (expMonths < 24) {
    factor = 0.96;
    reason = "ระดับกลาง (1-2 ปี): เผื่อความปลอดภัย 4%";
  } else {
    factor = 1.00;
    reason = "มีประสบการณ์ (>2 ปี): ใช้ตัวคูณพื้นฐาน 100% แต่ต้องปรับตามความยากจริงของเซต";
  }

  // Injury penalty if active injury matches exercise category
  if (injuries && injuries.length > 0) {
    const hasBack = injuries.includes("lowerBack");
    const hasShoulder = injuries.includes("shoulder");
    const hasKnee = injuries.includes("knee");
    const hasWrist = injuries.includes("wrist");

    const cat = exerciseCategory || "";
    const backSensitive = new Set([
      "Deadlift", "Squat", "RDL", "Row", "ChestSupportedRow",
      "SeatedCableRow", "IsoLateralHighRow", "IsoLateralLowRow",
      "HipThrust", "LegPress", "HipHinge",
    ]);
    const shoulderSensitive = new Set([
      "Bench", "OHP", "Incline", "InclineMachinePress",
      "DeclineMachinePress", "Flye", "LatRaise", "RearDelt",
      "LatPull", "Tricep",
    ]);
    const kneeSensitive = new Set(["Squat", "LegPress", "LegPressCalf", "LegExt", "LegCurl"]);
    const wristSensitive = new Set([
      "Bench", "OHP", "Incline", "InclineMachinePress",
      "DeclineMachinePress", "Bicep", "Tricep", "Row",
      "ChestSupportedRow", "SeatedCableRow", "LatPull",
      "Flye", "RearDelt", "LatRaise", "Shrug",
    ]);

    // Use the actual strength-category IDs emitted by getExerciseStrengthCategory.
    // Otherwise machine-specific categories silently bypass the injury adjustment.
    if (hasBack && backSensitive.has(cat)) {
      factor = Math.max(0.70, factor - 0.12);
      reason += " + ลดน้ำหนักเพิ่ม 12% เนื่องจากมีประวัติเจ็บหลังส่วนล่าง";
    } else if (hasShoulder && shoulderSensitive.has(cat)) {
      factor = Math.max(0.70, factor - 0.12);
      reason += " + ลดน้ำหนักเพิ่ม 12% เนื่องจากมีประวัติเจ็บหัวไหล่";
    } else if (hasKnee && kneeSensitive.has(cat)) {
      factor = Math.max(0.70, factor - 0.12);
      reason += " + ลดน้ำหนักเพิ่ม 12% เนื่องจากมีประวัติเจ็บข้อเข่า";
    } else if (hasWrist && wristSensitive.has(cat)) {
      factor = Math.max(0.75, factor - 0.08);
      reason += " + ลดน้ำหนักเพิ่ม 8% เนื่องจากมีประวัติเจ็บข้อมือ";
    }
  }

  return { safetyFactor: Math.round(factor * 100) / 100, reason };
}

/**
 * Biomechanical Quantization & Hardware snapping
 */
export function quantizeToHardware(
  rawWeightKg: number,
  profile: MechanicalProfile,
  isIsolation: boolean,
  isCable: boolean = false,
  unit: WeightUnit = "kg"
): { hardwareWeightKg: number; platesPerSideKg?: number; effectiveHardwareWeightKg?: number; hardwareExceedsTarget: boolean; displayNote: string } {
  const safeRawKg = Number.isFinite(rawWeightKg) ? Math.max(0, rawWeightKg) : 0;
  const tareKg = Math.max(0, Number.isFinite(profile.tareWeight) ? profile.tareWeight : 0);
  const isLbs = unit === "lbs";
  const toDisplay = (kg: number) => isLbs ? kg * 2.20462262185 : kg;
  const toKg = (value: number) => isLbs ? value * 0.45359237 : value;
  const unitLabel = isLbs ? "lbs" : "kg";
  const rawDisplay = toDisplay(safeRawKg);
  const tareDisplay = toDisplay(tareKg);
  const step = isLbs
    ? (profile.isPerHand && !isCable
      ? (isIsolation ? 2.5 : 5.0) // Dumbbell increments are handled separately from machine stack increments.
      : Math.max(isIsolation ? 2.5 : 5.0, Math.round((profile.minHardwareStep || 2.5) * 2.20462262185 * 10) / 10))
    : Math.max(0.1, profile.minHardwareStep || 2.5);
  const roundDisplay = (v: number) => Math.round(v * 100) / 100;
  const warning = (actualKg: number) => actualKg > safeRawKg + 0.05
    ? " ⚠️ น้ำหนักต่ำสุดของอุปกรณ์สูงกว่าค่าประเมิน ห้ามฝืนใช้โหลดนี้ ให้เลือกอุปกรณ์/โหลดที่เบากว่า หรือประเมินใหม่"
    : "";

  // Plate-loaded machines: report added plates as the hardware value, and keep
  // starting resistance separate so the app can calculate effective total load.
  if (profile.isPlateLoaded) {
    const targetDisplay = rawDisplay;
    const startDisplay = tareDisplay;
    const stepDisplay = isLbs ? (profile.minHardwareStep * 2.20462262185) : Math.max(0.1, profile.minHardwareStep);
    const addedTargetDisplay = Math.max(0, targetDisplay - startDisplay);
    const snappedPlatesDisplay = Math.floor((addedTargetDisplay + 1e-9) / stepDisplay) * stepDisplay;
    const effectiveDisplay = startDisplay + snappedPlatesDisplay;
    const platesKg = toKg(snappedPlatesDisplay);
    const effectiveKg = toKg(effectiveDisplay);
    const exceeds = effectiveKg > safeRawKg + 0.05;
    // UI/logging convention: hardwareWeightKg is total added plate mass across both sides.
    // The target and tare are per-side for iso-lateral machines, so report bilateral totals separately.
    const displayedPlateTotal = profile.isPerHand ? snappedPlatesDisplay * 2 : snappedPlatesDisplay;
    const displayedEffectiveTotal = profile.isPerHand ? effectiveDisplay * 2 : effectiveDisplay;
    const displayedStartingTotal = profile.isPerHand ? startDisplay * 2 : startDisplay;
    const note = profile.isPerHand
      ? (snappedPlatesDisplay > 0
        ? `ใส่เพลตข้างละ ${roundDisplay(snappedPlatesDisplay)} ${unitLabel} ต่อข้าง (เพลตรวมสองข้าง ${roundDisplay(displayedPlateTotal)} ${unitLabel}) + แรงต้านเริ่มต้นประมาณ ${roundDisplay(startDisplay)} ${unitLabel}/ข้าง (รวม ${roundDisplay(displayedStartingTotal)} ${unitLabel}) = โหลดรวมโดยประมาณ ${roundDisplay(displayedEffectiveTotal)} ${unitLabel}${warning(effectiveKg)}`
        : `ไม่ต้องใส่เพลต; แรงต้านเริ่มต้นประมาณ ${roundDisplay(startDisplay)} ${unitLabel}/ข้าง (รวม ${roundDisplay(displayedStartingTotal)} ${unitLabel}) = โหลดรวมโดยประมาณ ${roundDisplay(displayedEffectiveTotal)} ${unitLabel}${warning(effectiveKg)}`)
      : (snappedPlatesDisplay > 0
        ? `ใส่เพลตเพิ่ม ${roundDisplay(snappedPlatesDisplay)} ${unitLabel} (ไม่รวมแรงต้านเครื่อง) + แรงต้านเริ่มต้นประมาณ ${roundDisplay(startDisplay)} ${unitLabel} = โหลดรวมโดยประมาณ ${roundDisplay(effectiveDisplay)} ${unitLabel}${warning(effectiveKg)}`
        : `ไม่ต้องใส่เพลต; แรงต้านเริ่มต้นประมาณ ${roundDisplay(startDisplay)} ${unitLabel} = โหลดรวมโดยประมาณ ${roundDisplay(effectiveDisplay)} ${unitLabel}${warning(effectiveKg)}`);
    return {
      hardwareWeightKg: Math.round(toKg(displayedPlateTotal) * 100) / 100,
      platesPerSideKg: profile.isPerHand ? Math.round(platesKg * 100) / 100 : undefined,
      effectiveHardwareWeightKg: Math.round(toKg(displayedEffectiveTotal) * 100) / 100,
      hardwareExceedsTarget: exceeds,
      displayNote: note,
    };
  }

  // Barbell / Smith: total load includes the bar. Plates are always reported in kg internally.
  if (tareKg > 0 && !profile.isPerHand) {
    if (safeRawKg <= tareKg) {
      const exceeds = tareKg > safeRawKg + 0.05;
      return {
        hardwareWeightKg: tareKg,
        platesPerSideKg: 0,
        hardwareExceedsTarget: exceeds,
        displayNote: `คานเปล่า ${roundDisplay(tareDisplay)} ${unitLabel} (ไม่ต้องใส่แผ่น)${warning(tareKg)}`,
      };
    }

    const plateStepDisplay = isLbs ? 2.5 : Math.max(0.1, (profile.minHardwareStep || 2.5) / 2);
    const addedDisplay = Math.max(0, rawDisplay - tareDisplay);
    const platesPerSideDisplay = Math.floor((addedDisplay / 2 + 1e-9) / plateStepDisplay) * plateStepDisplay;
    const totalDisplay = tareDisplay + platesPerSideDisplay * 2;
    const actualKg = toKg(totalDisplay);
    const platesPerSideKg = toKg(platesPerSideDisplay);
    const exceeds = actualKg > safeRawKg + 0.05;

    return {
      hardwareWeightKg: Math.round(actualKg * 10) / 10,
      platesPerSideKg: Math.round(platesPerSideKg * 100) / 100,
      hardwareExceedsTarget: exceeds,
      displayNote: platesPerSideDisplay > 0
        ? `ใส่แผ่นข้างละ ${roundDisplay(platesPerSideDisplay)} ${unitLabel} (รวมคาน ${roundDisplay(totalDisplay)} ${unitLabel})${warning(actualKg)}`
        : `คานเปล่า ${roundDisplay(tareDisplay)} ${unitLabel} (ไม่ต้องใส่แผ่น)${warning(actualKg)}`,
    };
  }

  // Machines, cable stacks and dumbbells: round DOWN to avoid recommending more than the target.
  const minimumDisplay = Math.max(step, isIsolation ? (isLbs ? 5 : 2.5) : step);
  const snappedDisplay = Math.max(minimumDisplay, Math.floor((rawDisplay + 1e-9) / step) * step);
  const actualKg = Math.round(toKg(snappedDisplay) * 10) / 10;
  const exceeds = actualKg > safeRawKg + 0.05;

  let displayNote: string;
  if (isCable) {
    displayNote = `เสียบสลักพิน ${roundDisplay(snappedDisplay)} ${unitLabel}${profile.isPerHand ? " ต่อฝั่ง" : ""} (รอกทด ${profile.pulleyRatio}:1)`;
  } else if (profile.isPerHand) {
    displayNote = `ดัมเบล/โหลด ${roundDisplay(snappedDisplay)} ${unitLabel} ต่อข้าง`;
  } else if (profile.pulleyRatio > 1) {
    displayNote = `เสียบสลักพิน ${roundDisplay(snappedDisplay)} ${unitLabel} (รอกทด ${profile.pulleyRatio}:1)`;
  } else {
    displayNote = `แผ่น/สลักน้ำหนัก ${roundDisplay(snappedDisplay)} ${unitLabel}`;
  }

  return {
    hardwareWeightKg: actualKg,
    hardwareExceedsTarget: exceeds,
    displayNote: displayNote + warning(actualKg),
  };
}
/**
 * Master Calculation Formula:
 * Force = BW * S_ratio * E_exp * R_rep * G_goal * M_musc * Safety_factor
 * If isPerHand: Force = (Force / 2) * (bilateralDeficit ? 0.88 : 1.0)
 * W_pin = Force * leverageRatio * camModifier * (selectedPulleyRatio / (cos(rad(angleThetaDeg)) + frictionCoeff))
 * Note: When pulley ratio is 2:1, mechanical advantage is 2, so to generate force F, the pin weight must be F * 2.
 * When pulley ratio is 1:1 (direct), pin weight must be F * 1.
 */
export function calculatePrescriptionWeight(
  exerciseName: string,
  load: string,
  repsStr: string,
  userProfile: UserProfile,
  mMusc: number = 1.0,
  machineTag: string = "",
  pulleyRatioOverride?: number,
  safetyFactorOverride?: number,
  startingResistanceOverrideKg?: number
): BiomechanicalResult {
  const bw = userProfile.weightKg;
  const isFemale = userProfile.gender === "female";
  const e_exp = getExperienceModifier(userProfile.expMonths).modifier;
  const r_rep = getRepsModifier(repsStr);
  const g_goal = getGoalModifier(userProfile.goal);
  const m_musc = mMusc;
  const cat = getExerciseStrengthCategory(exerciseName);

  // Safety factor separated from muscle mass modifier
  const computedSafety = getSafetyFactor(userProfile.expMonths, userProfile.injuries, cat).safetyFactor;
  const safety_factor = safetyFactorOverride !== undefined && Number.isFinite(safetyFactorOverride)
    ? Math.min(1, Math.max(0.5, safetyFactorOverride))
    : computedSafety;

  const combinedText = `${exerciseName} ${machineTag}`.toLowerCase();
  const isRowChestOrPulldown =
    combinedText.includes("row") ||
    combinedText.includes("press") ||
    combinedText.includes("bench") ||
    combinedText.includes("pulldown") ||
    combinedText.includes("pull down");

  const isPlateLoadedSpecialtyMachine = load === "specialty" && ["hack squat", "belt squat", "pendulum squat", "v-squat"].some((name) => combinedText.includes(name));
  const isFreeWeightLoad = ["barbell", "dumbbell", "smith", "plate-loaded"].includes(load) || isPlateLoadedSpecialtyMachine;

  // Check if we should use specialized resolveMechanicalProfile
  const mechProfile = resolveMechanicalProfile(exerciseName, machineTag);

  if (!isFreeWeightLoad && isRowChestOrPulldown && mechProfile.baseRatio.male !== 0.40) {
    const baseRatio = isFemale ? mechProfile.baseRatio.female : mechProfile.baseRatio.male;
    const f_physio = bw * baseRatio * e_exp * r_rep * mechProfile.stabilityFactor * g_goal * m_musc * safety_factor;
    const selectedPulleyRatio = Number.isFinite(pulleyRatioOverride) && pulleyRatioOverride! > 0
      ? Math.min(4, Math.max(1, pulleyRatioOverride!))
      : mechProfile.pulleyRatio;
    // Physical pin load = physiological force * pulley mechanical advantage ratio
    const rawWeightKg = f_physio * selectedPulleyRatio;

    const unit = userProfile.preferredWeightUnit || "kg";
    const isIsolation = cat === "LatRaise" || cat === "Flye" || cat === "Bicep" || cat === "Tricep" || cat === "RearDelt";
    const quantProfile: MechanicalProfile = {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: selectedPulleyRatio,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: mechProfile.isPerHand,
      bilateralDeficit: false,
      minHardwareStep: 2.5,
      tareWeight: 0,
    };
    const quantized = quantizeToHardware(rawWeightKg, quantProfile, isIsolation, load === "cable", unit);

    return {
      exerciseName,
      targetWeightKg: Math.round(rawWeightKg * 10) / 10,
      hardwareWeightKg: quantized.hardwareWeightKg,
      hardwareLoadLabel: load === "barbell" ? "น้ำหนักรวมคาน" : load === "smith" ? "น้ำหนักรวมบาร์สมิท" : load === "dumbbell" ? "น้ำหนักดัมเบลต่อข้าง" : (load === "plate-loaded" || mechProfile.isPlateLoaded) ? (mechProfile.isPerHand ? "เพลตรวมสองข้าง (ไม่รวมแรงต้านเครื่อง)" : "เพลตที่ใส่เพิ่ม (ไม่รวมแรงต้านเครื่อง)") : load === "cable" ? (mechProfile.isPerHand ? "น้ำหนักพินต่อฝั่ง" : "น้ำหนักพิน") : "น้ำหนักเครื่อง",
      platesPerSideKg: quantized.platesPerSideKg,
      effectiveHardwareWeightKg: quantized.effectiveHardwareWeightKg,
      hardwareExceedsTarget: quantized.hardwareExceedsTarget,
      tareWeightKg: 0,
      isPerHand: mechProfile.isPerHand,
      minHardwareStep: 2.5,
      displayNote: quantized.displayNote,
    };
  }

  // Standard Fallback for Compound Barbell / Dumbbell / Squat / Leg Press etc.
  const ratioEntry = STRENGTH_RATIOS[cat] || { male: 0.8, female: 0.5 };
  const s_ratio = isFemale ? ratioEntry.female : ratioEntry.male;

  let force = bw * s_ratio * e_exp * r_rep * g_goal * m_musc * safety_factor;

  const profile = getDefaultMechanicalProfile(load, exerciseName, pulleyRatioOverride);
  // Optional user-provided machine resistance overrides the app's category/model estimate.
  // Only apply it to plate-loaded equipment; selectorized stack values are already the selected load.
  if (profile.isPlateLoaded && startingResistanceOverrideKg !== undefined && Number.isFinite(startingResistanceOverrideKg) && startingResistanceOverrideKg >= 0) {
    profile.tareWeight = startingResistanceOverrideKg;
  }

  if (profile.isPerHand) {
    force = (force / 2) * (profile.bilateralDeficit ? 0.88 : 1.0);
  }

  const lowerName = exerciseName.toLowerCase();
  const radAngle = (profile.angleThetaDeg * Math.PI) / 180;
  const denominator = Math.cos(radAngle) + profile.frictionCoeff;
  const fallbackPulleyRatio = Number.isFinite(profile.pulleyRatio) && profile.pulleyRatio > 0
    ? Math.min(4, Math.max(1, profile.pulleyRatio))
    : 1;
  const selectedPulleyRatio = Number.isFinite(pulleyRatioOverride) && pulleyRatioOverride! > 0
    ? Math.min(4, Math.max(1, pulleyRatioOverride!))
    : fallbackPulleyRatio;
  let rawWeightKg = force * profile.leverageRatio * profile.camModifier * (selectedPulleyRatio / denominator);

  // Biomechanical Safety Clamp: Cable Row / Seated Row max baseline
  if (cat === "SeatedCableRow" || lowerName.includes("cable row") || lowerName.includes("seated row")) {
    const maxCableRowKg = bw * 0.55 * safety_factor;
    if (rawWeightKg > maxCableRowKg) {
      rawWeightKg = maxCableRowKg;
    }
  }

  const isIsolation = cat === "LatRaise" || cat === "Flye" || cat === "Bicep" || cat === "Tricep" || cat === "RearDelt" || cat === "LegExt" || cat === "LegCurl" || cat === "SeatedCalf";

  const quantizeProfile = { ...profile, pulleyRatio: selectedPulleyRatio };
  const unit = userProfile.preferredWeightUnit || "kg";
  const quantized = quantizeToHardware(rawWeightKg, quantizeProfile, isIsolation, load === "cable", unit);

  return {
    exerciseName,
    targetWeightKg: Math.round(rawWeightKg * 10) / 10,
    hardwareWeightKg: quantized.hardwareWeightKg,
    hardwareLoadLabel: load === "barbell" ? "น้ำหนักรวมคาน" : load === "smith" ? "น้ำหนักรวมบาร์สมิท" : load === "dumbbell" ? "น้ำหนักดัมเบลต่อข้าง" : (load === "plate-loaded" || profile.isPlateLoaded) ? (profile.isPerHand ? "เพลตรวมสองข้าง (ไม่รวมแรงต้านเครื่อง)" : "เพลตที่ใส่เพิ่ม (ไม่รวมแรงต้านเครื่อง)") : load === "cable" ? (profile.isPerHand ? "น้ำหนักพินต่อฝั่ง" : "น้ำหนักพิน") : load === "selectorized" ? "น้ำหนักสลักพิน" : "น้ำหนักอุปกรณ์",
    platesPerSideKg: quantized.platesPerSideKg,
    effectiveHardwareWeightKg: quantized.effectiveHardwareWeightKg,
    hardwareExceedsTarget: quantized.hardwareExceedsTarget,
    tareWeightKg: profile.tareWeight,
    isPerHand: profile.isPerHand,
    minHardwareStep: profile.minHardwareStep,
    displayNote: quantized.displayNote,
  };
}

/**
 * Injury Exercise Substitutions Map & Warnings
 */
export const INJURY_RULES: Record<string, { label: string; warns: string[]; substitutes: Record<string, string> }> = {
  lowerBack: {
    label: "หลังล่าง / หมอนรองกระดูก",
    warns: ["Deadlift", "Romanian Deadlift RDL", "Barbell Back Squat", "Barbell Bent-Over Row"],
    substitutes: {
      "Deadlift": "Seated Hamstring Curl",
      "Romanian Deadlift RDL": "Lying Leg Curl",
      "Barbell Back Squat": "Belt Squat",
      "Barbell Bent-Over Row": "Chest Supported Row",
    },
  },
  shoulder: {
    label: "หัวไหล่ / เอ็นข้อต่อ",
    warns: ["Barbell Overhead Press", "Incline Barbell Bench Press", "Dips", "Behind Back Cable Lat Raise"],
    substitutes: {
      "Barbell Overhead Press": "Machine Shoulder Press",
      "Incline Barbell Bench Press": "Incline Machine Bench",
      "Weighted Dip": "Pin-Loaded Chest Press",
      "Behind Back Cable Lat Raise": "Cable Lat Raise",
    },
  },
  knee: {
    label: "ข้อเข่า",
    warns: ["Barbell Back Squat", "Walking Lunges", "Sissy Squat", "Leg Extension"],
    substitutes: {
      "Barbell Back Squat": "Belt Squat",
      "Lunges": "Leg Press",
      "Sissy Squat": "Reverse Nordic",
    },
  },
  wrist: {
    label: "ข้อมือ",
    warns: ["Barbell Skullcrusher", "Straight Bar Curl", "Bench Press"],
    substitutes: {
      "Barbell Skullcrusher": "Triceps Pressdown Bar",
      "EZ Bar Curl": "DB Hammer Curl",
    },
  },
};

export type WarmupRecommendation = {
  type: "full" | "acclimation" | "skip";
  headline: string;
  note: string;
  steps: { label: string; weight: number; reps: string; note: string }[];
};

export function getIntelligentWarmup(
  currentExercise: { id: string; name: string; group: string; movement: string; muscles: string[]; warmup: boolean; load?: string },
  exerciseIndex: number,
  allDayExercises: { id: string; name: string; group: string; movement: string; muscles: string[]; warmup: boolean; load?: string }[],
  workingWeight: number,
  effectiveUnit: WeightUnit,
  effectiveLoad: string
): WarmupRecommendation {
  const movement = currentExercise.movement.toLowerCase();
  const isIsolation =
    currentExercise.group === "Arms" ||
    currentExercise.group === "Abs & Calves" ||
    movement.includes("isolation") ||
    movement.includes("raise") ||
    movement.includes("curl") ||
    movement.includes("flye") ||
    movement.includes("pressdown") ||
    movement.includes("ext");

  if (!currentExercise.warmup || workingWeight <= 0) {
    return {
      type: "skip",
      headline: "ไม่ต้องเพิ่มเซตวอร์มตามแผน",
      note: "เริ่มด้วยเซตเบาและควบคุมฟอร์มก่อนเพิ่มโหลด หากมีอาการเจ็บให้หยุดและอย่าฝืน",
      steps: [],
    };
  }

  if (isIsolation) {
    return {
      type: "skip",
      headline: "ท่า Isolation: วอร์มตามความพร้อม",
      note: "โดยทั่วไปไม่จำเป็นต้องวอร์มหลายเซต แต่ควรเริ่มเบาและค่อยเพิ่มโหลด หากข้อต่อไม่พร้อมหรือมีอาการเจ็บ ให้หยุดและอย่าฝืน",
      steps: [],
    };
  }

  const currentMuscles = currentExercise.muscles.map((m) => m.toLowerCase());
  const hasPriorCompoundSameMuscle = allDayExercises.slice(0, exerciseIndex).some((prev) => {
    const prevMovement = prev.movement.toLowerCase();
    const prevIsCompound =
      prevMovement.includes("press") ||
      prevMovement.includes("row") ||
      prevMovement.includes("pull") ||
      prevMovement.includes("squat") ||
      prevMovement.includes("hinge");
    return prevIsCompound && prev.muscles.some((m) => currentMuscles.includes(m.toLowerCase()));
  });

  const step = effectiveUnit === "kg" ? 2.5 : 5;
  const snap = (w: number) => Math.max(step, Math.floor((Math.max(0, w) + 1e-9) / step) * step);
  if (workingWeight <= step) {
    return {
      type: "skip",
      headline: "ไม่มีโหลดเบาพอสำหรับเซตวอร์ม",
      note: "ขั้นน้ำหนักต่ำสุดเท่ากับหรือสูงกว่าน้ำหนักทำงานแล้ว อย่าเพิ่มโหลดเพื่อวอร์ม ให้เริ่มเบาอย่างระมัดระวังหรือเลือกอุปกรณ์ที่ปรับได้ละเอียดกว่า",
      steps: [],
    };
  }

  if (hasPriorCompoundSameMuscle) {
    return {
      type: "acclimation",
      headline: "🔥 กล้ามเนื้ออุ่นแล้ว (Acclimation Set)",
      note: "เพิ่งผ่านท่าก่อนหน้ามา แนะนำ 1 เซตสั้นๆ เพื่อจับจังหวะมุมเครื่อง",
      steps: [
        {
          label: "Acclimation",
          weight: Math.min(snap(workingWeight * 0.65), snap(workingWeight * 0.75)),
          reps: "2–3",
          note: "จับจังหวะ ไม่ล้า",
        },
      ],
    };
  }

  const isBarbell = effectiveLoad === "barbell";
  const barWeight = effectiveUnit === "kg" ? 20 : 45;
  const steps: { label: string; weight: number; reps: string; note: string }[] = [];

  // For Machine/Selectorized/Dumbbells, strictly generate maximum 2 warmup sets (never exceed 75%)
  const isMachineOrDumbbell =
    effectiveLoad === "selectorized" ||
    effectiveLoad === "plate-loaded" ||
    effectiveLoad === "cable" ||
    effectiveLoad === "dumbbell" ||
    effectiveLoad === "smith" ||
    !isBarbell;

  if (isMachineOrDumbbell) {
    steps.push({
      label: "W1",
      weight: Math.min(snap(workingWeight * 0.45), snap(workingWeight * 0.75)),
      reps: "8",
      note: "หมุนเวียนเลือดและจับจังหวะ",
    });
    steps.push({
      label: "W2",
      weight: Math.min(snap(workingWeight * 0.65), snap(workingWeight * 0.75)),
      reps: "3",
      note: "เตรียมกล้ามเนื้อก่อนยกจริง",
    });

    return {
      type: "full",
      headline: "⚡ ลำดับ Warmup แนะนำ (เครื่อง/ดัมเบล 1-2 เซต)",
      note: "เตรียมข้อต่อและมุมการเคลื่อนไหว ไม่ให้กล้ามเนื้อล้าก่อนเซตจริง",
      steps,
    };
  }

  // Barbell compound warmups must never prescribe a total load below the bar's tare.
  if (isBarbell && workingWeight < barWeight) {
    return {
      type: "skip",
      headline: "น้ำหนักทำงานต่ำกว่าคานเปล่า",
      note: "คานเปล่าหนักกว่าค่าที่คำนวณไว้ เลือกบาร์ที่เบากว่าหรืออุปกรณ์อื่น อย่าฝืนใช้คานมาตรฐาน",
      steps: [],
    };
  }

  if (isBarbell) {
    steps.push({ label: "W1 (คานเปล่า)", weight: barWeight, reps: "5–8", note: "คานเปล่าเพื่อเช็กฟอร์ม" });
    if (workingWeight > barWeight * 1.3) {
      const w2 = Math.min(workingWeight, Math.max(barWeight, snap(workingWeight * 0.6)));
      const w3 = Math.min(workingWeight, Math.max(barWeight, snap(workingWeight * 0.8)));
      if (w2 > barWeight) steps.push({ label: "W2", weight: w2, reps: "5–6", note: "ปรับฟอร์ม" });
      if (w3 > w2) steps.push({ label: "W3", weight: w3, reps: "2–3", note: "เตรียมก่อนเซตทำงาน" });
      if (workingWeight >= (effectiveUnit === "kg" ? 75 : 165)) {
        const w4 = Math.min(workingWeight, Math.max(barWeight, snap(workingWeight * 0.9)));
        if (w4 > w3) steps.push({ label: "W4", weight: w4, reps: "1", note: "เช็กความพร้อมด้วยโหลดใกล้เคียง" });
      }
    }
  } else {
    steps.push({ label: "W1", weight: Math.min(workingWeight, snap(workingWeight * 0.4)), reps: "8–10", note: "หมุนเวียนเลือด" });
    const w2 = Math.min(workingWeight, snap(workingWeight * 0.6));
    const w3 = Math.min(workingWeight, snap(workingWeight * 0.8));
    if (w2 > steps[0].weight) steps.push({ label: "W2", weight: w2, reps: "5–6", note: "ปรับฟอร์ม" });
    if (w3 > (steps[steps.length - 1]?.weight ?? 0)) steps.push({ label: "W3", weight: w3, reps: "2–3", note: "เตรียมก่อนเซตทำงาน" });
  }

  return {
    type: "full",
    headline: "⚡ ลำดับ Warmup แนะนำ (ท่าหลักแรก)",
    note: "เตรียมข้อต่อและระบบประสาทสั่งการก่อนยกเซตจริง",
    steps,
  };
}
