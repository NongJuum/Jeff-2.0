"use client";
import React, { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronRight, X } from "lucide-react";
import { WeeklyTrendChart, type WeeklyScore } from "./WeeklyTrendChart";

interface AppleActivityRingProps {
  score: number; // 0-100
  rank?: string;
  weeklyScores: WeeklyScore[];
  streakWeeks?: number;
  onOpenScoreDetails?: () => void;
}

export function AppleActivityRing({
  score,
  rank = "Inter",
  weeklyScores,
  streakWeeks = 0,
  onOpenScoreDetails,
}: AppleActivityRingProps) {
  const [showWeeklySheet, setShowWeeklySheet] = useState(false);

  // Ring geometry - Enlarged & Striking
  const size = 130;
  const strokeWidth = 11;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Normalized progress (clamped between 0 and 100)
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Weekly delta calculation
  let deltaText = "คงที่";
  let deltaValue = 0;
  let isPositive = false;
  let isNegative = false;

  if (weeklyScores.length >= 2) {
    const prev = weeklyScores[weeklyScores.length - 2]?.score ?? score;
    const curr = weeklyScores[weeklyScores.length - 1]?.score ?? score;
    deltaValue = curr - prev;
    if (deltaValue > 0) {
      deltaText = `+${deltaValue} pts this week`;
      isPositive = true;
    } else if (deltaValue < 0) {
      deltaText = `${deltaValue} pts this week`;
      isNegative = true;
    } else {
      deltaText = `±0 pts this week`;
    }
  } else if (score > 0) {
    deltaText = `สัปดาห์แรก · ${rank}`;
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 shadow-xl transition-all">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Apple Fitness Ring & Centered Score */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center shrink-0 w-[130px] h-[130px]">
              <svg width={size} height={size} className="-rotate-90">
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="appleRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#FACC15" />
                  </linearGradient>
                </defs>

                {/* Dark Background Track */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#1c1917"
                  strokeWidth={strokeWidth}
                />

                {/* Glowing Progress Stroke */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="url(#appleRingGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Center Score Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-4xl font-black tracking-tight text-white leading-none">
                  {score > 0 ? score : "—"}
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-500 leading-none mt-1.5">
                  /100
                </span>
              </div>
            </div>

            {/* Middle: Title, Rank, Delta Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-yellow-400">
                  ACTIVITY SCORE
                </span>
                {streakWeeks > 0 && (
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    🔥 {streakWeeks}w
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="rounded-md bg-yellow-400/10 border border-yellow-500/30 px-2.5 py-0.5 text-xs font-black text-yellow-300">
                  🏆 Rank: {rank}
                </span>
              </div>

              {/* Compact Delta Badge */}
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : isNegative
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                  }`}
                >
                  {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : <Minus size={11} />}
                  <span>{deltaText}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Subtle (i) button and History */}
          <div className="flex flex-col items-end justify-between h-full gap-2 shrink-0">
            {onOpenScoreDetails && (
              <button
                type="button"
                onClick={onOpenScoreDetails}
                className="flex items-center gap-1 rounded-full p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-900 border border-zinc-800/80 transition active:scale-90"
                title="ดูรายละเอียดเกณฑ์คะแนน"
                aria-label="ดูรายละเอียดเกณฑ์คะแนน"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-serif italic font-bold border border-zinc-700 text-zinc-300 hover:border-yellow-400 hover:text-yellow-300">
                  i
                </span>
              </button>
            )}

            {weeklyScores.length >= 2 && (
              <button
                type="button"
                onClick={() => setShowWeeklySheet(true)}
                className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:text-white hover:border-yellow-400/50 transition active:scale-95"
                title="ดูแนวโน้มรายสัปดาห์"
              >
                <span>ประวัติ</span>
                <ChevronRight size={12} className="text-zinc-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Weekly Breakdown Bottom Sheet */}
      {showWeeklySheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-yellow-400">
                  WEEKLY BREAKDOWN
                </p>
                <h3 className="text-base font-black text-white mt-0.5">
                  แนวโน้มคะแนนการฝึกย้อนหลัง
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeeklySheet(false)}
                className="rounded-xl bg-zinc-900 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <WeeklyTrendChart scores={weeklyScores.slice(-8)} />

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  ประวัติคะแนนแยกตามสัปดาห์
                </p>
                <div className="space-y-1.5">
                  {weeklyScores.slice(-6).reverse().map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-zinc-950 px-3 py-2 text-xs font-mono"
                    >
                      <span className="text-zinc-400">
                        {new Date(w.weekStart).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase">{w.rank}</span>
                        <span className="font-black text-yellow-300 font-mono">{w.score} / 100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 p-3 bg-zinc-950">
              <button
                type="button"
                onClick={() => setShowWeeklySheet(false)}
                className="w-full rounded-2xl bg-zinc-900 py-3 text-xs font-black uppercase tracking-wider text-zinc-200 hover:bg-zinc-800 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
