# 👁️ Full Transparency Features

## ✅ **You Now Have Complete Visibility!**

**https://callback.burnrate.fit/meal-playground/**

---

## 🎯 **New Features:**

### **1. 👁️ View Prompt Button**

**What:** See the exact prompt BEFORE generating
**Why:** Verify inputs, check token count, estimate cost

**How to use:**
1. Fill in profile and workouts
2. Click **"👁️ View Prompt"** (next to Generate button)
3. See exact prompt in "Prompt Sent" tab
4. See token count and estimated cost

**Example:**
```
✅ Prompt ready! ~4,234 tokens. 
Model: anthropic/claude-3.5-sonnet
Estimated cost: ~$0.0215
```

---

### **2. "Prompt Sent" Tab**

**What:** Always shows the last prompt sent to AI
**When:** Automatically populated when you click Generate

**Shows:**
- Full prompt text
- Research corpus (or filtered version if fast mode)
- All context data (profile, workouts, targets)
- Exact instructions to AI

**Use case:** Copy/paste prompt to test elsewhere, debug issues

---

### **3. "AI Response" Tab**

**What:** ALWAYS shows raw AI response (success OR fail)
**When:** Every generation, even errors

**Shows:**
```json
{
  "success": true,
  "meal_plan": { ... },
  "usage": {
    "prompt_tokens": 4234,
    "completion_tokens": 1876,
    "total_tokens": 6110
  },
  "model": "anthropic/claude-3.5-sonnet",
  "auto_fixed": false
}
```

**Or on error:**
```json
{
  "success": false,
  "error": "🤖 Model 'xyz' is not available",
  "details": "OpenRouter could not find endpoints",
  "fix": "Try: Claude 3.5 Sonnet or GPT-4o Mini"
}
```

**Use case:** 
- See exactly what AI returned
- Debug JSON parsing issues
- Verify token usage
- Check if auto-fix ran

---

### **4. Only Uses Selected Model**

**What:** Two-phase system disabled
**Why:** For debugging and full control

**Now:**
- You select model from dropdown
- That's the ONLY model used
- No automatic fallbacks
- No hidden model switching

**Example:**
```
You select: Claude 3.5 Sonnet
Result: Uses Claude 3.5 Sonnet ✅

You select: Mistral Small
Result: Uses Mistral Small ✅
(No auto-fallback to Claude)
```

---

## 🔍 **How to Debug Issues:**

### **Problem: Getting errors?**

**Step 1:** Click "AI Response" tab
- See raw error from backend
- Check error message and fix suggestion

**Step 2:** Click "Prompt Sent" tab
- Check token count (shown at bottom)
- If >100k tokens, enable fast mode
- If prompt looks wrong, adjust inputs

**Step 3:** Try different model
- Claude 3.5 Sonnet: Most reliable
- GPT-4o Mini: Good balance
- Mistral Small: Cheapest

---

### **Problem: Empty meals or NaN?**

**Step 1:** Click "AI Response" tab
- Look for `"meals": []` (empty array)
- Or look for truncated JSON

**Step 2:** Click "Prompt Sent" tab
- Check prompt size
- Enable fast mode if >10k tokens

**Step 3:** Switch to Claude 3.5 Sonnet
- Most reliable with complex JSON
- Never truncates

---

### **Problem: Want to test prompt elsewhere?**

**Step 1:** Click "👁️ View Prompt" button
**Step 2:** Click "Prompt Sent" tab
**Step 3:** Click "Copy Prompt" button
**Step 4:** Paste into ChatGPT/Claude/etc.

---

## 📊 **What You Can Now See:**

### **Before Generation:**
```
1. Click "👁️ View Prompt"
2. See:
   - Exact prompt text
   - Token count: ~4,234 tokens
   - Selected model
   - Estimated cost: ~$0.0215
```

### **During Generation:**
```
Status message shows:
"Generating with anthropic/claude-3.5-sonnet... 
(prompt: ~4,234 tokens)"
```

### **After Generation (Success):**
```
Tabs available:
- Meal Cards: Visual meal plan ✅
- Daily Summary: Targets vs actuals ✅
- Raw JSON: Full meal plan JSON ✅
- Prompt Sent: What you sent ✅
- AI Response: What AI returned ✅
```

### **After Generation (Error):**
```
Tabs available:
- AI Response: Shows error details ✅
- Prompt Sent: See what you sent ✅

Status shows:
"⚠️ Error: Model 'xyz' not available.
Fix: Try Claude 3.5 Sonnet or GPT-4o Mini"
```

---

## 🎯 **Common Workflows:**

### **Workflow 1: Quick Generation**
```
1. Fill form
2. Click "Generate Meal Plan"
3. Done!
```

### **Workflow 2: Preview Before Generate**
```
1. Fill form
2. Click "👁️ View Prompt"
3. Check token count & cost
4. If good → Click "Generate Meal Plan"
```

### **Workflow 3: Debug Generation**
```
1. Generation failed
2. Click "AI Response" tab
3. See error: "Prompt too long"
4. Click "Prompt Sent" tab
5. See: ~15,234 tokens
6. Enable "Fast Mode" checkbox
7. Click "Generate Meal Plan" again
8. Success! (~4,234 tokens)
```

### **Workflow 4: Test Prompt Elsewhere**
```
1. Click "👁️ View Prompt"
2. Click "Prompt Sent" tab
3. Click "Copy Prompt"
4. Paste into Claude.ai or ChatGPT
5. Compare results
```

---

## 💰 **Cost Visibility:**

**Before (estimated):**
```
👁️ View Prompt shows:
"Estimated cost: ~$0.0215"
```

**After (actual):**
```
Cost display shows:
"$0.021543 | 4,234 in + 1,876 out | claude-3.5-sonnet
Session: $0.0643 (3 calls)"
```

**In AI Response tab:**
```json
{
  "usage": {
    "prompt_tokens": 4234,
    "completion_tokens": 1876
  }
}
```

---

## 🔧 **Debugging Tools:**

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **👁️ View Prompt** | Preview before sending | Check cost, verify inputs |
| **Prompt Sent tab** | See what was sent | Debug prompt issues |
| **AI Response tab** | See raw response | Debug errors, verify output |
| **Fast Mode checkbox** | Reduce prompt size | Token limit errors |
| **Model dropdown** | Change AI model | Try more reliable models |

---

## ✅ **Try It Now:**

**https://callback.burnrate.fit/meal-playground/**

1. **Fill in profile** (weight, height, etc.)
2. **Add workout**
3. **Click "👁️ View Prompt"** ← NEW!
4. **See prompt + cost estimate**
5. **Click "Generate Meal Plan"**
6. **Check "AI Response" tab** ← NEW!
7. **See exactly what AI returned**

---

**You now have FULL transparency into the AI generation process!** 👁️✨

