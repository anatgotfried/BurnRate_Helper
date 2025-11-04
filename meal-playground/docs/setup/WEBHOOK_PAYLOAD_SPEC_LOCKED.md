# 🔒 WEBHOOK PAYLOAD SPECIFICATION - LOCKED

## ⚠️ CRITICAL: DO NOT MODIFY WITHOUT USER APPROVAL

This document defines the **LOCKED** webhook payload structure for the BurnRate feedback system.

**Any changes to this structure require:**
1. ✅ Explicit user consent BEFORE implementation
2. ✅ Updates to n8n workflow (Extract Body Fields node)
3. ✅ Updates to Google Sheets column headers
4. ✅ Testing in n8n test environment first
5. ✅ Documentation updates

---

## 📋 LOCKED PAYLOAD STRUCTURE (42 Fields)

### **Version: v1.6.4** (Locked on 2025-11-04)

```json
{
  "timestamp": "2025-11-04T07:12:21.893Z",
  "version": "1.6.5",
  "weight_kg": 60,
  "height_cm": 165,
  "age": 35,
  "gender": "female",
  "goal": "fat_loss",
  "training_phase": "base",
  "diet_pattern": "omnivore",
  "model_used": "google/gemini-2.5-flash",
  "fast_mode": true,
  "cal_target": 1720,
  "cal_actual": 1705,
  "cal_diff": -15,
  "cal_pct_diff": -0.87,
  "protein_target": 138,
  "protein_actual": 135,
  "protein_diff": -3,
  "protein_pct_diff": -2.17,
  "carbs_target": 336,
  "carbs_actual": 340,
  "carbs_diff": 4,
  "carbs_pct_diff": 1.19,
  "fat_target": 54,
  "fat_actual": 52,
  "fat_diff": -2,
  "sodium_target": 3875,
  "sodium_actual": 3900,
  "sodium_diff": 25,
  "has_daily_totals": true,
  "meal_count": 8,
  "food_count": 34,
  "cost_usd": 0.002,
  "tokens_in": 3500,
  "tokens_out": 6200,
  "tokens_total": 9700,
  "prompt_chars": 12500,
  "response_chars": 18700,
  "rating": "good",
  "issues": "too_much_protein, unclear_timing",
  "comments": "Great plan overall!",
  "accuracy_score": 8.99
}
```

---

## 📊 FIELD DEFINITIONS (Alphabetical)

| # | Field Name | Type | Description | Example |
|---|------------|------|-------------|---------|
| 1 | `accuracy_score` | number | AI accuracy score (0-10) | 8.99 |
| 2 | `age` | number/null | Athlete age | 35 |
| 3 | `cal_actual` | number | Actual calories from AI | 1705 |
| 4 | `cal_diff` | number | Difference (actual - target) | -15 |
| 5 | `cal_pct_diff` | number | Percent difference | -0.87 |
| 6 | `cal_target` | number | Target calories | 1720 |
| 7 | `carbs_actual` | number | Actual carbs (g) | 340 |
| 8 | `carbs_diff` | number | Difference (actual - target) | 4 |
| 9 | `carbs_pct_diff` | number | Percent difference | 1.19 |
| 10 | `carbs_target` | number | Target carbs (g) | 336 |
| 11 | `comments` | string | User feedback text | "Great plan overall!" |
| 12 | `cost_usd` | number | Generation cost | 0.002 |
| 13 | `diet_pattern` | string | Diet type | "omnivore" |
| 14 | `fast_mode` | boolean | Fast mode enabled | true |
| 15 | `fat_actual` | number | Actual fat (g) | 52 |
| 16 | `fat_diff` | number | Difference (actual - target) | -2 |
| 17 | `fat_target` | number | Target fat (g) | 54 |
| 18 | `food_count` | number | Total food items | 34 |
| 19 | `gender` | string | Athlete gender | "female" |
| 20 | `goal` | string | Training goal | "fat_loss" |
| 21 | `has_daily_totals` | boolean | JSON includes totals | true |
| 22 | `height_cm` | number | Athlete height | 165 |
| 23 | `issues` | string | Comma-separated issues | "too_much_protein, unclear_timing" |
| 24 | `meal_count` | number | Number of meals | 8 |
| 25 | `model_used` | string | AI model ID | "google/gemini-2.5-flash" |
| 26 | `prompt_chars` | number | Prompt size in chars | 12500 |
| 27 | `protein_actual` | number | Actual protein (g) | 135 |
| 28 | `protein_diff` | number | Difference (actual - target) | -3 |
| 29 | `protein_pct_diff` | number | Percent difference | -2.17 |
| 30 | `protein_target` | number | Target protein (g) | 138 |
| 31 | `rating` | string | User rating | "good" |
| 32 | `response_chars` | number | Response size in chars | 18700 |
| 33 | `sodium_actual` | number | Actual sodium (mg) | 3900 |
| 34 | `sodium_diff` | number | Difference (actual - target) | 25 |
| 35 | `sodium_target` | number | Target sodium (mg) | 3875 |
| 36 | `timestamp` | string (ISO) | Submission time | "2025-11-04T07:12:21.893Z" |
| 37 | `tokens_in` | number | Input tokens | 3500 |
| 38 | `tokens_out` | number | Output tokens | 6200 |
| 39 | `tokens_total` | number | Total tokens | 9700 |
| 40 | `training_phase` | string | Training phase | "base" |
| 41 | `version` | string | App version | "1.6.5" |
| 42 | `weight_kg` | number | Athlete weight | 60 |

---

## 🔧 WHERE THIS STRUCTURE IS USED:

### **1. Frontend (`script.js` - Line ~1280)**
```javascript
const feedbackData = {
    timestamp: new Date().toISOString(),
    version: VERSION,
    weight_kg: context.athlete.weight_kg || null,
    // ... all 42 fields
};
```

### **2. Flask Backend (`app.py`)**
Forwards payload unchanged to n8n webhook

### **3. n8n Workflow (Extract Body Fields Node)**
```javascript
const body = $input.item.json.body;
return [{ json: body }];
```

### **4. Google Sheets**
42 column headers matching field names exactly

---

## ⚠️ CHANGE REQUEST PROCESS

If a change is needed (add field, rename, remove, restructure):

### **Step 1: Get User Approval**
- **DO NOT** make changes without explicit consent
- Document the proposed change
- Explain impact on all systems

### **Step 2: Update Frontend**
- Modify `script.js` → `submitFeedback` function
- Update version number
- Test locally

### **Step 3: Update n8n**
- Test webhook first: `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`
- Update "Extract Body Fields" node
- Test with new payload

### **Step 4: Update Google Sheets**
- Add/rename/remove columns
- Update formulas if needed

### **Step 5: Update Documentation**
- Update this file (`WEBHOOK_PAYLOAD_SPEC_LOCKED.md`)
- Update `PRODUCTION_WEBHOOK.md`
- Update `N8N_QUICK_FIX.md`
- Update `GOOGLE_SHEETS_TEMPLATE.md`

### **Step 6: Deploy**
- Deploy to production
- Switch n8n to production webhook
- Test end-to-end

### **Step 7: Update Lock**
- Update version number in this document
- Update lock date
- Commit all changes

---

## 🚫 FORBIDDEN CHANGES (Without Approval)

- ❌ Adding new fields
- ❌ Removing existing fields
- ❌ Renaming fields
- ❌ Changing data types
- ❌ Nesting fields (flat structure required)
- ❌ Changing calculation logic for computed fields
- ❌ Reordering fields (doesn't break, but creates inconsistency)

---

## ✅ ALLOWED CHANGES (Without Breaking)

- ✅ Changing field VALUES (e.g., version number, actual data)
- ✅ Fixing bugs in calculation logic (as long as field name stays same)
- ✅ Frontend UI changes that don't affect payload
- ✅ Documentation improvements

---

## 📍 CURRENT PRODUCTION STATUS

**Webhook URL:** `https://burnrate.app.n8n.cloud/webhook/burnrate-feedback`  
**Locked Version:** v1.6.4 (payload structure)  
**Current App Version:** v1.6.5  
**Lock Date:** 2025-11-04  
**Last Verified:** 2025-11-04  

---

## 🔐 SIGNATURE

**Locked by:** AI Assistant  
**Approved by:** User (anatgotfried)  
**Date:** 2025-11-04  

**This specification is now FROZEN. Any modifications require explicit user approval.**

---

## 📝 CHANGE LOG

### v1.6.4 (2025-11-04) - INITIAL LOCK
- Established 42-field flat structure
- Locked field names and types
- Documented all systems impacted
- Created change request process

### v1.6.5 (2025-11-04) - Token Capture Fix
- **NO PAYLOAD CHANGES** ✅
- Fixed internal storage of `window.lastCostInfo`
- No impact on webhook structure

