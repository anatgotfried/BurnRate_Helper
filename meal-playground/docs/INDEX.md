# 📚 BurnRate Meal Planner - Documentation Index

> **Complete documentation hub** — Everything you need to use, deploy, test, and develop the BurnRate AI Meal Planner.

**Last Updated:** 2025-11-04 | **Version:** v1.6.5

---

## 🚀 Getting Started

**New to the project? Start here:**

1. **[START_HERE.md](user-guides/START_HERE.md)** - Project overview & first steps
2. **[QUICKSTART.md](user-guides/QUICKSTART.md)** - Get running in 5 minutes
3. **[TROUBLESHOOTING.md](user-guides/TROUBLESHOOTING.md)** - Common issues & fixes

---

## 👥 For Users

### Basic Usage
- **[START_HERE.md](user-guides/START_HERE.md)** - Introduction to the meal planner
- **[QUICKSTART.md](user-guides/QUICKSTART.md)** - Quick setup guide
- **[MODEL_GUIDE.md](user-guides/MODEL_GUIDE.md)** - Which AI model to choose
- **[TRANSPARENCY_FEATURES.md](user-guides/TRANSPARENCY_FEATURES.md)** - Understanding outputs

### Troubleshooting
- **[TROUBLESHOOTING.md](user-guides/TROUBLESHOOTING.md)** - Fixes for common errors

---

## 🔧 For Administrators

### Setup & Deployment
- **[ENV_SETUP.md](setup/ENV_SETUP.md)** - Environment variable configuration
- **[DEPLOYMENT.md](setup/DEPLOYMENT.md)** - Deploy to Vercel/Render
- **[ADD_GEMINI_MODELS.md](setup/ADD_GEMINI_MODELS.md)** - Adding new AI models

### Feedback System
- **[N8N_FEEDBACK_SETUP.md](setup/N8N_FEEDBACK_SETUP.md)** - Complete n8n setup guide
- **[N8N_QUICK_FIX.md](setup/N8N_QUICK_FIX.md)** - Fix body field extraction
- **[N8N_WEBHOOK_DEBUG.md](setup/N8N_WEBHOOK_DEBUG.md)** - Troubleshoot 404 errors
- **[PRODUCTION_WEBHOOK.md](setup/PRODUCTION_WEBHOOK.md)** - Production webhook config
- **[WEBHOOK_PAYLOAD_SPEC_LOCKED.md](setup/WEBHOOK_PAYLOAD_SPEC_LOCKED.md)** - 🔒 LOCKED payload structure
- **[GOOGLE_SHEETS_TEMPLATE.md](setup/GOOGLE_SHEETS_TEMPLATE.md)** - Google Sheets columns
- **[SETUP_FEEDBACK.md](setup/SETUP_FEEDBACK.md)** - Alternative feedback setup
- **[N8N_INTEGRATION_GUIDE.md](setup/N8N_INTEGRATION_GUIDE.md)** - Advanced n8n integration

### Workflow Files
- **[n8n-workflow-feedback.json](setup/n8n-workflow-feedback.json)** - n8n workflow template
- **[N8N_WORKFLOW_FIX.json](setup/N8N_WORKFLOW_FIX.json)** - Fixed workflow with extraction

---

## 💻 For Developers

### Development
- **[VERSION.md](development/VERSION.md)** - Complete version history & changelog
- **[VERSIONING.md](development/VERSIONING.md)** - Version numbering system
- **[CODE_REVIEW.md](development/CODE_REVIEW.md)** - Code quality & standards
- **[FOLDER_STRUCTURE.md](development/FOLDER_STRUCTURE.md)** - Project organization
- **[JSON_SIZE_ANALYSIS.md](development/JSON_SIZE_ANALYSIS.md)** - Expected JSON response sizes

### Architecture
```
Frontend (Vanilla JS)
    ↓ API calls
Flask Backend (Python)
    ↓ Proxies to
OpenRouter API (Multi-model)
    ↓ Feedback via
n8n Webhook
    ↓ Stores in
Google Sheets
```

### Key Files
- **`script.js`** - Main frontend logic (1400+ lines)
- **`macro-calculator.js`** - TDEE, BMR, macro calculations
- **`corpus-filter.js`** - Fast Mode token reduction
- **`cost-calculator.js`** - Real-time cost tracking
- **`app.py`** - Flask API backend
- **`data/research_corpus.json`** - Sports nutrition research
- **`data/test-athletes.json`** - 11 test profiles

---

## 🧪 For Testers

### Test Results
- **[MODEL_TEST_REPORT.md](test-results/MODEL_TEST_REPORT.md)** - Comprehensive AI model comparison
- **[FAST_MODE_COMPARISON.md](test-results/FAST_MODE_COMPARISON.md)** - Fast Mode ON vs OFF analysis
- **[TEST_RESULTS_TABLE.md](test-results/TEST_RESULTS_TABLE.md)** - Quick results table
- **[COMPARISON_REPORT.md](../testing/scores/COMPARISON_REPORT.md)** - GPT-4o scoring results

### Testing Files
- **`testing/test_models.py`** - Python test runner (all models)
- **`testing/test-all-models.js`** - JavaScript test runner
- **`testing/run-model-tests.html`** - Browser-based test UI
- **`testing/score_with_gpt4o.py`** - Automated scoring with GPT-4o
- **`testing/test1_structure.py`** - Structure-only test (no full meals)
- **`testing/test2_full.py`** - Full meal plan generation test
- **`testing/test3_fast_mode_comparison.py`** - Fast Mode comparison test

### Test Data
- **`testing/test2_full/`** - Full meal plan JSON responses (8 models)
- **`testing/test3_fast_on/`** - Fast Mode ON responses
- **`testing/test3_fast_off/`** - Fast Mode OFF responses
- **`testing/scores/`** - GPT-4o scoring results

---

## 📊 Research & Science

### Research Corpus
**`data/research_corpus.json`** contains key findings from:

- **Burke et al. (2011)** - Carbohydrate periodization
- **Jeukendrup (2011)** - Nutrition for endurance
- **Morton et al. (2018)** - Protein recommendations
- **ACSM (2016)** - Position stand on nutrition
- **ISSN (2017)** - Sports nutrition guidelines
- **McCubbin et al. (2025)** - Sodium & hydration

### Calculation Logic

**Macro Calculations** (`macro-calculator.js`):
1. **BMR** - Harris-Benedict equation (gender, weight, height, age)
2. **TDEE** - BMR × Activity Factor (based on training load)
3. **Calorie Target** - TDEE ± deficit/surplus
4. **Protein** - 1.6-2.2 g/kg (goal-dependent)
5. **Carbs** - 5-10 g/kg (training load-dependent)
6. **Fat** - 20-30% of calories
7. **Sodium** - Base + sweat loss (400mg/L)
8. **Hydration** - 30ml/kg + sweat rate

---

## 🔐 Critical Information

### 🔒 LOCKED Structures

**⚠️ DO NOT MODIFY WITHOUT APPROVAL:**

1. **[Webhook Payload Structure](setup/WEBHOOK_PAYLOAD_SPEC_LOCKED.md)** (42 fields)
   - Impacts: Frontend, n8n, Google Sheets
   - Requires approval + testing before changes

### 🚨 Known Limitations

1. **Max tokens:** 10,000 (some models may still truncate)
2. **Cost tracking:** Only available for OpenRouter models
3. **Israeli products:** Limited database (extensible)
4. **Research corpus:** Last updated 2025-01-01

---

## 📈 Model Performance Summary

| Model | Accuracy | Speed | Cost/1k | Use Case |
|-------|----------|-------|---------|----------|
| **GPT-4o** | 9.2/10 | Medium | $15.00 | Best quality |
| **Claude 3.5** | 9.1/10 | Medium | $15.00 | Complex calcs |
| **Gemini 2.5** | 8.7/10 | Fast | $1.50 | Production |
| **GPT-4o Mini** | 8.3/10 | Fast | $0.60 | Budget |
| **Mistral Small** | 7.9/10 | Fast | $2.00 | Balance |

**Full analysis:** [test-results/MODEL_TEST_REPORT.md](test-results/MODEL_TEST_REPORT.md)

---

## 🎯 Quick Reference

### Important URLs
- **Production:** https://callback.burnrate.fit/meal-playground/
- **Vercel:** https://burn-rate-helper.vercel.app
- **GitHub:** https://github.com/anatgotfried/BurnRate_Helper
- **n8n Webhook:** https://burnrate.app.n8n.cloud/webhook/burnrate-feedback

### Environment Variables
```bash
OPENROUTER_API_KEY=sk-or-v1-...              # Required
N8N_FEEDBACK_WEBHOOK=https://...             # Optional
```

### Version Info
- **Current Version:** v1.6.5
- **Payload Structure:** v1.6.4 (LOCKED)
- **Last Updated:** 2025-11-04

---

## 📞 Support

### Common Issues
1. **Truncated JSON** → Increase max_tokens (fixed in v1.6.2)
2. **Missing tokens/cost** → Fixed in v1.6.5
3. **Webhook 404** → Check n8n workflow is active
4. **Data in body column** → Add extraction node (see N8N_QUICK_FIX.md)

### Documentation Help
- Start with **[START_HERE.md](user-guides/START_HERE.md)**
- Check **[TROUBLESHOOTING.md](user-guides/TROUBLESHOOTING.md)**
- Review **[VERSION.md](development/VERSION.md)** for recent changes

---

## 🗂️ Documentation Structure

```
docs/
├── INDEX.md (you are here)
│
├── 👥 user-guides/
│   ├── START_HERE.md
│   ├── QUICKSTART.md
│   ├── MODEL_GUIDE.md
│   ├── TRANSPARENCY_FEATURES.md
│   └── TROUBLESHOOTING.md
│
├── 🔧 setup/
│   ├── ENV_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── N8N_FEEDBACK_SETUP.md
│   ├── N8N_QUICK_FIX.md
│   ├── N8N_WEBHOOK_DEBUG.md
│   ├── PRODUCTION_WEBHOOK.md
│   ├── WEBHOOK_PAYLOAD_SPEC_LOCKED.md 🔒
│   ├── GOOGLE_SHEETS_TEMPLATE.md
│   └── *.json (workflow templates)
│
├── 💻 development/
│   ├── VERSION.md
│   ├── VERSIONING.md
│   ├── CODE_REVIEW.md
│   ├── FOLDER_STRUCTURE.md
│   └── JSON_SIZE_ANALYSIS.md
│
└── 🧪 test-results/
    ├── MODEL_TEST_REPORT.md
    ├── FAST_MODE_COMPARISON.md
    └── TEST_RESULTS_TABLE.md
```

---

## ✅ Documentation Status

- [x] User guides complete
- [x] Setup documentation complete
- [x] Development docs complete
- [x] Test results documented
- [x] API references complete
- [x] Webhook payload spec locked
- [x] Troubleshooting guide complete

---

**Last updated:** 2025-11-04  
**Documentation version:** 1.0  
**Project version:** v1.6.5

**📖 For the latest updates, always check [VERSION.md](development/VERSION.md)**

