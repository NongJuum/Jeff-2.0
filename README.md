# 🏋️ HA IT — Workout Tracker (v3.0.0)

แอปบันทึกการฝึกเวทเทรนนิ่งแบบ mobile-first อัจฉริยะ ออกแบบตามหลักวิทยาศาสตร์การกีฬา (Jeff Nippard-inspired) พร้อมระบบประเมินชีวกลศาสตร์ (Biomechanical Prescription Engine), สลับหน่วยน้ำหนักแบบลำดับขั้น (Dual-Unit Hierarchy), แผนฝึกสำเร็จรูป และ 3D Human Anatomy Preview

![HA IT](https://ha-it.vercel.app/hait-logo.png)

---

## ✨ Features เด่นในเวอร์ชัน 3.0

### 📐 Biomechanical Prescription Engine
- **ประเมินสรีระและองค์ประกอบร่างกาย**: คำนวณ BMI ตามเกณฑ์ Asia-Pacific พร้อมแยกโหมดประเมินมวลกล้ามเนื้อ (SMM% vs Total Muscle Mass)
- **Normative 1RM Standard Ratios**: ฐานข้อมูลมาตรฐานความแข็งแรง 1RM ครอบคลุม 19 รูปแบบการเคลื่อนไหว แยกเพศชาย/หญิง
- **Mechanical Physics Adjustment**: ปรับค่าน้ำหนักแนะนำตามโปรไฟล์กลไก (Leverage Ratio, Pulley Ratio, Friction, มุมแรง $\theta$, Bilateral Deficit และ Hardware Step Snapping)
- **ระบบคัดกรองอาการบาดเจ็บ (Injury Safety Filter)**: แจ้งเตือนข้อควรระวังและแนะนำท่าฝึกทดแทนอัตโนมัติตามจุดบาดเจ็บที่ผู้ใช้ระบุ

### ⚖️ Hierarchical Dual-Unit System (kg / lbs)
- **3-Tier Override Priority**: `Exercise Override > Machine Mapping > Global Preference`
- **Dynamic Snapping**: ปัดค่าน้ำหนักอัตโนมัติตามสเต็ปของประเภทท่า (Compound 2.5 kg / 5 lbs, Isolation 1.25 kg / 2.5 lbs)
- **Normalized Volume & PR Engine**: บันทึกและคำนวณ PR/Volume ทางคณิตศาสตร์ด้วยฐานมาตรฐาน (lbs) พร้อมแสดงผลหน่วยที่แท้จริงที่ผู้ใช้กรอก

### 🎯 Touch & Muscle Tap Builder v3
- **Anatomically Calibrated Coordinates**: พิกัดจุดสัมผัสกล้ามเนื้อ 18 จุดแม่นยำตามกายวิภาค (Front 8 จุด, Back 10 จุด)
- **Mobile Touch Target 44×44px**: สัมผัสง่าย ไม่พลาดเป้า พร้อมป้ายจำนวนท่าและชิปกล้ามเนื้อด้านล่าง
- **Zero Murky Emoji**: แสดงผลจุดสัมผัสคมชัด ไม่เพี้ยนสี

### 📊 Performance Analytics & Tracking
- **8-Week Trend Chart**: กราฟ SVG แสดงแนวโน้มผลคะแนน Performance ย้อนหลัง 8 สัปดาห์
- **Bodyweight & Relative Strength**: คำนวณอัตราส่วนความแข็งแรงเทียบน้ำหนักตัว (Bench 1.5×, Squat 2.0×, Deadlift 2.5× BW)
- **Progress Photos**: ถ่ายภาพความก้าวหน้าพร้อมบีบอัดรูปภาพด้วย HTML5 Canvas แบบ Offline
- **Client-Side Push Notifications**: แจ้งเตือนวันฝึกตามเวลาที่ตั้งไว้ ทำงานแบบ Offline-First 100%

---

## 🔒 กติกาการจัดเก็บข้อมูล (Storage Rules)
- ข้อมูลทั้งหมดจัดเก็บใน `localStorage` ของเครื่องผู้ใช้เท่านั้น **ไม่มีการเชื่อมต่อ Cloud หรือบริการภายนอกที่มีค่าใช้จ่าย**
- **Storage Keys**:
  - `haitUserProfileV1`: โปรไฟล์ผู้ใช้และการตั้งค่าหน่วย
  - `haitMigrationV1`: ข้อมูลการอัปเกรดเวอร์ชันเดิม
  - `haitMachineUnitsV1`: หน่วยน้ำหนักประจำเครื่องออกกำลังกาย
  - `haitExerciseUnitsV1`: หน่วยน้ำหนักเฉพาะท่าฝึก
  - `haitWeeklyScoresV1`: คะแนนย้อนหลังรายสัปดาห์
  - `haitNotificationSettingsV1` & `haitLastNotifiedAt`: การตั้งค่าการแจ้งเตือน
  - `haitProgressPhotosV1`: ภาพถ่ายติดตามความก้าวหน้า
  - `haitBodyweight`: บันทึกน้ำหนักตัว

---

## 🚀 การติดตั้งและรันโปรเจกต์

```bash
# ติดตั้ง dependencies
bun install   # หรือ npm install

# รัน unit tests
bun test      # หรือ npm run test

# รัน development server
bun dev       # หรือ npm run dev

# ตรวจสอบ TypeScript type correctness
npx tsc --noEmit

# สร้าง production bundle
npm run build
```

---

## 🛠️ Tech Stack

| เครื่องมือ | รายละเอียด |
|---|---|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Runtime** | React 19 / Node.js 24 |
| **Styling** | Vanilla CSS + Tailwind CSS 4 |
| **Language** | TypeScript 5 (Strict Mode) |
| **Testing** | Vitest |
| **Icons** | Lucide React |

---

## 📝 License
Private project — © 2026 NongJuum / HA IT Workout Tracker v3.0.0
