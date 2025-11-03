#!/usr/bin/env python3
"""
TEST 1: Meal Structure + Rationale Only
Tests models on lighter prompt - just meal structure, timing, rationale
No detailed food items needed
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

# Working models (8 total - Gemini 2.5 Pro removed)
MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.2-24b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o'
]

# Lightweight prompt for TEST 1
TEST1_PROMPT = """Create a daily meal structure and timing plan for:
- 70kg male athlete
- Base training phase
- 2 workouts: 60min moderate run at 09:00, 60min moderate run at 10:00
- Target: 3248 kcal, 126g protein, 560g carbs, 56g fat, 4000mg sodium

Return ONLY JSON with meal structure (no specific foods yet):
{
  "meal_structure": [
    {
      "time": "07:00",
      "type": "pre_workout",
      "calories_target": 500,
      "protein_target_g": 20,
      "carbs_target_g": 80,
      "fat_target_g": 8,
      "sodium_target_mg": 300,
      "rationale": "Detailed 3-5 sentence explanation with research citations (ISSN2017, ACSM2016, etc.)",
      "timing_notes": "Why this timing relative to workouts"
    }
  ],
  "daily_totals_check": {
    "total_calories": 3248,
    "total_protein_g": 126,
    "total_carbs_g": 560,
    "total_fat_g": 56,
    "total_sodium_mg": 4000
  },
  "structure_quality": "Brief assessment of the meal timing strategy"
}

Generate meal structure in JSON only:"""

def test_model_structure(model_id, test_number):
    """Test a single model on structure generation"""
    print(f'\n{"="*80}')
    print(f'TEST 1 - Structure: {test_number}/8 - {model_id}')
    print(f'{"="*80}')
    
    result = {
        'test_type': 'structure_only',
        'model': model_id,
        'model_name': model_id.split('/')[-1],
        'test_number': test_number,
        'timestamp': datetime.now().isoformat(),
        'success': False,
        'duration_ms': 0,
        'usage': None,
        'meal_count': 0,
        'has_rationales': False,
        'json_valid': False,
        'response': None
    }
    
    start_time = time.time()
    
    try:
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://callback.burnrate.fit',
            'X-Title': 'BurnRate Test 1 - Structure'
        }
        
        payload = {
            'model': model_id,
            'messages': [
                {'role': 'system', 'content': 'You are a JSON API. Return ONLY valid JSON.'},
                {'role': 'user', 'content': TEST1_PROMPT}
            ],
            'max_tokens': 2000,  # Smaller - just structure
            'temperature': 0.7
        }
        
        print(f'  📤 Sending structure request...')
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        
        result['duration_ms'] = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            result['usage'] = data.get('usage', {})
            
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                
                # Clean and parse
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                
                first_brace = content.find('{')
                last_brace = content.rfind('}')
                if first_brace != -1 and last_brace != -1:
                    content = content[first_brace:last_brace + 1]
                
                try:
                    parsed = json.loads(content)
                    result['json_valid'] = True
                    result['response'] = parsed
                    
                    # Check for meal structure
                    if 'meal_structure' in parsed:
                        result['success'] = True
                        result['meal_count'] = len(parsed['meal_structure'])
                        
                        # Check if rationales exist
                        if result['meal_count'] > 0:
                            has_rationale = 'rationale' in parsed['meal_structure'][0]
                            result['has_rationales'] = has_rationale
                        
                        # Save response
                        filename = f'test1_structure/{model_id.replace("/", "-")}.json'
                        with open(filename, 'w') as f:
                            json.dump({
                                'model': model_id,
                                'test_type': 'structure_only',
                                'timestamp': result['timestamp'],
                                'duration_ms': result['duration_ms'],
                                'usage': result['usage'],
                                'response': parsed
                            }, f, indent=2)
                        
                        print(f'  ✅ SUCCESS - {result["duration_ms"]}ms')
                        print(f'  📊 Meals: {result["meal_count"]}')
                        print(f'  📝 Rationales: {"Yes" if result["has_rationales"] else "No"}')
                        print(f'  💾 Saved: {filename}')
                    else:
                        result['error'] = 'No meal_structure in response'
                        print(f'  ⚠️ No meal_structure found')
                        
                except json.JSONDecodeError as e:
                    result['error'] = f'JSON parse error: {str(e)[:50]}'
                    print(f'  ❌ JSON ERROR: {str(e)[:80]}')
        else:
            result['error'] = f'HTTP {response.status_code}'
            print(f'  ❌ HTTP Error {response.status_code}')
            
    except Exception as e:
        result['duration_ms'] = int((time.time() - start_time) * 1000)
        result['error'] = str(e)[:100]
        print(f'  ❌ EXCEPTION: {str(e)[:100]}')
    
    return result

def main():
    print('\n' + '='*80)
    print('🧪 TEST 1: Meal Structure + Rationale Generation')
    print('='*80)
    print(f'\nTesting {len(MODELS)} models on lightweight structure prompt')
    print('Prompt: Create meal timing structure with rationales (no detailed foods)\n')
    
    if not API_KEY:
        print('❌ ERROR: OPENROUTER_API_KEY not found!')
        return
    
    results = []
    
    for i, model in enumerate(MODELS):
        result = test_model_structure(model, i + 1)
        results.append(result)
        
        if i < len(MODELS) - 1:
            print(f'  ⏱️ Waiting 3 seconds...')
            time.sleep(3)
    
    # Save summary
    summary = {
        'test_date': datetime.now().isoformat(),
        'test_type': 'structure_only',
        'models_tested': len(MODELS),
        'successful': sum(1 for r in results if r['success']),
        'results': results
    }
    
    with open('testing/test1-summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Report
    print('\n' + '='*80)
    print('TEST 1 RESULTS')
    print('='*80 + '\n')
    
    for r in results:
        status = '✅' if r['success'] else '❌'
        print(f"{status} {r['model_name']:<35} {r['duration_ms']/1000:.1f}s  Meals:{r['meal_count']}  Rationales:{r['has_rationales']}")
    
    success_rate = sum(1 for r in results if r['success']) / len(results) * 100
    print(f'\n✅ Test 1 Complete: {len(results)} models, {success_rate:.0f}% success')
    print(f'📁 Results saved to testing/test1_structure/')

if __name__ == '__main__':
    main()

