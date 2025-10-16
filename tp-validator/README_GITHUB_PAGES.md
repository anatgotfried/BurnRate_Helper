# Training Peaks Workout Tracker - GitHub Pages Version 🚀

A fully static, client-side version of the Training Peaks Workout Tracker that runs on GitHub Pages without requiring a backend server.

## ✨ What's New in This Version

This is a **browser-only** version that:
- ✅ Runs entirely in your browser (no Python/Flask required)
- ✅ Deploys instantly to GitHub Pages (free hosting)
- ✅ Stores data in browser localStorage
- ✅ Uses ical.js for client-side iCal parsing
- ✅ Includes CORS proxy for Training Peaks data
- ✅ Supports manual Strava token authentication

## 🎯 Quick Start

### For Users

1. **Visit the deployed app**: https://callback.burnrate.fit/tp-validator/
2. **Enter your Training Peaks iCal URL**
3. **Click Sync** - your workouts load instantly!

### For Developers

1. **Deploy to your GitHub Pages**:
   ```bash
   # Push index.html to your repo
   git add index.html
   git commit -m "Add GitHub Pages version"
   git push
   
   # Enable GitHub Pages in repo settings
   # Settings → Pages → Source: main branch, folder: / (root)
   ```

2. **Access at**: `https://yourusername.github.io/repository-name/`

## 📋 Features

Everything from the original version, plus:
- 🌐 No server required
- 💾 localStorage persistence
- 🔄 Automatic change detection
- 📊 Full history tracking
- 🏃 Strava integration (manual token)
- 🌍 Timezone support
- 📱 Mobile responsive

## 🔑 Getting Your API Keys

### Training Peaks iCal URL

1. Log into [TrainingPeaks.com](https://www.trainingpeaks.com)
2. Go to your Calendar
3. Find Calendar Settings → Export
4. Copy the iCal URL (looks like `webcal://www.trainingpeaks.com/ical/YOUR_ID.ics`)

### Strava Access Token (Optional)

**Easiest Method**:
1. Go to https://www.strava.com/settings/api
2. Create an application
3. Copy "Your Access Token"
4. Paste into the app

**Need more details?** See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md)

## 📖 Documentation

- **[GitHub Pages Setup Guide](GITHUB_PAGES_SETUP.md)** - Complete deployment and usage instructions
- **[Original README](README.md)** - Background and Flask version info
- **[User Guide](USER_GUIDE.md)** - Detailed usage instructions

## 🆚 Which Version Should I Use?

### Use GitHub Pages Version (index.html) If:
- ✅ You want the simplest setup
- ✅ You need free hosting
- ✅ You're okay with manual Strava token
- ✅ You want automatic deployment
- ✅ You prefer browser-based storage

### Use Flask Version (app.py) If:
- ✅ You want full Strava OAuth
- ✅ You prefer file-based storage
- ✅ You need faster performance
- ✅ You want to avoid CORS issues
- ✅ You're running locally anyway

## 🔧 Technical Details

### Architecture
```
┌─────────────────────────────────────────┐
│         Browser (index.html)            │
│  ┌─────────────────────────────────┐   │
│  │  UI Layer (HTML/CSS)            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  JavaScript Logic               │   │
│  │  - iCal parsing (ical.js)       │   │
│  │  - Change detection             │   │
│  │  - Data management              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  localStorage                   │   │
│  │  - Workouts                     │   │
│  │  - Change log                   │   │
│  │  - Preferences                  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
          ↓              ↓
    [CORS Proxy]    [Strava API]
          ↓
  [Training Peaks]
```

### Dependencies
- **ical.js** (v1.5.0) - iCalendar parsing
- **allOrigins** - CORS proxy (free service)
- **Browser APIs** - fetch, localStorage, Date/Time

### Data Storage
```javascript
localStorage:
  - workouts: JSON string of all workouts
  - changeLog: JSON string of change history
  - lastUpdated: ISO timestamp
  - tpUrl: Training Peaks URL
  - stravaToken: Strava access token
  - tpEnabled: boolean
  - stravaEnabled: boolean
  - timezone: selected timezone
```

## 🔒 Privacy & Security

### Your Data
- ✅ Stored **only in your browser**
- ✅ Never sent to any third-party (except TP/Strava)
- ✅ No analytics or tracking
- ✅ No server-side storage
- ✅ No cookies

### CORS Proxy Note
- Uses public proxy (allOrigins) for Training Peaks
- Your iCal URL passes through this service
- Training Peaks URLs are public by design
- You can self-host a proxy if preferred

## 🎨 Customization

### Change CORS Proxy
Edit line ~830 in `index.html`:
```javascript
const CORS_PROXY = 'https://your-proxy.com/?url=';
```

### Modify Strava Date Range
Edit line ~1014 in `index.html`:
```javascript
// Fetch last 10 days
const tenDaysAgo = Math.floor(Date.now() / 1000) - (10 * 24 * 60 * 60);
```

### Adjust History Retention
Edit line ~958 in `index.html`:
```javascript
// Keep only last 50 change logs
if (changeLog.length > 50) {
    changeLog = changeLog.slice(0, 50);
}
```

## 🐛 Common Issues

### CORS Errors
- **Cause**: CORS proxy might be down
- **Fix**: Try refreshing, or change proxy URL

### Strava 401 Error
- **Cause**: Invalid or expired token
- **Fix**: Generate new token from Strava settings

### Data Not Persisting
- **Cause**: Browser storage disabled
- **Fix**: Enable localStorage, avoid private mode

### Slow Loading
- **Cause**: CORS proxy or large iCal file
- **Fix**: Normal on first load, subsequent loads are cached

## 📊 Comparison Matrix

| Feature | GitHub Pages | Flask Local |
|---------|-------------|-------------|
| **Setup** | ⭐⭐⭐⭐⭐ Instant | ⭐⭐⭐ Medium |
| **Hosting** | ✅ Free (GitHub) | ❌ Self-host |
| **Performance** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Strava Auth** | ⚠️ Manual token | ✅ Full OAuth |
| **Data Storage** | localStorage | JSON files |
| **Updates** | ✅ Auto-deploy | ⚠️ Manual restart |
| **Offline** | ✅ After first load | ✅ Always |
| **Mobile** | ✅ Works great | ⚠️ Requires server |
| **Security** | ✅ Client-only | ✅ Local-only |

## 🚀 Deployment Checklist

- [ ] Copy `index.html` to your repo root
- [ ] Push to GitHub
- [ ] Enable GitHub Pages in settings
- [ ] Visit your deployed URL
- [ ] Enter Training Peaks URL
- [ ] (Optional) Add Strava token
- [ ] Click Sync
- [ ] ✅ Done!

## 💡 Pro Tips

1. **Bookmark the app** - Add to home screen on mobile
2. **Sync daily** - Catch all changes as they happen
3. **Use both sources** - TP for planning, Strava for actuals
4. **Check history** - Review training evolution over time
5. **Select your timezone** - See workouts in local time

## 🌟 Live Demo

**Try it now**: https://callback.burnrate.fit/tp-validator/

## 📞 Support

Having issues? Check these resources:
1. [Setup Guide](GITHUB_PAGES_SETUP.md) - Complete instructions
2. Browser Console (F12) - See error details
3. [Strava API Docs](https://developers.strava.com/docs/)
4. [Training Peaks Support](https://help.trainingpeaks.com/)

## 🤝 Contributing

Found a bug? Have an idea?
1. Open an issue
2. Submit a pull request
3. Share your feedback

## 📄 License

Personal use. Modify and distribute freely.

---

**Built with** ❤️ **for athletes who track everything**

Training Peaks API | Strava API | iCal.js | GitHub Pages

