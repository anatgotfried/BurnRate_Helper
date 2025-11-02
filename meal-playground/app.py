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

@app.route('/api/generate', methods=['POST'])
def generate_meal_plan():
    """
    Generate meal plan using OpenRouter API
    
    Expected request body:
    {
        "model": "google/gemini-flash-1.5",
        "prompt": "Full prompt with research corpus and context",
        "max_tokens": 4000
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

        model = data.get('model', 'google/gemini-flash-1.5')
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 4000)

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
            'X-Title': 'BurnRate Meal Playground'
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
            error_type = 'Unknown error'
            
            try:
                error_json = response.json()
                # OpenRouter error structure
                if 'error' in error_json:
                    error_obj = error_json['error']
                    if isinstance(error_obj, dict):
                        error_detail = error_obj.get('message', str(error_obj))
                        error_type = error_obj.get('code', 'unknown')
                        # Get provider-specific error if available
                        if 'metadata' in error_obj:
                            provider_error = error_obj['metadata'].get('raw', '')
                            if provider_error:
                                error_detail += f"\n\nProvider details: {provider_error}"
                    else:
                        error_detail = str(error_obj)
            except Exception as parse_err:
                error_detail = f"Could not parse error response: {response.text[:500]}"
            
            # Create helpful error message based on common patterns
            helpful_msg = error_detail
            error_lower = error_detail.lower()
            
            if response.status_code == 401:
                helpful_msg = "🔑 Authentication failed. Your OpenRouter API key is invalid or missing. Check Vercel environment variables."
            elif response.status_code == 402:
                helpful_msg = "💳 Insufficient credits. Add credits at https://openrouter.ai/credits (even $5 gives you 1000+ meal plans!)"
            elif response.status_code == 429:
                helpful_msg = "⏱️ Rate limit exceeded. You've made too many requests. Wait 30-60 seconds and try again."
            elif 'context_length_exceeded' in error_lower or 'maximum context' in error_lower:
                helpful_msg = "📏 Prompt too long for this model. Try: 1) Remove some workouts, 2) Use a model with larger context (Claude or GPT-4o), or 3) Simplify your profile."
            elif 'invalid model' in error_lower or 'not found' in error_lower or 'no endpoints' in error_lower:
                helpful_msg = f"🤖 Model '{model}' is not available or has no active endpoints. Try these working models: 'Claude 3.5 Sonnet', 'GPT-4o Mini', or 'Claude 3 Haiku'."
            elif 'moderation' in error_lower or 'policy' in error_lower:
                helpful_msg = "🚫 Content was flagged by moderation. This shouldn't happen with meal plans - try a different model."
            elif 'timeout' in error_lower:
                helpful_msg = "⏰ Request timed out. The model took too long to respond. Try again or use a faster model like Gemini Flash."
            elif 'provider returned error' in error_lower:
                helpful_msg = f"⚡ The AI provider ({model.split('/')[0]}) encountered an error. This usually means: 1) Model is temporarily unavailable, 2) Your prompt triggered a safety filter, or 3) Model has an outage. Try a different model (Claude 3.5 Sonnet is very reliable)."
            elif 'bad gateway' in error_lower or '502' in error_detail or '503' in error_detail:
                helpful_msg = "🔧 OpenRouter or the AI provider is temporarily down. Wait a minute and try again, or switch models."
            
            return jsonify({
                'success': False,
                'error': helpful_msg,
                'error_type': error_type,
                'raw_error': error_detail,
                'status_code': response.status_code,
                'model_attempted': model
            }), response.status_code

        result = response.json()
        
        # Extract the generated content
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            
            # Try to parse as JSON with aggressive cleaning
            try:
                cleaned_content = content
                
                # Remove markdown code blocks if present
                if '```json' in cleaned_content:
                    cleaned_content = cleaned_content.split('```json')[1].split('```')[0].strip()
                elif '```' in cleaned_content:
                    # Find content between first ``` and last ```
                    parts = cleaned_content.split('```')
                    if len(parts) >= 3:
                        cleaned_content = parts[1].strip()
                
                # Remove any leading/trailing text before first { or after last }
                first_brace = cleaned_content.find('{')
                last_brace = cleaned_content.rfind('}')
                
                if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                    cleaned_content = cleaned_content[first_brace:last_brace + 1]
                
                # Try to parse
                meal_plan = json.loads(cleaned_content)
                
                return jsonify({
                    'success': True,
                    'meal_plan': meal_plan,
                    'raw_content': content,
                    'usage': result.get('usage', {}),
                    'model': result.get('model', model)
                })
            except json.JSONDecodeError as e:
                # Try to fix common JSON errors
                try:
                    # Remove trailing commas before } or ]
                    import re
                    fixed_content = re.sub(r',(\s*[}\]])', r'\1', cleaned_content)
                    meal_plan = json.loads(fixed_content)
                    
                    return jsonify({
                        'success': True,
                        'meal_plan': meal_plan,
                        'raw_content': content,
                        'fixed': True,
                        'usage': result.get('usage', {}),
                        'model': result.get('model', model)
                    })
                except:
                    # Return error with helpful context
                    error_line = str(e).split('line ')[-1].split(' ')[0] if 'line' in str(e) else 'unknown'
                    return jsonify({
                        'success': False,
                        'error': f'Invalid JSON at line {error_line}. Try Claude 3.5 Sonnet for better JSON formatting.',
                        'raw_content': cleaned_content,
                        'parse_error': str(e),
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

@app.route('/api/models', methods=['GET'])
def get_models():
    """Return list of available models"""
    models = [
        {
            'id': 'anthropic/claude-3-haiku-20240307',
            'name': 'Claude 3 Haiku',
            'provider': 'Anthropic',
            'cost': 'Low',
            'description': 'Reliable and affordable (~$0.005/plan) - Recommended'
        },
        {
            'id': 'openai/gpt-3.5-turbo',
            'name': 'GPT-3.5 Turbo',
            'provider': 'OpenAI',
            'cost': 'Low',
            'description': 'Reliable and well-tested (~$0.008/plan)'
        },
        {
            'id': 'openai/gpt-4o-mini',
            'name': 'GPT-4o Mini',
            'provider': 'OpenAI',
            'cost': 'Medium',
            'description': 'Great balance of capability and cost (~$0.015/plan)'
        },
        {
            'id': 'anthropic/claude-3.5-sonnet-20241022',
            'name': 'Claude 3.5 Sonnet',
            'provider': 'Anthropic',
            'cost': 'Medium',
            'description': 'Best quality, perfect JSON, detailed explanations (~$0.025/plan)'
        },
        {
            'id': 'google/gemini-2.0-flash-exp:free',
            'name': 'Gemini 2.0 Flash (Free)',
            'provider': 'Google',
            'cost': 'FREE',
            'description': 'Free - limited availability, may have rate limits'
        }
    ]
    
    return jsonify({
        'success': True,
        'models': models
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)

