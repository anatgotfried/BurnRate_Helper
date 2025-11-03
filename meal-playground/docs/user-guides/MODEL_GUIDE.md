# 🤖 Model Selection Guide

## 🎯 **Recommended Models for BurnRate Meal Playground**

All models verified to work with OpenRouter and handle our large nutrition research corpus.

---

## 💸 **Best Value Models (Frequent Use)**

### **1. Mistral Small** ⭐ DEFAULT
- **ID:** `mistralai/mistral-small-latest`
- **Cost:** ~$0.002/plan
- **Context:** 32k tokens
- **JSON:** 🟢 Good
- **Speed:** ⚡⚡ Very fast
- **Best for:** Daily meal planning, high-frequency use
- **Plans per $1:** ~500 plans

**Why choose:** Fastest and cheapest reliable option. Great JSON structure.

---

### **2. Qwen 2.5 14B** 💎 BEST VALUE
- **ID:** `qwen/qwen-2.5-14b-instruct`
- **Cost:** ~$0.001/plan
- **Context:** 32k tokens
- **JSON:** 🟢 Good
- **Speed:** ⚡ Medium
- **Best for:** Numbers, calculations, nutrition logic
- **Plans per $1:** ~1000 plans

**Why choose:** Cheapest paid model. Excellent with nutrition calculations and macro math.

---

### **3. Mistral Medium**
- **ID:** `mistralai/mistral-medium-latest`
- **Cost:** ~$0.004/plan
- **Context:** 32k tokens
- **JSON:** 🟢 Good
- **Speed:** ⚡ Fast
- **Best for:** Longer prompts, smarter reasoning
- **Plans per $1:** ~250 plans

**Why choose:** Better at complex multi-workout days.

---

### **4. Cohere Command R+**
- **ID:** `cohere/command-r-plus`
- **Cost:** ~$0.004/plan
- **Context:** 128k tokens (large!)
- **JSON:** 🟢 Very good
- **Speed:** ⚡⚡ Fast
- **Best for:** Fallback when others fail, consistent JSON
- **Plans per $1:** ~250 plans

**Why choose:** Most consistent JSON formatting. Rarely fails.

---

## 🏆 **Premium Models (Best Quality)**

### **5. Claude 3 Haiku**
- **ID:** `anthropic/claude-3-haiku`
- **Cost:** ~$0.006/plan
- **Context:** 200k tokens (huge!)
- **JSON:** 🟢 Very good
- **Speed:** ⚡ Medium
- **Best for:** Complex scenarios, detailed explanations
- **Plans per $1:** ~165 plans

**Why choose:** 200k context handles any prompt. Very reliable.

---

### **6. Claude 3.5 Sonnet** 🏅 BEST QUALITY
- **ID:** `anthropic/claude-3.5-sonnet`
- **Cost:** ~$0.025/plan
- **Context:** 200k tokens
- **JSON:** 🟢 Perfect
- **Speed:** ⚡ Medium
- **Best for:** Best quality, most detailed explanations, perfect JSON
- **Plans per $1:** ~40 plans

**Why choose:** Absolute best output quality. Worth it for important workouts.

---

### **7. GPT-4o Mini**
- **ID:** `openai/gpt-4o-mini`
- **Cost:** ~$0.015/plan
- **Context:** 128k tokens
- **JSON:** 🟢 Very good
- **Speed:** ⚡ Medium
- **Best for:** OpenAI preference, reliable fallback
- **Plans per $1:** ~65 plans

**Why choose:** Well-tested, familiar OpenAI quality.

---

### **8. GPT-4o** 💎 PREMIUM
- **ID:** `openai/gpt-4o`
- **Cost:** ~$0.050/plan
- **Context:** 128k tokens
- **JSON:** 🟢 Perfect
- **Speed:** ⚡ Medium
- **Best for:** Maximum quality, important events
- **Plans per $1:** ~20 plans

**Why choose:** OpenAI's best model. Ultra-detailed and accurate.

---

## 🆓 **Free Models (Testing Only)**

### **9. Mistral 7B Free**
- **ID:** `mistralai/mistral-7b-instruct:free`
- **Cost:** FREE
- **Context:** 32k tokens
- **JSON:** 🟡 Medium (may need fixing)
- **Speed:** ⚡ Fast
- **Rate Limits:** ⚠️ Shared limits
- **Best for:** Testing, prototyping

**Why choose:** Free! Good for experimenting before committing.

---

## 📊 **Cost Comparison (15k input, 4k output tokens)**

| Model | This Plan | 100 Plans | 1000 Plans |
|-------|-----------|-----------|------------|
| **Qwen 2.5 14B** | $0.001 | $0.10 | $1.00 |
| **Mistral Small** | $0.002 | $0.20 | $2.00 |
| **Mistral Medium** | $0.004 | $0.40 | $4.00 |
| **Cohere Command R+** | $0.004 | $0.40 | $4.00 |
| **Claude 3 Haiku** | $0.006 | $0.60 | $6.00 |
| **GPT-4o Mini** | $0.015 | $1.50 | $15.00 |
| **Claude 3.5 Sonnet** | $0.025 | $2.50 | $25.00 |
| **GPT-4o** | $0.050 | $5.00 | $50.00 |
| **Mistral 7B Free** | $0.00 | $0.00 | $0.00 |

---

## 🎯 **Recommended Strategy:**

### **Daily Use:**
**Mistral Small** (default)
- Super fast
- Very cheap ($0.002)
- Good JSON

### **Best Value:**
**Qwen 2.5 14B**
- Cheapest paid ($0.001)
- Great with numbers
- Perfect for nutrition calculations

### **Most Reliable:**
**Cohere Command R+**
- Very consistent JSON
- Rarely needs fixing
- Fast responses

### **Highest Quality:**
**Claude 3.5 Sonnet**
- Best explanations
- Perfect JSON
- Most detailed
- Worth it for special occasions

### **Free Option:**
**Mistral 7B Free**
- Testing only
- May hit rate limits
- JSON might need fixing (we auto-fix it!)

---

## 💡 **Pro Tips:**

1. **Start with Mistral Small** - get familiar with it
2. **Try Qwen 2.5** for cheapest option
3. **Upgrade to Claude 3.5 Sonnet** when you need perfection
4. **Use Free models** for testing profiles/workouts first

---

## 🔧 **If You Get Errors:**

**"Context too long"** → Already shouldn't happen (all 32k+)
**"Provider error"** → Switch to **Cohere Command R+** (most reliable)
**"Invalid JSON"** → Switch to **Claude 3.5 Sonnet** (perfect JSON)
**"Rate limit"** → Switch from free to **Mistral Small** ($0.002)

---

**All models deployed and ready!** 🚀

