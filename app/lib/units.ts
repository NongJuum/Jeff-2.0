// app/lib/units.ts
"use client";

export type WeightUnit = "kg" | "lbs";

export const LBS_PER_KG = 2.20462262185;
export const KG_PER_LBS = 0.45359237;

export const GLOBAL_WEIGHT_UNIT_KEY = "haitGlobalWeightUnitV1";
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

/**
 * Normalizes any unit string ("kg", "lb", "lbs") to canonical WeightUnit ("kg" | "lbs").
 */
export function normalizeWeightUnit(raw?: string | null): WeightUnit {
  if (!raw) return "kg";
  const lower = raw.trim().toLowerCase();
  if (lower === "lb" || lower === "lbs" || lower === "pound" || lower === "pounds") {
    return "lbs";
  }
  return "kg";
}

/**
 * Formats a WeightUnit for user display:
 * - "short": "kg" or "lb"
 * - "standard": "kg" or "lbs"
 */
export function formatUnitLabel(unit: WeightUnit, style: "short" | "standard" = "short"): string {
  if (unit === "kg") return "kg";
  return style === "short" ? "lb" : "lbs";
}

/**
 * Retrieves the single persistent user preference for weight unit.
 * Priority:
 * 1. Dedicated GLOBAL_WEIGHT_UNIT_KEY
 * 2. haitUserProfileV1.preferredWeightUnit
 * 3. Default established application unit: "kg"
 */
export function getPersistentWeightUnit(): WeightUnit {
  if (typeof window === "undefined") return "kg";
  try {
    const direct = window.localStorage.getItem(GLOBAL_WEIGHT_UNIT_KEY);
    if (direct) {
      return normalizeWeightUnit(direct);
    }

    const rawProfile = window.localStorage.getItem("haitUserProfileV1");
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && typeof parsed === "object" && parsed.preferredWeightUnit) {
        const u = normalizeWeightUnit(parsed.preferredWeightUnit);
        // Sync to GLOBAL_WEIGHT_UNIT_KEY for direct future access
        try {
          window.localStorage.setItem(GLOBAL_WEIGHT_UNIT_KEY, u);
        } catch {}
        return u;
      }
    }
  } catch {}

  return "kg";
}

/**
 * Saves the persistent user preference for weight unit and keeps userProfile in sync.
 */
export function setPersistentWeightUnit(unit: WeightUnit): void {
  const normalized = normalizeWeightUnit(unit);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GLOBAL_WEIGHT_UNIT_KEY, normalized);

    // Keep user profile in sync if present
    const rawProfile = window.localStorage.getItem("haitUserProfileV1");
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && typeof parsed === "object") {
        parsed.preferredWeightUnit = normalized;
        parsed.updatedAt = new Date().toISOString();
        window.localStorage.setItem("haitUserProfileV1", JSON.stringify(parsed));
      }
    }

    // Dispatch event to notify all components
    window.dispatchEvent(new CustomEvent("hait-unit-change", { detail: { unit: normalized } }));
  } catch {}
}

export function getMachineUnitsMap(): Record<string, WeightUnit> {
  return readStorageJson<Record<string, WeightUnit>>(MACHINE_UNITS_KEY, {});
}

export function saveMachineUnit(machineKey: string, unit: WeightUnit) {
  const current = getMachineUnitsMap();
  current[machineKey] = normalizeWeightUnit(unit);
  writeStorageJson(MACHINE_UNITS_KEY, current);
}

export function getExerciseUnitsMap(): Record<string, WeightUnit> {
  return readStorageJson<Record<string, WeightUnit>>(EXERCISE_UNITS_KEY, {});
}

export function saveExerciseUnit(exerciseName: string, unit: WeightUnit) {
  const current = getExerciseUnitsMap();
  current[exerciseName] = normalizeWeightUnit(unit);
  writeStorageJson(EXERCISE_UNITS_KEY, current);
}

/**
 * Unit Hierarchy Priority:
 * 1. Exercise Override (`haitExerciseUnitsV1[exerciseName]`)
 * 2. Machine Mapping (`haitMachineUnitsV1[machineTag]`)
 * 3. Global Preferred Unit (persistent preference / profile default 'kg')
 */
export function resolveEffectiveUnit(
  exerciseName: string,
  machineTag?: string,
  globalPreferredUnit?: WeightUnit,
  exerciseUnitsOverride?: Record<string, WeightUnit>,
  machineUnitsOverride?: Record<string, WeightUnit>
): WeightUnit {
  const exerciseMap = exerciseUnitsOverride ?? getExerciseUnitsMap();
  if (exerciseMap && exerciseMap[exerciseName]) {
    return normalizeWeightUnit(exerciseMap[exerciseName]);
  }

  const trimmedMachine = (machineTag ?? "").trim();
  if (trimmedMachine) {
    const machineMap = machineUnitsOverride ?? getMachineUnitsMap();
    if (machineMap && machineMap[trimmedMachine]) {
      return normalizeWeightUnit(machineMap[trimmedMachine]);
    }
  }

  return globalPreferredUnit ? normalizeWeightUnit(globalPreferredUnit) : getPersistentWeightUnit();
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
  const from = normalizeWeightUnit(fromUnit);
  const to = normalizeWeightUnit(toUnit);
  if (from === to) return value;
  if (from === "kg" && to === "lbs") {
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

/**
 * Converts an entered weight string without losing the underlying physical load.
 * Avoids cumulative rounding degradation by calculating with high precision.
 */
export function convertInputWeight(
  value: string | number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit,
  precision: number = 1
): string {
  const num = typeof value === "number" ? value : parseFloat(String(value).trim());
  if (!Number.isFinite(num) || num <= 0) return "";
  const from = normalizeWeightUnit(fromUnit);
  const to = normalizeWeightUnit(toUnit);
  if (from === to) return String(num);

  const converted = convertWeight(num, from, to);
  // Round cleanly to 1 decimal place without floating point artifacts
  const factor = Math.pow(10, precision);
  const rounded = Math.round(converted * factor) / factor;
  return String(rounded);
}

/**
 * Formats a weight number and unit into an explicit display string (e.g. "60 kg" or "135 lb").
 */
export function formatWeightWithUnit(weight: number, unit: WeightUnit, precision: number = 1): string {
  const factor = Math.pow(10, precision);
  const rounded = Math.round(weight * factor) / factor;
  return `${rounded} ${formatUnitLabel(unit)}`;
}

/**
 * Resolves a historical record or PR for display, respecting its actual original unit
 * and providing converted equivalent in the user's preferred unit without modifying history.
 */
export function resolveRecordDisplay(
  record: { weightLbs: number; unit?: WeightUnit; rawValue?: number },
  preferredUnit?: WeightUnit
): {
  primaryText: string;
  secondaryText?: string;
  originalWeight: number;
  originalUnit: WeightUnit;
  equivalentWeight: number;
  equivalentUnit: WeightUnit;
} {
  const pref = preferredUnit ? normalizeWeightUnit(preferredUnit) : getPersistentWeightUnit();

  // If record has explicit unit and rawValue
  if (record.unit && record.rawValue !== undefined && Number.isFinite(record.rawValue)) {
    const origUnit = normalizeWeightUnit(record.unit);
    const origWeight = Math.round(record.rawValue * 10) / 10;
    const otherUnit: WeightUnit = origUnit === "kg" ? "lbs" : "kg";
    const equivWeight = Math.round(convertWeight(record.rawValue, origUnit, otherUnit) * 10) / 10;

    return {
      primaryText: `${origWeight} ${formatUnitLabel(origUnit)}`,
      secondaryText: `≈ ${equivWeight} ${formatUnitLabel(otherUnit)}`,
      originalWeight: origWeight,
      originalUnit: origUnit,
      equivalentWeight: equivWeight,
      equivalentUnit: otherUnit,
    };
  }

  // Legacy record without explicit unit (stored in weightLbs)
  const legacyLbs = Math.round(record.weightLbs * 10) / 10;
  const convertedKg = Math.round(convertWeight(record.weightLbs, "lbs", "kg") * 10) / 10;

  if (pref === "kg") {
    return {
      primaryText: `${convertedKg} kg`,
      secondaryText: `(${legacyLbs} lb)`,
      originalWeight: legacyLbs,
      originalUnit: "lbs",
      equivalentWeight: convertedKg,
      equivalentUnit: "kg",
    };
  }

  return {
    primaryText: `${legacyLbs} lb`,
    secondaryText: `≈ ${convertedKg} kg`,
    originalWeight: legacyLbs,
    originalUnit: "lbs",
    equivalentWeight: convertedKg,
    equivalentUnit: "kg",
  };
}
