# BurnRate Meal Playground

An AI-powered meal planning tool for athletes that generates evidence-based, personalized nutrition plans optimized for training and performance goals.

## 🎯 Features

- **AI-Powered Generation**: Uses state-of-the-art language models (Gemini, Claude, GPT) to create personalized meal plans
- **Evidence-Based**: Built on comprehensive sports nutrition research (ISSN, ACSM, IOC guidelines)
- **Athlete-Centric**: Tailored for endurance, strength, youth, masters, and female athletes
- **Workout Integration**: Accounts for multiple training sessions, intensity, duration, and environmental conditions
- **Dietary Flexibility**: Supports omnivore, vegetarian, vegan, low-FODMAP, and gluten-free diets
- **Local-First**: All data stored in browser, no cloud storage
- **Beautiful UI**: Clean, professional interface matching BurnRate design system
- **Export Options**: Download or copy JSON meal plans

## 🚀 Quick Start

### Prerequisites

- Python 3.7 or higher
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Installation

1. **Clone or download this repository**

2. **Navigate to the meal-playground directory**
   ```bash
   cd meal-playground
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create .env file**
   
   Copy the template from `ENV_SETUP.md` and create a `.env` file:
   ```
   OPENROUTER_API_KEY=your_key_here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```
   
   Replace `your_key_here` with your actual OpenRouter API key.

5. **Run the Flask backend**
   ```bash
   python app.py
   ```

6. **Open in browser**
   
   Navigate to: `http://127.0.0.1:5001`

## 📖 How to Use

### 1. Configure Athlete Profile

Fill in the athlete profile form:
- **Physical Metrics**: Weight (kg), height (cm), gender
- **Training Context**: Training phase (base/build/race/recovery), goals
- **Dietary Preferences**: Pattern (omnivore/vegetarian/vegan/etc.), GI tolerance
- **Special Populations**: Masters (>35), female-specific, youth considerations

### 2. Add Workouts

Click "Add Workout" and configure each session:
- **Type**: Run, bike, swim, strength, HIIT, intervals, etc.
- **Duration**: Minutes
- **Intensity**: Low, moderate, high, very high
- **Start Time**: When the workout begins
- **Environment**: Temperature (°C) and humidity (%)

Add multiple workouts to plan for a full training day.

### 3. Select AI Model

Choose from cost-effective options:
- **Gemini 1.5 Flash** (Recommended): Very low cost, fast
- **Claude 3 Haiku**: Low cost, balanced
- **GPT-3.5 Turbo**: Low cost, reliable
- **Claude 3.5 Sonnet**: Medium cost, highest quality
- **GPT-4o Mini**: Medium cost, good balance

### 4. Generate Meal Plan

Click "Generate Meal Plan" and wait 30-60 seconds.

The AI will create a complete day's nutrition including:
- **Breakfast, lunch, dinner** with specific foods and portions
- **Pre-workout nutrition** timed appropriately before each session
- **Intra-workout fueling** for longer/intense workouts
- **Post-workout recovery** nutrition
- **Snacks** as needed for timing and energy
- **Macronutrient breakdown** for every meal
- **Israel-available alternatives** for all foods

### 5. Review & Export

View your meal plan in three formats:
- **Meal Cards**: Visual cards with foods, macros, rationale
- **Daily Summary**: Total calories, macros, hydration, recommendations
- **Raw JSON**: Complete data for external use

Export options:
- **Copy JSON**: Copy to clipboard
- **Download JSON**: Save as file

## 🧪 Research Foundation

The meal plans are based on comprehensive sports nutrition research:

### Evidence Sources

- **ISSN 2017**: International Society of Sports Nutrition Position Stand on Nutrient Timing
- **ACSM 2016**: Nutrition and Athletic Performance (Joint ACSM/AND/DC Position Stand)
- **IOC 2018**: Relative Energy Deficiency in Sport (RED-S) Update
- **Morton 2018**: Protein Supplementation Meta-Analysis
- **Moore 2021**: Protein Requirements for Master Athletes
- **Gejl 2021**: Periodized Carbohydrate Restriction Meta-Analysis
- **Lis 2018**: Low FODMAP Diet for Athletes with GI Issues
- **McCubbin 2025**: Sodium Intake for Athletes

### Key Principles

- **Carbohydrate periodization**: 5-10+ g/kg for endurance athletes
- **Protein distribution**: 1.6-2.2 g/kg/day spread across 3-4 meals
- **Hydration strategy**: Pre, intra, post-exercise fluid and sodium guidelines
- **Timing optimization**: Pre-workout (1-4h), intra-workout (30-90g carbs/hr), post-workout (0.3g protein + 1.2g carbs per kg)
- **Population-specific**: Tailored for youth, masters, female athletes
- **Evidence-based contraindications**: Caffeine for youth, fiber/fat pre-exercise, NSAID warnings

## 🔬 Technical Architecture

### Frontend
- **Pure HTML/CSS/JavaScript**: No frameworks, fast and simple
- **localStorage**: Session persistence
- **Responsive Design**: Works on desktop and mobile
- **BurnRate Design System**: Consistent with other BurnRate helpers

### Backend
- **Flask**: Lightweight Python web server
- **OpenRouter Proxy**: Single API for multiple AI models
- **Environment Variables**: Secure API key storage

### Data
- **Research Corpus**: 35KB JSON with sports nutrition guidelines
- **Prompt Template**: Evidence-based instruction set for AI
- **No Database**: Everything client-side

## 💰 Cost Estimates

Approximate costs per meal plan generation:

| Model | Cost per Plan | Quality | Speed |
|-------|--------------|---------|-------|
| Gemini 1.5 Flash | $0.001-0.003 | Good | Fast |
| Claude 3 Haiku | $0.003-0.008 | Very Good | Fast |
| GPT-3.5 Turbo | $0.003-0.008 | Good | Fast |
| Claude 3.5 Sonnet | $0.015-0.030 | Excellent | Medium |
| GPT-4o Mini | $0.010-0.020 | Very Good | Medium |

**Recommended**: Start with Gemini 1.5 Flash for testing, upgrade to Claude Sonnet for highest quality.

## 🎨 Customization

### Adding Custom Foods

Edit `data/research_corpus.json` to add:
- Region-specific foods
- Custom recipes
- Supplement recommendations

### Modifying Prompt Logic

Edit `prompts/meal_planner.txt` to:
- Adjust meal timing preferences
- Change default portion sizes
- Add specific instructions

### Adding Models

Edit `app.py` to add more OpenRouter models:
```python
{
    'id': 'provider/model-name',
    'name': 'Display Name',
    'provider': 'Provider',
    'cost': 'Cost Level',
    'description': 'Description'
}
```

## 🚧 Limitations

- **AI Variability**: Output quality depends on model and may vary
- **No Medical Advice**: This is for educational purposes, not medical guidance
- **Internet Required**: Needs connection for API calls
- **Cost**: API calls have small costs (see table above)
- **No Multi-Day Planning**: Currently generates single days only

## 🔐 Privacy & Security

- **Local Storage**: All athlete data stays in your browser
- **No User Accounts**: No registration or cloud sync
- **API Key Security**: Stored in `.env` file (never committed to git)
- **HTTPS**: Use HTTPS in production deployments

## 🌐 Deployment

### GitHub Pages (Static Frontend Only)

For a static version without backend:
1. Remove API calls, use client-side OpenRouter calls with user-provided API key
2. Deploy to GitHub Pages
3. Users enter their own OpenRouter key in UI

### Vercel/Heroku (Full Stack)

For production with backend:
1. Set `OPENROUTER_API_KEY` environment variable
2. Deploy Flask app to Vercel, Heroku, or similar
3. Update `API_URL` in `script.js`

## 📝 Development

### Project Structure
```
meal-playground/
├── app.py                    # Flask backend
├── index.html               # Main UI
├── styles.css               # BurnRate design system
├── script.js                # Frontend logic
├── data/
│   └── research_corpus.json # Sports nutrition research
├── prompts/
│   └── meal_planner.txt     # AI prompt template
├── requirements.txt         # Python dependencies
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

### Contributing

Improvements welcome:
1. Test changes thoroughly
2. Maintain design consistency
3. Update documentation
4. Consider evidence-based approach

## 🆘 Troubleshooting

**Issue: "OpenRouter API key not configured"**
- Ensure `.env` file exists with `OPENROUTER_API_KEY=your_key`
- Restart Flask server after creating `.env`

**Issue: "Failed to fetch"**
- Check Flask server is running on port 5001
- Verify firewall allows localhost:5001
- Check browser console for CORS errors

**Issue: "Invalid JSON response"**
- Try a different AI model
- Check prompt template hasn't been corrupted
- Verify research corpus is valid JSON

**Issue: Generation takes too long**
- Normal: 30-60 seconds is expected
- Use faster models (Gemini Flash, Claude Haiku)
- Check internet connection speed

**Issue: Poor quality output**
- Try Claude 3.5 Sonnet for highest quality
- Ensure all profile fields are filled accurately
- Add more specific workout details

## 📚 Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [ISSN Position Stands](https://jissn.biomedcentral.com/)
- [ACSM Guidelines](https://www.acsm.org/)
- [IOC Consensus Statements](https://www.olympic.org/medical-commission)

## 📄 License

This project is for personal use. Modify and distribute as needed.

## 🙏 Acknowledgments

- Built with Flask, OpenRouter, and modern web standards
- Research compiled from leading sports nutrition organizations
- Designed for the BurnRate Helper ecosystem

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Python**: 3.7+  
**Status**: Production Ready

Happy Training! 🏃‍♂️🚴‍♀️🏊‍♂️🍽️

