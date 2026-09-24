# Changelog

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
