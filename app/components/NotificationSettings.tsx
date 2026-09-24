"use client";
import React, { useState, useEffect } from "react";
import { Bell, BellOff, Clock, Calendar } from "lucide-react";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  type WorkoutReminder,
} from "../lib/notifications";

const DAY_NAMES = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NotificationSettings({ open, onClose }: Props) {
  const [settings, setSettings] = useState<WorkoutReminder>(getNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState<string>("default");

  useEffect(() => {
    if (open && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, [open]);

  if (!open) return null;

  const toggleDay = (day: number) => {
    const next = {
      ...settings,
      days: settings.days.includes(day)
        ? settings.days.filter((d) => d !== day)
        : [...settings.days, day].sort(),
    };
    setSettings(next);
    saveNotificationSettings(next);
  };

  const toggleEnabled = async () => {
    if (!settings.enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert("กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเบราว์เซอร์");
        setPermissionStatus("denied");
        return;
      }
      setPermissionStatus("granted");
    }
    const next = { ...settings, enabled: !settings.enabled };
    setSettings(next);
    saveNotificationSettings(next);
  };

  const updateTime = (time: string) => {
    const next = { ...settings, time };
    setSettings(next);
    saveNotificationSettings(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-emerald-400" />
            <h3 className="text-lg font-black">การแจ้งเตือนวันฝึก</h3>
          </div>
          <button onClick={onClose} className="rounded-xl bg-zinc-900 p-2 text-zinc-400">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Enable toggle */}
          <button
            onClick={toggleEnabled}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
              settings.enabled
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <Bell size={20} className="text-emerald-400" />
              ) : (
                <BellOff size={20} className="text-zinc-500" />
              )}
              <div className="text-left">
                <p className="font-black">{settings.enabled ? "เปิดการแจ้งเตือน" : "ปิดการแจ้งเตือน"}</p>
                <p className="text-xs text-zinc-500">
                  {permissionStatus === "denied"
                    ? "⚠️ เบราว์เซอร์บล็อกการแจ้งเตือน"
                    : "เตือนเมื่อถึงเวลาฝึก"}
                </p>
              </div>
            </div>
            <div
              className={`relative h-6 w-11 rounded-full transition ${
                settings.enabled ? "bg-emerald-400" : "bg-zinc-700"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  settings.enabled ? "left-5" : "left-0.5"
                }`}
              />
            </div>
          </button>

          {settings.enabled && (
            <>
              {/* Time picker */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                  <Clock size={12} /> เวลาแจ้งเตือน
                </label>
                <input
                  type="time"
                  value={settings.time}
                  onChange={(e) => updateTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg font-black outline-none focus:border-emerald-400"
                />
              </div>

              {/* Day picker */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                  <Calendar size={12} /> วันฝึก
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_NAMES.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`rounded-xl py-3 text-sm font-black transition ${
                        settings.days.includes(i)
                          ? "bg-emerald-400 text-zinc-950"
                          : "bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-zinc-500 text-center">
                  เลือก {settings.days.length} วัน/สัปดาห์
                </p>
              </div>

              {/* Test button */}
              <button
                onClick={() => {
                  if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("🔔 ทดสอบการแจ้งเตือน", {
                      body: "ถ้าเห็นข้อความนี้ แสดงว่าใช้งานได้!",
                      icon: "/icon-192.png",
                    });
                  }
                }}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition"
              >
                🧪 ทดสอบการแจ้งเตือน
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
