"use client";
import React, { useState, useRef, useEffect } from "react";
import { Camera, Trash2, Calendar } from "lucide-react";

type PhotoEntry = {
  id: string;
  date: string;
  dataUrl: string;
  weightKg?: number;
  notes?: string;
};

const PHOTOS_KEY = "haitProgressPhotosV1";

export function ProgressPhotos() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PHOTOS_KEY);
      if (raw) setPhotos(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: PhotoEntry[]) => {
    setPhotos(next);
    try {
      window.localStorage.setItem(PHOTOS_KEY, JSON.stringify(next));
    } catch {
      alert("พื้นที่จัดเก็บเต็ม — ลองลบรูปเก่า");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // บีบอัดรูปก่อนเก็บ (ลดขนาดเหลือ max 800px)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        const entry: PhotoEntry = {
          id: `photo_${Date.now()}`,
          date: new Date().toISOString(),
          dataUrl,
          weightKg: weight ? Number(weight) : undefined,
          notes: notes || undefined,
        };
        save([entry, ...photos]);
        setWeight("");
        setNotes("");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const remove = (id: string) => {
    if (confirm("ลบรูปนี้?")) save(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-lg font-black text-white">📸 Progress Photos</h3>

      {/* Input */}
      <div className="mb-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="น้ำหนัก (kg)"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-black text-zinc-950 transition active:scale-95"
          >
            <Camera size={16} /> ถ่าย/เลือกรูป
          </button>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="บันทึก (เช่น วันนี้รู้สึกแข็งแรง)"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          ยังไม่มีรูป — ถ่ายรูปแรกเพื่อติดตามความก้าวหน้า!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="relative overflow-hidden rounded-xl border border-zinc-800">
              <img src={p.dataUrl} alt="progress" className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="flex items-center gap-1 text-[10px] text-zinc-300">
                  <Calendar size={10} />
                  {new Date(p.date).toLocaleDateString("th-TH")}
                </p>
                {p.weightKg && (
                  <p className="text-xs font-black text-emerald-300">
                    {p.weightKg} kg
                  </p>
                )}
                {p.notes && (
                  <p className="truncate text-[10px] text-zinc-400">
                    {p.notes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 rounded-lg bg-black/60 p-1 text-red-400 hover:bg-black/90 transition"
                aria-label="Delete photo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
