# Changelog

## [3.1.0] - 2026-09-24 - Jeff 2.0 Pro UX Redesign

### 🎨 UX & UI Improvements (U1-U5)
- **U1 (Clean 4-Tab Navigation):** รวมแท็บ Today, Preset, Custom ให้อยู่ใต้แท็บ `Workout` หลัก พร้อม Sub-tab Pill Switcher ด้านบน เหลือ Navigation ด้านล่างเพียง 4 ปุ่ม (`Workout`, `Stats`, `Library`, `Profile`) ประหยัดพื้นที่หน้าจอและลดความสับสน
- **U2 (Utility Header):** เพิ่ม Header Utility Bar ด้านบนสุด พร้อมปุ่มลัดดูน้ำหนักตัว (`⚖️`), จัดการแจ้งเตือน (`🔔`), และเปิดโปรไฟล์ & การตั้งค่า (`⚙️`)
- **U3 (MuscleTapBuilder Component):** สร้างคอมโพเนนต์เลือกท่าฝึกแบบอินเทอร์แอคทีฟ แตะจุดกล้ามเนื้อ (Front/Back) พร้อมแสดง Emoji ประจำมัดกล้ามเนื้อ, Badge จำนวนท่าที่ฝึกได้ และ Exercise Picker Modal เรียงลำดับ Tier S+ และ A ขึ้นก่อน
- **U4 (Custom Mode Integration):** เชื่อมต่อ `MuscleTapBuilder` ในหน้า Custom Workout Builder โดยตรง พร้อมเก็บระบบค้นหาท่าฝึกเดิมไว้ในเมนูแบบพับเก็บได้
- **U5 (Compact Exercise Cards):** เพิ่มโหมด Compact Card ใน `app/globals.css` ซ่อนเมนูแก้ไขเซตเป้าหมายและตารางสถิติที่ไม่จำเป็นขณะฝึกจริง (`.hide-when-compact`) พร้อมแสดง Badge PR และเวลาพัก (`.compact-only`) เพื่อให้ Scroll น้อยลงขณะฝึกซ้อม
- **Profile Modal (`ProfileModal.tsx`):** หน้าต่างโปรไฟล์สรุปสถิติผู้ใช้ (Level, Goal, Streak, Total Sets, PRs, น้ำหนักตัว) และฟังก์ชันส่งออกข้อมูลการฝึก (CSV Export) ในที่เดียว

## [3.0.0] - 2026-09-24

### 🎁 Added
- **Migration System (M1-M2):** ระบบ migration ข้อมูลสำหรับผู้ใช้เก่า ประเมิน Level (Beginner/Intermediate/Advanced) จาก Big 3 PRs, คำนวณ Week Streak ย้อนหลัง 52 สัปดาห์ และประมาณค่าน้ำหนักตัวเริ่มต้นพร้อม Migration Toast
- **Weekly Trend Chart (T1-T3):** กราฟ SVG แสดงแนวโน้ม Performance Score 4 สัปดาห์ย้อนหลัง พร้อมตัวบ่งชี้ Trend (ขึ้น/ลง/คงที่) และระบบบันทึกคะแนนรายสัปดาห์
- **Bodyweight & Relative Strength (R1-R3):** หน้าต่าง Bodyweight Manager คำนวณอัตราส่วนความแข็งแรงต่อน้ำหนักตัว (x BW) สำหรับ Bench Press, Squat, Deadlift พร้อมแสดงแถบ Relative Strength ใน Records card
- **Push Notifications (N1-N3):** ระบบแจ้งเตือนวันและเวลาฝึกแบบ Client-side 100% (Notification API + localStorage scheduler) ไม่ต้องพึ่งพาเซิร์ฟเวอร์หรือบริการภายนอก พร้อมหน้าต่างตั้งค่าเวลาและวันฝึก
- **Tap Muscle to Add Exercise:** ระบบเลือกท่าฝึกจากการแตะที่กล้ามเนื้อบน 3D Human Anatomy (Front/Back) เพิ่มท่าเข้าตาราง Custom ได้ทันทีใน 3 วินาที

## [2.1.0] - 2026-09-24

### 🎁 Added
- Onboarding Wizard 3 ขั้นตอนสำหรับผู้ใช้ใหม่ (ระดับการฝึก, เป้าหมายหลัก, วันที่ฝึกต่อสัปดาห์)
- FAB "เริ่มฝึกวันนี้" สำหรับเข้าโหมด Today ได้ทันทีจากหน้า Preset/Custom
- Custom Plan Builder แบบ drag & drop จัดลำดับท่า พร้อมระบบแจ้งเตือน volume overload (> 20 sets/week)
- Progress Photos พร้อมระบบบีบอัดรูปภาพ (client-side canvas compression) ป้องกันพื้นที่จัดเก็บเต็ม
- Unit Tests (Vitest) สำหรับฟังก์ชันคำนวณคะแนน scoring, 1RM (Epley), และ Warmup sets
- PR Celebration Modal พร้อม confetti celebration เมื่อทำลายสถิติใหม่
- Weekly Trend Chart (SVG) แสดงแนวโน้มผลการฝึกย้อนหลัง
- Fatigue Warning & Deload Suggestion เมื่อร่างกายล้าสะสม
- Bodyweight Tracking & Relative Strength คำนวณความแข็งแรงเทียบน้ำหนักตัว

### 🔧 Fixed
- **Critical:** ลบ trailing spaces ใน string literals ทั้งหมดใน `app/page.tsx` (exercise names, muscle groups, tiers, loads, alias maps)
- แก้ syntax errors: `& &` → `&&`, `= >` → `=>`, `Record <string` → `Record<string`
- ใช้ `exerciseByNameMap` (Map) ระดับโมดูลแทน `.find()` / `.reduce()` ใน `computeWeeklyPerformance` และ `findExercise` เพื่อให้ได้ O(1) lookup
- ปรับสูตรคำนวณคะแนน Weekly Performance: เพิ่มเกณฑ์ Recovery และ Streak, ไม่หักคะแนน volume ที่เหมาะสม

### 🗑️ Removed
- Dead code: `getMuscleRegionFill`, `MusclePreviewFigure`
- ตัวแปร `lib` ซ้ำซ้อนใน `computeWeeklyPerformance`
- Ambient `declare module "lucide-react"` ซ้ำซ้อน เพื่อให้ TypeScript ใช้งาน icon exports จากแพ็กเกจหลักได้ 100%

## [2.0.0] - 2026-09-01
- Initial refactor to Next.js 15 App Router
- 3D Anatomy preview
- Rest timer with notifications

## [1.0.0] - 2026-08-01
- Initial release
