"use client";

import React, { useState, useMemo } from "react";
import { Search, X, Check, Flame, Activity } from "lucide-react";

export interface CardioDefinition {
  id: string;
  type: "treadmill" | "incline_walk" | "rower" | "bike" | "outdoor";
  name: string;
  category: "Running & Walking" | "Ergometer & Machine" | "Cycling" | "Conditioning";
  description: string;
  icon: string;
  defaultMetric: "distance_time" | "incline_time" | "split_time" | "resistance_time";
  primaryUnit: string;
  secondaryUnit: string;
  paceLabel: string;
  speedPlaceholder: string;
}

export const CARDIO_ACTIVITIES: CardioDefinition[] = [
  {
    id: "treadmill_run",
    type: "treadmill",
    name: "Treadmill Run",
    category: "Running & Walking",
    description: "วิ่งสายพานปรับความเร็วคงที่ คาร์ดิโอโซน 2 หรือ Interval",
    icon: "🏃‍♂️",
    defaultMetric: "distance_time",
    primaryUnit: "KM",
    secondaryUnit: "MIN",
    paceLabel: "ความเร็ว (KM/H)",
    speedPlaceholder: "10.0",
  },
  {
    id: "incline_walk",
    type: "incline_walk",
    name: "Incline Treadmill Walk",
    category: "Running & Walking",
    description: "เดินชันบนลู่วิ่ง (12-3-30) เผาผลาญไขมัน ลดแรงกระแทกข้อต่อ",
    icon: "🧗",
    defaultMetric: "incline_time",
    primaryUnit: "ความชัน (INC %)",
    secondaryUnit: "MIN",
    paceLabel: "ความเร็ว (KM/H)",
    speedPlaceholder: "5.0",
  },
  {
    id: "outdoor_run",
    type: "outdoor",
    name: "Outdoor Run / Walk",
    category: "Running & Walking",
    description: "วิ่งหรือเดินกลางแจ้ง ถนนหรือสวนสาธารณะ",
    icon: "👟",
    defaultMetric: "distance_time",
    primaryUnit: "KM",
    secondaryUnit: "MIN",
    paceLabel: "Pace (min/km)",
    speedPlaceholder: "6:00",
  },
  {
    id: "rower_erg",
    type: "rower",
    name: "Concept2 Rower (Ergometer)",
    category: "Ergometer & Machine",
    description: "กรรเชียงบก Full Body Endurance & HYROX Simulation",
    icon: "🚣",
    defaultMetric: "split_time",
    primaryUnit: "ระยะทาง (M / KM)",
    secondaryUnit: "MIN",
    paceLabel: "/500m Pace หรือ SPM",
    speedPlaceholder: "2:05",
  },
  {
    id: "ski_erg",
    type: "rower",
    name: "SkiErg / Hyrox Ski",
    category: "Ergometer & Machine",
    description: "ดึงสกี คาร์ดิโอลำตัวท่อนบน & Core conditioning",
    icon: "⛷️",
    defaultMetric: "split_time",
    primaryUnit: "ระยะทาง (M / KM)",
    secondaryUnit: "MIN",
    paceLabel: "/500m Split",
    speedPlaceholder: "2:10",
  },
  {
    id: "stationary_bike",
    type: "bike",
    name: "Stationary / Echo Bike",
    category: "Cycling",
    description: "ปั่นจักรยานฟิตเนส หรือ Assault/Echo Air Bike คาร์ดิโอเข้มข้น",
    icon: "🚴",
    defaultMetric: "resistance_time",
    primaryUnit: "KM หรือ CAL",
    secondaryUnit: "MIN",
    paceLabel: "RPM / Watt / Level",
    speedPlaceholder: "Level 8",
  },
  {
    id: "spin_bike",
    type: "bike",
    name: "Spin Bike High Intensity",
    category: "Cycling",
    description: "สปินไบค์แบบมีจานล้อเหล็ก เพิ่มความแข็งแกร่งกล้ามเนื้อขา",
    icon: "🚲",
    defaultMetric: "resistance_time",
    primaryUnit: "KM",
    secondaryUnit: "MIN",
    paceLabel: "แรงต้าน / RPM",
    speedPlaceholder: "75 RPM",
  },
  {
    id: "stairmaster",
    type: "incline_walk",
    name: "StairMaster / Stepmill",
    category: "Conditioning",
    description: "เดินขึ้นบันไดต่อเนื่อง เสริม Glutes และระบบหัวใจ",
    icon: "🪜",
    defaultMetric: "incline_time",
    primaryUnit: "ชั้น (Floors)",
    secondaryUnit: "MIN",
    paceLabel: "Steps/Min (Level)",
    speedPlaceholder: "Level 7",
  },
  {
    id: "hyrox_sled_compromised",
    type: "outdoor",
    name: "Sled Push / Compromised Run",
    category: "Conditioning",
    description: "ฝึกดันลาก Sled สลับวิ่ง HYROX style",
    icon: "⚡",
    defaultMetric: "distance_time",
    primaryUnit: "รอบ / ระยะ (M)",
    secondaryUnit: "MIN",
    paceLabel: "น้ำหนัก / Pace",
    speedPlaceholder: "100kg sled",
  },
];

interface CardioExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedActivityId: string;
  onSelectActivity: (activity: CardioDefinition) => void;
}

export function CardioExercisePicker({
  isOpen,
  onClose,
  selectedActivityId,
  onSelectActivity,
}: CardioExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set(CARDIO_ACTIVITIES.map((a) => a.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredActivities = useMemo(() => {
    return CARDIO_ACTIVITIES.filter((a) => {
      const matchQuery =
        !searchQuery.trim() ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "All" || a.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-[32px] sm:rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-400">
              <Activity size={13} />
              <span>Cardio Activity Selector</span>
            </div>
            <h3 className="text-base font-black text-white mt-0.5">เลือกหรือสลับประเภทคาร์ดิโอ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3.5 relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา เช่น Treadmill, Rower, Bike, StairMaster..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition ${
                selectedCategory === cat
                  ? "bg-yellow-400 text-black font-black"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Activities List */}
        <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
          {filteredActivities.map((activity) => {
            const isSelected = selectedActivityId === activity.id;
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => {
                  onSelectActivity(activity);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-2xl border transition flex items-start gap-3 active:scale-[0.99] ${
                  isSelected
                    ? "bg-zinc-900/90 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-black truncate ${isSelected ? "text-yellow-300" : "text-white"}`}>
                      {activity.name}
                    </p>
                    {isSelected && (
                      <span className="flex items-center gap-1 rounded-md bg-yellow-400 text-black px-1.5 py-0.5 text-[9px] font-black shrink-0">
                        <Check size={10} className="stroke-[3]" /> เลือกอยู่
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{activity.description}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span>{activity.primaryUnit}</span>
                    <span>·</span>
                    <span>{activity.paceLabel}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredActivities.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              ไม่พบกิจกรรมคาร์ดิโอที่ค้นหา ลองค้นหาด้วยคำอื่น
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
