# 🚀 Production Webhook Configuration

## ✅ **Current Setup:**

**Production Webhook URL:**
```
https://burnrate.app.n8n.cloud/webhook/burnrate-feedback
```

**Test Webhook URL (archived):**
```
https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback
```

---

## 📊 **Environment Variable:**

**Vercel Production:**
- Variable: `N8N_FEEDBACK_WEBHOOK`
- Value: `https://burnrate.app.n8n.cloud/webhook/burnrate-feedback`
- Status: ✅ Encrypted and Active
- Last Updated: 2025-11-04

---

## 🔄 **How to Update:**

### **Step 1: Remove Old Variable**
```bash
cd /Users/anatgotfried/Documents/Projects/BurnRate/BurnRate_Helper
echo "y" | vercel env rm N8N_FEEDBACK_WEBHOOK production
```

### **Step 2: Add New Variable**
```bash
printf "https://burnrate.app.n8n.cloud/webhook/NEW-PATH" | vercel env add N8N_FEEDBACK_WEBHOOK production
```

**IMPORTANT:** Use `printf` (not `echo`) to avoid adding newline characters!

### **Step 3: Redeploy**
```bash
vercel --prod
```

---

## ✅ **Verify Deployment:**

1. **Check environment variable:**
   ```bash
   vercel env ls | grep N8N_FEEDBACK_WEBHOOK
   ```

2. **Test the webhook:**
   - Go to: https://callback.burnrate.fit/meal-playground/
   - Generate a meal plan
   - Send feedback
   - Check your Google Sheet for a new row with all 42 fields populated

3. **Check Flask logs:**
   ```bash
   vercel logs --follow
   ```
   You should see:
   ```
   🔗 Sending feedback to webhook: https://burnrate.app.n8n.cloud/webhook/burnrate-feedback
   📦 Payload size: 1048 bytes
   📥 n8n response: 200
   ```

---

## 📋 **Production Checklist:**

- [x] Production webhook URL set in Vercel
- [x] No newline characters in URL
- [x] n8n workflow active and tested
- [x] Google Sheets connected with 42 columns
- [x] "Extract Body Fields" node added to n8n workflow
- [x] Token/cost capture working (v1.6.5)
- [x] Frontend sending flat payload (v1.6.4)

---

## 🐛 **Troubleshooting:**

### **Problem: 404 Error**
```
❌ n8n webhook returned status 404
```

**Solution:**
1. Verify n8n workflow is **active** (toggle in top right)
2. Check webhook URL matches exactly (no extra spaces/newlines)
3. Test webhook directly:
   ```bash
   curl -X POST https://burnrate.app.n8n.cloud/webhook/burnrate-feedback \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### **Problem: Data in `body` Column Only**
```
Google Sheet shows data only in headers/params/query/body columns
```

**Solution:**
1. Add "Code" node to n8n workflow between Webhook and Google Sheets
2. Use this code:
   ```javascript
   const body = $input.item.json.body;
   return [{ json: body }];
   ```
3. See `docs/setup/N8N_QUICK_FIX.md` for full instructions

### **Problem: Missing Token/Cost Data**
```
cost_usd, tokens_in, tokens_out are empty
```

**Solution:**
- Fixed in v1.6.5 ✅
- Redeploy if needed: `vercel --prod`

---

## 📊 **Expected Payload Structure:**

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

**Total: 42 fields** (all flat, no nesting)

---

## 🎯 **Production Status: LIVE** ✅

Last verified: 2025-11-04 at 07:15 UTC

