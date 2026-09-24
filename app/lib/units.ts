// app/lib/units.ts
"use client";

export type WeightUnit = "kg" | "lbs";

export const LBS_PER_KG = 2.20462262185;
export const KG_PER_LBS = 0.45359237;

export const MACHINE_UNITS_KEY = "haitMachineUnitsV1";
export const EXERCISE_UNITS_KEY = "haitExerciseUnitsV1";

export function readStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getMachineUnitsMap(): Record<string, WeightUnit> {
  return readStorageJson<Record<string, WeightUnit>>(MACHINE_UNITS_KEY, {});
}

export function saveMachineUnit(machineKey: string, unit: WeightUnit) {
  const current = getMachineUnitsMap();
  current[machineKey] = unit;
  writeStorageJson(MACHINE_UNITS_KEY, current);
}

export function getExerciseUnitsMap(): Record<string, WeightUnit> {
  return readStorageJson<Record<string, WeightUnit>>(EXERCISE_UNITS_KEY, {});
}

export function saveExerciseUnit(exerciseName: string, unit: WeightUnit) {
  const current = getExerciseUnitsMap();
  current[exerciseName] = unit;
  writeStorageJson(EXERCISE_UNITS_KEY, current);
}

/**
 * Unit Hierarchy Priority:
 * 1. Exercise Override (`haitExerciseUnitsV1[exerciseName]`)
 * 2. Machine Mapping (`haitMachineUnitsV1[machineTag]`)
 * 3. Global Preferred Unit (from Profile / default 'kg')
 */
export function resolveEffectiveUnit(
  exerciseName: string,
  machineTag?: string,
  globalPreferredUnit: WeightUnit = "kg",
  exerciseUnitsOverride?: Record<string, WeightUnit>,
  machineUnitsOverride?: Record<string, WeightUnit>
): WeightUnit {
  const exerciseMap = exerciseUnitsOverride ?? getExerciseUnitsMap();
  if (exerciseMap && exerciseMap[exerciseName]) {
    return exerciseMap[exerciseName];
  }

  const trimmedMachine = (machineTag ?? "").trim();
  if (trimmedMachine) {
    const machineMap = machineUnitsOverride ?? getMachineUnitsMap();
    if (machineMap && machineMap[trimmedMachine]) {
      return machineMap[trimmedMachine];
    }
  }

  return globalPreferredUnit || "kg";
}

/**
 * Snap steps:
 * - kg: compound 2.5, iso 1.25
 * - lbs: compound 5, iso 2.5
 */
export function getSnapStep(unit: WeightUnit, isIsolation: boolean): number {
  if (unit === "kg") {
    return isIsolation ? 1.25 : 2.5;
  }
  return isIsolation ? 2.5 : 5;
}

export function snapWeight(value: number, step: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const snapped = Math.round(value / step) * step;
  return Math.round(snapped * 100) / 100;
}

export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (fromUnit === toUnit) return value;
  if (fromUnit === "kg" && toUnit === "lbs") {
    return value * LBS_PER_KG;
  }
  return value * KG_PER_LBS;
}

export function convertAndSnapWeight(
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
  isIsolation: boolean
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (fromUnit === toUnit) return value;
  const converted = convertWeight(value, fromUnit, toUnit);
  const step = getSnapStep(toUnit, isIsolation);
  return snapWeight(converted, step);
}
