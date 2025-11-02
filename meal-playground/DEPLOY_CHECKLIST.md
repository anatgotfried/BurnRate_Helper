# 🚀 Quick Deploy Checklist

Follow these steps to securely deploy your meal playground:

## ☑️ Step 1: Deploy Backend (Choose One)

### Option A: Vercel (Recommended - Easiest)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd meal-playground
vercel

# Add your API key as environment variable
vercel env add OPENROUTER_API_KEY
# Paste your key when prompted
# Select: Production

# Deploy to production
vercel --prod
```

Your backend URL: `https://your-project.vercel.app`

### Option B: Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Add environment variable: `OPENROUTER_API_KEY` = `sk-or-your-key`

Your backend URL: `https://your-project.up.railway.app`

### Option C: Render (Alternative)

1. Go to [render.com](https://render.com)
2. "New" → "Web Service" → Connect repo
3. Add secret environment variable: `OPENROUTER_API_KEY`

Your backend URL: `https://your-project.onrender.com`

---

## ☑️ Step 2: Update Frontend Config

Edit `script.js` line 11:

```javascript
const PRODUCTION_API = 'https://your-actual-backend-url.vercel.app';
```

Replace with YOUR backend URL from Step 1!

---

## ☑️ Step 3: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Add BurnRate Meal Playground"

# Push
git push origin main
```

---

## ☑️ Step 4: Enable GitHub Pages

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: `main`, folder: `/ (root)`
5. Save

Wait 2-3 minutes for deployment.

Your site: `https://yourusername.github.io/repo-name/meal-playground/`

---

## ☑️ Step 5: Test Everything

1. **Test Backend**:
   ```bash
   curl https://your-backend.vercel.app/api/models
   ```
   Should return JSON with model list.

2. **Test Frontend**:
   - Open your GitHub Pages URL
   - Fill in profile & add workout
   - Click "Generate Meal Plan"
   - Should work! ✨

---

## 🔧 Update Backend URL Later

If you need to change the backend URL:

1. Edit `script.js` line 11
2. Push to GitHub: `git push origin main`
3. Wait 1-2 minutes for GitHub Pages to update

---

## 🆘 Troubleshooting

**"Failed to fetch" error?**
- Check `PRODUCTION_API` in `script.js` matches your backend URL
- Make sure backend is deployed and running
- Check browser console for CORS errors

**Backend not responding?**
- Verify environment variable `OPENROUTER_API_KEY` is set on Vercel/Railway/Render
- Check backend logs in hosting dashboard

**CORS error?**
- Flask-CORS should handle this automatically
- If issues persist, add your GitHub Pages URL to CORS config in `app.py`

---

## 💡 Pro Tips

- **Free Tier Limits**: 
  - Vercel: 100GB bandwidth/month
  - Railway: $5 free credit/month
  - Render: 750 hours/month

- **Cold Starts**: 
  - Free tier backends "sleep" after inactivity
  - First request may take 10-30 seconds
  - Subsequent requests are fast

- **Monitoring**:
  - Check usage on hosting dashboard
  - Monitor OpenRouter costs at openrouter.ai

---

## ✅ Done!

Your meal playground is now:
- ✅ Securely deployed
- ✅ API key hidden on backend
- ✅ Accessible via GitHub Pages
- ✅ Ready for users!

🎉 **Share your link**: `https://yourusername.github.io/repo-name/meal-playground/`

