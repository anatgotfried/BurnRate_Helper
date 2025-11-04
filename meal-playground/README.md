# 🍽️ BurnRate AI Meal Planner

> **AI-powered meal planning for endurance athletes** — backed by sports nutrition research, tested across 9+ AI models, with real-time feedback tracking.

**Current Version:** v1.6.5  
**Status:** ✅ Production Ready  
**Live Demo:** [callback.burnrate.fit/meal-playground](https://callback.burnrate.fit/meal-playground/)

---

## 📋 Quick Links

- **[Start Here](docs/user-guides/START_HERE.md)** - New to the project? Begin here
- **[Quickstart Guide](docs/user-guides/QUICKSTART.md)** - Get running in 5 minutes
- **[Documentation Index](docs/INDEX.md)** - Complete documentation map
- **[Troubleshooting](docs/user-guides/TROUBLESHOOTING.md)** - Common issues & fixes

---

## 🎯 What is This?

BurnRate Meal Planner generates **scientifically-backed daily meal plans** for endurance athletes based on:

- **Athlete profile** (weight, height, age, gender, training phase, dietary preferences)
- **Workout schedule** (type, duration, intensity)
- **Training goals** (performance, fat loss, muscle gain)
- **Research corpus** (Burke2011, Jeukendrup2011, Morton2018, ISSN2017, ACSM2016)

### ✨ Key Features

- ✅ **9 AI models tested** (GPT-4o, Claude, Gemini, Mistral, Qwen)
- ✅ **Accurate macro calculations** (TDEE, BMR, activity factors)
- ✅ **Fast Mode** (token reduction via corpus filtering)
- ✅ **Feedback system** (n8n + Google Sheets integration)
- ✅ **Cost tracking** (real-time token & cost monitoring)
- ✅ **Israeli localization** (Tnuva, Osem, Strauss alternatives)
- ✅ **Test athlete library** (11 pre-configured profiles)

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+**
- **OpenRouter API key** ([get one here](https://openrouter.ai))
- **Vercel account** (for production deployment)

### Local Development

```bash
# 1. Clone the repo
cd meal-playground

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

# 4. Run the Flask backend
python app.py
# Backend runs on http://localhost:5001

# 5. Open the frontend
# Open index.html in your browser
# Or use a local server: python -m http.server 8000
```

### Production Deployment

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add OPENROUTER_API_KEY production
vercel env add N8N_FEEDBACK_WEBHOOK production

# Verify deployment
curl https://burn-rate-helper.vercel.app/api/health
```

📖 **Full deployment guide:** [docs/setup/DEPLOYMENT.md](docs/setup/DEPLOYMENT.md)

---

## 📁 Project Structure

```
meal-playground/
├── 🎨 FRONTEND
│   ├── index.html              # Main app interface
│   ├── script.js               # Core logic & API calls
│   ├── styles.css              # Main styles
│   ├── styles-info-modal.css   # Modal styles
│   ├── feedback-modal.html     # Feedback form component
│   ├── macro-calculator.js     # TDEE, BMR, macro calculations
│   ├── corpus-filter.js        # Fast Mode token reduction
│   ├── cost-calculator.js      # Token & cost tracking
│   └── two-phase-generator.js  # Experimental generation logic
│
├── 🐍 BACKEND
│   ├── app.py                  # Flask API server
│   ├── requirements.txt        # Python dependencies
│   ├── vercel.json            # Vercel deployment config
│   └── render.yaml            # Render deployment config
│
├── 📊 DATA
│   ├── data/
│   │   ├── research_corpus.json    # Sports nutrition research
│   │   └── test-athletes.json      # 11 test athlete profiles
│   └── prompts/
│       └── meal_planner_v2.txt     # Latest prompt template
│
├── 📚 DOCUMENTATION
│   ├── docs/INDEX.md               # Documentation hub
│   ├── docs/setup/                 # Setup guides
│   ├── docs/user-guides/           # User documentation
│   ├── docs/development/           # Developer docs
│   └── docs/test-results/          # AI model test results
│
├── 🧪 TESTING
│   └── testing/
│       ├── test_models.py          # Python test runner
│       ├── test-all-models.js      # JS test runner
│       ├── run-model-tests.html    # Browser test UI
│       ├── score_with_gpt4o.py     # GPT-4o scoring
│       ├── test2_full/             # Full meal plan tests
│       ├── test3_fast_comparison/  # Fast Mode comparison
│       └── scores/                 # Test results & scores
│
└── 🔧 UTILITIES
    ├── start.sh / start.bat        # Quick start scripts
    └── script-github.js            # GitHub integration (WIP)
```

---

## 🧪 Testing & Model Performance

We've comprehensively tested 9 AI models across multiple dimensions:

### Test Results Summary

| Model | Accuracy Score | Speed | Cost | Recommended Use |
|-------|---------------|-------|------|-----------------|
| **GPT-4o** | 9.2/10 | Medium | $$$$ | Best overall quality |
| **Claude 3.5 Sonnet** | 9.1/10 | Medium | $$$ | Complex calculations |
| **Gemini 2.5 Flash** | 8.7/10 | Fast | $ | Production default |
| **GPT-4o Mini** | 8.3/10 | Fast | $ | Budget option |
| **Mistral Small** | 7.9/10 | Fast | $$ | Good balance |

📊 **Full test results:** [docs/test-results/MODEL_TEST_REPORT.md](docs/test-results/MODEL_TEST_REPORT.md)

---

## 🔧 Configuration

### Environment Variables

**Required:**
- `OPENROUTER_API_KEY` - Your OpenRouter API key

**Optional (for feedback system):**
- `N8N_FEEDBACK_WEBHOOK` - n8n webhook URL for feedback collection

### Customization

- **Research corpus:** Edit `data/research_corpus.json`
- **Test athletes:** Edit `data/test-athletes.json`
- **Prompt template:** Edit `prompts/meal_planner_v2.txt`
- **Macro calculations:** Edit `macro-calculator.js`
- **Fast Mode logic:** Edit `corpus-filter.js`

---

## 📡 Feedback System

The app includes a production-ready feedback system that captures:

- Athlete profile & workout data
- AI model performance metrics
- Target vs. actual macros with diffs
- Token usage & cost
- User ratings & comments

**Setup guide:** [docs/setup/N8N_FEEDBACK_SETUP.md](docs/setup/N8N_FEEDBACK_SETUP.md)

**⚠️ Webhook payload structure is LOCKED** - see [docs/setup/WEBHOOK_PAYLOAD_SPEC_LOCKED.md](docs/setup/WEBHOOK_PAYLOAD_SPEC_LOCKED.md)

---

## 🎓 Research & Science

This planner is built on peer-reviewed sports nutrition research:

- **Burke et al. (2011)** - Carbohydrate periodization for endurance
- **Jeukendrup (2011)** - Nutrition for endurance sports
- **Morton et al. (2018)** - Protein intake for athletes
- **ACSM (2016)** - Nutrition and athletic performance
- **ISSN (2017)** - International Society of Sports Nutrition guidelines
- **McCubbin et al. (2025)** - Sodium and hydration strategies

📖 **Corpus details:** `data/research_corpus.json`

---

## 🛠️ Development

### Key Technologies

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Flask (Python)
- **AI:** OpenRouter API (multi-model proxy)
- **Deployment:** Vercel (serverless)
- **Feedback:** n8n + Google Sheets
- **Version Control:** Git/GitHub

### Code Quality

- ✅ No linter errors
- ✅ Modular architecture
- ✅ Comprehensive error handling
- ✅ Cost tracking & monitoring
- ✅ Production logging

### Contributing

1. Test locally before deploying
2. Update version numbers in `script.js` and `index.html`
3. Document changes in `docs/development/VERSION.md`
4. **DO NOT** change webhook payload structure without approval (see [WEBHOOK_PAYLOAD_SPEC_LOCKED.md](docs/setup/WEBHOOK_PAYLOAD_SPEC_LOCKED.md))

---

## 📝 Version History

**Latest: v1.6.5** (2025-11-04)
- ✅ Fixed token/cost capture for feedback system
- ✅ Increased max_tokens to 10k (prevent truncated JSON)
- ✅ Production webhook configured
- ✅ Flat payload structure (42 fields)

**See full changelog:** [docs/development/VERSION.md](docs/development/VERSION.md)

---

## 📞 Support & Documentation

- **Getting Started:** [docs/user-guides/START_HERE.md](docs/user-guides/START_HERE.md)
- **Troubleshooting:** [docs/user-guides/TROUBLESHOOTING.md](docs/user-guides/TROUBLESHOOTING.md)
- **Model Selection:** [docs/user-guides/MODEL_GUIDE.md](docs/user-guides/MODEL_GUIDE.md)
- **All Documentation:** [docs/INDEX.md](docs/INDEX.md)

---

## 🙏 Acknowledgments

Built with research from:
- Australian Institute of Sport (AIS)
- International Society of Sports Nutrition (ISSN)
- American College of Sports Medicine (ACSM)
- Leading sports nutrition researchers worldwide

---

## 📄 License

Proprietary - BurnRate © 2025

---

**Made with ❤️ for endurance athletes**
