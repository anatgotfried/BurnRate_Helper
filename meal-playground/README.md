# 🍽️ BurnRate AI Meal Planner

**Version:** 1.4.0  
**Live:** [callback.burnrate.fit/meal-playground](https://callback.burnrate.fit/meal-playground/)  
**Status:** ✅ Production Ready - Fully Tested & Scored by GPT-4o

AI-powered personalized sports nutrition meal planning with comprehensive model testing.

---

## ⭐ **NEW in v1.4.0: GPT-4o Scored All Models!**

**Winner:** Gemini 2.5 Flash (9.0/10 score, FREE, 27.7s)  
**Most Accurate:** Qwen 2.5 72B (9.4/10 score, perfect macros)  
**Removed:** GPT-4o (7.0/10 score, expensive, weak macros)

See `testing/scores/COMPARISON_REPORT.md` for full GPT-4o analysis!

---

## 🚀 **Quick Start**

**Live App:** https://callback.burnrate.fit/meal-playground/

1. Fill in profile (70kg default)
2. Add workouts (1 run default)
3. Click "Generate Meal Plan"
4. Wait ~28 seconds
5. Get 8-meal plan with full macros!

---

## 📁 **Documentation Structure**

```
📚 docs/
  ├── user-guides/          ← Start here!
  │   ├── START_HERE.md     ← Read this first
  │   ├── QUICKSTART.md
  │   ├── TRANSPARENCY_FEATURES.md
  │   ├── TROUBLESHOOTING.md
  │   └── MODEL_GUIDE.md
  │
  ├── setup/                ← For installation
  │   ├── ENV_SETUP.md
  │   ├── DEPLOYMENT.md
  │   └── ADD_GEMINI_MODELS.md
  │
  ├── test-results/         ← Test data & reports
  │   ├── MODEL_TEST_REPORT.md
  │   ├── TEST_RESULTS_TABLE.md
  │   └── ...
  │
  └── development/          ← For developers
      ├── VERSION.md
      ├── CODE_REVIEW.md
      └── ...

🧪 testing/
  ├── test1_structure/      ← Structure-only test results (8 JSONs)
  ├── test2_full/           ← Full meal test results (8 JSONs)
  ├── scores/               ← GPT-4o scores & comparison
  │   ├── test2-scores.json
  │   └── COMPARISON_REPORT.md ← **READ THIS!**
  └── archive/              ← Previous test runs
```

---

## 🏆 **GPT-4o Scoring Results (Test 2 - Full Meals):**

| Rank | Model | Score | Strengths | Use For |
|------|-------|-------|-----------|---------|
| 🥇 | Qwen 2.5 72B | 9.4/10 | Perfect macros (10/10) | Accuracy-critical plans |
| 🥈 | **Gemini 2.5 Flash** | **9.0/10** | FREE, fast, excellent rationales | **Daily use** ⭐ |
| 🥈 | Gemini 2.0 Exp | 9.0/10 | FREE, very fast | Fast generation |
| 🥈 | GPT-4o Mini | 9.0/10 | Perfect macros (10/10) | Reliability |
| 🥈 | Mistral Small | 9.0/10 | Perfect macros (10/10), cheap | Budget scale |
| 🥉 | Gemini 2.0 Flash | 8.0/10 | FREE, stable | Backup option |
| 🥉 | Claude 3.5 Sonnet | 8.0/10 | Premium quality | When willing to pay |
| 7 | GPT-4o | 7.0/10 | Fast but weak macros | ❌ Not recommended |

---

## ✨ **Key Features**

- 🤖 **7 AI Models** (GPT-4o scored & verified)
- 👁️ **Full Transparency** - View prompts, responses, costs
- 📊 **Deterministic Macros** - Evidence-based calculations
- 🏃 **Workout-Aware** - Meal timing optimized for training
- 💰 **Cost Tracking** - Session totals & estimates
- 🇮🇱 **Israel Products** - Tnuva, Osem, Yotvata alternatives
- 🔧 **Auto-Healing JSON** - Automatic error correction

---

## 📖 **Documentation**

**Start Here:**
1. `docs/user-guides/START_HERE.md` - 30-second overview
2. `testing/scores/COMPARISON_REPORT.md` - GPT-4o scoring
3. `docs/user-guides/QUICKSTART.md` - 5-minute setup

**All Docs:** See `docs/` folder for organized guides

---

## 🧪 **Testing Methodology**

**Test 1:** Structure + Rationale only (lightweight)
- 8 models tested
- Results: `testing/test1_structure/`

**Test 2:** Full meal generation (complete)
- 8 models tested
- Results: `testing/test2_full/`

**Scoring:** GPT-4o evaluated all Test 2 results
- 7 criteria per model
- Overall score 1-10
- Results: `testing/scores/`

---

## 💰 **Pricing (Verified by Testing)**

| Model | Cost/Plan | GPT-4o Score | Best For |
|-------|-----------|--------------|----------|
| Gemini 2.5 Flash | FREE | 9.0/10 | Everything |
| Mistral Small | $0.001 | 9.0/10 | Budget scale |
| GPT-4o Mini | $0.015 | 9.0/10 | Reliability |
| Claude 3.5 | $0.025 | 8.0/10 | Premium |

---

## 🚀 **Tech Stack**

- **Backend:** Python Flask (OpenRouter API proxy)
- **Frontend:** Vanilla JavaScript
- **AI:** OpenRouter (multi-model)
- **Deployment:** Vercel
- **Testing:** Python + GPT-4o evaluation

---

## 📊 **Project Stats**

- **Lines of Code:** ~3,000
- **Documentation:** 20+ markdown files
- **Models Tested:** 9 (8 working, 1 removed)
- **GPT-4o Scored:** 8 models
- **Success Rate:** 100% (all working models)
- **Versions:** 14 (v1.0.0 → v1.4.0)

---

## 🔗 **Links**

- **Live App:** https://callback.burnrate.fit/meal-playground/
- **GitHub:** https://github.com/anatgotfried/BurnRate_Helper
- **Version:** v1.4.0

---

**Questions?** See `docs/user-guides/TROUBLESHOOTING.md` or open an issue.

