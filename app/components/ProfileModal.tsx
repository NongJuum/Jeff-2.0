"use client";
import React from "react";
import { X, User, Trophy, Flame, Download, Settings, Info, Scale, ShieldCheck } from "lucide-react";
import { getOnboardingResult } from "./OnboardingWizard";
import { getMigrationResult } from "../lib/migration";
import { getCurrentBodyweight } from "./BodyweightManager";
import type { WeightUnit } from "../lib/units";

type Props = {
  open: boolean;
  onClose: () => void;
  logsCount: number;
  recordsCount: number;
  streak: number;
  preferredUnit?: WeightUnit;
  onUnitChange?: (unit: WeightUnit) => void;
  onExportLogs: () => void;
  onOpenAssessment?: () => void;
};

export function ProfileModal({
  open,
  onClose,
  logsCount,
  recordsCount,
  streak,
  preferredUnit = "kg",
  onUnitChange,
  onExportLogs,
  onOpenAssessment,
}: Props) {
  if (!open) return null;

  const onboarding = getOnboardingResult();
  const migration = getMigrationResult();
  const bw = getCurrentBodyweight();

  const level = onboarding?.level || migration?.level || "intermediate";
  const goal = onboarding?.goal || migration?.goal || "hypertrophy";
  const days = onboarding?.days || migration?.days || 4;

  const levelLabels = {
    beginner: "🌱 มือใหม่ (Beginner)",
    intermediate: "💪 ปานกลาง (Intermediate)",
    advanced: "🔥 ขั้นสูง (Advanced)",
  };

  const goalLabels = {
    strength: "🏋️ Strength (เน้นแรง)",
    hypertrophy: "📈 Hypertrophy (เน้นกล้าม)",
    fitness: "❤️ General Fitness (สุขภาพดี)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <User size={20} className="text-emerald-400" />
            <h3 className="text-lg font-black">Profile & Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* User Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-2xl font-black text-emerald-400">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-zinc-100">HA IT Athlete</p>
                <p className="text-xs text-zinc-400">{levelLabels[level]}</p>
              </div>
              {streak > 0 && (
                <span className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-300">
                  <Flame size={14} />
                  <span>{streak}w</span>
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500">เป้าหมาย</p>
                <p className="text-xs font-black text-emerald-300 mt-0.5">{goalLabels[goal]?.split(" ")[1] || goal}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500">วันฝึก/สัปดาห์</p>
                <p className="text-xs font-black text-zinc-100 mt-0.5">{days} วัน</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500">น้ำหนักตัว</p>
                <p className="text-xs font-black text-zinc-100 mt-0.5">
                  {bw
                    ? preferredUnit === "kg"
                      ? `${Math.round(bw.lbs * 0.453592 * 10) / 10} kg`
                      : `${Math.round(bw.lbs)} lbs`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-zinc-800/80 pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAssessment?.();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 py-2.5 text-xs font-black text-zinc-950 transition hover:bg-emerald-300 active:scale-95 shadow-sm"
              >
                <Settings size={14} /> แก้ไขข้อมูลสรีระ & ประเมินแรง AI
              </button>
            </div>
          </div>

          {/* Unit Settings */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">⚖️ หน่วยน้ำหนักหลัก (Global Unit)</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">ใช้เป็นค่าเริ่มต้นสำหรับสร้างและบันทึกเซต</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUnitChange?.("kg")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
                  preferredUnit === "kg"
                    ? "bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                <span>กิโลกรัม (kg)</span>
                {preferredUnit === "kg" && <span className="rounded-full bg-zinc-950/20 px-1.5 py-0.2 text-[10px]">Active</span>}
              </button>
              <button
                type="button"
                onClick={() => onUnitChange?.("lbs")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
                  preferredUnit === "lbs"
                    ? "bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                <span>ปอนด์ (lbs)</span>
                {preferredUnit === "lbs" && <span className="rounded-full bg-zinc-950/20 px-1.5 py-0.2 text-[10px]">Active</span>}
              </button>
            </div>
          </div>

          {/* Training Stats summary */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">📊 สถิติการฝึกรวม</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500">จำนวนเซตที่บันทึก</p>
                <p className="mt-1 text-lg font-black text-emerald-300">{logsCount} เซต</p>
              </div>
              <div className="rounded-xl bg-zinc-900 p-3">
                <p className="text-xs text-zinc-500">สถิติ PR สูงสุด</p>
                <p className="mt-1 text-lg font-black text-emerald-300">{recordsCount} ท่า</p>
              </div>
            </div>
          </div>

          {/* Backup & Export */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">💾 สำรองข้อมูล (Backup)</p>
            <button
              type="button"
              onClick={onExportLogs}
              className="flex w-full items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-800"
            >
              <span className="flex items-center gap-2">
                <Download size={16} className="text-emerald-400" /> ส่งออกประวัติการฝึก (CSV)
              </span>
              <span className="text-xs text-zinc-500">Export</span>
            </button>
          </div>

          {/* App Info */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-center space-y-1">
            <p className="text-xs font-black text-zinc-300">HA IT Workout Tracker Pro</p>
            <p className="text-[11px] text-zinc-500">เวอร์ชัน 3.0.0 · Jeff Nippard Hypertrophy Principles</p>
            <p className="text-[10px] text-emerald-400/80">Client-side & Offline First · 100% Private</p>
          </div>
        </div>
      </div>
    </div>
  );
}
