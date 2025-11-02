// Two-Phase Meal Plan Generation
// Phase 1: Daily structure (Mistral Small - cheap, fast)
// Phase 2: Individual meals (parallel calls, fallback to Claude)

const STRUCTURE_MODEL = 'mistralai/mistral-small-3.2-24b-instruct';
const MEAL_MODEL = 'mistralai/mistral-small-3.2-24b-instruct';
const FALLBACK_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Generate meal plan using two-phase approach
 */
async function generateTwoPhase(context, researchCorpus) {
    try {
        // Phase 1: Get daily structure
        showStatus('Phase 1/2: Calculating daily structure...', 'info');
        const dailyPlan = await generateDailyStructure(context);
        
        if (!dailyPlan || !dailyPlan.meal_structure) {
            throw new Error('Failed to generate daily structure');
        }
        
        // Phase 2: Generate each meal in parallel
        showStatus(`Phase 2/2: Generating ${dailyPlan.meal_structure.length} meals...`, 'info');
        const meals = await generateMealsInParallel(
            dailyPlan.meal_structure,
            context.athlete,
            researchCorpus
        );
        
        // Combine into final meal plan
        const finalPlan = {
            athlete_summary: {
                weight_kg: dailyPlan.daily_targets.weight_kg,
                daily_energy_target_kcal: dailyPlan.daily_targets.calories,
                daily_protein_target_g: dailyPlan.daily_targets.protein_g,
                daily_carb_target_g: dailyPlan.daily_targets.carbs_g,
                daily_fat_target_g: dailyPlan.daily_targets.fat_g,
                hydration_target_l: dailyPlan.daily_targets.hydration_l,
                sodium_target_mg: dailyPlan.daily_targets.sodium_mg,
                explanations: context.calculated_targets.explanations
            },
            meals: meals,
            daily_totals: calculateDailyTotals(meals, dailyPlan.daily_targets.weight_kg),
            key_recommendations: [dailyPlan.daily_summary],
            warnings: [],
            generation_method: 'two_phase',
            phases_used: {
                structure_model: STRUCTURE_MODEL,
                meal_model: MEAL_MODEL,
                fallback_count: meals.filter(m => m.used_fallback).length
            }
        };
        
        return finalPlan;
        
    } catch (error) {
        console.error('Two-phase generation failed:', error);
        throw error;
    }
}

/**
 * Phase 1: Generate daily meal structure
 */
async function generateDailyStructure(context) {
    const promptTemplate = await fetch('prompts/daily_plan_prompt.txt').then(r => r.text());
    const prompt = promptTemplate.replace('{CONTEXT}', JSON.stringify(context, null, 2));
    
    const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: STRUCTURE_MODEL,
            prompt: prompt,
            max_tokens: 2000  // Much smaller - just structure!
        })
    });
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to generate daily structure');
    }
    
    return data.meal_plan;
}

/**
 * Phase 2: Generate meals in parallel with fallback
 */
async function generateMealsInParallel(mealStructure, athlete, researchCorpus) {
    // Create condensed research summary for individual meals
    const researchSummary = createResearchSummary(researchCorpus);
    
    // Generate all meals in parallel
    const mealPromises = mealStructure.map((mealSpec, index) => 
        generateIndividualMeal(mealSpec, athlete, researchSummary, index, mealStructure.length)
    );
    
    const meals = await Promise.all(mealPromises);
    
    return meals;
}

/**
 * Generate one individual meal with fallback
 */
async function generateIndividualMeal(mealSpec, athlete, researchSummary, index, total) {
    // Update progress
    updateProgress(index + 1, total, `Generating ${mealSpec.type}...`);
    
    try {
        // Try with primary model (Mistral Small)
        const meal = await callMealGeneration(mealSpec, athlete, researchSummary, MEAL_MODEL);
        meal.used_fallback = false;
        return meal;
        
    } catch (error) {
        console.log(`Meal ${mealSpec.meal_id} failed with ${MEAL_MODEL}, trying fallback...`);
        
        try {
            // Fallback to Claude 3.5 Sonnet
            const meal = await callMealGeneration(mealSpec, athlete, researchSummary, FALLBACK_MODEL);
            meal.used_fallback = true;
            return meal;
            
        } catch (fallbackError) {
            console.error(`Both models failed for ${mealSpec.meal_id}:`, fallbackError);
            
            // Return placeholder meal
            return createPlaceholderMeal(mealSpec);
        }
    }
}

/**
 * Call API to generate one meal
 */
async function callMealGeneration(mealSpec, athlete, researchSummary, model) {
    const promptTemplate = await fetch('prompts/individual_meal_prompt.txt').then(r => r.text());
    
    const prompt = promptTemplate
        .replace('{MEAL_SPEC}', JSON.stringify(mealSpec, null, 2))
        .replace('{ATHLETE_PROFILE}', JSON.stringify({
            weight_kg: athlete.weight_kg,
            goal: athlete.goal,
            diet_pattern: athlete.diet_pattern,
            gi_tolerance: athlete.gi_tolerance,
            populations: athlete.populations
        }, null, 2))
        .replace('{RESEARCH_SUMMARY}', researchSummary);
    
    const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            max_tokens: 1500  // Smaller - just one meal!
        })
    });
    
    const data = await response.json();
    
    if (!data.success || !data.meal_plan) {
        throw new Error(data.error || 'No meal generated');
    }
    
    // Validate meal has foods
    if (!data.meal_plan.foods || data.meal_plan.foods.length === 0) {
        throw new Error('Meal has no foods');
    }
    
    return data.meal_plan;
}

/**
 * Create condensed research summary (key points only)
 */
function createResearchSummary(fullCorpus) {
    // Return just the key guidelines, not full corpus
    const summary = `
KEY GUIDELINES:
- Protein: 0.25-0.4 g/kg per meal, ~3g leucine for masters
- Pre-workout: Low fiber/fat, easily digestible carbs
- Post-workout: 0.3g/kg protein + carbs within 30min
- Sodium: Add salt to meals, use electrolyte drinks
- GI tolerance: Low FODMAP if sensitive, avoid gas-forming foods pre-workout
- Israel foods: Tnuva dairy, Osem rice cakes, Yotvata milk, Strauss products

CITATIONS: ISSN2017 (nutrient timing), ACSM2016 (guidelines), Morton2018 (protein), Moore2021 (masters), IOC2018 (RED-S), McCubbin2025 (sodium)
`.trim();
    
    return summary;
}

/**
 * Calculate daily totals from all meals
 */
function calculateDailyTotals(meals, weight_kg) {
    const totals = {
        calories: 0,
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
        sodium_mg: 0,
        fluids_l: 0
    };
    
    meals.forEach(meal => {
        totals.calories += meal.total_calories || 0;
        totals.carbs_g += meal.total_carbs_g || 0;
        totals.protein_g += meal.total_protein_g || 0;
        totals.fat_g += meal.total_fat_g || 0;
        totals.sodium_mg += meal.total_sodium_mg || 0;
    });
    
    // Estimate fluids from meals (rough)
    totals.fluids_l = parseFloat((totals.sodium_mg / 1000).toFixed(1)); // Rough estimate
    
    totals.protein_per_kg = parseFloat((totals.protein_g / weight_kg).toFixed(2));
    totals.carbs_per_kg = parseFloat((totals.carbs_g / weight_kg).toFixed(2));
    
    return totals;
}

/**
 * Create placeholder meal if generation fails
 */
function createPlaceholderMeal(mealSpec) {
    return {
        meal_id: mealSpec.meal_id,
        time: mealSpec.time,
        name: `${mealSpec.type} (generation failed)`,
        type: mealSpec.type,
        foods: [],
        total_carbs_g: 0,
        total_protein_g: 0,
        total_fat_g: 0,
        total_sodium_mg: 0,
        total_calories: 0,
        rationale: 'Failed to generate this meal. Try regenerating.',
        israel_alternatives: [],
        generation_failed: true
    };
}

/**
 * Update progress display
 */
function updateProgress(current, total, message) {
    const percent = Math.round((current / total) * 100);
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = `${message} (${current}/${total} meals, ${percent}%)`;
    }
}

// Export
window.generateTwoPhase = generateTwoPhase;

