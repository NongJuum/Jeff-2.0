"use client";
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type WeeklyScore = {
  weekStart: string; // ISO date
  score: number;
  rank: string;
};

type Props = {
  scores: WeeklyScore[]; // ต้องมี 4 items (เรียงจากเก่า → ใหม่)
};

export function WeeklyTrendChart({ scores }: Props) {
  if (scores.length < 2) {
    return (
      <div className="rounded-xl bg-zinc-950 p-3 text-center text-xs text-zinc-500">
        ต้องมีข้อมูลอย่างน้อย 2 สัปดาห์เพื่อดูแนวโน้ม
      </div>
    );
  }

  const maxScore = 100;
  const width = 280;
  const height = 80;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // คำนวณจุดของแต่ละสัปดาห์
  const points = scores.map((s, i) => ({
    x: padding.left + (i / (scores.length - 1)) * chartW,
    y: padding.top + chartH - (s.score / maxScore) * chartH,
    score: s.score,
    weekStart: s.weekStart,
  }));

  // สร้าง path สำหรับเส้นกราฟ
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // สร้าง path สำหรับ gradient fill (ปิดด้านล่าง)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // คำนวณ trend
  const firstScore = scores[0].score;
  const lastScore = scores[scores.length - 1].score;
  const diff = lastScore - firstScore;
  const trend = diff > 5 ? "up" : diff < -5 ? "down" : "flat";
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#a1a1aa";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">
            {scores.length}-Week Trend (Score History)
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-black" style={{ color: trendColor }}>
            <TrendIcon size={14} />
            {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "คงที่"} คะแนน
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-500">สัปดาห์ล่าสุด</p>
          <p className="text-lg font-black text-emerald-300">{lastScore}/100</p>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill="url(#trendGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill={i === points.length - 1 ? "#10b981" : "#09090b"}
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Label เฉพาะจุดแรกและสุดท้าย */}
            {(i === 0 || i === points.length - 1) && (
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                fill="#71717a"
                fontSize="9"
                fontWeight="bold"
              >
                {new Date(p.weekStart).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
