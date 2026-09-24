// app/lib/notifications.ts
"use client";

export type WorkoutReminder = {
  enabled: boolean;
  time: string; // "HH:MM" format เช่น "07:00"
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
};

const NOTIFICATION_KEY = "haitNotificationSettingsV1";
const LAST_NOTIFIED_KEY = "haitLastNotifiedAt";

export function getNotificationSettings(): WorkoutReminder {
  if (typeof window === "undefined") {
    return { enabled: false, time: "07:00", days: [1, 3, 5] };
  }
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_KEY);
    if (raw) return JSON.parse(raw) as WorkoutReminder;
  } catch {}
  return { enabled: false, time: "07:00", days: [1, 3, 5] };
}

export function saveNotificationSettings(settings: WorkoutReminder): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(settings));
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function sendWorkoutNotification(title: string, body: string): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "hait-workout-reminder",
      requireInteraction: false,
    });
  } catch {
    // Notification blocked
  }
}

/**
 * ตรวจสอบว่าควรแจ้งเตือนวันนี้หรือไม่
 * เรียกจาก useEffect ใน page.tsx ทุกนาที
 */
export function checkAndNotify(plannedTrainingDays: number): void {
  if (typeof window === "undefined") return;
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const currentDay = now.getDay();

  // ตรวจสอบว่าวันนี้เป็นวันฝึกไหม
  if (!settings.days.includes(currentDay)) return;

  // ตรวจสอบว่าถึงเวลาแจ้งเตือนหรือยัง (ภายใน 5 นาทีของเวลาที่กำหนด)
  const [targetHour, targetMin] = settings.time.split(":").map(Number);
  const diffMin = (now.getHours() - targetHour) * 60 + (now.getMinutes() - targetMin);
  if (diffMin < 0 || diffMin > 5) return;

  // ป้องกันการแจ้งซ้ำในวันเดียวกัน
  const todayKey = now.toISOString().slice(0, 10);
  try {
    const lastNotified = window.localStorage.getItem(LAST_NOTIFIED_KEY);
    if (lastNotified === todayKey) return;
    window.localStorage.setItem(LAST_NOTIFIED_KEY, todayKey);
  } catch {}

  sendWorkoutNotification(
    "💪 ได้เวลาฝึกแล้ว!",
    `วันนี้ออกกำลังกายตามแผน ${plannedTrainingDays} วัน/สัปดาห์ นะครับ ลุย!`
  );
}

export function startNotificationScheduler(plannedTrainingDays: number): () => void {
  // ตรวจสอบทุก 60 วินาที
  const intervalId = window.setInterval(() => {
    checkAndNotify(plannedTrainingDays);
  }, 60_000);

  // ตรวจสอบครั้งแรกทันที
  checkAndNotify(plannedTrainingDays);

  return () => window.clearInterval(intervalId);
}
