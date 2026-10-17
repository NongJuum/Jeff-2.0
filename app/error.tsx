"use client";

import React, { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  function handleHardReset() {
    if (typeof window !== "undefined") {
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2">เกิดข้อผิดพลาดในการโหลด</h1>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">
        หน้านี้ไม่สามารถโหลดได้เนื่องจากข้อมูลแคชเวอร์ชันเก่าหรือการเชื่อมต่อขัดข้อง กรุณากดปุ่มด้านล่างเพื่อโหลดใหม่
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-white transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
        <button
          onClick={handleHardReset}
          className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
        >
          ล้างแคชและโหลดใหม่
        </button>
      </div>
    </div>
  );
}
