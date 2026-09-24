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

export function BodyweightManager({ open, onClose, currentPrs }: Props) {
  const [entry, setEntry] = useState<BodyweightEntry | null>(null);
  const [inputLbs, setInputLbs] = useState("");

  useEffect(() => {
    if (open) {
      const current = getCurrentBodyweight();
      setEntry(current);
      setInputLbs(current ? String(Math.round(current.lbs)) : "");
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    const lbs = Number(inputLbs);
    if (!Number.isFinite(lbs) || lbs <= 0 || lbs > 1000) return;
    const newEntry: BodyweightEntry = { lbs, updatedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(BODYWEIGHT_KEY, JSON.stringify(newEntry));
    } catch {}
    setEntry(newEntry);
  };

  // คำนวณ Relative Strength สำหรับท่าหลัก
  const bw = entry?.lbs ?? 0;
  const ratios = currentPrs && bw > 0 ? [
    { name: "Bench Press", pr: currentPrs["Bench Press"] || Object.entries(currentPrs).find(([k]) => k.toLowerCase().includes("bench press"))?.[1], target: 1.5, unit: "× BW" },
    { name: "Squat", pr: currentPrs["Barbell Back Squat"] || currentPrs["Hack Squat"] || Object.entries(currentPrs).find(([k]) => k.toLowerCase().includes("squat"))?.[1], target: 2.0, unit: "× BW" },
    { name: "Deadlift", pr: currentPrs["Deadlift"] || currentPrs["Romanian Deadlift RDL"] || Object.entries(currentPrs).find(([k]) => k.toLowerCase().includes("deadlift"))?.[1], target: 2.5, unit: "× BW" },
  ].filter((r) => r.pr) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-emerald-400" />
            <h3 className="text-lg font-black">Bodyweight & Relative Strength</h3>
          </div>
          <button onClick={onClose} className="rounded-xl bg-zinc-900 p-2 text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Input */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">
              น้ำหนักตัวปัจจุบัน
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={inputLbs}
                onChange={(e) => setInputLbs(e.target.value)}
                placeholder="เช่น 165"
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg font-black outline-none focus:border-emerald-400"
              />
              <span className="flex items-center px-3 text-sm font-bold text-zinc-400">lbs</span>
              <button
                onClick={save}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-zinc-950"
              >
                Save
              </button>
            </div>
            {entry && (
              <p className="mt-1 text-[11px] text-zinc-500">
                อัปเดตล่าสุด: {new Date(entry.updatedAt).toLocaleDateString("th-TH")}
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
                        <span>{r.pr!.weightLbs} lbs</span>
                        <span>เป้าหมาย: {r.target}× BW</span>
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
