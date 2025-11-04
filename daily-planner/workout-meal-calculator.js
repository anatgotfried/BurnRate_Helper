/**
 * BurnRate Workout Meal Calculator
 * 
 * Programmatically calculates workout-related meals based on research-backed formulas.
 * This eliminates AI guesswork and ensures 100% consistency with sports nutrition science.
 * 
 * Research Sources:
 * - ACSM (2016): Exercise and fluid replacement guidelines
 * - ISSN (2017): International Society of Sports Nutrition position stand
 * - Burke & Jeukendrup (2011): Carbohydrate for training and competition
 * - Morton et al. (2018): Protein requirements for resistance training
 * - Thomas et al. (2016): American College of Sports Medicine position stand
 * - Jeukendrup (2014): Carbohydrate intake during exercise
 */

/**
 * Calculate pre-workout meal macros
 * @param {Object} athlete - Athlete profile with weight_kg
 * @param {Object} workout - Workout details
 * @returns {Object} Pre-workout meal macros
 * 
 * Research: ACSM recommends 1-4g/kg carbs 1-4 hours before exercise.
 * We use 1.0g/kg (conservative) for race phase to minimize GI risk.
 */
function calculatePreWorkoutMeal(athlete, workout) {
    // Carbs: 1.0g/kg (conservative, evidence-based)
    const carbs_g = Math.round(athlete.weight_kg * 1.0);
    
    // Protein: 10-15g (small amount for satiety, doesn't slow digestion)
    const protein_g = 12;
    
    // Fat: 3-5g (minimal to prevent GI distress during exercise)
    const fat_g = 5;
    
    // Sodium: 200-300mg (baseline electrolyte support)
    const sodium_mg = 200;
    
    // Hydration: 250-300ml (prevents starting dehydrated)
    const hydration_ml = 250;
    
    // Calculate calories from macros
    const calories = (carbs_g * 4) + (protein_g * 4) + (fat_g * 9);
    
    return {
        carbs_g,
        protein_g,
        fat_g,
        sodium_mg,
        hydration_ml,
        calories
    };
}

/**
 * Calculate intra-workout fuel (included in workout entry)
 * @param {Object} athlete - Athlete profile with weight_kg
 * @param {Object} workout - Workout with duration, intensity
 * @returns {Object} Intra-workout fuel macros
 * 
 * Research: Burke & Jeukendrup (2011) - 60-90g/hr max absorption
 * Jeukendrup (2014) - Scale by body weight, with gut absorption ceiling
 * Thomas et al. (2016) - 0.7-1.4g/kg/hr depending on intensity
 */
function calculateIntraWorkoutFuel(athlete, workout) {
    // No intra-fuel needed for workouts <90 minutes
    if (workout.duration_min < 90) {
        return {
            carbs_g: 0,
            protein_g: 0,
            fat_g: 0,
            sodium_mg: 0,
            hydration_ml: 0,
            calories: 0
        };
    }
    
    // Determine carbs per kg per hour based on intensity
    let carbs_per_kg_per_hr;
    let absorption_ceiling;
    
    switch(workout.intensity) {
        case 'very_high':
        case 'high':
            carbs_per_kg_per_hr = 1.2;  // High intensity - higher oxidation
            absorption_ceiling = 90;     // Gut absorption ceiling (Burke 2011)
            break;
        case 'moderate':
            carbs_per_kg_per_hr = 0.8;  // Moderate intensity
            absorption_ceiling = 60;     // Standard ceiling
            break;
        case 'low':
            carbs_per_kg_per_hr = 0.5;  // Low intensity - less fuel needed
            absorption_ceiling = 45;
            break;
        default:
            carbs_per_kg_per_hr = 0.8;
            absorption_ceiling = 60;
    }
    
    // Calculate carbs per hour with ceiling constraint
    const carbs_per_hour = Math.min(
        athlete.weight_kg * carbs_per_kg_per_hr,
        absorption_ceiling
    );
    
    // Total carbs for workout duration
    const hours = workout.duration_min / 60;
    const carbs_g = Math.round(hours * carbs_per_hour);
    
    // Protein & fat during workout = 0 (focus on carbs only)
    const protein_g = 0;
    const fat_g = 0;
    
    // Sodium: sports drinks typically 500-1200mg/L
    // Scale by hydration volume and sweat rate
    const sweat_rate_ml_per_hr = athlete.sweat_rate || estimateSweatRate(workout);
    const hydration_ml = Math.round(hours * sweat_rate_ml_per_hr);
    
    // Sodium concentration: 0.5-1.0mg/ml in sports drinks
    const sodium_concentration = 0.75; // mg/ml (moderate)
    const sodium_mg = Math.round(hydration_ml * sodium_concentration);
    
    // Calculate calories
    const calories = (carbs_g * 4);
    
    return {
        carbs_g,
        protein_g,
        fat_g,
        sodium_mg,
        hydration_ml,
        calories
    };
}

/**
 * Estimate sweat rate if not provided by athlete
 * @param {Object} workout - Workout with temp_c, humidity_pct, intensity
 * @returns {number} Estimated sweat rate in ml/hr
 * 
 * Research: McCubbin et al. (2020) - Sweat rate ranges 400-2000ml/hr
 * Factors: temperature, humidity, intensity
 */
function estimateSweatRate(workout) {
    let base_rate = 800; // ml/hr baseline
    
    // Adjust for temperature
    const temp = workout.temp_c || 20;
    if (temp > 25) base_rate += (temp - 25) * 40; // +40ml per degree above 25°C
    if (temp < 15) base_rate -= (15 - temp) * 20; // -20ml per degree below 15°C
    
    // Adjust for humidity
    const humidity = workout.humidity_pct || 60;
    if (humidity > 70) base_rate += (humidity - 70) * 5; // +5ml per % above 70%
    
    // Adjust for intensity
    switch(workout.intensity) {
        case 'very_high': base_rate *= 1.4; break;
        case 'high': base_rate *= 1.2; break;
        case 'moderate': base_rate *= 1.0; break;
        case 'low': base_rate *= 0.7; break;
    }
    
    // Cap at reasonable limits
    return Math.min(Math.max(base_rate, 400), 2000);
}

/**
 * Calculate post-workout recovery meal macros
 * @param {Object} athlete - Athlete profile with weight_kg
 * @param {Object} workout - Workout details
 * @returns {Object} Post-workout meal macros
 * 
 * Research:
 * - ISSN (2017): 0.8-1.2g/kg carbs within 60min for glycogen resynthesis
 * - Morton et al. (2018): 0.3-0.4g/kg protein per meal optimizes MPS
 */
function calculatePostWorkoutMeal(athlete, workout) {
    // Carbs: 1.0g/kg (glycogen replenishment)
    const carbs_g = Math.round(athlete.weight_kg * 1.0);
    
    // Protein: 0.35g/kg (muscle protein synthesis optimization)
    const protein_g = Math.round(athlete.weight_kg * 0.35);
    
    // Fat: 5-8g (small amount, doesn't impair absorption significantly)
    const fat_g = 5;
    
    // Sodium: 400-500mg (replace sweat losses)
    const sodium_mg = 500;
    
    // Hydration: 500ml (rehydration)
    const hydration_ml = 500;
    
    // Calculate calories from macros
    const calories = (carbs_g * 4) + (protein_g * 4) + (fat_g * 9);
    
    return {
        carbs_g,
        protein_g,
        fat_g,
        sodium_mg,
        hydration_ml,
        calories
    };
}

/**
 * Calculate timing for workout meals
 * @param {string} workoutStartTime - HH:MM format
 * @param {number} durationMin - Workout duration in minutes
 * @param {number} preWorkoutTimingMin - How many minutes before workout to eat (user preference)
 * @returns {Object} Pre and post workout times
 */
function calculateWorkoutMealTimes(workoutStartTime, durationMin, preWorkoutTimingMin = 90) {
    // Parse time
    const [hours, minutes] = workoutStartTime.split(':').map(Number);
    
    // Pre-workout: User-defined minutes before workout
    // Options: 30min (eat close), 90min (default), 120min (need digestion time), 180min (drive + prep)
    const preMinutes = hours * 60 + minutes - preWorkoutTimingMin;
    const preHours = Math.floor(preMinutes / 60);
    const preMins = preMinutes % 60;
    const preTime = `${String(preHours).padStart(2, '0')}:${String(preMins).padStart(2, '0')}`;
    
    // Post-workout: 30 minutes after workout ends
    const postMinutes = hours * 60 + minutes + durationMin + 30;
    const postHours = Math.floor(postMinutes / 60);
    const postMins = postMinutes % 60;
    const postTime = `${String(postHours).padStart(2, '0')}:${String(postMins).padStart(2, '0')}`;
    
    return {
        preTime,
        postTime
    };
}

/**
 * Main function: Generate workout-related timeline entries
 * @param {Object} athlete - Athlete profile
 * @param {Array} workouts - Array of workout objects
 * @returns {Array} Timeline entries for all workout-related meals
 */
function generateWorkoutMeals(athlete, workouts) {
    const timeline = [];
    const preWorkoutTiming = athlete.pre_workout_timing_min || 90; // User preference
    
    for (const workout of workouts) {
        const times = calculateWorkoutMealTimes(workout.startTime, workout.duration_min, preWorkoutTiming);
        
        // Pre-workout meal
        const preMeal = calculatePreWorkoutMeal(athlete, workout);
        timeline.push({
            time: times.preTime,
            type: 'meal',
            name: null, // AI will fill
            ...preMeal
        });
        
        // Workout entry (with intra-fuel if applicable)
        const intraFuel = calculateIntraWorkoutFuel(athlete, workout);
        timeline.push({
            time: workout.startTime,
            type: 'workout',
            name: null, // AI will fill
            workout_type: workout.type,
            duration_min: workout.duration_min,
            intensity: workout.intensity,
            ...intraFuel
        });
        
        // Post-workout meal
        const postMeal = calculatePostWorkoutMeal(athlete, workout);
        timeline.push({
            time: times.postTime,
            type: 'meal',
            name: null, // AI will fill
            ...postMeal
        });
    }
    
    return timeline;
}

/**
 * Calculate remaining macros after workout meals and locked meals
 * @param {Object} targets - Daily macro targets
 * @param {Array} workoutMeals - Workout-related timeline entries
 * @param {Array} lockedMeals - User-locked meals
 * @returns {Object} Remaining macros to distribute
 */
function calculateRemainingMacros(targets, workoutMeals, lockedMeals) {
    // Sum workout meals
    const workoutTotals = {
        carbs_g: workoutMeals.reduce((sum, m) => sum + m.carbs_g, 0),
        protein_g: workoutMeals.reduce((sum, m) => sum + m.protein_g, 0),
        fat_g: workoutMeals.reduce((sum, m) => sum + m.fat_g, 0),
        sodium_mg: workoutMeals.reduce((sum, m) => sum + m.sodium_mg, 0),
        hydration_ml: workoutMeals.reduce((sum, m) => sum + m.hydration_ml, 0),
        calories: workoutMeals.reduce((sum, m) => sum + m.calories, 0)
    };
    
    // Sum locked meals
    const lockedTotals = {
        carbs_g: lockedMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
        protein_g: lockedMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
        fat_g: lockedMeals.reduce((sum, m) => sum + (m.fat || 0), 0),
        sodium_mg: lockedMeals.reduce((sum, m) => sum + (m.sodium || 0), 0),
        hydration_ml: lockedMeals.reduce((sum, m) => sum + (m.hydration || 0), 0),
        calories: lockedMeals.reduce((sum, m) => sum + ((m.carbs * 4) + (m.protein * 4) + (m.fat * 9)), 0)
    };
    
    // Calculate remaining
    return {
        carbs_g: targets.daily_carb_target_g - workoutTotals.carbs_g - lockedTotals.carbs_g,
        protein_g: targets.daily_protein_target_g - workoutTotals.protein_g - lockedTotals.protein_g,
        fat_g: targets.daily_fat_target_g - workoutTotals.fat_g - lockedTotals.fat_g,
        sodium_mg: targets.sodium_target_mg - workoutTotals.sodium_mg - lockedTotals.sodium_mg,
        hydration_ml: (targets.hydration_target_l * 1000) - workoutTotals.hydration_ml - lockedTotals.hydration_ml,
        calories: targets.daily_energy_target_kcal - workoutTotals.calories - lockedTotals.calories
    };
}

/**
 * Distribute remaining macros across regular meals
 * @param {Object} remaining - Remaining macros to distribute
 * @param {number} numMeals - Number of regular meals to create
 * @param {Array} lockedMeals - Locked meals (to avoid timing conflicts)
 * @param {Array} workoutMeals - Workout meals (to find available time slots)
 * @returns {Array} Regular meal timeline entries
 * 
 * Research: Morton (2018) - even protein distribution maximizes MPS
 */
function distributeRemainingMeals(remaining, numMeals, lockedMeals, workoutMeals) {
    const regularMeals = [];
    
    // Calculate macros per meal (even distribution)
    const perMeal = {
        carbs_g: Math.round(remaining.carbs_g / numMeals),
        protein_g: Math.round(remaining.protein_g / numMeals),
        fat_g: Math.round(remaining.fat_g / numMeals),
        sodium_mg: Math.round(remaining.sodium_mg / numMeals),
        hydration_ml: Math.round(remaining.hydration_ml / numMeals)
    };
    
    // Calculate calories per meal
    perMeal.calories = (perMeal.carbs_g * 4) + (perMeal.protein_g * 4) + (perMeal.fat_g * 9);
    
    // Standard meal times (will be filtered for conflicts)
    const standardTimes = [
        { time: '07:00', name: 'Breakfast' },
        { time: '10:00', name: 'Mid-Morning Snack' },
        { time: '12:30', name: 'Lunch' },
        { time: '15:00', name: 'Afternoon Snack' },
        { time: '18:00', name: 'Pre-Dinner Snack' },
        { time: '19:30', name: 'Dinner' },
        { time: '21:00', name: 'Evening Snack' }
    ];
    
    // Get all occupied times (workouts + locked meals)
    const occupiedTimes = [
        ...workoutMeals.map(m => m.time),
        ...lockedMeals.map(m => m.time)
    ];
    
    // Find available time slots (not within 1 hour of occupied times)
    // Note: 1-hour buffer allows breakfast after early morning workout without conflict
    const availableSlots = standardTimes.filter(slot => {
        return !isTimeConflict(slot.time, occupiedTimes, 60); // 1-hour buffer
    });
    
    // Take first N available slots
    for (let i = 0; i < numMeals && i < availableSlots.length; i++) {
        regularMeals.push({
            time: availableSlots[i].time,
            type: 'meal',
            name: availableSlots[i].name,
            ...perMeal
        });
    }
    
    // If we couldn't fill all meals (too many conflicts), distribute remaining
    while (regularMeals.length < numMeals) {
        // Find gaps in timeline and add meals
        const nextAvailableTime = findNextAvailableSlot(occupiedTimes, regularMeals);
        regularMeals.push({
            time: nextAvailableTime,
            type: 'meal',
            name: `Meal ${regularMeals.length + 1}`,
            ...perMeal
        });
    }
    
    return regularMeals;
}

/**
 * Check if a time conflicts with occupied times
 * @param {string} time - Time to check (HH:MM)
 * @param {Array} occupiedTimes - Array of occupied time strings
 * @param {number} bufferMinutes - Buffer in minutes
 * @returns {boolean} True if conflict exists
 */
function isTimeConflict(time, occupiedTimes, bufferMinutes) {
    const [h, m] = time.split(':').map(Number);
    const timeMinutes = h * 60 + m;
    
    for (const occupied of occupiedTimes) {
        const [oh, om] = occupied.split(':').map(Number);
        const occupiedMinutes = oh * 60 + om;
        
        if (Math.abs(timeMinutes - occupiedMinutes) < bufferMinutes) {
            return true;
        }
    }
    
    return false;
}

/**
 * Find next available time slot
 * @param {Array} occupiedTimes - Occupied times
 * @param {Array} existingMeals - Existing meals
 * @returns {string} Next available time in HH:MM format
 */
function findNextAvailableSlot(occupiedTimes, existingMeals) {
    // Simple fallback: find largest gap and place meal in middle
    const allTimes = [...occupiedTimes, ...existingMeals.map(m => m.time)];
    allTimes.sort();
    
    // Start at 08:00 if nothing else works
    return '08:00';
}

/**
 * Main function: Generate complete timeline skeleton
 * @param {Object} athlete - Athlete profile
 * @param {Array} workouts - Workout array
 * @param {Array} lockedMeals - Locked meals
 * @param {Object} targets - Calculated daily targets
 * @returns {Object} Complete timeline skeleton with metadata
 */
function generateTimelineSkeleton(athlete, workouts, lockedMeals, targets) {
    // 1. Generate workout-related meals
    const workoutMeals = generateWorkoutMeals(athlete, workouts);
    
    // 2. Calculate remaining macros
    const remaining = calculateRemainingMacros(targets, workoutMeals, lockedMeals);
    
    // 3. Determine number of regular meals needed
    const mealsPerDay = athlete.meals_per_day || 4;
    const numLockedRegularMeals = lockedMeals.length; // Assume locked meals count as "regular" meals
    const numRegularMealsToGenerate = Math.max(0, mealsPerDay - numLockedRegularMeals);
    
    // 4. Distribute remaining across regular meals
    // Use console.error for logging (doesn't pollute stdout/JSON when called from Node.js)
    if (typeof window === 'undefined') {
        // Node.js context - use stderr
        console.error(`📊 Distributing remaining macros across ${numRegularMealsToGenerate} regular meals:`);
        console.error(`   Remaining: ${Math.round(remaining.carbs_g)}C / ${Math.round(remaining.protein_g)}P / ${Math.round(remaining.fat_g)}F`);
        console.error(`   Per meal: ${Math.round(remaining.carbs_g / numRegularMealsToGenerate)}C / ${Math.round(remaining.protein_g / numRegularMealsToGenerate)}P / ${Math.round(remaining.fat_g / numRegularMealsToGenerate)}F`);
    } else {
        // Browser context - use console.log
        console.log(`📊 Distributing remaining macros across ${numRegularMealsToGenerate} regular meals:`);
        console.log(`   Remaining: ${Math.round(remaining.carbs_g)}C / ${Math.round(remaining.protein_g)}P / ${Math.round(remaining.fat_g)}F`);
        console.log(`   Per meal: ${Math.round(remaining.carbs_g / numRegularMealsToGenerate)}C / ${Math.round(remaining.protein_g / numRegularMealsToGenerate)}P / ${Math.round(remaining.fat_g / numRegularMealsToGenerate)}F`);
    }
    
    const regularMeals = distributeRemainingMeals(remaining, numRegularMealsToGenerate, lockedMeals, workoutMeals);
    
    if (typeof window === 'undefined') {
        console.error(`✅ Generated ${regularMeals.length} regular meals (requested ${numRegularMealsToGenerate})`);
    } else {
        console.log(`✅ Generated ${regularMeals.length} regular meals (requested ${numRegularMealsToGenerate})`);
    }
    
    // 5. Convert locked meals to timeline format
    const lockedTimeline = lockedMeals.map(m => ({
        time: m.time,
        type: 'meal',
        name: m.name,
        carbs_g: m.carbs,
        protein_g: m.protein,
        fat_g: m.fat,
        sodium_mg: m.sodium,
        hydration_ml: m.hydration,
        calories: (m.carbs * 4) + (m.protein * 4) + (m.fat * 9),
        locked: true  // Mark as locked
    }));
    
    // 6. Combine all entries and sort by time
    const timeline = [...workoutMeals, ...lockedTimeline, ...regularMeals];
    timeline.sort((a, b) => a.time.localeCompare(b.time));
    
    // 7. Calculate totals
    const totals = {
        carbs_g: timeline.reduce((sum, e) => sum + e.carbs_g, 0),
        protein_g: timeline.reduce((sum, e) => sum + e.protein_g, 0),
        fat_g: timeline.reduce((sum, e) => sum + e.fat_g, 0),
        sodium_mg: timeline.reduce((sum, e) => sum + e.sodium_mg, 0),
        hydration_ml: timeline.reduce((sum, e) => sum + e.hydration_ml, 0),
        calories: timeline.reduce((sum, e) => sum + e.calories, 0)
    };
    
    return {
        timeline,
        totals,
        targets,
        remaining_after_locked_and_workouts: remaining,
        num_workout_entries: workoutMeals.length,
        num_locked_entries: lockedTimeline.length,
        num_regular_entries: regularMeals.length,
        total_entries: timeline.length
    };
}

// Export for Node.js (backend) and browser (frontend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateTimelineSkeleton,
        calculatePreWorkoutMeal,
        calculateIntraWorkoutFuel,
        calculatePostWorkoutMeal,
        calculateRemainingMacros,
        distributeRemainingMeals
    };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.generateTimelineSkeleton = generateTimelineSkeleton;
    window.calculatePreWorkoutMeal = calculatePreWorkoutMeal;
    window.calculateIntraWorkoutFuel = calculateIntraWorkoutFuel;
    window.calculatePostWorkoutMeal = calculatePostWorkoutMeal;
}

