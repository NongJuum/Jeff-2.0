"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Activity, ArrowLeftRight, Check, Flame, Trophy } from "lucide-react";
import { CardioDefinition, CardioExercisePicker, CARDIO_ACTIVITIES } from "./CardioExercisePicker";

interface CardioControllerProps {
  onSaveCardioLog: (data: {
    type: "treadmill" | "incline_walk" | "rower" | "bike" | "outdoor";
    durationMin: number;
    distanceKm?: number;
    paceOrSpeed?: string;
    inclinePercent?: number;
    notes?: string;
  }) => void;
  savedToast?: boolean;
}

export function CardioController({ onSaveCardioLog, savedToast = false }: CardioControllerProps) {
  // Activity Selection
  const [selectedActivity, setSelectedActivity] = useState<CardioDefinition>(CARDIO_ACTIVITIES[0]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Manual Timer State (Idle by default, timerRunning starts as FALSE)
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Metrics Input State
  const [primaryMetric, setPrimaryMetric] = useState<string>(""); // Distance or Incline
  const [speedPaceMetric, setSpeedPaceMetric] = useState<string>(""); // Speed / Pace / Resistance
  const [inclineMetric, setInclineMetric] = useState<string>(""); // Extra incline if applicable
  const [manualMinutes, setManualMinutes] = useState<string>(""); // Manual duration override

  // Timer interval handling
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  function formatDisplayTime(totalSeconds: number): string {
    if (totalSeconds === 0 && !timerRunning) return "00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const mStr = String(mins).padStart(2, "0");
    const sStr = String(secs).padStart(2, "0");
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  }

  function handleToggleTimer() {
    setTimerRunning((prev) => !prev);
  }

  function handleResetTimer() {
    setTimerRunning(false);
    setElapsedSeconds(0);
  }

  function handleFinishAndSave() {
    // Duration: timer seconds takes precedence if > 0, otherwise manual minutes
    const effectiveMinutes =
      elapsedSeconds > 0
        ? Math.max(1, Math.round((elapsedSeconds / 60) * 10) / 10)
        : parseFloat(manualMinutes);

    if (!effectiveMinutes || effectiveMinutes <= 0) {
      alert("กรุณาจับเวลาอย่างน้อย 1 นาที หรือระบุเวลาที่ช่องนาที");
      return;
    }

    const distVal = parseFloat(primaryMetric);
    const hasDist = !isNaN(distVal) && distVal > 0;

    const incVal = parseFloat(inclineMetric || (selectedActivity.type === "incline_walk" ? primaryMetric : ""));
    const hasIncline = !isNaN(incVal) && incVal > 0;

    onSaveCardioLog({
      type: selectedActivity.type,
      durationMin: effectiveMinutes,
      distanceKm: hasDist && selectedActivity.defaultMetric !== "incline_time" ? distVal : undefined,
      paceOrSpeed: speedPaceMetric.trim() || undefined,
      inclinePercent: hasIncline ? incVal : undefined,
      notes: `${selectedActivity.name}`,
    });

    // Reset inputs & timer
    setTimerRunning(false);
    setElapsedSeconds(0);
    setPrimaryMetric("");
    setSpeedPaceMetric("");
    setInclineMetric("");
    setManualMinutes("");
  }

  return (
    <div className="rounded-3xl bg-zinc-950 border border-zinc-800/80 p-4 sm:p-5 shadow-2xl mt-4">
      {/* 1. Header with Active Badge & Swap/Add Exercise Button */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shadow-inner shrink-0">
            {selectedActivity.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                ⚡ CARDIO & CONDITIONING
              </span>
              {savedToast && (
                <span className="text-[10px] font-black text-yellow-300 animate-pulse bg-yellow-950/40 px-1.5 py-0.5 rounded border border-yellow-800/40">
                  ✓ บันทึกสำเร็จ!
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-black text-white truncate">{selectedActivity.name}</h3>
          </div>
        </div>

        {/* Swap / Change Exercise Button */}
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-2 text-xs font-black text-yellow-300 transition active:scale-95 shrink-0"
          title="สลับหรือเปลี่ยนท่าคาร์ดิโอ"
        >
          <ArrowLeftRight size={13} />
          <span>สลับท่า</span>
        </button>
      </div>

      {/* 2. Manual Timer & Trigger Controller (Apple Watch / Hevy Style) */}
      <div className="my-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cardio Stopwatch</p>
        
        {/* Large Timer Display */}
        <div className="my-2 flex items-baseline justify-center gap-2">
          <span className="font-mono font-black text-4xl sm:text-5xl tracking-tight text-white tabular-nums drop-shadow-[0_0_15px_rgba(250,204,21,0.15)]">
            {formatDisplayTime(elapsedSeconds)}
          </span>
          {timerRunning && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-400" />
            </span>
          )}
        </div>

        {/* Guidance Prompt */}
        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
          {timerRunning
            ? "กำลังจับเวลา... ออกกำลังกายตามเพซเป้าหมาย"
            : elapsedSeconds > 0
            ? "หยุดชั่วคราว กดต่อเวลา หรือบันทึกผลได้เลย"
            : "กดปุ่มด้านล่างเพื่อเริ่มจับเวลาเมื่อคุณพร้อม"}
        </p>

        {/* Primary Manual Action Buttons */}
        <div className="mt-3.5 flex items-center justify-center gap-2.5">
          {!timerRunning ? (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="flex-1 max-w-xs flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider py-3.5 text-xs shadow-lg shadow-yellow-500/25 transition active:scale-95 min-h-[44px]"
            >
              <Play size={16} className="fill-black" />
              <span>{elapsedSeconds > 0 ? "ต่อเวลา (RESUME)" : "+ เริ่มคาร์ดิโอ (START CARDIO)"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="flex-1 max-w-xs flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-yellow-500/40 font-black uppercase tracking-wider py-3.5 text-xs shadow-lg transition active:scale-95 min-h-[44px]"
            >
              <Pause size={16} />
              <span>หยุดชั่วคราว (PAUSE)</span>
            </button>
          )}

          {elapsedSeconds > 0 && (
            <button
              type="button"
              onClick={handleResetTimer}
              className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="รีเซ็ตเวลา"
              aria-label="Reset stopwatch"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Dynamic Metric Input Fields according to Selected Activity */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            บันทึกสถิติ ({selectedActivity.name})
          </span>
          <span className="text-[10px] text-zinc-500">
            {elapsedSeconds > 0 ? `เวลาที่นับได้: ${Math.round(elapsedSeconds / 60)} นาที` : "หรือระบุเวลาด้วยตนเอง"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Cell 1: Primary Metric (Distance or Incline) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 truncate">
              {selectedActivity.primaryUnit}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={selectedActivity.defaultMetric === "incline_time" ? "12" : "5.00"}
              value={primaryMetric}
              onChange={(e) => setPrimaryMetric(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-center text-sm font-black text-yellow-300 tabular-nums font-mono focus:border-yellow-400 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Cell 2: Duration Override (if timer wasn't used) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1">
              เวลา (MIN)
            </span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder={elapsedSeconds > 0 ? String(Math.round(elapsedSeconds / 60)) : "30"}
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-center text-sm font-black text-yellow-300 tabular-nums font-mono focus:border-yellow-400 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Cell 3: Pace / Speed / Resistance */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-2.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1 truncate">
              {selectedActivity.paceLabel}
            </span>
            <input
              type="text"
              placeholder={selectedActivity.speedPlaceholder}
              value={speedPaceMetric}
              onChange={(e) => setSpeedPaceMetric(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-center text-sm font-black text-yellow-300 tabular-nums font-mono focus:border-yellow-400 focus:outline-none min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* 4. Complete & Save Action Button */}
      <button
        type="button"
        onClick={handleFinishAndSave}
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider py-3.5 rounded-xl transition active:scale-95 shadow-md shadow-yellow-500/20 text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
      >
        <Check size={16} className="stroke-[3]" />
        <span>+ บันทึกเซสชันคาร์ดิโอ</span>
      </button>

      {/* 5. Exercise Picker / Swap Modal */}
      <CardioExercisePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedActivityId={selectedActivity.id}
        onSelectActivity={(act) => setSelectedActivity(act)}
      />
    </div>
  );
}
