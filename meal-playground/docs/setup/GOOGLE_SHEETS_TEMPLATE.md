# 📊 Google Sheets Template for BurnRate Feedback

## Quick Setup:

1. **Create new Google Sheet:** "BurnRate Meal Feedback"
2. **Copy/paste these headers** into Row 1 (A1 to AO1):

```
timestamp	version	athlete_name	weight_kg	height_cm	age	gender	goal	training_phase	diet_pattern	model_used	fast_mode	cal_target	cal_actual	cal_diff	cal_pct_diff	protein_target	protein_actual	protein_diff	protein_pct_diff	carbs_target	carbs_actual	carbs_diff	carbs_pct_diff	fat_target	fat_actual	fat_diff	sodium_target	sodium_actual	sodium_diff	has_daily_totals	meal_count	food_count	cost_usd	tokens_in	tokens_out	tokens_total	prompt_chars	response_chars	rating	issues	comments	accuracy_score
```

---

## 📋 Column Reference:

| Column | Field Name | Description | Example |
|--------|------------|-------------|---------|
| **A** | timestamp | When feedback sent | 2025-11-04T15:30:00Z |
| **B** | version | App version | v1.6.1 |
| **C** | athlete_name | Quick summary | 60kg female fat_loss |
| **D** | weight_kg | Weight | 60 |
| **E** | height_cm | Height | 165 |
| **F** | age | Age | 35 |
| **G** | gender | male/female | female |
| **H** | goal | performance/fat_loss | fat_loss |
| **I** | training_phase | base/build/race | base |
| **J** | diet_pattern | omnivore/vegan/etc | omnivore |
| **K** | model_used | AI model | google/gemini-2.5-flash |
| **L** | fast_mode | YES/NO | YES |
| **M** | cal_target | Target calories | 1720 |
| **N** | cal_actual | Actual calories | 1685 |
| **O** | cal_diff | Difference | -35 |
| **P** | cal_pct_diff | % difference | -2% |
| **Q** | protein_target | Target protein (g) | 138 |
| **R** | protein_actual | Actual protein (g) | 142 |
| **S** | protein_diff | Difference | +4 |
| **T** | protein_pct_diff | % difference | +3% |
| **U** | carbs_target | Target carbs (g) | 336 |
| **V** | carbs_actual | Actual carbs (g) | 330 |
| **W** | carbs_diff | Difference | -6 |
| **X** | carbs_pct_diff | % difference | -2% |
| **Y** | fat_target | Target fat (g) | 54 |
| **Z** | fat_actual | Actual fat (g) | 56 |
| **AA** | fat_diff | Difference | +2 |
| **AB** | sodium_target | Target sodium (mg) | 4000 |
| **AC** | sodium_actual | Actual sodium (mg) | 3850 |
| **AD** | sodium_diff | Difference | -150 |
| **AE** | has_daily_totals | YES/NO | NO |
| **AF** | meal_count | # of meals | 9 |
| **AG** | food_count | # of foods | 27 |
| **AH** | cost_usd | Cost in USD | 0.0023 |
| **AI** | tokens_in | Input tokens | 2154 |
| **AJ** | tokens_out | Output tokens | 3998 |
| **AK** | tokens_total | Total tokens | 6152 |
| **AL** | prompt_chars | Prompt size | 15420 |
| **AM** | response_chars | Response size | 8540 |
| **AN** | rating | excellent/good/neutral/poor | poor |
| **AO** | issues | Comma-separated | missing_daily_totals, low_sodium |
| **AP** | comments | Free text | "Carbs were good but..." |
| **AQ** | accuracy_score | 0-100 score | 95 |

---

## 🎯 Easy Google Sheets Mapping:

In your n8n Google Sheets node:

### **Method 1: Auto-Map (Easiest)**
1. In Google Sheets node, set "Column to Match On": None
2. Toggle "Data Mode": "Auto-Map Input Data"
3. n8n will automatically map fields to matching column headers!

### **Method 2: Manual Map (If auto-map fails)**
Just map each output field to its column:
```
timestamp → Column A (timestamp)
version → Column B (version)
athlete_name → Column C (athlete_name)
weight_kg → Column D (weight_kg)
...etc
```

---

## 📊 Useful Formulas:

### **Average Accuracy by Model:**
```
=AVERAGEIF(K:K, "google/gemini-2.5-flash", AQ:AQ)
```

### **Count Missing daily_totals:**
```
=COUNTIF(AE:AE, "NO")
```

### **Best Model (Highest Avg Accuracy):**
```
=QUERY(A:AQ, "SELECT K, AVG(AQ) GROUP BY K ORDER BY AVG(AQ) DESC")
```

### **Fast Mode Comparison:**
```
=AVERAGEIFS(AQ:AQ, K:K, "google/gemini-2.5-flash", L:L, "YES")  // Fast ON
=AVERAGEIFS(AQ:AQ, K:K, "google/gemini-2.5-flash", L:L, "NO")   // Fast OFF
```

---

## 🎨 Conditional Formatting (Make it Pretty):

### **Color-code ratings:**
- Excellent: Green background
- Good: Light green
- Neutral: Yellow
- Poor: Red

### **Highlight issues:**
- `has_daily_totals = "NO"` → Red background
- `accuracy_score < 80` → Orange background
- `cal_pct_diff > 10%` → Yellow background

---

## 🔄 Pivot Table Example:

**Rows:** model_used  
**Columns:** fast_mode  
**Values:** Average accuracy_score  

Shows you: Which model + Fast Mode combo is most accurate!

---

**Copy the header row from above and paste it into your Google Sheet Row 1!** Then the n8n auto-mapping should work perfectly! 🎯

