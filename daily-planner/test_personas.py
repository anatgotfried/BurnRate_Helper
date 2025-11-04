#!/usr/bin/env python3
"""
Test Iteration 3 Prompt Across Multiple Personas
Tests the best-performing prompt from optimization on all test athletes.
"""

import os
import json
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Any
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
MODEL = 'google/gemini-2.5-flash'

# Prompt to test (iteration 3)
PROMPT_FILE = 'prompts/daily_planner_v1_iter3.txt'

def load_prompt_template() -> str:
    """Load the iteration 3 prompt"""
    with open(PROMPT_FILE, 'r') as f:
        return f.read()

def load_research_corpus() -> str:
    """Load research corpus"""
    with open('data/research_corpus.json', 'r') as f:
        corpus = json.load(f)
        return json.dumps(corpus, indent=2)

def load_test_athletes() -> List[Dict]:
    """Load test athletes from JSON"""
    with open('data/test-athletes.json', 'r') as f:
        data = json.load(f)
        return data['athletes']

def convert_workout_format(workout: Dict) -> Dict:
    """Convert test athlete workout format to script format"""
    return {
        'type': workout.get('type', 'run'),
        'duration_min': workout.get('duration', 60),
        'intensity': workout.get('intensity', 'moderate'),
        'time': workout.get('startTime', '09:00'),
        'temp_c': workout.get('temperature', 20),
        'humidity_percent': workout.get('humidity', 60)
    }

def calculate_macros_via_node(athlete: Dict, workouts: List[Dict]) -> Dict:
    """Calculate macros using Node.js macro-calculator.js"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read the macro calculator
    with open(os.path.join(script_dir, 'macro-calculator.js'), 'r') as f:
        macro_code = f.read()
    
    # Remove window assignment and make it Node.js compatible
    node_code = macro_code.replace('window.calculateDailyTargets = calculateDailyTargets;', '')
    
    wrapper = f"""
    // Import the macro calculator code
    {node_code}
    
    // Export for Node.js
    if (typeof module !== 'undefined' && module.exports) {{
        module.exports = {{ calculateDailyTargets }};
    }}
    
    // Run calculation
    const athlete = {json.dumps(athlete)};
    const workouts = {json.dumps(workouts)};
    const result = calculateDailyTargets(athlete, workouts);
    console.log(JSON.stringify(result));
    """
    
    temp_file = '/tmp/calc_macros.js'
    with open(temp_file, 'w') as f:
        f.write(wrapper)
    
    try:
        result = subprocess.run(
            ['node', temp_file],
            cwd=script_dir,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout.strip())
        else:
            print(f"⚠️  Node.js calculation failed: {result.stderr}")
            return calculate_macros_fallback(athlete, workouts)
    except Exception as e:
        print(f"⚠️  Error running node: {e}")
        return calculate_macros_fallback(athlete, workouts)

def calculate_macros_fallback(athlete: Dict, workouts: List[Dict]) -> Dict:
    """Fallback macro calculation"""
    weight = athlete['weight_kg']
    goal = athlete.get('goal', 'performance')
    
    protein_g = weight * 2.0 if goal == 'fat_loss' else weight * 1.8
    carbs_g = weight * 6.0
    fat_g = weight * 0.8
    
    bmr = 655 + (9.6 * weight) + (1.8 * athlete['height_cm']) - (4.7 * athlete.get('age', 30))
    tdee = bmr * 1.6
    
    if goal == 'fat_loss':
        target_calories = int(tdee * 0.8)
    else:
        target_calories = int(tdee)
    
    return {
        'daily_energy_target_kcal': target_calories,
        'daily_protein_target_g': int(protein_g),
        'daily_carb_target_g': int(carbs_g),
        'daily_fat_target_g': int(fat_g),
        'sodium_target_mg': 4000,
        'hydration_target_l': 3.0,
        'calculated_targets': {
            'daily_energy_target_kcal': target_calories,
            'daily_protein_target_g': int(protein_g),
            'daily_carb_target_g': int(carbs_g),
            'daily_fat_target_g': int(fat_g),
            'sodium_target_mg': 4000,
            'hydration_target_l': 3.0
        }
    }

def build_context(athlete: Dict, workouts: List[Dict], calculated_targets: Dict) -> str:
    """Build the context string"""
    workouts_str = json.dumps(workouts, indent=2)
    
    context = f"""
## ATHLETE PROFILE
- Weight: {athlete['weight_kg']} kg
- Height: {athlete['height_cm']} cm
- Age: {athlete.get('age', 30)} years
- Gender: {athlete['gender']}
- Goal: {athlete.get('goal', 'performance')}
- Training Phase: {athlete.get('training_phase', 'base')}
- Activity Level: {athlete.get('activity_level', 'high')}

## CALCULATED TARGETS
{json.dumps(calculated_targets, indent=2)}

## TODAY'S WORKOUTS
{workouts_str}

## TRAINING PHASE
{athlete.get('training_phase', 'base')}

## GOAL
{athlete.get('goal', 'performance')}
"""
    return context.strip()

def build_prompt(research_corpus: str, context: str, prompt_template: str) -> str:
    """Build the full prompt"""
    prompt = prompt_template.replace('{RESEARCH_CORPUS}', research_corpus)
    prompt = prompt.replace('{CONTEXT}', context)
    
    # Extract phase and goal from context
    phase = 'base'
    goal = 'performance'
    if 'Training Phase:' in context:
        phase_line = [l for l in context.split('\n') if 'Training Phase:' in l][0]
        phase = phase_line.split(':')[1].strip()
    if 'Goal:' in context:
        goal_line = [l for l in context.split('\n') if 'Goal:' in l][0]
        goal = goal_line.split(':')[1].strip()
    
    prompt = prompt.replace('{PHASE}', phase)
    prompt = prompt.replace('{GOAL}', goal)
    return prompt

def call_openrouter(prompt: str, model: str = MODEL) -> Dict:
    """Call OpenRouter API"""
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/anatgotfried/BurnRate_Helper',
        'X-Title': 'BurnRate Daily Planner'
    }
    
    payload = {
        'model': model,
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'max_tokens': 3000,
        'temperature': 0.7
    }
    
    response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    return {
        'text': result['choices'][0]['message']['content'],
        'usage': result.get('usage', {})
    }

def parse_response(response_text: str) -> Dict:
    """Parse AI response and extract JSON"""
    try:
        text = response_text.strip()
        
        if '```json' in text:
            start = text.find('```json') + 7
            end = text.find('```', start)
            if end != -1:
                text = text[start:end].strip()
        elif text.startswith('```'):
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                text = text[start:end]
        
        if '{' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                text = text[start:end]
        
        return json.loads(text)
    except json.JSONDecodeError as e:
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return None

def validate_technical(response_data: Dict, targets: Dict) -> Dict:
    """Validate technical correctness"""
    issues = []
    score = 10
    
    if not response_data:
        return {'overall': 0, 'issues': ['No response data']}
    
    required = ['daily_summary', 'timeline', 'daily_tip']
    for field in required:
        if field not in response_data:
            issues.append(f"Missing required field: {field}")
            score -= 3
    
    if 'daily_summary' in response_data and 'timeline' in response_data:
        summary = response_data['daily_summary']
        timeline = response_data['timeline']
        
        totals = {
            'calories': sum(e.get('calories', 0) for e in timeline),
            'carbs_g': sum(e.get('carbs_g', 0) for e in timeline),
            'protein_g': sum(e.get('protein_g', 0) for e in timeline),
            'fat_g': sum(e.get('fat_g', 0) for e in timeline),
            'sodium_mg': sum(e.get('sodium_mg', 0) for e in timeline),
            'hydration_ml': sum(e.get('hydration_ml', 0) for e in timeline)
        }
        
        calculated_calories = (totals['carbs_g'] * 4) + (totals['protein_g'] * 4) + (totals['fat_g'] * 9)
        if abs(totals['calories'] - calculated_calories) > calculated_calories * 0.01:
            issues.append(f"Calories don't match macros: {totals['calories']} vs {calculated_calories}")
            score -= 2
        
        if abs(summary.get('calories', 0) - totals['calories']) > totals['calories'] * 0.02:
            issues.append(f"Summary calories don't match timeline: {summary.get('calories')} vs {totals['calories']}")
            score -= 1
        
        if abs(summary.get('carbs_g', 0) - totals['carbs_g']) > totals['carbs_g'] * 0.02:
            issues.append(f"Summary carbs don't match timeline: {summary.get('carbs_g')} vs {totals['carbs_g']}")
            score -= 1
        
        hydration_l = totals['hydration_ml'] / 1000
        if abs(summary.get('hydration_l', 0) - hydration_l) > 0.2:
            issues.append(f"Summary hydration doesn't match timeline: {summary.get('hydration_l')} vs {hydration_l}")
            score -= 1
        
        for i, entry in enumerate(timeline):
            entry_cal = (entry.get('carbs_g', 0) * 4) + (entry.get('protein_g', 0) * 4) + (entry.get('fat_g', 0) * 9)
            if abs(entry.get('calories', 0) - entry_cal) > entry_cal * 0.01:
                issues.append(f"Entry {i} ({entry.get('time', 'unknown')}): calories don't match macros")
                score -= 0.5
    
    score = max(0, min(10, score))
    return {
        'overall': round(score, 1),
        'issues': issues[:10]
    }

def evaluate_response(response_data: Dict, calculated_targets: Dict) -> Dict:
    """Evaluate the response using AI"""
    technical_score = validate_technical(response_data, calculated_targets)
    
    eval_prompt = f"""You are evaluating a daily meal/workout plan generated by an AI. Evaluate it comprehensively.

## GENERATED PLAN:
{json.dumps(response_data, indent=2)}

## TARGET MACROS:
{json.dumps(calculated_targets, indent=2)}

## TECHNICAL VALIDATION SCORE: {technical_score['overall']}/10
### Technical Issues Found:
{chr(10).join(f"- {issue}" for issue in technical_score['issues'])}

## EVALUATION TASK:

Evaluate this plan on these dimensions (1-10 scale each):

1. **Overall Quality** (1-10): How well does this plan meet the athlete's needs?
2. **Tip Quality** (1-10): Is the daily tip motivating, actionable, and natural? Does it avoid codified citations?
3. **Macro Accuracy** (1-10): Do macros match targets? Are calories calculated from macros?
4. **Practical Sense** (1-10): Do the meals and workouts make practical sense?
   - Can you actually consume carbs during a swim workout?
   - Are meal timings logical?
   - Would a real athlete follow this plan?
5. **Timeline Logic** (1-10): Is the timeline chronologically sound? Does macro distribution make sense throughout the day?

Return JSON format:
{{
  "scores": {{
    "overall": number,
    "tip": number,
    "macros": number,
    "practical": number,
    "timeline": number
  }},
  "explanations": {{
    "overall": "explanation",
    "tip": "explanation",
    "macros": "explanation",
    "practical": "explanation",
    "timeline": "explanation"
  }},
  "improvements": [
    "specific improvement 1",
    "specific improvement 2",
    "specific improvement 3"
  ]
}}
"""
    
    try:
        eval_response = call_openrouter(eval_prompt, MODEL)
        eval_data = parse_response(eval_response['text'])
        
        if eval_data:
            return {
                **eval_data,
                'technical': technical_score
            }
        else:
            return {
                'scores': {
                    'overall': technical_score['overall'],
                    'tip': 5,
                    'macros': technical_score['overall'],
                    'practical': 5,
                    'timeline': 5
                },
                'technical': technical_score,
                'improvements': ['Failed to parse evaluation response']
            }
    except Exception as e:
        return {
            'scores': {
                'overall': technical_score['overall'],
                'tip': 5,
                'macros': technical_score['overall'],
                'practical': 5,
                'timeline': 5
            },
            'technical': technical_score,
            'improvements': [f'Evaluation failed: {str(e)}']
        }

def test_persona(athlete_data: Dict, prompt_template: str, research_corpus: str) -> Dict:
    """Test a single persona"""
    athlete_id = athlete_data['id']
    athlete_name = athlete_data['name']
    profile = athlete_data['profile']
    workouts_raw = athlete_data.get('workouts', [])
    
    print(f"\n{'=' * 80}")
    print(f"Testing: {athlete_name}")
    print(f"{'=' * 80}")
    print(f"  ID: {athlete_id}")
    print(f"  Goal: {profile.get('goal', 'N/A')}")
    print(f"  Phase: {profile.get('training_phase', 'N/A')}")
    print(f"  Workouts: {len(workouts_raw)}")
    
    # Convert workout format
    workouts = [convert_workout_format(w) for w in workouts_raw]
    
    # Prepare athlete dict for macro calculator
    athlete = {
        'weight_kg': profile['weight_kg'],
        'height_cm': profile['height_cm'],
        'age': profile.get('age', 30),
        'gender': profile['gender'],
        'goal': profile.get('goal', 'performance'),
        'training_phase': profile.get('training_phase', 'base'),
        'activity_level': 'high' if len(workouts) > 1 else 'moderate'
    }
    
    # Calculate macros
    print("\n📊 Calculating macros...")
    macro_result = calculate_macros_via_node(athlete, workouts)
    calculated_targets = macro_result.get('calculated_targets', macro_result)
    
    print(f"   Target Calories: {calculated_targets['daily_energy_target_kcal']}")
    print(f"   Target Carbs: {calculated_targets['daily_carb_target_g']}g")
    print(f"   Target Protein: {calculated_targets['daily_protein_target_g']}g")
    print(f"   Target Fat: {calculated_targets['daily_fat_target_g']}g")
    
    # Build context and prompt
    context = build_context(athlete, workouts, calculated_targets)
    prompt = build_prompt(research_corpus, context, prompt_template)
    
    # Call API
    print("\n📤 Calling OpenRouter API...")
    print(f"   Model: {MODEL}")
    print(f"   Prompt length: {len(prompt)} chars (~{len(prompt)//4} tokens)")
    print("   Waiting for response...")
    
    try:
        response = call_openrouter(prompt, MODEL)
        tokens = response['usage'].get('total_tokens', 0)
        print(f"✅ Response received ({tokens} tokens)")
        print(f"   Prompt tokens: {response['usage'].get('prompt_tokens', 0)}")
        print(f"   Completion tokens: {response['usage'].get('completion_tokens', 0)}")
    except Exception as e:
        print(f"❌ API Error: {e}")
        return {
            'athlete_id': athlete_id,
            'athlete_name': athlete_name,
            'status': 'failed',
            'error': str(e)
        }
    
    # Parse response
    print("\n📊 Parsing response...")
    response_data = parse_response(response['text'])
    
    if not response_data:
        print("❌ Failed to parse response")
        return {
            'athlete_id': athlete_id,
            'athlete_name': athlete_name,
            'status': 'failed',
            'error': 'Failed to parse JSON response'
        }
    
    print("✅ Successfully parsed JSON")
    print(f"   Timeline entries: {len(response_data.get('timeline', []))}")
    print(f"   Daily summary calories: {response_data.get('daily_summary', {}).get('calories', 'N/A')}")
    
    # Evaluate
    print("\n🔍 Evaluating response...")
    sys.stdout.write("   Running technical validation...")
    sys.stdout.flush()
    evaluation = evaluate_response(response_data, calculated_targets)
    sys.stdout.write(" ✅\n")
    sys.stdout.write("   Running AI evaluation...")
    sys.stdout.flush()
    sys.stdout.write(" ✅\n")
    
    # Display results
    print("\n📈 Evaluation Scores:")
    print(f"   Overall: {evaluation['scores']['overall']}/10")
    print(f"   Tip: {evaluation['scores']['tip']}/10")
    print(f"   Macros: {evaluation['scores']['macros']}/10")
    print(f"   Practical: {evaluation['scores']['practical']}/10")
    print(f"   Timeline: {evaluation['scores']['timeline']}/10")
    print(f"   Technical: {evaluation['technical']['overall']}/10")
    
    if evaluation['technical']['issues']:
        print(f"\n⚠️  Technical Issues:")
        for issue in evaluation['technical']['issues'][:5]:
            print(f"   - {issue}")
    
    return {
        'athlete_id': athlete_id,
        'athlete_name': athlete_name,
        'profile': profile,
        'workouts_count': len(workouts),
        'targets': calculated_targets,
        'scores': evaluation['scores'],
        'technical_score': evaluation['technical']['overall'],
        'technical_issues': evaluation['technical']['issues'],
        'evaluation_explanations': evaluation.get('explanations', {}),
        'improvements': evaluation.get('improvements', []),
        'response_sample': {
            'daily_summary': response_data.get('daily_summary', {}),
            'daily_tip': response_data.get('daily_tip', {}),
            'timeline_count': len(response_data.get('timeline', [])),
        },
        'usage': response['usage'],
        'status': 'success'
    }

def main():
    """Main test loop"""
    print("=" * 80)
    print("Testing Iteration 3 Prompt Across All Personas")
    print("=" * 80)
    print(f"\nPrompt: {PROMPT_FILE}")
    print(f"Model: {MODEL}\n")
    
    # Load components
    print("Loading components...")
    prompt_template = load_prompt_template()
    research_corpus = load_research_corpus()
    athletes = load_test_athletes()
    
    print(f"✅ Loaded {len(athletes)} test athletes\n")
    
    # Test each persona
    results = []
    for i, athlete in enumerate(athletes, 1):
        print(f"\n{'#' * 80}")
        print(f"PERSONA {i}/{len(athletes)}")
        print(f"{'#' * 80}")
        
        result = test_persona(athlete, prompt_template, research_corpus)
        results.append(result)
    
    # Summary
    print(f"\n{'=' * 80}")
    print("FINAL SUMMARY")
    print('=' * 80)
    
    successful = [r for r in results if r.get('status') == 'success']
    failed = [r for r in results if r.get('status') != 'success']
    
    print(f"\n✅ Successful: {len(successful)}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")
    
    if successful:
        print("\n📊 Average Scores Across All Personas:")
        avg_scores = {
            'overall': sum(r['scores']['overall'] for r in successful) / len(successful),
            'tip': sum(r['scores']['tip'] for r in successful) / len(successful),
            'macros': sum(r['scores']['macros'] for r in successful) / len(successful),
            'practical': sum(r['scores']['practical'] for r in successful) / len(successful),
            'timeline': sum(r['scores']['timeline'] for r in successful) / len(successful),
            'technical': sum(r['technical_score'] for r in successful) / len(successful)
        }
        
        print(f"   Overall: {avg_scores['overall']:.1f}/10")
        print(f"   Tip: {avg_scores['tip']:.1f}/10")
        print(f"   Macros: {avg_scores['macros']:.1f}/10")
        print(f"   Practical: {avg_scores['practical']:.1f}/10")
        print(f"   Timeline: {avg_scores['timeline']:.1f}/10")
        print(f"   Technical: {avg_scores['technical']:.1f}/10")
        
        print("\n📊 Scores by Persona:")
        print(f"{'Persona':<40} {'Overall':<10} {'Tip':<8} {'Macros':<10} {'Practical':<12} {'Timeline':<10} {'Technical':<10}")
        print("-" * 100)
        for r in successful:
            name = r['athlete_name'][:38]
            scores = r['scores']
            print(f"{name:<40} {scores['overall']:<10.1f} {scores['tip']:<8.1f} {scores['macros']:<10.1f} {scores['practical']:<12.1f} {scores['timeline']:<10.1f} {r['technical_score']:<10.1f}")
    
    # Save results
    print("\n💾 Saving results...")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f'persona_test_results_{timestamp}.json'
    with open(results_file, 'w') as f:
        json.dump({
            'metadata': {
                'prompt_file': PROMPT_FILE,
                'model': MODEL,
                'timestamp': datetime.now().isoformat(),
                'total_personas': len(results),
                'successful': len(successful),
                'failed': len(failed)
            },
            'average_scores': avg_scores if successful else {},
            'results': results
        }, f, indent=2)
    
    print(f"✅ Results saved to {results_file}")
    
    # Create markdown summary
    print("📝 Creating markdown summary...")
    summary_file = f'persona_test_summary_{timestamp}.md'
    with open(summary_file, 'w') as f:
        f.write("# Persona Test Results - Iteration 3 Prompt\n\n")
        f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Prompt**: {PROMPT_FILE}\n")
        f.write(f"**Model**: {MODEL}\n\n")
        
        f.write("## Summary\n\n")
        f.write(f"- **Total Personas**: {len(results)}\n")
        f.write(f"- **Successful**: {len(successful)}\n")
        f.write(f"- **Failed**: {len(failed)}\n\n")
        
        if successful:
            f.write("## Average Scores\n\n")
            f.write("| Metric | Score |\n")
            f.write("|--------|-------|\n")
            f.write(f"| Overall | {avg_scores['overall']:.1f}/10 |\n")
            f.write(f"| Tip | {avg_scores['tip']:.1f}/10 |\n")
            f.write(f"| Macros | {avg_scores['macros']:.1f}/10 |\n")
            f.write(f"| Practical | {avg_scores['practical']:.1f}/10 |\n")
            f.write(f"| Timeline | {avg_scores['timeline']:.1f}/10 |\n")
            f.write(f"| Technical | {avg_scores['technical']:.1f}/10 |\n\n")
            
            f.write("## Results by Persona\n\n")
            f.write("| Persona | Overall | Tip | Macros | Practical | Timeline | Technical |\n")
            f.write("|---------|---------|-----|--------|-----------|----------|----------|\n")
            for r in successful:
                name = r['athlete_name']
                scores = r['scores']
                f.write(f"| {name} | {scores['overall']:.1f} | {scores['tip']:.1f} | {scores['macros']:.1f} | {scores['practical']:.1f} | {scores['timeline']:.1f} | {r['technical_score']:.1f} |\n")
            
            f.write("\n## Detailed Results\n\n")
            for r in successful:
                f.write(f"### {r['athlete_name']}\n\n")
                f.write(f"**Scores:**\n")
                f.write(f"- Overall: {r['scores']['overall']}/10\n")
                f.write(f"- Tip: {r['scores']['tip']}/10\n")
                f.write(f"- Macros: {r['scores']['macros']}/10\n")
                f.write(f"- Practical: {r['scores']['practical']}/10\n")
                f.write(f"- Timeline: {r['scores']['timeline']}/10\n")
                f.write(f"- Technical: {r['technical_score']}/10\n\n")
                
                if r['technical_issues']:
                    f.write("**Technical Issues:**\n")
                    for issue in r['technical_issues'][:5]:
                        f.write(f"- {issue}\n")
                    f.write("\n")
                
                if r.get('improvements'):
                    f.write("**Improvements Needed:**\n")
                    for imp in r['improvements'][:3]:
                        f.write(f"- {imp}\n")
                    f.write("\n")
                
                f.write("---\n\n")
    
    print(f"✅ Summary saved to {summary_file}")
    
    print("\n" + "=" * 80)
    print("✅ PERSONA TESTING COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    main()

