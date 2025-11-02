// Smart Research Corpus Filtering - Send only relevant sections

/**
 * Filter research corpus to only relevant sections based on athlete profile and workouts
 * This reduces prompt size from ~15k to ~3-5k tokens = 3-5x faster!
 */
function filterRelevantCorpus(fullCorpus, athlete, workouts) {
    const filtered = {
        schema_version: fullCorpus.schema_version,
        date_generated: fullCorpus.date_generated,
        populations: [],
        contexts: [],
        recommendations: {
            pre_workout: [],
            intra_workout: [],
            post_workout: [],
            personalization_logic: fullCorpus.recommendations.personalization_logic
        },
        practical_examples: [],
        mistakes_and_risks: fullCorpus.mistakes_and_risks, // Always include
        evidence_map: [] // Only relevant citations
    };
    
    // 1. Filter populations - only include relevant ones
    const relevantPopulations = new Set(athlete.populations || []);
    filtered.populations = fullCorpus.populations.filter(p => 
        relevantPopulations.has(p.name)
    );
    
    // 2. Filter recommendations based on workout types
    const workoutDurations = workouts.map(w => w.duration_min);
    const workoutIntensities = workouts.map(w => w.intensity);
    const hasLong = workoutDurations.some(d => d >= 90);
    const hasShort = workoutDurations.some(d => d < 90);
    const hasStrength = workouts.some(w => w.type === 'strength');
    const hasEndurance = workouts.some(w => 
        ['run', 'bike', 'swim', 'long_endurance', 'tempo', 'intervals'].includes(w.type)
    );
    
    // Filter pre-workout recommendations
    fullCorpus.recommendations.pre_workout.forEach(rec => {
        const applies = rec.applies_to.toLowerCase();
        if ((hasLong && applies.includes('≥90')) ||
            (hasShort && applies.includes('<90')) ||
            (hasStrength && applies.includes('strength')) ||
            (hasEndurance && (applies.includes('endurance') || applies.includes('hiit')))) {
            filtered.recommendations.pre_workout.push(rec);
        }
    });
    
    // Filter intra-workout recommendations
    fullCorpus.recommendations.intra_workout.forEach(rec => {
        const applies = rec.applies_to.toLowerCase();
        if ((hasLong && applies.includes('90+')) ||
            (hasShort && applies.includes('60–90')) ||
            (hasStrength && applies.includes('strength')) ||
            (hasEndurance && applies.includes('endurance'))) {
            filtered.recommendations.intra_workout.push(rec);
        }
    });
    
    // Filter post-workout recommendations
    fullCorpus.recommendations.post_workout.forEach(rec => {
        const applies = rec.applies_to.toLowerCase();
        const hasMultipleSessions = workouts.length > 1;
        if ((hasMultipleSessions && applies.includes('multiple sessions')) ||
            (hasStrength && applies.includes('strength')) ||
            (athlete.goal === 'fat_loss' && applies.includes('fat loss')) ||
            applies.includes('general')) {
            filtered.recommendations.post_workout.push(rec);
        }
    });
    
    // 3. Add 1-2 most relevant practical examples
    const exampleCount = 0;
    fullCorpus.practical_examples.forEach(example => {
        const useCase = example.use_case.toLowerCase();
        if (exampleCount < 2) {
            if ((hasEndurance && useCase.includes('cycling')) ||
                (hasStrength && useCase.includes('strength')) ||
                (athlete.gi_tolerance === 'low' && useCase.includes('gi-sensitive'))) {
                filtered.practical_examples.push(example);
            }
        }
    });
    
    // If no specific examples matched, add first two
    if (filtered.practical_examples.length === 0) {
        filtered.practical_examples = fullCorpus.practical_examples.slice(0, 2);
    }
    
    // 4. Collect relevant evidence citations
    const citationsNeeded = new Set();
    
    // From recommendations
    [...filtered.recommendations.pre_workout,
     ...filtered.recommendations.intra_workout,
     ...filtered.recommendations.post_workout].forEach(rec => {
        if (rec.citations) {
            rec.citations.forEach(c => citationsNeeded.add(c));
        }
    });
    
    // Add relevant evidence
    filtered.evidence_map = fullCorpus.evidence_map.filter(e => 
        citationsNeeded.has(e.id) ||
        e.applies_to === 'all' ||
        (athlete.populations && athlete.populations.includes(e.applies_to))
    );
    
    return filtered;
}

/**
 * Estimate token reduction
 */
function estimateTokenSavings(fullCorpus, filteredCorpus) {
    const fullSize = JSON.stringify(fullCorpus).length;
    const filteredSize = JSON.stringify(filteredCorpus).length;
    const reduction = ((fullSize - filteredSize) / fullSize * 100).toFixed(0);
    
    return {
        fullTokens: Math.ceil(fullSize / 4), // Rough estimate: 4 chars = 1 token
        filteredTokens: Math.ceil(filteredSize / 4),
        reductionPercent: reduction,
        speedupEstimate: (fullSize / filteredSize).toFixed(1) + 'x faster'
    };
}

// Export
window.filterRelevantCorpus = filterRelevantCorpus;
window.estimateTokenSavings = estimateTokenSavings;

