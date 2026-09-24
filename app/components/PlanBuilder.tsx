"use client";
import React, { useState } from "react";
import { GripVertical, Plus, Trash2, AlertTriangle } from "lucide-react";

export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Abs & Calves";
export type LoadType = "barbell" | "dumbbell" | "selectorized" | "plate-loaded" | "smith" | "cable" | "bodyweight" | "specialty";

export type Exercise = {
  name: string;
  group: MuscleGroup;
  movement: string;
  muscles: string[];
  tier: "S+" | "S" | "A+" | "A";
  load: LoadType;
};

export type PlanExercise = {
  id: string;
  name: string;
  group: MuscleGroup;
  sets: number;
  reps: string;
  warmup: boolean;
  muscles: string[];
  movement: string;
  load: LoadType;
};

type PlanBuilderProps = {
  exercises: PlanExercise[];
  library: Exercise[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
};

export function PlanBuilder({
  exercises,
  library,
  onAdd,
  onRemove,
  onReorder,
}: PlanBuilderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // คำนวณ volume เตือนแบบ real-time
  const volumeWarning = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ex of exercises) {
      for (const m of ex.muscles) {
        counts[m] = (counts[m] ?? 0) + ex.sets;
      }
    }
    return Object.entries(counts).filter(([, sets]) => sets > 20);
  }, [exercises]);

  const handleDrop = (to: number) => {
    if (dragIndex !== null && dragIndex !== to) {
      onReorder(dragIndex, to);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Left: Library */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
        <h4 className="mb-3 text-sm font-black text-emerald-300">
          📚 ท่าออกกำลังกาย (แตะเพื่อเพิ่ม)
        </h4>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {library.map((ex) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => onAdd(ex.name)}
              className="flex w-full items-center justify-between rounded-xl bg-zinc-950 px-3 py-2 text-left text-sm transition hover:bg-zinc-800"
            >
              <span>
                <span className="font-bold">{ex.name}</span>
                <span className="block text-xs text-zinc-500">
                  {ex.group} · {ex.tier}
                </span>
              </span>
              <Plus size={16} className="text-emerald-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Right: Day Timeline (Drag & Drop) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
        <h4 className="mb-3 text-sm font-black text-emerald-300">
          📋 ตารางวันนี้ (ลากเพื่อจัดลำดับ)
        </h4>

        {/* Volume Warning */}
        {volumeWarning.length > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              ระวัง! Volume สูงเกินไป:{" "}
              {volumeWarning.map(([m, s]) => `${m} (${s} เซต)`).join(", ")}{" "}
              — แนะนำไม่เกิน 20 เซต/สัปดาห์
            </span>
          </div>
        )}

        <div className="space-y-2">
          {exercises.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
              ยังไม่มีท่า — แตะจากฝั่งซ้ายเพื่อเพิ่ม
            </div>
          ) : (
            exercises.map((ex, index) => (
              <div
                key={ex.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDrop={() => handleDrop(index)}
                className={`flex items-center gap-2 rounded-xl border p-3 transition ${
                  dragOverIndex === index
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-zinc-800 bg-zinc-950"
                } ${dragIndex === index ? "opacity-50" : ""}`}
              >
                <GripVertical size={16} className="cursor-grab text-zinc-600" />
                <span className="text-xs font-black text-zinc-500">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{ex.name}</p>
                  <p className="text-xs text-zinc-500">
                    {ex.sets} เซต × {ex.reps}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(ex.id)}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  aria-label={`Remove ${ex.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
