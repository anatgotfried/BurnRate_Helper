# Version History - BurnRate AI Meal Planner

## v1.3.8 - 2025-11-03 (Current)
**CRITICAL FIX: Prompt Template Variable Interpolation**

### Fixed
- 🐛 **CRITICAL: Fixed undefined values in prompt** - Property names were wrong
- 🐛 **sodium_mg** → `sodium_target_mg`
- 🐛 **daily_energy_kcal** → `daily_energy_target_kcal`
- 🐛 **protein_g / carbs_g / fat_g** → Added `_target_` prefix
- 🐛 **hydration_l** → `hydration_target_l`
- 🐛 **Removed energy explanation** - Was causing undefined
- ✅ **All template variables now interpolate correctly**
- ✅ **AI receives proper numeric targets instead of undefined**

### Impact
Before: AI saw "sodium target: undefinedmg", "daily_energy: undefined"
After: AI sees "sodium target: 4000mg", "daily_energy: 3248"

---

## v1.3.7 - 2025-11-03
**Comprehensive Model Testing & Optimization**

### Changed
- 🧪 **Ran comprehensive tests** on all 9 models with identical data
- ❌ **Removed Gemini 2.5 Pro** - Truncates responses (tested, confirmed)
- ✅ **Reordered models** by performance: Fastest free first, then by speed/cost
- 📊 **Added timing indicators** - Shows avg response time per model
- 📋 **Created MODEL_TEST_REPORT.md** - Full test results and recommendations
- ⭐ **Kept Gemini 2.5 Flash as default** - Fastest (12.9s), FREE, 6 meals

### Test Results (8/9 successful)
- ✅ Gemini 2.5 Flash: 12.9s, 6 meals, FREE (FASTEST)
- ✅ Gemini 2.0 Flash Exp: 18.7s, 6 meals, FREE
- ✅ Gemini 2.0 Flash: 23.6s, 6 meals, FREE  
- ✅ Mistral Small: 40.1s, 6 meals, $0.001
- ✅ Qwen 2.5: 53.3s, 6 meals, $0.001
- ✅ GPT-4o Mini: 32.5s, 6 meals, $0.001
- ✅ Claude 3.5 Sonnet: 22.7s, 5 meals, $0.001
- ✅ GPT-4o: 19.8s, 4 meals, $0.001
- ❌ Gemini 2.5 Pro: FAILED (truncated)

### Documentation Added
- MODEL_TEST_REPORT.md - Full test results
- test_models.py - Python testing script
- test-all-models.js - Browser testing script
- run-model-tests.html - Test harness UI

---

## v1.3.6 - 2025-01-02
**Fix: NaN in Macro Calculations & Session Cost**

### Fixed
- 🐛 **NaN in macro calculations** - Workout field name mismatch fixed (duration vs duration_min)
- 🐛 **NaN in session cost** - Fixed addToCumulativeCost to handle both object and number
- 🐛 **Missing energy explanation** - Will now populate properly
- ✅ **Workout data normalization** - Converts form data to macro-calculator format
- ✅ **All calculations now work** - No more NaN values!

### Technical Details
- Form uses: `duration`, `temperature`, `humidity`
- Calculator expects: `duration_min`, `temp_c`, `humidity_pct`
- Added normalization layer in buildContext()

---

## v1.3.5 - 2025-01-02
**Fix: Token Limit & Raw Response Display**

### Fixed
- 🐛 **Token truncation detection** - Backend now detects when AI hits token limit
- 🐛 **Increased max_tokens** - From 4000 → 6000 to allow longer meal plans
- ✅ **Better raw response display** - Shows FULL raw_content separately from metadata
- ✅ **Truncation warnings** - Clear error message when response is cut off
- 📊 **Response length tracking** - Shows character count in error responses

### Changed
- AI Response tab now formats large responses for better readability
- Separates metadata from raw AI content
- Shows raw_content length for debugging

---

## v1.3.4 - 2025-01-02
**Critical Fix: Cost Calculator Parameter Order**

### Fixed
- 🐛 **CRITICAL: Fixed calculateCost parameter order** - Was `(usage, model)`, correct is `(model, usage)`
- 🐛 **Fixed property names** - calculateCost returns `promptTokens`/`completionTokens`, not `inputTokens`/`outputTokens`
- 🐛 **Fixed addToCumulativeCost** - Pass full costInfo object, not just totalCost number
- ✅ Cost display now works correctly with proper API integration
- ✅ Added comprehensive try/catch and validation
- ✅ Fixed estimatePromptCost to use calculateCost properly

### Code Review
- Cleaned up parameter passing between functions
- Added debug logging for troubleshooting
- Improved error handling across all cost-related functions

---

## v1.3.3 - 2025-01-02
**Bug Fix: Cost Display**

### Fixed
- 🐛 **displayCost crash** - Added null checks for missing usage data
- 🐛 **toLocaleString error** - Validate usage object before accessing properties
- ✅ Cost display now fails gracefully if data unavailable

---

## v1.3.2 - 2025-01-02
**Versioning Policy Added**

### Added
- 📋 **VERSIONING.md** - Official versioning policy: update version with EVERY change
- Checklist for version bumps (5 files to update)
- Semantic versioning guidelines (MAJOR.MINOR.PATCH)

---

## v1.3.1 - 2025-01-02
**Critical Bug Fixes**

### Fixed
- 🐛 **Form data not being read** - Added `name` attributes to all form fields
- 🐛 **Checkbox IDs incorrect** - Changed `isMasters` → `masters`, `isFemaleSpecific` → `female_specific`, `isYouth` → `youth`
- 🐛 **Event listeners not attaching** - Moved listener attachment before async resource loading
- 🐛 **Null reference errors** - Added safe null checks for missing checkboxes
- 🐛 **Generate button not working** - All above fixes combined to make generation work

### Result
- ✅ Generate Meal Plan button now fully functional
- ✅ All form data properly captured (weight, height, gender, etc.)
- ✅ Calculated targets now have real values instead of NaN
- ✅ Research corpus properly loaded
- ✅ AI receives complete, valid prompt

---

## v1.3.0 - 2025-01-02
**Full Transparency & Debugging**

### Added
- 👁️ **"View Prompt" button** - Preview prompt before generating
- **"Prompt Sent" tab** - See exact prompt sent to AI
- **"AI Response" tab** - Always see raw AI response (success or fail)
- **Version badge** in header with changelog
- Token count display in status messages
- Estimated cost preview

### Changed
- **Two-phase generation disabled** - Now uses only selected model from dropdown
- Restored original workout card styling and options
- Improved error display - shows AI response tab on errors

### Fixed
- Workout card visual regression (restored HIIT, Tempo, Intervals, Long Endurance options)
- Field names consistency (duration, startTime, temperature, humidity)

---

## v1.2.0 - 2025-01-XX
**Smart Two-Phase Generation (Experimental)**

### Added
- Two-phase generation system
  - Phase 1: Daily structure with Mistral Small
  - Phase 2: Parallel meal generation
  - Auto-fallback to Claude per meal
- "Fast Mode" checkbox for corpus filtering
- Cost tracking and cumulative session totals
- Progress indicators during generation

### Improvements
- 70% token reduction with corpus filtering
- ~85% cost savings vs Claude-only
- Better JSON reliability with auto-healing

---

## v1.1.0 - 2025-01-XX
**Enhanced Reliability & Cost Features**

### Added
- **Deterministic macro calculations** - Evidence-based formulas
- **Auto-healing JSON** - Automatic error correction
- **Cost tracking** - Display cost per generation and session totals
- **Detailed error messages** - Actionable fixes for common issues
- Model verification and endpoint checking

### Improvements
- Aggressive JSON cleaning and validation
- Better error handling for OpenRouter API
- Sodium tracking in all meals
- Israel product alternatives

---

## v1.0.0 - 2025-01-XX
**Initial Release**

### Features
- AI-powered meal plan generation
- Multiple AI model support (Claude, GPT-4o, Mistral, Qwen, Cohere)
- Athlete profile customization
- Workout builder with environment factors
- Research corpus-backed recommendations
- Real-time macro calculation
- Export to JSON

---

## Version Numbering

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR** - Breaking changes or major feature overhauls
- **MINOR** - New features, significant improvements
- **PATCH** - Bug fixes, minor tweaks

---

## Upcoming Features (Roadmap)

### v1.4.0 (Planned)
- [ ] Two-phase generation refinement
- [ ] Custom research corpus filtering
- [ ] Meal plan templates
- [ ] Save/load profiles
- [ ] Export to PDF

### v2.0.0 (Future)
- [ ] Multi-day meal planning
- [ ] Shopping list generation
- [ ] Meal prep instructions
- [ ] Integration with nutrition tracking apps
- [ ] Recipe database

---

**Current Version:** v1.3.0
**Last Updated:** 2025-01-XX

