# n8n Quick Start - Meal Planner in 5 Minutes

## Step 1: Input Data Format

Your n8n workflow needs to receive this JSON structure:

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
    "timezone": "Asia/Jerusalem"
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

## Step 2: n8n Workflow

```
[Webhook] → [AI Node] → [JSON Parse] → [Response]
```

## Step 3: AI Node Configuration

### Option A: OpenRouter (Recommended - supports Gemini FREE)

**HTTP Request Node**
- Method: `POST`
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Headers:
  ```json
  {
    "Authorization": "Bearer YOUR_OPENROUTER_KEY",
    "Content-Type": "application/json"
  }
  ```
- Body:
  ```json
  {
    "model": "google/gemini-2.5-flash",
    "messages": [
      {
        "role": "system",
        "content": "You are a JSON API. Return ONLY valid JSON."
      },
      {
        "role": "user",
        "content": "{{ USE PROMPT FROM N8N_PROMPT_TEMPLATE.txt }}"
      }
    ],
    "max_tokens": 6000
  }
  ```

### Option B: Built-in OpenAI Node

- Model: `gpt-4o-mini`
- System Message: "You are a JSON API. Return ONLY valid JSON."
- User Message: Use prompt from `N8N_PROMPT_TEMPLATE.txt`

### Option C: Built-in Anthropic Node

- Model: `claude-3-5-sonnet-20241022`
- System: "You are a JSON API. Return ONLY valid JSON."
- User: Use prompt from `N8N_PROMPT_TEMPLATE.txt`

## Step 4: Copy the Prompt

Open `N8N_PROMPT_TEMPLATE.txt` and copy the entire prompt into your AI node's "User Message" field.

Make sure to use n8n variables like `{{$json.athlete.weight_kg}}` - they'll be replaced automatically!

## Step 5: Expected Output

The AI will return JSON like this:

```json
{
  "athlete_summary": { ... },
  "meals": [
    {
      "time": "07:00",
      "name": "Pre-Workout Breakfast",
      "type": "pre_workout",
      "foods": [
        {
          "item": "Oatmeal, 80g dry",
          "carbs_g": 54,
          "protein_g": 11,
          "fat_g": 6,
          "sodium_mg": 200,
          "calories": 303
        }
      ],
      "total_carbs_g": 54,
      "total_protein_g": 11,
      "total_fat_g": 6,
      "total_sodium_mg": 200,
      "total_calories": 303,
      "rationale": "Pre-workout meal 2h before provides...",
      "israel_alternatives": ["Quaker Oats (Osem)..."]
    }
  ],
  "daily_totals": {
    "calories": 3200,
    "carbs_g": 420,
    "protein_g": 140,
    "fat_g": 85,
    "sodium_mg": 3800
  }
}
```

## Step 6: Test Data

Use this to test your workflow:

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
    "timezone": "Asia/Jerusalem"
  },
  "workouts": [
    {
      "type": "run",
      "duration_min": 60,
      "intensity": "moderate",
      "startTime": "09:00",
      "temp_c": 20,
      "humidity_pct": 60
    }
  ],
  "calculated_targets": {
    "daily_energy_target_kcal": 2800,
    "daily_protein_target_g": 140,
    "daily_carb_target_g": 350,
    "daily_fat_target_g": 75,
    "hydration_target_l": 3.2,
    "sodium_target_mg": 3500
  }
}
```

## Quick Troubleshooting

### ❌ AI returns markdown with ```json``` blocks
**Fix**: Add to system message:
```
CRITICAL: Return ONLY JSON. First character { last character }
No markdown, no code blocks, no explanations.
```

### ❌ Daily totals don't match targets
**Fix**: The prompt already emphasizes ±2% accuracy. If still failing, try Claude 3.5 Sonnet (best at following instructions)

### ❌ Missing sodium values
**Fix**: The prompt already requires sodium in every food. If AI ignores it, add to system message:
```
EVERY food item MUST include sodium_mg. No zeros. No null.
```

## Recommended Models

| Model | API | Cost/Plan | Quality |
|-------|-----|-----------|---------|
| **Gemini 2.5 Flash** | OpenRouter | FREE | ⭐⭐⭐⭐⭐ |
| Claude 3.5 Sonnet | Anthropic | $0.03 | ⭐⭐⭐⭐⭐ |
| GPT-4o Mini | OpenAI | $0.003 | ⭐⭐⭐⭐ |

## Cost Estimates

- Gemini 2.5 Flash: **FREE** (with Google API key via OpenRouter)
- GPT-4o Mini: ~$0.003 per meal plan
- Claude 3.5 Sonnet: ~$0.03 per meal plan (best quality)

---

## Complete Files:

1. **N8N_PROMPT_TEMPLATE.txt** - Copy this into your AI node
2. **N8N_INTEGRATION_GUIDE.md** - Full technical documentation
3. **N8N_QUICK_START.md** - This file (you are here)

## Need More Details?

- Macro calculation formulas: See `N8N_INTEGRATION_GUIDE.md` section "Macro Calculation Formulas"
- Validation logic: See `N8N_INTEGRATION_GUIDE.md` section "Validation Function"
- Original code reference: `/meal-playground/app.py` and `/meal-playground/script.js`

