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
  OHP: { male: 0.68, female: 0.42 },
  LatRaise: { male: 0.18, female: 0.12 },
  RearDelt: { male: 0.30, female: 0.20 },
  Shrug: { male: 1.40, female: 0.90 },
  Bicep: { male: 0.38, female: 0.24 },
  Tricep: { male: 0.42, female: 0.28 },
  Calf: { male: 1.25, female: 0.85 },
  HipThrust: { male: 1.60, female: 1.20 },
};

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
export interface MechanicalProfile {
  leverageRatio: number;
  camModifier: number;
  pulleyRatio: number;
  frictionCoeff: number;
  angleThetaDeg: number;
  isPerHand: boolean;
  bilateralDeficit: boolean;
  minHardwareStep: number;
  tareWeight: number; // e.g. barbell 20kg, smith 11kg
}

export function getDefaultMechanicalProfile(load: string, exerciseName: string): MechanicalProfile {
  const lowerName = exerciseName.toLowerCase();

  // Special Overrides first:
  if (lowerName.includes("45° leg press") || lowerName.includes("leg press")) {
    // 45° Leg press: leverageRatio 1.414 (hypotenuse force component = 1/sin(45) or load effective ratio 1.414)
    // angleThetaDeg = 0 so cos(0)=1, avoiding double angle division
    return {
      leverageRatio: 1.414,
      camModifier: 1.0,
      pulleyRatio: 1.0,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: false,
      bilateralDeficit: false,
      minHardwareStep: 5.0,
      tareWeight: 0,
    };
  }

  if (
    lowerName.includes("cable lat raise") ||
    lowerName.includes("behind back cable") ||
    lowerName.includes("cable y raise") ||
    lowerName.includes("cable flye") ||
    lowerName.includes("cable crossover") ||
    lowerName.includes("pec flye") ||
    lowerName.includes("overhead cable ext") ||
    lowerName.includes("triceps pressdown") ||
    lowerName.includes("cable rope hammer") ||
    lowerName.includes("bayesian curl") ||
    lowerName.includes("katana")
  ) {
    // Cable 2:1 (dual pulley / crossover towers)
    const isSingleArmOrSide = true;
    return {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: 2.0,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: isSingleArmOrSide,
      bilateralDeficit: false, // Independent cable stack per arm
      minHardwareStep: 2.5,
      tareWeight: 0,
    };
  }

  if (
    lowerName.includes("lat pull down") ||
    lowerName.includes("lat pull") ||
    lowerName.includes("cable row") ||
    lowerName.includes("cable crunch") ||
    lowerName.includes("straight arm pulldown") ||
    lowerName.includes("cable lat prayers")
  ) {
    // Cable 1:1 (single stack overhead / low row)
    return {
      leverageRatio: 1.0,
      camModifier: 1.0,
      pulleyRatio: 1.0,
      frictionCoeff: 0.05,
      angleThetaDeg: 0,
      isPerHand: false,
      bilateralDeficit: false,
      minHardwareStep: 5.0,
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
        minHardwareStep: 2.5,
        tareWeight: 20.0, // standard Olympic bar 20kg
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
        minHardwareStep: 2.5,
        tareWeight: 11.0, // counterbalanced smith bar ~11kg
      };
    case "plate-loaded":
      return {
        leverageRatio: 1.15,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.05,
        angleThetaDeg: 0,
        isPerHand: true, // plate loaded levers usually per side
        bilateralDeficit: false,
        minHardwareStep: 5.0,
        tareWeight: 0,
      };
    case "selectorized":
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 1.0,
        frictionCoeff: 0.10,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: 5.0,
        tareWeight: 0,
      };
    case "cable":
      return {
        leverageRatio: 1.0,
        camModifier: 1.0,
        pulleyRatio: 2.0,
        frictionCoeff: 0.05,
        angleThetaDeg: 0,
        isPerHand: false,
        bilateralDeficit: false,
        minHardwareStep: 2.5,
        tareWeight: 0,
      };
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
  if (name.includes("leg press")) return "LegPress";
  if (name.includes("leg extension")) return "LegExt";
  if (name.includes("leg curl") || name.includes("hamstring curl")) return "LegCurl";
  if (name.includes("squat") || name.includes("v-squat") || name.includes("lunge") || name.includes("step up")) return "Squat";
  if (name.includes("hip thrust") || name.includes("kickback") || name.includes("glute")) return "HipThrust";
  if (name.includes("incline")) return "Incline";
  if (name.includes("flye") || name.includes("crossover") || name.includes("pec deck")) return "Flye";
  if (name.includes("bench") || name.includes("chest press") || name.includes("dip")) return "Bench";
  if (name.includes("lat pull") || name.includes("pull up") || name.includes("pulldown") || name.includes("pullover")) return "LatPull";
  if (name.includes("row")) return "Row";
  if (name.includes("shrug")) return "Shrug";
  if (name.includes("lat raise") || name.includes("lateral raise") || name.includes("y raise")) return "LatRaise";
  if (name.includes("rear delt") || name.includes("face pull")) return "RearDelt";
  if (name.includes("overhead press") || name.includes("shoulder press") || name.includes("ohp")) return "OHP";
  if (name.includes("curl")) return "Bicep";
  if (name.includes("tricep") || name.includes("skullcrusher") || name.includes("pressdown") || name.includes("katana")) return "Tricep";
  if (name.includes("calf") || name.includes("calves")) return "Calf";
  return "Bench";
}

export interface BiomechanicalResult {
  exerciseName: string;
  targetWeightKg: number;
  hardwareWeightKg: number;
  platesPerSideKg?: number;
  tareWeightKg: number;
  isPerHand: boolean;
  minHardwareStep: number;
  displayNote: string;
}

/**
 * Biomechanical Quantization & Hardware snapping
 */
export function quantizeToHardware(
  rawWeightKg: number,
  profile: MechanicalProfile,
  isIsolation: boolean
): { hardwareWeightKg: number; platesPerSideKg?: number; displayNote: string } {
  const tare = profile.tareWeight;
  const step = profile.minHardwareStep;

  // Barbell logic:
  if (tare > 0 && !profile.isPerHand) {
    if (rawWeightKg <= tare) {
      return {
        hardwareWeightKg: tare,
        platesPerSideKg: 0,
        displayNote: `คานเปล่า ${tare} kg (ไม่ต้องใส่แผ่น)`,
      };
    }

    const addedNet = rawWeightKg - tare;
    // Two-sided symmetry check: plates per side must snap to step
    const platesPerSideRaw = addedNet / 2;
    const platesPerSideSnapped = Math.max(0, Math.floor(platesPerSideRaw / step) * step);
    const totalWeight = tare + platesPerSideSnapped * 2;

    if (platesPerSideSnapped === 0) {
      return {
        hardwareWeightKg: tare,
        platesPerSideKg: 0,
        displayNote: `คานเปล่า ${tare} kg (ไม่ต้องใส่แผ่น)`,
      };
    }

    return {
      hardwareWeightKg: totalWeight,
      platesPerSideKg: platesPerSideSnapped,
      displayNote: `ใส่แผ่นข้างละ ${platesPerSideSnapped} kg (รวมคาน ${totalWeight} kg)`,
    };
  }

  // Dumbbell / Cable / Machine logic:
  let snapped = Math.round(rawWeightKg / step) * step;

  // Isolation minimum hardware floor: 2.0 - 2.5 kg
  if (isIsolation && profile.isPerHand) {
    snapped = Math.max(step <= 1.25 ? 2.5 : step, snapped);
  } else if (isIsolation) {
    snapped = Math.max(2.5, snapped);
  } else {
    snapped = Math.max(step, snapped);
  }

  snapped = Math.round(snapped * 100) / 100;

  if (profile.isPerHand) {
    return {
      hardwareWeightKg: snapped,
      displayNote: `ดัมเบล ${snapped} kg ต่อข้าง`,
    };
  }

  if (profile.pulleyRatio > 1.0) {
    return {
      hardwareWeightKg: snapped,
      displayNote: `เสียบสลักพิน ${snapped} kg (รอกทด ${profile.pulleyRatio}:1)`,
    };
  }

  return {
    hardwareWeightKg: snapped,
    displayNote: `แผ่น/สลักน้ำหนัก ${snapped} kg`,
  };
}

/**
 * Master Calculation Formula:
 * Force = BW * S_ratio * E_exp * R_rep * G_goal * M_musc
 * If isPerHand: Force = (Force / 2) * (bilateralDeficit ? 0.88 : 1.0)
 * W_raw = Force * leverageRatio * camModifier * (pulleyRatio / (cos(rad(angleThetaDeg)) + frictionCoeff))
 */
export function calculatePrescriptionWeight(
  exerciseName: string,
  load: string,
  repsStr: string,
  userProfile: UserProfile,
  mMusc: number = 1.0
): BiomechanicalResult {
  const bw = userProfile.weightKg;
  const cat = getExerciseStrengthCategory(exerciseName);
  const ratioEntry = STRENGTH_RATIOS[cat] || { male: 0.8, female: 0.5 };
  const s_ratio = userProfile.gender === "female" ? ratioEntry.female : ratioEntry.male;

  const e_exp = getExperienceModifier(userProfile.expMonths).modifier;
  const r_rep = getRepsModifier(repsStr);
  const g_goal = getGoalModifier(userProfile.goal);
  // Use provided muscle mass modifier (default 1.0) or compute if not supplied
  const m_musc = mMusc;

  let force = bw * s_ratio * e_exp * r_rep * g_goal * m_musc;

  const profile = getDefaultMechanicalProfile(load, exerciseName);

  if (profile.isPerHand) {
    force = (force / 2) * (profile.bilateralDeficit ? 0.88 : 1.0);
  }

  const radAngle = (profile.angleThetaDeg * Math.PI) / 180;
  const denominator = Math.cos(radAngle) + profile.frictionCoeff;
  const rawWeightKg = force * profile.leverageRatio * profile.camModifier * (profile.pulleyRatio / denominator);

  const isIsolation = cat === "LatRaise" || cat === "Flye" || cat === "Bicep" || cat === "Tricep" || cat === "RearDelt" || cat === "LegExt" || cat === "LegCurl";

  const quantized = quantizeToHardware(rawWeightKg, profile, isIsolation);

  return {
    exerciseName,
    targetWeightKg: Math.round(rawWeightKg * 10) / 10,
    hardwareWeightKg: quantized.hardwareWeightKg,
    platesPerSideKg: quantized.platesPerSideKg,
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
