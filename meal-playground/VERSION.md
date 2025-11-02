# Version History - BurnRate AI Meal Planner

## v1.3.5 - 2025-01-02 (Current)
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

