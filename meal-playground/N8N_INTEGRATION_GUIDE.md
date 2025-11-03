# n8n Integration Guide - BurnRate Meal Planner

## Overview
This guide helps you replicate the BurnRate Meal Planner functionality in n8n using AI nodes (OpenAI, Anthropic, or other LLM providers).

---

## Input Data Structure

Your n8n workflow should collect the following data:

### 1. Athlete Profile
```json
{
  "athlete": {
    "weight_kg": 70,
    "height_cm": 175,
    "gender": "male",
    "training_phase": "base|build|peak|recovery|off_season",
    "goal": "performance|weight_loss|muscle_gain|maintenance",
    "diet_pattern": "omnivore|vegetarian|vegan|paleo|keto",
    "gi_tolerance": "sensitive|moderate|good",
    "sweat_rate": "low|moderate|high",
    "timezone": "Asia/Jerusalem",
    "populations": []
  }
}
```

### 2. Workouts Array
```json
{
  "workouts": [
    {
      "type": "run|bike|swim|strength|hiit|tempo|intervals|long_endurance",
      "duration_min": 60,
      "intensity": "low|moderate|high|very_high",
      "startTime": "09:00",
      "temp_c": 20,
      "humidity_pct": 60
    }
  ]
}
```

### 3. Calculated Targets (Pre-calculated or you can calculate in n8n)
```json
{
  "calculated_targets": {
    "daily_energy_target_kcal": 2800,
    "daily_protein_target_g": 140,
    "daily_carb_target_g": 350,
    "daily_fat_target_g": 75,
    "hydration_target_l": 3.2,
    "sodium_target_mg": 3500,
    "explanations": {
      "protein": "1.8-2.0 g/kg for endurance athletes",
      "carbs": "5-7 g/kg for moderate training",
      "fat": "0.8-1.2 g/kg",
      "hydration": "Based on workout duration and sweat rate",
      "sodium": "Based on sweat losses"
    }
  }
}
```

---

## Prompt Template for n8n

Use this prompt in your n8n AI node (Claude, GPT-4, Gemini, etc.):

```
You are a world-class sports nutritionist specializing in endurance athlete nutrition. Generate a complete daily meal plan based on the provided data.

## INPUT DATA
{{json.athlete_profile}}
{{json.workouts}}
{{json.calculated_targets}}

## YOUR TASK
Create a detailed meal plan that:
1. Matches the calculated targets within ±2%
2. Times meals around workout schedule
3. Includes specific portions and measurements
4. Provides research-based rationales
5. Tracks sodium in every food item

## OUTPUT FORMAT (Return ONLY valid JSON)

{
  "athlete_summary": {
    "weight_kg": {{json.athlete.weight_kg}},
    "daily_energy_target_kcal": {{json.calculated_targets.daily_energy_target_kcal}},
    "daily_protein_target_g": {{json.calculated_targets.daily_protein_target_g}},
    "daily_carb_target_g": {{json.calculated_targets.daily_carb_target_g}},
    "daily_fat_target_g": {{json.calculated_targets.daily_fat_target_g}},
    "hydration_target_l": {{json.calculated_targets.hydration_target_l}},
    "sodium_target_mg": {{json.calculated_targets.sodium_target_mg}},
    "explanations": {{json.calculated_targets.explanations}}
  },
  "meals": [
    {
      "time": "HH:MM",
      "name": "Meal name (e.g., 'Pre-Workout Breakfast')",
      "type": "breakfast|pre_workout|intra_workout|post_workout|lunch|dinner|snack",
      "foods": [
        {
          "item": "Food name with portion (e.g., 'Oatmeal, 80g dry')",
          "carbs_g": 50,
          "protein_g": 10,
          "fat_g": 5,
          "sodium_mg": 200,
          "calories": 300
        }
      ],
      "total_carbs_g": 50,
      "total_protein_g": 10,
      "total_fat_g": 5,
      "total_sodium_mg": 200,
      "total_calories": 300,
      "rationale": "3-5 sentences explaining the meal timing, food choices, and portions based on research. Cite sources like ISSN, ACSM, IOC guidelines.",
      "israel_alternatives": [
        "Quaker Oats (Osem) - 80g",
        "Yotvata Milk - 250ml",
        "Tnuva Greek Yogurt - 150g"
      ]
    }
  ],
  "daily_totals": {
    "calories": 2800,
    "carbs_g": 350,
    "protein_g": 140,
    "fat_g": 75,
    "sodium_mg": 3500,
    "fluids_l": 3.2,
    "protein_per_kg": 2.0,
    "carbs_per_kg": 5.0
  },
  "key_recommendations": [
    "Start carb loading 48h before race",
    "Consume 30-60g carbs per hour during workout",
    "Prioritize protein within 2h post-workout"
  ],
  "warnings": [
    "⚠️ High sweat rate detected - increase sodium intake",
    "⚠️ Long workout - consider intra-workout nutrition"
  ]
}

## CRITICAL RULES

1. **Match Targets**: Your daily_totals MUST be within ±2% of the calculated targets
   - Target calories: {{json.calculated_targets.daily_energy_target_kcal}} kcal
   - Target protein: {{json.calculated_targets.daily_protein_target_g}} g
   - Target carbs: {{json.calculated_targets.daily_carb_target_g}} g
   - Target fat: {{json.calculated_targets.daily_fat_target_g}} g
   - Target sodium: {{json.calculated_targets.sodium_target_mg}} mg

2. **Sodium Tracking**: EVERY food item must include sodium_mg (not zero)

3. **Meal Timing**: Schedule meals based on workout times:
   - Pre-workout: 2-3 hours before (high carbs, moderate protein, low fat)
   - Intra-workout: During workouts >90 min (30-60g carbs/hour)
   - Post-workout: Within 2 hours (carbs + protein 3:1 ratio)

4. **Protein Distribution**: Aim for 0.25-0.4 g/kg per meal ({{json.athlete.weight_kg * 0.3}} g for this athlete)

5. **Research-Based**: Cite sources in rationales (ISSN, ACSM, IOC, Burke, Morton, Jeukendrup)

6. **Israel Products**: Provide 3+ local alternatives per meal (Tnuva, Osem, Yotvata, Strauss, Elite)

7. **JSON Only**: Return ONLY valid JSON. No markdown, no explanations, no ```json``` blocks. Start with { and end with }

## NUTRITION SCIENCE GUIDELINES

- **Protein**: 1.6-2.2 g/kg/day for athletes (ISSN 2017)
- **Carbs**: 
  - Low intensity: 3-5 g/kg/day
  - Moderate: 5-7 g/kg/day
  - High: 8-12 g/kg/day
- **Fat**: 0.8-1.2 g/kg/day (20-35% of calories)
- **Hydration**: 
  - Baseline: 30-40 ml/kg/day
  - Add: 0.5-1L per hour of exercise
  - High sweat rate: +50%
- **Sodium**: 
  - Baseline: 1500-2300 mg/day
  - Add: 500-1000 mg per liter of sweat
  - Hot/humid: +30-50%
- **Timing**:
  - Pre-workout (2-3h): 1-4 g/kg carbs
  - During (>90min): 30-60 g carbs/hour
  - Post-workout (2h): 0.3 g/kg protein + 1-1.2 g/kg carbs

Generate the complete meal plan now in valid JSON format.
```

---

## n8n Workflow Setup

### Recommended Node Structure:

```
1. [Webhook/Form] → Collect athlete data
   ↓
2. [Function] → Calculate targets (or use pre-calculated)
   ↓
3. [Code Node] → Build prompt with data
   ↓
4. [HTTP Request] → Call OpenRouter/OpenAI/Anthropic API
   OR
   [AI Agent] → Use built-in AI node
   ↓
5. [Function] → Parse JSON response
   ↓
6. [Function] → Validate meal plan (check totals vs targets)
   ↓
7. [Send Response/Email/Database] → Deliver meal plan
```

### Example n8n HTTP Request Node (OpenRouter)

**URL**: `https://openrouter.ai/api/v1/chat/completions`

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
  "Content-Type": "application/json",
  "HTTP-Referer": "https://yourdomain.com",
  "X-Title": "BurnRate Meal Planner"
}
```

**Body**:
```json
{
  "model": "google/gemini-2.5-flash",
  "messages": [
    {
      "role": "system",
      "content": "You are a JSON API. Return ONLY valid JSON. No markdown, no code blocks, no explanations."
    },
    {
      "role": "user",
      "content": "{{$json.prompt}}"
    }
  ],
  "max_tokens": 6000,
  "temperature": 0.7
}
```

---

## Macro Calculation Formulas (for n8n Function Node)

If you want to calculate targets in n8n instead of pre-calculating:

```javascript
// Basic calculations
const weight = $input.item.json.athlete.weight_kg;
const height = $input.item.json.athlete.height_cm;
const workouts = $input.item.json.workouts;

// 1. Calculate BMR (Mifflin-St Jeor)
let bmr;
if ($input.item.json.athlete.gender === 'male') {
  bmr = 10 * weight + 6.25 * height - 5 * 30 + 5; // Assuming age 30
} else {
  bmr = 10 * weight + 6.25 * height - 5 * 30 - 161;
}

// 2. Activity multiplier
const activityMultiplier = 1.5; // Moderate activity

// 3. Calculate workout calories
let workoutCalories = 0;
workouts.forEach(workout => {
  const minutes = workout.duration_min;
  let calsPerMin = 10; // Base rate
  
  // Adjust by type
  if (workout.type === 'run') calsPerMin = 12;
  if (workout.type === 'bike') calsPerMin = 10;
  if (workout.type === 'swim') calsPerMin = 11;
  if (workout.type === 'strength') calsPerMin = 8;
  
  // Adjust by intensity
  if (workout.intensity === 'low') calsPerMin *= 0.7;
  if (workout.intensity === 'high') calsPerMin *= 1.3;
  if (workout.intensity === 'very_high') calsPerMin *= 1.5;
  
  workoutCalories += minutes * calsPerMin;
});

// 4. Total daily calories
const dailyCalories = Math.round(bmr * activityMultiplier + workoutCalories);

// 5. Macros
const proteinPerKg = 2.0; // g/kg for athletes
const carbsPerKg = 6.0; // g/kg for moderate training (adjust based on volume)
const fatPerKg = 1.0; // g/kg

const protein_g = Math.round(weight * proteinPerKg);
const carbs_g = Math.round(weight * carbsPerKg);
const fat_g = Math.round(weight * fatPerKg);

// 6. Hydration
let hydration_l = weight * 0.035; // Base: 35ml/kg
workouts.forEach(workout => {
  const hours = workout.duration_min / 60;
  let sweatRate = 0.8; // L/hour default
  
  if (workout.intensity === 'high') sweatRate = 1.2;
  if (workout.intensity === 'very_high') sweatRate = 1.5;
  if (workout.temp_c > 25) sweatRate *= 1.2;
  if (workout.humidity_pct > 70) sweatRate *= 1.1;
  
  hydration_l += hours * sweatRate;
});

// 7. Sodium
let sodium_mg = 2300; // Base RDA
workouts.forEach(workout => {
  const hours = workout.duration_min / 60;
  let sodiumPerHour = 500; // mg/hour
  
  if (workout.intensity === 'high') sodiumPerHour = 700;
  if (workout.temp_c > 25) sodiumPerHour += 200;
  
  sodium_mg += hours * sodiumPerHour;
});

return {
  json: {
    calculated_targets: {
      daily_energy_target_kcal: dailyCalories,
      daily_protein_target_g: protein_g,
      daily_carb_target_g: carbs_g,
      daily_fat_target_g: fat_g,
      hydration_target_l: Math.round(hydration_l * 10) / 10,
      sodium_target_mg: Math.round(sodium_mg),
      explanations: {
        protein: `${proteinPerKg} g/kg for endurance athletes (ISSN)`,
        carbs: `${carbsPerKg} g/kg for moderate training`,
        fat: `${fatPerKg} g/kg for energy balance`,
        hydration: `Based on ${workouts.length} workout(s) and conditions`,
        sodium: `Adjusted for sweat losses and temperature`
      }
    },
    athlete: $input.item.json.athlete,
    workouts: workouts
  }
};
```

---

## Validation Function (Post-AI Response)

Add this after getting the AI response to validate accuracy:

```javascript
const mealPlan = $input.item.json;
const targets = mealPlan.athlete_summary;
const totals = mealPlan.daily_totals;

function checkAccuracy(actual, target, tolerance = 0.02) {
  const diff = Math.abs(actual - target);
  const pct = diff / target;
  return pct <= tolerance;
}

const validation = {
  calories_ok: checkAccuracy(totals.calories, targets.daily_energy_target_kcal),
  protein_ok: checkAccuracy(totals.protein_g, targets.daily_protein_target_g),
  carbs_ok: checkAccuracy(totals.carbs_g, targets.daily_carb_target_g),
  fat_ok: checkAccuracy(totals.fat_g, targets.daily_fat_target_g),
  sodium_ok: checkAccuracy(totals.sodium_mg, targets.sodium_target_mg)
};

const allValid = Object.values(validation).every(v => v === true);

return {
  json: {
    meal_plan: mealPlan,
    validation: validation,
    is_valid: allValid,
    message: allValid ? "✅ Meal plan meets all targets" : "⚠️ Some targets not met"
  }
};
```

---

## Recommended Models

| Model | Cost | Quality | Context | Best For |
|-------|------|---------|---------|----------|
| **Gemini 2.5 Flash** | FREE | Excellent | 1M tokens | Best choice - fast & free |
| **Claude 3.5 Sonnet** | $0.03 | Excellent | 200K | Most reliable JSON |
| **GPT-4o Mini** | $0.003 | Good | 128K | Budget option |
| **Mistral Small** | $0.001 | Good | 131K | Ultra cheap |

---

## Testing

Use this sample data to test your n8n workflow:

```json
{
  "athlete": {
    "weight_kg": 70,
    "height_cm": 175,
    "gender": "male",
    "training_phase": "base",
    "goal": "performance",
    "diet_pattern": "omnivore",
    "gi_tolerance": "good",
    "sweat_rate": "moderate",
    "timezone": "Asia/Jerusalem",
    "populations": []
  },
  "workouts": [
    {
      "type": "run",
      "duration_min": 90,
      "intensity": "moderate",
      "startTime": "07:00",
      "temp_c": 22,
      "humidity_pct": 65
    }
  ],
  "calculated_targets": {
    "daily_energy_target_kcal": 3200,
    "daily_protein_target_g": 140,
    "daily_carb_target_g": 420,
    "daily_fat_target_g": 85,
    "hydration_target_l": 3.8,
    "sodium_target_mg": 3800
  }
}
```

---

## Troubleshooting

### Issue: AI returns markdown instead of pure JSON
**Solution**: Add this to system message:
```
CRITICAL: Return ONLY JSON. First character must be { and last must be }. 
No markdown, no ```json```, no explanations.
```

### Issue: Totals don't match targets
**Solution**: Be more explicit in prompt:
```
Your daily_totals.calories MUST equal {{targets.daily_energy_target_kcal}} ± 2%
Calculate each meal carefully to hit this exact target.
```

### Issue: Missing sodium values
**Solution**: Add validation and retry logic:
```javascript
// Check if any food has sodium_mg = 0
const hasMissingSodium = mealPlan.meals.some(meal => 
  meal.foods.some(food => !food.sodium_mg || food.sodium_mg === 0)
);

if (hasMissingSodium) {
  // Trigger retry with stronger prompt
}
```

---

## Support & Resources

- Original codebase: `/meal-playground/`
- Macro calculator: `macro-calculator.js`
- Prompt template: `prompts/meal_planner_v2.txt`
- API implementation: `app.py`

Need help? Check the full documentation in the meal-playground folder.

