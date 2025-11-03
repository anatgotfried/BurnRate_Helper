# 🔧 Fix n8n Webhook 404 Error

## ❌ Current Issue:
```
n8n webhook returned status 404
```

---

## ✅ **Solution: Add via Vercel Dashboard**

The command-line method sometimes doesn't work properly. Use the dashboard instead:

### **Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/anat-gotfrieds-projects/burn-rate-helper
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar

### **Step 2: Check if N8N_FEEDBACK_WEBHOOK exists**
- Look for `N8N_FEEDBACK_WEBHOOK` in the list
- If it exists, click **Edit** button
- If not, click **Add New** button

### **Step 3: Set the Value**
```
Name:  N8N_FEEDBACK_WEBHOOK
Value: https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback

Environments:
☑ Production
☑ Preview  
☑ Development
```

### **Step 4: Save & Redeploy**
1. Click **Save**
2. Go to **Deployments** tab
3. Find latest deployment
4. Click **···** menu → **Redeploy**
5. Confirm redeploy

---

## 🧪 **Verify n8n Webhook is Working**

Test it directly:
```bash
curl -X POST https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback \
  -H "Content-Type: application/json" \
  -d '{"test": "hello"}'
```

**Expected:** `{"success": true}`

**If you get 404:**
1. Open n8n workflow
2. Click Webhook Trigger node
3. Look for "Production URL" or "Webhook URLs" section
4. Copy the EXACT URL (might be different from what you think!)
5. Use that URL instead

---

## 🔍 **Common n8n Webhook Issues:**

### **Issue 1: Workflow Not Activated**
- Open workflow in n8n
- Top-right toggle should be green "Active"
- If gray "Inactive", click to activate

### **Issue 2: Wrong Path**
Your URL: `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`

This breaks down as:
- Base: `https://burnrate.app.n8n.cloud/webhook-test/`
- Path: `burnrate-feedback`

In the Webhook node, the "Path" field should just be: `burnrate-feedback`

### **Issue 3: Test vs Production URL**
n8n gives you TWO URLs:
- **Test URL:** For manual testing (only works when you click "Listen for test event")
- **Production URL:** Always active (this is what you need!)

Make sure you're using the **Production URL**!

### **Issue 4: Workflow Not Saved**
- After creating the workflow, click **Save** button
- The workflow won't work until saved!

---

## 📋 **Correct n8n Setup:**

1. **Webhook Trigger Node:**
   - HTTP Method: **POST**
   - Path: `burnrate-feedback`
   - Response Mode: "Using Respond to Webhook Node"

2. **Respond to Webhook Node:**
   - Response Body: `{"success": true, "message": "Feedback received"}`

3. **Workflow Status:**
   - **ACTIVE** (green toggle)
   - **SAVED** (no unsaved changes indicator)

---

## ✅ **After Fixing:**

Test again:
```bash
curl -X POST https://burn-rate-helper.vercel.app/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-11-04T15:00:00Z",
    "version": "v1.6.1",
    "athlete": {"weight_kg": 60},
    "user_feedback": {"rating": "good", "issues": [], "comments": "test"}
  }'
```

**Expected:** `{"success": true, "message": "Feedback submitted successfully..."}`

If still 404, send me:
1. Screenshot of your n8n Webhook node settings
2. The exact Production URL from n8n

