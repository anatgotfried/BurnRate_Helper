// BurnRate Meal Playground - Main JavaScript

// State
let workouts = [];
let workoutIdCounter = 1;
let currentMealPlan = null;
let researchCorpus = null;
let promptTemplate = null;

// API Configuration
// For local development
const LOCAL_API = 'http://127.0.0.1:5001';
// For production - using same domain (Vercel hosts everything)
const PRODUCTION_API = window.location.origin;

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? LOCAL_API
    : PRODUCTION_API;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Auto-save state on changes
    document.getElementById('profileForm').addEventListener('input', saveState);
});

// Load Resources
async function loadResources() {
    try {
        // Load research corpus
        const corpusResponse = await fetch('data/research_corpus.json');
        researchCorpus = await corpusResponse.json();
        
        // Load prompt template (v2 with deterministic targets)
        const promptResponse = await fetch('prompts/meal_planner_v2.txt');
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

// Generate Meal Plan
async function generateMealPlan() {
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
        const response = await fetch(`${API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                max_tokens: 4000
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Create detailed error object
            const error = new Error(data.error || 'Unknown error occurred');
            error.response = data;
            throw error;
        }
        
        // Handle response
        if (data.meal_plan) {
            currentMealPlan = data.meal_plan;
            renderMealPlan(currentMealPlan);
            
            // Calculate and display cost
            if (data.usage) {
                const cost = calculateCost(model, data.usage);
                displayCost(cost, data.fixed);
            }
            
            showStatus('Meal plan generated successfully!', 'success');
            
            // Show output section
            document.getElementById('outputSection').style.display = 'block';
            document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (data.raw_content) {
            // Try to extract JSON from raw content
            showStatus('Warning: Response may not be properly formatted', 'error');
            document.getElementById('jsonContent').textContent = data.raw_content;
            document.getElementById('outputSection').style.display = 'block';
            switchTab('json');
        } else {
            throw new Error('No content in response');
        }
    } catch (error) {
        console.error('Error generating meal plan:', error);
        
        // Show detailed error if available
        if (error.response) {
            showDetailedError(error.response);
        } else {
            showStatus(`Error: ${error.message}`, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Build Context
function buildContext() {
    const form = document.getElementById('profileForm');
    
    const athlete = {
        weight_kg: parseFloat(document.getElementById('weight').value),
        height_cm: parseInt(document.getElementById('height').value),
        gender: document.getElementById('gender').value,
        training_phase: document.getElementById('trainingPhase').value,
        goal: document.getElementById('goal').value,
        diet_pattern: document.getElementById('dietPattern').value,
        gi_tolerance: document.getElementById('giTolerance').value,
        timezone: document.getElementById('timezone').value,
        populations: []
    };
    
    // Add optional sweat rate
    const sweatRate = document.getElementById('sweatRate').value;
    if (sweatRate) {
        athlete.sweat_rate_ml_hr = parseInt(sweatRate);
    }
    
    // Add populations
    if (document.getElementById('isMasters').checked) {
        athlete.populations.push('masters');
    }
    if (document.getElementById('isFemaleSpecific').checked) {
        athlete.populations.push('female_specific');
    }
    if (document.getElementById('isYouth').checked) {
        athlete.populations.push('youth');
    }
    
    const workoutData = workouts.map(w => ({
        type: w.type,
        duration_min: w.duration,
        intensity: w.intensity,
        start_time: w.startTime,
        environment: {
            temp_c: w.temperature,
            humidity_pct: w.humidity,
            heat_index_flag: (w.temperature >= 27 && w.humidity >= 60)
        }
    }));
    
    // Determine primary population based on workouts
    const hasEndurance = workouts.some(w => ['run', 'bike', 'swim', 'long_endurance', 'tempo', 'intervals'].includes(w.type));
    const hasStrength = workouts.some(w => w.type === 'strength');
    
    if (hasEndurance && !athlete.populations.includes('endurance')) {
        athlete.populations.push('endurance');
    }
    if (hasStrength && !athlete.populations.includes('strength_power')) {
        athlete.populations.push('strength_power');
    }
    
    // CALCULATE DETERMINISTIC TARGETS
    const calculatedTargets = calculateDailyTargets(athlete, workoutData);
    
    const context = {
        athlete: athlete,
        workouts: workoutData,
        date: new Date().toISOString().split('T')[0],
        calculated_targets: calculatedTargets
    };
    
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

// Render Meal Plan
function renderMealPlan(mealPlan) {
    // Render meals
    renderMeals(mealPlan.meals);
    
    // Render summary
    renderSummary(mealPlan);
    
    // Render JSON
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
                            C: ${food.carbs_g}g | P: ${food.protein_g}g | F: ${food.fat_g}g${food.sodium_mg ? ' | Na: ' + food.sodium_mg + 'mg' : ''} | ${food.calories} kcal
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
                ${meal.total_sodium_mg ? `
                <div class="totals-row">
                    <span class="totals-label">Total Sodium:</span>
                    <span class="totals-value">${meal.total_sodium_mg} mg</span>
                </div>
                ` : ''}
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
    const qualityCheck = mealPlan.plan_quality_check || {};
    const explanations = summary.explanations || {};
    
    // Calculate match status
    const caloriesMatch = Math.abs(totals.calories - summary.daily_energy_target_kcal) <= 50;
    const proteinMatch = Math.abs(totals.protein_g - summary.daily_protein_target_g) <= 5;
    const carbsMatch = Math.abs(totals.carbs_g - summary.daily_carb_target_g) <= 10;
    const fatMatch = Math.abs(totals.fat_g - summary.daily_fat_target_g) <= 5;
    const sodiumMatch = Math.abs(totals.sodium_mg - summary.sodium_target_mg) <= 200;
    
    container.innerHTML = `
        <div class="summary-section">
            <h3>Daily Targets (Calculated Deterministically)</h3>
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
                <div class="summary-item">
                    <span class="summary-item-label">Sodium Target</span>
                    <span class="summary-item-value">
                        ${summary.sodium_target_mg || 0}
                        <span class="summary-item-unit">mg</span>
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Hydration Target</span>
                    <span class="summary-item-value">
                        ${summary.hydration_target_l || 0}
                        <span class="summary-item-unit">L</span>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <h3>Daily Totals (Actual from Meals) ${caloriesMatch && proteinMatch && carbsMatch && fatMatch && sodiumMatch ? '✅' : '⚠️'}</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-item-label">Total Calories ${caloriesMatch ? '✅' : '⚠️'}</span>
                    <span class="summary-item-value" style="color: ${caloriesMatch ? 'var(--success)' : 'var(--warning)'}">
                        ${totals.calories || 0}
                        <span class="summary-item-unit">kcal</span>
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-lighter)">
                        ${summary.daily_energy_target_kcal ? 
                            (totals.calories > summary.daily_energy_target_kcal ? '+' : '') + 
                            (totals.calories - summary.daily_energy_target_kcal) + ' vs target' 
                        : ''}
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Protein ${proteinMatch ? '✅' : '⚠️'}</span>
                    <span class="summary-item-value" style="color: ${proteinMatch ? 'var(--success)' : 'var(--warning)'}">
                        ${totals.protein_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-lighter)">
                        ${summary.daily_protein_target_g ? 
                            (totals.protein_g > summary.daily_protein_target_g ? '+' : '') + 
                            (totals.protein_g - summary.daily_protein_target_g) + 'g vs target' 
                        : ''}
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Carbs ${carbsMatch ? '✅' : '⚠️'}</span>
                    <span class="summary-item-value" style="color: ${carbsMatch ? 'var(--success)' : 'var(--warning)'}">
                        ${totals.carbs_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-lighter)">
                        ${summary.daily_carb_target_g ? 
                            (totals.carbs_g > summary.daily_carb_target_g ? '+' : '') + 
                            (totals.carbs_g - summary.daily_carb_target_g) + 'g vs target' 
                        : ''}
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-item-label">Total Fat ${fatMatch ? '✅' : '⚠️'}</span>
                    <span class="summary-item-value" style="color: ${fatMatch ? 'var(--success)' : 'var(--warning)'}">
                        ${totals.fat_g || 0}
                        <span class="summary-item-unit">g</span>
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-lighter)">
                        ${summary.daily_fat_target_g ? 
                            (totals.fat_g > summary.daily_fat_target_g ? '+' : '') + 
                            (totals.fat_g - summary.daily_fat_target_g) + 'g vs target' 
                        : ''}
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
                    <span class="summary-item-label">Total Sodium ${sodiumMatch ? '✅' : '⚠️'}</span>
                    <span class="summary-item-value" style="color: ${sodiumMatch ? 'var(--success)' : 'var(--warning)'}">
                        ${totals.sodium_mg || 0}
                        <span class="summary-item-unit">mg</span>
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-lighter)">
                        ${summary.sodium_target_mg ? 
                            (totals.sodium_mg > summary.sodium_target_mg ? '+' : '') + 
                            (totals.sodium_mg - summary.sodium_target_mg) + 'mg vs target' 
                        : ''}
                    </span>
                </div>
            </div>
        </div>
        
        ${Object.keys(explanations).length > 0 ? `
        <div class="summary-section">
            <h3>Target Calculations Explained</h3>
            ${explanations.protein ? `<p style="margin-bottom: 1rem;"><strong>Protein:</strong> ${explanations.protein}</p>` : ''}
            ${explanations.carbs ? `<p style="margin-bottom: 1rem;"><strong>Carbs:</strong> ${explanations.carbs}</p>` : ''}
            ${explanations.fat ? `<p style="margin-bottom: 1rem;"><strong>Fat:</strong> ${explanations.fat}</p>` : ''}
            ${explanations.sodium ? `<p style="margin-bottom: 1rem;"><strong>Sodium:</strong> ${explanations.sodium}</p>` : ''}
            ${explanations.hydration ? `<p style="margin-bottom: 1rem;"><strong>Hydration:</strong> ${explanations.hydration}</p>` : ''}
        </div>
        ` : ''}
        
        ${Object.keys(qualityCheck).length > 0 ? `
        <div class="summary-section">
            <h3>Quality Check</h3>
            <ul class="recommendations-list">
                ${qualityCheck.calories_match ? `<li>Calories: ${qualityCheck.calories_match}</li>` : ''}
                ${qualityCheck.protein_match ? `<li>Protein: ${qualityCheck.protein_match}</li>` : ''}
                ${qualityCheck.carbs_match ? `<li>Carbs: ${qualityCheck.carbs_match}</li>` : ''}
                ${qualityCheck.fat_match ? `<li>Fat: ${qualityCheck.fat_match}</li>` : ''}
                ${qualityCheck.sodium_match ? `<li>Sodium: ${qualityCheck.sodium_match}</li>` : ''}
                ${qualityCheck.fluids_match ? `<li>Fluids: ${qualityCheck.fluids_match}</li>` : ''}
            </ul>
        </div>
        ` : ''}
        
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
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update panes
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
        
        // Restore profile
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
        
        // Restore workouts
        if (state.workouts) {
            workouts = state.workouts;
            workoutIdCounter = state.workoutIdCounter || workouts.length + 1;
            renderWorkouts();
        }
    } catch (error) {
        console.error('Error restoring state:', error);
    }
}

// Cost Display
function displayCost(cost, wasFixed) {
    const container = document.getElementById('costDisplay');
    const cumulative = addToCumulativeCost(cost);
    
    const costClass = cost.isFree ? 'cost-free' : '';
    const fixedNote = wasFixed ? ' <span style="color: var(--warning);">(auto-fixed)</span>' : '';
    
    container.innerHTML = `
        <div class="cost-this-generation">This generation:</div>
        <div class="cost-amount ${costClass}">${formatCost(cost.totalCost)}${fixedNote}</div>
        <div class="cost-details">
            ${cost.promptTokens.toLocaleString()} input + ${cost.completionTokens.toLocaleString()} output tokens
            <br>
            ${cost.modelName}
        </div>
        <div class="cost-cumulative">
            Total spent: ${formatCost(cumulative.totalSpent)} 
            (${cumulative.generationCount} ${cumulative.generationCount === 1 ? 'plan' : 'plans'}, 
            avg ${formatCost(cumulative.averageCost)}/plan)
            <button onclick="if(confirm('Reset cost tracking?')) { resetCumulativeTracking(); location.reload(); }" class="reset-cost-btn">Reset</button>
        </div>
    `;
}

// Error Display
function showDetailedError(errorData) {
    const statusEl = document.getElementById('statusMessage');
    
    let errorHtml = `<div style="text-align: left; max-width: 600px; margin: 0 auto;">`;
    errorHtml += `<strong style="color: var(--error);">⚠️ Error: ${errorData.error || 'Unknown error'}</strong><br>`;
    
    if (errorData.model_attempted) {
        errorHtml += `<div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-light);">`;
        errorHtml += `Model: ${errorData.model_attempted}<br>`;
        
        if (errorData.status_code) {
            errorHtml += `Status: ${errorData.status_code}<br>`;
        }
        
        // Suggestions based on error type
        if (errorData.status_code === 401) {
            errorHtml += `<br><strong>Fix:</strong> Check your OpenRouter API key in Vercel settings.`;
        } else if (errorData.status_code === 402) {
            errorHtml += `<br><strong>Fix:</strong> Add credits at <a href="https://openrouter.ai/credits" target="_blank">openrouter.ai/credits</a>`;
        } else if (errorData.status_code === 429) {
            errorHtml += `<br><strong>Fix:</strong> Wait 30 seconds and try again. Consider upgrading your OpenRouter plan.`;
        } else if (errorData.error_type === 'invalid_model') {
            errorHtml += `<br><strong>Fix:</strong> Try switching to Claude 3.5 Sonnet or GPT-4o Mini.`;
        }
        
        errorHtml += `</div>`;
    }
    
    // Add debug details (collapsible)
    if (errorData.raw_error && errorData.raw_error !== errorData.error) {
        errorHtml += `<details style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-lighter);">`;
        errorHtml += `<summary style="cursor: pointer;">Show technical details</summary>`;
        errorHtml += `<pre style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-subtle); border-radius: 4px; overflow-x: auto;">${errorData.raw_error}</pre>`;
        errorHtml += `</details>`;
    }
    
    errorHtml += `</div>`;
    
    statusEl.innerHTML = errorHtml;
    statusEl.className = 'status-message error';
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

