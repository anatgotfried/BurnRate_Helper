// BurnRate Meal Playground - Main Script
const VERSION = '1.6.2';
const VERSION_DATE = '2025-11-04';

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5001' 
    : 'https://burn-rate-helper.vercel.app';

let workouts = [];
let researchCorpus = {};
let currentMealPlan = null;
let testAthletes = [];

// Load resources on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🍽️ BurnRate AI Meal Planner v' + VERSION + ' - Loading...');
    
    // Event listeners FIRST (before anything that could error)
    try {
        document.getElementById('addWorkoutBtn').addEventListener('click', addWorkout);
        document.getElementById('generateBtn').addEventListener('click', generateMealPlan);
        document.getElementById('viewPromptBtn').addEventListener('click', viewPromptOnly);
        document.getElementById('copyJsonBtn').addEventListener('click', copyJson);
        document.getElementById('loadAthleteSelect').addEventListener('change', loadAthleteProfile);
        document.getElementById('downloadJsonBtn').addEventListener('click', downloadJson);
        document.getElementById('feedbackBtn').addEventListener('click', openFeedbackModal);
        document.getElementById('copyPromptBtn')?.addEventListener('click', () => copyToClipboard('promptContent', 'Prompt'));
        document.getElementById('copyResponseBtn')?.addEventListener('click', () => copyToClipboard('responseContent', 'Response'));
        
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
        versionBadge.title = `Version ${VERSION} (${VERSION_DATE}) - Click for changelog`;
        versionBadge.addEventListener('click', showChangelog);
    }
    
    // Load resources
    try {
        await loadResources();
        showStatus(`Ready to generate meal plans! (v${VERSION})`, 'success');
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
    
    if (mastersCheckbox) mastersCheckbox.checked = profile.populations.includes('masters');
    if (femaleCheckbox) femaleCheckbox.checked = profile.populations.includes('female_specific');
    if (youthCheckbox) youthCheckbox.checked = profile.populations.includes('youth');
    
    // Clear existing workouts and load new ones
    workouts = [];
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

// Duplicate workout
function duplicateWorkout(id) {
    const workout = workouts.find(w => w.id === id);
    if (workout) {
        const duplicate = { ...workout, id: Date.now() };
        workouts.push(duplicate);
        renderWorkouts();
    }
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

// Generate Meal Plan
async function generateMealPlan() {
    console.log('🚀 Generate button clicked!');
    
    // Validate form
    if (!document.getElementById('profileForm').checkValidity()) {
        console.log('❌ Form validation failed');
        showStatus('Please fill in all required fields', 'error');
        return;
    }
    
    if (workouts.length === 0) {
        console.log('❌ No workouts');
        showStatus('Please add at least one workout', 'error');
        return;
    }
    
    console.log('✅ Validation passed, building context...');
    
    // Build context
    const context = buildContext();
    console.log('✅ Context built:', context);
    
    // ALWAYS use selected model (ignore two-phase for now)
    const selectedModel = document.getElementById('modelSelect').value;
    const twoPhaseMode = false; // Disabled - always use single-phase with selected model
    
    // Show loading
    showLoading(true);
    
    if (false && twoPhaseMode) { // Disabled for debugging
        // Use new two-phase generation
        showStatus('🚀 Two-phase generation: Calculating structure...', 'info');
        
        try {
            const mealPlan = await generateTwoPhase(context, researchCorpus);
            
            currentMealPlan = mealPlan;
            renderMealPlan(mealPlan);
            
            // Show cost info
            const fallbackCount = mealPlan.phases_used?.fallback_count || 0;
            let successMsg = 'Meal plan generated successfully!';
            if (fallbackCount > 0) {
                successMsg += ` (${fallbackCount} meals used Claude fallback)`;
            }
            showStatus(successMsg, 'success');
            
            // Show output section
            document.getElementById('outputSection').style.display = 'block';
            document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            console.error('Two-phase generation failed:', error);
            showStatus(`Error: ${error.message}. Try single-phase mode or Claude 3.5 Sonnet.`, 'error');
        } finally {
            showLoading(false);
        }
        
        return;
    }
    
    // Single-phase generation with selected model
    const prompt = buildPrompt(context);
    const model = selectedModel;
    
    // Store prompt for viewing
    window.lastPrompt = prompt;
    window.lastModel = model;
    
    // Show prompt stats
    const promptTokens = Math.ceil(prompt.length / 4);
    showStatus(`Generating with ${model}... (prompt: ~${promptTokens.toLocaleString()} tokens)`, 'info');
    
    // Update prompt tab
    document.getElementById('promptContent').textContent = prompt;
    
    try {
        const response = await fetch(`${API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                max_tokens: 10000  // Increased to 10k to prevent truncated JSON
            })
        });
        
        const data = await response.json();
        
        // ALWAYS show raw response for debugging  
        window.lastResponse = data;
        
        // Format response for better readability
        let responseDisplay = JSON.stringify(data, null, 2);
        
        // If raw_content exists and is large, show it separately
        if (data.raw_content && data.raw_content.length > 1000) {
            responseDisplay = `=== RESPONSE METADATA ===
${JSON.stringify({
    success: data.success,
    error: data.error,
    parse_error: data.parse_error,
    model: data.model,
    truncated: data.truncated,
    raw_content_length: data.raw_content?.length || 0,
    usage: data.usage
}, null, 2)}

=== RAW AI CONTENT (${data.raw_content.length} characters) ===
${data.raw_content}
`;
        }
        
        document.getElementById('responseContent').textContent = responseDisplay;
        
        // Show output section so user can see response
        document.getElementById('outputSection').style.display = 'block';
        
        if (!data.success) {
            // Show error but also the response
            switchTab('response');
            
            // Create detailed error object
            const error = new Error(data.error || 'Unknown error occurred');
            error.response = data;
            throw error;
        }
        
        // Handle response
        if (data.meal_plan) {
            currentMealPlan = data.meal_plan;
            renderMealPlan(currentMealPlan);
            
            // Calculate and display cost (if available)
            if (data.usage) {
                displayCost(data.usage, model, data.auto_fixed);
            } else {
                console.warn('No usage data in response');
            }
            
            showStatus('Meal plan generated successfully!', 'success');
            
            // Scroll to output
            document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            throw new Error('No meal plan in response');
        }
    } catch (error) {
        console.error('Generation failed:', error);
        
        // Show detailed error
        if (error.response) {
            showDetailedError(error.response);
        } else {
            showStatus(`Error: ${error.message}`, 'error');
        }
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
    const context = buildContext();
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
    
    // Add population flags (only if checkboxes exist)
    const mastersCheckbox = document.getElementById('masters');
    const femaleCheckbox = document.getElementById('female_specific');
    const youthCheckbox = document.getElementById('youth');
    
    if (mastersCheckbox?.checked) athlete.populations.push('masters');
    if (femaleCheckbox?.checked) athlete.populations.push('female_specific');
    if (youthCheckbox?.checked) athlete.populations.push('youth');
    
    // Normalize workout data for macro-calculator (expects duration_min)
    const normalizedWorkouts = workouts.map(w => ({
        ...w,
        duration_min: w.duration || w.duration_min || 60,
        temp_c: w.temperature || w.temp_c || 20,
        humidity_pct: w.humidity || w.humidity_pct || 60
    }));
    
    // Calculate daily targets using deterministic logic
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
    
    // Build the prompt
    const prompt = `You are a world-class sports nutritionist specializing in endurance athlete nutrition.

Generate a complete daily meal plan that perfectly matches the provided calculated targets and workout schedule. 
Follow strict quantitative and qualitative rules.

---

## RESEARCH CORPUS
${corpus && Object.keys(corpus).length > 0 ? JSON.stringify(corpus, null, 2) : 'Research corpus not available - use general sports nutrition principles'}

---

## ATHLETE PROFILE & CALCULATED TARGETS
${JSON.stringify(context, null, 2)}

---

## CRITICAL BEHAVIORAL RULES

1. **Quantitative accuracy**
   - Your daily_totals MUST match the provided calculated_targets (within ±2%). 
   - If totals do not meet targets, automatically add or remove foods to correct:
     - If carbs < target by >5%, add low-fat, high-carb items (e.g., rice, oats, banana, juice).
     - If fat > target by >10%, reduce added oils, avocado, or hummus.
     - If protein > target by >20%, reduce protein portions by 10–20%.
   - Always prefer minimal edits that preserve meal realism and timing.

2. **Macronutrient logic**
   - Carbs: Based on training load (calculated_targets provides exact amount).
   - Protein: ${context.calculated_targets.daily_protein_target_g}g total, spread evenly across meals (${Math.round(context.athlete.weight_kg * 0.3)}g per meal, 0.25–0.4 g/kg).
   - Fat: ${context.calculated_targets.daily_fat_target_g}g total (≤30% total calories).
   - Sodium: ${context.calculated_targets.sodium_target_mg}mg (±2%), distributed through meals, salt, and electrolytes.
   - Hydration: ${context.calculated_targets.hydration_target_l}L (±0.1 L).

3. **Meal distribution**
   - Include 7–9 total entries: breakfast, pre_workout, intra_workout, post_workout, lunch, dinner, snack, and hydration.
   - Spread protein and carbs evenly through the day.
   - Include intra- and post-workout meals for EVERY listed workout.
   - Time meals appropriately around workouts (pre: 1-2h before, post: within 1h after).

4. **Digestibility logic**
   - Pre-workout: low fiber, low fat, moderate protein, high carbs.
   - Intra-workout: simple carbs, electrolytes, minimal protein/fat.
   - Post-workout: 3:1 or 4:1 carb:protein ratio for glycogen repletion.
   - Avoid heavy fats within 2 hours of workouts.
   - Dinner and evening snack can include slower-digesting proteins or healthy fats.

5. **Sodium tracking**
   - Every food item includes sodium_mg.
   - If total sodium < target, add salt (1g salt = 400mg Na) or electrolyte drinks until target achieved.
   - Typical sodium sources: table salt, sports drinks, electrolyte tablets, processed foods, cheese.

6. **Localization (Israel)**
   - For every meal, include 3+ realistic Israeli alternatives (Tnuva, Osem, Strauss, Yotvata, Sabra, Tapuzina).
   - Maintain cultural realism for portion sizes and available foods.
   - Examples: "Tnuva Cottage Cheese 5%, 200g" or "Osem Oatmeal, 1 cup dry"

7. **Formatting**
   - Return ONLY valid JSON (no markdown, no explanations).
   - Use the exact JSON schema shown below.
   - No trailing commas, no commentary, no markdown fencing (no \`\`\`json).
   - First character must be { and last character must be }.

8. **Rationale quality**
   - 3–5 sentences per meal explaining timing, composition, purpose, and citations (Burke2011, Jeukendrup2011, Morton2018, McCubbin2025, ACSM2016, ISSN2017).
   - Explain WHY foods were chosen for this specific timing and workout context.
   - ${fastMode ? 'Summarize corpus evidence in 2 sentences max per meal.' : 'Expand rationales to 4–5 sentences with detailed citations.'}

9. **Validation hook**
   - Before output, recalculate all totals.
   - If total_calories, carbs, protein, or fat are outside ±2% tolerance, automatically rebalance and re-output.
   - Verify every food has sodium_mg value.
   - Verify daily totals match calculated_targets

## JSON STRUCTURE

{
  "athlete_summary": {
    "weight_kg": ${context.athlete.weight_kg},
    "daily_energy_target_kcal": ${context.calculated_targets.daily_energy_target_kcal},
    "daily_protein_target_g": ${context.calculated_targets.daily_protein_target_g},
    "daily_carb_target_g": ${context.calculated_targets.daily_carb_target_g},
    "daily_fat_target_g": ${context.calculated_targets.daily_fat_target_g},
    "hydration_target_l": ${context.calculated_targets.hydration_target_l},
    "sodium_target_mg": ${context.calculated_targets.sodium_target_mg},
    "calorie_breakdown": {
      "total": ${context.calculated_targets.calorie_breakdown?.total || context.calculated_targets.daily_energy_target_kcal},
      "bmr": ${context.calculated_targets.calorie_breakdown?.bmr || 0},
      "tdee": ${context.calculated_targets.calorie_breakdown?.tdee || 0},
      "activityFactor": ${context.calculated_targets.calorie_breakdown?.activityFactor || 1.2},
      "activityLevel": "${context.calculated_targets.calorie_breakdown?.activityLevel || 'Unknown'}",
      "isFatLoss": ${context.calculated_targets.calorie_breakdown?.isFatLoss || false},
      "isSurplus": ${context.calculated_targets.calorie_breakdown?.isSurplus || false},
      "deficitPercent": ${context.calculated_targets.calorie_breakdown?.deficitPercent || 0},
      "caloriesFromMacros": ${context.calculated_targets.calorie_breakdown?.caloriesFromMacros || 0}
    },
    "explanations": {
      "calories": "${context.calculated_targets.explanations.calories || 'Calorie target calculated'}",
      "protein": "${context.calculated_targets.explanations.protein || 'Protein target calculated'}",
      "carbs": "${context.calculated_targets.explanations.carbs || 'Carbs target calculated'}",
      "fat": "${context.calculated_targets.explanations.fat || 'Fat target calculated'}",
      "hydration": "${context.calculated_targets.explanations.hydration || 'Hydration target calculated'}",
      "sodium": "${context.calculated_targets.explanations.sodium || 'Sodium target calculated'}"
    }
  },
  "meals": [
    {
      "time": "HH:MM",
      "name": "Meal name",
      "type": "breakfast|pre_workout|intra_workout|post_workout|lunch|dinner|snack",
      "foods": [
        {
          "item": "Food name with portion (e.g., 'Banana, 1 medium (120g)')",
          "carbs_g": number,
          "protein_g": number,
          "fat_g": number,
          "sodium_mg": number,
          "calories": number
        }
      ],
      "total_carbs_g": number,
      "total_protein_g": number,
      "total_fat_g": number,
      "total_sodium_mg": number,
      "total_calories": number,
      "rationale": "3-5 sentences with research citations",
      "israel_alternatives": ["Product 1", "Product 2", "Product 3"]
    }
  ],
  "daily_totals": {
    "calories": number (must match daily_energy_target_kcal ±2%),
    "carbs_g": number (must match daily_carb_target_g ±2%),
    "protein_g": number (must match daily_protein_target_g ±2%),
    "fat_g": number (must match daily_fat_target_g ±2%),
    "sodium_mg": number (must match sodium_target_mg ±2%),
    "fluids_l": number,
    "protein_per_kg": number,
    "carbs_per_kg": number
  },
  "key_recommendations": ["Recommendation 1", "Recommendation 2"],
  "warnings": []
}

## COMMON JSON ERRORS TO AVOID

❌ WRONG: Trailing comma
{
  "meals": [],
}

✅ CORRECT: No trailing comma
{
  "meals": []
}

Generate the complete meal plan now in valid JSON format.${tokenSavings}`;
    
    return prompt;
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

// Render meal plan
function renderMealPlan(mealPlan) {
    // Render meals
    renderMeals(mealPlan.meals);
    
    // Render summary
    renderSummary(mealPlan);
    
    // Render JSON
    document.getElementById('jsonContent').textContent = JSON.stringify(mealPlan, null, 2);
    
    // Switch to meals tab
    switchTab('meals');
}

// Render meals
function renderMeals(meals) {
    const container = document.getElementById('mealsContent');
    
    if (!meals || meals.length === 0) {
        container.innerHTML = '<p class="empty-state">⚠️ No meals generated. Check the "AI Response" tab to see what the model returned.</p>';
        return;
    }
    
    container.innerHTML = meals.map(meal => `
        <div class="meal-card">
            <div class="meal-header">
                <h3>${meal.time} - ${meal.name}</h3>
                <span class="meal-type-badge">${meal.type}</span>
            </div>
            <div class="meal-foods">
                ${meal.foods.map(food => `
                    <div class="food-item">
                        <span class="food-name">${food.item}</span>
                        <div class="food-macros">
                            <span>C: ${food.carbs_g}g</span>
                            <span>P: ${food.protein_g}g</span>
                            <span>F: ${food.fat_g}g</span>
                            <span>Na: ${food.sodium_mg}mg</span>
                            <span class="food-calories">${food.calories} kcal</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="meal-totals">
                <strong>Meal Totals:</strong>
                C: ${meal.total_carbs_g}g, 
                P: ${meal.total_protein_g}g, 
                F: ${meal.total_fat_g}g, 
                Na: ${meal.total_sodium_mg}mg, 
                ${meal.total_calories} kcal
            </div>
            <div class="meal-rationale">
                <strong>Rationale:</strong> ${meal.rationale}
            </div>
            ${meal.israel_alternatives && meal.israel_alternatives.length > 0 ? `
                <div class="meal-alternatives">
                    <strong>🇮🇱 Israel Alternatives:</strong>
                    <ul>
                        ${meal.israel_alternatives.map(alt => `<li>${alt}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Store mealPlan globally for info buttons
window.currentMealPlan = null;

// Show target info modal
window.showTargetInfo = function(metricKey) {
    const mealPlan = window.currentMealPlan;
    if (!mealPlan || !mealPlan.athlete_summary) return;
    
    const targets = mealPlan.athlete_summary;
    const explanations = targets.explanations || {};
    const breakdown = targets.calorie_breakdown || {};
    
    console.log('📊 Info button clicked:', metricKey);
    console.log('Targets:', targets);
    console.log('Breakdown:', breakdown);
    
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

// Render summary
function renderSummary(mealPlan) {
    window.currentMealPlan = mealPlan; // Store for info buttons
    const container = document.getElementById('summaryContent');
    
    const targets = mealPlan.athlete_summary || {};
    const totals = mealPlan.daily_totals || {};
    
    const compareValue = (actual, target) => {
        // Handle edge cases properly (0 is a valid number!)
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
        return `${sign}${diff.toFixed(0)} vs target`;
    };
    
    // Info button helper
    const infoBtn = (key) => `<button class="info-btn" onclick="showTargetInfo('${key}')" title="Why this target?">ℹ️</button>`;
    
    container.innerHTML = `
        <div class="summary-section">
            <h3>Daily Targets (Calculated)</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Target Calories ${infoBtn('calories')}</span>
                    <span class="summary-value">${targets.daily_energy_target_kcal || 0} kcal</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Protein ${infoBtn('protein')}</span>
                    <span class="summary-value">${targets.daily_protein_target_g || 0} g</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Target Carbs ${infoBtn('carbs')}</span>
                    <span class="summary-value">${targets.daily_carb_target_g || 0} g</span>
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
            <h3>Daily Totals (Actual from Meals) ${compareValue(totals.calories, targets.daily_energy_target_kcal)}</h3>
            ${totals.calories === 0 || !totals.calories ? 
                '<p class="warning-message">⚠️ No meal data available. The meal plan may have failed to generate or is still loading.</p>' : ''}
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Calories ${compareValue(totals.calories, targets.daily_energy_target_kcal)}</span>
                    <span class="summary-value">${totals.calories || 0} kcal <span class="summary-diff">${formatDiff(totals.calories, targets.daily_energy_target_kcal)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Protein ${compareValue(totals.protein_g, targets.daily_protein_target_g)}</span>
                    <span class="summary-value">${totals.protein_g || 0} g <span class="summary-diff">${formatDiff(totals.protein_g, targets.daily_protein_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Carbs ${compareValue(totals.carbs_g, targets.daily_carb_target_g)}</span>
                    <span class="summary-value">${totals.carbs_g || 0} g <span class="summary-diff">${formatDiff(totals.carbs_g, targets.daily_carb_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Fat ${compareValue(totals.fat_g, targets.daily_fat_target_g)}</span>
                    <span class="summary-value">${totals.fat_g || 0} g <span class="summary-diff">${formatDiff(totals.fat_g, targets.daily_fat_target_g)}</span></span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Protein per kg</span>
                    <span class="summary-value">${totals.protein_per_kg || 0} g/kg</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Carbs per kg</span>
                    <span class="summary-value">${totals.carbs_per_kg || 0} g/kg</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Fluids</span>
                    <span class="summary-value">${totals.fluids_l || 0} L</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Sodium ${compareValue(totals.sodium_mg, targets.sodium_target_mg)}</span>
                    <span class="summary-value">${totals.sodium_mg || 0} mg <span class="summary-diff">${formatDiff(totals.sodium_mg, targets.sodium_target_mg)}</span></span>
                </div>
            </div>
        </div>
        
        ${targets.explanations ? `
            <div class="summary-section">
                <h3>Target Calculations Explained</h3>
                <div class="explanations-list">
                    ${Object.entries(targets.explanations).map(([key, value]) => `
                        <div class="explanation-item">
                            <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${mealPlan.key_recommendations && mealPlan.key_recommendations.length > 0 ? `
            <div class="summary-section">
                <h3>Key Recommendations</h3>
                <ul class="recommendations-list">
                    ${mealPlan.key_recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${mealPlan.warnings && mealPlan.warnings.length > 0 ? `
            <div class="summary-section">
                <h3>⚠️ Warnings</h3>
                <ul class="warnings-list">
                    ${mealPlan.warnings.map(warn => `<li>${warn}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

// Show/hide loading overlay
function showLoading(show) {
    console.log('Loading overlay:', show ? 'SHOW' : 'HIDE');
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        console.error('❌ Loading overlay element not found!');
        return;
    }
    overlay.style.display = show ? 'flex' : 'none';
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 10000);
    }
}

// Show detailed error
function showDetailedError(errorData) {
    const message = errorData.error || 'Unknown error';
    const details = errorData.details || '';
    const fix = errorData.fix || '';
    
    let fullMessage = `⚠️ Error: ${message}`;
    if (details) fullMessage += `\n\nDetails: ${details}`;
    if (fix) fullMessage += `\n\nFix: ${fix}`;
    
    showStatus(fullMessage, 'error');
}

// Display cost info
function displayCost(usage, model, autoFixed) {
    console.log('displayCost called with:', { usage, model, autoFixed });
    
    // Safety check - if no usage data, skip display
    if (!usage || typeof usage.prompt_tokens !== 'number' || typeof usage.completion_tokens !== 'number') {
        console.warn('Invalid or missing usage data, skipping cost display');
        return;
    }
    
    const costDisplay = document.getElementById('costDisplay');
    if (!costDisplay) {
        console.warn('Cost display element not found');
        return;
    }
    
    try {
        // CRITICAL: calculateCost expects (modelId, usage) in that order!
        const costInfo = calculateCost(model, usage);
        
        // Validate costInfo
        if (!costInfo || typeof costInfo.promptTokens !== 'number' || typeof costInfo.completionTokens !== 'number') {
            console.error('Invalid costInfo returned from calculateCost:', costInfo);
            costDisplay.innerHTML = '<div class="cost-summary"><span class="cost-details">Cost calculation error</span></div>';
            return;
        }
        
        const cumulative = addToCumulativeCost(costInfo);
        
        let fixedBadge = '';
        if (autoFixed) {
            fixedBadge = '<span class="cost-badge" title="JSON was auto-corrected">🔧 Auto-fixed</span>';
        }
        
        costDisplay.innerHTML = `
            <div class="cost-summary">
                ${costInfo.isFree ? 
                    `<span class="cost-free">✨ FREE</span>` : 
                    `<span class="cost-amount">$${(costInfo.totalCost || 0).toFixed(6)}</span>`
                }
                ${fixedBadge}
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
        costDisplay.innerHTML = '<div class="cost-summary"><span class="cost-details">Cost display error</span></div>';
    }
}

// Copy JSON
function copyJson() {
    const json = document.getElementById('jsonContent').textContent;
    navigator.clipboard.writeText(json).then(() => {
        showStatus('JSON copied to clipboard!', 'success');
    }).catch(err => {
        showStatus('Failed to copy JSON', 'error');
    });
}

// Download JSON
function downloadJson() {
    const json = document.getElementById('jsonContent').textContent;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Open feedback modal
function openFeedbackModal() {
    if (!currentMealPlan) {
        showStatus('Please generate a meal plan first', 'error');
        return;
    }
    
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'flex';
    
    // Reset form
    document.getElementById('feedbackComments').value = '';
    document.querySelectorAll('.feedback-issue').forEach(cb => cb.checked = false);
    document.querySelector('[name="feedbackRating"][value="good"]').checked = true;
}

// Close feedback modal
window.closeFeedbackModal = function() {
    document.getElementById('feedbackModal').style.display = 'none';
};

// Submit feedback
window.submitFeedback = async function() {
    const submitBtn = document.getElementById('submitFeedbackBtn');
    const statusDiv = document.getElementById('feedbackStatus');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending...';
    
    try {
        // Collect feedback data
        const rating = document.querySelector('[name="feedbackRating"]:checked').value;
        const issues = Array.from(document.querySelectorAll('.feedback-issue:checked')).map(cb => cb.value);
        const comments = document.getElementById('feedbackComments').value;
        
        // Collect current state
        const context = buildContext();
        const selectedModel = document.getElementById('modelSelect').value;
        const fastMode = document.getElementById('fastMode')?.checked ?? true;
        
        // Build feedback payload
        const feedbackData = {
            timestamp: new Date().toISOString(),
            version: VERSION,
            
            // Athlete & Workouts
            athlete: context.athlete,
            workouts: context.workouts,
            
            // Model & Settings
            model_used: selectedModel,
            fast_mode_enabled: fastMode,
            
            // Targets vs Actuals
            calculated_targets: context.calculated_targets,
            actual_totals: currentMealPlan.daily_totals || null,
            
            // Accuracy metrics
            has_daily_totals: !!currentMealPlan.daily_totals,
            meal_count: currentMealPlan.meals?.length || 0,
            food_count: currentMealPlan.meals?.reduce((sum, m) => sum + (m.foods?.length || 0), 0) || 0,
            
            // Prompt & Response
            prompt_sent: window.lastPrompt || null,
            prompt_length_chars: window.lastPrompt?.length || 0,
            ai_response: currentMealPlan,
            response_length_chars: JSON.stringify(currentMealPlan).length,
            
            // Cost
            cost_info: window.lastCostInfo || null,
            
            // User Feedback
            user_feedback: {
                rating: rating,
                issues: issues,
                comments: comments
            }
        };
        
        // Send to backend (which forwards to n8n)
        const response = await fetch(`${API_URL}/api/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusDiv.innerHTML = '<p style="color: var(--success); font-weight: 600;">✅ ' + result.message + '</p>';
            setTimeout(() => {
                closeFeedbackModal();
            }, 2000);
        } else {
            statusDiv.innerHTML = '<p style="color: var(--error);">❌ ' + result.error + '</p>';
        }
        
    } catch (error) {
        statusDiv.innerHTML = '<p style="color: var(--error);">❌ Failed to send feedback: ' + error.message + '</p>';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Send Feedback';
    }
};

// Show changelog
function showChangelog() {
    const changelog = `
🍽️ BurnRate AI Meal Planner - v${VERSION}

CURRENT VERSION (v1.3.8) - Fix Prompt Template Bugs
🐛 CRITICAL: Fixed undefined values in prompt
🐛 Corrected all property names in template
✅ AI now gets proper numeric targets
✅ No more "undefinedmg" in prompts!

RECENT UPDATES:
v1.3.7 - Model Testing & Optimization
v1.3.6 - Fix NaN Values
v1.3.5 - Token Limit & Response Display
v1.3.4 - Cost Calculator Fix
v1.3.3 - Cost Display Fix  
v1.3.2 - Versioning Policy
v1.3.1 - Critical Bug Fixes (form data, event listeners)
v1.3.0 - Full Transparency Features
v1.2.0 - Two-Phase Generation (Experimental)
v1.1.0 - Cost Tracking & Auto-Healing JSON
v1.0.0 - Initial Release

Click OK to view full changelog on GitHub.
    `.trim();
    
    alert(changelog);
    
    // Optionally open full changelog
    const viewFull = confirm('View full changelog?');
    if (viewFull) {
        window.open('https://github.com/anatgotfried/BurnRate_Helper/blob/main/meal-playground/VERSION.md', '_blank');
    }
}
