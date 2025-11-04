// BurnRate Macro Calculator - Deterministic Daily Target Calculations
// Based on the Swift implementation from BurnRate iOS app

/**
 * Calculate daily macro targets based on athlete profile and workouts
 * @param {Object} athlete - Athlete profile
 * @param {Array} workouts - Array of workout objects
 * @returns {Object} Calculated daily targets with explanations
 */
function calculateDailyTargets(athlete, workouts) {
    const weight = athlete.weight_kg;
    const height = athlete.height_cm;
    const gender = athlete.gender;
    const age = athlete.age || 30; // Default age if not provided
    const goal = athlete.goal; // 'performance', 'fat_loss', 'hypertrophy'
    const phase = athlete.training_phase; // 'base', 'build', 'race', 'recovery'
    
    // Calculate training load for the day
    const trainingLoad = calculateTrainingLoad(workouts);
    
    // Determine context (for now, simplified - no race data yet)
    const context = determineContext(workouts, trainingLoad, goal);
    
    // Calculate each macro
    const protein = calculateProtein(weight, goal, phase, workouts, context);
    const carbs = calculateCarbs(weight, goal, trainingLoad, workouts, context);
    const fat = calculateFat(weight, context, goal);
    const hydration = calculateHydration(weight, workouts, context);
    const sodium = calculateSodium(workouts, weight, hydration.target_ml);
    
    // PROPER CALORIE CALCULATION (Research-Based)
    // Step 1: Calculate BMR using Harris-Benedict equation
    const bmr = calculateBMR(weight, height, age, gender);
    
    // Step 2: Calculate activity factor based on training load
    const activityFactor = getActivityFactor(trainingLoad);
    
    // Step 3: Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = Math.round(bmr * activityFactor);
    
    // Step 4: Apply deficit or surplus based on goal
    let targetCalories = tdee;
    let deficitPercent = 0;
    
    if (goal === 'fat_loss' || goal === 'fat_loss_with_performance') {
        targetCalories = Math.round(tdee * 0.80); // 20% deficit
        deficitPercent = 20;
        
        // SAFETY: Enforce minimum calorie thresholds (ADA/AND guidelines)
        const minimumCalories = gender === 'female' ? 1200 : 1500;
        if (targetCalories < minimumCalories) {
            console.warn(`⚠️ Calculated ${targetCalories} kcal below safe minimum. Adjusting to ${minimumCalories} kcal.`);
            targetCalories = minimumCalories;
            deficitPercent = Math.round(((tdee - targetCalories) / tdee) * 100);
        }
    } else if (goal === 'muscle_gain' || goal === 'hypertrophy') {
        targetCalories = Math.round(tdee * 1.10); // 10% surplus
        deficitPercent = -10;
    }
    
    // Calculate calories from macros
    let caloriesFromMacros = Math.round(protein.target_g * 4 + carbs.target_g * 4 + fat.target_g * 9);
    
    // CRITICAL FIX: Adjust macros to match calorie target if there's a mismatch
    let adjustedProtein = protein.target_g;
    let adjustedCarbs = carbs.target_g;
    let adjustedFat = fat.target_g;
    
    const tolerance = 0.02; // ±2%
    if (Math.abs(caloriesFromMacros - targetCalories) > targetCalories * tolerance) {
        console.log(`⚠️ Macro-calorie mismatch: ${caloriesFromMacros} kcal from macros vs ${targetCalories} kcal target`);
        
        // Scale macros to match calorie target
        // Priority: Keep protein constant (preserve muscle), adjust carbs and fat proportionally
        const scaleFactor = targetCalories / caloriesFromMacros;
        
        // Keep protein constant (critical for muscle preservation)
        adjustedProtein = protein.target_g;
        
        // Scale carbs and fat proportionally
        adjustedCarbs = carbs.target_g * scaleFactor;
        adjustedFat = fat.target_g * scaleFactor;
        
        // Recalculate to verify
        const newCalories = (adjustedProtein * 4) + (adjustedCarbs * 4) + (adjustedFat * 9);
        
        console.log(`✅ Adjusted macros: ${Math.round(adjustedCarbs)}C / ${Math.round(adjustedProtein)}P / ${Math.round(adjustedFat)}F = ${Math.round(newCalories)} kcal`);
        
        caloriesFromMacros = newCalories;
    }
    
    // Calorie breakdown for info modal
    const calorieBreakdown = {
        total: targetCalories,
        bmr: Math.round(bmr),
        tdee: tdee,
        activityFactor: activityFactor,
        activityLevel: getActivityLevelName(activityFactor),
        isFatLoss: goal === 'fat_loss' || goal === 'fat_loss_with_performance',
        isSurplus: goal === 'muscle_gain' || goal === 'hypertrophy',
        deficitPercent: deficitPercent,
        caloriesFromMacros: Math.round(caloriesFromMacros)
    };
    
    return {
        weight_kg: weight,
        daily_energy_target_kcal: targetCalories,
        daily_protein_target_g: Math.round(adjustedProtein),
        daily_carb_target_g: Math.round(adjustedCarbs),
        daily_fat_target_g: Math.round(adjustedFat),
        hydration_target_l: parseFloat((hydration.target_ml / 1000).toFixed(1)),
        sodium_target_mg: Math.round(sodium.target_mg),
        calorie_breakdown: calorieBreakdown,
        explanations: {
            protein: protein.explanation,
            carbs: carbs.explanation,
            fat: fat.explanation,
            hydration: hydration.explanation,
            sodium: sodium.explanation,
            calories: buildCalorieExplanation(bmr, tdee, targetCalories, activityFactor, goal, gender, deficitPercent)
        }
    };
}

/**
 * Calculate BMR using Harris-Benedict equation (revised)
 * Most accurate formula for athletes
 */
function calculateBMR(weight_kg, height_cm, age, gender) {
    if (gender === 'female') {
        // Harris-Benedict for women: 655 + (9.6 × weight) + (1.8 × height) - (4.7 × age)
        return 655 + (9.6 * weight_kg) + (1.8 * height_cm) - (4.7 * age);
    } else {
        // Harris-Benedict for men: 66 + (13.7 × weight) + (5 × height) - (6.8 × age)
        return 66 + (13.7 * weight_kg) + (5 * height_cm) - (6.8 * age);
    }
}

/**
 * Get activity factor based on training load
 * Based on standard activity multipliers
 */
function getActivityFactor(trainingLoad) {
    if (trainingLoad < 0.5) return 1.2;   // Sedentary
    if (trainingLoad < 1.5) return 1.375; // Lightly active
    if (trainingLoad < 3.0) return 1.55;  // Moderately active
    if (trainingLoad < 4.5) return 1.725; // Very active
    return 1.9;                            // Extremely active
}

/**
 * Get activity level name for display
 */
function getActivityLevelName(factor) {
    if (factor <= 1.2) return 'Sedentary';
    if (factor <= 1.375) return 'Lightly Active';
    if (factor <= 1.55) return 'Moderately Active';
    if (factor <= 1.725) return 'Very Active';
    return 'Extremely Active';
}

/**
 * Build calorie explanation text
 */
function buildCalorieExplanation(bmr, tdee, targetCalories, activityFactor, goal, gender, deficitPercent) {
    const activityLevel = getActivityLevelName(activityFactor);
    const isFatLoss = goal === 'fat_loss' || goal === 'fat_loss_with_performance';
    const isSurplus = goal === 'muscle_gain' || goal === 'hypertrophy';
    
    let explanation = `BMR (${Math.round(bmr)} kcal) × ${activityFactor} (${activityLevel}) = TDEE ${tdee} kcal. `;
    
    if (isFatLoss) {
        const minimumCalories = gender === 'female' ? 1200 : 1500;
        if (targetCalories === minimumCalories) {
            explanation += `Calculated deficit would be below safe minimum (${minimumCalories} kcal for ${gender}s per ADA guidelines). Target set to minimum for health and metabolic function.`;
        } else {
            explanation += `Fat loss: ${deficitPercent}% deficit = ${targetCalories} kcal. This moderate deficit promotes sustainable fat loss (~0.5-1% bodyweight/week) while preserving muscle mass and supporting training per ACSM2016.`;
        }
    } else if (isSurplus) {
        explanation += `Muscle gain: ${Math.abs(deficitPercent)}% surplus = ${targetCalories} kcal to support hypertrophy and recovery per ISSN2017.`;
    } else {
        explanation += `Maintenance calories to support current training load and performance.`;
    }
    
    return explanation;
}

/**
 * Calculate training load: L = Σ(hours × intensityFactor)
 */
function calculateTrainingLoad(workouts) {
    let load = 0;
    
    workouts.forEach(workout => {
        const hours = workout.duration_min / 60;
        const intensityFactor = getIntensityFactor(workout.intensity);
        load += hours * intensityFactor;
    });
    
    return load;
}

/**
 * Map intensity to factor
 */
function getIntensityFactor(intensity) {
    const factors = {
        'low': 0.8,
        'moderate': 1.2,
        'high': 1.5,
        'very_high': 1.8
    };
    return factors[intensity] || 1.0;
}

/**
 * Determine macro context
 */
function determineContext(workouts, trainingLoad, goal) {
    // Simplified for v1 (no race data yet)
    if (trainingLoad > 1.5) return 'workout';
    if (goal === 'fat_loss') return 'fat_loss';
    if (trainingLoad < 0.5) return 'recovery';
    return 'normal';
}

/**
 * Calculate protein target
 */
function calculateProtein(weight, goal, phase, workouts, context) {
    let proteinPerKg = 1.6; // default
    
    // Baseline by goal/phase
    if (goal === 'fat_loss' || goal === 'fat_loss_with_performance') {
        proteinPerKg = 2.3;
    } else if (goal === 'performance') {
        if (phase === 'base' || phase === 'build') {
            proteinPerKg = 1.8;
        } else if (phase === 'race') {
            proteinPerKg = 1.6;
        } else if (phase === 'recovery') {
            proteinPerKg = 1.7;
        }
    } else if (goal === 'hypertrophy') {
        proteinPerKg = 2.0;
    }
    
    // Workout bump: +0.2 g/kg if any session >90min or intensityFactor >1.5
    const hasLongOrIntense = workouts.some(w => 
        w.duration_min > 90 || getIntensityFactor(w.intensity) > 1.5
    );
    
    if (hasLongOrIntense) {
        proteinPerKg += 0.2;
    }
    
    const target_g = weight * proteinPerKg;
    
    const explanation = `Protein set to ${Math.round(target_g)} g (${proteinPerKg} g/kg × ${weight} kg). ` +
        `Rationale: ${getProteinRationale(goal, phase, hasLongOrIntense)}`;
    
    return { target_g, proteinPerKg, explanation };
}

function getProteinRationale(goal, phase, hasLongOrIntense) {
    if (goal === 'fat_loss' || goal === 'fat_loss_with_performance') {
        return 'Higher protein (2.3 g/kg) during fat loss preserves lean muscle mass per Morton2018 meta-analysis. ' +
            'Distribute across 3-4 meals (0.25-0.4 g/kg each) to maximize muscle protein synthesis.';
    }
    if (hasLongOrIntense) {
        return `Elevated protein (${phase} phase baseline +0.2 g/kg) due to long/intense session requiring enhanced recovery per ISSN2017.`;
    }
    return `Moderate protein for ${phase} training phase supports adaptation and recovery per ACSM2016 guidelines.`;
}

/**
 * Calculate carbohydrate target
 */
function calculateCarbs(weight, goal, trainingLoad, workouts, context) {
    // Workout-based bands (performance baseline)
    let carbPerKg = 3.5;
    
    if (trainingLoad < 0.5) {
        carbPerKg = 3.5;
    } else if (trainingLoad < 1.5) {
        carbPerKg = 6.0;
    } else if (trainingLoad < 3.0) {
        carbPerKg = 8.0;
    } else {
        carbPerKg = 10.0;
    }
    
    // FAT LOSS ADJUSTMENT: Reduce carbs by 30-40% while maintaining workout fuel
    const isFatLoss = (goal === 'fat_loss' || goal === 'fat_loss_with_performance');
    let fatLossModifier = 1.0;
    
    if (isFatLoss) {
        if (trainingLoad < 0.5) {
            // Rest day: aggressive cut (40%)
            fatLossModifier = 0.6;
        } else if (trainingLoad < 1.5) {
            // Light training: moderate cut (35%)
            fatLossModifier = 0.65;
        } else if (trainingLoad < 3.0) {
            // Moderate-high training: conservative cut (30%) to maintain performance
            fatLossModifier = 0.70;
        } else {
            // Very high training: minimal cut (25%) to prevent performance loss
            fatLossModifier = 0.75;
        }
        
        carbPerKg = carbPerKg * fatLossModifier;
    }
    
    const target_g = weight * carbPerKg;
    
    const band = trainingLoad < 0.5 ? 'rest/recovery' :
                 trainingLoad < 1.5 ? 'moderate' :
                 trainingLoad < 3.0 ? 'high' : 'very high';
    
    const fatLossNote = isFatLoss ? 
        ` (reduced by ${Math.round((1 - fatLossModifier) * 100)}% for fat loss while maintaining workout fuel)` : '';
    
    const explanation = `Carbs set to ${Math.round(target_g)} g (${carbPerKg.toFixed(1)} g/kg × ${weight} kg${fatLossNote}). ` +
        `Training load: ${trainingLoad.toFixed(2)} (${band} band). ` +
        `Rationale: ${getCarbRationale(band, goal, trainingLoad, isFatLoss, fatLossModifier)}`;
    
    return { target_g, carbPerKg, band, explanation, isFatLoss, fatLossModifier };
}

function getCarbRationale(band, goal, load, isFatLoss, fatLossModifier) {
    const base = `Training load of ${load.toFixed(1)} places you in the "${band}" band per IOC/ACSM guidance. `;
    
    let guideline = '';
    if (band === 'very high') {
        guideline = isFatLoss ? 
            'For fat loss with heavy training, carbs reduced by 25% from performance baseline (8-12 g/kg → 6-9 g/kg) to create deficit while maintaining glycogen for key sessions per ISSN2017.' :
            'High carb intake (8-12 g/kg) critical for maintaining glycogen stores during heavy training per ISSN2017.';
    } else if (band === 'high') {
        guideline = isFatLoss ?
            `For fat loss with moderate-high training, carbs reduced by 30% from performance baseline (6-10 g/kg → 4.2-7 g/kg) to create deficit while fueling workouts per ACSM2016. Pre/post-workout carbs prioritized.` :
            'Elevated carbs (6-10 g/kg) support intensive training sessions and glycogen repletion per ACSM2016.';
    } else if (band === 'moderate') {
        guideline = isFatLoss ?
            'For fat loss with moderate training, carbs reduced by 35% from baseline (5-7 g/kg → 3.3-4.5 g/kg) to accelerate fat oxidation while preventing performance loss per Thomas2016.' :
            'Moderate carbs (5-7 g/kg) sufficient for current training volume per IOC2018 guidelines.';
    } else {
        guideline = isFatLoss ?
            'For fat loss on rest days, carbs reduced by 40% (3-5 g/kg → 1.8-3 g/kg) to maximize fat burning when training demand is low per Burke2011.' :
            'Lower carbs appropriate for rest/recovery days, maintains baseline glycogen without excess.';
    }
    
    return base + guideline;
}

/**
 * Calculate fat target
 */
function calculateFat(weight, context, goal) {
    let fatPerKg = 0.8; // default
    
    if (context === 'race') {
        fatPerKg = 0.6;
    } else if (goal === 'fat_loss' || goal === 'fat_loss_with_performance') {
        fatPerKg = 0.9;
    } else if (context === 'workout' || context === 'recovery' || context === 'normal') {
        fatPerKg = 0.8;
    }
    
    const target_g = weight * fatPerKg;
    
    const explanation = `Fat set to ${Math.round(target_g)} g (${fatPerKg} g/kg × ${weight} kg). ` +
        `Rationale: ${getFatRationale(context, goal, fatPerKg)}`;
    
    return { target_g, fatPerKg, explanation };
}

function getFatRationale(context, goal, fatPerKg) {
    if (context === 'race') {
        return 'Lower fat (0.6 g/kg) on race days prioritizes carb availability and easier digestion.';
    }
    if (goal === 'fat_loss') {
        return 'Moderate fat (0.9 g/kg) during fat loss provides satiety and supports hormone production while maintaining calorie deficit.';
    }
    return `Balanced fat intake (${fatPerKg} g/kg) supports hormone production, vitamin absorption, and satiety per ACSM2016 (20-35% calories).`;
}

/**
 * Calculate hydration target
 */
function calculateHydration(weight, workouts, context) {
    // Base hydration: 35 ml/kg
    let target_ml = weight * 35;
    
    // Add per-workout hydration
    workouts.forEach(workout => {
        const hours = workout.duration_min / 60;
        const intensityFactor = getIntensityFactor(workout.intensity);
        
        // ml/h = 400 + clamp(intensityFactor - 1, 0, 1) × 400
        const clampedIntensity = Math.max(0, Math.min(1, intensityFactor - 1));
        const mlPerHour = 400 + (clampedIntensity * 400);
        
        target_ml += hours * mlPerHour;
    });
    
    // Race/taper adjustments (simplified for v1)
    if (context === 'race') {
        target_ml += 500;
    }
    
    const explanation = `Hydration set to ${Math.round(target_ml)} ml (${(target_ml/1000).toFixed(1)} L). ` +
        `Base: ${weight * 35} ml (35 ml/kg). Workout additions: ${Math.round(target_ml - weight * 35)} ml. ` +
        `Rationale: Base hydration plus workout-specific needs adjusted for intensity per ACSM2016 fluid guidelines.`;
    
    return { target_ml, explanation };
}

/**
 * Calculate sodium target
 */
function calculateSodium(workouts, weight, hydration_ml) {
    // Base sodium for athletes: 3000-4000 mg/day
    let sodium_mg = 3000;
    
    // Add per workout based on duration and intensity
    workouts.forEach(workout => {
        const hours = workout.duration_min / 60;
        const intensityFactor = getIntensityFactor(workout.intensity);
        const isHeat = workout.environment?.heat_index_flag || false;
        
        // Base sodium loss: ~500-1000mg per hour of exercise
        let sodiumPerHour = 500;
        
        // Increase for intensity
        if (intensityFactor > 1.2) {
            sodiumPerHour = 700;
        }
        if (intensityFactor > 1.5) {
            sodiumPerHour = 900;
        }
        
        // Increase for heat
        if (isHeat) {
            sodiumPerHour += 300; // Heat increases sweat rate
        }
        
        sodium_mg += hours * sodiumPerHour;
    });
    
    // Minimum for training days
    sodium_mg = Math.max(3000, sodium_mg);
    
    // Maximum reasonable
    sodium_mg = Math.min(6000, sodium_mg);
    
    const workoutSodium = sodium_mg - 3000;
    const explanation = `Sodium set to ${Math.round(sodium_mg)} mg. ` +
        `Base: 3000 mg (athlete baseline). Workout losses: +${Math.round(workoutSodium)} mg. ` +
        `Rationale: Athletes need 3-4g daily minimum per McCubbin2025, plus replacement for sweat losses ` +
        `(~500-1000 mg/hour exercise). Include electrolyte drinks and salt meals to hit target.`;
    
    return { target_mg: sodium_mg, explanation };
}

/**
 * Get intensity factor for workout type (if type-specific needed)
 */
function getWorkoutTypeMultiplier(type) {
    // Could add type-specific adjustments here
    return 1.0;
}

/**
 * Main export function
 */
window.calculateDailyTargets = calculateDailyTargets;

