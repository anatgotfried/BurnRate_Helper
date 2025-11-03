# 📁 Organized Folder Structure - v1.4.0

## New Organization:

```
meal-playground/
├── README.md                    # Main entry point
├── index.html, script.js, etc.  # Core app files
│
├── docs/
│   ├── user-guides/             # For users
│   │   ├── START_HERE.md
│   │   ├── QUICKSTART.md
│   │   ├── TRANSPARENCY_FEATURES.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── MODEL_GUIDE.md
│   │
│   ├── setup/                   # Setup & deployment
│   │   ├── ENV_SETUP.md
│   │   ├── DEPLOYMENT.md
│   │   └── ADD_GEMINI_MODELS.md
│   │
│   ├── development/             # For developers
│   │   ├── VERSION.md
│   │   ├── VERSIONING.md
│   │   ├── CODE_REVIEW.md
│   │   └── INDEX_OF_DOCS.md
│   │
│   └── test-results/            # Test data
│       ├── MODEL_TEST_REPORT.md
│       ├── TEST_RESULTS_TABLE.md
│       ├── DEPLOYMENT_SUMMARY.md
│       ├── FINAL_STATUS.md
│       └── WELCOME_BACK.md
│
└── testing/                     # Test execution & results
    ├── test1_structure/         # Test 1: Structure only
    │   ├── gemini-2.5-flash.json
    │   ├── claude-3.5-sonnet.json
    │   ├── mistral-small.json
    │   └── ... (8 models)
    │
    ├── test2_full/              # Test 2: Full meals
    │   ├── gemini-2.5-flash.json
    │   ├── claude-3.5-sonnet.json
    │   └── ... (8 models)
    │
    ├── scores/                  # GPT-4o scoring
    │   ├── test1-scores.json
    │   ├── test1-comparison.md
    │   ├── test2-scores.json
    │   └── test2-comparison.md
    │
    └── archive/                 # Old test results
        └── 2025-11-03-initial-test.json
```

Clean and logical!
