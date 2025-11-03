# GitHub Pages Deployment Guide

This guide explains how to deploy and use the Training Peaks Workout Tracker on GitHub Pages.

## 🚀 Quick Setup

### 1. Deploy to GitHub Pages

The `index.html` file in the root directory is ready for GitHub Pages deployment:

1. **Push your code to GitHub** (if not already done)
2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set Source to your main branch
   - Set folder to `/` (root)
   - Save

3. **Access your app**:
   - Your app will be available at: `https://yourusername.github.io/repository-name/`
   - Or with custom domain: `https://callback.burnrate.fit/tp-validator/`

### 2. First Time Use

1. **Open the deployed URL** in your browser
2. **Enter your Training Peaks iCal URL**:
   - Log into TrainingPeaks.com
   - Go to your Calendar
   - Find Calendar Settings or Export options
   - Copy the iCal/ICS subscription URL
   - It will look like: `webcal://www.trainingpeaks.com/ical/YOUR_UNIQUE_ID.ics`
   
3. **Click "Sync"** to load your workouts

## 🔧 Key Differences from Local Version

This GitHub Pages version is fully **client-side** (no backend server):

### ✅ What Works
- ✅ Training Peaks iCal sync
- ✅ Strava integration (with manual token)
- ✅ Change detection and history
- ✅ All visualizations and UI features
- ✅ Data persistence (localStorage)
- ✅ Timezone support

### ⚠️ Important Changes

#### 1. **CORS Proxy for Training Peaks**
- Uses `allorigins.win` to fetch iCal data (free proxy)
- If this proxy is slow/down, you can change it in the code:
  ```javascript
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  ```
- Alternative proxies:
  - `https://corsproxy.io/?`
  - `https://api.codetabs.com/v1/proxy?quest=`

#### 2. **Strava Authentication**
Instead of OAuth flow, you need to manually get an access token:

**Option A: Use Strava's Token Generator (Easiest)**
1. Go to https://www.strava.com/settings/api
2. Create an application (if you haven't)
3. Scroll to "Your Access Token"
4. Copy and paste into the app

**Option B: Generate Your Own Token**
1. Create a Strava API application at https://www.strava.com/settings/api
2. Get your Client ID and Client Secret
3. Visit this URL (replace YOUR_CLIENT_ID):
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=activity:read
   ```
4. Authorize and copy the `code` parameter from the redirect URL
5. Exchange code for token with:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET \
     -d code=AUTHORIZATION_CODE \
     -d grant_type=authorization_code
   ```
6. Use the `access_token` from the response

**Security Note**: Access tokens are stored in localStorage (client-side only). Only use on devices you trust.

#### 3. **Data Storage**
- All data stored in browser localStorage (not JSON files)
- Data persists between sessions
- To clear data: Open browser DevTools → Application → Local Storage → Clear

#### 4. **No Server-Side Processing**
- All iCal parsing done in browser using ical.js
- All change detection done client-side
- First sync might be slower than server version

## 🎯 Using the App

### Syncing Data

1. **Training Peaks Only**:
   - Check "Training Peaks" checkbox
   - Enter your iCal URL
   - Click "Sync"

2. **Strava Only**:
   - Uncheck "Training Peaks"
   - Check "Strava"
   - Enter your access token
   - Click "Sync"

3. **Both Sources** (Recommended):
   - Enable both checkboxes
   - Enter both URLs/tokens
   - Strava workouts override Training Peaks for completed activities
   - Training Peaks shows planned workouts

### Settings Persistence

Your settings are automatically saved:
- ✅ Training Peaks URL
- ✅ Strava token
- ✅ Enabled sources
- ✅ Timezone preference
- ✅ All workout data and history

### Timezone Selection

Select your preferred timezone from the dropdown:
- Tel Aviv (Asia/Jerusalem)
- New York (America/New_York)
- Los Angeles (America/Los_Angeles)
- London (Europe/London)
- UTC

## 🔒 Privacy & Security

### Data Storage
- All data stored **locally in your browser**
- Nothing sent to any server (except Training Peaks/Strava APIs)
- No analytics or tracking
- No cookies

### Access Tokens
- Strava tokens stored in localStorage
- Only visible to you (not shared with anyone)
- Can be cleared anytime from browser settings

### CORS Proxy
- The app uses a public CORS proxy (allorigins.win)
- Your iCal URL passes through this proxy
- Training Peaks iCal URLs are public by design
- If concerned, you can:
  - Host your own CORS proxy
  - Use a different public proxy
  - Run the Flask version locally instead

## 🐛 Troubleshooting

### "Failed to fetch Training Peaks data"
- **Check your iCal URL** - make sure it's correct
- **CORS proxy might be down** - try refreshing after a minute
- **Try alternative proxy** - edit the `CORS_PROXY` constant in the code

### "Invalid Strava access token"
- Token might have expired (tokens expire after 6 hours)
- Generate a new token using the steps above
- Ensure you granted `activity:read` scope

### "No workouts fetched"
- Verify at least one data source is enabled
- Check that URLs/tokens are correct
- Open browser DevTools Console (F12) to see error details

### Data Not Persisting
- Check browser localStorage isn't disabled
- Private/Incognito mode may not persist data
- Browser storage might be full (rare)

### Slow Performance
- First sync is slower (parsing iCal in browser)
- CORS proxy might be slow
- Consider using Strava only (faster API)

## 📱 Mobile Support

The app works on mobile browsers:
- ✅ Fully responsive design
- ✅ Touch-friendly interface
- ✅ Works offline (once data loaded)
- ⚠️ localStorage limits apply (~5-10MB)

## 🔄 Updating the App

When you push updates to GitHub:
1. Changes go live automatically
2. Users might need to hard refresh (Ctrl+F5)
3. localStorage data persists across updates

## 🆚 Local vs GitHub Pages

| Feature | Local (Flask) | GitHub Pages (Static) |
|---------|--------------|----------------------|
| Server Required | ✅ Yes (Python/Flask) | ❌ No |
| Data Storage | JSON files | localStorage |
| Strava OAuth | ✅ Full OAuth flow | ⚠️ Manual token |
| CORS Issues | ❌ None | ⚠️ Needs proxy |
| Performance | ⚡ Fast | 🐢 Slightly slower |
| Setup | Complex | Simple |
| Hosting | Self-hosted | Free (GitHub) |
| Updates | Manual restart | Auto-deploy |

## 🎓 Advanced Configuration

### Custom CORS Proxy

Edit line ~830 in `index.html`:

```javascript
const CORS_PROXY = 'https://your-proxy.com/?url=';
```

### Modify Data Retention

Edit line ~958 in `index.html`:

```javascript
// Keep only last 50 change logs
if (changeLog.length > 50) {
    changeLog = changeLog.slice(0, 50);
}
```

### Strava Date Range

Edit line ~1014 in `index.html`:

```javascript
// Fetch last 10 days of activities
const tenDaysAgo = Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60);
```

Change `10` to more days (be mindful of Strava rate limits).

## 📞 Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify URLs and tokens are correct
3. Try clearing localStorage and re-syncing
4. Test with only one data source first

## 🌟 Tips for Best Experience

1. **Sync regularly** - Daily sync to catch all changes
2. **Use both sources** - TP for planning, Strava for actuals
3. **Bookmark the app** - Add to home screen on mobile
4. **Enable both sources** - Get complete picture of training
5. **Check history** - Review trends over time

---

**Ready to deploy?** Just push to GitHub and enable Pages! 🚀


