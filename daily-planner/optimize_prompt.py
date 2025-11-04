#!/usr/bin/env python3
"""
Prompt Optimization Script for Daily Planner
Simulates the website flow and iteratively improves the prompt through evaluation.
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

# Test persona: Sarah - fat loss runner
TEST_PERSONA = {
    "name": "Sarah",
    "weight_kg": 65,
    "height_cm": 165,
    "age": 32,
    "gender": "female",
    "goal": "fat_loss",
    "training_phase": "base",
    "activity_level": "high",
    "sweat_rate": None,
    "masters": False,
    "female_specific": True,
    "youth": False
}

# Test workouts
TEST_WORKOUTS = [
    {
        "type": "run",
        "duration_min": 60,
        "intensity": "moderate",
        "time": "06:00",
        "temp_c": 22,
        "humidity_percent": 60
    },
    {
        "type": "swim",
        "duration_min": 45,
        "intensity": "moderate",
        "time": "18:00",
        "temp_c": 26,
        "humidity_percent": 50
    }
]

def load_prompt_template() -> str:
    """Load the prompt template"""
    with open('prompts/daily_planner_v1.txt', 'r') as f:
        return f.read()

def load_research_corpus() -> str:
    """Load research corpus"""
    with open('data/research_corpus.json', 'r') as f:
        corpus = json.load(f)
        # Return as formatted string
        return json.dumps(corpus, indent=2)

def calculate_macros_via_node(athlete: Dict, workouts: List[Dict]) -> Dict:
    """Calculate macros using Node.js macro-calculator.js"""
    # Create a wrapper script that exports the function properly
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read the macro calculator
    with open(os.path.join(script_dir, 'macro-calculator.js'), 'r') as f:
        macro_code = f.read()
    
    # Create wrapper that works in Node.js
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
    
    # Write to temp file
    temp_file = '/tmp/calc_macros.js'
    with open(temp_file, 'w') as f:
        f.write(wrapper)
    
    try:
        # Run node script
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
            print("   Using fallback calculation...")
            return calculate_macros_fallback(athlete, workouts)
    except Exception as e:
        print(f"⚠️  Error running node: {e}")
        print("   Using fallback calculation...")
        return calculate_macros_fallback(athlete, workouts)

def calculate_macros_fallback(athlete: Dict, workouts: List[Dict]) -> Dict:
    """Fallback macro calculation if Node.js fails"""
    weight = athlete['weight_kg']
    goal = athlete['goal']
    
    # Simplified calculation
    protein_g = weight * 2.0 if goal == 'fat_loss' else weight * 1.8
    carbs_g = weight * 6.0  # Base carbs
    fat_g = weight * 0.8
    
    # Simple TDEE estimate
    bmr = 655 + (9.6 * weight) + (1.8 * athlete['height_cm']) - (4.7 * athlete['age'])
    tdee = bmr * 1.6  # Moderate activity
    
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
    """Build the context string like the website does"""
    workouts_str = json.dumps(workouts, indent=2)
    
    context = f"""
## ATHLETE PROFILE
- Weight: {athlete['weight_kg']} kg
- Height: {athlete['height_cm']} cm
- Age: {athlete['age']} years
- Gender: {athlete['gender']}
- Goal: {athlete['goal']}
- Training Phase: {athlete['training_phase']}
- Activity Level: {athlete['activity_level']}

## CALCULATED TARGETS
{json.dumps(calculated_targets, indent=2)}

## TODAY'S WORKOUTS
{workouts_str}

## TRAINING PHASE
{athlete['training_phase']}

## GOAL
{athlete['goal']}
"""
    return context.strip()

def build_prompt(research_corpus: str, context: str, prompt_template: str) -> str:
    """Build the full prompt"""
    prompt = prompt_template.replace('{RESEARCH_CORPUS}', research_corpus)
    prompt = prompt.replace('{CONTEXT}', context)
    prompt = prompt.replace('{PHASE}', TEST_PERSONA['training_phase'])
    prompt = prompt.replace('{GOAL}', TEST_PERSONA['goal'])
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
        # Try to extract JSON from response
        # Remove markdown code blocks if present
        text = response_text.strip()
        
        # Check if it's markdown wrapped
        if '```json' in text:
            # Extract JSON from markdown code block
            start = text.find('```json') + 7
            end = text.find('```', start)
            if end != -1:
                text = text[start:end].strip()
        elif text.startswith('```'):
            # Extract JSON from code block
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                text = text[start:end]
        
        # Try to find JSON object boundaries
        if '{' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end > start:
                text = text[start:end]
        
        # Try parsing
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Response text (first 1000 chars): {response_text[:1000]}...")
        # Try to extract just the JSON part more aggressively
        try:
            # Look for JSON-like structure
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except:
            pass
        return None

def evaluate_response(response_data: Dict, calculated_targets: Dict, prompt: str) -> Dict:
    """Evaluate the response using AI"""
    
    # First, do technical validation
    sys.stdout.write("   Running technical validation...")
    sys.stdout.flush()
    technical_score = validate_technical(response_data, calculated_targets)
    sys.stdout.write(" ✅\n")
    sys.stdout.write("   Running AI evaluation...")
    sys.stdout.flush()
    
    # Build evaluation prompt
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
2. **Tip Quality** (1-10): Is the daily tip motivating, actionable, and natural? Does it avoid codified citations like "(ISSN2017)"?
3. **Macro Accuracy** (1-10): Do macros match targets? Are calories calculated from macros?
4. **Practical Sense** (1-10): Do the meals and workouts make practical sense?
   - Can you actually consume carbs during a swim workout?
   - Are meal timings logical?
   - Would a real athlete follow this plan?
5. **Timeline Logic** (1-10): Is the timeline chronologically sound? Does macro distribution make sense throughout the day?

For each dimension, provide:
- Score (1-10)
- Brief explanation
- Specific improvement suggestions

Then provide:
- **Overall Score** (1-10): Weighted average considering all dimensions
- **Top 3 Improvements**: Most impactful changes to make the prompt better

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
            sys.stdout.write(" ✅\n")
            return {
                **eval_data,
                'technical': technical_score
            }
        else:
            sys.stdout.write(" ⚠️\n")
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
        sys.stdout.write(" ❌\n")
        print(f"Evaluation error: {e}")
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

def validate_technical(response_data: Dict, targets: Dict) -> Dict:
    """Validate technical correctness"""
    issues = []
    score = 10
    
    if not response_data:
        return {'overall': 0, 'issues': ['No response data']}
    
    # Check required fields
    required = ['daily_summary', 'timeline', 'daily_tip']
    for field in required:
        if field not in response_data:
            issues.append(f"Missing required field: {field}")
            score -= 3
    
    if 'daily_summary' in response_data:
        summary = response_data['daily_summary']
        
        # Check macro totals match
        if 'timeline' in response_data:
            timeline = response_data['timeline']
            
            # Calculate totals from timeline
            totals = {
                'calories': sum(e.get('calories', 0) for e in timeline),
                'carbs_g': sum(e.get('carbs_g', 0) for e in timeline),
                'protein_g': sum(e.get('protein_g', 0) for e in timeline),
                'fat_g': sum(e.get('fat_g', 0) for e in timeline),
                'sodium_mg': sum(e.get('sodium_mg', 0) for e in timeline),
                'hydration_ml': sum(e.get('hydration_ml', 0) for e in timeline)
            }
            
            # Check calorie calculation
            calculated_calories = (totals['carbs_g'] * 4) + (totals['protein_g'] * 4) + (totals['fat_g'] * 9)
            if abs(totals['calories'] - calculated_calories) > calculated_calories * 0.01:
                issues.append(f"Calories don't match macros: {totals['calories']} vs {calculated_calories}")
                score -= 2
            
            # Check summary matches timeline totals
            if abs(summary.get('calories', 0) - totals['calories']) > totals['calories'] * 0.02:
                issues.append(f"Summary calories don't match timeline: {summary.get('calories')} vs {totals['calories']}")
                score -= 1
            
            if abs(summary.get('carbs_g', 0) - totals['carbs_g']) > totals['carbs_g'] * 0.02:
                issues.append(f"Summary carbs don't match timeline: {summary.get('carbs_g')} vs {totals['carbs_g']}")
                score -= 1
            
            # Check hydration
            hydration_l = totals['hydration_ml'] / 1000
            if abs(summary.get('hydration_l', 0) - hydration_l) > 0.2:
                issues.append(f"Summary hydration doesn't match timeline: {summary.get('hydration_l')} vs {hydration_l}")
                score -= 1
            
            # Check each entry's calories match macros
            for i, entry in enumerate(timeline):
                entry_cal = (entry.get('carbs_g', 0) * 4) + (entry.get('protein_g', 0) * 4) + (entry.get('fat_g', 0) * 9)
                if abs(entry.get('calories', 0) - entry_cal) > entry_cal * 0.01:
                    issues.append(f"Entry {i} ({entry.get('time', 'unknown')}): calories don't match macros")
                    score -= 0.5
    
    score = max(0, min(10, score))
    
    return {
        'overall': round(score, 1),
        'issues': issues[:10]  # Limit issues
    }

def improve_prompt(prompt_template: str, evaluation: Dict, iteration: int) -> str:
    """Improve the prompt based on evaluation"""
    improvements = evaluation.get('improvements', [])
    
    if not improvements:
        return prompt_template
    
    # Create improvement instructions
    improvement_text = f"""
## ITERATION {iteration} IMPROVEMENTS NEEDED:

Based on evaluation scores:
- Overall: {evaluation['scores']['overall']}/10
- Tip: {evaluation['scores']['tip']}/10
- Macros: {evaluation['scores']['macros']}/10
- Practical: {evaluation['scores']['practical']}/10
- Timeline: {evaluation['scores']['timeline']}/10

Top improvements needed:
{chr(10).join(f"- {imp}" for imp in improvements[:5])}

## CURRENT PROMPT:
{prompt_template}

## TASK:
Improve the prompt to address these issues. Make specific, actionable changes. 
CRITICAL: Return ONLY the improved prompt text, no markdown, no explanations. Start with the first line of the prompt.
"""
    
    try:
        improved_response = call_openrouter(improvement_text, MODEL)
        improved_prompt = improved_response['text'].strip()
        
        # Remove markdown if present
        if improved_prompt.startswith('```'):
            lines = improved_prompt.split('\n')
            if lines[0].startswith('```'):
                improved_prompt = '\n'.join(lines[1:-1])
        
        # If it looks like it's still wrapped in explanations, try to extract just the prompt
        if improved_prompt.startswith('##') or improved_prompt.startswith('**'):
            # Try to find where the actual prompt starts
            prompt_start_markers = ['You are the BurnRate', 'You are the', 'Return ONLY']
            for marker in prompt_start_markers:
                idx = improved_prompt.find(marker)
                if idx != -1:
                    improved_prompt = improved_prompt[idx:]
                    break
        
        return improved_prompt.strip()
    except Exception as e:
        print(f"Error improving prompt: {e}")
        return prompt_template

def main():
    """Main optimization loop"""
    print("=" * 80)
    print("Daily Planner Prompt Optimization")
    print("=" * 80)
    print(f"\nTest Persona: {TEST_PERSONA['name']} ({TEST_PERSONA['goal']} runner)")
    print(f"Workouts: {len(TEST_WORKOUTS)} workouts")
    print(f"Model: {MODEL}\n")
    
    # Load base components
    print("Loading components...")
    prompt_template = load_prompt_template()
    research_corpus = load_research_corpus()
    
    # Calculate macros
    print("Calculating macros...")
    macro_result = calculate_macros_via_node(TEST_PERSONA, TEST_WORKOUTS)
    calculated_targets = macro_result.get('calculated_targets', macro_result)
    
    print(f"Target Calories: {calculated_targets['daily_energy_target_kcal']}")
    print(f"Target Carbs: {calculated_targets['daily_carb_target_g']}g")
    print(f"Target Protein: {calculated_targets['daily_protein_target_g']}g")
    print(f"Target Fat: {calculated_targets['daily_fat_target_g']}g\n")
    
    # Build context
    context = build_context(TEST_PERSONA, TEST_WORKOUTS, calculated_targets)
    
    # Run iterations
    results = []
    current_prompt = prompt_template
    
    for iteration in range(1, 6):
        print(f"\n{'=' * 80}")
        print(f"ITERATION {iteration}/5")
        print('=' * 80)
        
        # Build prompt
        prompt = build_prompt(research_corpus, context, current_prompt)
        
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
            break
        
        # Parse response
        print("\n📊 Parsing response...")
        response_data = parse_response(response['text'])
        
        if not response_data:
            print("❌ Failed to parse response")
            print("⚠️  Skipping to next iteration...")
            # Store failed iteration
            results.append({
                'iteration': iteration,
                'status': 'failed',
                'error': 'Failed to parse JSON response',
                'response_preview': response['text'][:500] if 'text' in response else 'No response'
            })
            # Try to improve prompt to be more strict about JSON
            if iteration < 5:
                current_prompt = current_prompt + "\n\nCRITICAL: You MUST return ONLY valid JSON. No markdown, no explanations, no text before or after. The response must start with { and end with }."
            continue
        
        print("✅ Successfully parsed JSON")
        print(f"   Timeline entries: {len(response_data.get('timeline', []))}")
        print(f"   Daily summary calories: {response_data.get('daily_summary', {}).get('calories', 'N/A')}")
        
        # Evaluate
        print("\n🔍 Evaluating response...")
        evaluation = evaluate_response(response_data, calculated_targets, prompt)
        
        # Store prompt improvements for next iteration
        improvements_for_next = evaluation.get('improvements', [])
        
        # Display results
        print(f"\n📈 Evaluation Scores:")
        print(f"  Overall: {evaluation['scores']['overall']}/10")
        print(f"  Tip: {evaluation['scores']['tip']}/10")
        print(f"  Macros: {evaluation['scores']['macros']}/10")
        print(f"  Practical: {evaluation['scores']['practical']}/10")
        print(f"  Timeline: {evaluation['scores']['timeline']}/10")
        print(f"  Technical: {evaluation['technical']['overall']}/10")
        
        if evaluation['technical']['issues']:
            print(f"\n⚠️  Technical Issues:")
            for issue in evaluation['technical']['issues'][:5]:
                print(f"  - {issue}")
        
        if improvements_for_next:
            print(f"\n💡 Improvements Identified:")
            for imp in improvements_for_next[:5]:
                print(f"  - {imp}")
        
        # Store results
        iteration_result = {
            'iteration': iteration,
            'prompt_text': current_prompt,  # Save full prompt text
            'prompt_length': len(current_prompt),
            'scores': evaluation['scores'],
            'technical_score': evaluation['technical']['overall'],
            'technical_issues': evaluation['technical']['issues'],
            'evaluation_explanations': evaluation.get('explanations', {}),
            'improvements_needed': improvements_for_next,
            'response_sample': {
                'daily_summary': response_data.get('daily_summary', {}),
                'daily_tip': response_data.get('daily_tip', {}),
                'timeline_count': len(response_data.get('timeline', [])),
                'training_load': response_data.get('training_load', {})
            },
            'usage': response['usage']
        }
        
        results.append(iteration_result)
        
        # Improve prompt for next iteration (except last)
        if iteration < 5:
            print(f"\n🔧 Improving prompt for next iteration...")
            print("   Analyzing improvements needed...")
            previous_prompt = current_prompt
            current_prompt = improve_prompt(current_prompt, evaluation, iteration)
            print("   ✅ Prompt improved")
            
            # Track what changed
            iteration_result['prompt_changes'] = {
                'previous_length': len(previous_prompt),
                'new_length': len(current_prompt),
                'improvements_applied': improvements_for_next[:5]
            }
            
            # Save improved prompt
            improved_file = f'prompts/daily_planner_v1_iter{iteration}.txt'
            print(f"   Saving prompt to {improved_file}...")
            with open(improved_file, 'w') as f:
                f.write(current_prompt)
            print(f"💾 Saved improved prompt to {improved_file}")
            
            # Save prompt diff for comparison
            diff_file = f'prompts/daily_planner_v1_iter{iteration}_diff.txt'
            print(f"   Saving diff to {diff_file}...")
            with open(diff_file, 'w') as f:
                f.write(f"=== CHANGES FROM ITERATION {iteration-1} TO {iteration} ===\n\n")
                f.write(f"IMPROVEMENTS ADDRESSED:\n")
                for imp in improvements_for_next[:5]:
                    f.write(f"  - {imp}\n")
                f.write(f"\n\n=== PREVIOUS PROMPT (Iteration {iteration-1}) ===\n\n")
                f.write(previous_prompt)
                f.write(f"\n\n=== NEW PROMPT (Iteration {iteration}) ===\n\n")
                f.write(current_prompt)
            print(f"💾 Saved prompt diff to {diff_file}")
        else:
            # Save final prompt
            final_file = f'prompts/daily_planner_v1_iter{iteration}.txt'
            print(f"\n💾 Saving final prompt to {final_file}...")
            with open(final_file, 'w') as f:
                f.write(current_prompt)
            print(f"✅ Saved final prompt")
    
    # Final summary
    print(f"\n{'=' * 80}")
    print("FINAL SUMMARY")
    print('=' * 80)
    
    print("\n📊 Score Progression:")
    print(f"{'Iteration':<12} {'Overall':<10} {'Tip':<10} {'Macros':<10} {'Practical':<12} {'Timeline':<12} {'Technical':<12}")
    print("-" * 80)
    for result in results:
        scores = result['scores']
        print(f"{result['iteration']:<12} {scores['overall']:<10.1f} {scores['tip']:<10.1f} {scores['macros']:<10.1f} {scores['practical']:<12.1f} {scores['timeline']:<12.1f} {result['technical_score']:<12.1f}")
    
    print("\n📈 Score Changes:")
    if len(results) > 1:
        for i in range(1, len(results)):
            prev = results[i-1]['scores']
            curr = results[i]['scores']
            print(f"\n  Iteration {i} → {i+1}:")
            print(f"    Overall: {prev['overall']:.1f} → {curr['overall']:.1f} ({curr['overall'] - prev['overall']:+.1f})")
            print(f"    Tip: {prev['tip']:.1f} → {curr['tip']:.1f} ({curr['tip'] - prev['tip']:+.1f})")
            print(f"    Macros: {prev['macros']:.1f} → {curr['macros']:.1f} ({curr['macros'] - prev['macros']:+.1f})")
            print(f"    Practical: {prev['practical']:.1f} → {curr['practical']:.1f} ({curr['practical'] - prev['practical']:+.1f})")
            print(f"    Timeline: {prev['timeline']:.1f} → {curr['timeline']:.1f} ({curr['timeline'] - prev['timeline']:+.1f})")
    
    # Save comprehensive results
    print("\n💾 Saving results...")
    results_file = f'optimization_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(results_file, 'w') as f:
        json.dump({
            'metadata': {
                'persona': TEST_PERSONA,
                'workouts': TEST_WORKOUTS,
                'targets': calculated_targets,
                'model': MODEL,
                'timestamp': datetime.now().isoformat(),
                'total_iterations': len(results)
            },
            'scores_summary': {
                'overall': [r['scores']['overall'] for r in results if 'scores' in r],
                'tip': [r['scores']['tip'] for r in results if 'scores' in r],
                'macros': [r['scores']['macros'] for r in results if 'scores' in r],
                'practical': [r['scores']['practical'] for r in results if 'scores' in r],
                'timeline': [r['scores']['timeline'] for r in results if 'scores' in r],
                'technical': [r['technical_score'] for r in results if 'technical_score' in r]
            },
            'score_changes': [
                {
                    'from_iteration': results[i-1]['iteration'],
                    'to_iteration': results[i]['iteration'],
                    'changes': {
                        'overall': results[i]['scores']['overall'] - results[i-1]['scores']['overall'],
                        'tip': results[i]['scores']['tip'] - results[i-1]['scores']['tip'],
                        'macros': results[i]['scores']['macros'] - results[i-1]['scores']['macros'],
                        'practical': results[i]['scores']['practical'] - results[i-1]['scores']['practical'],
                        'timeline': results[i]['scores']['timeline'] - results[i-1]['scores']['timeline'],
                        'technical': results[i]['technical_score'] - results[i-1]['technical_score']
                    }
                }
                for i in range(1, len(results)) if 'scores' in results[i] and 'scores' in results[i-1]
            ],
            'iterations': results
        }, f, indent=2)
    
    print(f"✅ Results saved to {results_file}")
    
    # Create human-readable summary
    print("📝 Creating markdown summary...")
    summary_file = f'optimization_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md'
    with open(summary_file, 'w') as f:
        f.write("# Daily Planner Prompt Optimization Results\n\n")
        f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Model**: {MODEL}\n")
        f.write(f"**Persona**: {TEST_PERSONA['name']} ({TEST_PERSONA['goal']} runner)\n\n")
        
        f.write("## Score Progression\n\n")
        f.write("| Iteration | Overall | Tip | Macros | Practical | Timeline | Technical |\n")
        f.write("|-----------|---------|-----|--------|-----------|----------|----------|\n")
        for result in results:
            scores = result['scores']
            f.write(f"| {result['iteration']} | {scores['overall']:.1f} | {scores['tip']:.1f} | {scores['macros']:.1f} | {scores['practical']:.1f} | {scores['timeline']:.1f} | {result['technical_score']:.1f} |\n")
        
        f.write("\n## Score Changes Between Iterations\n\n")
        if len(results) > 1:
            f.write("| From → To | Overall | Tip | Macros | Practical | Timeline | Technical |\n")
            f.write("|-----------|--------|-----|--------|-----------|----------|----------|\n")
            for i in range(1, len(results)):
                prev = results[i-1]['scores']
                curr = results[i]['scores']
                f.write(f"| {results[i-1]['iteration']} → {results[i]['iteration']} | ")
                f.write(f"{curr['overall'] - prev['overall']:+.1f} | ")
                f.write(f"{curr['tip'] - prev['tip']:+.1f} | ")
                f.write(f"{curr['macros'] - prev['macros']:+.1f} | ")
                f.write(f"{curr['practical'] - prev['practical']:+.1f} | ")
                f.write(f"{curr['timeline'] - prev['timeline']:+.1f} | ")
                f.write(f"{results[i]['technical_score'] - results[i-1]['technical_score']:+.1f} |\n")
        
        f.write("\n## Detailed Results by Iteration\n\n")
        for result in results:
            f.write(f"### Iteration {result['iteration']}\n\n")
            f.write(f"**Scores:**\n")
            f.write(f"- Overall: {result['scores']['overall']}/10\n")
            f.write(f"- Tip: {result['scores']['tip']}/10\n")
            f.write(f"- Macros: {result['scores']['macros']}/10\n")
            f.write(f"- Practical: {result['scores']['practical']}/10\n")
            f.write(f"- Timeline: {result['scores']['timeline']}/10\n")
            f.write(f"- Technical: {result['technical_score']}/10\n\n")
            
            if result.get('evaluation_explanations'):
                f.write("**Explanations:**\n")
                for key, value in result['evaluation_explanations'].items():
                    f.write(f"- {key.capitalize()}: {value}\n")
                f.write("\n")
            
            if result['improvements_needed']:
                f.write("**Improvements Needed:**\n")
                for imp in result['improvements_needed']:
                    f.write(f"- {imp}\n")
                f.write("\n")
            
            if result['technical_issues']:
                f.write("**Technical Issues:**\n")
                for issue in result['technical_issues'][:5]:
                    f.write(f"- {issue}\n")
                f.write("\n")
            
            if result.get('prompt_changes'):
                f.write("**Prompt Changes:**\n")
                f.write(f"- Length: {result['prompt_changes']['previous_length']} → {result['prompt_changes']['new_length']} chars\n")
                if result['prompt_changes']['improvements_applied']:
                    f.write("- Improvements Applied:\n")
                    for imp in result['prompt_changes']['improvements_applied']:
                        f.write(f"  - {imp}\n")
                f.write("\n")
            
            f.write("---\n\n")
    
    print(f"✅ Summary saved to {summary_file}")
    print(f"📝 Final prompt saved to prompts/daily_planner_v1_iter5.txt")
    
    print("\n" + "=" * 80)
    print("✅ OPTIMIZATION COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    main()

