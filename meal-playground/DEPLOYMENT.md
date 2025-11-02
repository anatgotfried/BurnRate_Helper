# Deployment Guide - Secure API Key Setup

## 🔐 Security: Why You Need a Backend

**Important**: Never put your OpenRouter API key in client-side JavaScript! It would be publicly visible and anyone could steal and use it, running up your bill.

## ✅ Recommended Setup

### Architecture
```
GitHub Pages (Frontend) → Vercel/Railway (Backend with API Key) → OpenRouter
```

- **Frontend**: GitHub Pages hosts your HTML/CSS/JS
- **Backend**: Vercel/Railway/Render hosts Flask app with secure API key
- **API Key**: Stored as environment variable on backend (never exposed)

---

## Option 1: Vercel (Easiest, Recommended)

### Step 1: Prepare for Vercel

Already done! The `vercel.json` file is ready.

### Step 2: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 3: Deploy to Vercel

**Via Web Interface:**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Flask app
6. **Add Environment Variable**:
   - Key: `OPENROUTER_API_KEY`
   - Value: `sk-or-your-key-here`
7. Click "Deploy"

**Via CLI:**

```bash
cd meal-playground
vercel

# On first deploy, answer prompts:
# - Link to existing project? N
# - Project name: meal-playground
# - Directory: ./
# - Override settings? N

# Add environment variable:
vercel env add OPENROUTER_API_KEY
# Paste your key when prompted
# Select: Production, Preview, Development

# Deploy:
vercel --prod
```

### Step 4: Update Frontend

Your Vercel backend URL will be: `https://your-project.vercel.app`

**For GitHub Pages**, update `script.js` line 8:

```javascript
const API_URL = 'https://your-project.vercel.app';
```

### Step 5: Enable CORS

Already configured in `app.py` with `Flask-CORS`!

---

## Option 2: Railway

### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Python app

### Step 2: Add Environment Variables

1. In Railway dashboard, click your project
2. Go to "Variables" tab
3. Add:
   ```
   OPENROUTER_API_KEY=sk-or-your-key-here
   FLASK_ENV=production
   ```

### Step 3: Configure Domain

Railway provides a free domain: `your-project.up.railway.app`

Update frontend `API_URL` to this domain.

---

## Option 3: Render

### Step 1: Create render.yaml

Already created below!

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Render auto-detects Python

### Step 3: Add Environment Variables

In Render dashboard:
- Add `OPENROUTER_API_KEY` with your key
- Set to "Secret"

---

## GitHub Pages Setup (Frontend Only)

### Step 1: Update script.js

Replace the API_URL with your backend URL:

```javascript
// In script.js, line ~8
const API_URL = 'https://your-backend.vercel.app';
// or
const API_URL = 'https://your-backend.up.railway.app';
// or
const API_URL = 'https://your-backend.onrender.com';
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add meal playground"
git push origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repo → Settings → Pages
2. Source: Deploy from branch
3. Branch: `main` → `/` (root)
4. Save

Your site will be at: `https://yourusername.github.io/BurnRate_Helper/meal-playground/`

---

## Testing the Setup

### Test Backend:

```bash
curl https://your-backend.vercel.app/api/models
```

Should return list of available models.

### Test Full Flow:

1. Open GitHub Pages site
2. Fill in profile and workout
3. Click "Generate Meal Plan"
4. Should call your backend (which uses your secure API key)
5. Meal plan appears!

---

## Security Checklist

✅ API key stored as environment variable on backend
✅ API key never in frontend code
✅ CORS configured to allow your GitHub Pages domain
✅ `.env` file in `.gitignore` (never committed)
✅ Backend URL uses HTTPS

---

## Cost Estimates

### Free Tiers:

- **Vercel**: 100 GB bandwidth/month, unlimited requests
- **Railway**: $5 free credit/month (usually enough)
- **Render**: 750 hours/month free

### OpenRouter Costs:

With backend in place, all requests go through your secure proxy:
- Gemini Flash: ~$0.001-0.003 per plan
- Your API key stays safe!

---

## Updating the App

### Update Backend:
```bash
# Vercel auto-deploys on git push
git push origin main

# Or manually:
vercel --prod
```

### Update Frontend:
```bash
# Just push to GitHub
git push origin main
# GitHub Pages updates automatically
```

---

## Troubleshooting

**CORS errors?**
- Check `Flask-CORS` is installed
- Verify your GitHub Pages URL is allowed

**Backend not responding?**
- Check environment variables are set
- View logs in Vercel/Railway/Render dashboard

**API key invalid?**
- Verify key starts with `sk-or-`
- Regenerate key on OpenRouter if needed

---

## Alternative: User-Provided Keys (Less Secure)

If you don't want to pay for hosting:

Users enter their own OpenRouter API key in the UI (stored in localStorage). This is less convenient but free for you.

See `script-github.js` for this implementation.

**Pros**: Free, no backend needed
**Cons**: Every user needs their own OpenRouter key

---

Choose **Option 1 (Vercel)** for the best balance of security, ease, and cost!

