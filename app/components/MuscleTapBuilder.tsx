"use client";
import React, { useState, useMemo } from "react";
import { X, Plus, Dumbbell, Sparkles, Check, Crosshair } from "lucide-react";

type ExerciseItem = {
  name: string;
  group: string;
  movement: string;
  muscles: string[];
  tier: string;
  load: string;
};

type Props = {
  exercises: ExerciseItem[];
  onPick: (name: string) => void;
  currentExercises?: { name: string; sets: number }[];
};

// ==========================================
// 🧪 CALIBRATION MODE
// ตั้งเป็น true เพื่อคลิกบนรูปแล้วดูพิกัด x, y ใน console
// และแสดง marker พิกัดบนรูปเพื่อความสะดวกในการจูน
// ==========================================
const CALIBRATION_MODE = false;

export type TapZone = {
  id: string;
  label: string;
  x: number; // % (0-100)
  y: number; // % (0-100)
  keywords: string[];
};

// 🎯 พิกัดที่ผ่านการคาลิเบรตตามกายวิภาคจริงของรูป (v3 - Master Calibrated)
// front: front-delt 36/27, upper-chest 45/30, mid-chest 56/34, bicep 33/39, abs 50/45, obliques 42/48, quads 43/65, tibialis 44/85
// back: traps 50/22, rear-delt 64/27, upper-back 50/31, mid-back 50/37, lats 60/38, tricep 67/38, lower-back 50/46, glutes 44/55, hams 43/67, calves 43/84
const TAP_ZONES: { front: TapZone[]; back: TapZone[] } = {
  front: [
    {
      id: "frontDelts",
      label: "ไหล่หน้า",
      x: 36,
      y: 27,
      keywords: ["Front delts", "Shoulders"],
    },
    {
      id: "upperChest",
      label: "อกบน",
      x: 45,
      y: 30,
      keywords: ["Upper chest"],
    },
    {
      id: "midChest",
      label: "อกกลาง",
      x: 56,
      y: 34,
      keywords: ["Chest", "Lower chest"],
    },
    {
      id: "biceps",
      label: "หน้าแขน",
      x: 33,
      y: 39,
      keywords: ["Biceps"],
    },
    {
      id: "abs",
      label: "หน้าท้อง",
      x: 50,
      y: 45,
      keywords: ["Abs"],
    },
    {
      id: "obliques",
      label: "เอว/หน้าท้องข้าง",
      x: 42,
      y: 48,
      keywords: ["Abs", "Obliques"],
    },
    {
      id: "quads",
      label: "ต้นขาหน้า",
      x: 43,
      y: 65,
      keywords: ["Quads"],
    },
    {
      id: "tibialis",
      label: "หน้าแข้ง/น่อง",
      x: 44,
      y: 85,
      keywords: ["Calves"],
    },
  ],
  back: [
    {
      id: "traps",
      label: "หนอกคอ/สะบักบน",
      x: 50,
      y: 22,
      keywords: ["Upper traps", "Lower traps"],
    },
    {
      id: "rearDelts",
      label: "ไหล่หลัง",
      x: 64,
      y: 27,
      keywords: ["Rear delts"],
    },
    {
      id: "upperBack",
      label: "หลังบน",
      x: 50,
      y: 31,
      keywords: ["Upper back", "Upper traps", "Lower traps"],
    },
    {
      id: "midBack",
      label: "หลังกลาง",
      x: 50,
      y: 37,
      keywords: ["Mid back", "Upper back"],
    },
    {
      id: "lats",
      label: "ปีก",
      x: 60,
      y: 38,
      keywords: ["Lats"],
    },
    {
      id: "triceps",
      label: "หลังแขน",
      x: 67,
      y: 38,
      keywords: ["Triceps", "Triceps long head"],
    },
    {
      id: "lowerBack",
      label: "หลังล่าง",
      x: 50,
      y: 46,
      keywords: ["Erectors"],
    },
    {
      id: "glutes",
      label: "ก้น",
      x: 44,
      y: 55,
      keywords: ["Glutes"],
    },
    {
      id: "hams",
      label: "ต้นขาหลัง",
      x: 43,
      y: 67,
      keywords: ["Hamstrings"],
    },
    {
      id: "calves",
      label: "น่อง",
      x: 43,
      y: 84,
      keywords: ["Calves"],
    },
  ],
};

// ลิสต์ท่าแนะนำเฉพาะกลุ่มเพื่อจัดอันดับท่าตรงเป้าขึ้นก่อน
const PRIMARY_RECOMMENDED: Record<string, string[]> = {
  upperChest: ["Incline DB Press", "Incline Machine Bench", "Iso-Lateral Incline Press", "Incline Barbell Bench Press", "Incline Smith Machine Bench", "Low-to-High Cable Flye"],
  midChest: ["Machine Chest Press", "Iso-Lateral Chest Press", "Bench Press", "Flat DB Press", "Pec Deck", "Cable Crossover"],
  frontDelts: ["Machine Shoulder Press", "Seated DB Overhead Press", "Barbell Overhead Press"],
  biceps: ["Face Away Bayesian Curl", "Incline Curl", "DB Preacher Curl", "EZ Bar Curl", "DB Hammer Curl"],
  abs: ["Cable Crunch", "Machine Abs Crunch", "Hanging Knee Raise", "Hanging Leg Raise", "Ab Wheel Rollout"],
  obliques: ["Cable Crunch", "Machine Abs Crunch", "Hanging Knee Raise", "Hanging Leg Raise"],
  quads: ["Hack Squat", "Belt Squat", "Leg Extension", "Bulgarian Split Squat", "Pendulum Squat"],
  tibialis: ["Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise"],
  traps: ["DB Shrug", "Smith Machine Shrug", "Cable Y Raise", "Rope Face Pull"],
  rearDelts: ["Reverse Pec Deck", "Rope Face Pull", "DB Rear Delt Flye"],
  upperBack: ["Machine High Row", "Wide Grip Cable Row", "Chest Supported Row", "Seal Row"],
  midBack: ["Chest Supported Row", "Seal Row", "Chest Supported T-Bar Row", "Iso-Lateral Low Row", "Cable Row"],
  lats: ["Neutral Grip Lat Pull Down", "Iso-Lateral Pulldown", "Cable Row", "Straight Arm Pulldown", "Cable Lat Prayers"],
  triceps: ["Overhead Cable Ext", "Triceps Pressdown Bar", "Barbell Skullcrusher"],
  lowerBack: ["Romanian Deadlift RDL", "45° Back Extension", "Deadlift"],
  glutes: ["Machine Hip Thrust", "Kickbacks", "45° Glute Hyperextension"],
  hams: ["Seated Hamstring Curl", "Lying Leg Curl", "Romanian Deadlift RDL", "Nordic Hamstring Curl"],
  calves: ["Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise"],
};

export function MuscleTapBuilder({ exercises, onPick, currentExercises }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [calibratedPoint, setCalibratedPoint] = useState<{ x: number; y: number } | null>(null);

  const zones = TAP_ZONES[side];

  // ค้นหาและนับท่าสำหรับแต่ละกล้ามเนื้อ
  const exercisesByZone = useMemo(() => {
    const map: Record<string, ExerciseItem[]> = {};

    [...TAP_ZONES.front, ...TAP_ZONES.back].forEach((z) => {
      const recSet = new Set(PRIMARY_RECOMMENDED[z.id] || []);
      const matched = exercises.filter((ex) =>
        ex.muscles.some((m) => z.keywords.includes(m))
      );

      // จัดเรียง: ท่าแนะนำหลักก่อน -> ท่าที่กล้ามเนื้อนี้เป็นกล้ามเนื้อแรก -> ท่าอื่นๆ
      matched.sort((a, b) => {
        const aRec = recSet.has(a.name) ? 1 : 0;
        const bRec = recSet.has(b.name) ? 1 : 0;
        if (aRec !== bRec) return bRec - aRec;

        const aPrimary = z.keywords.includes(a.muscles[0]) ? 1 : 0;
        const bPrimary = z.keywords.includes(b.muscles[0]) ? 1 : 0;
        if (aPrimary !== bPrimary) return bPrimary - aPrimary;

        return a.name.localeCompare(b.name);
      });

      map[z.id] = matched;
    });

    return map;
  }, [exercises]);

  const activeZoneObj = useMemo(() => {
    return zones.find((z) => z.id === selectedZone);
  }, [zones, selectedZone]);

  const matchedExercises = selectedZone ? exercisesByZone[selectedZone] || [] : [];

  // ตรวจสอบว่าท่าถูกเพิ่มลงใน currentExercises แล้วหรือไม่
  const currentNamesSet = useMemo(() => {
    return new Set(currentExercises?.map((e) => e.name) || []);
  }, [currentExercises]);

  // จุดจูนพิกัดเมื่อแตะบนรูป (CALIBRATION_MODE)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!CALIBRATION_MODE) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const clickY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));
    console.log(`📍 พิกัด: x=${clickX}, y=${clickY}`);
    setCalibratedPoint({ x: clickX, y: clickY });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
            <Sparkles size={16} />
            แตะกล้ามเนื้อเพื่อเพิ่มท่า (v3 Calibrated)
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            แตะจุดบนร่างกาย หรือเลือกกล้ามเนื้อจากชิปด้านล่าง
          </p>
        </div>
      </div>

      {/* Calibration Banner (หากเปิด CALIBRATION_MODE) */}
      {CALIBRATION_MODE && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <div className="flex items-center gap-2 font-mono">
            <Crosshair size={14} className="animate-spin text-amber-400" />
            <span>CALIBRATION MODE: แตะที่รูปเพื่อบันทึกพิกัด</span>
          </div>
          {calibratedPoint && (
            <span className="font-mono font-bold text-amber-200">
              📍 x={calibratedPoint.x}%, y={calibratedPoint.y}%
            </span>
          )}
        </div>
      )}

      {/* Side Toggle */}
      <div className="mb-3 flex gap-1 rounded-xl bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => {
            setSide("front");
            setCalibratedPoint(null);
          }}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            side === "front" ? "bg-emerald-400 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ด้านหน้า (Front)
        </button>
        <button
          type="button"
          onClick={() => {
            setSide("back");
            setCalibratedPoint(null);
          }}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            side === "back" ? "bg-emerald-400 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ด้านหลัง (Back)
        </button>
      </div>

      {/* Anatomy View + Interactive Tap Targets */}
      <div
        onClick={handleContainerClick}
        className={`relative mx-auto h-80 max-w-[260px] select-none ${
          CALIBRATION_MODE ? "cursor-crosshair" : ""
        }`}
      >
        <img
          src={`/anatomy/${side}/body.webp`}
          alt={`${side} anatomy`}
          className="pointer-events-none h-full w-full object-contain"
        />

        {/* จุด Calibration Marker แสดงจุดที่เพิ่งคลิก */}
        {CALIBRATION_MODE && calibratedPoint && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${calibratedPoint.x}%`, top: `${calibratedPoint.y}%` }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 ring-4 ring-amber-400/30" />
            <span className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-1 py-0.5 font-mono text-[9px] text-amber-300">
              {calibratedPoint.x}, {calibratedPoint.y}
            </span>
          </div>
        )}

        {/* Tap Targets (มาตรฐานขนาดสัมผัส 44x44px ตาม Accessibility) */}
        {zones.map((zone) => {
          const count = exercisesByZone[zone.id]?.length || 0;
          const isDisabled = count === 0;
          const isSelected = selectedZone === zone.id;
          const isHovered = hoveredZone === zone.id;

          return (
            <button
              key={zone.id}
              type="button"
              disabled={isDisabled}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedZone(zone.id);
              }}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center touch-manipulation focus:outline-none"
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              aria-label={`${zone.label} (${count} ท่า)`}
            >
              {/* Visual Indicator (ลบ emoji ออกหมด เพื่อแก้ปัญหาสีน้ำตาล/หม่นเพี้ยน) */}
              <div
                className={`relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all duration-200 ${
                  isDisabled
                    ? "cursor-not-allowed border border-zinc-700 bg-zinc-800/90 text-zinc-500 opacity-40 shadow-none"
                    : isSelected
                    ? "scale-125 border-2 border-white bg-emerald-400 text-zinc-950 shadow-[0_0_16px_rgba(52,211,153,0.8)] ring-4 ring-emerald-500/40"
                    : isHovered
                    ? "scale-115 border-2 border-emerald-300 bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/50"
                    : "border-2 border-emerald-300/80 bg-zinc-950/80 text-emerald-300 shadow-md shadow-black/40 hover:scale-110 hover:border-emerald-300 hover:bg-emerald-500/30"
                }`}
              >
                {/* แสดงจำนวนท่าที่มี */}
                <span>{count}</span>
              </div>

              {/* ป้ายชื่อกล้ามเนื้อเมื่อ Hover หรือเลือก */}
              {(isHovered || isSelected) && !isDisabled && (
                <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                  <div className="whitespace-nowrap rounded-md border border-emerald-500/60 bg-zinc-950/95 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shadow-xl backdrop-blur-sm">
                    {zone.label} ({count})
                  </div>
                  <div className="h-1 w-1 rotate-45 border-b border-r border-emerald-500/60 bg-zinc-950" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-500">
        👆 แตะจุดหรือเลือกชิปด้านล่างเพื่อเลือกท่าสำหรับกล้ามเนื้อนั้น
      </p>

      {/* แถบ Chip รายชื่อกล้ามเนื้อใต้รูป (Accessibility & Mobile Quick Tap) */}
      <div className="mt-3 border-t border-zinc-800/80 pt-3">
        <p className="mb-2 text-[11px] font-bold text-zinc-400">
          กล้ามเนื้อ ({side === "front" ? "ด้านหน้า" : "ด้านหลัง"}):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {zones.map((zone) => {
            const count = exercisesByZone[zone.id]?.length || 0;
            const isDisabled = count === 0;
            const isSelected = selectedZone === zone.id;
            const isHovered = hoveredZone === zone.id;

            return (
              <button
                key={zone.id}
                type="button"
                disabled={isDisabled}
                onClick={() => setSelectedZone(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  isDisabled
                    ? "cursor-not-allowed border border-zinc-800 bg-zinc-900/60 text-zinc-600 opacity-50"
                    : isSelected || isHovered
                    ? "border border-emerald-400 bg-emerald-400 text-zinc-950 shadow-sm"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300"
                }`}
              >
                <span>{zone.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isSelected || isHovered
                      ? "bg-zinc-950 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  ท่าสำหรับ {activeZoneObj?.label}
                </p>
                <p className="mt-0.5 text-lg font-black text-zinc-100">
                  {matchedExercises.length} ท่าที่พบ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="rounded-xl bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal List */}
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {matchedExercises.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-zinc-400">
                    ยังไม่มีท่าสำหรับกล้ามเนื้อนี้ใน Library
                  </p>
                </div>
              ) : (
                matchedExercises.map((ex) => {
                  const isAdded = currentNamesSet.has(ex.name);

                  return (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() => {
                        onPick(ex.name);
                        setSelectedZone(null);
                      }}
                      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-left transition hover:border-emerald-500/50 hover:bg-zinc-800/90 active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Dumbbell size={14} className="shrink-0 text-emerald-400" />
                          <p className="truncate text-sm font-bold text-zinc-100 group-hover:text-white">
                            {ex.name}
                          </p>
                          {isAdded && (
                            <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                              <Check size={10} /> เพิ่มแล้ว
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {ex.group} · {ex.movement} ·{" "}
                          <span className="font-black text-emerald-300">{ex.tier}</span>
                          {ex.load && (
                            <span className="ml-1 text-[11px] text-zinc-500">
                              ({ex.load})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-zinc-950 transition">
                        <Plus size={16} />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
