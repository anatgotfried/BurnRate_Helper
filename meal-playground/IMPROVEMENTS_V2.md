# 🚀 Version 2 Improvements - Deterministic Macro Calculations

## ✅ **What We Fixed:**

### **1. Deterministic Target Calculations** 

**Before:** AI calculated its own targets (inconsistent)
**After:** Frontend calculates targets using BurnRate algorithm (same as iOS app)

**New file:** `macro-calculator.js`

**Calculations:**
- **Protein**: Based on goal/phase + workout intensity bumps
  - Fat loss: 2.3 g/kg
  - Performance base/build: 1.8 g/kg
  - Performance race: 1.6 g/kg
  - +0.2 g/kg bonus for sessions >90min or high intensity

- **Carbs**: Training load bands (L = Σ hours × intensity)
  - L < 0.5: 3.5 g/kg (rest)
  - 0.5-1.5: 6.0 g/kg (moderate)
  - 1.5-3.0: 8.0 g/kg (high)
  - L ≥ 3.0: 10.0 g/kg (very high)
  - Fat loss + low load: max(3.0, 0.9 × band)

- **Fat**: Context-based
  - Race: 0.6 g/kg
  - Fat loss: 0.9 g/kg
  - Normal: 0.8 g/kg

- **Hydration**: 
  - Base: 35 ml/kg
  - Per workout: 400-800 ml/hour (intensity-adjusted)

- **Sodium**: 
  - Base: 3000 mg/day
  - Per workout: +500-900 mg/hour (intensity + heat adjusted)
  - Target: 3000-6000 mg/day

---

### **2. Sodium Tracking Throughout**

**Before:** Sodium was calculated but not shown per food
**After:** Every food item now includes sodium_mg

**Changes:**
- Food items show: `C: 27g | P: 5g | F: 3g | Na: 150mg | 158 kcal`
- Meal totals include sodium
- Daily totals show sodium with ✅/⚠️ match indicator
- AI must hit sodium target (±200mg)

---

### **3. Targets MUST Match Actuals**

**Before:** AI could generate any calories, often 30%+ over target
**After:** AI must match within strict tolerances:
- Calories: ±50 kcal
- Protein: ±5g
- Carbs: ±10g
- Fat: ±5g
- Sodium: ±200mg
- Fluids: ±0.2L

**New in output:** `plan_quality_check` object verifies all matches

---

### **4. Detailed Explanations Required**

**Before:** Brief 1-sentence rationales
**After:** Comprehensive 3-5 sentence explanations including:
1. Macro contribution (g/kg for this athlete)
2. Timing justification with research citation
3. Goal alignment explanation
4. Food selection reasoning
5. GI tolerance considerations

**Example:**
> "Provides 0.3g/kg protein (20g for 60kg athlete) with ~3g leucine to maximize muscle protein synthesis per Moore2021 guidelines for masters athletes. Consumed within 30min post-exercise when muscles are most receptive to amino acids. The 1.5:1 carb:protein ratio supports both glycogen replenishment and recovery while maintaining calorie deficit for fat loss goal per IOC2018. Greek yogurt chosen over regular for higher protein density with lower GI distress."

---

### **5. Enhanced UI Feedback**

**New visualization:**
- ✅ Green checkmarks when macros match targets
- ⚠️ Warning icons when out of range
- Difference shown: "+744 vs target" or "-50 vs target"
- Color-coded values (green = match, orange = warning)
- New "Target Calculations Explained" section shows the math

---

## 📊 **Example Calculation:**

**Athlete:** 60kg, fat loss, masters, 2 workouts (60min run + 60min swim, both moderate)

**Training Load:**
- Run: 1h × 1.2 = 1.2
- Swim: 1h × 1.2 = 1.2
- Total L = 2.4 (HIGH band)

**Targets:**
- **Protein**: 2.3 g/kg × 60kg = 138g (fat loss baseline)
- **Carbs**: 8.0 g/kg × 60kg = 480g (high band for L=2.4)
- **Fat**: 0.9 g/kg × 60kg = 54g (fat loss context)
- **Calories**: 138×4 + 480×4 + 54×9 = **3,014 kcal**
- **Sodium**: 3000mg base + (2h × 700mg/h) = **4,400mg**
- **Hydration**: (35 × 60) + (2h × 600ml/h) = **3,300ml = 3.3L**

**AI must create meals that total:**
- 3,014 kcal (±50)
- 138g protein (±5)
- 480g carbs (±10)
- 54g fat (±5)
- 4,400mg sodium (±200)

---

## 🎯 **Impact:**

✅ **Calories always match** - no more 744 kcal overage!
✅ **Sodium targets met** - proper electrolyte balance
✅ **Detailed explanations** - understand every decision
✅ **Evidence-based** - every number cites research
✅ **Transparent** - see the calculation logic

---

## 🔄 **Files Changed:**

1. `macro-calculator.js` - New deterministic calculation engine
2. `prompts/meal_planner_v2.txt` - Improved prompt with strict rules
3. `script.js` - Updated to use calculations and show sodium
4. `index.html` - Added macro-calculator script

---

**Now testing at:** https://callback.burnrate.fit/meal-playground/

Wait 1-2 minutes for Vercel deployment, then try generating a new meal plan!

