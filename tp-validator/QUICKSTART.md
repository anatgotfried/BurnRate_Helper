# Quick Start Guide

Get up and running with Training Peaks Workout Tracker in 3 minutes!

## Prerequisites

- **Python 3.7+** installed ([Download here](https://www.python.org/downloads/))
- **Internet connection** to fetch workout data
- **Training Peaks iCal URL** (instructions below)

## Installation & First Run

### macOS / Linux

1. **Open Terminal** and navigate to this directory:
   ```bash
   cd /path/to/TP_Validator
   ```

2. **Run the start script:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **Open browser** to `http://127.0.0.1:5000`

### Windows

1. **Open Command Prompt** and navigate to this directory:
   ```cmd
   cd C:\path\to\TP_Validator
   ```

2. **Run the start script:**
   ```cmd
   start.bat
   ```

3. **Open browser** to `http://127.0.0.1:5000`

### Manual Start (All Platforms)

If the scripts don't work:

```bash
# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

Then open `http://127.0.0.1:5000` in your browser.

## Getting Your iCal URL

1. Log into **[TrainingPeaks.com](https://www.trainingpeaks.com)**
2. Go to your **Calendar**
3. Click **Settings** (gear icon)
4. Look for **Calendar Export** or **Subscribe**
5. Copy the **iCal/ICS URL**
   - Format: `webcal://www.trainingpeaks.com/ical/XXXXXX.ics`

## First Refresh

1. In the app, paste your iCal URL in the input field (or use the default)
2. Click **"Refresh Workouts"**
3. Wait 3-5 seconds while data loads
4. View your workouts!

## What You'll See

- **All Workouts**: Every workout from your Training Peaks calendar
- **Recent Changes**: What changed since last refresh (empty on first run)
- **Change History**: Timeline of all changes (builds up over time)

## Daily Usage

1. **Open the app** (`./start.sh` or `start.bat`)
2. **Click "Refresh Workouts"**
3. **Review changes** in the right panel
4. **Check today's workout** details

## Tips

- Refresh **once per day** (morning is best)
- Check for changes **before key workouts**
- Review **change history weekly** for patterns
- **Backup** `data/workouts.json` regularly

## Troubleshooting

### "Connection Error"
- Check internet connection
- Verify iCal URL is correct
- Try again in a few minutes

### "Port 5000 already in use"
- Stop other applications using port 5000
- Or edit `app.py` to use a different port

### "Module not found"
- Run: `pip install -r requirements.txt`
- Make sure you're in the correct directory

## Next Steps

- Read **[USER_GUIDE.md](USER_GUIDE.md)** for detailed usage instructions
- Read **[README.md](README.md)** for full documentation
- Set up daily reminders to check for changes
- Explore the change history features

## Need Help?

Common questions are answered in:
- **README.md** - Full documentation
- **USER_GUIDE.md** - Comprehensive user guide

---

**That's it!** You're ready to track your Training Peaks workouts. 🚀

Happy training! 🏃‍♂️🚴‍♀️🏊‍♂️

