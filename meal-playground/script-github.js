// BurnRate Meal Playground - GitHub Pages Version (Client-Side Only)

// State
let workouts = [];
let workoutIdCounter = 1;
let currentMealPlan = null;
let researchCorpus = null;
let promptTemplate = null;

// OpenRouter Configuration (Client-Side)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check for API key
    checkApiKey();
    
    // Load research corpus and prompt template
    await loadResources();
    
    // Restore saved state from localStorage
    restoreState();
    
    // Add initial workout if none exist
    if (workouts.length === 0) {
        addWorkout();
    }
    
    // Event listeners
    document.getElementById('addWorkoutBtn').addEventListener('click', addWorkout);
    document.getElementById('generateBtn').addEventListener('click', generateMealPlan);
    document.getElementById('copyJsonBtn').addEventListener('click', copyJson);
    document.getElementById('downloadJsonBtn').addEventListener('click', downloadJson);
    document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('clearApiKeyBtn').addEventListener('click', clearApiKey);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Auto-save state on changes
    document.getElementById('profileForm').addEventListener('input', saveState);
});

// API Key Management
function checkApiKey() {
    const apiKey = localStorage.getItem('openrouterApiKey');
    const banner = document.getElementById('apiKeyBanner');
    
    if (!apiKey) {
        banner.style.display = 'block';
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('generateBtn').title = 'Please configure your API key first';
    } else {
        banner.style.display = 'none';
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('generateBtn').title = '';
        document.getElementById('apiKeyStatus').textContent = `API Key: ${apiKey.substring(0, 10)}...`;
    }
}

function saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();
    
    if (!key) {
        alert('Please enter an API key');
        return;
    }
    
    if (!key.startsWith('sk-or-')) {
        alert('OpenRouter API keys should start with "sk-or-"');
        return;
    }
    
    localStorage.setItem('openrouterApiKey', key);
    input.value = '';
    checkApiKey();
    showStatus('API key saved successfully! 🎉', 'success');
}

function clearApiKey() {
    if (confirm('Are you sure you want to remove your API key? You will need to enter it again to generate meal plans.')) {
        localStorage.removeItem('openrouterApiKey');
        checkApiKey();
        showStatus('API key removed', 'info');
    }
}

// Load Resources
async function loadResources() {
    try {
        // Load research corpus
        const corpusResponse = await fetch('data/research_corpus.json');
        researchCorpus = await corpusResponse.json();
        
        // Load prompt template
        const promptResponse = await fetch('prompts/meal_planner.txt');
        promptTemplate = await promptResponse.text();
        
        console.log('Resources loaded successfully');
    } catch (error) {
        console.error('Error loading resources:', error);
        showStatus('Error loading required resources', 'error');
    }
}

// Workout Management
function addWorkout() {
    const workout = {
        id: workoutIdCounter++,
        type: 'run',
        duration: 60,
        intensity: 'moderate',
        startTime: '09:00',
        temperature: 20,
        humidity: 50
    };
    
    workouts.push(workout);
    renderWorkouts();
    saveState();
}

function removeWorkout(id) {
    workouts = workouts.filter(w => w.id !== id);
    renderWorkouts();
    saveState();
}

function updateWorkout(id, field, value) {
    const workout = workouts.find(w => w.id === id);
    if (workout) {
        workout[field] = value;
        saveState();
    }
}

function renderWorkouts() {
    const container = document.getElementById('workoutsList');
    
    if (workouts.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center;">No workouts added yet. Click "Add Workout" to begin.</p>';
        return;
    }
    
    container.innerHTML = workouts.map((workout, index) => `
        <div class="workout-card">
            <div class="workout-header">
                <span class="workout-number">Workout ${index + 1}</span>
                <button type="button" class="btn btn-danger" onclick="removeWorkout(${workout.id})">Remove</button>
            </div>
            <div class="workout-form">
                <label class="form-label">
                    <span>Type</span>
                    <select class="form-select" onchange="updateWorkout(${workout.id}, 'type', this.value)">
                        <option value="run" ${workout.type === 'run' ? 'selected' : ''}>Run</option>
                        <option value="bike" ${workout.type === 'bike' ? 'selected' : ''}>Bike</option>
                        <option value="swim" ${workout.type === 'swim' ? 'selected' : ''}>Swim</option>
                        <option value="strength" ${workout.type === 'strength' ? 'selected' : ''}>Strength</option>
                        <option value="hiit" ${workout.type === 'hiit' ? 'selected' : ''}>HIIT</option>
                        <option value="tempo" ${workout.type === 'tempo' ? 'selected' : ''}>Tempo</option>
                        <option value="intervals" ${workout.type === 'intervals' ? 'selected' : ''}>Intervals</option>
                        <option value="long_endurance" ${workout.type === 'long_endurance' ? 'selected' : ''}>Long Endurance</option>
                    </select>
                </label>
                <label class="form-label">
                    <span>Duration (minutes)</span>
                    <input type="number" class="form-input" value="${workout.duration}" min="15" max="600" 
                        onchange="updateWorkout(${workout.id}, 'duration', parseInt(this.value))">
                </label>
                <label class="form-label">
                    <span>Intensity</span>
                    <select class="form-select" onchange="updateWorkout(${workout.id}, 'intensity', this.value)">
                        <option value="low" ${workout.intensity === 'low' ? 'selected' : ''}>Low</option>
                        <option value="moderate" ${workout.intensity === 'moderate' ? 'selected' : ''}>Moderate</option>
                        <option value="high" ${workout.intensity === 'high' ? 'selected' : ''}>High</option>
                        <option value="very_high" ${workout.intensity === 'very_high' ? 'selected' : ''}>Very High</option>
                    </select>
                </label>
                <label class="form-label">
                    <span>Start Time</span>
                    <input type="time" class="form-input" value="${workout.startTime}" 
                        onchange="updateWorkout(${workout.id}, 'startTime', this.value)">
                </label>
                <label class="form-label">
                    <span>Temperature (°C)</span>
                    <input type="number" class="form-input" value="${workout.temperature}" min="-10" max="45" 
                        onchange="updateWorkout(${workout.id}, 'temperature', parseInt(this.value))">
                </label>
                <label class="form-label">
                    <span>Humidity (%)</span>
                    <input type="number" class="form-input" value="${workout.humidity}" min="0" max="100" 
                        onchange="updateWorkout(${workout.id}, 'humidity', parseInt(this.value))">
                </label>
            </div>
        </div>
    `).join('');
}

// Generate Meal Plan (Client-Side OpenRouter Call)
async function generateMealPlan() {
    const apiKey = localStorage.getItem('openrouterApiKey');
    
    if (!apiKey) {
        showStatus('Please configure your OpenRouter API key first', 'error');
        document.getElementById('apiKeyBanner').style.display = 'block';
        return;
    }
    
    // Validate form
    if (!document.getElementById('profileForm').checkValidity()) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }
    
    if (workouts.length === 0) {
        showStatus('Please add at least one workout', 'error');
        return;
    }
    
    // Build context
    const context = buildContext();
    
    // Build prompt
    const prompt = buildPrompt(context);
    
    // Get selected model
    const model = document.getElementById('modelSelect').value;
    
    // Show loading
    showLoading(true);
    showStatus('Generating meal plan... This may take 30-60 seconds.', 'info');
    
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'BurnRate Meal Playground'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        // Extract the generated content
        if (data.choices && data.choices.length > 0) {
            let content = data.choices[0].message.content;
            
            // Try to parse as JSON
            try {
                // Remove markdown code blocks if present
                if (content.includes('```json')) {
                    content = content.split('```json')[1].split('```')[0].trim();
                } else if (content.includes('```')) {
                    content = content.split('```')[1].split('```')[0].trim();
                }
                
                const mealPlan = JSON.parse(content);
                currentMealPlan = mealPlan;
                renderMealPlan(mealPlan);
                showStatus('Meal plan generated successfully! 🎉', 'success');
                
                // Show output section
                document.getElementById('outputSection').style.display = 'block';
                document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                // Return raw content if not valid JSON
                showStatus('Warning: Response may not be properly formatted', 'error');
                document.getElementById('jsonContent').textContent = content;
                document.getElementById('outputSection').style.display = 'block';
                switchTab('json');
            }
        } else {
            throw new Error('No content in API response');
        }
    } catch (error) {
        console.error('Error generating meal plan:', error);
        showStatus(`Error: ${error.message}`, 'error');
        
        // Check if it's an authentication error
        if (error.message.includes('401') || error.message.includes('authentication')) {
            showStatus('API key error. Please check your OpenRouter API key.', 'error');
            document.getElementById('apiKeyBanner').style.display = 'block';
        }
    } finally {
        showLoading(false);
    }
}

// Build Context
function buildContext() {
    const context = {
        athlete: {
            weight_kg: parseFloat(document.getElementById('weight').value),
            height_cm: parseInt(document.getElementById('height').value),
            gender: document.getElementById('gender').value,
            training_phase: document.getElementById('trainingPhase').value,
            goal: document.getElementById('goal').value,
            diet_pattern: document.getElementById('dietPattern').value,
            gi_tolerance: document.getElementById('giTolerance').value,
            timezone: document.getElementById('timezone').value,
            populations: []
        },
        workouts: workouts.map(w => ({
            type: w.type,
            duration_min: w.duration,
            intensity: w.intensity,
            start_time: w.startTime,
            environment: {
                temp_c: w.temperature,
                humidity_pct: w.humidity,
                heat_index_flag: (w.temperature >= 27 && w.humidity >= 60)
            }
        })),
        date: new Date().toISOString().split('T')[0]
    };
    
    // Add optional sweat rate
    const sweatRate = document.getElementById('sweatRate').value;
    if (sweatRate) {
        context.athlete.sweat_rate_ml_hr = parseInt(sweatRate);
    }
    
    // Add populations
    if (document.getElementById('isMasters').checked) {
        context.athlete.populations.push('masters');
    }
    if (document.getElementById('isFemaleSpecific').checked) {
        context.athlete.populations.push('female_specific');
    }
    if (document.getElementById('isYouth').checked) {
        context.athlete.populations.push('youth');
    }
    
    // Determine primary population based on workouts
    const hasEndurance = workouts.some(w => ['run', 'bike', 'swim', 'long_endurance'].includes(w.type));
    const hasStrength = workouts.some(w => w.type === 'strength');
    
    if (hasEndurance && !context.athlete.populations.includes('endurance')) {
        context.athlete.populations.push('endurance');
    }
    if (hasStrength && !context.athlete.populations.includes('strength_power')) {
        context.athlete.populations.push('strength_power');
    }
    
    return context;
}

// Build Prompt
function buildPrompt(context) {
    if (!promptTemplate || !researchCorpus) {
        throw new Error('Resources not loaded');
    }
    
    const prompt = promptTemplate
        .replace('{RESEARCH_CORPUS}', JSON.stringify(researchCorpus, null, 2))
        .replace('{CONTEXT}', JSON.stringify(context, null, 2));
    
    return prompt;
}

// Render Meal Plan (same as before)
function renderMealPlan(mealPlan) {
    renderMeals(mealPlan.meals);
    renderSummary(mealPlan);
    document.getElementById('jsonContent').textContent = JSON.stringify(mealPlan, null, 2);
}

function renderMeals(meals) {
    const container = document.getElementById('mealsContent');
    
    if (!meals || meals.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center;">No meals generated</p>';
        return;
    }
    
    container.innerHTML = meals.map(meal => `
        <div class="meal-card">
            <div class="meal-card-header">
                <div class="meal-time">${meal.time}</div>
                <h3 class="meal-name">${meal.name}</h3>
                <span class="meal-type-badge">${meal.type.replace('_', ' ')}</span>
            </div>
            
            <div class="meal-foods">
                ${meal.foods.map(food => `
                    <div class="food-item">
                        <div class="food-name">${food.item}</div>
                        <div class="food-macros">
                            C: ${food.carbs_g}g | P: ${food.protein_g}g | F: ${food.fat_g}g | ${food.calories} kcal
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="meal-totals">
                <div class="totals-row">
                    <span class="totals-label">Total Carbs:</span>
                    <span class="totals-value">${meal.total_carbs_g}g</span>
                </div>
                <div class="totals-row">
                    <span class="totals-label">Total Protein:</span>
                    <span class="totals-value">${meal.total_protein_g}g</span>
                </div>
                <div class="totals-row">
                    <span class="totals-label">Total Fat:</span>
                    <span class="totals-value">${meal.total_fat_g}g</span>
                </div>
                <div class="totals-row">
                    <span class="totals-label">Total Calories:</span>
                    <span class="totals-value">${meal.total_calories} kcal</span>
                </div>
            </div>
            
            ${meal.rationale ? `
                <div class="meal-rationale">
                    <strong>Why:</strong> ${meal.rationale}
                </div>
            ` : ''}
            
            ${meal.israel_alternatives && meal.israel_alternatives.length > 0 ? `
                <div class="meal-rationale">
                    <strong>Israel Alternatives:</strong> ${meal.israel_alternatives.join(', ')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderSummary(mealPlan) {
    const container = document.getElementById('summaryContent');
    
    const summary = mealPlan.athlete_summary || {};
    const totals = mealPlan.daily_totals || {};
    const recommendations = mealPlan.key_recommendations || [];
    const warnings = mealPlan.warnings || [];
    
    container.innerHTML = `
        <div class="summary-section">
            <h3>Daily Targets</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-item-label">Energy Target</span>
                    <span class="summary-item-value">
                        ${summary.daily_energy_target_kcal || 0}
                        <span class="summary-item-unit">kcal</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Protein Target</span>
                    <span class="summary-item-value">
                        ${summary.daily_protein_target_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Carbs Target</span>
                    <span class="summary-item-value">
                        ${summary.daily_carb_target_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Fat Target</span>
                    <span class="summary-item-value">
                        ${summary.daily_fat_target_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <h3>Daily Totals (Actual)</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-item-label">Total Calories</span>
                    <span class="summary-item-value">
                        ${totals.calories || 0}
                        <span class="summary-item-unit">kcal</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Protein</span>
                    <span class="summary-item-value">
                        ${totals.protein_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Carbs</span>
                    <span class="summary-item-value">
                        ${totals.carbs_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Fat</span>
                    <span class="summary-item-value">
                        ${totals.fat_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Protein per kg</span>
                    <span class="summary-item-value">
                        ${totals.protein_per_kg ? totals.protein_per_kg.toFixed(2) : '0'}
                        <span class="summary-item-unit">g/kg</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Carbs per kg</span>
                    <span class="summary-item-value">
                        ${totals.carbs_per_kg ? totals.carbs_per_kg.toFixed(2) : '0'}
                        <span class="summary-item-unit">g/kg</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Fluids</span>
                    <span class="summary-item-value">
                        ${totals.fluids_l ? totals.fluids_l.toFixed(1) : '0'}
                        <span class="summary-item-unit">L</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Sodium</span>
                    <span class="summary-item-value">
                        ${totals.sodium_mg || 0}
                        <span class="summary-item-unit">mg</span>
                    </span>
                </div>
            </div>
        </div>
        
        ${recommendations.length > 0 ? `
            <div class="summary-section">
                <h3>Key Recommendations</h3>
                <ul class="recommendations-list">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${warnings.length > 0 ? `
            <div class="summary-section">
                <h3>Warnings & Contraindications</h3>
                <ul class="warnings-list">
                    ${warnings.map(warn => `<li>${warn}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Export Functions
function copyJson() {
    const jsonText = document.getElementById('jsonContent').textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
        showStatus('JSON copied to clipboard!', 'success');
        setTimeout(() => showStatus('', 'info'), 3000);
    }).catch(err => {
        showStatus('Failed to copy JSON', 'error');
    });
}

function downloadJson() {
    if (!currentMealPlan) return;
    
    const jsonText = JSON.stringify(currentMealPlan, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Meal plan downloaded!', 'success');
    setTimeout(() => showStatus('', 'info'), 3000);
}

// State Management
function saveState() {
    const state = {
        profile: {
            weight: document.getElementById('weight').value,
            height: document.getElementById('height').value,
            gender: document.getElementById('gender').value,
            timezone: document.getElementById('timezone').value,
            trainingPhase: document.getElementById('trainingPhase').value,
            goal: document.getElementById('goal').value,
            dietPattern: document.getElementById('dietPattern').value,
            giTolerance: document.getElementById('giTolerance').value,
            sweatRate: document.getElementById('sweatRate').value,
            isMasters: document.getElementById('isMasters').checked,
            isFemaleSpecific: document.getElementById('isFemaleSpecific').checked,
            isYouth: document.getElementById('isYouth').checked
        },
        workouts: workouts,
        workoutIdCounter: workoutIdCounter
    };
    
    localStorage.setItem('mealPlaygroundState', JSON.stringify(state));
}

function restoreState() {
    const saved = localStorage.getItem('mealPlaygroundState');
    if (!saved) return;
    
    try {
        const state = JSON.parse(saved);
        
        if (state.profile) {
            Object.keys(state.profile).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = state.profile[key];
                    } else {
                        element.value = state.profile[key];
                    }
                }
            });
        }
        
        if (state.workouts) {
            workouts = state.workouts;
            workoutIdCounter = state.workoutIdCounter || workouts.length + 1;
            renderWorkouts();
        }
    } catch (error) {
        console.error('Error restoring state:', error);
    }
}

// UI Helpers
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    document.getElementById('generateBtn').disabled = show;
}

