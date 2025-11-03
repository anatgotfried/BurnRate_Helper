# Version History - BurnRate AI Meal Planner

## v1.5.0 - 2025-11-04 (Current) 🏥
**MAJOR: Research-Based Calorie Calculations**

### Critical Fixes
- 🔬 **Proper BMR calculation** - Now uses Harris-Benedict equation (gender/age/height-specific)
- 📊 **TDEE methodology** - Calculates Total Daily Energy Expenditure using activity factors
- ⚖️ **Correct deficit application** - Applies 20% deficit to TDEE (not BMR!)
- 🚨 **Safety minimums enforced** - 1,200 kcal for women, 1,500 kcal for men (ADA/AND guidelines)
- ❌ **Removed misleading "workout calories"** - Activity is built into TDEE calculation

### What Changed
**Before (WRONG):**
```
60kg woman, fat loss, 2×60min workouts:
❌ BMR × 0.8 = 1,152 kcal (below minimum!)
❌ "Add back workout calories" = misleading concept
❌ No consideration of activity level
```

**Now (CORRECT):**
```
60kg woman, fat loss, 2×60min workouts:
✅ BMR: 1,380 kcal (Harris-Benedict)
✅ Activity factor: 1.55 (Moderately Active)
✅ TDEE: 2,139 kcal
✅ 20% deficit: 1,711 kcal
✅ Above minimum: Safe!
✅ Adequate carbs: ~336g (fuels training)
```

### Research Citations
- Harris-Benedict equation for BMR (revised)
- Standard activity multipliers (1.2-1.9)
- ADA/AND minimum calorie guidelines
- ACSM 2016 energy balance recommendations

### UI Improvements
- Info modal now shows proper TDEE breakdown
- Displays activity level (Sedentary → Extremely Active)
- Shows deficit applied to TDEE (not BMR)
- Removed confusing "workout calories" display

### Fat Loss Carb Reduction
- Now properly reduces carbs by 30-40% from performance baseline
- Training load 2.4 (high): 8 g/kg → 5.6 g/kg for fat loss
- Maintains adequate workout fuel while creating deficit

---

## v1.4.3 - 2025-11-04
**Fix undefined values in info modal**
- Fixed calorie breakdown not passing through to modal
- Added debug logging for info button clicks

---

## v1.4.2 - 2025-11-04
**Fat Loss Calculation Fix + Info Buttons**
- Fixed fat loss carb calculations (was giving performance-level carbs)
- Added info buttons (ℹ️) to all Daily Summary metrics
- Created beautiful modal with detailed explanations
- New styles-info-modal.css for modal styling

---

## v1.4.1 - 2025-11-04 🔬
**FAST MODE VALIDATION**

### Added
- 🧪 **Test 3: Fast Mode comparison** - Tested 4 models with corpus filtering ON vs OFF
- 📊 **GPT-4o quality evaluation** - Compared filtered vs full corpus outputs
- 📝 **FAST_MODE_COMPARISON.md** - Comprehensive test results and recommendations

### Key Findings
- ✅ Fast Mode works great for Gemini, Mistral, GPT-4o Mini (2x speed, minimal quality loss)
- ⚠️ Claude 3.5 Sonnet needs full corpus (only generated 2/6 meals with Fast Mode)
- 💰 Fast Mode saves ~70% on token costs
- ⚡ Mistral and Claude are 2x faster with Fast Mode

### UI Improvements
- Updated Fast Mode description with test findings
- Added model-specific guidance for Fast Mode
- Removed defunct two-phase generation checkbox

### Documentation
- Created detailed Fast Mode comparison report
- Updated with Claude-specific warnings

---

## v1.4.0 - 2025-11-03 🎉
**MAJOR: Comprehensive Testing & GPT-4o Evaluation**

### Added
- 🧪 **Test 1: Structure generation** - All 8 models tested on lightweight prompt
- 🧪 **Test 2: Full meal generation** - All 8 models tested on complete prompt
- 🤖 **GPT-4o scoring** - Professional evaluation of all Test 2 results (7 criteria each)
- 📊 **Comprehensive comparison report** - Detailed analysis with recommendations
- 📁 **Organized folder structure** - docs/, testing/, testing/scores/ directories
- 📝 **Three new reports** - MODEL_TEST_REPORT.md, TEST_RESULTS_TABLE.md, COMPARISON_REPORT.md

### Key Findings from Testing
- **Top performers:** Gemini 2.5 Flash (13s, FREE), Claude 3.5 Sonnet (23s, $0.03)
- **Removed:** GPT-4o (too expensive, similar quality to Gemini Flash)
- **Updated model list:** Reordered by speed/cost/reliability based on test data

### Documentation
- Created START_HERE.md user guide
- Added FOLDER_STRUCTURE.md explaining organization
- Comprehensive VERSION.md tracking all changes
- VERSIONING.md policy document

---

## v1.3.8 - 2025-11-03
**Prompt Template Bug Fixes**
- 🐛 Fixed undefined values in prompt (sodium_target_mg, etc.)
- ✅ Corrected all property names to match calculated_targets structure
- 🔧 AI now receives proper numeric targets in prompt

---

## v1.3.7 - 2025-11-03
**Model Testing & Optimization**
- Added comprehensive model testing script
- Updated model list with verified IDs
- Improved error handling for model availability

---

## v1.3.6 - 2025-11-03
**Fix NaN Values in Display**
- Fixed cumulative cost tracking
- Normalized workout data for macro calculator
- Corrected property name mismatches

---

## v1.3.5 - 2025-11-03
**Token Limits & Response Display**
- Increased max_tokens to 6000
- Added token limit detection
- Improved raw response formatting

---

## v1.3.4 - 2025-11-03
**Cost Calculator Parameter Fix**
- Corrected calculateCost parameter order
- Fixed property name mismatches in cost display

---

## v1.3.3 - 2025-11-03
**Cost Display Robustness**
- Added null checks for usage data
- Graceful degradation for missing cost info

---

## v1.3.2 - 2025-11-03
**Versioning Policy**
- Implemented version badge
- Created VERSION.md and VERSIONING.md
- Set up changelog system

---

## v1.3.1 - 2025-11-03
**Critical Bug Fixes**
- Fixed form data reading (added name attributes)
- Corrected checkbox IDs
- Fixed event listener timing

---

## v1.3.0 - 2025-11-03
**Transparency Features**
- Added "View Prompt" button
- New tabs for "Prompt Sent" and "AI Response"
- Display raw AI responses for debugging

---

## v1.2.0 - 2025-11-02
**Two-Phase Generation (Experimental)**
- Structure generation phase
- Individual meal generation
- Auto-fallback to Claude (currently disabled)

---

## v1.1.0 - 2025-11-02
**Cost Tracking & JSON Healing**
- Cost calculator with per-model pricing
- Cumulative cost tracking
- Automatic JSON self-healing
- 3-layer JSON fixing mechanism

---

## v1.0.0 - 2025-11-02
**Initial Release**
- Profile inputs (weight, height, gender, etc.)
- Workout builder (type, duration, intensity, environment)
- Model selection (OpenRouter API)
- Meal plan generation
- Macro calculator with deterministic targets
- Research corpus integration
- Card view & JSON output
- Export functionality
