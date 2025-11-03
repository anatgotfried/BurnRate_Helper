// Model Testing Script - Test all models programmatically
// Run this in browser console on the meal playground page

const API_URL = 'https://burn-rate-helper.vercel.app';

// Test configuration
const TEST_PROFILE = {
    weight_kg: 70,
    height_cm: 175,
    gender: 'male',
    training_phase: 'base',
    goal: 'performance',
    diet_pattern: 'omnivore',
    gi_tolerance: 'medium',
    sweat_rate: '1000',
    timezone: 'Asia/Jerusalem',
    populations: ['masters']
};

const TEST_WORKOUT = {
    id: 1,
    type: 'run',
    duration: 60,
    duration_min: 60,
    intensity: 'moderate',
    startTime: '09:00',
    temperature: 20,
    temp_c: 20,
    humidity: 60,
    humidity_pct: 60
};

// Models to test (from dropdown)
const MODELS_TO_TEST = [
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-3.2-24b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o'
];

let testResults = [];

/**
 * Test a single model
 */
async function testModel(modelId, testNumber) {
    console.log(`\n=== Testing Model ${testNumber}/${MODELS_TO_TEST.length}: ${modelId} ===`);
    
    const startTime = Date.now();
    const result = {
        model: modelId,
        test_number: testNumber,
        timestamp: new Date().toISOString(),
        success: false,
        error: null,
        duration_ms: 0,
        usage: null,
        cost: null,
        meal_count: 0,
        has_valid_json: false,
        truncated: false,
        auto_fixed: false,
        raw_response: null,
        parsed_plan: null
    };
    
    try {
        // Build context (same as real app)
        const context = {
            athlete: TEST_PROFILE,
            workouts: [TEST_WORKOUT],
            calculated_targets: calculateDailyTargets(TEST_PROFILE, [TEST_WORKOUT])
        };
        
        // Build prompt (simplified - without full corpus)
        const prompt = buildSimplePrompt(context);
        
        console.log(`  📤 Sending request to ${modelId}...`);
        console.log(`  📏 Prompt size: ~${Math.ceil(prompt.length / 4)} tokens`);
        
        // Call API
        const response = await fetch(`${API_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelId,
                prompt: prompt,
                max_tokens: 6000
            })
        });
        
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        result.duration_ms = duration;
        result.usage = data.usage;
        result.raw_response = data;
        result.auto_fixed = data.auto_fixed || false;
        result.truncated = data.truncated || false;
        
        if (data.success && data.meal_plan) {
            result.success = true;
            result.has_valid_json = true;
            result.meal_count = data.meal_plan.meals?.length || 0;
            result.parsed_plan = data.meal_plan;
            
            // Calculate cost
            if (data.usage) {
                const costInfo = calculateCost(modelId, data.usage);
                result.cost = costInfo.totalCost;
            }
            
            console.log(`  ✅ SUCCESS in ${duration}ms`);
            console.log(`  📊 Meals generated: ${result.meal_count}`);
            console.log(`  💰 Cost: ${result.cost === 0 ? 'FREE' : '$' + result.cost.toFixed(6)}`);
            console.log(`  🔧 Auto-fixed: ${result.auto_fixed || 'No'}`);
            
        } else {
            result.success = false;
            result.error = data.error || 'Unknown error';
            result.has_valid_json = false;
            
            console.log(`  ❌ FAILED in ${duration}ms`);
            console.log(`  Error: ${result.error}`);
            
            if (data.truncated) {
                console.log(`  ⚠️ Response was truncated`);
            }
        }
        
    } catch (error) {
        result.duration_ms = Date.now() - startTime;
        result.success = false;
        result.error = error.message;
        console.log(`  ❌ EXCEPTION: ${error.message}`);
    }
    
    return result;
}

/**
 * Build simple prompt for testing
 */
function buildSimplePrompt(context) {
    return `You are a sports nutritionist. Generate a complete daily meal plan.

ATHLETE & TARGETS:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON with this structure:
{
  "athlete_summary": {...},
  "meals": [
    {
      "time": "HH:MM",
      "name": "Meal name",
      "type": "breakfast|pre_workout|post_workout|lunch|dinner|snack",
      "foods": [
        {"item": "Food with portion", "carbs_g": N, "protein_g": N, "fat_g": N, "sodium_mg": N, "calories": N}
      ],
      "total_carbs_g": N,
      "total_protein_g": N,
      "total_fat_g": N,
      "total_sodium_mg": N,
      "total_calories": N,
      "rationale": "Brief explanation",
      "israel_alternatives": ["Product 1", "Product 2"]
    }
  ],
  "daily_totals": {...},
  "key_recommendations": ["..."]
}

Generate meal plan now in ONLY JSON (no markdown, no text).`;
}

/**
 * Test all models
 */
async function testAllModels() {
    console.log('🚀 Starting comprehensive model testing...\n');
    console.log(`Testing ${MODELS_TO_TEST.length} models with identical profile and workout\n`);
    
    testResults = [];
    
    for (let i = 0; i < MODELS_TO_TEST.length; i++) {
        const modelId = MODELS_TO_TEST[i];
        const result = await testModel(modelId, i + 1);
        testResults.push(result);
        
        // If failed and not Claude, test Claude as fallback
        if (!result.success && !modelId.includes('claude')) {
            console.log(`  🔄 Retrying with Claude 3.5 Sonnet as fallback...`);
            const claudeResult = await testModel('anthropic/claude-3.5-sonnet', 'F' + (i + 1));
            claudeResult.is_fallback = true;
            claudeResult.fallback_for = modelId;
            testResults.push(claudeResult);
        }
        
        // Delay between tests to avoid rate limits
        if (i < MODELS_TO_TEST.length - 1) {
            console.log(`  ⏱️ Waiting 3 seconds before next test...\n`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Generate report
    generateReport();
    
    // Save results
    saveResults();
    
    console.log('\n✅ All model testing complete!');
    console.log('📊 Results saved to window.modelTestResults');
    console.log('📋 Download report: window.downloadTestReport()');
}

/**
 * Generate comparison report
 */
function generateReport() {
    console.log('\n\n' + '='.repeat(80));
    console.log('MODEL TESTING REPORT');
    console.log('='.repeat(80) + '\n');
    
    console.log('Test Date:', new Date().toLocaleString());
    console.log('Test Profile: 70kg, male, base phase, 60min moderate run at 09:00');
    console.log('Models Tested:', MODELS_TO_TEST.length);
    console.log('\n');
    
    // Table header
    console.log('MODEL                          | SUCCESS | MEALS | TIME   | COST      | NOTES');
    console.log('-'.repeat(95));
    
    testResults.filter(r => !r.is_fallback).forEach(result => {
        const model = result.model.split('/').pop().substring(0, 30).padEnd(30);
        const success = result.success ? '✅ YES' : '❌ NO ';
        const meals = result.meal_count.toString().padEnd(5);
        const time = `${(result.duration_ms / 1000).toFixed(1)}s`.padEnd(6);
        const cost = result.cost !== null 
            ? (result.cost === 0 ? 'FREE' : `$${result.cost.toFixed(4)}`).padEnd(9)
            : 'N/A'.padEnd(9);
        
        let notes = '';
        if (result.auto_fixed) notes += '🔧Auto-fix ';
        if (result.truncated) notes += '⚠️Truncated ';
        if (result.error) notes += `Error: ${result.error.substring(0, 30)}`;
        
        console.log(`${model} | ${success} | ${meals} | ${time} | ${cost} | ${notes}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Summary stats
    const successful = testResults.filter(r => !r.is_fallback && r.success).length;
    const failed = testResults.filter(r => !r.is_fallback && !r.success).length;
    const autoFixed = testResults.filter(r => !r.is_fallback && r.auto_fixed).length;
    const avgCost = testResults
        .filter(r => !r.is_fallback && r.cost !== null && r.cost > 0)
        .reduce((sum, r) => sum + r.cost, 0) / testResults.filter(r => !r.is_fallback && r.cost > 0).length;
    
    console.log('\nSUMMARY:');
    console.log(`  Successful: ${successful}/${MODELS_TO_TEST.length} (${Math.round(successful/MODELS_TO_TEST.length*100)}%)`);
    console.log(`  Failed: ${failed}/${MODELS_TO_TEST.length}`);
    console.log(`  Auto-fixed: ${autoFixed}`);
    console.log(`  Avg Cost (paid models): $${avgCost.toFixed(4)}`);
    
    console.log('\n' + '='.repeat(80));
}

/**
 * Save results to window and localStorage
 */
function saveResults() {
    window.modelTestResults = testResults;
    localStorage.setItem('modelTestResults', JSON.stringify(testResults, null, 2));
    localStorage.setItem('modelTestDate', new Date().toISOString());
}

/**
 * Download test report
 */
function downloadTestReport() {
    const report = {
        test_date: new Date().toISOString(),
        test_profile: TEST_PROFILE,
        test_workout: TEST_WORKOUT,
        models_tested: MODELS_TO_TEST.length,
        results: testResults
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Test report downloaded!');
}

// Export functions
window.testAllModels = testAllModels;
window.downloadTestReport = downloadTestReport;

console.log(`
🧪 Model Testing Suite Loaded!

Usage:
  1. testAllModels()    - Run tests on all models
  2. downloadTestReport() - Download JSON report

This will test ${MODELS_TO_TEST.length} models with identical data and show:
  - Success rate
  - Meal count
  - Response time
  - Cost
  - Error details
  - Fallback to Claude if needed

Ready to start? Run: testAllModels()
`);

