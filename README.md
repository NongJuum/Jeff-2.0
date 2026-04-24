# Jeff 2.0 Mobile Workout Update v2

## New in this update
- Added temporary History Log for the last 14 days
- History is stored locally only and old logs are filtered out automatically
- Added Clear History button
- Substitutions are now limited to the same muscle group and similar movement pattern
- Added alternate 5 day split with only 1 leg day
- Kept the previous 5 day split with 2 leg days as selectable mode

## Replace files in your repo
Upload/replace these files:
- package.json
- postcss.config.mjs
- tsconfig.json
- app/layout.tsx
- app/globals.css
- app/page.tsx

If you still have postcss.config.js, delete it to avoid duplicate config.

## New in this state persistence update
- Keeps selected 3/4/5 day mode after switching apps
- Keeps selected workout day
- Keeps 5-day split mode
- Keeps History/Library panel state
- Keeps unsaved set inputs temporarily
- Restores scroll position with sessionStorage

## HA IT branding update
- App name changed to HA IT
- Browser favicon uses the provided barbell lifter icon
- Added app icons for mobile/PWA usage
- Added web manifest
