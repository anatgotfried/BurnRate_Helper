# 🐛 n8n Webhook 404 Troubleshooting

**Your URL:** `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`

**Error:** 404 Not Found

---

## ✅ **Checklist:**

### **1. Verify Workflow is ACTIVATED**
- Open your n8n workflow
- Top-right corner should show: **Active** (green toggle)
- If it says "Inactive", click to activate

### **2. Check Webhook Path**
In your Webhook Trigger node:
- **HTTP Method:** POST ✅
- **Path:** Should be just `burnrate-feedback` (not `webhook-test/burnrate-feedback`)
- **Authentication:** None (or whatever you set)

The full path is constructed by n8n:
```
https://burnrate.app.n8n.cloud/webhook-test/ ← Base URL from n8n
                                  + burnrate-feedback ← Your path
```

### **3. Get the EXACT Production URL**
In the Webhook node:
1. Click on the node
2. Look for **"Production URL"** or **"Webhook URLs"**
3. Copy the **EXACT** URL shown
4. Use that URL (don't modify it!)

It might be:
- `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback` ✅
- OR `https://burnrate.app.n8n.cloud/webhook/burnrate-feedback`
- OR something else entirely

**Use whatever n8n shows you!**

### **4. Test with curl**
```bash
curl -X POST https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback \
  -H "Content-Type: application/json" \
  -d '{"test": "hello"}'
```

**Expected response:**
```json
{"success": true, "message": "Feedback received"}
```

**If you get 404:**
- The path is wrong
- OR the workflow isn't activated
- OR the webhook node isn't configured properly

### **5. Common n8n Issues:**

**Issue A: Workflow Not Saved**
- Make sure you **saved** the workflow after creating it
- Click the **Save** button (top-right)

**Issue B: Wrong Environment**
- n8n has Test vs Production URLs
- In the webhook node, switch to "Production" tab to see the real URL

**Issue C: Path Mismatch**
- If n8n shows `webhook-test/burnrate-feedback` as the path
- Then the full URL is `https://burnrate.app.n8n.cloud/webhook-test/burnrate-feedback`
- But if the webhook node path field only has `burnrate-feedback`
- Then the full URL might be `https://burnrate.app.n8n.cloud/webhook/burnrate-feedback`

---

## 🔧 **Quick Fix:**

1. **In n8n:** Open Webhook Trigger node
2. **Look for:** "Production URL" section
3. **Copy** the EXACT URL shown
4. **Paste it here** and I'll update the code

---

## 🧪 **Alternative: Test with n8n's Manual Trigger**

1. In n8n workflow, click **"Execute Workflow"** button
2. Manually paste test JSON into the webhook node
3. See if it flows through to Google Sheets
4. This verifies the workflow logic works (even if URL is wrong)

---

**What's the EXACT URL shown in your n8n Webhook Trigger node?** 🎯

