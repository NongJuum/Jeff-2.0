"use client";
import React, { useState, useEffect } from "react";
import { Scale, X, TrendingUp } from "lucide-react";

export type BodyweightEntry = {
  lbs: number;
  updatedAt: string;
};

const BODYWEIGHT_KEY = "haitBodyweight";

type Props = {
  open: boolean;
  onClose: () => void;
  currentPrs?: Record<string, { weightLbs: number; reps: number; name?: string }>;
};

export function getCurrentBodyweight(): BodyweightEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BODYWEIGHT_KEY);
    return raw ? (JSON.parse(raw) as BodyweightEntry) : null;
  } catch {
    return null;
  }
}

import { getPersistentWeightUnit, setPersistentWeightUnit, convertInputWeight, formatUnitLabel } from "../lib/units";
import { evaluateMuscleMass, getUserProfile, type MuscleMassMode } from "../lib/assessment";

export function BodyweightManager({ open, onClose, currentPrs, preferredUnit, onSaveSuccess }: Props & { preferredUnit?: "kg" | "lbs"; onSaveSuccess?: () => void }) {
  const activePref = preferredUnit || getPersistentWeightUnit();
  const [entry, setEntry] = useState<BodyweightEntry | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">(activePref);
  const [muscleMassVal, setMuscleMassVal] = useState("");
  const [muscleMassMode, setMuscleMassMode] = useState<MuscleMassMode>("smm");

  useEffect(() => {
    if (open) {
      const current = getCurrentBodyweight();
      const currentPref = preferredUnit || getPersistentWeightUnit();
      setEntry(current);
      setUnit(currentPref);
      if (current) {
        if (currentPref === "kg") {
          setInputVal(String(Math.round((current.lbs * 0.453592) * 10) / 10));
        } else {
          setInputVal(String(Math.round(current.lbs * 10) / 10));
        }
      } else {
        setInputVal("");
      }

      // Load saved muscle mass from profile
      try {
        const prof = getUserProfile();
        if (prof?.muscleMassKg) {
          setMuscleMassVal(
            currentPref === "kg"
              ? String(prof.muscleMassKg)
              : String(Math.round((prof.muscleMassKg / 0.453592) * 10) / 10)
          );
        }
        if (prof?.muscleMassMode) {
          setMuscleMassMode(prof.muscleMassMode);
        }
      } catch {}
    }
  }, [open, preferredUnit]);

  if (!open) return null;

  const handleUnitToggle = (newUnit: "kg" | "lbs") => {
    if (newUnit === unit) return;
    if (inputVal) {
      const converted = convertInputWeight(inputVal, unit, newUnit);
      setInputVal(converted);
    }
    if (muscleMassVal) {
      const convertedM = convertInputWeight(muscleMassVal, unit, newUnit);
      setMuscleMassVal(convertedM);
    }
    setUnit(newUnit);
    setPersistentWeightUnit(newUnit);
  };

  const save = () => {
    const val = Number(inputVal);
    if (!Number.isFinite(val) || val <= 0) return;
    const lbs = unit === "kg" ? val / 0.453592 : val;
    if (lbs <= 0 || lbs > 1000) return;

    const newEntry: BodyweightEntry = { lbs: Math.round(lbs * 10) / 10, updatedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(BODYWEIGHT_KEY, JSON.stringify(newEntry));
      // Sync to haitUserProfileV1 if profile exists
      const savedProf = window.localStorage.getItem("haitUserProfileV1");
      if (savedProf) {
        const parsed = JSON.parse(savedProf);
        parsed.weightKg = Math.round((newEntry.lbs * 0.453592) * 10) / 10;
        if (muscleMassVal) {
          const mVal = Number(muscleMassVal);
          if (Number.isFinite(mVal) && mVal > 0) {
            parsed.muscleMassKg = unit === "kg" ? mVal : Math.round(mVal * 0.453592 * 10) / 10;
            parsed.muscleMassMode = muscleMassMode;
          }
        }
        parsed.updatedAt = new Date().toISOString();
        window.localStorage.setItem("haitUserProfileV1", JSON.stringify(parsed));
      }
    } catch {}
    setEntry(newEntry);
    onSaveSuccess?.();
  };

  // คำนวณ Relative Strength สำหรับท่าหลัก
  const bw = entry?.lbs ?? 0;
  const ratios = currentPrs && bw > 0 ? [
    { name: "Bench Press", pr: currentPrs["Bench Press"] || Object.entries(currentPrs).find(([k]) => k.toLowerCase().includes("bench press"))?.[1], target: 1.5, unit: "× BW" },
    { name: "Squat", pr: currentPrs["Barbell Back Squat"] || currentPrs["Hack Squat"] || Object.entries(currentPrs).find(([k]) => k.toLowerCase().includes("squat"))?.[1], target: 2.0, unit: "× BW" },
    { name: "Deadlift", pr: currentPrs["Deadlift"] || currentPrs["Romanian Deadlift RDL"] || Object.entries(currentPrs).find(([k]) => k.toLowerCase().includes("deadlift"))?.[1], target: 2.5, unit: "× BW" },
  ].filter((r) => r.pr) : [];

  const currentProf = getUserProfile();
  const numWeightKg = unit === "kg" ? Number(inputVal) : Number(inputVal) * 0.453592;
  const numMuscleKg = muscleMassVal ? (unit === "kg" ? Number(muscleMassVal) : Number(muscleMassVal) * 0.453592) : 0;
  const muscleInfo = (numWeightKg > 0 && numMuscleKg > 0)
    ? evaluateMuscleMass(currentProf?.gender || "male", numWeightKg, numMuscleKg, muscleMassMode)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-emerald-400" />
            <h3 className="text-lg font-black">Bodyweight & Composition</h3>
          </div>
          <button onClick={onClose} className="rounded-xl bg-zinc-900 p-2 text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Input Weight */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-zinc-400">
                น้ำหนักตัวปัจจุบัน ({unit})
              </label>
              <div className="flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleUnitToggle("kg")}
                  className={`px-2 py-0.5 rounded-md transition ${unit === "kg" ? "bg-emerald-400 text-zinc-950 font-black shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle("lbs")}
                  className={`px-2 py-0.5 rounded-md transition ${unit === "lbs" ? "bg-emerald-400 text-zinc-950 font-black shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
                >
                  lb
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={unit === "kg" ? "เช่น 70.5" : "เช่น 155"}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg font-black outline-none focus:border-emerald-400"
              />
              <span className="flex items-center px-3 text-sm font-bold text-zinc-400">{formatUnitLabel(unit)}</span>
              <button
                onClick={save}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-emerald-300 transition active:scale-95"
              >
                Save
              </button>
            </div>
            {entry && (
              <p className="mt-1.5 text-[11px] text-zinc-500 flex items-center justify-between">
                <span>
                  บันทึกไว้: <strong>{Math.round(entry.lbs * 0.453592 * 10) / 10} kg</strong> ({Math.round(entry.lbs * 10) / 10} lbs)
                </span>
                <span>{new Date(entry.updatedAt).toLocaleDateString("th-TH")}</span>
              </p>
            )}
          </div>

          {/* Input Muscle Mass (Optional) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  💪 มวลกล้ามเนื้อ (InBody / Dexa)
                </label>
                <p className="text-[10px] text-zinc-500">ไม่บังคับ · ใช้คำนวณ Warmup AI และสรีรวิทยา</p>
              </div>
              <div className="flex gap-1 rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setMuscleMassMode("smm")}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    muscleMassMode === "smm" ? "bg-emerald-400 text-zinc-950 font-black shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  SMM
                </button>
                <button
                  type="button"
                  onClick={() => setMuscleMassMode("total")}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    muscleMassMode === "total" ? "bg-emerald-400 text-zinc-950 font-black shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Total
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={muscleMassVal}
                onChange={(e) => setMuscleMassVal(e.target.value)}
                placeholder={unit === "kg" ? "เช่น 28.5 (kg)" : "เช่น 62.8 (lbs)"}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-emerald-400"
              />
              <span className="flex items-center px-2 text-xs font-bold text-zinc-400">{formatUnitLabel(unit)}</span>
            </div>
            {muscleInfo && (
              <p className="text-[11px] font-bold text-emerald-300">
                📊 {muscleInfo.percentage}% ของน้ำหนักตัว · {muscleInfo.label}
              </p>
            )}
          </div>

          {/* Relative Strength */}
          {ratios.length > 0 && bw > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emerald-300">
                <TrendingUp size={14} /> Relative Strength
              </p>
              <div className="space-y-2">
                {ratios.map((r) => {
                  const ratio = r.pr!.weightLbs / bw;
                  const progress = Math.min(100, (ratio / r.target) * 100);
                  const isElite = ratio >= r.target;
                  return (
                    <div key={r.name} className="rounded-xl bg-zinc-900 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold">{r.name}</span>
                        <span className={`text-sm font-black ${isElite ? "text-emerald-300" : "text-zinc-100"}`}>
                          {ratio.toFixed(2)} {r.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                        <span>
                          PR: {unit === "kg" ? `${Math.round(r.pr!.weightLbs * 0.453592 * 10) / 10} kg` : `${r.pr!.weightLbs} lbs`}
                        </span>
                        <span>เป้าหมาย: {r.target}× BW ({unit === "kg" ? `${Math.round((bw * 0.453592) * r.target * 10) / 10} kg` : `${Math.round(bw * r.target)} lbs`})</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${isElite ? "bg-emerald-400" : "bg-amber-400"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bw === 0 && (
            <p className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
              💡 กรอกน้ำหนักตัวเพื่อคำนวณ Relative Strength — ดูว่าคุณแข็งแกร่งแค่ไหนเทียบกับน้ำหนักตัว!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
