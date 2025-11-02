// BurnRate Cost Calculator - Track OpenRouter API costs

// Pricing data (per 1M tokens) - Updated Nov 2025
const MODEL_PRICING = {
    'openai/gpt-4o-mini': {
        input: 0.15,
        output: 0.60,
        name: 'GPT-4o Mini'
    },
    'anthropic/claude-3-haiku': {
        input: 0.25,
        output: 1.25,
        name: 'Claude 3 Haiku'
    },
    'anthropic/claude-3.5-sonnet': {
        input: 3.00,
        output: 15.00,
        name: 'Claude 3.5 Sonnet'
    },
    'openai/gpt-4o': {
        input: 5.00,
        output: 15.00,
        name: 'GPT-4o'
    },
    'meta-llama/llama-3.1-8b-instruct:free': {
        input: 0,
        output: 0,
        name: 'Llama 3.1 8B (Free)'
    },
    'mistralai/mistral-7b-instruct:free': {
        input: 0,
        output: 0,
        name: 'Mistral 7B (Free)'
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
 */
function addToCumulativeCost(cost) {
    const current = parseFloat(localStorage.getItem('totalCost') || '0');
    const newTotal = current + cost.totalCost;
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

