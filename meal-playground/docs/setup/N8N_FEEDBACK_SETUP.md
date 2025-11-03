# n8n Feedback Collection Setup Guide

This guide shows how to set up n8n to collect feedback submissions and save them to Google Sheets for analysis.

---

## 📋 Quick Setup (5 minutes)

### **Step 1: Create Google Sheet**

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: **"BurnRate Meal Feedback"**
3. Add these column headers in Row 1:

```
A: timestamp
B: version
C: athlete_name  
D: weight_kg
E: goal
F: training_phase
G: model_used
H: fast_mode
I: calories_target
J: calories_actual
K: calories_diff
L: protein_target
M: protein_actual
N: protein_diff
O: carbs_target
P: carbs_actual
Q: carbs_diff
R: sodium_target
S: sodium_actual
T: sodium_diff
U: has_daily_totals
V: meal_count
W: food_count
X: cost_total
Y: prompt_length
Z: response_length
AA: rating
AB: issues
AC: comments
AD: full_json_url
```

4. **Share** the sheet with your Google service account email (or make it public for editing)

---

### **Step 2: Create n8n Workflow**

1. **Open n8n** → New Workflow → Name: "BurnRate Feedback Collector"

2. **Add Node #1: Webhook Trigger**
   - **Method:** POST
   - **Path:** `burnrate-feedback` (or any unique path you want)
   - **Authentication:** None (or add header auth if you want security)
   - **Response:** 
     ```json
     {
       "success": true,
       "message": "Feedback received"
     }
     ```
   - **Copy the Production Webhook URL** (you'll need this!)

3. **Add Node #2: Set Variables** (optional but recommended)
   - Extract key fields for easier Sheet mapping:
   ```javascript
   // Code node
   return items.map(item => {
     const data = item.json;
     const targets = data.calculated_targets || {};
     const actuals = data.actual_totals || {};
     
     return {
       json: {
         timestamp: data.timestamp,
         athlete_name: `${data.athlete.weight_kg}kg ${data.athlete.gender} ${data.athlete.goal}`,
         weight_kg: data.athlete.weight_kg,
         goal: data.athlete.goal,
         training_phase: data.athlete.training_phase,
         model_used: data.model_used,
         fast_mode: data.fast_mode_enabled,
         
         calories_target: targets.daily_energy_target_kcal,
         calories_actual: actuals.calories || 0,
         calories_diff: (actuals.calories || 0) - (targets.daily_energy_target_kcal || 0),
         
         protein_target: targets.daily_protein_target_g,
         protein_actual: actuals.protein_g || 0,
         protein_diff: (actuals.protein_g || 0) - (targets.daily_protein_target_g || 0),
         
         carbs_target: targets.daily_carb_target_g,
         carbs_actual: actuals.carbs_g || 0,
         carbs_diff: (actuals.carbs_g || 0) - (targets.daily_carb_target_g || 0),
         
         sodium_target: targets.sodium_target_mg,
         sodium_actual: actuals.sodium_mg || 0,
         sodium_diff: (actuals.sodium_mg || 0) - (targets.sodium_target_mg || 0),
         
         has_daily_totals: data.has_daily_totals,
         meal_count: data.meal_count,
         food_count: data.food_count,
         
         cost_total: data.cost_info?.totalCost || 0,
         prompt_length: data.prompt_length_chars,
         response_length: data.response_length_chars,
         
         rating: data.user_feedback.rating,
         issues: data.user_feedback.issues.join(', '),
         comments: data.user_feedback.comments,
         
         full_json: JSON.stringify(data)
       }
     };
   });
   ```

4. **Add Node #3: Google Sheets (Append Row)**
   - **Operation:** Append Row
   - **Spreadsheet:** Select "BurnRate Meal Feedback"
   - **Sheet:** Sheet1
   - **Columns:** Map the variables to column headers (A-AC)

5. **[Optional] Add Node #4: Email/Slack Notification**
   - For high-priority feedback (rating = "poor")
   - Or for all submissions

6. **Activate** the workflow

7. **Test it:** Send a test POST to the webhook URL

---

### **Step 3: Add Webhook URL to Your .env**

```bash
# In meal-playground/.env
N8N_FEEDBACK_WEBHOOK=https://your-n8n-instance.com/webhook/burnrate-feedback
```

---

## 📊 What Gets Saved to Google Sheets:

Each feedback submission creates a new row with:

### **Athlete Info:**
- Weight, gender, goal, training phase
- Workout count and types

### **Model Performance:**
- Model used (e.g., "google/gemini-2.5-flash")
- Fast Mode: ON/OFF
- Cost per generation

### **Accuracy Metrics:**
- Calories: Target vs Actual vs Difference
- Protein: Target vs Actual vs Difference
- Carbs: Target vs Actual vs Difference
- Sodium: Target vs Actual vs Difference

### **Quality Indicators:**
- Has daily_totals? (TRUE/FALSE)
- Meal count (should be 7-9)
- Food count
- Prompt size & response size

### **User Feedback:**
- Rating (Excellent/Good/Neutral/Poor)
- Issues (missing_daily_totals, totals_off_target, etc.)
- Comments (free text)
- Full JSON (for detailed analysis)

---

## 📈 Analysis You Can Do:

Once you have 20-50 submissions:

### **Compare Models:**
```sql
SELECT 
  model_used,
  AVG(ABS(calories_diff)) as avg_calorie_error,
  AVG(ABS(protein_diff)) as avg_protein_error,
  COUNT(CASE WHEN has_daily_totals = FALSE THEN 1 END) as missing_totals_count,
  AVG(cost_total) as avg_cost
FROM feedback
GROUP BY model_used
ORDER BY avg_calorie_error ASC
```

### **Fast Mode Impact:**
```
Gemini + Fast ON: Avg error = ?
Gemini + Fast OFF: Avg error = ?
→ Is Fast Mode hurting accuracy?
```

### **Identify Patterns:**
```
Issue "totals_off_target" → Which models? Which athlete types?
Issue "low_sodium" → Common across all models or specific ones?
```

---

## 🎯 Alternative: Simpler Storage Options

If Google Sheets setup is too complex, n8n can also save to:

### **Option A: Notion Database**
- Node: Notion → Create Page
- Pro: Beautiful UI, easy to browse
- Con: Harder to export for analysis

### **Option B: Airtable**
- Node: Airtable → Append Record
- Pro: Better for analysis than Sheets
- Con: Requires Airtable account

### **Option C: PostgreSQL/MySQL**
- Node: Postgres/MySQL → Insert
- Pro: Best for large-scale analysis
- Con: Need database setup

### **Option D: Simple JSON Files**
- Node: Write Binary File
- Pro: Zero config, just save JSONs
- Con: Manual analysis

---

## 🔧 **Implementation Status:**

✅ Backend ready (`/api/feedback` endpoint created)  
✅ Frontend ready (feedback button + modal)  
✅ Feedback modal HTML added  
⏳ **Waiting for:** Your n8n webhook URL

---

## 🚀 **Next Steps:**

1. **You:** Create the n8n workflow (5 min)
2. **You:** Copy the webhook URL
3. **You:** Add to `.env`:
   ```
   N8N_FEEDBACK_WEBHOOK=https://your-url-here
   ```
4. **You:** Restart Flask (`vercel --prod` or local server)
5. **You:** Test by clicking "Send Feedback" button

**Want me to create a ready-to-import n8n workflow JSON file?** I can give you the complete workflow to just import and connect to your Google Sheets! 🎯
