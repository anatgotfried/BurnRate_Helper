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
                error_detail = error_json.get('error', {}).get('message', error_detail)
            except:
                pass
            
            return jsonify({
                'success': False,
                'error': f'OpenRouter API error: {error_detail}',
                'status_code': response.status_code
            }), response.status_code

        result = response.json()
        
        # Extract the generated content
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            
            # Try to parse as JSON
            try:
                # Remove markdown code blocks if present
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                
                meal_plan = json.loads(content)
                
                return jsonify({
                    'success': True,
                    'meal_plan': meal_plan,
                    'raw_content': content,
                    'usage': result.get('usage', {}),
                    'model': result.get('model', model)
                })
            except json.JSONDecodeError as e:
                # Return raw content if not valid JSON
                return jsonify({
                    'success': True,
                    'raw_content': content,
                    'parse_error': str(e),
                    'usage': result.get('usage', {}),
                    'model': result.get('model', model)
                })
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
            'id': 'google/gemini-2.0-flash-exp:free',
            'name': 'Gemini 2.0 Flash (Free)',
            'provider': 'Google',
            'cost': 'FREE',
            'description': 'Free and fast - experimental version'
        },
        {
            'id': 'google/gemini-flash-1.5-8b',
            'name': 'Gemini 1.5 Flash 8B',
            'provider': 'Google',
            'cost': 'Very Low',
            'description': 'Fast and affordable, great for quick meal plans'
        },
        {
            'id': 'anthropic/claude-3-haiku-20240307',
            'name': 'Claude 3 Haiku',
            'provider': 'Anthropic',
            'cost': 'Low',
            'description': 'Balanced performance and cost'
        },
        {
            'id': 'openai/gpt-3.5-turbo',
            'name': 'GPT-3.5 Turbo',
            'provider': 'OpenAI',
            'cost': 'Low',
            'description': 'Reliable and well-tested'
        },
        {
            'id': 'anthropic/claude-3.5-sonnet-20241022',
            'name': 'Claude 3.5 Sonnet',
            'provider': 'Anthropic',
            'cost': 'Medium',
            'description': 'High quality, detailed responses'
        },
        {
            'id': 'openai/gpt-4o-mini',
            'name': 'GPT-4o Mini',
            'provider': 'OpenAI',
            'cost': 'Medium',
            'description': 'Good balance of capability and cost'
        }
    ]
    
    return jsonify({
        'success': True,
        'models': models
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)

