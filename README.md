# 🏋️ HA IT — Workout Tracker

แอปบันทึกการฝึกเวทเทรนนิ่งแบบ mobile-first พร้อมระบบคะแนนอัจฉริยะ 
แผนฝึกสำเร็จรูป และ 3D anatomy preview

![HA IT](https://ha-it.vercel.app/hait-logo.png)

## ✨ Features

- 📋 **แผนฝึกสำเร็จรูป** — 3/4/5 วัน (Jeff Nippard-inspired)
- 🛠️ **Custom Plan Builder** — สร้างตารางเองแบบ drag & drop
- 🏆 **ระบบคะแนน Weekly Performance** — Progress, Volume, Consistency, Recovery, Streak
- 🎉 **PR Celebration** — ฉลองเมื่อทำลายสถิติ พร้อม confetti
- 🦴 **3D Anatomy Preview** — ดูกล้ามเนื้อที่ใช้แต่ละท่า
- ⏱️ **Rest Timer** — จับเวลาพักอัตโนมัติ
- 📸 **Progress Photos** — ติดตามความก้าวหน้าพร้อม client-side image compression
- ⚖️ **Bodyweight Tracking** — คำนวณ relative strength
- 📊 **History & Trends** — กราฟความก้าวหน้าย้อนหลัง
- 🧭 **Onboarding Wizard** — ตั้งค่าเริ่มต้น 3 ขั้นตอน (ระดับ, เป้าหมาย, วันฝึก)
- ⚡ **FAB Start Today** — เข้าโหมดฝึกของวันนี้ได้ทันทีจากทุกหน้า
- 👆 **Tap Muscle to Add Exercise** — แตะกล้ามเนื้อบน Anatomy เพื่อเลือกท่าเข้าตารางทันที

## 🚀 Quick Start

```bash
# ติดตั้ง dependencies
bun install

# รัน development server
bun dev

# Build production
bun run build

# รัน tests
bun test
```

เปิด [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| เครื่องมือ | เวอร์ชัน |
|-----|---------|
| Next.js | 15 (App Router) |
| React | 18 / 19 |
| Tailwind CSS | 4 |
| TypeScript | 5 |
| Lucide React | Icons |
| Vitest | Unit Tests |

## 📁 โครงสร้างโปรเจกต์

```
Jeff-2.0/
├── app/
│   ├── components/
│   │   ├── OnboardingWizard.tsx
│   │   ├── PlanBuilder.tsx
│   │   └── ProgressPhotos.tsx
│   ├── __tests__/
│   │   └── scoring.test.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   ├── anatomy/
│   ├── manifest.webmanifest
│   └── sw.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚢 Deploy

Push ขึ้น GitHub → Vercel จะ auto-deploy ที่ [ha-it.vercel.app](https://ha-it.vercel.app)

## 📝 License

Private project — © 2026 NongJuum
