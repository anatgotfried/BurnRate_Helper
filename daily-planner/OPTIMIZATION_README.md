# Prompt Optimization Script

This script iteratively improves the Daily Planner prompt by simulating the full website flow and evaluating responses.

## How It Works

1. **Simulates Website Flow**: Uses test persona (Sarah - fat loss runner) and calculates macros just like the website
2. **Generates Plan**: Sends prompt to Gemini 2.5 Flash and gets response
3. **Evaluates Response**: 
   - Technical validation (do macros add up?)
   - AI evaluation (does it make practical sense?)
   - Scores each dimension (1-10)
4. **Improves Prompt**: Uses AI to suggest prompt improvements
5. **Iterates**: Repeats 5 times, improving each iteration

## Usage

```bash
cd daily-planner
python3 optimize_prompt.py
```

## Requirements

- Python 3.7+
- Node.js (for macro calculations)
- OpenRouter API key in `.env` file

## Output

- `prompts/daily_planner_v1_iter1.txt` through `iter5.txt` - Improved prompts
- `optimization_results_YYYYMMDD_HHMMSS.json` - Full evaluation results

## Evaluation Dimensions

1. **Overall Quality** (1-10): How well does this plan meet the athlete's needs?
2. **Tip Quality** (1-10): Is the daily tip motivating, actionable, and natural?
3. **Macro Accuracy** (1-10): Do macros match targets? Are calories calculated correctly?
4. **Practical Sense** (1-10): Do meals/workouts make sense? Can you consume carbs during a swim?
5. **Timeline Logic** (1-10): Is the timeline chronologically sound?

## Test Persona

- **Name**: Sarah
- **Weight**: 65 kg
- **Height**: 165 cm
- **Age**: 32
- **Gender**: Female
- **Goal**: Fat loss
- **Phase**: Base
- **Workouts**: 60min run (morning), 45min swim (evening)

## Customization

Edit the script to change:
- Test persona (TEST_PERSONA)
- Workouts (TEST_WORKOUTS)
- Number of iterations (change `range(1, 6)` to `range(1, 11)` for 10 iterations)
- Model (change MODEL variable)

