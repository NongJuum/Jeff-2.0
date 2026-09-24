# Changelog

## [3.0.0] - 2026-09-24 - Jeff 2.0 to v3.0 Master Release

### ⚙️ Core Architecture & Storage
- **Offline-First Local Storage**: All application data strictly persists in browser `localStorage`. Zero cloud dependency or third-party paid services.
- **Dedicated Versioned Storage Keys**:
  - `haitUserProfileV1`: Full user profile, anthropometric data, injury history, and global unit preference.
  - `haitMigrationV1`: Automated one-time migration status for legacy users.
  - `haitMachineUnitsV1` & `haitExerciseUnitsV1`: Machine-specific and exercise-level unit override mappings.
  - `haitWeeklyScoresV1`: Past 8-week performance tracking data.
  - `haitNotificationSettingsV1` & `haitLastNotifiedAt`: Client-side Web Notification preferences and anti-spam timestamp.
  - `haitProgressPhotosV1`: Canvas-compressed progress pictures (max 800px width, 70% JPEG quality).
  - `haitBodyweight`: Bodyweight records and historical entries.

### 📐 Biomechanical Model & Prescription Engine (`app/lib/assessment.ts`)
- **Anthropometric & Body Composition Evaluation**:
  - Asia-Pacific BMI classification standards (Cutoffs: 18.5, 23.0, 25.0, 30.0 kg/m²).
  - Dual Skeletal Muscle Mass Evaluator: Skeletal Muscle Mass (SMM) percentage mode vs. Total Muscle Mass mode (gender-tailored norms).
- **Comprehensive 1RM Normative Ratios (Male & Female)**:
  - Validated baseline strength ratios across 19 movement archetypes (Deadlift 1.65/1.10, Squat 1.45/0.95, Leg Press 2.0/1.4, Bench Press 1.00/0.60, Incline 0.82/0.50, Lat Pulldown 0.95/0.65, etc.).
- **Dynamic Experience & Reps Scaling**:
  - Experience Modifiers: `<6m: 0.45`, `6-12m: 0.65`, `1-2y: 0.85`, `>2y: 1.00`.
  - Repetition Modifiers: `3-6: 0.85`, `5-8: 0.80`, `6-10: 0.75`, `8-12: 0.70`, `10-15: 0.65`, `12-20: 0.60`.
- **Advanced Mechanical Profiles**:
  - Integrates physics-based resistance mechanics: leverage ratios, cam profile modifiers, pulley ratios, mechanical friction, load vector angles ($\theta$), bilateral deficits, and minimum hardware step snapping.
- **Trainer Self-Assessment Modal (`TrainerAssessment.tsx`)**:
  - User profile form with anthropometric inputs, injury selection (Lower back, Shoulder, Knee, Elbow, Wrist), and customized target recommendations.

### ⚖️ Hierarchical Dual-Unit System (`app/lib/units.ts`)
- **3-Tier Override Hierarchy**: `Exercise Override > Machine Mapping > Global Unit`.
- **Dynamic Input Snapping**:
  - `kg`: 2.5 kg step (compounds), 1.25 kg step (isolation).
  - `lbs`: 5.0 lbs step (compounds), 2.5 lbs step (isolation).
- **Normalized Volume & PR Engine**:
  - All mathematical PR and volume calculations normalize to standard `lbs` while preserving raw recorded unit and user-facing values (`weightLbs`, `rawValue`, `unit`).
  - History view, records view, and CSV export show dual-unit converted figures.

### 🔄 Legacy Data Migration (`app/lib/migration.ts`)
- **Safe & Idempotent One-time Run**:
  - Big-3 PR sum level assessment ($\ge 1000$ lbs: Advanced, $\ge 500$ lbs: Intermediate, else Beginner).
  - Calculates maximum 52-week weekly streak from previous history logs.
  - Backward-compatible unit inference defaults all un-annotated legacy records to `lbs`.
  - Dismissable 8-second celebration toast notifying users of imported streak.

### 🎯 Touch & Muscle Tap Builder v3 (`MuscleTapBuilder.tsx`)
- **Anatomically Calibrated Coordinates**:
  - **Front**: Front Delts (36/27), Upper Chest (45/30), Mid Chest (56/34), Biceps (33/39), Abs (50/45), Obliques (42/48), Quads (43/65), Tibialis (44/85).
  - **Back**: Traps (50/22), Rear Delts (64/27), Upper Back (50/31), Mid Back (50/37), Lats (60/38), Triceps (67/38), Lower Back (50/46), Glutes (44/55), Hamstrings (43/67), Calves (43/84).
- **Ergonomics & Visual Polish**:
  - Minimum 44×44px hit-targets for mobile touch compliance.
  - Zero emoji overlays inside anatomical body markers to preserve true body map aesthetics.
  - Active exercise badges, clickable chip list below the diagram, and optional `CALIBRATION_MODE` toggle.

### 📱 UI / UX Improvements
- **4-Tab Bottom Navigation**: Consolidated into `Workout`, `Stats`, `Library`, and `Profile`.
- **Header Utility Triggers**: Direct quick access to Assessment (`Activity`), Bodyweight (`Scale`), Notifications (`Bell`), and Settings (`Cog`).
- **Compact Exercise Card**: Streamlined view hiding unnecessary setup tables and details, leaving only exercise name, PR banner, and rest timer.
- **Floating "เริ่มฝึกวันนี้" FAB**: 1-click workout launch when browsing outside the Today tab.
- **Weekly Trend Chart (`WeeklyTrendChart.tsx`)**: SVG line and gradient chart visualizing past 8 weeks performance scores from `haitWeeklyScoresV1`.
- **Relative Strength Ratios**: Bench (1.5× BW), Squat (2.0× BW), and Deadlift (2.5× BW) tracked with real-time target comparison.
- **Service Worker**: Cache updated to `hait-workout-v3`.
