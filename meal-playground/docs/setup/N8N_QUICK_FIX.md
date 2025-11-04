# 🔧 n8n Workflow Quick Fix

## 🚨 Problem:
Your Google Sheet is getting data only in these columns:
- `headers`, `params`, `query`, `body`, `webhookUrl`, `executionMode`

All your actual data is **nested inside the `body` column** as JSON!

---

## ✅ Solution: Add "Extract Body Fields" Node

### **Step 1: Open Your n8n Workflow**
1. Go to: https://burnrate.app.n8n.cloud
2. Open your "BurnRate Feedback" workflow
3. You should see: `Webhook → Google Sheets → Respond`

---

### **Step 2: Add a "Set" Node Between Webhook and Google Sheets**

1. **Click the "+" between Webhook and Google Sheets**
2. **Search for "Set"** and add it
3. **Rename it to:** "Extract Body Fields"

---

### **Step 3: Configure the Set Node**

Click "Add Value" 42 times and configure each:

| Field Name | Value (Expression) |
|------------|-------------------|
| `timestamp` | `{{ $json.body.timestamp }}` |
| `version` | `{{ $json.body.version }}` |
| `weight_kg` | `{{ $json.body.weight_kg }}` |
| `height_cm` | `{{ $json.body.height_cm }}` |
| `age` | `{{ $json.body.age }}` |
| `gender` | `{{ $json.body.gender }}` |
| `goal` | `{{ $json.body.goal }}` |
| `training_phase` | `{{ $json.body.training_phase }}` |
| `diet_pattern` | `{{ $json.body.diet_pattern }}` |
| `model_used` | `{{ $json.body.model_used }}` |
| `fast_mode` | `{{ $json.body.fast_mode }}` |
| `cal_target` | `{{ $json.body.cal_target }}` |
| `cal_actual` | `{{ $json.body.cal_actual }}` |
| `cal_diff` | `{{ $json.body.cal_diff }}` |
| `cal_pct_diff` | `{{ $json.body.cal_pct_diff }}` |
| `protein_target` | `{{ $json.body.protein_target }}` |
| `protein_actual` | `{{ $json.body.protein_actual }}` |
| `protein_diff` | `{{ $json.body.protein_diff }}` |
| `protein_pct_diff` | `{{ $json.body.protein_pct_diff }}` |
| `carbs_target` | `{{ $json.body.carbs_target }}` |
| `carbs_actual` | `{{ $json.body.carbs_actual }}` |
| `carbs_diff` | `{{ $json.body.carbs_diff }}` |
| `carbs_pct_diff` | `{{ $json.body.carbs_pct_diff }}` |
| `fat_target` | `{{ $json.body.fat_target }}` |
| `fat_actual` | `{{ $json.body.fat_actual }}` |
| `fat_diff` | `{{ $json.body.fat_diff }}` |
| `sodium_target` | `{{ $json.body.sodium_target }}` |
| `sodium_actual` | `{{ $json.body.sodium_actual }}` |
| `sodium_diff` | `{{ $json.body.sodium_diff }}` |
| `has_daily_totals` | `{{ $json.body.has_daily_totals }}` |
| `meal_count` | `{{ $json.body.meal_count }}` |
| `food_count` | `{{ $json.body.food_count }}` |
| `cost_usd` | `{{ $json.body.cost_usd }}` |
| `tokens_in` | `{{ $json.body.tokens_in }}` |
| `tokens_out` | `{{ $json.body.tokens_out }}` |
| `tokens_total` | `{{ $json.body.tokens_total }}` |
| `prompt_chars` | `{{ $json.body.prompt_chars }}` |
| `response_chars` | `{{ $json.body.response_chars }}` |
| `rating` | `{{ $json.body.rating }}` |
| `issues` | `{{ $json.body.issues }}` |
| `comments` | `{{ $json.body.comments }}` |
| `accuracy_score` | `{{ $json.body.accuracy_score }}` |

---

### **Step 4: Update Google Sheets Node**

1. Click on your **Google Sheets** node
2. Make sure **"Auto-map Input Data"** is selected
3. Save the workflow
4. Click **"Save"** in the top right

---

### **Step 5: Test It!**

1. Go back to: https://callback.burnrate.fit/meal-playground/
2. Generate a meal plan
3. Send feedback
4. Check your Google Sheet

**You should now see ALL 42 fields populated!** ✅

---

## 🎯 Alternative: Use Code Node (Faster!)

If you're comfortable with JavaScript, use a **Code** node instead:

```javascript
// Extract all fields from body
const body = $input.item.json.body;

return [{
  json: {
    timestamp: body.timestamp,
    version: body.version,
    weight_kg: body.weight_kg,
    height_cm: body.height_cm,
    age: body.age,
    gender: body.gender,
    goal: body.goal,
    training_phase: body.training_phase,
    diet_pattern: body.diet_pattern,
    model_used: body.model_used,
    fast_mode: body.fast_mode,
    cal_target: body.cal_target,
    cal_actual: body.cal_actual,
    cal_diff: body.cal_diff,
    cal_pct_diff: body.cal_pct_diff,
    protein_target: body.protein_target,
    protein_actual: body.protein_actual,
    protein_diff: body.protein_diff,
    protein_pct_diff: body.protein_pct_diff,
    carbs_target: body.carbs_target,
    carbs_actual: body.carbs_actual,
    carbs_diff: body.carbs_diff,
    carbs_pct_diff: body.carbs_pct_diff,
    fat_target: body.fat_target,
    fat_actual: body.fat_actual,
    fat_diff: body.fat_diff,
    sodium_target: body.sodium_target,
    sodium_actual: body.sodium_actual,
    sodium_diff: body.sodium_diff,
    has_daily_totals: body.has_daily_totals,
    meal_count: body.meal_count,
    food_count: body.food_count,
    cost_usd: body.cost_usd,
    tokens_in: body.tokens_in,
    tokens_out: body.tokens_out,
    tokens_total: body.tokens_total,
    prompt_chars: body.prompt_chars,
    response_chars: body.response_chars,
    rating: body.rating,
    issues: body.issues,
    comments: body.comments,
    accuracy_score: body.accuracy_score
  }
}];
```

This is **much faster** than adding 42 individual fields! 🚀

---

## 📊 Your Google Sheet Headers Should Be:

```
timestamp | version | weight_kg | height_cm | age | gender | goal | training_phase | diet_pattern | model_used | fast_mode | cal_target | cal_actual | cal_diff | cal_pct_diff | protein_target | protein_actual | protein_diff | protein_pct_diff | carbs_target | carbs_actual | carbs_diff | carbs_pct_diff | fat_target | fat_actual | fat_diff | sodium_target | sodium_actual | sodium_diff | has_daily_totals | meal_count | food_count | cost_usd | tokens_in | tokens_out | tokens_total | prompt_chars | response_chars | rating | issues | comments | accuracy_score
```

**Remove these columns from your sheet:**
- `headers`
- `params`
- `query`
- `body`
- `webhookUrl`
- `executionMode`

Those are n8n's internal fields - you don't need them!

---

## ✅ Final Workflow Should Look Like:

```
Webhook → Extract Body Fields (Set or Code) → Google Sheets → Respond to Webhook
```

**Done!** 🎯

