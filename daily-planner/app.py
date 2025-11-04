from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import json

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
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 3000)

        if not prompt:
            return jsonify({
                'success': False,
                'error': 'No prompt provided'
            }), 400

        # Prepare OpenRouter API request
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
            'temperature': 0.7
        }

        # Call OpenRouter API
        response = requests.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )

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
                'model_attempted': model
            }), response.status_code

        result = response.json()
        
        # Extract the generated content
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            
            # Try to parse as JSON
            try:
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
                
                # Parse JSON
                plan_data = json.loads(cleaned_content)
                
                # Schema validation
                required_fields = ['daily_summary', 'timeline', 'daily_tip']
                if not all(field in plan_data for field in required_fields):
                    return jsonify({
                        'success': False,
                        'error': 'Missing required fields in response',
                        'raw_content': content[:1000]
                    }), 400
                
                # Normalize timeline entries
                if 'timeline' in plan_data:
                    for entry in plan_data['timeline']:
                        normalize_timeline_entry(entry)
                
                return jsonify({
                    'success': True,
                    'data': plan_data,
                    'raw_content': content,
                    'usage': result.get('usage', {}),
                    'model': result.get('model', model)
                })
                
            except json.JSONDecodeError as e:
                # Try to fix common JSON errors
                try:
                    import re
                    fixed_content = re.sub(r',(\s*[}\]])', r'\1', cleaned_content)
                    plan_data = json.loads(fixed_content)
                    
                    # Normalize timeline entries
                    if 'timeline' in plan_data:
                        for entry in plan_data['timeline']:
                            normalize_timeline_entry(entry)
                    
                    return jsonify({
                        'success': True,
                        'data': plan_data,
                        'raw_content': content,
                        'auto_fixed': 'trailing_commas',
                        'usage': result.get('usage', {}),
                        'model': result.get('model', model)
                    })
                except:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid JSON: {str(e)}',
                        'raw_content': cleaned_content[:1000],
                        'usage': result.get('usage', {}),
                        'model': result.get('model', model)
                    }), 400
        else:
            return jsonify({
                'success': False,
                'error': 'No content in API response'
            }), 500

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
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5002)

