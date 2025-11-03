# 🔑 Add Your API Key - Do This Now!

## Step 1: Run This Command

```bash
vercel env add OPENROUTER_API_KEY
```

## Step 2: When Prompted

**Question:** "What's the value of OPENROUTER_API_KEY?"
**Answer:** Paste your OpenRouter API key
- Get it from: https://openrouter.ai/keys
- Format: `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx`

**Question:** "Add OPENROUTER_API_KEY to which Environments?"
**Answer:** 
- Use arrow keys to navigate to **Production**
- Press **SPACE** to select it (you'll see `[x]`)
- Press **ENTER** to confirm

## Step 3: Redeploy

After adding the key, redeploy:

```bash
vercel --prod
```

This will update your live site with the secure API key!

## Done!

Your Meal Playground will now work at:
https://burn-rate-helper.vercel.app/meal-playground/

🔒 Your API key is stored securely on Vercel and never exposed in the code!

