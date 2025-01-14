/**
 * accountSuggestions.js
 * 
 * This module manages the AI-powered account suggestion functionality in the analyze page.
 * It handles:
 * - Fetching AI-powered account suggestions for transactions
 * - Displaying suggestion results with confidence scores
 * - Managing UI states during the suggestion process
 * - Applying selected suggestions to transactions
 * 
 * The suggestions are based on:
 * - Transaction descriptions
 * - User-provided explanations
 * - Historical account assignments
 */

export class AccountSuggestionHandler {
    /**
     * Initialize the account suggestion handler
     */
    constructor() {
        this.initializeSuggestionButtons();
    }

    /**
     * Set up event listeners for all suggestion buttons
     */
    initializeSuggestionButtons() {
        document.querySelectorAll('.suggest-account-btn').forEach(button => {
            button.addEventListener('click', async () => this.handleSuggestionClick(button));
        });
    }

    /**
     * Handle clicks on the suggestion button
     * @param {HTMLButtonElement} button - The clicked suggestion button
     */
    async handleSuggestionClick(button) {
        const transactionId = button.dataset.transactionId;
        const description = button.dataset.description;
        const explanation = button.dataset.explanation;
        const suggestionsDiv = document.getElementById(`suggestions-${transactionId}`);
        
        try {
            // Show loading state
            this.setLoadingState(button, suggestionsDiv);

            // Fetch and display suggestions
            const suggestions = await this.fetchSuggestions(description, explanation);
            this.displaySuggestions(suggestions, suggestionsDiv, transactionId);

        } catch (error) {
            this.handleError(error, suggestionsDiv);
        } finally {
            this.resetButtonState(button);
        }
    }

    /**
     * Set the loading state for the suggestion UI
     * @param {HTMLButtonElement} button - The suggestion button
     * @param {HTMLElement} suggestionsDiv - The suggestions container
     */
    setLoadingState(button, suggestionsDiv) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        suggestionsDiv.innerHTML = '<div class="alert alert-info">Loading suggestions...</div>';
        suggestionsDiv.style.display = 'block';
    }

    /**
     * Reset the button state after loading
     * @param {HTMLButtonElement} button - The suggestion button
     */
    resetButtonState(button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-magic"></i> Suggest';
    }

    /**
     * Fetch account suggestions from the server
     * @param {string} description - Transaction description
     * @param {string} explanation - User-provided explanation
     * @returns {Promise<Array>} Array of suggestion objects
     */
    async fetchSuggestions(description, explanation) {
        const response = await fetch('/predict_account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: description,
                explanation: explanation
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const suggestions = await response.json();

        if (suggestions.error) {
            throw new Error(suggestions.error);
        }

        return suggestions;
    }

    /**
     * Display the suggestions in the UI
     * @param {Array} suggestions - Array of suggestion objects
     * @param {HTMLElement} suggestionsDiv - Container for suggestions
     * @param {string} transactionId - ID of the transaction
     */
    displaySuggestions(suggestions, suggestionsDiv, transactionId) {
        // Clear previous suggestions
        suggestionsDiv.innerHTML = '';

        if (suggestions && suggestions.length > 0) {
            const suggestionsList = this.createSuggestionsList(suggestions, transactionId);
            suggestionsDiv.appendChild(suggestionsList);
        } else {
            this.displayNoSuggestionsMessage(suggestionsDiv);
        }
    }

    /**
     * Create the suggestions list element
     * @param {Array} suggestions - Array of suggestion objects
     * @param {string} transactionId - ID of the transaction
     * @returns {HTMLElement} The suggestions list element
     */
    createSuggestionsList(suggestions, transactionId) {
        const suggestionsList = document.createElement('div');
        suggestionsList.className = 'list-group suggestions';
        
        suggestions.forEach(suggestion => {
            const item = this.createSuggestionItem(suggestion, transactionId);
            suggestionsList.appendChild(item);
        });

        return suggestionsList;
    }

    /**
     * Create a single suggestion item
     * @param {Object} suggestion - Suggestion data object
     * @param {string} transactionId - ID of the transaction
     * @returns {HTMLElement} The suggestion item element
     */
    createSuggestionItem(suggestion, transactionId) {
        const confidenceLevel = this.getConfidenceLevel(suggestion.confidence);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item list-group-item-action suggestion-item';
        
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${suggestion.account.name}</h6>
                    <div class="suggestion-reasoning">${suggestion.reasoning}</div>
                </div>
                <span class="badge bg-${confidenceLevel} suggestion-confidence">
                    ${Math.round(suggestion.confidence * 100)}% match
                </span>
            </div>
        `;

        // Add click handler for applying the suggestion
        item.addEventListener('click', () => {
            this.applySuggestion(suggestion, transactionId);
        });

        return item;
    }

    /**
     * Get the confidence level class based on the confidence score
     * @param {number} confidence - Confidence score (0-1)
     * @returns {string} Bootstrap color class
     */
    getConfidenceLevel(confidence) {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'info';
        return 'warning';
    }

    /**
     * Apply a suggestion to the transaction
     * @param {Object} suggestion - The selected suggestion
     * @param {string} transactionId - ID of the transaction
     */
    applySuggestion(suggestion, transactionId) {
        const select = document.getElementById(`select-${transactionId}`);
        const form = document.getElementById('analyzeForm');
        
        // Find and select the matching option
        const options = Array.from(select.options);
        const matchingOption = options.find(option => 
            option.text.includes(suggestion.account.name)
        );
        
        if (matchingOption) {
            select.value = matchingOption.value;
            form.submit();
        }
    }

    /**
     * Display a message when no suggestions are available
     * @param {HTMLElement} suggestionsDiv - The suggestions container
     */
    displayNoSuggestionsMessage(suggestionsDiv) {
        suggestionsDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                No suggestions available for this transaction
            </div>
        `;
    }

    /**
     * Handle errors in the suggestion process
     * @param {Error} error - The error object
     * @param {HTMLElement} suggestionsDiv - The suggestions container
     */
    handleError(error, suggestionsDiv) {
        console.error('Error:', error);
        suggestionsDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error getting suggestions: ${error.message}
            </div>
        `;
    }
}

// Export a singleton instance
export default new AccountSuggestionHandler();