# 🔍 Find Your Correct n8n Webhook URL

## The Problem:
Flask is trying to POST to: `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`  
But n8n returns: **404 Not Found**

This means the URL is slightly wrong!

---

## ✅ **How to Find the Correct URL:**

### **Step 1: Open Your n8n Workflow**
1. Go to https://burnrate.app.n8n.cloud
2. Open your "BurnRate Feedback Collector" workflow
3. Click on the **Webhook Trigger** node

### **Step 2: Find Production URL**
Look for one of these sections:
- **"Production URL"**
- **"Webhook URLs"**
- **"URL"**

You'll see something like:
```
Test URL: https://burnrate.app.n8n.cloud/webhook-test/...
Production URL: https://burnrate.app.n8n.cloud/webhook/...  ← USE THIS ONE!
```

### **Step 3: Copy the EXACT Production URL**

It might be:
- ✅ `https://burnrate.app.n8n.cloud/webhook/burnrate-feedback`
- ✅ `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`  
- ✅ `https://burnrate.app.n8n.cloud/webhook/test/burnrate-feedback`
- ✅ Something else entirely!

**Don't guess - use the EXACT URL n8n shows you!**

---

## 🧪 **Step 4: Test It**

Once you have the URL, test it:

```bash
curl -X POST YOUR_EXACT_URL_HERE \
  -H "Content-Type: application/json" \
  -d '{"test": "hello"}'
```

**Expected response:**
```json
{"success": true}
```

**If you get this**, the URL is correct!

---

## 🔧 **Step 5: Update in Vercel**

### **Option A: Via Dashboard (Recommended)**
1. Go to: https://vercel.com/anat-gotfrieds-projects/burn-rate-helper/settings/environment-variables
2. Find `N8N_FEEDBACK_WEBHOOK`
3. Click **Edit**
4. Paste the CORRECT URL from n8n
5. Click **Save**
6. Redeploy: `vercel --prod`

### **Option B: Via Command Line**
```bash
# Remove old value
vercel env rm N8N_FEEDBACK_WEBHOOK production
# (type 'y' to confirm)

# Add correct value
vercel env add N8N_FEEDBACK_WEBHOOK production
# (paste the correct URL when prompted)

# Redeploy
vercel --prod
```

---

## 🎯 **Common URL Patterns:**

### **Pattern 1: `/webhook/` (most common)**
```
https://your-instance.app.n8n.cloud/webhook/your-path
```

### **Pattern 2: `/webhook-test/` (testing mode)**
```
https://your-instance.app.n8n.cloud/webhook-test/your-path
```

### **Pattern 3: Custom subdomain**
```
https://your-custom-name.n8n.cloud/webhook/your-path
```

---

## 🚨 **Also Check:**

1. **Workflow is ACTIVE** (green toggle in n8n)
2. **Workflow is SAVED** (no unsaved changes)
3. **Respond to Webhook node exists** (n8n needs this to return a response)

---

## 📸 **What to Send Me:**

If still having issues, tell me:
1. The EXACT URL shown in your n8n Webhook node (Production URL)
2. Result of: `curl -X POST <that-url> -d '{"test":"hello"}'`
3. Screenshot of your webhook node settings

**Find that Production URL in n8n and send it to me!** 🎯

