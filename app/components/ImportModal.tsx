"use client";
import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileUp } from "lucide-react";
import type { LogSet } from "../page";
import { type WeightUnit } from "../lib/units";

export interface BackupMetadata {
  records?: Record<string, any>;
  recordsMap?: Record<string, any>;
  userProfile?: any;
  machineStartingResistances?: Record<string, string>;
  pulleyRatios?: Record<string, "1" | "2" | "3">;
  cableMachineConfigs?: Record<string, any>;
  favoriteMachines?: Record<string, string>;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportLogs: (logs: LogSet[], mode: "merge" | "replace", backupData?: BackupMetadata) => void;
  existingLogsCount: number;
}

export function parseWorkoutCsv(content: string): LogSet[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse CSV line taking quotes into account
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerCells = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""));

  const getColIndex = (...candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headerCells.findIndex((h) => h === c.toLowerCase().replace(/[\s_-]+/g, ""));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = getColIndex("date", "timestamp", "datetime", "time", "createdat", "วันที่", "เวลา", "วัน");
  const exIdx = getColIndex("exercise", "exercisename", "name", "movement", "ท่า", "ท่าฝึก", "ชื่อท่า", "รายการ");
  const machineIdx = getColIndex("machine", "equipment", "variant", "machinetag", "เครื่อง", "อุปกรณ์", "ประเภทเครื่อง");
  const setIdx = getColIndex("set", "setnumber", "setnum", "setno", "เซต", "เซ็ต", "รอบ");
  const weightIdx = getColIndex("weight", "load", "rawweight", "displayweight", "น้ำหนัก", "โหลด");
  const unitIdx = getColIndex("unit", "weightunit", "หน่วย");
  const normWeightIdx = getColIndex("normalizedweightlbs", "weightlbs", "lbs", "normlbs");
  const repsIdx = getColIndex("reps", "rep", "repetitions", "count", "จำนวนครั้ง", "ครั้ง", "เรป");

  if (exIdx === -1 && repsIdx === -1) {
    return [];
  }

  const result: LogSet[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

    const rawExercise = exIdx !== -1 && cells[exIdx] ? cells[exIdx].trim() : "";
    if (!rawExercise) continue;

    const rawDate = dateIdx !== -1 && cells[dateIdx] ? cells[dateIdx].trim() : new Date().toISOString();
    let parsedDateStr = rawDate;
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        parsedDateStr = d.toISOString();
      }
    } catch {
      parsedDateStr = new Date().toISOString();
    }

    const rawMachine = machineIdx !== -1 && cells[machineIdx] ? cells[machineIdx].trim() : "";
    const cleanMachine = rawMachine === "-" || !rawMachine ? undefined : rawMachine;

    const setNum = setIdx !== -1 && cells[setIdx] ? parseInt(cells[setIdx], 10) || 1 : 1;
    const reps = repsIdx !== -1 && cells[repsIdx] ? parseInt(cells[repsIdx], 10) || 0 : 0;
    const rawWeightVal = weightIdx !== -1 && cells[weightIdx] ? parseFloat(cells[weightIdx]) || 0 : 0;

    let unit: WeightUnit = "kg";
    if (unitIdx !== -1 && cells[unitIdx]) {
      const uStr = cells[unitIdx].toLowerCase().trim();
      if (uStr.includes("lb")) unit = "lbs";
      else unit = "kg";
    }

    let weightLbs = 0;
    if (normWeightIdx !== -1 && cells[normWeightIdx]) {
      weightLbs = parseFloat(cells[normWeightIdx]) || 0;
    } else {
      weightLbs = unit === "kg" ? Math.round(rawWeightVal * 2.20462262 * 100) / 100 : rawWeightVal;
    }

    if (weightLbs <= 0 && rawWeightVal > 0) {
      weightLbs = unit === "kg" ? rawWeightVal * 2.20462262 : rawWeightVal;
    }

    result.push({
      exerciseId: `ex_${rawExercise.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      exerciseName: rawExercise,
      machine: cleanMachine,
      setNumber: Math.max(1, setNum),
      reps: Math.max(0, reps),
      weightLbs: Math.round(weightLbs * 100) / 100,
      unit,
      rawValue: rawWeightVal > 0 ? rawWeightVal : (unit === "kg" ? Math.round(weightLbs * 0.453592 * 10) / 10 : weightLbs),
      date: parsedDateStr,
    });
  }

  return result;
}

export function parseWorkoutJsonWithMetadata(content: string): { logs: LogSet[]; backupData?: BackupMetadata } {
  try {
    let parsed = JSON.parse(content);
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch {}
    }

    let rawArray: any = null;
    let backupData: BackupMetadata | undefined;

    if (Array.isArray(parsed)) {
      rawArray = parsed;
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.logs)) {
        rawArray = parsed.logs;
      } else if (Array.isArray(parsed.trainingLatestV2)) {
        rawArray = parsed.trainingLatestV2;
      } else if (typeof parsed.trainingLatestV2 === "string") {
        try { rawArray = JSON.parse(parsed.trainingLatestV2); } catch {}
      } else if (Array.isArray(parsed.latestLogs)) {
        rawArray = parsed.latestLogs;
      } else if (typeof parsed.latestLogs === "string") {
        try { rawArray = JSON.parse(parsed.latestLogs); } catch {}
      } else if (Array.isArray(parsed.history)) {
        rawArray = parsed.history;
      } else if (Array.isArray(parsed.workoutHistory)) {
        rawArray = parsed.workoutHistory;
      } else if (parsed.data && Array.isArray(parsed.data.logs)) {
        rawArray = parsed.data.logs;
      } else if (parsed.data && Array.isArray(parsed.data.trainingLatestV2)) {
        rawArray = parsed.data.trainingLatestV2;
      }

      // Helper to parse stringified JSON if needed
      const parseVal = (val: any) => {
        if (typeof val === "string") {
          try { return JSON.parse(val); } catch { return undefined; }
        }
        return val;
      };

      // Check for additional backup metadata
      const recs = parseVal(parsed.records || parsed.recordsMap || parsed.permanentRecords || parsed.haitPermanentRecordsV1);
      const mRes = parseVal(parsed.machineStartingResistances || parsed.haitMachineStartingResistancesV1);
      const pRatios = parseVal(parsed.pulleyRatios || parsed.haitPulleyRatiosV1);
      const cConfigs = parseVal(parsed.cableMachineConfigs || parsed.haitCableConfigsV1);
      const fMachines = parseVal(parsed.favoriteMachines || parsed.haitFavoriteMachinesV1);
      const uProf = parseVal(parsed.userProfile || parsed.haitUserProfileV1);

      if (recs || mRes || pRatios || cConfigs || fMachines || uProf) {
        backupData = {
          records: recs && typeof recs === "object" ? recs : undefined,
          recordsMap: recs && typeof recs === "object" ? recs : undefined,
          machineStartingResistances: mRes && typeof mRes === "object" ? mRes : undefined,
          pulleyRatios: pRatios && typeof pRatios === "object" ? pRatios : undefined,
          cableMachineConfigs: cConfigs && typeof cConfigs === "object" ? cConfigs : undefined,
          favoriteMachines: fMachines && typeof fMachines === "object" ? fMachines : undefined,
          userProfile: uProf && typeof uProf === "object" ? uProf : undefined,
        };
      }
    }

    if (!rawArray || !Array.isArray(rawArray)) {
      return { logs: [], backupData };
    }

    const result: LogSet[] = [];
    for (const item of rawArray) {
      if (!item || typeof item !== "object") continue;
      const exName = item.exerciseName || item.exercise || item.name;
      if (!exName || typeof exName !== "string") continue;

      const reps = Number(item.reps) || 0;
      const setNumber = Number(item.setNumber || item.set) || 1;
      const unit: WeightUnit = item.unit === "lbs" ? "lbs" : "kg";

      let weightLbs = Number(item.weightLbs) || 0;
      const rawVal = Number(item.rawValue || item.weight || item.load) || 0;

      if (weightLbs <= 0 && rawVal > 0) {
        weightLbs = unit === "kg" ? rawVal * 2.20462262 : rawVal;
      }

      let dateStr = typeof item.date === "string" ? item.date : new Date().toISOString();
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) dateStr = d.toISOString();
      } catch {
        dateStr = new Date().toISOString();
      }

      result.push({
        exerciseId: item.exerciseId || `ex_${exName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        exerciseName: exName,
        machine: item.machine || undefined,
        setNumber: Math.max(1, setNumber),
        reps: Math.max(0, reps),
        weightLbs: Math.round(weightLbs * 100) / 100,
        unit,
        rawValue: rawVal > 0 ? rawVal : (unit === "kg" ? Math.round(weightLbs * 0.453592 * 10) / 10 : weightLbs),
        date: dateStr,
      });
    }

    return { logs: result, backupData };
  } catch {
    return { logs: [] };
  }
}

export function parseWorkoutJson(content: string): LogSet[] {
  return parseWorkoutJsonWithMetadata(content).logs;
}

export function ImportModal({ open, onClose, onImportLogs, existingLogsCount }: ImportModalProps) {
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parsedLogs, setParsedLogs] = useState<LogSet[]>([]);
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata | undefined>(undefined);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleProcessText(text: string, name = "manual_input") {
    setErrorMsg("");
    setFileContent(text);
    setFileName(name);

    const trimmed = text.trim();
    if (!trimmed) {
      setParsedLogs([]);
      setBackupMetadata(undefined);
      return;
    }

    let logs: LogSet[] = [];
    let meta: BackupMetadata | undefined;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const res = parseWorkoutJsonWithMetadata(trimmed);
      logs = res.logs;
      meta = res.backupData;
    } else {
      logs = parseWorkoutCsv(trimmed);
    }

    if (logs.length === 0) {
      setErrorMsg("ไม่พบข้อมูลเซตการฝึกที่ถูกต้อง กรุณาตรวจสอบรูปแบบไฟล์ CSV หรือ JSON");
    }
    setParsedLogs(logs);
    setBackupMetadata(meta);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  }

  function handleExecuteImport() {
    if (parsedLogs.length === 0) return;
    onImportLogs(parsedLogs, importMode, backupMetadata);
    onClose();
  }

  // Summary statistics for preview
  const uniqueExercises = Array.from(new Set(parsedLogs.map((l) => l.exerciseName)));
  const sortedDates = [...parsedLogs].map((l) => new Date(l.date).getTime()).filter((t) => !isNaN(t)).sort((a, b) => a - b);
  const earliestDate = sortedDates.length > 0 ? new Date(sortedDates[0]).toLocaleDateString("th-TH") : "-";
  const latestDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString("th-TH") : "-";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-yellow-400/10 p-2 text-yellow-400 border border-yellow-500/20">
              <FileUp size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">นำเข้าประวัติการฝึก</h2>
              <p className="text-xs text-zinc-400">Import Workout Logs (CSV / JSON)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Method Tabs: File vs Direct Paste */}
          <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "file" ? "bg-yellow-400 text-black font-black" : "text-zinc-400 hover:text-white"}`}
            >
              เลือกไฟล์ (Upload File)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`flex-1 py-1.5 rounded-lg transition ${activeTab === "paste" ? "bg-yellow-400 text-black font-black" : "text-zinc-400 hover:text-white"}`}
            >
              วางข้อความ (Paste CSV/JSON)
            </button>
          </div>

          {activeTab === "file" ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center transition hover:border-yellow-400/80 hover:bg-zinc-900/70"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="rounded-2xl bg-zinc-800/80 p-3 text-yellow-400">
                <Upload size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-200">
                  {fileName ? `ไฟล์ที่เลือก: ${fileName}` : "แตะเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">รองรับไฟล์ .CSV จาก HA IT หรือ JSON Backup</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">วางเนื้อหา CSV หรือ JSON ที่นี่:</label>
              <textarea
                rows={5}
                value={fileContent}
                onChange={(e) => handleProcessText(e.target.value, "pasted_text")}
                placeholder="Date,Exercise,Machine,Set,Weight,Unit,Normalized_Weight_Lbs,Reps&#10;2026-10-15 10:00:00,Incline Dumbbell Press,-,1,28,kg,61.73,10"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-yellow-400"
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Inspection Card */}
          {parsedLogs.length > 0 && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-yellow-400">
                  <CheckCircle2 size={16} /> ตรวจพบข้อมูลพร้อมนำเข้า
                </span>
                <span className="font-mono text-xs font-bold text-yellow-300 bg-yellow-400/20 px-2 py-0.5 rounded-lg border border-yellow-500/30">
                  {parsedLogs.length} เซต
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-zinc-900/80 p-2.5 border border-zinc-800">
                  <span className="text-zinc-500 text-[11px] block">จำนวนท่าฝึกที่พบ</span>
                  <span className="font-bold text-white text-sm">{uniqueExercises.length} ท่า</span>
                </div>
                <div className="rounded-xl bg-zinc-900/80 p-2.5 border border-zinc-800">
                  <span className="text-zinc-500 text-[11px] block">ช่วงวันที่บันทึก</span>
                  <span className="font-bold text-white text-xs truncate block">{earliestDate} - {latestDate}</span>
                </div>
              </div>

              {/* Detected Backup Metadata Alert */}
              {backupMetadata && (
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-200">
                  <CheckCircle2 size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-300">ตรวจพบข้อมูลสำรองเพิ่มเติมในไฟล์:</p>
                    <ul className="mt-1 list-disc list-inside text-zinc-300 text-[11px] space-y-0.5">
                      {backupMetadata.records && <li>สถิติสูงสุด PR: {Object.keys(backupMetadata.records).length} ท่า</li>}
                      {backupMetadata.machineStartingResistances && <li>แรงต้านเริ่มต้นของเครื่อง: {Object.keys(backupMetadata.machineStartingResistances).length} เครื่อง</li>}
                      {backupMetadata.pulleyRatios && <li>อัตราทดรอกเคเบิล: {Object.keys(backupMetadata.pulleyRatios).length} ท่า</li>}
                      {backupMetadata.userProfile && <li>ข้อมูลโปรไฟล์ผู้ใช้</li>}
                    </ul>
                    <p className="mt-1 text-[10px] text-zinc-400">ระบบจะกู้คืนการตั้งค่าเหล่านี้ให้อัตโนมัติเมื่อกดนำเข้า</p>
                  </div>
                </div>
              )}

              {/* Sample 3 rows preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-zinc-400">ตัวอย่างข้อมูล:</span>
                <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-2 text-[11px] font-mono space-y-1 overflow-x-auto text-zinc-300">
                  {parsedLogs.slice(0, 3).map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-1 last:border-0 last:pb-0">
                      <span className="truncate max-w-[140px] text-white font-bold">{l.exerciseName}</span>
                      <span className="text-zinc-400">Set {l.setNumber}: {l.rawValue ?? (l.unit === "kg" ? Math.round(l.weightLbs * 0.453592) : l.weightLbs)} {l.unit} × {l.reps} reps</span>
                    </div>
                  ))}
                  {parsedLogs.length > 3 && (
                    <p className="text-[10px] text-zinc-500 text-center pt-0.5">...และอีก {parsedLogs.length - 3} เซต</p>
                  )}
                </div>
              </div>

              {/* Import Mode Selector: Merge vs Replace */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
                  โหมดการนำเข้า (Import Mode):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`rounded-xl p-3 text-left border transition ${
                      importMode === "merge"
                        ? "bg-yellow-400 text-black border-yellow-300 font-black shadow-md shadow-yellow-500/20"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <div className="text-xs font-black">ผสานข้อมูลเดิม (Merge)</div>
                    <div className={`text-[10px] mt-0.5 ${importMode === "merge" ? "text-zinc-900" : "text-zinc-500"}`}>
                      เพิ่มต่อจากเดิม ไม่ลบประวัติเก่า ({existingLogsCount} เซต)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={`rounded-xl p-3 text-left border transition ${
                      importMode === "replace"
                        ? "bg-red-500 text-white border-red-400 font-black shadow-md shadow-red-500/25"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <div className="text-xs font-black">แทนที่ทั้งหมด (Replace)</div>
                    <div className={`text-[10px] mt-0.5 ${importMode === "replace" ? "text-red-100" : "text-zinc-500"}`}>
                      ล้างประวัติเดิมทั้งหมด แล้วใส่ชุดใหม่
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={parsedLogs.length === 0}
            onClick={handleExecuteImport}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black px-5 py-2.5 text-xs font-black uppercase tracking-wider transition shadow-lg shadow-yellow-500/25 active:scale-95"
          >
            <span>ยืนยันการนำเข้า ({parsedLogs.length} เซต)</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
