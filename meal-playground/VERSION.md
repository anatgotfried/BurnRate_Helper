# Version History - BurnRate AI Meal Planner

## v1.3.1 - 2025-01-02 (Current)
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

