"use client";
import React, { useState, useMemo } from "react";
import { X, Plus, Dumbbell, Sparkles } from "lucide-react";

type Props = {
  exercises: { name: string; group: string; movement: string; muscles: string[]; tier: string; load: string }[];
  onPick: (name: string) => void;
  currentExercises?: { name: string; sets: number }[];
};

// จุดแตะแต่ละกล้ามเนื้อ (ค่าประมาณ — ปรับตามรูปจริง)
const TAP_ZONES = {
  front: [
    { id: "upperChest", label: "อกบน", x: 50, y: 28, emoji: "🫁" },
    { id: "chest", label: "อกกลาง", x: 50, y: 35, emoji: "💪" },
    { id: "frontDelts", label: "ไหล่หน้า", x: 35, y: 27, emoji: "💪" },
    { id: "biceps", label: "หน้าแขน", x: 28, y: 40, emoji: "💪" },
    { id: "abs", label: "หน้าท้อง", x: 50, y: 50, emoji: "🔥" },
    { id: "quads", label: "ต้นขาหน้า", x: 45, y: 68, emoji: "🦵" },
  ],
  back: [
    { id: "upperBack", label: "หลังบน", x: 50, y: 28, emoji: "🎯" },
    { id: "lats", label: "ปีก", x: 35, y: 38, emoji: "🦅" },
    { id: "rearDelts", label: "ไหล่หลัง", x: 30, y: 27, emoji: "💪" },
    { id: "triceps", label: "หลังแขน", x: 25, y: 40, emoji: "💪" },
    { id: "erectors", label: "หลังล่าง", x: 50, y: 48, emoji: "🎯" },
    { id: "glutes", label: "ก้น", x: 50, y: 58, emoji: "🍑" },
    { id: "hamstrings", label: "ต้นขาหลัง", x: 45, y: 70, emoji: "🦵" },
  ],
};

// Map muscle → exercise
const MUSCLE_TO_EXERCISES: Record<string, string[]> = {
  upperChest: ["Incline DB Press", "Incline Machine Bench", "Iso-Lateral Incline Press", "Incline Barbell Bench Press", "Incline Smith Machine Bench", "Low-to-High Cable Flye"],
  chest: ["Machine Chest Press", "Iso-Lateral Chest Press", "Bench Press", "Flat DB Press", "Pec Deck", "Cable Crossover"],
  frontDelts: ["Machine Shoulder Press", "Seated DB Overhead Press", "Barbell Overhead Press"],
  biceps: ["Face Away Bayesian Curl", "Incline Curl", "DB Preacher Curl", "EZ Bar Curl", "DB Hammer Curl"],
  abs: ["Cable Crunch", "Hanging Knee Raise", "Hanging Leg Raise", "Ab Wheel Rollout"],
  quads: ["Hack Squat", "Belt Squat", "Leg Extension", "Bulgarian Split Squat"],
  upperBack: ["Machine High Row", "Chest Supported T-Bar Row", "Wide Grip Cable Row"],
  lats: ["Neutral Grip Lat Pull Down", "Iso-Lateral Pulldown", "Cable Row", "Straight Arm Pulldown"],
  rearDelts: ["Reverse Pec Deck", "Rope Face Pull", "DB Rear Delt Flye"],
  triceps: ["Overhead Cable Ext", "Triceps Pressdown Bar", "Barbell Skullcrusher"],
  erectors: ["Romanian Deadlift RDL", "45° Back Extension", "Deadlift"],
  glutes: ["Machine Hip Thrust", "Kickbacks", "45° Glute Hyperextension"],
  hamstrings: ["Seated Hamstring Curl", "Lying Leg Curl", "Romanian Deadlift RDL"],
};

export function MuscleTapBuilder({ exercises, onPick, currentExercises }: Props) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const zones = TAP_ZONES[side];

  // นับจำนวนท่าที่มีในแต่ละ muscle (แสดง badge)
  const muscleCount = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(MUSCLE_TO_EXERCISES).forEach(([muscle, list]) => {
      counts[muscle] = list.filter((name) =>
        exercises.some((e) => e.name === name)
      ).length;
    });
    return counts;
  }, [exercises]);

  const matchedExercises = selectedZone
    ? MUSCLE_TO_EXERCISES[selectedZone] || []
    : [];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
            <Sparkles size={16} />
            แตะกล้ามเนื้อเพื่อเพิ่มท่า
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            เลือกจาก 100+ ท่าที่จัดตามกล้ามเนื้อ
          </p>
        </div>
      </div>

      {/* Side Toggle */}
      <div className="mb-3 flex gap-1 rounded-xl bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => setSide("front")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            side === "front" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"
          }`}
        >
          ด้านหน้า
        </button>
        <button
          type="button"
          onClick={() => setSide("back")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            side === "back" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"
          }`}
        >
          ด้านหลัง
        </button>
      </div>

      {/* Anatomy + Tap Zones */}
      <div className="relative mx-auto h-80 max-w-[260px]">
        <img
          src={`/anatomy/${side}/body.webp`}
          alt={`${side} anatomy`}
          className="h-full w-full object-contain"
        />
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => setSelectedZone(zone.id)}
            className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-all ${
              selectedZone === zone.id
                ? "scale-125 border-emerald-400 bg-emerald-400 shadow-lg shadow-emerald-500/50"
                : "border-emerald-300/60 bg-emerald-500/20 hover:scale-110 hover:bg-emerald-400/40"
            }`}
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            aria-label={zone.label}
          >
            <span className="text-lg">{zone.emoji}</span>
            {/* Badge */}
            {muscleCount[zone.id] > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {muscleCount[zone.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-zinc-500">
        👆 แตะปุ่มเพื่อเลือกท่าสำหรับกล้ามเนื้้อนั้น
      </p>

      {/* Exercise Picker Modal */}
      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  ท่าสำหรับ {zones.find((z) => z.id === selectedZone)?.label}
                </p>
                <p className="mt-0.5 text-lg font-black">{matchedExercises.length} ท่า</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="rounded-xl bg-zinc-900 p-2 text-zinc-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {matchedExercises.map((name) => {
                const ex = exercises.find((e) => e.name === name);
                if (!ex) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onPick(name);
                      setSelectedZone(null);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 text-left transition hover:border-emerald-500/40 hover:bg-zinc-800/80 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold">
                        <Dumbbell size={14} className="text-emerald-400" />
                        {name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {ex.group} · {ex.movement} ·{" "}
                        <span className="font-black text-emerald-300">{ex.tier}</span>
                      </p>
                    </div>
                    <Plus size={18} className="text-emerald-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
