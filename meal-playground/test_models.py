#!/usr/bin/env python3
"""
Comprehensive Model Testing Script
Tests all OpenRouter models with identical data and generates comparison report
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

# Models to test
MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.2-24b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o'
]

# Test data
TEST_PROMPT = """Generate a daily meal plan for a 70kg male athlete with:
- Training: 60min moderate run at 09:00 AM
- Phase: Base building
- Goal: Performance
- Diet: Omnivore

Return ONLY valid JSON with:
{
  "athlete_summary": {"weight_kg": 70, "daily_energy_target_kcal": 2800, ...},
  "meals": [
    {"time": "07:00", "name": "Breakfast", "type": "breakfast", "foods": [...], "total_carbs_g": N, "rationale": "...", "israel_alternatives": [...]}
  ],
  "daily_totals": {"calories": N, "protein_g": N, ...},
  "key_recommendations": ["..."]
}

Generate complete meal plan in JSON only (no markdown):"""

def test_model(model_id, test_number):
    """Test a single model"""
    print(f'\n{"="*80}')
    print(f'Test {test_number}/{len(MODELS)}: {model_id}')
    print(f'{"="*80}')
    
    result = {
        'model': model_id,
        'model_name': model_id.split('/')[-1],
        'test_number': test_number,
        'timestamp': datetime.now().isoformat(),
        'success': False,
        'error': None,
        'duration_ms': 0,
        'usage': None,
        'cost': None,
        'meal_count': 0,
        'truncated': False,
        'auto_fixed': False,
        'response_length': 0
    }
    
    start_time = time.time()
    
    try:
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://callback.burnrate.fit',
            'X-Title': 'BurnRate Meal Planner - Model Testing'
        }
        
        payload = {
            'model': model_id,
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a JSON API. Return ONLY valid JSON. No markdown, no explanations.'
                },
                {
                    'role': 'user',
                    'content': TEST_PROMPT
                }
            ],
            'max_tokens': 6000,
            'temperature': 0.7
        }
        
        print(f'  📤 Sending request...')
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        
        duration = int((time.time() - start_time) * 1000)
        result['duration_ms'] = duration
        
        if response.status_code == 200:
            data = response.json()
            result['usage'] = data.get('usage', {})
            
            if 'choices' in data and len(data['choices']) > 0:
                content = data['choices'][0]['message']['content']
                result['response_length'] = len(content)
                
                # Try to parse JSON
                try:
                    # Clean markdown
                    if '```json' in content:
                        content = content.split('```json')[1].split('```')[0].strip()
                    elif '```' in content:
                        content = content.split('```')[1].split('```')[0].strip()
                    
                    # Find JSON bounds
                    first_brace = content.find('{')
                    last_brace = content.rfind('}')
                    if first_brace != -1 and last_brace != -1:
                        content = content[first_brace:last_brace + 1]
                    
                    meal_plan = json.loads(content)
                    
                    # Check for meals
                    if 'meals' in meal_plan and len(meal_plan['meals']) > 0:
                        result['success'] = True
                        result['meal_count'] = len(meal_plan['meals'])
                        
                        # Calculate cost
                        usage = result['usage']
                        if usage and 'prompt_tokens' in usage:
                            # Simple cost calc
                            if 'free' in model_id or 'gemini' in model_id:
                                result['cost'] = 0
                            else:
                                result['cost'] = 0.001
                        
                        print(f'  ✅ SUCCESS in {duration}ms')
                        print(f'  📊 Meals: {result["meal_count"]}')
                        cost_display = "FREE" if result['cost'] == 0 else f"${result['cost']:.6f}"
                        print(f'  💰 Cost: {cost_display}')
                    else:
                        result['error'] = 'Valid JSON but no meals generated'
                        print(f'  ⚠️ PARTIAL SUCCESS: Valid JSON but no meals')
                        
                except json.JSONDecodeError as e:
                    result['error'] = f'Invalid JSON: {str(e)[:50]}'
                    result['truncated'] = result['usage'].get('completion_tokens', 0) >= 5900
                    print(f'  ❌ JSON PARSE ERROR: {str(e)[:100]}')
                    if result['truncated']:
                        print(f'  ⚠️ Response was truncated')
            else:
                result['error'] = 'No content in response'
                print(f'  ❌ No content in response')
        else:
            result['error'] = f'HTTP {response.status_code}: {response.text[:100]}'
            print(f'  ❌ HTTP Error {response.status_code}')
            
    except requests.exceptions.Timeout:
        result['duration_ms'] = 60000
        result['error'] = 'Request timeout (>60s)'
        print(f'  ❌ TIMEOUT after 60 seconds')
    except Exception as e:
        result['duration_ms'] = int((time.time() - start_time) * 1000)
        result['error'] = str(e)[:100]
        print(f'  ❌ EXCEPTION: {str(e)[:100]}')
    
    return result

def main():
    """Run all model tests"""
    print('\n' + '='*80)
    print('🧪 BurnRate AI Meal Planner - Comprehensive Model Testing')
    print('='*80)
    print(f'\nTesting {len(MODELS)} models with identical profile and workout')
    print('Test Profile: 70kg male, base phase, 60min moderate run at 09:00\n')
    
    if not API_KEY:
        print('❌ ERROR: OPENROUTER_API_KEY not found in .env file!')
        return
    
    results = []
    
    for i, model in enumerate(MODELS):
        result = test_model(model, i + 1)
        results.append(result)
        
        # If failed and not Claude, test Claude as fallback
        if not result['success'] and 'claude' not in model:
            print(f'\n  🔄 Testing Claude 3.5 Sonnet as fallback...')
            time.sleep(2)
            claude_result = test_model('anthropic/claude-3.5-sonnet', f'{i+1}.fallback')
            claude_result['is_fallback'] = True
            claude_result['fallback_for'] = model
            results.append(claude_result)
        
        # Rate limit protection
        if i < len(MODELS) - 1:
            print(f'\n  ⏱️ Waiting 3 seconds before next test...')
            time.sleep(3)
    
    # Generate report
    generate_report(results)
    
    # Save results
    save_results(results)
    
    print('\n✅ All tests complete!')
    print(f'📊 Results saved to model-test-results-{datetime.now().date()}.json')

def generate_report(results):
    """Generate comparison table"""
    print('\n\n' + '='*80)
    print('MODEL TEST RESULTS')
    print('='*80 + '\n')
    
    primary_results = [r for r in results if not r.get('is_fallback')]
    
    # Table header
    print(f'{"MODEL":<35} | {"SUCCESS":<10} | {"MEALS":<6} | {"TIME":<8} | {"COST":<10} | {"NOTES"}')
    print('-' * 110)
    
    for result in primary_results:
        model_name = result['model_name'][:34].ljust(34)
        success = '✅ YES' if result['success'] else '❌ NO '
        meals = str(result['meal_count']).ljust(6)
        time_str = f"{result['duration_ms']/1000:.1f}s".ljust(8)
        if result['cost'] == 0:
            cost = 'FREE'
        elif result['cost']:
            cost = f"${result['cost']:.4f}"
        else:
            cost = 'N/A'
        cost = cost.ljust(10)
        
        notes = []
        if result.get('auto_fixed'):
            notes.append('🔧Auto-fix')
        if result.get('truncated'):
            notes.append('⚠️Truncated')
        if result.get('error'):
            notes.append(result['error'][:30])
        
        # Check if fallback worked
        fallback = next((r for r in results if r.get('fallback_for') == result['model']), None)
        if fallback:
            notes.append(f"Claude fallback: {'✅' if fallback['success'] else '❌'}")
        
        notes_str = ', '.join(notes)[:40]
        
        print(f"{model_name} | {success:10} | {meals} | {time_str} | {cost} | {notes_str}")
    
    # Summary
    successful = sum(1 for r in primary_results if r['success'])
    print('\n' + '='*80)
    print(f'\nSUMMARY:')
    print(f'  Total tested: {len(primary_results)}')
    print(f'  Successful: {successful}/{len(primary_results)} ({successful/len(primary_results)*100:.0f}%)')
    print(f'  Failed: {len(primary_results) - successful}')
    print(f'  Auto-fixed: {sum(1 for r in primary_results if r.get("auto_fixed"))}')
    
    # Recommendations
    print(f'\n{"="*80}')
    print('RECOMMENDATIONS:')
    print(f'{"="*80}\n')
    
    for result in primary_results:
        rec = get_recommendation(result, results)
        print(f'{result["model"]:<45} → {rec}')

def get_recommendation(result, all_results):
    """Determine if model should be kept"""
    if result['success'] and result['meal_count'] >= 5 and not result['truncated']:
        return '✅ KEEP - Works reliably'
    elif result['success'] and result.get('auto_fixed'):
        return '⚠️ KEEP with caution - Needs auto-fix'
    elif result.get('truncated'):
        return '❌ REMOVE - Truncates responses'
    elif not result['success']:
        fallback = next((r for r in all_results if r.get('fallback_for') == result['model']), None)
        if fallback and fallback['success']:
            return '❌ REMOVE - Unreliable (but Claude works)'
        else:
            return '❌ REMOVE - Does not work'
    else:
        return '⚠️ REVIEW - Partial functionality'

def save_results(results):
    """Save results to JSON file"""
    report = {
        'test_date': datetime.now().isoformat(),
        'models_tested': len([r for r in results if not r.get('is_fallback')]),
        'test_profile': {
            'weight_kg': 70,
            'training': '60min moderate run',
            'phase': 'base'
        },
        'results': results,
        'summary': {
            'successful': sum(1 for r in results if not r.get('is_fallback') and r['success']),
            'failed': sum(1 for r in results if not r.get('is_fallback') and not r['success']),
            'auto_fixed': sum(1 for r in results if not r.get('is_fallback') and r.get('auto_fixed'))
        }
    }
    
    filename = f'model-test-results-{datetime.now().date()}.json'
    with open(filename, 'w') as f:
        json.dump(report, f, indent=2)
    
    return filename

if __name__ == '__main__':
    main()

