# 🚀 Deploy RIGHT NOW - Follow These Steps

You're in the `meal-playground` directory. Follow these exact steps:

---

## Step 1: Deploy to Vercel (First Time)

Run this command:

```bash
vercel
```

**You'll be asked questions - here's how to answer:**

### Question 1: "Set up and deploy?"
**Answer:** `Y` (Yes)

### Question 2: "Which scope?"
**Answer:** Select your personal account (usually first option)

### Question 3: "Link to existing project?"
**Answer:** `N` (No, create new)

### Question 4: "What's your project's name?"
**Answer:** `burnrate-meal-playground` (or any name you like)

### Question 5: "In which directory is your code located?"
**Answer:** `./` (just press Enter)

### Question 6: "Want to override settings?"
**Answer:** `N` (No)

Vercel will now deploy! Wait 30-60 seconds...

**You'll get a URL like:** `https://burnrate-meal-playground.vercel.app`

✅ **COPY THIS URL!** You'll need it in the next step.

---

## Step 2: Add Your Secure API Key

Now add your OpenRouter API key as a secure environment variable:

```bash
vercel env add OPENROUTER_API_KEY
```

**You'll be asked:**

### "What's the value?"
**Paste your OpenRouter API key:** `sk-or-v1-...`

### "Which environments?"
**Select:** `Production` (use arrow keys, press Space, then Enter)

✅ Done! Your API key is now securely stored on Vercel (never visible in code)!

---

## Step 3: Deploy to Production

```bash
vercel --prod
```

This deploys with your environment variable. Wait ~30 seconds.

**Your production URL:** `https://burnrate-meal-playground.vercel.app`

---

## Step 4: Update Frontend

I'll update the frontend code to point to your backend URL.

**Tell me your Vercel URL** and I'll update `script.js` automatically!

Or you can manually edit `script.js` line 14:

```javascript
const PRODUCTION_API = 'https://your-actual-url.vercel.app';
```

---

## Step 5: Test Your Backend

Test if it's working:

```bash
curl https://your-url.vercel.app/api/models
```

Should return JSON with AI models!

---

## Ready? Run These Commands:

```bash
# 1. Initial deploy
vercel

# 2. Add API key
vercel env add OPENROUTER_API_KEY

# 3. Production deploy
vercel --prod
```

Then tell me your URL and I'll finish the setup! 🎉

