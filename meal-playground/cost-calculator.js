// BurnRate Cost Calculator - Track OpenRouter API costs

// Pricing data (per 1M tokens) - Verified from OpenRouter API Nov 2025
const MODEL_PRICING = {
    'google/gemini-2.5-flash': {
        input: 0,
        output: 0,
        name: 'Gemini 2.5 Flash (FREE)'
    },
    'google/gemini-2.5-pro': {
        input: 0,
        output: 0,
        name: 'Gemini 2.5 Pro (FREE)'
    },
    'google/gemini-2.0-flash-001': {
        input: 0,
        output: 0,
        name: 'Gemini 2.0 Flash (FREE)'
    },
    'google/gemini-2.0-flash-exp:free': {
        input: 0,
        output: 0,
        name: 'Gemini 2.0 Flash Exp (FREE)'
    },
    'mistralai/mistral-small-3.2-24b-instruct': {
        input: 0.06,
        output: 0.18,
        name: 'Mistral Small 3.2'
    },
    'qwen/qwen-2.5-72b-instruct': {
        input: 0.07,
        output: 0.26,
        name: 'Qwen 2.5 72B'
    },
    'anthropic/claude-haiku-4.5': {
        input: 1.0,
        output: 5.0,
        name: 'Claude Haiku 4.5'
    },
    'openai/gpt-4o-mini': {
        input: 0.15,
        output: 0.60,
        name: 'GPT-4o Mini'
    },
    'mistralai/mistral-medium-3.1': {
        input: 0.40,
        output: 2.00,
        name: 'Mistral Medium 3.1'
    },
    'cohere/command-r-plus-08-2024': {
        input: 2.50,
        output: 10.00,
        name: 'Cohere Command R+'
    },
    'anthropic/claude-sonnet-4.5': {
        input: 3.00,
        output: 15.00,
        name: 'Claude Sonnet 4.5'
    },
    'openai/gpt-4o': {
        input: 2.50,
        output: 10.00,
        name: 'GPT-4o'
    },
    'mistralai/mistral-small-3.2-24b-instruct:free': {
        input: 0,
        output: 0,
        name: 'Mistral Small 3.2 (Free)'
    },
    'qwen/qwen-2.5-72b-instruct:free': {
        input: 0,
        output: 0,
        name: 'Qwen 2.5 72B (Free)'
    }
};

/**
 * Calculate cost from token usage
 * @param {string} modelId - Model identifier
 * @param {Object} usage - {prompt_tokens, completion_tokens, total_tokens}
 * @returns {Object} Cost breakdown
 */
function calculateCost(modelId, usage) {
    const pricing = MODEL_PRICING[modelId];
    
    if (!pricing) {
        return {
            inputCost: 0,
            outputCost: 0,
            totalCost: 0,
            modelName: modelId,
            error: 'Unknown model pricing'
        };
    }
    
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    
    // Calculate costs (pricing is per 1M tokens, so divide by 1,000,000)
    const inputCost = (promptTokens / 1000000) * pricing.input;
    const outputCost = (completionTokens / 1000000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    return {
        inputCost: inputCost,
        outputCost: outputCost,
        totalCost: totalCost,
        promptTokens: promptTokens,
        completionTokens: completionTokens,
        totalTokens: promptTokens + completionTokens,
        modelName: pricing.name,
        isFree: totalCost === 0
    };
}

/**
 * Format cost for display
 */
function formatCost(cost) {
    if (cost === 0) {
        return 'FREE';
    }
    if (cost < 0.001) {
        return '< $0.001';
    }
    if (cost < 0.01) {
        return `$${cost.toFixed(4)}`;
    }
    if (cost < 1) {
        return `$${cost.toFixed(3)}`;
    }
    return `$${cost.toFixed(2)}`;
}

/**
 * Track cumulative costs in localStorage
 * @param {Object} costInfo - Cost info object from calculateCost
 * @returns {Object} Cumulative stats
 */
function addToCumulativeCost(costInfo) {
    // Handle if a number is passed instead of object (backwards compatibility)
    const costToAdd = typeof costInfo === 'number' ? costInfo : (costInfo?.totalCost || 0);
    
    const current = parseFloat(localStorage.getItem('totalCost') || '0');
    const newTotal = current + costToAdd;
    localStorage.setItem('totalCost', newTotal.toString());
    
    const count = parseInt(localStorage.getItem('generationCount') || '0');
    localStorage.setItem('generationCount', (count + 1).toString());
    
    return {
        totalSpent: newTotal,
        generationCount: count + 1,
        averageCost: newTotal / (count + 1)
    };
}

/**
 * Get cumulative stats
 */
function getCumulativeStats() {
    return {
        totalSpent: parseFloat(localStorage.getItem('totalCost') || '0'),
        generationCount: parseInt(localStorage.getItem('generationCount') || '0')
    };
}

/**
 * Reset cumulative tracking
 */
function resetCumulativeTracking() {
    localStorage.removeItem('totalCost');
    localStorage.removeItem('generationCount');
}

// Export functions
window.calculateCost = calculateCost;
window.formatCost = formatCost;
window.addToCumulativeCost = addToCumulativeCost;
window.getCumulativeStats = getCumulativeStats;
window.resetCumulativeTracking = resetCumulativeTracking;

