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
