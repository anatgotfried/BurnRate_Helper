# 🚨 Error Messages Guide

## What Better Error Messages Look Like:

### **Before (Generic):**
```
❌ Error: OpenRouter API error: Provider returned error
```
**Not helpful!** No idea what went wrong or how to fix it.

---

### **After (Specific & Actionable):**

## 1. Authentication Error (401)

**Message:**
```
🔑 Authentication failed. Your OpenRouter API key is invalid or missing. 
Check Vercel environment variables.

Model: google/gemini-flash-1.5-8b
Status: 401

Fix: Check your OpenRouter API key in Vercel settings.

[Show technical details ▼]
```

**What to do:**
```bash
vercel env add OPENROUTER_API_KEY
# Paste your sk-or-v1-... key
vercel --prod
```

---

## 2. Insufficient Credits (402)

**Message:**
```
💳 Insufficient credits. Add credits at https://openrouter.ai/credits 
(even $5 gives you 1000+ meal plans!)

Model: anthropic/claude-3.5-sonnet-20241022
Status: 402

Fix: Add credits at openrouter.ai/credits
```

**What to do:**
- Go to https://openrouter.ai/credits
- Add $5-10 (lasts months!)
- Try again

---

## 3. Rate Limit (429)

**Message:**
```
⏱️ Rate limit exceeded. You've made too many requests. 
Wait 30-60 seconds and try again.

Model: openai/gpt-4o-mini
Status: 429

Fix: Wait 30 seconds and try again. Consider upgrading your OpenRouter plan.
```

**What to do:**
- Wait 1 minute
- Try again
- If happens often: Upgrade OpenRouter tier

---

## 4. Model Not Available

**Message:**
```
🤖 Model 'google/gemini-flash-1.5' is not available or has no active endpoints. 
Try these working models: 'Claude 3.5 Sonnet', 'GPT-4o Mini', or 'Claude 3 Haiku'.

Model: google/gemini-flash-1.5
Status: 400

Fix: Try switching to Claude 3.5 Sonnet or GPT-4o Mini.
```

**What to do:**
- Switch model dropdown to:
  - Claude 3.5 Sonnet (most reliable)
  - GPT-4o Mini (good balance)
  - Claude 3 Haiku (budget-friendly)

---

## 5. Provider Error (Generic Provider Issue)

**Message:**
```
⚡ The AI provider (google) encountered an error. This usually means:
1) Model is temporarily unavailable
2) Your prompt triggered a safety filter
3) Model has an outage

Try a different model (Claude 3.5 Sonnet is very reliable).

Model: google/gemini-flash-1.5-8b
Status: 500

[Show technical details ▼]
Provider details: Internal server error at provider
```

**What to do:**
- **Switch model** to Claude or OpenAI
- **Wait 5 minutes** if it's an outage
- **Check OpenRouter status** if persistent

---

## 6. Context Length Exceeded

**Message:**
```
📏 Prompt too long for this model. Try:
1) Remove some workouts
2) Use a model with larger context (Claude or GPT-4o)
3) Simplify your profile

Model: anthropic/claude-3-haiku-20240307
Status: 400
```

**What to do:**
- Remove 1-2 workouts
- Or switch to GPT-4o Mini (larger context)
- Or switch to Claude 3.5 Sonnet (128k context)

---

## 7. Timeout Error

**Message:**
```
⏰ Request timed out. The model took too long to respond. 
Try again or use a faster model like Gemini Flash.

Model: anthropic/claude-3.5-sonnet-20241022
Status: 504
```

**What to do:**
- Try again (might be temporary)
- Switch to Gemini Flash (faster)
- Reduce complexity (fewer workouts)

---

## 8. Server Down (502/503)

**Message:**
```
🔧 OpenRouter or the AI provider is temporarily down. 
Wait a minute and try again, or switch models.

Status: 502
```

**What to do:**
- Wait 2-3 minutes
- Try a different model
- Check https://status.openrouter.ai/

---

## 9. JSON Parse Error

**Message:**
```
❌ Failed to parse JSON: Invalid JSON at line 369. 
Try Claude 3.5 Sonnet for better JSON formatting.

Model: google/gemini-2.0-flash-exp:free

[Show technical details ▼]
Raw response: {...truncated...}
```

**What to do:**
- Switch to **Claude 3.5 Sonnet** (best JSON)
- Or try again (sometimes models hiccup)
- Check Raw JSON tab to see the response

---

## 10. Network Error (Fetch Failed)

**Message:**
```
Error: Failed to fetch
```

**What this means:**
- Backend is down
- DNS not configured
- CORS issue

**What to do:**
```bash
# Test if backend is working:
curl https://callback.burnrate.fit/api/models

# Should return JSON with models
# If not, backend needs redeployment:
vercel --prod
```

---

## 🎯 **Error Message Features:**

### **Always Shows:**
- ✅ Clear emoji indicator (🔑 🤖 ⚡ etc.)
- ✅ Plain English explanation
- ✅ Model that was attempted
- ✅ HTTP status code
- ✅ Actionable "Fix:" suggestion

### **Expandable Details:**
- 📋 Click "Show technical details" for raw error
- 🔍 Includes provider-specific error messages
- 🛠️ Full stack trace when helpful

### **Smart Suggestions:**
- 🔄 Recommends alternative models
- ⏱️ Suggests wait times
- 🔗 Links to relevant pages
- 💡 Step-by-step fixes

---

## 🚀 **Most Common Errors & Quick Fixes:**

| Error | Quick Fix |
|-------|-----------|
| Provider returned error | Switch to Claude 3.5 Sonnet |
| No endpoints found | Model ID wrong - use dropdown |
| Authentication failed | Check API key in Vercel |
| Insufficient credits | Add $5 at openrouter.ai |
| Rate limit | Wait 1 minute |
| Invalid JSON | Switch to Claude 3.5 Sonnet |
| Timeout | Try again or use Gemini Flash |

---

**The "Provider returned error" message is now much more specific!** 🎉

It will tell you:
- Which provider failed (Google/Anthropic/OpenAI)
- Why it likely failed
- What to try next
- Alternative models that work

---

**Deployed to:** https://callback.burnrate.fit/meal-playground/

Try generating again and you'll see detailed, helpful error messages! 💪

