// BurnRate Daily Planner - Main Script  
const VERSION = '3.1';
const VERSION_DATE = '2025-11-05';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5002' 
    : window.location.origin;

let workouts = [];
let lockedMeals = [];
let researchCorpus = {};
let currentPlanData = null;
let testAthletes = [];
let promptTemplatePass1 = '';
let promptTemplatePass2 = '';
let context = null;

// Load resources on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('📅 BurnRate Daily Planner v' + VERSION + ' - Loading...');
    
    // Event listeners FIRST (before anything that could error)
    try {
        document.getElementById('addWorkoutBtn').addEventListener('click', addWorkout);
        document.getElementById('addLockedMealBtn').addEventListener('click', addLockedMeal);
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
        
        // Load prompt templates (two-pass mode)
        const promptPass1Response = await fetch('prompts/daily_planner_pass1_computation.txt');
        promptTemplatePass1 = await promptPass1Response.text();
        
        const promptPass2Response = await fetch('prompts/daily_planner_pass2_tip_generation.txt');
        promptTemplatePass2 = await promptPass2Response.text();
        
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

// Add locked meal
function addLockedMeal() {
    const meal = {
        id: Date.now(),
        time: '12:00',
        name: 'Team Lunch',
        carbs: 100,
        protein: 30,
        fat: 15,
        sodium: 800,
        hydration: 500
    };
    
    lockedMeals.push(meal);
    renderLockedMeals();
}

// Remove locked meal
function removeLockedMeal(id) {
    lockedMeals = lockedMeals.filter(m => m.id !== id);
    renderLockedMeals();
}

// Update locked meal
function updateLockedMeal(id, field, value) {
    const meal = lockedMeals.find(m => m.id === id);
    if (meal) {
        if (field === 'carbs' || field === 'protein' || field === 'fat' || field === 'sodium' || field === 'hydration') {
            meal[field] = parseFloat(value) || 0;
        } else {
            meal[field] = value;
        }
        renderLockedMeals();
    }
}

// Render locked meals
function renderLockedMeals() {
    const container = document.getElementById('lockedMealsList');
    if (!container) return;
    
    if (lockedMeals.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No locked meals added. Click "+ Add Locked Meal" to add meals you\'ve already planned.</p>';
        return;
    }
    
    container.innerHTML = lockedMeals.map(meal => `
        <div class="workout-card" style="border-left: 4px solid #f59e0b;">
            <div class="workout-header">
                <span class="workout-number" style="background: #f59e0b;">🔒</span>
                <button onclick="removeLockedMeal(${meal.id})" class="btn btn-danger" style="margin-left: auto;">Remove</button>
            </div>
            <div class="workout-form">
                <label class="form-label">
                    <span>Time</span>
                    <input type="time" class="form-input" value="${meal.time}" 
                        onchange="updateLockedMeal(${meal.id}, 'time', this.value)">
                </label>
                <label class="form-label">
                    <span>Meal Name</span>
                    <input type="text" class="form-input" value="${meal.name}" placeholder="e.g., Team Lunch"
                        onchange="updateLockedMeal(${meal.id}, 'name', this.value)">
                </label>
                <label class="form-label">
                    <span>Carbs (g)</span>
                    <input type="number" class="form-input" value="${meal.carbs}" min="0" max="300" 
                        onchange="updateLockedMeal(${meal.id}, 'carbs', this.value)">
                </label>
                <label class="form-label">
                    <span>Protein (g)</span>
                    <input type="number" class="form-input" value="${meal.protein}" min="0" max="150" 
                        onchange="updateLockedMeal(${meal.id}, 'protein', this.value)">
                </label>
                <label class="form-label">
                    <span>Fat (g)</span>
                    <input type="number" class="form-input" value="${meal.fat}" min="0" max="100" 
                        onchange="updateLockedMeal(${meal.id}, 'fat', this.value)">
                </label>
                <label class="form-label">
                    <span>Sodium (mg)</span>
                    <input type="number" class="form-input" value="${meal.sodium}" min="0" max="3000" 
                        onchange="updateLockedMeal(${meal.id}, 'sodium', this.value)">
                </label>
                <label class="form-label">
                    <span>Hydration (ml)</span>
                    <input type="number" class="form-input" value="${meal.hydration}" min="0" max="2000" 
                        onchange="updateLockedMeal(${meal.id}, 'hydration', this.value)">
                </label>
            </div>
            <div style="margin-top: 0.5rem; padding: 0.5rem; background: #fef3c7; border-radius: 4px; font-size: 0.875rem;">
                <strong>Locked:</strong> ${((meal.carbs * 4) + (meal.protein * 4) + (meal.fat * 9)).toFixed(0)} kcal | ${meal.carbs}g C | ${meal.protein}g P | ${meal.fat}g F
            </div>
        </div>
    `).join('');
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
                    <span>Intensity <button class="info-btn" onclick="showIntensityGuide(); event.preventDefault();" title="How to estimate intensity">ℹ️</button></span>
                    <select class="form-select" onchange="updateWorkout(${workout.id}, 'intensity', this.value)">
                        <option value="low" ${workout.intensity === 'low' ? 'selected' : ''}>Low (Zone 1-2, Recovery)</option>
                        <option value="moderate" ${workout.intensity === 'moderate' ? 'selected' : ''}>Moderate (Zone 3, Aerobic)</option>
                        <option value="high" ${workout.intensity === 'high' ? 'selected' : ''}>High (Zone 4, Threshold)</option>
                        <option value="very_high" ${workout.intensity === 'very_high' ? 'selected' : ''}>Very High (Zone 5, VO2max)</option>
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
        meals_per_day: parseInt(formData.get('meals_per_day')) || 4,
        pre_workout_timing_min: parseInt(formData.get('pre_workout_timing')) || 90,
        fat_loss_rate_lbs_per_week: formData.get('goal') === 'fat_loss' ? parseFloat(formData.get('fat_loss_rate') || 1.0) : null,
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
    
    // Calculate locked meal totals
    const locked_meal_totals = {
        calories: 0,
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
        sodium_mg: 0,
        hydration_ml: 0
    };
    
    lockedMeals.forEach(meal => {
        locked_meal_totals.carbs_g += meal.carbs || 0;
        locked_meal_totals.protein_g += meal.protein || 0;
        locked_meal_totals.fat_g += meal.fat || 0;
        locked_meal_totals.sodium_mg += meal.sodium || 0;
        locked_meal_totals.hydration_ml += meal.hydration || 0;
        // Calculate calories from macros
        locked_meal_totals.calories += (meal.carbs * 4) + (meal.protein * 4) + (meal.fat * 9);
    });
    
    return {
        athlete,
        workouts: normalizedWorkouts,
        calculated_targets,
        locked_meals: lockedMeals,
        locked_meal_totals
    };
}

// Build prompts (two-pass mode)
function buildPrompts(context, skeleton = null) {
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
    
    // Build skeleton text
    let skeletonText;
    if (skeleton && skeleton.timeline) {
        skeletonText = `Here is a programmatically generated timeline skeleton (research-calculated):\n${JSON.stringify(skeleton.timeline, null, 2)}\n\nSkeleton totals: ${skeleton.totals.carbs_g}C / ${skeleton.totals.protein_g}P / ${skeleton.totals.fat_g}F / ${skeleton.totals.calories} kcal\n\nYour job:\n1. Fill in meal names using TIME-BASED naming:\n   
   PRE-WORKOUT MEALS (NEVER RENAME!):\n   - Pre-workout ALWAYS keeps fuel name → "Pre-Run Fuel", "Pre-Bike Fuel"\n     Example: 07:45 pre-run → "Pre-Run Fuel" (NOT "Breakfast")\n   
   POST-WORKOUT MEALS (TIME-BASED):\n   - Post-workout 06:00-11:00 → "Breakfast"\n     Example: 10:30 post-run → "Breakfast" (NOT "Post-Run Recovery")\n   - Post-workout 11:00-14:00 → "Lunch"\n   - Merged dinner (after 17:00) → just "Dinner"\n   - Post-workout (14:00-17:00) → "Post-[Sport] Recovery"\n   
   REGULAR MEALS:\n   - 06:00-11:00 → "Breakfast"\n   - 11:00-14:00 → "Lunch"\n   - 17:00-20:00 → "Dinner"\n   - After 20:00 → "Evening Snack / Dessert"\n\n2. Fix timing if obviously wrong\n3. Redistribute macros ONLY if totals deviate >5% from targets\n4. Keep same number of entries\n5. DO NOT change locked meals\n\nMaintain macro totals within ±2% of targets.`;
    } else {
        skeletonText = 'Generate the complete timeline from scratch.';
    }
    
    // Build locked meals text
    const lockedMealsText = context.locked_meals && context.locked_meals.length > 0 
        ? JSON.stringify(context.locked_meals, null, 2) 
        : "No locked meals - you have full flexibility to create the entire timeline.";
    
    // Build Pass 1 prompt (computation)
    let promptPass1 = promptTemplatePass1
        .replace('{RESEARCH_CORPUS}', JSON.stringify(corpus, null, 2))
        .replace('{CONTEXT}', JSON.stringify(context, null, 2))
        .replace('{SKELETON}', skeletonText)
        .replace('{LOCKED_MEALS}', lockedMealsText)
        .replace('{MEALS_PER_DAY}', context.athlete.meals_per_day || 4);
    
    // Build Pass 2 prompt (tip generation) - will be completed after Pass 1
    let promptPass2 = promptTemplatePass2
        .replace('{RESEARCH_CORPUS}', JSON.stringify(corpus, null, 2))
        .replace('{CONTEXT}', JSON.stringify(context, null, 2));
    // Note: {PLAN_JSON} will be replaced in the backend after Pass 1 completes
    
    return {
        pass1: promptPass1 + tokenSavings,
        pass2: promptPass2
    };
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
    
    // Generate programmatic skeleton (frontend calculation)
    let skeleton = null;
    if (window.generateTimelineSkeleton) {
        try {
            skeleton = generateTimelineSkeleton(
                context.athlete,
                context.workouts,
                context.locked_meals || [],
                context.calculated_targets
            );
            console.log(`✅ Generated skeleton: ${skeleton.total_entries} entries`);
            console.log(`   - Workout meals: ${skeleton.num_workout_entries}`);
            console.log(`   - Locked meals: ${skeleton.num_locked_entries}`);
            console.log(`   - Regular meals: ${skeleton.num_regular_entries}`);
        } catch (error) {
            console.warn('⚠️ Skeleton generation failed:', error);
            skeleton = null;
        }
    }
    
    // Build prompts (two-pass mode)
    const prompts = buildPrompts(context, skeleton);
    window.lastPrompt = prompts.pass1;
    window.lastPromptPass2 = prompts.pass2;
    window.lastModel = selectedModel;
    window.lastSkeleton = skeleton;
    
    // Update prompt display (show Pass 1)
    document.getElementById('promptContent').textContent = prompts.pass1;
    
    // Show prompt stats
    const promptTokens = Math.ceil((prompts.pass1.length + prompts.pass2.length) / 4);
    const skeletonMsg = skeleton ? ' (with programmatic skeleton)' : '';
    showStatus(`Generating with ${selectedModel} (two-pass mode${skeletonMsg})... (prompts: ~${promptTokens.toLocaleString()} tokens)`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/daily-planner/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: selectedModel,
                prompt_pass1: prompts.pass1,
                prompt_pass2: prompts.pass2,
                calculated_targets: context.calculated_targets,
                skeleton: skeleton,  // Send pre-computed skeleton
                max_tokens: 3000
            })
        });
        
        let data;
        const responseText = await response.text();
        
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', responseText);
            console.error('Parse error:', parseError);
            showStatus(`Error: Server returned invalid JSON. Response: ${responseText.substring(0, 200)}`, 'error');
            showLoading(false);
            return;
        }
        
        // Store raw response
        window.lastResponse = data;
        
        // Format response for display
        let responseDisplay = '';
        if (data.two_pass) {
            // Show both passes if two-pass mode
            responseDisplay = `=== PASS 1 (Computation) ===\n${data.raw_content}\n\n`;
            if (data.raw_content_pass2) {
                responseDisplay += `=== PASS 2 (Tip Generation) ===\n${data.raw_content_pass2}\n\n`;
            }
            responseDisplay += `=== FINAL RESULT ===\n${JSON.stringify(data.data, null, 2)}`;
        } else {
            responseDisplay = JSON.stringify(data, null, 2);
            if (data.data) {
                responseDisplay = JSON.stringify(data.data, null, 2);
            }
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
    
    // Build context and prompts
    context = buildContext();
    const prompts = buildPrompts(context);
    const model = document.getElementById('modelSelect').value;
    
    // Store for viewing
    window.lastPrompt = prompts.pass1;
    window.lastPromptPass2 = prompts.pass2;
    window.lastModel = model;
    
    // Update prompt tab (show Pass 1)
    document.getElementById('promptContent').textContent = prompts.pass1;
    
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

// Render plan (merged summary + timeline)
function renderPlan(planData) {
    const container = document.getElementById('planContent');
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
    const compareValue = (actual, target) => {
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
    
    // Info button helper
    const infoBtn = (key) => `<button class="info-btn" onclick="showTargetInfo('${key}')" title="Why this target?">ℹ️</button>`;
    
    // Calculate timeline totals for validation
    const timeline = planData.timeline || [];
    const timelineTotals = calculateTimelineTotals([...timeline]);
    
    // Summary section
    const summaryHtml = `
        ${tipHtml}
        ${loadHtml}
        
        <div class="summary-section">
            <h3>Daily Targets ${infoBtn('overview')}</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Target Calories ${infoBtn('calories')}</span>
                    <span class="summary-value">${targets.daily_energy_target_kcal || 0} kcal</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Carbs ${infoBtn('carbs')}</span>
                    <span class="summary-value">${targets.daily_carb_target_g || 0} g</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Protein ${infoBtn('protein')}</span>
                    <span class="summary-value">${targets.daily_protein_target_g || 0} g</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Fat ${infoBtn('fat')}</span>
                    <span class="summary-value">${targets.daily_fat_target_g || 0} g</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Sodium ${infoBtn('sodium')}</span>
                    <span class="summary-value">${targets.sodium_target_mg || 0} mg</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Hydration ${infoBtn('hydration')}</span>
                    <span class="summary-value">${targets.hydration_target_l || 0} L</span>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <h3>Daily Totals ${compareValue(summary.calories, targets.daily_energy_target_kcal)}</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Calories ${compareValue(summary.calories, targets.daily_energy_target_kcal)}</span>
                    <span class="summary-value">${summary.calories || 0} kcal <span class="summary-diff">${formatDiff(summary.calories, targets.daily_energy_target_kcal)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Carbs ${compareValue(summary.carbs_g, targets.daily_carb_target_g)}</span>
                    <span class="summary-value">${summary.carbs_g || 0} g <span class="summary-diff">${formatDiff(summary.carbs_g, targets.daily_carb_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Protein ${compareValue(summary.protein_g, targets.daily_protein_target_g)}</span>
                    <span class="summary-value">${summary.protein_g || 0} g <span class="summary-diff">${formatDiff(summary.protein_g, targets.daily_protein_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Fat ${compareValue(summary.fat_g, targets.daily_fat_target_g)}</span>
                    <span class="summary-value">${summary.fat_g || 0} g <span class="summary-diff">${formatDiff(summary.fat_g, targets.daily_fat_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Sodium ${compareValue(summary.sodium_mg, targets.sodium_target_mg)}</span>
                    <span class="summary-value">${summary.sodium_mg || 0} mg <span class="summary-diff">${formatDiff(summary.sodium_mg, targets.sodium_target_mg)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Hydration ${compareValue(summary.hydration_l, targets.hydration_target_l)}</span>
                    <span class="summary-value">${summary.hydration_l || 0} L <span class="summary-diff">${formatDiff(summary.hydration_l, targets.hydration_target_l)}</span></span>
                </div>
            </div>
        </div>
    `;
    
    // Timeline section
    const timelineHtml = renderTimelineHTML(planData.timeline || [], timelineTotals, targets);
    
    // Fat loss deficit section (if applicable)
    const fatLossHtml = (targets.calorie_breakdown && targets.calorie_breakdown.isFatLoss) ? `
        <div class="summary-section" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b;">
            <h3>🔥 Fat Loss Progress Tracker <button class="info-btn" onclick="showFatLossStrategyInfo()" title="How is the deficit created?">ℹ️</button></h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Target Weekly Loss</span>
                    <span class="summary-value">${targets.calorie_breakdown.fatLossRateLbsPerWeek || 1.0} lbs/week</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Daily Deficit</span>
                    <span class="summary-value">${Math.round(targets.calorie_breakdown.targetDeficitKcal || 0)} kcal/day</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Actual Daily Deficit</span>
                    <span class="summary-value">${Math.round(targets.calorie_breakdown.actualDeficitKcal || 0)} kcal/day</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Projected Weekly Loss</span>
                    <span class="summary-value">${(targets.calorie_breakdown.actualDeficitLbsPerWeek || 0).toFixed(2)} lbs/week</span>
                </div>
            </div>
            ${targets.calorie_breakdown.deficitWarnings && targets.calorie_breakdown.deficitWarnings.length > 0 ? `
                <div style="margin-top: 1rem; padding: 1rem; background: white; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <strong style="color: #ef4444;">⚠️ Safety Warnings:</strong>
                    <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0; list-style: disc;">
                        ${targets.calorie_breakdown.deficitWarnings.map(warn => `<li style="margin: 0.25rem 0;">${warn}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    ` : '';
    
    container.innerHTML = summaryHtml + fatLossHtml + timelineHtml + (planData.warnings && planData.warnings.length > 0 ? `
        <div class="summary-section">
            <h3>⚠️ Warnings</h3>
            <ul class="warnings-list">
                ${planData.warnings.map(warn => `<li>${warn}</li>`).join('')}
            </ul>
        </div>
    ` : '');
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

// Render timeline HTML (used by renderPlan)
function renderTimelineHTML(timeline, timelineTotals, targets) {
    // Sort chronologically
    timeline.sort((a, b) => a.time.localeCompare(b.time));
    
    const typeIcons = {
        meal: '🍽️',
        workout: '🏃',
        hydration: '💧'
    };
    
    // Store timeline for info modals
    window.currentTimeline = timeline;
    
    const html = timeline.map((entry, idx) => {
        // Build workout duration display if it's a workout
        let workoutInfo = '';
        if (entry.type === 'workout' && entry.duration_min) {
            workoutInfo = ` (${entry.duration_min} min${entry.intensity ? ', ' + entry.intensity : ''})`;
        }
        
        // Info button for this entry
        const infoBtn = `<button class="info-btn" onclick="showMealInfo(${idx})" title="Why these macros?">ℹ️</button>`;
        
        return `
        <div class="timeline-entry" style="background: ${idx % 2 === 0 ? 'var(--bg-subtle)' : 'white'};">
            <div class="timeline-time">${entry.time}</div>
            <div class="timeline-content">
                <h4>${typeIcons[entry.type] || '📌'} ${entry.name}${workoutInfo} ${infoBtn}</h4>
                <div class="timeline-macros">
                    ${entry.carbs_g || 0}g carbs | ${entry.protein_g || 0}g protein | 
                    ${entry.fat_g || 0}g fat | ${entry.calories || 0} kcal | 
                    💧 ${entry.hydration_ml || 0} ml | 🧂 ${entry.sodium_mg || 0} mg
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    return `
        <div class="summary-section" style="margin-top: 2rem;">
            <h3>Timeline</h3>
            ${html}
        </div>
    `;
}

// Render daily tip (now includes insight + pro tip)
function renderDailyTip(tipData) {
    // Handle both old format (just text) and new format (insight + pro_tip)
    let insightText = '';
    let proTipText = '';
    
    if (typeof tipData === 'string') {
        // Old format - just text
        insightText = tipData;
    } else if (tipData.text) {
        // Old format - object with text field
        insightText = tipData.text;
    } else {
        // New format - separate insight and pro_tip
        insightText = tipData.daily_insight || tipData.text || '';
        proTipText = tipData.pro_tip || '';
    }
    
    return `
        <div class="daily-tip-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <div class="tip-icon" style="font-size: 2rem; flex-shrink: 0;">💡</div>
                <div class="tip-content" style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0; color: white; font-size: 1rem; font-weight: 600;">Today's Insight</h4>
                    <p style="margin: 0; font-size: 1.125rem; line-height: 1.4; font-weight: 500;">${insightText}</p>
                </div>
            </div>
        </div>
        ${proTipText ? `
        <div class="pro-tip-card" style="background: white; border-left: 4px solid #10b981; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <div style="font-size: 1.5rem; flex-shrink: 0;">🎯</div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #10b981; font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Pro Tip</h4>
                    <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 0.9375rem;">${proTipText}</p>
                </div>
            </div>
        </div>
        ` : ''}
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


// Show target info modal
window.showTargetInfo = function(metricKey) {
    if (!context || !context.calculated_targets) return;
    
    const targets = context.calculated_targets;
    const explanations = targets.explanations || {};
    const breakdown = targets.calorie_breakdown || {};
    
    let title = '';
    let content = '';
    
    switch(metricKey) {
        case 'calories':
            title = '🔥 Daily Calorie Target';
            if (breakdown.isFatLoss) {
                const deficitAmount = breakdown.tdee - breakdown.total;
                content = `
                    <div class="info-breakdown">
                        <h4>Your Target: ${targets.daily_energy_target_kcal} kcal/day</h4>
                        <div class="breakdown-row">
                            <span>1️⃣ Base Metabolism (BMR):</span>
                            <span>${breakdown.bmr} kcal</span>
                        </div>
                        <div class="breakdown-row">
                            <span>2️⃣ Activity Factor:</span>
                            <span>× ${breakdown.activityFactor} (${breakdown.activityLevel})</span>
                        </div>
                        <div class="breakdown-row">
                            <span>3️⃣ TDEE (Maintenance):</span>
                            <span>${breakdown.tdee} kcal</span>
                        </div>
                        <div class="breakdown-row deficit">
                            <span>4️⃣ Fat Loss Deficit (${breakdown.deficitPercent}%):</span>
                            <span>-${deficitAmount} kcal</span>
                        </div>
                        <div class="breakdown-total">
                            <span><strong>Daily Target:</strong></span>
                            <span><strong>${breakdown.total} kcal</strong></span>
                        </div>
                    </div>
                    <p class="info-explanation">${explanations.calories || ''}</p>
                    <p class="info-note">✅ <strong>Safe & Sustainable:</strong> This ${breakdown.deficitPercent}% deficit is applied to your TDEE (which already includes your training). No need to "add back" workout calories - your activity is built into the calculation! This supports ~0.5-1% bodyweight loss per week while maintaining training performance.</p>
                `;
            } else if (breakdown.isSurplus) {
                const surplusAmount = breakdown.total - breakdown.tdee;
                content = `
                    <div class="info-breakdown">
                        <h4>Your Target: ${targets.daily_energy_target_kcal} kcal/day</h4>
                        <div class="breakdown-row">
                            <span>1️⃣ Base Metabolism (BMR):</span>
                            <span>${breakdown.bmr} kcal</span>
                        </div>
                        <div class="breakdown-row">
                            <span>2️⃣ Activity Factor:</span>
                            <span>× ${breakdown.activityFactor} (${breakdown.activityLevel})</span>
                        </div>
                        <div class="breakdown-row">
                            <span>3️⃣ TDEE (Maintenance):</span>
                            <span>${breakdown.tdee} kcal</span>
                        </div>
                        <div class="breakdown-row positive">
                            <span>4️⃣ Muscle Gain Surplus:</span>
                            <span>+${surplusAmount} kcal</span>
                        </div>
                        <div class="breakdown-total">
                            <span><strong>Daily Target:</strong></span>
                            <span><strong>${breakdown.total} kcal</strong></span>
                        </div>
                    </div>
                    <p class="info-explanation">${explanations.calories || ''}</p>
                `;
            } else {
                content = `
                    <div class="info-breakdown">
                        <h4>Your Target: ${targets.daily_energy_target_kcal} kcal/day</h4>
                        <div class="breakdown-row">
                            <span>1️⃣ Base Metabolism (BMR):</span>
                            <span>${breakdown.bmr} kcal</span>
                        </div>
                        <div class="breakdown-row">
                            <span>2️⃣ Activity Factor:</span>
                            <span>× ${breakdown.activityFactor} (${breakdown.activityLevel})</span>
                        </div>
                        <div class="breakdown-total">
                            <span><strong>TDEE (Maintenance):</strong></span>
                            <span><strong>${breakdown.total} kcal</strong></span>
                        </div>
                    </div>
                    <p class="info-explanation">${explanations.calories || ''}</p>
                `;
            }
            break;
            
        case 'protein':
            title = '🥩 Daily Protein Target';
            content = `
                <h4>Your Target: ${targets.daily_protein_target_g} g</h4>
                <p class="info-explanation">${explanations.protein || ''}</p>
            `;
            break;
            
        case 'carbs':
            title = '🍞 Daily Carbohydrate Target';
            content = `
                <h4>Your Target: ${targets.daily_carb_target_g} g</h4>
                <p class="info-explanation">${explanations.carbs || ''}</p>
            `;
            break;
            
        case 'fat':
            title = '🥑 Daily Fat Target';
            content = `
                <h4>Your Target: ${targets.daily_fat_target_g} g</h4>
                <p class="info-explanation">${explanations.fat || ''}</p>
            `;
            break;
            
        case 'sodium':
            title = '🧂 Daily Sodium Target';
            content = `
                <h4>Your Target: ${targets.sodium_target_mg} mg</h4>
                <p class="info-explanation">${explanations.sodium || ''}</p>
            `;
            break;
            
        case 'hydration':
            title = '💧 Daily Hydration Target';
            content = `
                <h4>Your Target: ${targets.hydration_target_l} L</h4>
                <p class="info-explanation">${explanations.hydration || ''}</p>
            `;
            break;
            
        case 'overview':
            title = '📊 Daily Targets Overview';
            content = `
                <p class="info-explanation">These targets are calculated based on your athlete profile, training load, and goals. Click the ℹ️ icon next to any metric to see detailed calculation breakdown.</p>
            `;
            break;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'info-modal';
    modal.innerHTML = `
        <div class="info-modal-content">
            <div class="info-modal-header">
                <h3>${title}</h3>
                <button class="info-modal-close" onclick="this.closest('.info-modal').remove()">×</button>
            </div>
            <div class="info-modal-body">
                ${content}
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Copy plan (summary + timeline)
function copyPlan() {
    if (!currentPlanData) {
        showStatus('No plan data available', 'error');
        return;
    }
    
    const summary = currentPlanData.daily_summary || {};
    const targets = context.calculated_targets;
    const timeline = [...(currentPlanData.timeline || [])].sort((a, b) => a.time.localeCompare(b.time));
    
    let text = `Daily Plan Summary\n`;
    text += `==================\n\n`;
    text += `Targets:\n`;
    text += `  Calories: ${targets.daily_energy_target_kcal || 0} kcal\n`;
    text += `  Carbs: ${targets.daily_carb_target_g || 0} g\n`;
    text += `  Protein: ${targets.daily_protein_target_g || 0} g\n`;
    text += `  Fat: ${targets.daily_fat_target_g || 0} g\n`;
    text += `  Sodium: ${targets.sodium_target_mg || 0} mg\n`;
    text += `  Hydration: ${targets.hydration_target_l || 0} L\n\n`;
    text += `Actual Totals:\n`;
    text += `  Calories: ${summary.calories || 0} kcal\n`;
    text += `  Carbs: ${summary.carbs_g || 0} g\n`;
    text += `  Protein: ${summary.protein_g || 0} g\n`;
    text += `  Fat: ${summary.fat_g || 0} g\n`;
    text += `  Sodium: ${summary.sodium_mg || 0} mg\n`;
    text += `  Hydration: ${summary.hydration_l || 0} L\n\n`;
    text += `Timeline:\n`;
    text += `==========\n`;
    text += timeline.map(e => 
        `${e.time} – ${e.name}\n→ ${e.carbs_g || 0}g C | ${e.protein_g || 0}g P | ${e.fat_g || 0}g F | ${e.calories || 0} kcal | ${e.hydration_ml || 0}ml | ${e.sodium_mg || 0}mg Na`
    ).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showStatus('Plan copied to clipboard!', 'success');
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
    
    const infoModal = document.getElementById('calculationInfoModal');
    if (infoModal && e.target === infoModal) {
        closeInfoModal();
    }
});

// Calculation info modal functions
function showTargetInfo(key) {
    const athlete = context?.athlete || {};
    const targets = context?.calculated_targets || {};
    const workouts = context?.workouts || [];
    
    let title = '';
    let body = '';
    
    const bw = athlete.weight_kg || 70;
    const goal = athlete.goal || 'performance';
    const phase = athlete.phase || 'base';
    
    switch(key) {
        case 'overview':
            title = 'Daily Targets Overview';
            body = `
                <div class="info-explanation">
                    <p>Your daily macro targets are calculated using research-based formulas that account for:</p>
                    <ul>
                        <li><strong>Body weight</strong> (${bw} kg)</li>
                        <li><strong>Training load</strong> (${workouts.length} workout${workouts.length === 1 ? '' : 's'})</li>
                        <li><strong>Goal</strong> (${goal})</li>
                        <li><strong>Training phase</strong> (${phase})</li>
                    </ul>
                    <p>Click the ℹ️ button next to each macro to see how it was calculated.</p>
                </div>
            `;
            break;
            
        case 'calories':
            const bmr = Math.round(370 + (21.6 * bw));
            const tdee = Math.round(bmr * 1.5); // Moderate activity
            title = 'Daily Calories Target';
            body = `
                <div class="info-breakdown">
                    <div class="breakdown-row">
                        <span>Basal Metabolic Rate (BMR)</span>
                        <span><strong>${bmr} kcal</strong></span>
                    </div>
                    <div class="breakdown-row">
                        <span>Activity Factor (moderate)</span>
                        <span><strong>×1.5</strong></span>
                    </div>
                    <div class="breakdown-total">
                        <span>Total Daily Energy Expenditure (TDEE)</span>
                        <span><strong>${tdee} kcal</strong></span>
                    </div>
                </div>
                <div class="info-note">
                    <strong>Note:</strong> This TDEE already includes your training energy expenditure. 
                    Workouts add extra carbs for performance, but don't add extra calories on top.
                </div>
                <div class="info-explanation">
                    <p><strong>Formula:</strong> BMR = 370 + (21.6 × body weight)</p>
                    <p>Research: Cunningham Equation (validated for athletes)</p>
                </div>
            `;
            break;
            
        case 'carbs':
            const carbsPerKg = targets.carb_factor_g_per_kg || 7;
            title = 'Carbohydrate Target';
            body = `
                <div class="info-breakdown">
                    <div class="breakdown-row">
                        <span>Body Weight</span>
                        <span><strong>${bw} kg</strong></span>
                    </div>
                    <div class="breakdown-row">
                        <span>Carb Factor (training load)</span>
                        <span><strong>${carbsPerKg} g/kg</strong></span>
                    </div>
                    <div class="breakdown-total">
                        <span>Daily Carbohydrate Target</span>
                        <span><strong>${Math.round(bw * carbsPerKg)} g</strong></span>
                    </div>
                </div>
                <div class="info-explanation">
                    <p><strong>Calculation:</strong> ${bw} kg × ${carbsPerKg} g/kg = ${Math.round(bw * carbsPerKg)}g</p>
                    <p><strong>Why this amount?</strong> Based on your training load, this ensures adequate glycogen for performance and recovery.</p>
                    <p><strong>Research:</strong> IOC Consensus Statement (Burke et al., 2011) - Athletes need 5-12 g/kg/day based on training intensity.</p>
                </div>
            `;
            break;
            
        case 'protein':
            const proteinPerKg = targets.protein_factor_g_per_kg || 2.0;
            title = 'Protein Target';
            body = `
                <div class="info-breakdown">
                    <div class="breakdown-row">
                        <span>Body Weight</span>
                        <span><strong>${bw} kg</strong></span>
                    </div>
                    <div class="breakdown-row">
                        <span>Protein Factor (goal: ${goal})</span>
                        <span><strong>${proteinPerKg} g/kg</strong></span>
                    </div>
                    <div class="breakdown-total">
                        <span>Daily Protein Target</span>
                        <span><strong>${Math.round(bw * proteinPerKg)} g</strong></span>
                    </div>
                </div>
                <div class="info-explanation">
                    <p><strong>Calculation:</strong> ${bw} kg × ${proteinPerKg} g/kg = ${Math.round(bw * proteinPerKg)}g</p>
                    <p><strong>Why this amount?</strong> Supports muscle repair, recovery, and adaptation from training.</p>
                    <p><strong>Research:</strong> ISSN Position Stand (Jäger et al., 2017) - Endurance athletes need 1.2-2.0 g/kg/day; strength athletes up to 2.2 g/kg/day.</p>
                </div>
            `;
            break;
            
        case 'fat':
            const fatCals = Math.round((targets.daily_fat_target_g || 50) * 9);
            title = 'Fat Target';
            body = `
                <div class="info-breakdown">
                    <div class="breakdown-row">
                        <span>Daily Fat Target</span>
                        <span><strong>${targets.daily_fat_target_g || 0} g</strong></span>
                    </div>
                    <div class="breakdown-row">
                        <span>Calories from Fat (9 kcal/g)</span>
                        <span><strong>${fatCals} kcal</strong></span>
                    </div>
                </div>
                <div class="info-explanation">
                    <p><strong>How it's calculated:</strong> Fat fills remaining calories after carbs and protein are allocated.</p>
                    <p><strong>Formula:</strong> Fat (g) = [TDEE - (Carbs × 4) - (Protein × 4)] ÷ 9</p>
                    <p><strong>Why?</strong> Ensures adequate energy intake while prioritizing carbs for performance and protein for recovery.</p>
                    <p><strong>Research:</strong> Fat should provide 20-35% of total daily calories for athletes (ACSM, 2016).</p>
                </div>
            `;
            break;
            
        case 'sodium':
            const baseSodium = 2000; // mg baseline
            const sweatLoss = workouts.length * 500; // ~500mg per workout
            title = 'Sodium Target';
            body = `
                <div class="info-breakdown">
                    <div class="breakdown-row">
                        <span>Baseline Sodium Needs</span>
                        <span><strong>${baseSodium} mg</strong></span>
                    </div>
                    <div class="breakdown-row positive">
                        <span>Sweat Loss (${workouts.length} workout${workouts.length === 1 ? '' : 's'})</span>
                        <span><strong>+${sweatLoss} mg</strong></span>
                    </div>
                    <div class="breakdown-total">
                        <span>Total Sodium Target</span>
                        <span><strong>${targets.sodium_target_mg || 0} mg</strong></span>
                    </div>
                </div>
                <div class="info-explanation">
                    <p><strong>Calculation:</strong> ${baseSodium} mg baseline + ~500-1000 mg per hour of training</p>
                    <p><strong>Why?</strong> Athletes lose 500-1500 mg sodium per liter of sweat. Adequate sodium prevents hyponatremia and supports performance.</p>
                    <p><strong>Research:</strong> ACSM Position Stand on Fluid Replacement (2007) - Active individuals need 1500-2300 mg/day baseline plus sweat losses.</p>
                </div>
            `;
            break;
            
        case 'hydration':
            const baseFluid = 2.0; // liters
            const trainingFluid = workouts.length * 0.5; // ~500ml per hour
            title = 'Hydration Target';
            body = `
                <div class="info-breakdown">
                    <div class="breakdown-row">
                        <span>Baseline Fluid Needs</span>
                        <span><strong>${baseFluid} L</strong></span>
                    </div>
                    <div class="breakdown-row positive">
                        <span>Training Fluid (${workouts.length} workout${workouts.length === 1 ? '' : 's'})</span>
                        <span><strong>+${trainingFluid.toFixed(1)} L</strong></span>
                    </div>
                    <div class="breakdown-total">
                        <span>Total Hydration Target</span>
                        <span><strong>${targets.hydration_target_l || 0} L</strong></span>
                    </div>
                </div>
                <div class="info-explanation">
                    <p><strong>Calculation:</strong> 2-3L baseline + 500-1000ml per hour of training</p>
                    <p><strong>Why?</strong> Maintains plasma volume, thermoregulation, and cardiovascular function during exercise.</p>
                    <p><strong>Research:</strong> ACSM recommends 5-10 ml/kg body weight 2-4 hours pre-exercise, plus 200-300ml every 10-20 minutes during exercise.</p>
                </div>
            `;
            break;
    }
    
    document.getElementById('infoModalTitle').textContent = title;
    document.getElementById('infoModalBody').innerHTML = body;
    document.getElementById('calculationInfoModal').style.display = 'flex';
}

function showMealInfo(entryIdx) {
    if (!window.currentTimeline || !window.currentTimeline[entryIdx]) {
        console.error('No timeline entry found at index', entryIdx);
        return;
    }
    
    const entry = window.currentTimeline[entryIdx];
    const athlete = context?.athlete || {};
    const bw = athlete.weight_kg || 70;
    
    let title = `${entry.name}`;
    let body = '';
    
    const carbCals = (entry.carbs_g || 0) * 4;
    const proteinCals = (entry.protein_g || 0) * 4;
    const fatCals = (entry.fat_g || 0) * 9;
    
    // Build explanation based on entry type and name
    if (entry.type === 'workout') {
        title = `Workout Fuel: ${entry.name}`;
        body = `
            <div class="info-explanation">
                <p><strong>Type:</strong> Intra-workout carbohydrate fueling</p>
                <p><strong>Goal:</strong> Maintain blood glucose and delay fatigue during exercise</p>
            </div>
            <div class="info-breakdown">
                <h4>Fueling Breakdown</h4>
                <div class="breakdown-row">
                    <span>Carbohydrates</span>
                    <span><strong>${entry.carbs_g || 0}g (${carbCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Hydration</span>
                    <span><strong>${entry.hydration_ml || 0} ml</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Sodium (electrolytes)</span>
                    <span><strong>${entry.sodium_mg || 0} mg</strong></span>
                </div>
            </div>
            <div class="info-note">
                <strong>Research:</strong> For workouts >60 minutes, consuming 30-60g carbs/hour delays fatigue and improves performance (Burke et al., 2011).
            </div>
        `;
    } else if (entry.name && entry.name.toLowerCase().includes('pre-')) {
        title = `Pre-Workout Meal: ${entry.name}`;
        body = `
            <div class="info-explanation">
                <p><strong>Timing:</strong> ${entry.time} (${context?.pre_workout_timing_min || 90} minutes before workout)</p>
                <p><strong>Goal:</strong> Top off glycogen stores and provide sustained energy without GI distress</p>
            </div>
            <div class="info-breakdown">
                <h4>Macro Breakdown</h4>
                <div class="breakdown-row">
                    <span>Carbohydrates</span>
                    <span><strong>${entry.carbs_g || 0}g (~1g/kg BW)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Protein</span>
                    <span><strong>${entry.protein_g || 0}g (muscle protection)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Fat</span>
                    <span><strong>${entry.fat_g || 0}g (kept low for digestion)</strong></span>
                </div>
                <div class="breakdown-total">
                    <span>Total</span>
                    <span><strong>${entry.calories || 0} kcal</strong></span>
                </div>
            </div>
            <div class="info-note">
                <strong>Research:</strong> Pre-workout meals should emphasize carbs (1-4 g/kg) consumed 1-4 hours before exercise (ACSM/ISSN guidelines).
            </div>
        `;
    } else if (entry.name && (entry.name.toLowerCase().includes('post-') || entry.name === 'Breakfast' || entry.name === 'Lunch')) {
        // Check if this is post-workout based on timeline
        const prevEntry = entryIdx > 0 ? window.currentTimeline[entryIdx - 1] : null;
        const isPostWorkout = prevEntry && prevEntry.type === 'workout';
        
        title = isPostWorkout ? `Post-Workout Meal: ${entry.name}` : `Meal: ${entry.name}`;
        
        const explanation = isPostWorkout 
            ? '<p><strong>Goal:</strong> Replenish glycogen, initiate muscle repair, and rehydrate</p>' 
            : '<p><strong>Goal:</strong> Provide balanced nutrition and contribute to daily macro targets</p>';
        
        const researchNote = isPostWorkout
            ? '<strong>Research:</strong> Consuming carbs + protein within 2 hours post-exercise optimizes recovery (Jäger et al., 2017). Recommended ratio: 3-4:1 carbs:protein.'
            : '<strong>Distribution:</strong> Regular meals are distributed evenly across the day to meet remaining macro needs after workout fueling.';
        
        body = `
            <div class="info-explanation">
                <p><strong>Timing:</strong> ${entry.time}</p>
                ${explanation}
            </div>
            <div class="info-breakdown">
                <h4>Macro Breakdown</h4>
                <div class="breakdown-row">
                    <span>Carbohydrates</span>
                    <span><strong>${entry.carbs_g || 0}g (${carbCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Protein</span>
                    <span><strong>${entry.protein_g || 0}g (${proteinCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Fat</span>
                    <span><strong>${entry.fat_g || 0}g (${fatCals} kcal)</strong></span>
                </div>
                <div class="breakdown-total">
                    <span>Total</span>
                    <span><strong>${entry.calories || 0} kcal</strong></span>
                </div>
            </div>
            <div class="info-note">
                ${researchNote}
            </div>
        `;
    } else if (entry.name === 'Dinner') {
        title = `Dinner`;
        body = `
            <div class="info-explanation">
                <p><strong>Timing:</strong> ${entry.time}</p>
                <p><strong>Goal:</strong> Main meal providing substantial calories and balanced macros for recovery and daily needs</p>
            </div>
            <div class="info-breakdown">
                <h4>Macro Breakdown</h4>
                <div class="breakdown-row">
                    <span>Carbohydrates</span>
                    <span><strong>${entry.carbs_g || 0}g (${carbCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Protein</span>
                    <span><strong>${entry.protein_g || 0}g (${proteinCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Fat</span>
                    <span><strong>${entry.fat_g || 0}g (${fatCals} kcal)</strong></span>
                </div>
                <div class="breakdown-total">
                    <span>Total</span>
                    <span><strong>${entry.calories || 0} kcal</strong></span>
                </div>
            </div>
            <div class="info-note">
                <strong>Tip:</strong> Dinner often serves as both recovery meal and main calorie source. Higher in both carbs and protein to support overnight recovery.
            </div>
        `;
    } else {
        // Generic meal/snack
        title = `${entry.name}`;
        body = `
            <div class="info-explanation">
                <p><strong>Timing:</strong> ${entry.time}</p>
                <p><strong>Type:</strong> Regular meal contributing to daily macro targets</p>
            </div>
            <div class="info-breakdown">
                <h4>Macro Breakdown</h4>
                <div class="breakdown-row">
                    <span>Carbohydrates</span>
                    <span><strong>${entry.carbs_g || 0}g (${carbCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Protein</span>
                    <span><strong>${entry.protein_g || 0}g (${proteinCals} kcal)</strong></span>
                </div>
                <div class="breakdown-row">
                    <span>Fat</span>
                    <span><strong>${entry.fat_g || 0}g (${fatCals} kcal)</strong></span>
                </div>
                <div class="breakdown-total">
                    <span>Total</span>
                    <span><strong>${entry.calories || 0} kcal</strong></span>
                </div>
            </div>
            <div class="info-note">
                <strong>Distribution:</strong> Remaining macros after workout fueling are distributed across ${context?.athlete?.meals_per_day || 3} meals per day.
            </div>
        `;
    }
    
    document.getElementById('infoModalTitle').textContent = title;
    document.getElementById('infoModalBody').innerHTML = body;
    document.getElementById('calculationInfoModal').style.display = 'flex';
}

function closeInfoModal(event) {
    // Only close if clicking backdrop or close button
    if (event && event.target !== event.currentTarget) {
        return;
    }
    document.getElementById('calculationInfoModal').style.display = 'none';
}

// Toggle fat loss rate options visibility
function toggleFatLossOptions() {
    const goalSelect = document.getElementById('goal');
    const fatLossContainer = document.getElementById('fatLossRateContainer');
    
    if (goalSelect && fatLossContainer) {
        if (goalSelect.value === 'fat_loss') {
            fatLossContainer.style.display = 'block';
        } else {
            fatLossContainer.style.display = 'none';
        }
    }
}

// Show fat loss strategy info
function showFatLossStrategyInfo() {
    const athlete = context?.athlete || {};
    const targets = context?.calculated_targets || {};
    const workouts = context?.workouts || [];
    const trainingLoad = workouts.reduce((sum, w) => {
        const hours = w.duration_min / 60;
        const intensityFactors = { 'low': 0.8, 'moderate': 1.2, 'high': 1.5, 'very_high': 1.8 };
        return sum + (hours * (intensityFactors[w.intensity] || 1.0));
    }, 0);
    
    const title = 'How BurnRate Creates Your Fat Loss Deficit';
    const body = `
        <div class="info-explanation">
            <p><strong>Smart Carb Cycling Strategy</strong> - We don't just cut calories blindly. Your deficit is created through research-based macro manipulation that preserves muscle and performance.</p>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #f59e0b; margin-top: 0;">🎯 The Strategy</h4>
            <div class="breakdown-row">
                <span><strong>1. Protein INCREASED:</strong></span>
                <span>2.3 g/kg (vs 1.6-1.8 for performance)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Why:</strong></span>
                <span>Preserves muscle mass during deficit (Morton et al. 2018)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>2. Carbs REDUCED:</strong></span>
                <span>Varies by training load (25-40% cut)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Why:</strong></span>
                <span>Creates calorie deficit while maintaining workout fuel</span>
            </div>
            <div class="breakdown-row">
                <span><strong>3. Fat MAINTAINED:</strong></span>
                <span>0.9 g/kg (slightly higher than performance)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Why:</strong></span>
                <span>Supports satiety, hormones, and vitamin absorption</span>
            </div>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #3b82f6; margin-top: 0;">📊 Your Daily Carb Cycling</h4>
            <p style="margin: 0.5rem 0;"><strong>Training Load: ${trainingLoad.toFixed(2)}</strong></p>
            ${trainingLoad < 0.5 ? `
                <div class="breakdown-row">
                    <span><strong>Rest Day Strategy:</strong></span>
                    <span>40% carb reduction</span>
                </div>
                <div class="breakdown-row">
                    <span><strong>Rationale:</strong></span>
                    <span>Maximize fat burning when glycogen demand is low</span>
                </div>
            ` : trainingLoad < 1.5 ? `
                <div class="breakdown-row">
                    <span><strong>Light Training Strategy:</strong></span>
                    <span>35% carb reduction</span>
                </div>
                <div class="breakdown-row">
                    <span><strong>Rationale:</strong></span>
                    <span>Balance fat loss with easy workout fueling</span>
                </div>
            ` : trainingLoad < 3.0 ? `
                <div class="breakdown-row">
                    <span><strong>Moderate Training Strategy:</strong></span>
                    <span>30% carb reduction</span>
                </div>
                <div class="breakdown-row">
                    <span><strong>Rationale:</strong></span>
                    <span>Maintain workout quality while creating deficit</span>
                </div>
            ` : `
                <div class="breakdown-row">
                    <span><strong>Heavy Training Strategy:</strong></span>
                    <span>25% carb reduction (conservative)</span>
                </div>
                <div class="breakdown-row">
                    <span><strong>Rationale:</strong></span>
                    <span>Preserve performance on key training days</span>
                </div>
            `}
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #10b981; margin-top: 0;">⚡ Workout Fuel Priority</h4>
            <div class="breakdown-row">
                <span><strong>Pre-Workout:</strong></span>
                <span>Carbs prioritized (~1 g/kg)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Intra-Workout:</strong></span>
                <span>Full fueling maintained (30-60g/hr)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Post-Workout:</strong></span>
                <span>Recovery optimized (1 g/kg carbs + 0.35 g/kg protein)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Regular Meals:</strong></span>
                <span>Reduced to create deficit</span>
            </div>
        </div>
        
        <div class="info-note">
            <strong>📚 Research Support:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li><strong>Morton et al. (2018):</strong> High protein (2.3+ g/kg) preserves 95-98% muscle mass during deficit</li>
                <li><strong>Burke et al. (2011):</strong> Carb periodization maintains performance better than chronic restriction</li>
                <li><strong>Helms et al. (2014):</strong> Athletes should lose 0.5-1% body weight/week maximum</li>
                <li><strong>ACSM (2016):</strong> Maintain workout fueling even in deficit to preserve training adaptations</li>
            </ul>
        </div>
        
        <div class="info-explanation" style="background: #d1fae5; padding: 1rem; border-radius: 6px; margin-top: 1rem; border-left: 4px solid #10b981;">
            <strong>✅ Why This Works Better Than Generic Dieting:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li><strong>Muscle preservation:</strong> High protein + resistance training</li>
                <li><strong>Performance maintenance:</strong> Workouts still properly fueled</li>
                <li><strong>Metabolic adaptation minimized:</strong> Cycling carbs by training load</li>
                <li><strong>Adherence:</strong> Not hungry on training days when calories are higher</li>
                <li><strong>Sustainable:</strong> Can maintain for 8-16 weeks without burnout</li>
            </ul>
        </div>
    `;
    
    document.getElementById('infoModalTitle').textContent = title;
    document.getElementById('infoModalBody').innerHTML = body;
    document.getElementById('calculationInfoModal').style.display = 'flex';
}

// Show fat loss rate guide
function showFatLossRateGuide() {
    const athlete = context?.athlete || {};
    const weight_kg = athlete.weight_kg || 70;
    const weight_lbs = Math.round(weight_kg * 2.20462);
    
    // Calculate 1% body weight per week (research-based max)
    const maxSafeRate = weight_lbs * 0.01;
    
    const title = 'Safe Fat Loss Rates';
    const body = `
        <div class="info-explanation">
            <p><strong>How fast should you lose fat?</strong> Research shows that losing too fast causes muscle loss and performance decline.</p>
            <p>Your body weight: <strong>${weight_kg} kg (${weight_lbs} lbs)</strong></p>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #10b981; margin-top: 0;">🟢 Conservative: 0.5 lbs/week</h4>
            <div class="breakdown-row">
                <span><strong>Daily Deficit:</strong></span>
                <span>~250 kcal/day</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Muscle Preservation:</strong></span>
                <span>Excellent (99%+ retention)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Performance Impact:</strong></span>
                <span>Minimal - can maintain training intensity</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Best For:</strong></span>
                <span>Athletes with <10 lbs to lose, in-season training</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Time to Lose 10 lbs:</strong></span>
                <span>~20 weeks (5 months)</span>
            </div>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #3b82f6; margin-top: 0;">🔵 Moderate: 1.0 lbs/week (Recommended)</h4>
            <div class="breakdown-row">
                <span><strong>Daily Deficit:</strong></span>
                <span>~500 kcal/day</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Muscle Preservation:</strong></span>
                <span>Very Good (95-98% retention with high protein)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Performance Impact:</strong></span>
                <span>Slight - may need to reduce volume 5-10%</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Best For:</strong></span>
                <span>Most athletes, 10-30 lbs to lose, off-season</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Time to Lose 10 lbs:</strong></span>
                <span>~10 weeks (2.5 months)</span>
            </div>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #f59e0b; margin-top: 0;">🟠 Aggressive: 1.5 lbs/week</h4>
            <div class="breakdown-row">
                <span><strong>Daily Deficit:</strong></span>
                <span>~750 kcal/day</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Muscle Preservation:</strong></span>
                <span>Good (90-95% retention - requires strict protein intake)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Performance Impact:</strong></span>
                <span>Moderate - expect 10-15% performance decline</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Best For:</strong></span>
                <span>Athletes with >30 lbs to lose, early off-season</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Time to Lose 10 lbs:</strong></span>
                <span>~7 weeks (1.75 months)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>⚠️ Risk Level:</strong></span>
                <span>Higher - monitor energy, recovery, and strength</span>
            </div>
        </div>
        
        <div class="info-note">
            <strong>📊 Research-Based Guidelines:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li><strong>Maximum safe rate: 1% of body weight per week</strong> (${maxSafeRate.toFixed(2)} lbs/week for you)</li>
                <li><strong>Morton et al. (2018):</strong> High protein (2.3 g/kg) preserves muscle during deficit</li>
                <li><strong>Helms et al. (2014):</strong> Athletes should lose 0.5-1% body weight/week max</li>
                <li><strong>ACSM (2016):</strong> Minimum 1200 kcal/day (women), 1500 kcal/day (men)</li>
            </ul>
        </div>
        
        <div class="info-explanation" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
            <strong>🎯 How BurnRate Creates the Deficit:</strong>
            <p style="margin: 0.5rem 0 0 0;"><strong>Smart Carb Cycling</strong> - we don't just cut calories blindly:</p>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li><strong>Rest days:</strong> Larger carb cut (30-40%) → maximize fat burning</li>
                <li><strong>Training days:</strong> Smaller carb cut (25-30%) → maintain performance</li>
                <li><strong>Protein:</strong> INCREASED to 2.3 g/kg → preserve muscle</li>
                <li><strong>Pre/post-workout:</strong> Carbs prioritized → fuel key sessions</li>
            </ul>
        </div>
        
        <div class="info-explanation" style="background: #fee2e2; padding: 1rem; border-radius: 6px; margin-top: 1rem; border-left: 4px solid #ef4444;">
            <strong>⚠️ Warning Signs You're Losing Too Fast:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li>Strength declining >10% in key lifts</li>
                <li>Constant fatigue, poor sleep quality</li>
                <li>Increased resting heart rate (>5 bpm)</li>
                <li>Getting sick frequently</li>
                <li>Losing >2 lbs/week for multiple weeks</li>
            </ul>
            <p style="margin: 0.5rem 0 0 0; font-style: italic;">If you see these signs, reduce your deficit immediately.</p>
        </div>
    `;
    
    document.getElementById('infoModalTitle').textContent = title;
    document.getElementById('infoModalBody').innerHTML = body;
    document.getElementById('calculationInfoModal').style.display = 'flex';
}

// Show intensity estimation guide
function showIntensityGuide() {
    const title = 'How to Estimate Workout Intensity';
    const body = `
        <div class="info-explanation">
            <p><strong>Choosing the right intensity is critical</strong> - it directly affects your daily carb and calorie targets.</p>
            <p>Use this guide to estimate intensity without a power meter or heart rate monitor:</p>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #10b981; margin-top: 0;">🟢 Low Intensity (0.8x factor)</h4>
            <div class="breakdown-row">
                <span><strong>Heart Rate Zones:</strong></span>
                <span>Zone 1-2 (50-70% max HR)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>RPE (Rate of Perceived Exertion):</strong></span>
                <span>2-4 out of 10</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Talk Test:</strong></span>
                <span>Can hold full conversation easily</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Breathing:</strong></span>
                <span>Nasal breathing, relaxed</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Examples:</strong></span>
                <span>Recovery jog, easy spin, yoga, active rest</span>
            </div>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #3b82f6; margin-top: 0;">🔵 Moderate Intensity (1.2x factor)</h4>
            <div class="breakdown-row">
                <span><strong>Heart Rate Zones:</strong></span>
                <span>Zone 3 (70-80% max HR)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>RPE:</strong></span>
                <span>5-6 out of 10</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Talk Test:</strong></span>
                <span>Can talk in sentences, slightly labored</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Breathing:</strong></span>
                <span>Moderate, rhythmic breathing</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Examples:</strong></span>
                <span>Long run, endurance ride, steady swim, "all-day" pace</span>
            </div>
            <div class="breakdown-row">
                <span><strong>TrainingPeaks Equivalent:</strong></span>
                <span>IF 0.65-0.75, TSS ~50-70/hour</span>
            </div>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #f59e0b; margin-top: 0;">🟠 High Intensity (1.5x factor)</h4>
            <div class="breakdown-row">
                <span><strong>Heart Rate Zones:</strong></span>
                <span>Zone 4 (80-90% max HR)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>RPE:</strong></span>
                <span>7-8 out of 10</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Talk Test:</strong></span>
                <span>Can only speak a few words at a time</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Breathing:</strong></span>
                <span>Deep, forceful breathing</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Examples:</strong></span>
                <span>Tempo run, threshold intervals, race pace, "comfortably hard"</span>
            </div>
            <div class="breakdown-row">
                <span><strong>TrainingPeaks Equivalent:</strong></span>
                <span>IF 0.75-0.85, TSS ~80-100/hour</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Sustainability:</strong></span>
                <span>Can maintain 30-60 minutes</span>
            </div>
        </div>
        
        <div class="info-breakdown" style="margin-bottom: 1.5rem;">
            <h4 style="color: #ef4444; margin-top: 0;">🔴 Very High Intensity (1.8x factor)</h4>
            <div class="breakdown-row">
                <span><strong>Heart Rate Zones:</strong></span>
                <span>Zone 5 (90-100% max HR)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>RPE:</strong></span>
                <span>9-10 out of 10 (maximum effort)</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Talk Test:</strong></span>
                <span>Cannot talk, gasping</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Breathing:</strong></span>
                <span>Maximal, can't get enough air</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Examples:</strong></span>
                <span>VO2max intervals, hill repeats, sprint intervals, races</span>
            </div>
            <div class="breakdown-row">
                <span><strong>TrainingPeaks Equivalent:</strong></span>
                <span>IF 0.85-1.05+, TSS ~100-150/hour</span>
            </div>
            <div class="breakdown-row">
                <span><strong>Sustainability:</strong></span>
                <span>Can only maintain 2-8 minutes per interval</span>
            </div>
        </div>
        
        <div class="info-note">
            <strong>💡 Pro Tips:</strong>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li>When in doubt, <strong>estimate conservatively</strong> (choose lower intensity)</li>
                <li>Most "steady" workouts are <strong>Moderate</strong>, not High</li>
                <li><strong>High</strong> should feel uncomfortable - if it felt "good", it was probably Moderate</li>
                <li><strong>Very High</strong> is truly maximal - you shouldn't do this often</li>
                <li>Mixed workouts (e.g., intervals + recovery): Use the <strong>dominant intensity</strong> or calculate weighted average</li>
            </ul>
        </div>
        
        <div class="info-explanation" style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin-top: 1rem;">
            <strong>⚠️ Impact on Nutrition:</strong>
            <p style="margin: 0.5rem 0 0 0;">A 70kg athlete doing 2 hours of training:</p>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                <li><strong>Moderate</strong> (1.2x) → Training Load 2.4 → ~560g carbs → 3,200 kcal</li>
                <li><strong>High</strong> (1.5x) → Training Load 3.0 → ~700g carbs → 3,900 kcal</li>
            </ul>
            <p style="margin: 0.5rem 0 0 0; font-style: italic;">That's a 700 kcal difference! Get it right.</p>
        </div>
    `;
    
    document.getElementById('infoModalTitle').textContent = title;
    document.getElementById('infoModalBody').innerHTML = body;
    document.getElementById('calculationInfoModal').style.display = 'flex';
}

