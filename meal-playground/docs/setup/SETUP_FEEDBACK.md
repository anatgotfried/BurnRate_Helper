# 🔧 Quick Setup: Feedback System

Your n8n webhook URL: `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`

---

## ⚡ **Add to Vercel (2 steps):**

### **Option 1: Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard
2. Select project: **burn-rate-helper**
3. **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   ```
   Name:  N8N_FEEDBACK_WEBHOOK
   Value: https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback
   ```
6. Click **Save**
7. Go to **Deployments** tab
8. Click **"Redeploy"** on the latest deployment

---

### **Option 2: Command Line (Faster)**

```bash
cd /Users/anatgotfried/Documents/Projects/BurnRate/BurnRate_Helper

vercel env add N8N_FEEDBACK_WEBHOOK

# When prompted, paste:
https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback

# Select environments: Production, Preview, Development (all)

# Redeploy
vercel --prod
```

---

## ✅ **Test It:**

1. Refresh https://callback.burnrate.fit/meal-playground/
2. Generate a meal plan
3. Click **"📝 Send Feedback"** button
4. Fill out the form
5. Click **"📤 Send Feedback"**
6. Check your Google Sheet for the new row!

---

## 🔍 **Verify It's Working:**

**Check n8n:**
- Go to your n8n workflow
- Click "Executions" tab
- You should see a successful execution

**Check Google Sheets:**
- Open "BurnRate Meal Feedback"
- New row should appear with all the data

---

## 📊 **What You'll See in Google Sheets:**

```
timestamp: 2025-11-04T14:30:00Z
athlete_name: 60kg female fat_loss
model_used: google/gemini-2.5-flash
fast_mode: YES
calories_target: 1720
calories_actual: 0
calories_diff: -1720
has_daily_totals: NO  ← Key metric!
rating: poor
issues: missing_daily_totals, totals_off_target
comments: "Missing daily_totals object..."
```

---

## 🎯 **Analysis Tips:**

### **Find Best Model:**
```
=AVERAGEIF(F:F, "google/gemini-2.5-flash", J:J)
→ Average calorie error for Gemini
```

### **Fast Mode Comparison:**
```
Filter: model_used = "Claude 3.5"
  Fast Mode ON: Avg calories_diff
  Fast Mode OFF: Avg calories_diff
```

### **Count Issues:**
```
=COUNTIF(T:T, "NO")
→ How many submissions missing daily_totals
```

---

**Ready to test! Add the webhook URL to Vercel and redeploy!** 🚀

