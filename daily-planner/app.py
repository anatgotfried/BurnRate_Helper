from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import json
from generate_skeleton import generate_skeleton_via_node

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)

def normalize_timeline_entry(entry):
    """Normalize hydration units and set defaults"""
    # Convert hydration_l to hydration_ml if needed
    if "hydration_l" in entry and "hydration_ml" not in entry:
        entry["hydration_ml"] = entry["hydration_l"] * 1000
    
    # Set default hydration_ml if missing
    if "hydration_ml" not in entry:
        entry["hydration_ml"] = 0
    
    return entry

def call_openrouter_api(model, prompt, max_tokens=3000, temperature=0.7):
    """Helper function to call OpenRouter API"""
    headers = {
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://callback.burnrate.fit',
        'X-Title': 'BurnRate Daily Planner'
    }
    
    payload = {
        'model': model,
        'messages': [
            {
                'role': 'system',
                'content': 'You are a JSON API. Return ONLY valid JSON. No markdown, no code blocks, no explanations. Your response must start with { and end with }.'
            },
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'max_tokens': max_tokens,
        'temperature': temperature
    }
    
    response = requests.post(
        OPENROUTER_API_URL,
        headers=headers,
        json=payload,
        timeout=60
    )
    
    return response

def parse_json_response(content):
    """Parse JSON from AI response, handling markdown and other formats"""
    cleaned_content = content
    
    # Remove markdown code blocks if present
    if '```json' in cleaned_content:
        cleaned_content = cleaned_content.split('```json')[1].split('```')[0].strip()
    elif '```' in cleaned_content:
        parts = cleaned_content.split('```')
        if len(parts) >= 3:
            cleaned_content = parts[1].strip()
    
    # Remove any leading/trailing text before first { or after last }
    first_brace = cleaned_content.find('{')
    last_brace = cleaned_content.rfind('}')
    
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned_content = cleaned_content[first_brace:last_brace + 1]
    
    # Try to parse JSON
    try:
        return json.loads(cleaned_content)
    except json.JSONDecodeError:
        # Try to fix trailing commas
        import re
        fixed_content = re.sub(r',(\s*[}\]])', r'\1', cleaned_content)
        return json.loads(fixed_content)

@app.route('/api/generate', methods=['POST'])
@app.route('/daily-planner/api/generate', methods=['POST'])
def generate_plan():
    """
    Generate daily plan using OpenRouter API
    
    Expected request body:
    {
        "model": "google/gemini-2.5-flash",
        "prompt": "Full prompt with research corpus and context",
        "max_tokens": 3000
    }
    """
    try:
        if not OPENROUTER_API_KEY:
            return jsonify({
                'success': False,
                'error': 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.'
            }), 500

        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        model = data.get('model', 'google/gemini-2.5-flash')
        prompt_pass1 = data.get('prompt_pass1', '')
        prompt_pass2 = data.get('prompt_pass2', '')
        plan_json = data.get('plan_json', None)  # For Pass 2 only
        max_tokens = data.get('max_tokens', 3000)
        
        # Get athlete data, workouts, locked meals, and targets
        athlete = data.get('athlete', {})
        workouts = data.get('workouts', [])
        locked_meals = data.get('locked_meals', [])
        calculated_targets = data.get('calculated_targets', {})
        
        # Determine if this is a two-pass request or single-pass
        is_two_pass = bool(prompt_pass1 and prompt_pass2)
        is_pass2_only = bool(prompt_pass2 and plan_json)
        
        if not prompt_pass1 and not prompt_pass2:
            # Fallback to old single-prompt format
            old_prompt = data.get('prompt', '')
            if not old_prompt:
                return jsonify({
                    'success': False,
                    'error': 'No prompt provided'
                }), 400
            prompt_pass1 = old_prompt
            is_two_pass = False

        # Pass 0: Generate programmatic skeleton (if we have athlete data)
        skeleton = None
        skeleton_error = None
        if athlete and workouts and calculated_targets and not is_pass2_only:
            try:
                skeleton = generate_skeleton_via_node(athlete, workouts, locked_meals, calculated_targets)
                print(f"✅ Generated skeleton: {skeleton['total_entries']} entries")
                print(f"   - Workout meals: {skeleton['num_workout_entries']}")
                print(f"   - Locked meals: {skeleton['num_locked_entries']}")
                print(f"   - Regular meals: {skeleton['num_regular_entries']}")
            except Exception as e:
                import traceback
                skeleton_error = str(e)
                error_trace = traceback.format_exc()
                print(f"⚠️ Skeleton generation failed: {skeleton_error}")
                print(f"   Trace: {error_trace}")
                # Continue without skeleton - AI will generate everything
                skeleton = None
        
        # Pass 1: Generate computation layer (or refine skeleton)
        if not is_pass2_only:
            # If we have a skeleton, modify the prompt to use it
            if skeleton:
                skeleton_json = json.dumps(skeleton['timeline'], indent=2)
                prompt_pass1 = prompt_pass1.replace(
                    '{SKELETON}',
                    f"Here is a programmatically generated timeline skeleton:\n{skeleton_json}\n\nPlease refine this timeline by:\n1. Filling in meal names (currently null)\n2. Making minor macro adjustments if timing seems impractical (±5% max)\n3. Ensuring timeline makes sense for the athlete\n\nDo NOT change locked meals (marked with 'locked': true). Keep all macro totals within ±2% of targets."
                )
            else:
                # No skeleton - remove placeholder
                prompt_pass1 = prompt_pass1.replace('{SKELETON}', 'Generate the complete timeline from scratch.')
            
            response = call_openrouter_api(model, prompt_pass1, max_tokens, temperature=0.3)

            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    if 'error' in error_json:
                        error_obj = error_json['error']
                        if isinstance(error_obj, dict):
                            error_detail = error_obj.get('message', str(error_obj))
                except:
                    pass
                
                return jsonify({
                    'success': False,
                    'error': error_detail,
                    'status_code': response.status_code,
                    'model_attempted': model,
                    'pass': 1
                }), response.status_code

            result = response.json()
            
            if 'choices' not in result or len(result['choices']) == 0:
                return jsonify({
                    'success': False,
                    'error': 'No content in API response (Pass 1)'
                }), 500
            
            content_pass1 = result['choices'][0]['message']['content']
            plan_data_pass1 = parse_json_response(content_pass1)
            usage_pass1 = result.get('usage', {})
            
            # Schema validation for Pass 1
            required_fields_pass1 = ['daily_summary', 'timeline']
            if not all(field in plan_data_pass1 for field in required_fields_pass1):
                return jsonify({
                    'success': False,
                    'error': 'Missing required fields in Pass 1 response',
                    'raw_content': content_pass1[:1000]
                }), 400
            
            # Normalize timeline entries and recalculate calories
            if 'timeline' in plan_data_pass1:
                for entry in plan_data_pass1['timeline']:
                    normalize_timeline_entry(entry)
                    # CRITICAL: Recalculate calories from macros to ensure accuracy
                    calculated_cals = (entry.get('carbs_g', 0) * 4) + (entry.get('protein_g', 0) * 4) + (entry.get('fat_g', 0) * 9)
                    entry['calories'] = round(calculated_cals)
            
            # Recalculate daily_summary from timeline totals and scale to targets
            if 'daily_summary' in plan_data_pass1 and 'timeline' in plan_data_pass1:
                timeline_totals = {
                    'carbs_g': sum(e.get('carbs_g', 0) for e in plan_data_pass1['timeline']),
                    'protein_g': sum(e.get('protein_g', 0) for e in plan_data_pass1['timeline']),
                    'fat_g': sum(e.get('fat_g', 0) for e in plan_data_pass1['timeline']),
                    'sodium_mg': sum(e.get('sodium_mg', 0) for e in plan_data_pass1['timeline']),
                    'hydration_ml': sum(e.get('hydration_ml', 0) for e in plan_data_pass1['timeline'])
                }
                
                # Get targets from request data (passed from frontend)
                request_data = request.get_json()
                targets = request_data.get('calculated_targets', {})
                
                # Check if we need to scale down to match targets
                tolerance = 0.02  # ±2%
                needs_scaling = False
                
                if targets:
                    target_carbs = targets.get('daily_carb_target_g', 0)
                    target_protein = targets.get('daily_protein_target_g', 0)
                    target_fat = targets.get('daily_fat_target_g', 0)
                    
                    # Check if any macro exceeds target by >2%
                    if target_carbs > 0:
                        carb_diff_pct = abs(timeline_totals['carbs_g'] - target_carbs) / target_carbs
                        if carb_diff_pct > tolerance:
                            needs_scaling = True
                            carb_scale = target_carbs / timeline_totals['carbs_g']
                    
                    if target_protein > 0:
                        protein_diff_pct = abs(timeline_totals['protein_g'] - target_protein) / target_protein
                        if protein_diff_pct > tolerance:
                            needs_scaling = True
                            protein_scale = target_protein / timeline_totals['protein_g']
                    
                    if target_fat > 0:
                        fat_diff_pct = abs(timeline_totals['fat_g'] - target_fat) / target_fat
                        if fat_diff_pct > tolerance:
                            needs_scaling = True
                            fat_scale = target_fat / timeline_totals['fat_g']
                    
                    # If scaling needed, proportionally reduce all timeline entries
                    if needs_scaling:
                        scaling_applied = []
                        
                        # Scale carbs if over target
                        if timeline_totals['carbs_g'] > target_carbs:
                            carb_scale = target_carbs / timeline_totals['carbs_g']
                            for entry in plan_data_pass1['timeline']:
                                entry['carbs_g'] = round(entry['carbs_g'] * carb_scale)
                            scaling_applied.append(f"carbs scaled by {carb_scale:.2f}")
                        
                        # Scale protein if over target
                        if timeline_totals['protein_g'] > target_protein:
                            protein_scale = target_protein / timeline_totals['protein_g']
                            for entry in plan_data_pass1['timeline']:
                                entry['protein_g'] = round(entry['protein_g'] * protein_scale)
                            scaling_applied.append(f"protein scaled by {protein_scale:.2f}")
                        
                        # Scale fat if over target
                        if timeline_totals['fat_g'] > target_fat:
                            fat_scale = target_fat / timeline_totals['fat_g']
                            for entry in plan_data_pass1['timeline']:
                                entry['fat_g'] = round(entry['fat_g'] * fat_scale)
                            scaling_applied.append(f"fat scaled by {fat_scale:.2f}")
                        
                        # Recalculate all calories after scaling
                        for entry in plan_data_pass1['timeline']:
                            calculated_cals = (entry['carbs_g'] * 4) + (entry['protein_g'] * 4) + (entry['fat_g'] * 9)
                            entry['calories'] = round(calculated_cals)
                        
                        # Recalculate totals after scaling
                        timeline_totals['carbs_g'] = sum(e.get('carbs_g', 0) for e in plan_data_pass1['timeline'])
                        timeline_totals['protein_g'] = sum(e.get('protein_g', 0) for e in plan_data_pass1['timeline'])
                        timeline_totals['fat_g'] = sum(e.get('fat_g', 0) for e in plan_data_pass1['timeline'])
                        timeline_totals['calories'] = sum(e.get('calories', 0) for e in plan_data_pass1['timeline'])
                        
                        # Add warning about scaling
                        if 'warnings' not in plan_data_pass1:
                            plan_data_pass1['warnings'] = []
                        plan_data_pass1['warnings'].append(f"Backend auto-scaled to match targets: {', '.join(scaling_applied)}")
                
                # Update daily_summary with calculated totals (after scaling if applied)
                plan_data_pass1['daily_summary']['carbs_g'] = round(timeline_totals['carbs_g'])
                plan_data_pass1['daily_summary']['protein_g'] = round(timeline_totals['protein_g'])
                plan_data_pass1['daily_summary']['fat_g'] = round(timeline_totals['fat_g'])
                plan_data_pass1['daily_summary']['sodium_mg'] = round(timeline_totals['sodium_mg'])
                plan_data_pass1['daily_summary']['hydration_l'] = round(timeline_totals['hydration_ml'] / 1000, 1)
                
                # Calculate calories from macros
                calculated_cals = (timeline_totals['carbs_g'] * 4) + (timeline_totals['protein_g'] * 4) + (timeline_totals['fat_g'] * 9)
                plan_data_pass1['daily_summary']['calories'] = round(calculated_cals)
            
            # If two-pass mode, call Pass 2
            if is_two_pass:
                # Build Pass 2 prompt with plan JSON
                pass2_prompt = prompt_pass2.replace('{PLAN_JSON}', json.dumps(plan_data_pass1, indent=2))
                
                # Call Pass 2
                response_pass2 = call_openrouter_api(model, pass2_prompt, max_tokens=500, temperature=0.7)
                
                if response_pass2.status_code != 200:
                    # If Pass 2 fails, return Pass 1 data without tip
                    plan_data_pass1['daily_tip'] = {'text': 'Tip generation failed - plan is still valid.'}
                    return jsonify({
                        'success': True,
                        'data': plan_data_pass1,
                        'raw_content': content_pass1,
                        'usage': usage_pass1,
                        'model': result.get('model', model),
                        'pass2_failed': True
                    })
                
                result_pass2 = response_pass2.json()
                
                if 'choices' in result_pass2 and len(result_pass2['choices']) > 0:
                    content_pass2 = result_pass2['choices'][0]['message']['content']
                    tip_data = parse_json_response(content_pass2)
                    
                    # Merge tip into plan data
                    if 'daily_tip' in tip_data:
                        plan_data_pass1['daily_tip'] = tip_data['daily_tip']
                    else:
                        plan_data_pass1['daily_tip'] = {'text': 'Tip generated but format invalid.'}
                    
                    # Combine usage
                    usage_pass2 = result_pass2.get('usage', {})
                    combined_usage = {
                        'prompt_tokens': usage_pass1.get('prompt_tokens', 0) + usage_pass2.get('prompt_tokens', 0),
                        'completion_tokens': usage_pass1.get('completion_tokens', 0) + usage_pass2.get('completion_tokens', 0),
                        'total_tokens': usage_pass1.get('total_tokens', 0) + usage_pass2.get('total_tokens', 0)
                    }
                    
                    return jsonify({
                        'success': True,
                        'data': plan_data_pass1,
                        'raw_content': content_pass1,
                        'raw_content_pass2': content_pass2,
                        'usage': combined_usage,
                        'model': result.get('model', model),
                        'two_pass': True
                    })
                else:
                    plan_data_pass1['daily_tip'] = {'text': 'Tip generation failed - plan is still valid.'}
                    return jsonify({
                        'success': True,
                        'data': plan_data_pass1,
                        'raw_content': content_pass1,
                        'usage': usage_pass1,
                        'model': result.get('model', model),
                        'pass2_failed': True
                    })
            else:
                # Single-pass mode (backward compatibility)
                if 'daily_tip' not in plan_data_pass1:
                    plan_data_pass1['daily_tip'] = {'text': ''}
                
                return jsonify({
                    'success': True,
                    'data': plan_data_pass1,
                    'raw_content': content_pass1,
                    'usage': usage_pass1,
                    'model': result.get('model', model)
                })

    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'Request timeout. The AI model took too long to respond.'
        }), 504
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'Network error: {str(e)}'
        }), 500
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Server error: {error_trace}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'trace': error_trace if app.debug else None
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5002)

