// BurnRate Daily Planner - Main Script
const VERSION = '1.0';
const VERSION_DATE = '2025-11-04';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5002' 
    : window.location.origin;

let workouts = [];
let researchCorpus = {};
let currentPlanData = null;
let testAthletes = [];
let promptTemplate = '';
let context = null;

// Load resources on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('📅 BurnRate Daily Planner v' + VERSION + ' - Loading...');
    
    // Event listeners FIRST (before anything that could error)
    try {
        document.getElementById('addWorkoutBtn').addEventListener('click', addWorkout);
        document.getElementById('generateBtn').addEventListener('click', generatePlan);
        document.getElementById('viewPromptBtn').addEventListener('click', viewPromptOnly);
        document.getElementById('loadAthleteSelect').addEventListener('change', loadAthleteProfile);
        
        console.log('✅ Event listeners attached');
    } catch (error) {
        console.error('❌ Failed to attach event listeners:', error);
    }
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Set version badge
    const versionBadge = document.getElementById('versionBadge');
    if (versionBadge) {
        versionBadge.title = `Version ${VERSION} (${VERSION_DATE})`;
    }
    
    // Load resources
    try {
        await loadResources();
        showStatus(`Ready to generate daily plans! (v${VERSION})`, 'success');
    } catch (error) {
        console.error('Failed to load resources:', error);
        showStatus(`Error loading resources: ${error.message}`, 'error');
    }
    
    // Add initial workout
    if (workouts.length === 0) {
        addWorkout();
    }
    
    console.log('✅ Initialization complete');
});

// Load research corpus and prompt template
async function loadResources() {
    try {
        // Load research corpus
        const corpusResponse = await fetch('data/research_corpus.json');
        researchCorpus = await corpusResponse.json();
        
        // Load test athletes
        const athletesResponse = await fetch('data/test-athletes.json');
        const athletesData = await athletesResponse.json();
        testAthletes = athletesData.athletes;
        
        // Load prompt template
        const promptResponse = await fetch('prompts/daily_planner_v1.txt');
        promptTemplate = await promptResponse.text();
        
        // Populate athlete dropdown
        const athleteSelect = document.getElementById('loadAthleteSelect');
        if (athleteSelect) {
            testAthletes.forEach(athlete => {
                const option = document.createElement('option');
                option.value = athlete.id;
                option.textContent = athlete.name;
                option.title = athlete.description;
                athleteSelect.appendChild(option);
            });
        }
        
        console.log('✅ Resources loaded (including', testAthletes.length, 'test athletes)');
    } catch (error) {
        console.error('Failed to load resources:', error);
        throw error;
    }
}

// Load athlete profile
function loadAthleteProfile() {
    const select = document.getElementById('loadAthleteSelect');
    const athleteId = select.value;
    
    if (!athleteId) return;
    
    const athlete = testAthletes.find(a => a.id === athleteId);
    if (!athlete) return;
    
    console.log('📋 Loading athlete profile:', athlete.name);
    
    // Populate form fields
    const form = document.getElementById('profileForm');
    const profile = athlete.profile;
    
    // Set basic fields
    form.querySelector('[name="weight_kg"]').value = profile.weight_kg;
    form.querySelector('[name="height_cm"]').value = profile.height_cm;
    form.querySelector('[name="gender"]').value = profile.gender;
    form.querySelector('[name="training_phase"]').value = profile.training_phase;
    form.querySelector('[name="goal"]').value = profile.goal;
    form.querySelector('[name="diet_pattern"]').value = profile.diet_pattern;
    form.querySelector('[name="gi_tolerance"]').value = profile.gi_tolerance;
    form.querySelector('[name="sweat_rate"]').value = profile.sweat_rate;
    form.querySelector('[name="timezone"]').value = profile.timezone;
    
    // Set population checkboxes
    const mastersCheckbox = document.getElementById('masters');
    const femaleCheckbox = document.getElementById('female_specific');
    const youthCheckbox = document.getElementById('youth');
    
    if (mastersCheckbox) mastersCheckbox.checked = profile.populations?.includes('masters') || false;
    if (femaleCheckbox) femaleCheckbox.checked = profile.populations?.includes('female_specific') || false;
    if (youthCheckbox) youthCheckbox.checked = profile.populations?.includes('youth') || false;
    
    // Clear existing workouts and load new ones
    workouts = [];
    if (athlete.workouts) {
        athlete.workouts.forEach(w => {
            workouts.push({
                id: Date.now() + Math.random(),
                type: w.type,
                duration: w.duration,
                intensity: w.intensity,
                startTime: w.startTime,
                temperature: w.temperature,
                humidity: w.humidity
            });
        });
    }
    
    renderWorkouts();
    
    // Show success message
    showStatus(`✅ Loaded: ${athlete.name}`, 'success');
    
    console.log('✅ Profile loaded:', profile);
    console.log('✅ Workouts loaded:', workouts.length);
}

// Add workout
function addWorkout() {
    const workout = {
        id: Date.now(),
        type: 'run',
        duration: 60,
        intensity: 'moderate',
        startTime: '09:00',
        temperature: 20,
        humidity: 60
    };
    
    workouts.push(workout);
    renderWorkouts();
}

// Remove workout
function removeWorkout(id) {
    workouts = workouts.filter(w => w.id !== id);
    renderWorkouts();
}

// Update workout
function updateWorkout(id, field, value) {
    const workout = workouts.find(w => w.id === id);
    if (workout) {
        workout[field] = value;
    }
}

// Render workouts
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

// Build context
function buildContext() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    
    const athlete = {
        weight_kg: parseFloat(formData.get('weight_kg')),
        height_cm: parseFloat(formData.get('height_cm')),
        gender: formData.get('gender'),
        training_phase: formData.get('training_phase'),
        goal: formData.get('goal'),
        diet_pattern: formData.get('diet_pattern'),
        gi_tolerance: formData.get('gi_tolerance'),
        sweat_rate: formData.get('sweat_rate'),
        timezone: formData.get('timezone'),
        populations: []
    };
    
    // Add population flags
    const mastersCheckbox = document.getElementById('masters');
    const femaleCheckbox = document.getElementById('female_specific');
    const youthCheckbox = document.getElementById('youth');
    
    if (mastersCheckbox?.checked) athlete.populations.push('masters');
    if (femaleCheckbox?.checked) athlete.populations.push('female_specific');
    if (youthCheckbox?.checked) athlete.populations.push('youth');
    
    // Normalize workout data
    const normalizedWorkouts = workouts.map(w => ({
        ...w,
        duration_min: w.duration || w.duration_min || 60,
        temp_c: w.temperature || w.temp_c || 20,
        humidity_pct: w.humidity || w.humidity_pct || 60
    }));
    
    // Calculate daily targets
    const calculated_targets = calculateDailyTargets(athlete, normalizedWorkouts);
    
    return {
        athlete,
        workouts: normalizedWorkouts,
        calculated_targets
    };
}

// Build prompt
function buildPrompt(context) {
    // Check if fast mode is enabled
    const fastMode = document.getElementById('fastMode')?.checked ?? true;
    
    let corpus = researchCorpus;
    let tokenSavings = '';
    
    if (fastMode && window.filterRelevantCorpus) {
        const filtered = filterRelevantCorpus(researchCorpus, context.athlete, context.workouts);
        corpus = filtered.corpus;
        tokenSavings = `\n[Fast Mode: Filtered corpus - ${filtered.savings}]`;
        console.log(`⚡ Fast mode enabled: ${filtered.savings}`);
    }
    
    // Replace placeholders in prompt template
    let prompt = promptTemplate
        .replace('{RESEARCH_CORPUS}', JSON.stringify(corpus, null, 2))
        .replace('{CONTEXT}', JSON.stringify(context, null, 2))
        .replace('{PHASE}', context.athlete.training_phase)
        .replace('{GOAL}', context.athlete.goal);
    
    return prompt + tokenSavings;
}

// Generate Plan
async function generatePlan() {
    console.log('🚀 Generate button clicked!');
    
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
    context = buildContext();
    
    // Get selected model
    const selectedModel = document.getElementById('modelSelect').value;
    
    // Show loading
    showLoading(true);
    
    // Build prompt
    const prompt = buildPrompt(context);
    window.lastPrompt = prompt;
    window.lastModel = selectedModel;
    
    // Update prompt display
    document.getElementById('promptContent').textContent = prompt;
    
    // Show prompt stats
    const promptTokens = Math.ceil(prompt.length / 4);
    showStatus(`Generating with ${selectedModel}... (prompt: ~${promptTokens.toLocaleString()} tokens)`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/daily-planner/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                prompt: prompt,
                max_tokens: 3000
            })
        });
        
        const data = await response.json();
        
        // Store raw response
        window.lastResponse = data;
        
        // Format response for display
        let responseDisplay = JSON.stringify(data, null, 2);
        if (data.data) {
            responseDisplay = JSON.stringify(data.data, null, 2);
        }
        
        document.getElementById('responseContent').textContent = responseDisplay;
        
        // Show output section
        document.getElementById('outputSection').style.display = 'block';
        
        if (!data.success) {
            switchTab('prompt');
            showStatus(`Error: ${data.error}`, 'error');
            return;
        }
        
        // Handle response
        if (data.data) {
            currentPlanData = data.data;
            renderPlan(currentPlanData);
            
            // Calculate and display cost
            if (data.usage) {
                displayCost(data.usage, selectedModel);
            }
            
            showStatus('Daily plan generated successfully!', 'success');
            
            // Scroll to output
            document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            throw new Error('No plan data in response');
        }
    } catch (error) {
        console.error('Generation failed:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// View prompt without generating
function viewPromptOnly() {
    // Validate form
    if (!document.getElementById('profileForm').checkValidity()) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }
    
    if (workouts.length === 0) {
        showStatus('Please add at least one workout', 'error');
        return;
    }
    
    // Build context and prompt
    context = buildContext();
    const prompt = buildPrompt(context);
    const model = document.getElementById('modelSelect').value;
    
    // Store for viewing
    window.lastPrompt = prompt;
    window.lastModel = model;
    
    // Update prompt tab
    document.getElementById('promptContent').textContent = prompt;
    
    // Show output section and switch to prompt tab
    document.getElementById('outputSection').style.display = 'block';
    switchTab('prompt');
    
    // Show stats
    const promptTokens = Math.ceil(prompt.length / 4);
    const estimatedCost = estimatePromptCost(model, promptTokens);
    showStatus(`✅ Prompt ready! ~${promptTokens.toLocaleString()} tokens. Model: ${model}. Estimated cost: ~$${estimatedCost.toFixed(4)}`, 'success');
    
    // Scroll to output
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Estimate prompt cost
function estimatePromptCost(model, promptTokens) {
    const usage = {
        prompt_tokens: promptTokens,
        completion_tokens: 2000 // Estimate ~2k output
    };
    const costInfo = calculateCost(model, usage);
    return costInfo.totalCost || 0;
}

// Generic copy to clipboard
function copyToClipboard(elementId, name) {
    const content = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(content).then(() => {
        showStatus(`${name} copied to clipboard!`, 'success');
    }).catch(err => {
        showStatus(`Failed to copy ${name}`, 'error');
    });
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Render plan
function renderPlan(planData) {
    // Render summary
    renderSummary(planData);
    
    // Render timeline
    renderTimeline(planData);
}

// Calculate timeline totals
function calculateTimelineTotals(timeline) {
    // Sort by time first to ensure chronological order
    timeline.sort((a, b) => a.time.localeCompare(b.time));
    
    return timeline.reduce((acc, entry) => {
        acc.calories += entry.calories || 0;
        acc.carbs_g += entry.carbs_g || 0;
        acc.protein_g += entry.protein_g || 0;
        acc.fat_g += entry.fat_g || 0;
        acc.sodium_mg += entry.sodium_mg || 0;
        acc.hydration_ml += entry.hydration_ml || 0;
        return acc;
    }, {
        calories: 0,
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
        sodium_mg: 0,
        hydration_ml: 0
    });
}

// Render summary
function renderSummary(planData) {
    const container = document.getElementById('summaryContent');
    const summary = planData.daily_summary || {};
    const targets = context.calculated_targets;
    
    // Daily tip
    let tipHtml = '';
    if (planData.daily_tip) {
        tipHtml = renderDailyTip(planData.daily_tip);
    }
    
    // Training load
    let loadHtml = '';
    if (planData.training_load) {
        loadHtml = renderTrainingLoad(planData.training_load);
    }
    
    // Format deviation
    const formatDeviation = (actual, target) => {
        if (typeof actual !== 'number' || typeof target !== 'number' || target === 0) {
            return '⚠️';
        }
        const diff = Math.abs(actual - target);
        const pctDiff = (diff / target) * 100;
        return pctDiff <= 2 ? '✅' : pctDiff <= 5 ? '⚠️' : '❌';
    };
    
    const formatDiff = (actual, target) => {
        if (typeof actual !== 'number' || typeof target !== 'number') {
            return 'no data';
        }
        const diff = actual - target;
        const sign = diff >= 0 ? '+' : '';
        const pct = ((diff / target) * 100).toFixed(1);
        return `${sign}${diff.toFixed(0)} (${sign}${pct}%)`;
    };
    
    container.innerHTML = `
        ${tipHtml}
        ${loadHtml}
        
        <div class="summary-section">
            <h3>Daily Totals</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Calories ${formatDeviation(summary.calories, targets.daily_energy_target_kcal)}</span>
                    <span class="summary-value">${summary.calories || 0} kcal <span class="summary-diff">${formatDiff(summary.calories, targets.daily_energy_target_kcal)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Carbs ${formatDeviation(summary.carbs_g, targets.daily_carb_target_g)}</span>
                    <span class="summary-value">${summary.carbs_g || 0} g <span class="summary-diff">${formatDiff(summary.carbs_g, targets.daily_carb_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Protein ${formatDeviation(summary.protein_g, targets.daily_protein_target_g)}</span>
                    <span class="summary-value">${summary.protein_g || 0} g <span class="summary-diff">${formatDiff(summary.protein_g, targets.daily_protein_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Fat ${formatDeviation(summary.fat_g, targets.daily_fat_target_g)}</span>
                    <span class="summary-value">${summary.fat_g || 0} g <span class="summary-diff">${formatDiff(summary.fat_g, targets.daily_fat_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Sodium ${formatDeviation(summary.sodium_mg, targets.sodium_target_mg)}</span>
                    <span class="summary-value">${summary.sodium_mg || 0} mg <span class="summary-diff">${formatDiff(summary.sodium_mg, targets.sodium_target_mg)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Hydration ${formatDeviation(summary.hydration_l, targets.hydration_target_l)}</span>
                    <span class="summary-value">${summary.hydration_l || 0} L <span class="summary-diff">${formatDiff(summary.hydration_l, targets.hydration_target_l)}</span></span>
                </div>
            </div>
        </div>
        
        ${planData.warnings && planData.warnings.length > 0 ? `
            <div class="summary-section">
                <h3>⚠️ Warnings</h3>
                <ul class="warnings-list">
                    ${planData.warnings.map(warn => `<li>${warn}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

// Render daily tip
function renderDailyTip(tip) {
    const tipText = typeof tip === 'string' ? tip : tip.text;
    const source = typeof tip === 'object' && tip.source ? `<span class="tip-source">${tip.source}</span>` : '';
    
    return `
        <div class="daily-tip-card">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
                <h4>Today's Insight ${source}</h4>
                <p>${tipText}</p>
            </div>
        </div>
    `;
}

// Render training load
function renderTrainingLoad(load) {
    const intensityColors = {
        'Low': '#10b981',
        'Moderate': '#f59e0b',
        'High': '#ef4444',
        'Very High': '#991b1b'
    };
    
    return `
        <div class="training-load-summary" style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-subtle); border-radius: 8px;">
            <div style="margin-bottom: 0.5rem;">🧭 Training Load: <strong style="color: ${intensityColors[load.intensity_level] || '#666'}">${load.score} (${load.intensity_level})</strong></div>
            <div>🕒 Total Duration: <strong>${Math.floor(load.total_duration_min / 60)}h ${load.total_duration_min % 60}m</strong></div>
        </div>
    `;
}

// Render timeline
function renderTimeline(planData) {
    const container = document.getElementById('timelineContent');
    const timeline = planData.timeline || [];
    
    // Sort chronologically BEFORE rendering
    timeline.sort((a, b) => a.time.localeCompare(b.time));
    
    const typeIcons = {
        meal: '🍽️',
        workout: '🏃',
        hydration: '💧'
    };
    
    const html = timeline.map((entry, idx) => `
        <div class="timeline-entry" style="background: ${idx % 2 === 0 ? 'var(--bg-subtle)' : 'white'};">
            <div class="timeline-time">${entry.time}</div>
            <div class="timeline-content">
                <h4>${typeIcons[entry.type] || '📌'} ${entry.name}</h4>
                <div class="timeline-macros">
                    ${entry.carbs_g || 0}g carbs | ${entry.protein_g || 0}g protein | 
                    ${entry.fat_g || 0}g fat | ${entry.calories || 0} kcal | 
                    💧 ${entry.hydration_ml || 0} ml | 🧂 ${entry.sodium_mg || 0} mg
                </div>
            </div>
        </div>
    `).join('');
    
    // Calculate totals and validate
    const totals = calculateTimelineTotals([...timeline]); // Copy array to avoid mutating original
    const validation = renderValidation(totals, context.calculated_targets);
    
    container.innerHTML = html + validation;
}

// Render validation
function renderValidation(totals, targets) {
    const formatDeviation = (actual, target) => {
        if (typeof actual !== 'number' || typeof target !== 'number' || target === 0) {
            return '⚠️';
        }
        const diff = Math.abs(actual - target);
        const pctDiff = (diff / target) * 100;
        return pctDiff <= 2 ? '✅' : pctDiff <= 5 ? '⚠️' : '❌';
    };
    
    const formatDeviationText = (actual, target) => {
        if (typeof actual !== 'number' || typeof target !== 'number') {
            return 'no data';
        }
        const pct = ((actual - target) / target * 100).toFixed(1);
        return `(${pct > 0 ? '+' : ''}${pct}%)`;
    };
    
    return `
        <div class="validation-totals">
            <h4>Daily Totals Validation:</h4>
            <div class="validation-row">Calories: ${formatDeviation(totals.calories, targets.daily_energy_target_kcal)} ${totals.calories} / ${targets.daily_energy_target_kcal} <span class="deviation">${formatDeviationText(totals.calories, targets.daily_energy_target_kcal)}</span></div>
            <div class="validation-row">Carbs: ${formatDeviation(totals.carbs_g, targets.daily_carb_target_g)} ${totals.carbs_g} / ${targets.daily_carb_target_g} <span class="deviation">${formatDeviationText(totals.carbs_g, targets.daily_carb_target_g)}</span></div>
            <div class="validation-row">Protein: ${formatDeviation(totals.protein_g, targets.daily_protein_target_g)} ${totals.protein_g} / ${targets.daily_protein_target_g} <span class="deviation">${formatDeviationText(totals.protein_g, targets.daily_protein_target_g)}</span></div>
            <div class="validation-row">Fat: ${formatDeviation(totals.fat_g, targets.daily_fat_target_g)} ${totals.fat_g} / ${targets.daily_fat_target_g} <span class="deviation">${formatDeviationText(totals.fat_g, targets.daily_fat_target_g)}</span></div>
            <div class="validation-row">Sodium: ${formatDeviation(totals.sodium_mg, targets.sodium_target_mg)} ${totals.sodium_mg} / ${targets.sodium_target_mg} <span class="deviation">${formatDeviationText(totals.sodium_mg, targets.sodium_target_mg)}</span></div>
            <div class="validation-row">Hydration: ${formatDeviation(totals.hydration_ml / 1000, targets.hydration_target_l)} ${(totals.hydration_ml / 1000).toFixed(2)} / ${targets.hydration_target_l} <span class="deviation">${formatDeviationText(totals.hydration_ml / 1000, targets.hydration_target_l)}</span></div>
        </div>
    `;
}

// Copy timeline
function copyTimeline() {
    if (!currentPlanData || !currentPlanData.timeline) {
        showStatus('No timeline data available', 'error');
        return;
    }
    
    const timeline = [...currentPlanData.timeline].sort((a, b) => a.time.localeCompare(b.time));
    const text = timeline.map(e => 
        `${e.time} – ${e.name}\n→ ${e.carbs_g || 0}g C | ${e.protein_g || 0}g P | ${e.fat_g || 0}g F | ${e.calories || 0} kcal | ${e.hydration_ml || 0}ml | ${e.sodium_mg || 0}mg Na`
    ).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showStatus('Timeline copied to clipboard!', 'success');
    });
}

// Save plan
function savePlan() {
    if (!currentPlanData) {
        showStatus('No plan data available', 'error');
        return;
    }
    
    const json = JSON.stringify(currentPlanData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `daily-plan-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Plan saved!', 'success');
}

// Show/hide loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 10000);
        }
    }
}

// Display cost info
function displayCost(usage, model) {
    const costDisplay = document.getElementById('costDisplay');
    if (!costDisplay) return;
    
    try {
        const costInfo = calculateCost(model, usage);
        
        window.lastCostInfo = {
            estimated_cost: costInfo.totalCost || 0,
            tokens_in: costInfo.promptTokens || 0,
            tokens_out: costInfo.completionTokens || 0
        };
        
        const cumulative = addToCumulativeCost(costInfo);
        
        costDisplay.innerHTML = `
            <div class="cost-summary">
                ${costInfo.isFree ? 
                    `<span class="cost-free">✨ FREE</span>` : 
                    `<span class="cost-amount">$${(costInfo.totalCost || 0).toFixed(6)}</span>`
                }
                <span class="cost-details">
                    ${(costInfo.promptTokens || 0).toLocaleString()} in + ${(costInfo.completionTokens || 0).toLocaleString()} out | ${model.split('/').pop()}
                </span>
                <span class="cost-cumulative">
                    Session: $${cumulative.totalSpent.toFixed(4)} (${cumulative.generationCount} calls)
                </span>
            </div>
        `;
    } catch (error) {
        console.error('Error in displayCost:', error);
    }
}

// Phase info modal
function showPhaseInfo() {
    const modal = document.getElementById('phaseInfoModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closePhaseInfo() {
    const modal = document.getElementById('phaseInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Collapsible sections
function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');
    
    if (content.classList.contains('truncated')) {
        content.classList.remove('truncated');
        icon.textContent = '▲';
    } else {
        content.classList.add('truncated');
        icon.textContent = '▼';
    }
}

// Close modal on background click
document.addEventListener('click', (e) => {
    const phaseModal = document.getElementById('phaseInfoModal');
    if (phaseModal && e.target === phaseModal) {
        closePhaseInfo();
    }
});

