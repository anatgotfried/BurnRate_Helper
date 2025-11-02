# 🔑 How to Add Gemini Models to OpenRouter

## Why Gemini Isn't Showing Up

Gemini models require you to **bring your own Google AI API key** to OpenRouter. This is called "BYOK" (Bring Your Own Key).

---

## ✅ **Step-by-Step Setup:**

### **Step 1: Get a Google AI API Key**

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

**Cost:** FREE! Google gives you:
- 15 requests per minute
- 1,500 requests per day
- Completely free for Gemini 1.5 Flash and Gemini 1.5 Pro

---

### **Step 2: Add Key to OpenRouter**

1. Go to: https://openrouter.ai/settings/integrations
2. Find **"Google AI Studio"** section
3. Paste your API key: `AIza...`
4. Click **"Save"**

---

### **Step 3: Verify It's Working**

After adding your key, test it:

```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_OPENROUTER_KEY" | \
  jq '.data[] | select(.id | contains("google")) | .id'
```

You should see:
```
google/gemini-flash-1.5
google/gemini-pro-1.5
google/gemini-flash-1.5-8b
google/gemini-2.0-flash-exp
```

---

### **Step 4: Update Our App**

Once your Google key is connected to OpenRouter, add these models:

**Best Gemini Models:**

```javascript
{
    'id': 'google/gemini-flash-1.5',
    'name': 'Gemini 1.5 Flash',
    'provider': 'Google',
    'cost': 'FREE',
    'description': '1M context, FREE with your Google key'
},
{
    'id': 'google/gemini-pro-1.5',
    'name': 'Gemini 1.5 Pro',
    'provider': 'Google',
    'cost': 'FREE',
    'description': '2M context, FREE with your Google key'
},
{
    'id': 'google/gemini-2.0-flash-exp',
    'name': 'Gemini 2.0 Flash Exp',
    'provider': 'Google',
    'cost': 'FREE',
    'description': '1M context, newest experimental, FREE'
}
```

---

## 🎯 **Why Use Gemini BYOK:**

### **Advantages:**
✅ **Completely FREE** - No per-token charges
✅ **1-2M token context** - Handles huge prompts easily
✅ **Fast** - Very quick responses
✅ **High quality** - Google's latest models
✅ **No rate limits** (15/min, 1500/day is generous)

### **Disadvantages:**
⚠️ Requires setup (get Google key + add to OpenRouter)
⚠️ JSON formatting can be inconsistent (but we auto-fix!)
⚠️ Rate limits lower than paid models

---

## 💡 **Recommended Gemini Setup:**

### **For Most Users:**
**Gemini 1.5 Flash** + Auto-healing
- FREE unlimited (within rate limits)
- Fast (~15 seconds)
- 1M context
- Our auto-healing fixes JSON issues

### **For Complex Prompts:**
**Gemini 1.5 Pro**
- FREE
- 2M context (can handle ANYTHING)
- Smarter reasoning
- ~25 seconds

### **For Testing New Features:**
**Gemini 2.0 Flash Experimental**
- FREE
- Newest model
- May be unstable
- Good for experimenting

---

## 🔧 **Adding to Your App:**

I can add these models automatically once you:

1. Get Google AI key: https://aistudio.google.com/apikey
2. Add to OpenRouter: https://openrouter.ai/settings/integrations
3. Tell me "Done" and I'll add the models

---

## 📊 **Cost Comparison:**

**Without Google BYOK:**
- Mistral Small: $0.001/plan
- Qwen 2.5: $0.0015/plan
- Claude Haiku: $0.001/plan

**With Google BYOK:**
- **Gemini 1.5 Flash: $0.00/plan** (FREE!)
- **Gemini 1.5 Pro: $0.00/plan** (FREE!)
- **Gemini 2.0 Flash: $0.00/plan** (FREE!)

**Savings for 1000 plans:** ~$1-2 🎉

---

## ⚠️ **Important Notes:**

1. **Rate Limits:** 15 req/min, 1500 req/day (per Google account)
2. **Separate from OpenRouter:** Uses your Google quota, not OpenRouter
3. **Free Tier:** Google's free tier is generous for personal use
4. **Auto-Healing:** Our system auto-fixes Gemini's occasional JSON issues

---

## 🚀 **Quick Start:**

```bash
# 1. Get Google AI key
# Visit: https://aistudio.google.com/apikey

# 2. Add to OpenRouter  
# Visit: https://openrouter.ai/settings/integrations
# Paste your AIza... key

# 3. Tell me "I added my Google key"
# I'll update the app with Gemini models

# 4. Use Gemini for FREE!
# Select Gemini 1.5 Flash in dropdown
# Generate unlimited meal plans
```

---

**Ready to add your Google AI key?** Let me know once you've done steps 1-2 and I'll add Gemini models to the dropdown! 🚀

