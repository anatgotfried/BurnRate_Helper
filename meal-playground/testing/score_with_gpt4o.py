#!/usr/bin/env python3
"""
Score test results using GPT-4o
Analyzes meal plans and gives 1-10 scores on multiple criteria
"""

import json
import os
import requests
from dotenv import load_dotenv
import glob

load_dotenv()

API_KEY = os.getenv('OPENROUTER_API_KEY')
API_URL = 'https://openrouter.ai/api/v1/chat/completions'
SCORING_MODEL = 'openai/gpt-4o'

def score_test1_responses():
    """Score all Test 1 (structure) responses"""
    print('\n' + '='*80)
    print('📊 Scoring TEST 1 Results with GPT-4o')
    print('='*80 + '\n')
    
    files = glob.glob('testing/test1_structure/*.json')
    scores = []
    
    for i, filepath in enumerate(files):
        model_name = os.path.basename(filepath).replace('.json', '')
        print(f'\nScoring {i+1}/{len(files)}: {model_name}')
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        score = score_structure(data['response'], model_name)
        scores.append(score)
        
        print(f'  Overall: {score["overall_score"]}/10')
        
        if i < len(files) - 1:
            print('  Waiting 2s...')
            import time
            time.sleep(2)
    
    # Save scores
    with open('testing/scores/test1-scores.json', 'w') as f:
        json.dump({
            'test_type': 'structure_only',
            'scored_by': SCORING_MODEL,
            'scores': scores
        }, f, indent=2)
    
    print(f'\n✅ Test 1 scoring complete!')
    print(f'📁 Saved: testing/scores/test1-scores.json')
    
    return scores

def score_structure(meal_plan, model_name):
    """Use GPT-4o to score a structure-only meal plan"""
    
    prompt = f"""Analyze this meal structure and rate it on a scale of 1-10 for each criterion.

MEAL STRUCTURE:
{json.dumps(meal_plan, indent=2)}

Rate on these criteria (1=poor, 10=excellent):
1. **Meal Timing Logic** - Are meals timed well relative to workouts? (pre/post workout timing)
2. **Macro Distribution** - Are macros distributed logically across meals?
3. **Rationale Quality** - Are explanations detailed, evidence-based, with citations?
4. **Structure Completeness** - Does it cover the full day appropriately?
5. **JSON Formatting** - Is the JSON clean, well-structured, valid?

Return ONLY this JSON:
{{
  "model": "{model_name}",
  "meal_timing_logic": {{"score": N, "notes": "brief comment"}},
  "macro_distribution": {{"score": N, "notes": "brief comment"}},
  "rationale_quality": {{"score": N, "notes": "brief comment"}},
  "structure_completeness": {{"score": N, "notes": "brief comment"}},
  "json_formatting": {{"score": N, "notes": "brief comment"}},
  "overall_score": N,
  "summary": "2-3 sentence overall assessment"
}}"""
    
    try:
        response = requests.post(
            API_URL,
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': SCORING_MODEL,
                'messages': [
                    {'role': 'system', 'content': 'You are an expert sports nutrition evaluator. Return only valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 1000,
                'temperature': 0.3
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Extract JSON
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            first_brace = content.find('{')
            last_brace = content.rfind('}')
            if first_brace != -1 and last_brace != -1:
                content = content[first_brace:last_brace + 1]
            
            return json.loads(content)
    except:
        pass
    
    # Fallback simple score
    return {
        'model': model_name,
        'overall_score': 5,
        'summary': 'Scoring failed'
    }

def score_test2_responses():
    """Score all Test 2 (full) responses"""
    print('\n' + '='*80)
    print('📊 Scoring TEST 2 Results with GPT-4o')
    print('='*80 + '\n')
    
    files = glob.glob('testing/test2_full/*.json')
    scores = []
    
    for i, filepath in enumerate(files):
        model_name = os.path.basename(filepath).replace('.json', '')
        print(f'\nScoring {i+1}/{len(files)}: {model_name}')
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        score = score_full_meal_plan(data['response'], model_name)
        scores.append(score)
        
        print(f'  Overall: {score["overall_score"]}/10')
        
        if i < len(files) - 1:
            print('  Waiting 2s...')
            import time
            time.sleep(2)
    
    # Save scores
    with open('testing/scores/test2-scores.json', 'w') as f:
        json.dump({
            'test_type': 'full_meals',
            'scored_by': SCORING_MODEL,
            'scores': scores
        }, f, indent=2)
    
    print(f'\n✅ Test 2 scoring complete!')
    print(f'📁 Saved: testing/scores/test2-scores.json')
    
    return scores

def score_full_meal_plan(meal_plan, model_name):
    """Use GPT-4o to score a complete meal plan"""
    
    prompt = f"""Analyze this complete meal plan and rate it on a scale of 1-10 for each criterion.

MEAL PLAN:
{json.dumps(meal_plan, indent=2)}

Rate on these criteria (1=poor, 10=excellent):
1. **Food Specificity** - Are portions exact? Are food items realistic and practical?
2. **Macro Accuracy** - Do daily totals match targets (3248 kcal, 126g protein, 560g carbs, 56g fat)?
3. **Sodium Tracking** - Does every food have sodium_mg? Does total hit ~4000mg target?
4. **Rationale Quality** - Detailed explanations with research citations?
5. **Israel Alternatives** - Specific products (Tnuva, Osem, etc.) with portions?
6. **Meal Timing** - Well-timed relative to 09:00 and 10:00 workouts?
7. **JSON Quality** - Clean, valid, well-structured?

Return ONLY this JSON:
{{
  "model": "{model_name}",
  "food_specificity": {{"score": N, "notes": "brief"}},
  "macro_accuracy": {{"score": N, "notes": "brief"}},
  "sodium_tracking": {{"score": N, "notes": "brief"}},
  "rationale_quality": {{"score": N, "notes": "brief"}},
  "israel_alternatives": {{"score": N, "notes": "brief"}},
  "meal_timing": {{"score": N, "notes": "brief"}},
  "json_quality": {{"score": N, "notes": "brief"}},
  "overall_score": N,
  "summary": "2-3 sentence overall assessment"
}}"""
    
    try:
        response = requests.post(
            API_URL,
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': SCORING_MODEL,
                'messages': [
                    {'role': 'system', 'content': 'You are an expert sports nutrition evaluator. Return only valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 1500,
                'temperature': 0.3
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Extract JSON
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            first_brace = content.find('{')
            last_brace = content.rfind('}')
            if first_brace != -1 and last_brace != -1:
                content = content[first_brace:last_brace + 1]
            
            return json.loads(content)
    except Exception as e:
        print(f'    ⚠️ Scoring error: {str(e)[:50]}')
    
    # Fallback
    return {
        'model': model_name,
        'overall_score': 5,
        'summary': 'Scoring failed'
    }

def main():
    print('🎯 Scoring all test results with GPT-4o...\n')
    
    # Score Test 1
    test1_scores = score_test1_responses()
    
    # Score Test 2
    test2_scores = score_test2_responses()
    
    print('\n' + '='*80)
    print('✅ ALL SCORING COMPLETE')
    print('='*80)
    print(f'\nTest 1 scored: {len(test1_scores)} models')
    print(f'Test 2 scored: {len(test2_scores)} models')
    print(f'\n📁 Results in testing/scores/')

if __name__ == '__main__':
    main()

