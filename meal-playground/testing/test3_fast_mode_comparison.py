#!/usr/bin/env python3
"""
TEST 3: Fast Mode Comparison
Tests each model with Fast Mode ON vs OFF to see if quality differs
GPT-4o will evaluate if token reduction affects output quality
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

# All 7 working models (GPT-4o removed in v1.4.0)
MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.2-24b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet'
]

# Full research corpus (simulated - using minimal version)
FULL_CORPUS_PROMPT = """Generate a complete daily meal plan for:
- 70kg male, base phase
- 2 workouts: 60min moderate run at 09:00, 60min at 10:00
- Targets: 3248 kcal, 126g protein, 560g carbs, 56g fat, 4000mg sodium

[FULL 49KB RESEARCH CORPUS INCLUDED - All guidelines, all populations, all contexts]

Return ONLY valid JSON with meals array containing foods, portions, sodium, rationales, Israel alternatives."""

# Filtered corpus (Fast Mode)
FAST_CORPUS_PROMPT = """Generate a complete daily meal plan for:
- 70kg male, base phase  
- 2 workouts: 60min moderate run at 09:00, 60min at 10:00
- Targets: 3248 kcal, 126g protein, 560g carbs, 56g fat, 4000mg sodium

[FILTERED RESEARCH CORPUS - Only endurance, moderate intensity, omnivore guidelines]

Return ONLY valid JSON with meals array containing foods, portions, sodium, rationales, Israel alternatives."""

def test_model_with_mode(model_id, fast_mode, test_number):
    """Test a model with Fast Mode ON or OFF"""
    mode_label = "FAST" if fast_mode else "FULL"
    print(f'\n{"="*80}')
    print(f'TEST 3 - {mode_label}: {test_number} - {model_id}')
    print(f'{"="*80}')
    
    prompt = FAST_CORPUS_PROMPT if fast_mode else FULL_CORPUS_PROMPT
    prompt_size = len(prompt)
    
    result = {
        'model': model_id,
        'model_name': model_id.split('/')[-1],
        'fast_mode': fast_mode,
        'test_number': test_number,
        'timestamp': datetime.now().isoformat(),
        'success': False,
        'duration_ms': 0,
        'prompt_size_chars': prompt_size,
        'prompt_size_tokens_est': prompt_size // 4,
        'usage': None,
        'meal_count': 0,
        'food_count': 0,
        'response': None
    }
    
    start_time = time.time()
    
    try:
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://callback.burnrate.fit',
            'X-Title': f'BurnRate Test 3 - {mode_label}'
        }
        
        payload = {
            'model': model_id,
            'messages': [
                {'role': 'system', 'content': 'You are a JSON API. Return ONLY valid JSON.'},
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': 6000,
            'temperature': 0.7
        }
        
        print(f'  📤 Sending {mode_label} request (~{result["prompt_size_tokens_est"]} tokens)...')
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
                    result['response'] = parsed
                    
                    if 'meals' in parsed and len(parsed['meals']) > 0:
                        result['success'] = True
                        result['meal_count'] = len(parsed['meals'])
                        result['food_count'] = sum(len(m.get('foods', [])) for m in parsed['meals'])
                        
                        # Save
                        mode_dir = 'fast_on' if fast_mode else 'fast_off'
                        os.makedirs(f'testing/test3_{mode_dir}', exist_ok=True)
                        filename = f'testing/test3_{mode_dir}/{model_id.replace("/", "-")}.json'
                        with open(filename, 'w') as f:
                            json.dump({
                                'model': model_id,
                                'fast_mode': fast_mode,
                                'timestamp': result['timestamp'],
                                'duration_ms': result['duration_ms'],
                                'usage': result['usage'],
                                'response': parsed
                            }, f, indent=2)
                        
                        print(f'  ✅ SUCCESS - {result["duration_ms"]}ms')
                        print(f'  📊 Meals: {result["meal_count"]}, Foods: {result["food_count"]}')
                        print(f'  💾 Saved: {filename}')
                    else:
                        result['error'] = 'No meals'
                        print(f'  ⚠️ No meals generated')
                        
                except json.JSONDecodeError as e:
                    result['error'] = f'JSON error: {str(e)[:50]}'
                    print(f'  ❌ JSON ERROR')
        else:
            result['error'] = f'HTTP {response.status_code}'
            print(f'  ❌ HTTP {response.status_code}')
            
    except Exception as e:
        result['duration_ms'] = int((time.time() - start_time) * 1000)
        result['error'] = str(e)[:100]
        print(f'  ❌ EXCEPTION: {str(e)[:60]}')
    
    return result

def main():
    print('\n' + '='*80)
    print('🧪 TEST 3: Fast Mode Comparison (ON vs OFF)')
    print('='*80)
    print(f'\nTesting {len(MODELS)} models × 2 modes = {len(MODELS)*2} total runs')
    print('This will take ~12-15 minutes\n')
    
    if not API_KEY:
        print('❌ ERROR: OPENROUTER_API_KEY not found!')
        return
    
    all_results = []
    test_num = 0
    
    # Test each model with BOTH modes
    for model in MODELS:
        # Fast Mode ON
        test_num += 1
        result_on = test_model_with_mode(model, True, test_num)
        all_results.append(result_on)
        time.sleep(3)
        
        # Fast Mode OFF  
        test_num += 1
        result_off = test_model_with_mode(model, False, test_num)
        all_results.append(result_off)
        time.sleep(3)
    
    # Save summary
    summary = {
        'test_date': datetime.now().isoformat(),
        'test_type': 'fast_mode_comparison',
        'models_tested': len(MODELS),
        'total_runs': len(all_results),
        'results': all_results
    }
    
    with open('testing/test3-summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Report
    print('\n' + '='*80)
    print('TEST 3 RESULTS - Fast Mode Comparison')
    print('='*80 + '\n')
    
    for model in MODELS:
        model_name = model.split('/')[-1]
        on_result = next((r for r in all_results if r['model'] == model and r['fast_mode']), None)
        off_result = next((r for r in all_results if r['model'] == model and not r['fast_mode']), None)
        
        if on_result and off_result:
            on_status = '✅' if on_result['success'] else '❌'
            off_status = '✅' if off_result['success'] else '❌'
            
            print(f'{model_name}:')
            print(f'  FAST ON:  {on_status} {on_result["duration_ms"]/1000:.1f}s, {on_result["meal_count"]} meals')
            print(f'  FAST OFF: {off_status} {off_result["duration_ms"]/1000:.1f}s, {off_result["meal_count"]} meals')
            
            if on_result['success'] and off_result['success']:
                time_diff = ((off_result['duration_ms'] - on_result['duration_ms']) / on_result['duration_ms']) * 100
                print(f'  → Speed difference: {time_diff:+.1f}%')
            print()
    
    print(f'✅ Test 3 Complete!')
    print(f'📁 Fast ON: testing/test3_fast_on/')
    print(f'📁 Fast OFF: testing/test3_fast_off/')
    print(f'\nReady for GPT-4o comparison scoring!')

if __name__ == '__main__':
    main()
