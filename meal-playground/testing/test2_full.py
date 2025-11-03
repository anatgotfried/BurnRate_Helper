#!/usr/bin/env python3
"""
TEST 2: Full Meal Generation
Tests models on complete prompt - full meals with foods, portions, rationales, Israel alternatives
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

# Working models (8 total)
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

# Full prompt for TEST 2
TEST2_PROMPT = """Generate a complete daily meal plan for:
- 70kg male athlete, base training phase
- 2 workouts: 60min moderate run at 09:00, 60min moderate run at 10:00
- Targets: 3248 kcal, 126g protein, 560g carbs, 56g fat, 4000mg sodium

Return ONLY valid JSON with this structure:
{
  "athlete_summary": {
    "weight_kg": 70,
    "daily_energy_target_kcal": 3248,
    "daily_protein_target_g": 126,
    "daily_carb_target_g": 560,
    "daily_fat_target_g": 56,
    "sodium_target_mg": 4000
  },
  "meals": [
    {
      "time": "07:00",
      "name": "Breakfast",
      "type": "pre_workout",
      "foods": [
        {
          "item": "Oatmeal, 1 cup cooked (180g)",
          "carbs_g": 27,
          "protein_g": 6,
          "fat_g": 3,
          "sodium_mg": 5,
          "calories": 150
        }
      ],
      "total_carbs_g": 27,
      "total_protein_g": 6,
      "total_fat_g": 3,
      "total_sodium_mg": 5,
      "total_calories": 150,
      "rationale": "3-5 sentences explaining food choices, timing, and research citations (ISSN2017, ACSM2016)",
      "israel_alternatives": ["Tnuva product 1", "Osem product 2", "Yotvata product 3"]
    }
  ],
  "daily_totals": {
    "calories": 3248,
    "carbs_g": 560,
    "protein_g": 126,
    "fat_g": 56,
    "sodium_mg": 4000,
    "protein_per_kg": 1.8,
    "carbs_per_kg": 8.0
  },
  "key_recommendations": ["Recommendation 1", "Recommendation 2"]
}

Generate complete meal plan in JSON only (no markdown):"""

def test_model_full(model_id, test_number):
    """Test a single model on full meal generation"""
    print(f'\n{"="*80}')
    print(f'TEST 2 - Full: {test_number}/8 - {model_id}')
    print(f'{"="*80}')
    
    result = {
        'test_type': 'full_meals',
        'model': model_id,
        'model_name': model_id.split('/')[-1],
        'test_number': test_number,
        'timestamp': datetime.now().isoformat(),
        'success': False,
        'duration_ms': 0,
        'usage': None,
        'meal_count': 0,
        'total_food_items': 0,
        'has_israel_alternatives': False,
        'json_valid': False,
        'response': None
    }
    
    start_time = time.time()
    
    try:
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://callback.burnrate.fit',
            'X-Title': 'BurnRate Test 2 - Full'
        }
        
        payload = {
            'model': model_id,
            'messages': [
                {'role': 'system', 'content': 'You are a JSON API. Return ONLY valid JSON with detailed meal plans.'},
                {'role': 'user', 'content': TEST2_PROMPT}
            ],
            'max_tokens': 6000,
            'temperature': 0.7
        }
        
        print(f'  📤 Sending full meal request...')
        response = requests.post(API_URL, headers=headers, json=payload, timeout=90)
        
        result['duration_ms'] = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            result['usage'] = data.get('usage', {})
            
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                
                # Clean
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
                    
                    if 'meals' in parsed and len(parsed['meals']) > 0:
                        result['success'] = True
                        result['meal_count'] = len(parsed['meals'])
                        
                        # Count food items
                        total_foods = sum(len(m.get('foods', [])) for m in parsed['meals'])
                        result['total_food_items'] = total_foods
                        
                        # Check Israel alternatives
                        has_israel = any('israel_alternatives' in m for m in parsed['meals'])
                        result['has_israel_alternatives'] = has_israel
                        
                        # Save
                        filename = f'testing/test2_full/{model_id.replace("/", "-")}.json'
                        with open(filename, 'w') as f:
                            json.dump({
                                'model': model_id,
                                'test_type': 'full_meals',
                                'timestamp': result['timestamp'],
                                'duration_ms': result['duration_ms'],
                                'usage': result['usage'],
                                'response': parsed
                            }, f, indent=2)
                        
                        print(f'  ✅ SUCCESS - {result["duration_ms"]}ms')
                        print(f'  📊 Meals: {result["meal_count"]}, Foods: {total_foods}')
                        print(f'  🇮🇱 Israel alts: {"Yes" if has_israel else "No"}')
                        print(f'  💾 Saved: {filename}')
                    else:
                        result['error'] = 'No meals in response'
                        print(f'  ⚠️ No meals generated')
                        
                except json.JSONDecodeError as e:
                    result['error'] = f'JSON parse: {str(e)[:50]}'
                    print(f'  ❌ JSON ERROR: {str(e)[:80]}')
        else:
            result['error'] = f'HTTP {response.status_code}'
            print(f'  ❌ HTTP {response.status_code}')
            
    except Exception as e:
        result['duration_ms'] = int((time.time() - start_time) * 1000)
        result['error'] = str(e)[:100]
        print(f'  ❌ EXCEPTION: {str(e)[:100]}')
    
    return result

def main():
    print('\n' + '='*80)
    print('🧪 TEST 2: Full Meal Generation with Foods & Details')
    print('='*80)
    print(f'\nTesting {len(MODELS)} models on complete meal plan generation\n')
    
    if not API_KEY:
        print('❌ ERROR: OPENROUTER_API_KEY not found!')
        return
    
    results = []
    
    for i, model in enumerate(MODELS):
        result = test_model_full(model, i + 1)
        results.append(result)
        
        if i < len(MODELS) - 1:
            print(f'  ⏱️ Waiting 4 seconds...')
            time.sleep(4)
    
    # Save summary
    summary = {
        'test_date': datetime.now().isoformat(),
        'test_type': 'full_meals',
        'models_tested': len(MODELS),
        'successful': sum(1 for r in results if r['success']),
        'results': results
    }
    
    with open('testing/test2-summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Report
    print('\n' + '='*80)
    print('TEST 2 RESULTS')
    print('='*80 + '\n')
    
    for r in results:
        status = '✅' if r['success'] else '❌'
        print(f"{status} {r['model_name']:<35} {r['duration_ms']/1000:.1f}s  Meals:{r['meal_count']}  Foods:{r['total_food_items']}  Israel:{r['has_israel_alternatives']}")
    
    success_rate = sum(1 for r in results if r['success']) / len(results) * 100
    print(f'\n✅ Test 2 Complete: {len(results)} models, {success_rate:.0f}% success')
    print(f'📁 Results saved to testing/test2_full/')

if __name__ == '__main__':
    main()

