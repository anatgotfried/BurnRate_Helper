# 🔧 Troubleshooting Guide

## "Warning: Response may not be properly formatted"

### What This Means:
The AI returned text that couldn't be parsed as valid JSON.

### How to Fix:

#### **Try 1: Switch Models**
Different models have different JSON formatting reliability:

**Best for JSON:**
1. ✅ **Claude 3.5 Sonnet** - Most reliable JSON output
2. ✅ **GPT-4o Mini** - Very good JSON formatting
3. ✅ **Claude 3 Haiku** - Good balance

**Sometimes Problematic:**
- ⚠️ Gemini models - occasionally add markdown
- ⚠️ GPT-3.5 Turbo - older, less reliable

**Action:** Try Claude 3.5 Sonnet if you get formatting errors.

---

#### **Try 2: Check the Raw JSON Tab**
1. Click the "Raw JSON" tab
2. Look for the JSON between any extra text
3. If you see valid JSON surrounded by text, copy just the JSON part
4. The backend should extract it automatically, but manual copy works too

---

#### **Try 3: Simplify Profile**
Complex profiles can confuse the AI:
- Remove optional sweat rate
- Use standard dietary pattern (omnivore)
- Start with 1 workout instead of multiple
- Once it works, add complexity back

---

#### **Try 4: Check Browser Console**
1. Open DevTools (F12 or Cmd+Opt+I)
2. Go to Console tab
3. Look for error messages
4. Share error with developer if needed

---

## "Failed to fetch" Error

### Possible Causes:

#### **1. Backend Not Deployed**
Check if API is working:
```bash
curl https://callback.burnrate.fit/api/models
```

Should return JSON with model list.

**Fix:** Run `vercel --prod` to deploy backend

---

#### **2. CORS Error**
Check browser console for "CORS" error.

**Fix:** Already handled with Flask-CORS, but if persists:
- Clear browser cache
- Try incognito/private mode
- Check Vercel logs

---

#### **3. API Key Missing**
Error: "OpenRouter API key not configured"

**Fix:**
```bash
vercel env add OPENROUTER_API_KEY
# Paste your key
# Select: Production
vercel --prod
```

---

## "OpenRouter API error: No endpoints found"

### Cause:
Model ID is incorrect or model is unavailable.

### Fix:
Try a different model:
1. **Claude 3.5 Sonnet** - `anthropic/claude-3.5-sonnet-20241022`
2. **GPT-4o Mini** - `openai/gpt-4o-mini`
3. **Claude 3 Haiku** - `anthropic/claude-3-haiku-20240307`

These are verified to work!

---

## Sodium Shows 0mg or Very Low

### Cause:
AI didn't include sodium in food items or didn't add salt.

### Fix:
This should be fixed in v2 with:
- Explicit sodium requirements in prompt
- System message enforcing completion
- Quality check failing if sodium too low

If still happening:
- Try **Claude 3.5 Sonnet** (best at following instructions)
- Check if `calculated_targets.sodium_target_mg` is showing in context

---

## Calories Don't Match Targets

### Expected Behavior (v2):
- Targets calculated deterministically by frontend
- AI must match within ±50 kcal
- Summary shows ✅ if within range, ⚠️ if not

### If Still Happening:
1. Check "Quality Check" section - does it say "Yes"?
2. If "No", try Claude 3.5 Sonnet (best at math)
3. Verify `calculated_targets` is in the JSON tab

---

## Detailed Explanations Too Brief

### Expected (v2):
Each rationale should be 3-5 sentences with:
- Macro g/kg calculations
- Research citations
- Goal alignment
- Food selection reasoning

### If Still Brief:
- Try Claude 3.5 Sonnet (most verbose)
- Check prompt loaded correctly: look for "meal_planner_v2.txt" in console
- Verify system message is being sent

---

## Model Recommendations by Use Case

| Use Case | Best Model | Cost | Why |
|----------|-----------|------|-----|
| Quick test | Gemini 2.0 Flash (FREE) | $0 | Fast, free, good enough |
| Production use | Claude 3.5 Sonnet | ~$0.02 | Most reliable JSON + detailed explanations |
| Budget-conscious | Claude 3 Haiku | ~$0.005 | Good balance of quality and cost |
| OpenAI preference | GPT-4o Mini | ~$0.015 | Solid quality, good JSON |

---

## Still Having Issues?

1. **Check Console Logs**: Browser DevTools → Console
2. **Check Network Tab**: See actual API request/response
3. **View Raw Response**: Click "Raw JSON" tab to see what AI returned
4. **Try Different Model**: Claude 3.5 Sonnet is most reliable
5. **Simplify Input**: Start with minimal profile, add complexity gradually

---

## Getting Help

**Check these files for debugging:**
- `script.js` - Frontend logic (check console.log outputs)
- `app.py` - Backend API (check Vercel logs)
- `prompts/meal_planner_v2.txt` - Prompt template
- `macro-calculator.js` - Target calculations

**View Vercel Logs:**
```bash
vercel logs
```

Or visit: https://vercel.com/dashboard

---

**Most Common Solution:** Just switch to **Claude 3.5 Sonnet** - it's the most reliable! ✨

