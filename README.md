# HA IT AI Coach Update

## New
- Full project files
- Preset mode
- Custom builder
- Coach mode with local rule-based AI chat
- Users can chat to generate a workout plan
- Generated chat plan can be saved directly into Custom
- No API key needed
- PR tracking
- Warmup calculator
- 14-day history
- Weekly hard set checker
- HA IT branding and favicon

## Important
This is a local rule-based coach, not a real OpenAI API integration. It works on Vercel without server keys.

## Upload
Replace your repo with everything in this ZIP.
Delete old postcss.config.js if it exists.
Keep postcss.config.mjs.

## Substitution and volume fix
- Fixed substitution select in Preset mode
- Substitutions now persist in session state
- Alternatives now fall back to related movement and same muscle group so the list no longer disappears
- Increased sparse 4-exercise days to more complete 5-7 exercise days
- Preset and coach plans now have more realistic hypertrophy day density

## Jeff-principled correction
- Rebuilt preset day structures around public Jeff-style hypertrophy principles:
  - Most muscles land near the 10-20 hard sets/week range
  - Avoids excessive per-session junk volume
  - Compounds mostly 3 sets
  - Isolation mostly 2-3 sets
  - Direct arms 3 sets per isolation, with indirect arm volume from pressing/pulling
  - Very fatiguing hinge/deadlift patterns stay at 2 sets
- 3 day, 4 day, and 5 day presets now use balanced movement order:
  - Heavy compound first
  - Secondary compound next
  - Isolation/accessory later
  - Arms/abs/calves toward the end
- Substitutions remain same-muscle/similar-pattern and work in both Preset and Custom.

## Individual set and substitution fix
- Fixed preset substitution so selecting an option immediately changes the displayed exercise.
- Added individual per-exercise set prescriptions instead of one generic rule per movement pattern.
- Pec Deck and Seated Cable Pec Flye are now 4 hard sets, not 2.
- Face Away Bayesian Curl and Overhead Cable Extension are 4 sets; most other direct arms are 3 sets.
- Cable lateral raise and major lateral raise variations are 4 sets.
- Heavy hinges/deadlifts stay lower due to fatigue.

## Mobile UX cleanup
- History and Library are now real bottom tabs, not dropdown panels.
- Added Today tab for a cleaner workout view.
- Added exercise navigation carousel so users can jump to a movement without scrolling through the whole day.
- Default workout view shows one exercise at a time with Previous/Next controls.
- Weekly volume checker is collapsed by default to reduce vertical clutter.
- Bottom navigation is now the main mobile navigation.

## Custom responsive cleanup
- Custom plan settings are collapsed by default.
- Day targets/recommendation are collapsed into a small panel.
- Add Exercise is collapsed by default.
- Exercise set/reps editing is collapsed.
- Substitution selector is collapsed.
- Exercise card text and spacing are tightened for mobile.

## All pages mobile cleanup
- Every main page now has a compact page header instead of a large repeated hero block.
- Today/Preset/Custom controls are contextual, not duplicated everywhere.
- Library is now accordion grouped by muscle and opens groups only when searching.
- History is standalone and cleaner for mobile.
- Coach chat is more compact.
- Day carousel and exercise carousel are smaller and more responsive.
