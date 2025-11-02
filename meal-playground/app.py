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
                # Try to fix common JSON errors first
                try:
                    import re
                    fixed_content = re.sub(r',(\s*[}\]])', r'\1', cleaned_content)
                    meal_plan = json.loads(fixed_content)
                    
                    return jsonify({
                        'success': True,
                        'meal_plan': meal_plan,
                        'raw_content': content,
                        'auto_fixed': 'trailing_commas',
                        'usage': result.get('usage', {}),
                        'model': result.get('model', model)
                    })
                except:
                    # Auto-retry: Send back to AI to fix its own JSON
                    print(f"JSON parse failed, attempting self-healing with model {model}...")
                    
                    try:
                        healing_prompt = f"""The following JSON is invalid. Fix all syntax errors and return ONLY valid JSON. Do not add any text before or after the JSON.

Common errors to fix:
- Trailing commas before }} or ]
- Missing commas between objects
- Unescaped quotes in strings
- Unclosed brackets

Invalid JSON:
{cleaned_content}

Return the corrected JSON only (no markdown, no explanations):"""

                        healing_response = requests.post(
                            OPENROUTER_API_URL,
                            headers=headers,
                            json={
                                'model': model,
                                'messages': [
                                    {
                                        'role': 'system',
                                        'content': 'You are a JSON validator. Fix the broken JSON and return only valid JSON. No explanations.'
                                    },
                                    {
                                        'role': 'user',
                                        'content': healing_prompt
                                    }
                                ],
                                'max_tokens': max_tokens,
                                'temperature': 0.3  # Lower temp for precise fixing
                            },
                            timeout=30
                        )
                        
                        if healing_response.status_code == 200:
                            healing_result = healing_response.json()
                            if 'choices' in healing_result and len(healing_result['choices']) > 0:
                                healed_content = healing_result['choices'][0]['message']['content']
                                
                                # Extract JSON
                                if '```json' in healed_content:
                                    healed_content = healed_content.split('```json')[1].split('```')[0].strip()
                                elif '```' in healed_content:
                                    healed_content = healed_content.split('```')[1].split('```')[0].strip()
                                
                                first_brace = healed_content.find('{')
                                last_brace = healed_content.rfind('}')
                                if first_brace != -1 and last_brace != -1:
                                    healed_content = healed_content[first_brace:last_brace + 1]
                                
                                # Try parsing healed JSON
                                meal_plan = json.loads(healed_content)
                                
                                print(f"✅ JSON self-healing successful!")
                                return jsonify({
                                    'success': True,
                                    'meal_plan': meal_plan,
                                    'raw_content': content,
                                    'auto_fixed': 'self_healing',
                                    'usage': result.get('usage', {}),
                                    'model': result.get('model', model)
                                })
                    except Exception as healing_error:
                        print(f"Self-healing failed: {healing_error}")
                    
                    # If all fixes fail, return error
                    error_line = str(e).split('line ')[-1].split(' ')[0] if 'line' in str(e) else 'unknown'
                    return jsonify({
                        'success': False,
                        'error': f'Invalid JSON at line {error_line}. Auto-fix failed. Try Claude 3.5 Sonnet for better JSON formatting.',
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
            'id': 'google/gemini-2.5-flash',
            'name': 'Gemini 2.5 Flash ⭐',
            'provider': 'Google',
            'cost': 'FREE',
            'description': '1M context, newest & best, FREE with your Google key - Recommended'
        },
        {
            'id': 'google/gemini-2.5-pro',
            'name': 'Gemini 2.5 Pro',
            'provider': 'Google',
            'cost': 'FREE',
            'description': '1M context, smartest Gemini, FREE'
        },
        {
            'id': 'google/gemini-2.0-flash-001',
            'name': 'Gemini 2.0 Flash',
            'provider': 'Google',
            'cost': 'FREE',
            'description': '1M context, stable version, FREE'
        },
        {
            'id': 'google/gemini-2.0-flash-exp:free',
            'name': 'Gemini 2.0 Flash Exp (Free Tier)',
            'provider': 'Google',
            'cost': 'FREE',
            'description': '1M context, experimental, shared limits'
        },
        {
            'id': 'mistralai/mistral-small-3.2-24b-instruct',
            'name': 'Mistral Small 3.2',
            'provider': 'Mistral',
            'cost': 'Very Low',
            'description': '131k context, ultra-cheap (~$0.001/plan)'
        },
        {
            'id': 'qwen/qwen-2.5-72b-instruct',
            'name': 'Qwen 2.5 72B',
            'provider': 'Qwen',
            'cost': 'Very Low',
            'description': 'Great with numbers & logic (~$0.0015/plan)'
        },
        {
            'id': 'openai/gpt-4o-mini',
            'name': 'GPT-4o Mini',
            'provider': 'OpenAI',
            'cost': 'Low',
            'description': '128k context, well-tested (~$0.003/plan)'
        },
        {
            'id': 'mistralai/mistral-medium-3.1',
            'name': 'Mistral Medium 3.1',
            'provider': 'Mistral',
            'cost': 'Low',
            'description': '131k context, smarter (~$0.003/plan)'
        },
        {
            'id': 'cohere/command-r-plus-08-2024',
            'name': 'Cohere Command R+',
            'provider': 'Cohere',
            'cost': 'Low',
            'description': '128k context, consistent JSON (~$0.005/plan)'
        },
        {
            'id': 'anthropic/claude-sonnet-4.5',
            'name': 'Claude Sonnet 4.5 (NEW)',
            'provider': 'Anthropic',
            'cost': 'Medium',
            'description': '1M context, best quality (~$0.030/plan)'
        },
        {
            'id': 'openai/gpt-4o',
            'name': 'GPT-4o',
            'provider': 'OpenAI',
            'cost': 'Medium',
            'description': '128k context, premium (~$0.050/plan)'
        },
        {
            'id': 'mistralai/mistral-small-3.2-24b-instruct:free',
            'name': 'Mistral Small 3.2 (Free)',
            'provider': 'Mistral',
            'cost': 'FREE',
            'description': '131k context - FREE, may have rate limits'
        },
        {
            'id': 'qwen/qwen-2.5-72b-instruct:free',
            'name': 'Qwen 2.5 72B (Free)',
            'provider': 'Qwen',
            'cost': 'FREE',
            'description': '32k context - FREE, may have rate limits'
        }
    ]
    
    return jsonify({
        'success': True,
        'models': models
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)

