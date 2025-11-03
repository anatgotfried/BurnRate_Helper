#!/usr/bin/env python3
"""
TEST 3: Fast Mode Comparison (FIXED - uses real corpus)
Compares model outputs with full 49KB corpus vs filtered corpus
"""

import json
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv('OPENROUTER_API_KEY')
API_URL = 'https://openrouter.ai/api/v1/chat/completions'

# Load actual research corpus
with open('data/research_corpus.json', 'r') as f:
    FULL_CORPUS = json.load(f)

# Simulate filtered corpus (Fast Mode) - keep only endurance recommendations
FILTERED_CORPUS = {
    "populations": [p for p in FULL_CORPUS.get('populations', []) if p['name'] == 'endurance'],
    "recommendations": {
        "pre_workout": FULL_CORPUS.get('recommendations', {}).get('pre_workout', [])[:2],
        "intra_workout": FULL_CORPUS.get('recommendations', {}).get('intra_workout', [])[:2],
        "post_workout": FULL_CORPUS.get('recommendations', {}).get('post_workout', [])[:2]
    },
    "evidence_map": FULL_CORPUS.get('evidence_map', [])[:3]
}

MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.2-24b-instruct',
    'anthropic/claude-3.5-sonnet'
]

def build_prompt(corpus, fast_mode):
    """Build prompt like the real app"""
    return f"""You are a sports nutritionist. Generate a daily meal plan.

## RESEARCH CORPUS
{json.dumps(corpus, indent=2)}

## ATHLETE
70kg male, base phase, 2×60min moderate runs at 09:00 and 10:00
Targets: 3248 kcal, 126g protein, 560g carbs, 56g fat, 4000mg sodium

Return ONLY valid JSON:
{{
  "meals": [
    {{"time": "07:00", "name": "Breakfast", "type": "pre_workout", 
      "foods": [{{"item": "Food", "carbs_g": N, "protein_g": N, "fat_g": N, "sodium_mg": N, "calories": N}}],
      "total_carbs_g": N, "total_protein_g": N, "total_fat_g": N, "total_sodium_mg": N, "total_calories": N,
      "rationale": "Detailed explanation with citations",
      "israel_alternatives": ["Product 1", "Product 2"]}}
  ],
  "daily_totals": {{"calories": 3248, "protein_g": 126, "carbs_g": 560, "fat_g": 56, "sodium_mg": 4000}}
}}

Mode: {'FAST' if fast_mode else 'FULL'}
Generate meal plan in JSON only:"""

def test_model(model_id, fast_mode):
    """Test one model with one mode"""
    mode_label = "FAST" if fast_mode else "FULL"
    corpus = FILTERED_CORPUS if fast_mode else FULL_CORPUS
    prompt = build_prompt(corpus, fast_mode)
    
    print(f'\n  {mode_label} MODE: ~{len(prompt)//4:,} tokens...', end=' ')
    
    start = time.time()
    
    try:
        response = requests.post(
            API_URL,
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model_id,
                'messages': [
                    {'role': 'system', 'content': 'Return ONLY valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 6000,
                'temperature': 0.7
            },
            timeout=90
        )
        
        duration = int((time.time() - start) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Clean
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            first_brace = content.find('{')
            last_brace = content.rfind('}')
            if first_brace != -1:
                content = content[first_brace:last_brace + 1]
            
            parsed = json.loads(content)
            
            if 'meals' in parsed and len(parsed['meals']) > 0:
                meals = len(parsed['meals'])
                foods = sum(len(m.get('foods', [])) for m in parsed['meals'])
                
                # Save
                mode_dir = 'fast_on' if fast_mode else 'fast_off'
                os.makedirs(f'testing/test3_{mode_dir}', exist_ok=True)
                filename = f'testing/test3_{mode_dir}/{model_id.replace("/", "-")}.json'
                with open(filename, 'w') as f:
                    json.dump({
                        'model': model_id,
                        'fast_mode': fast_mode,
                        'duration_ms': duration,
                        'usage': data.get('usage'),
                        'response': parsed
                    }, f, indent=2)
                
                print(f'✅ {duration/1000:.1f}s, {meals} meals, {foods} foods')
                return {'success': True, 'duration': duration, 'meals': meals, 'foods': foods}
        
        print(f'❌ Failed')
        return {'success': False, 'duration': duration}
        
    except Exception as e:
        print(f'❌ {str(e)[:40]}')
        return {'success': False, 'error': str(e)[:50]}

def main():
    print('\n' + '='*80)
    print('🧪 TEST 3: Fast Mode Comparison (FIXED - Real Corpus)')
    print('='*80)
    print(f'\nTesting {len(MODELS)} models with REAL research corpus\n')
    
    results = {}
    
    for i, model in enumerate(MODELS):
        print(f'\n[{i+1}/{len(MODELS)}] {model.split("/")[-1]}:')
        
        # Test with FAST
        fast_result = test_model(model, True)
        time.sleep(3)
        
        # Test with FULL
        full_result = test_model(model, False)
        time.sleep(3)
        
        results[model] = {'fast': fast_result, 'full': full_result}
    
    # Summary
    print('\n' + '='*80)
    print('RESULTS SUMMARY')
    print('='*80)
    
    for model, res in results.items():
        name = model.split('/')[-1]
        print(f'\n{name}:')
        if res['fast']['success'] and res['full']['success']:
            time_diff = ((res['full']['duration'] - res['fast']['duration']) / res['fast']['duration']) * 100
            print(f'  FAST: ✅ {res["fast"]["duration"]/1000:.1f}s')
            print(f'  FULL: ✅ {res["full"]["duration"]/1000:.1f}s')
            print(f'  → Fast mode is {abs(time_diff):.0f}% {"faster" if time_diff > 0 else "slower"}')
        else:
            print(f'  FAST: {"✅" if res["fast"]["success"] else "❌"}')
            print(f'  FULL: {"✅" if res["full"]["success"] else "❌"}')
    
    print('\n✅ Test 3 Complete!')
    print('📁 Results in testing/test3_fast_on/ and testing/test3_fast_off/')

if __name__ == '__main__':
    main()

