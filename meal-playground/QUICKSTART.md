# Quick Start Guide

Get the BurnRate Meal Playground running in 5 minutes!

## Step 1: Get an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

## Step 2: Set Up Environment

Create a `.env` file in the `meal-playground` directory:

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
FLASK_ENV=development
FLASK_DEBUG=True
```

## Step 3: Install Dependencies

**Mac/Linux:**
```bash
./start.sh
```

**Windows:**
```
start.bat
```

**Or manually:**
```bash
pip install -r requirements.txt
python app.py
```

## Step 4: Open in Browser

Navigate to: **http://127.0.0.1:5001**

## Step 5: Generate Your First Meal Plan

1. **Fill in your profile:**
   - Weight, height, gender
   - Training phase and goals
   - Dietary preferences

2. **Add a workout:**
   - Click "Add Workout"
   - Set type (run, bike, etc.), duration, intensity
   - Set start time and environment

3. **Select AI model:**
   - Gemini 1.5 Flash (recommended for first try - very cheap!)

4. **Click "Generate Meal Plan"**
   - Wait 30-60 seconds
   - View your personalized nutrition plan!

## Troubleshooting

**"OpenRouter API key not configured"**
- Make sure `.env` file exists in `meal-playground/` directory
- Restart the Flask server

**Port already in use**
- Another app is using port 5001
- Change port in `app.py` (line 209): `port=5002`

**Module not found errors**
- Run: `pip install -r requirements.txt`

## Cost Estimates

Your first few meal plans will cost less than $0.01 each using Gemini Flash!

- **Gemini 1.5 Flash**: ~$0.001-0.003 per plan ⭐ Best value
- **Claude 3 Haiku**: ~$0.003-0.008 per plan
- **GPT-3.5 Turbo**: ~$0.003-0.008 per plan

A $5 credit will generate 1,000+ meal plans with Gemini Flash!

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the [research corpus](data/research_corpus.json) for nutrition science
- Customize the [prompt template](prompts/meal_planner.txt) for your needs

Happy meal planning! 🍽️

