"use client";
import React, { useState, useMemo } from "react";
import { X, Plus, Dumbbell } from "lucide-react";

type MuscleRegion =
  | "chest" | "upperChest" | "lowerChest"
  | "frontDelts" | "sideDelts" | "rearDelts"
  | "biceps" | "triceps" | "tricepsLong"
  | "lats" | "midBack" | "upperBack" | "erectors"
  | "upperTraps" | "lowerTraps"
  | "abs" | "obliques"
  | "glutes" | "quads" | "hamstrings" | "calves";

type TapZone = {
  region: MuscleRegion;
  side: "front" | "back";
  label: string;
  x: number; // % ของความกว้างรูป (0-100)
  y: number; // % ของความสูงรูป (0-100)
};

// 🎯 ตำแหน่งจุดแตะของแต่ละกล้ามเนื้อ (ค่าประมาณ — ปรับตามรูปจริงได้)
const MUSCLE_TAP_ZONES: TapZone[] = [
  // ===== FRONT (ด้านหน้า) =====
  { region: "frontDelts", side: "front", label: "ไหล่หน้า", x: 27, y: 26 },
  { region: "upperChest", side: "front", label: "หน้าอกบน", x: 42, y: 30 },
  { region: "chest", side: "front", label: "หน้าอก", x: 58, y: 32 },
  { region: "lowerChest", side: "front", label: "หน้าอกล่าง", x: 42, y: 39 },
  { region: "biceps", side: "front", label: "หน้าแขน", x: 22, y: 42 },
  { region: "obliques", side: "front", label: "สีข้าง", x: 36, y: 50 },
  { region: "abs", side: "front", label: "หน้าท้อง", x: 50, y: 50 },
  { region: "quads", side: "front", label: "ต้นขาด้านหน้า", x: 42, y: 70 },
  { region: "calves", side: "front", label: "หน้าแข้ง", x: 43, y: 90 },
  // ===== BACK (ด้านหลัง) =====
  { region: "upperTraps", side: "back", label: "คอ-หลังบน", x: 50, y: 22 },
  { region: "rearDelts", side: "back", label: "ไหล่หลัง", x: 73, y: 26 },
  { region: "upperBack", side: "back", label: "หลังบน", x: 58, y: 30 },
  { region: "midBack", side: "back", label: "กลางหลัง", x: 50, y: 37 },
  { region: "lats", side: "back", label: "ปีก", x: 63, y: 42 },
  { region: "lowerTraps", side: "back", label: "หลังล่างบน", x: 50, y: 43 },
  { region: "erectors", side: "back", label: "หลังล่าง", x: 50, y: 50 },
  { region: "triceps", side: "back", label: "หลังแขน", x: 78, y: 42 },
  { region: "glutes", side: "back", label: "ก้น", x: 42, y: 57 },
  { region: "hamstrings", side: "back", label: "ต้นขาด้านหลัง", x: 42, y: 72 },
  { region: "calves", side: "back", label: "น่อง", x: 43, y: 88 },
];

// แปลง region → ชื่อกล้ามเนื้อใน exerciseLibrary (ใช้กับ MUSCLE_ALIAS_MAP)
const REGION_TO_LIBRARY_NAME: Record<MuscleRegion, string> = {
  chest: "Chest",
  upperChest: "Upper chest",
  lowerChest: "Lower chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  tricepsLong: "Triceps long head",
  lats: "Lats",
  midBack: "Mid back",
  upperBack: "Upper back",
  erectors: "Erectors",
  upperTraps: "Upper traps",
  lowerTraps: "Lower traps",
  abs: "Abs",
  obliques: "Abs", // ไม่มีท่าที่เน้น obliques โดยตรง → ใช้ Abs
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

type Props = {
  exercises: { name: string; group: string; movement: string; muscles: string[]; tier: string; load: string }[];
  onPick: (exerciseName: string) => void;
};

export function MuscleTapPicker({ exercises, onPick }: Props) {
  const [selectedZone, setSelectedZone] = useState<TapZone | null>(null);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  // ค้นหาท่าที่เล่นกล้ามเนื้อที่เลือก (รวมที่เน้น + ที่เกี่ยวข้อง)
  const matchedExercises = useMemo(() => {
    if (!selectedZone) return [];
    const targetName = REGION_TO_LIBRARY_NAME[selectedZone.region];
    if (!targetName) return [];

    return exercises.filter((ex) =>
      ex.muscles.some((m) => {
        const cleaned = m.trim();
        // จับคู่ตรงๆ หรือ "Upper/Lower chest" ก็ถือว่าเป็น Chest ด้วย
        if (cleaned === targetName) return true;
        if (targetName === "Chest" && (cleaned === "Upper chest" || cleaned === "Lower chest")) return true;
        if (targetName === "Abs" && cleaned.includes("Abs")) return true;
        return false;
      })
    );
  }, [selectedZone, exercises]);

  const zones = MUSCLE_TAP_ZONES.filter((z) => z.side === activeSide);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">
            👆 Tap Muscle to Add Exercise
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">แตะกล้ามเนื้อเพื่อเลือกท่าที่เล่นกล้ามเนื้้อนั้น</p>
        </div>
        {/* สลับด้าน */}
        <div className="flex rounded-xl bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => setActiveSide("front")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${activeSide === "front" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"}`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("back")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${activeSide === "back" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"}`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Anatomy + Tap Zones */}
      <div className="relative mx-auto h-72 max-w-[220px]">
        <img
          src={`/anatomy/${activeSide}/body.webp`}
          alt={`Human anatomy ${activeSide}`}
          className="h-full w-full object-contain opacity-95"
        />
        {zones.map((zone) => (
          <button
            key={`${zone.side}-${zone.region}`}
            type="button"
            onClick={() => setSelectedZone(zone)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
              selectedZone?.region === zone.region
                ? "h-9 w-9 bg-emerald-400 shadow-lg shadow-emerald-500/50 scale-110"
                : "h-6 w-6 bg-emerald-500/30 hover:bg-emerald-400/60 hover:scale-125"
            } border-2 border-emerald-300/60 backdrop-blur-sm`}
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            aria-label={`เลือกท่าที่เล่น ${zone.label}`}
          />
        ))}
      </div>

      {/* Modal เลือกท่า */}
      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  ท่าที่เล่น {selectedZone.label}
                </p>
                <p className="mt-0.5 text-lg font-black">
                  {matchedExercises.length} ท่า
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="rounded-xl bg-zinc-900 p-2 text-zinc-400"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {matchedExercises.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  ยังไม่มีท่านี้ใน Library
                </p>
              ) : (
                matchedExercises.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => {
                      onPick(ex.name);
                      setSelectedZone(null);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 text-left transition hover:border-emerald-500/40 hover:bg-zinc-900/80 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                        <Dumbbell size={14} className="shrink-0 text-emerald-400" />
                        {ex.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {ex.group} · {ex.movement} ·{" "}
                        <span className="font-black text-emerald-300">{ex.tier}</span>
                      </p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                      <Plus size={16} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
