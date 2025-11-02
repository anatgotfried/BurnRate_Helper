# 🍽️ BurnRate AI Meal Planner

**Version:** 1.3.0  
**Live:** [callback.burnrate.fit/meal-playground](https://callback.burnrate.fit/meal-playground/)

AI-powered personalized sports nutrition meal planning with evidence-based recommendations.

---

## ✨ Features

- 🤖 **Multiple AI Models** - Choose from Gemini (FREE), Claude, GPT-4o, Mistral, Qwen
- 👁️ **Full Transparency** - View prompts, AI responses, and costs before/after generation
- 📊 **Deterministic Macro Calculations** - Evidence-based protein, carbs, fat, and hydration targets
- 🏃 **Workout-Aware Nutrition** - Meal timing optimized for training schedule
- 💰 **Cost Tracking** - See exact costs per generation and session totals
- 🇮🇱 **Israel Product Alternatives** - Specific local brands (Tnuva, Osem, Yotvata)
- 🔧 **Auto-Healing JSON** - Automatic error correction for reliable output

---

## 🚀 Quick Start

**5-Minute Setup:**

1. **Clone & Install:**
```bash
git clone https://github.com/anatgotfried/BurnRate_Helper.git
cd BurnRate_Helper/meal-playground
pip install -r requirements.txt
```

2. **Add API Key:**
```bash
# Create .env file
echo "OPENROUTER_API_KEY=your_key_here" > .env
```

3. **Run Locally:**
```bash
python app.py
# Visit: http://localhost:5001
```

📖 **Full setup guide:** See [QUICKSTART.md](./QUICKSTART.md)

---

## 📚 Documentation

### Essential Guides
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute getting started guide
- **[ENV_SETUP.md](./ENV_SETUP.md)** - Environment configuration
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy to Vercel

### Features & Usage
- **[TRANSPARENCY_FEATURES.md](./TRANSPARENCY_FEATURES.md)** - View prompts, responses, costs
- **[MODEL_GUIDE.md](./MODEL_GUIDE.md)** - Choose the right AI model
- **[ADD_GEMINI_MODELS.md](./ADD_GEMINI_MODELS.md)** - Free Gemini setup (BYOK)

### Help
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and fixes
- **[VERSION.md](./VERSION.md)** - Changelog and version history

---

## 🎯 How It Works

1. **Enter Profile:** Weight, height, gender, training phase, dietary preferences
2. **Add Workouts:** Type, duration, intensity, timing, environment
3. **Select Model:** Choose AI model (Gemini is FREE!)
4. **Generate:** Get personalized meal plan with exact portions
5. **Review:** See meals, macros, rationales, and Israel alternatives

### What You Get

```json
{
  "meals": [
    {
      "time": "07:00",
      "name": "High-Protein Breakfast",
      "foods": [
        {
          "item": "Greek yogurt, 200g",
          "protein_g": 20,
          "carbs_g": 12,
          "sodium_mg": 80,
          ...
        }
      ],
      "rationale": "3-5 sentences with research citations",
      "israel_alternatives": ["Tnuva Greek 5%, 200g", ...]
    }
  ],
  "daily_totals": { ... },
  "key_recommendations": [ ... ]
}
```

---

## 💰 Pricing

| Model | Cost/Plan | Success Rate | Best For |
|-------|-----------|--------------|----------|
| **Gemini 2.5 Flash** | FREE | 85% | Budget, testing |
| **Mistral Small** | $0.001 | 90% | Cost-effective |
| **GPT-4o Mini** | $0.015 | 95% | Balanced |
| **Claude 3.5 Sonnet** | $0.025 | 99% | Best quality |

💡 **Tip:** Use "Fast Mode" to reduce costs by ~70%!

---

## 🔧 Tech Stack

- **Backend:** Python Flask (API proxy for OpenRouter)
- **Frontend:** Vanilla JavaScript (no frameworks)
- **AI:** OpenRouter (multi-model API)
- **Deployment:** Vercel (backend + static files)
- **Research:** Evidence-based sports nutrition corpus

---

## 🌟 New in v1.3.0

- 👁️ **View Prompt** button - See prompt before sending
- **Prompt Sent** tab - Inspect exact prompt
- **AI Response** tab - Always see raw response
- **Model selection** - Now always uses your selected model
- **Version badge** - Click for changelog

See [VERSION.md](./VERSION.md) for full history.

---

## 📖 Example Usage

**Scenario:** 60kg athlete, 2-hour bike ride, build phase

**Input:**
- Profile: 60kg, 170cm, male, build phase, omnivore
- Workout: 120min bike ride, moderate, 9:00 AM, 25°C

**Output:**
- 8 meals (breakfast, pre-ride, intra, post-ride, lunch, snack, dinner)
- 2,800 kcal, 108g protein, 420g carbs, 85g fat
- Sodium: 4,500mg (adjusted for sweat loss)
- All meals with exact portions, timing, and rationales

---

## 🛠️ Development

**Local Development:**
```bash
# Backend
python app.py

# Frontend (just open in browser)
open index.html
```

**Environment Variables:**
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GOOGLE_API_KEY=optional-for-gemini-byok
```

**File Structure:**
```
meal-playground/
├── app.py                  # Flask backend
├── index.html              # Frontend UI
├── script.js               # Main logic
├── macro-calculator.js     # Deterministic calculations
├── cost-calculator.js      # Cost tracking
├── corpus-filter.js        # Fast mode filtering
├── data/
│   └── research_corpus.json
├── prompts/
│   ├── meal_planner_v2.txt
│   ├── daily_plan_prompt.txt
│   └── individual_meal_prompt.txt
└── [docs]
```

---

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

**Report issues:** Open a GitHub issue  
**Suggest features:** Create a pull request

---

## 📜 License

MIT License - Free to use and modify

---

## 🙏 Acknowledgments

- Research corpus based on ISSN, ACSM, IOC guidelines
- Powered by OpenRouter API
- Inspired by evidence-based sports nutrition

---

**Live Site:** https://callback.burnrate.fit/meal-playground/  
**GitHub:** https://github.com/anatgotfried/BurnRate_Helper  
**Version:** 1.3.0

**Questions?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue.
