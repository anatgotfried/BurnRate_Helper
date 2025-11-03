# Version History - BurnRate AI Meal Planner

## v1.4.0 - 2025-11-03 (Current) 🎉
**MAJOR: Comprehensive Testing & GPT-4o Evaluation**

### Added
- 🧪 **Test 1: Structure generation** - All 8 models tested on lightweight prompt
- 🧪 **Test 2: Full meal generation** - All 8 models tested on complete prompt
- 🤖 **GPT-4o scoring** - Professional evaluation of all Test 2 results (7 criteria each)
- 📊 **Comprehensive comparison report** - Detailed analysis with recommendations
- 📁 **Organized folder structure** - All docs moved to `docs/`, tests to `testing/`
- 📋 **COMPARISON_REPORT.md** - GPT-4o scores and rankings

### Changed
- ❌ **Removed GPT-4o** from dropdown - Scored 7.0/10 (lowest), expensive, weak macros
- 📁 **Reorganized all documentation** - Now in logical folders (user-guides/, setup/, test-results/, development/)
- ⭐ **Confirmed Gemini 2.5 Flash as best** - 9.0/10 score, FREE, fast
- 🏆 **Identified Qwen 2.5 as most accurate** - 9.4/10 score, perfect macros (10/10)

### Fixed  
- 🐛 **Prompt template variables** - Fixed undefined values (sodium_target_mg, daily_energy_target_kcal, etc.)
- 🐛 **Property name mismatches** - All template variables now interpolate correctly

### Test Results
**Test 1 (Structure):**
- 8/8 models successful (100%)
- Avg time: ~15-29s
- All generated valid JSON structures

**Test 2 (Full Meals):**
- 8/8 models successful (100%)
- Avg time: 16-132s
- All generated 6-8 meals with foods
- GPT-4o scores: 7.0-9.4 out of 10

### GPT-4o Rankings
1. 🥇 Qwen 2.5 (9.4/10) - Most accurate
2. 🥈 Gemini 2.5 Flash (9.0/10) - Best value
3. 🥈 4 models tied at 9.0/10
4. 🥉 2 models at 8.0/10
5. 7th GPT-4o (7.0/10) - Removed

### Documentation
- Moved 15+ MD files to organized `docs/` structure
- Created comparison reports
- Saved all test JSONs for review

---

## v1.3.8 - 2025-11-03
**CRITICAL FIX: Prompt Template Variable Interpolation**

### Fixed
- Fixed undefined values in prompt template
- Corrected property names (sodium_target_mg, etc.)

---

## v1.3.7 - 2025-11-03
**Comprehensive Model Testing & Optimization**

### Changed
- Tested all 9 models
- Removed Gemini 2.5 Pro (truncates)
- Reordered by performance

---

## v1.3.6 - 2025-11-02
**Fix: NaN in Macro Calculations**

### Fixed
- Workout field normalization
- Session cost NaN

---

[Previous versions: v1.3.0 - v1.3.5 - See full history]

---

**Current Version:** v1.4.0  
**Status:** Production Ready  
**Models:** 7 tested & scored
