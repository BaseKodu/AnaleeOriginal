/**
 * explanationHandler.js
 * 
 * This module handles all functionality related to transaction explanations in the analyze page.
 * It manages the textarea inputs where users can enter explanations for their transactions,
 * including features like:
 * - Auto-resizing of textareas
 * - Character count tracking
 * - Automatic saving of explanations
 * - Visual feedback for content state
 * - Detection of similar transactions
 */

export class ExplanationHandler {
    /**
     * Initialize the explanation handler and set up event listeners
     */
    constructor() {
        this.initializeExplanationInputs();
    }

    /**
     * Initialize all explanation input textareas on the page
     * Sets up necessary event listeners and UI elements for each textarea
     */
    initializeExplanationInputs() {
        const explanationInputs = document.querySelectorAll('.explanation-input');
        explanationInputs.forEach(textarea => {
            this.setupTextarea(textarea);
        });
    }

    /**
     * Set up a single textarea with all necessary features and event listeners
     * @param {HTMLTextAreaElement} textarea - The textarea element to set up
     */
    setupTextarea(textarea) {
        const container = textarea.closest('.explanation-container');
        if (!container) {
            console.error('Explanation container not found for textarea:', textarea);
            return;
        }
        
        let timeoutId;
        let similarDescriptions = new Set();

        // Create character count element
        const charCount = document.createElement('span');
        charCount.className = 'char-count position-absolute bottom-0 end-0 small text-muted pe-2';
        container.appendChild(charCount);

        // Initialize textarea state
        this.autoResize(textarea);
        this.updateCharCount(textarea.value, charCount);
        if (textarea.value.trim()) {
            textarea.classList.add('has-content');
        }

        // Set up event listeners
        textarea.addEventListener('input', () => this.handleInput(textarea, charCount, timeoutId));
        textarea.addEventListener('focus', () => this.handleFocus(textarea, helpText, charCount));
        textarea.addEventListener('blur', () => this.handleBlur(textarea, helpText, charCount));
        textarea.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * Auto-resize textarea based on content
     * @param {HTMLTextAreaElement} el - The textarea element to resize
     */
    autoResize(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(200, Math.max(80, el.scrollHeight)) + 'px';
    }

    /**
     * Update the character count display
     * @param {string} text - The current text content
     * @param {HTMLElement} charCount - The character count display element
     */
    updateCharCount(text, charCount) {
        charCount.textContent = `${text.length}/500`;
    }

    /**
     * Handle input events on the textarea
     * @param {HTMLTextAreaElement} textarea - The textarea being modified
     * @param {HTMLElement} charCount - The character count element
     * @param {number} timeoutId - The timeout ID for debouncing
     */
    async handleInput(textarea, charCount, timeoutId) {
        const transactionId = textarea.dataset.transactionId;
        this.autoResize(textarea);
        this.updateCharCount(textarea.value, charCount);
        textarea.classList.toggle('has-content', textarea.value.trim() !== '');

        // Debounce saving changes
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => this.saveExplanation(textarea), 1000);
    }

    /**
     * Handle textarea focus events
     * @param {HTMLTextAreaElement} textarea - The focused textarea
     * @param {HTMLElement} helpText - The help text element
     * @param {HTMLElement} charCount - The character count element
     */
    handleFocus(textarea, helpText, charCount) {
        textarea.classList.add('explanation-focused');
        helpText.style.display = 'block';
        charCount.style.opacity = '1';
    }

    /**
     * Handle textarea blur events
     * @param {HTMLTextAreaElement} textarea - The blurred textarea
     * @param {HTMLElement} helpText - The help text element
     * @param {HTMLElement} charCount - The character count element
     */
    handleBlur(textarea, helpText, charCount) {
        textarea.classList.remove('explanation-focused');
        helpText.style.display = 'none';
        charCount.style.opacity = '0.5';
        textarea.classList.toggle('has-content', textarea.value.trim() !== '');
    }

    /**
     * Handle keydown events on the textarea
     * @param {KeyboardEvent} e - The keydown event
     */
    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
        }
    }

    /**
     * Save the explanation to the server
     * @param {HTMLTextAreaElement} textarea - The textarea containing the explanation
     */
    async saveExplanation(textarea) {
        try {
            const transactionId = textarea.dataset.transactionId;
            const description = textarea.closest('tr').querySelector('[data-description]').dataset.description;
            
            const response = await fetch('/update_explanation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    explanation: textarea.value.trim(),
                    description: description
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save explanation');
            }

            const result = await response.json();
            
            // Handle similar transactions if found
            if (result.similar_transactions?.length > 0) {
                await this.handleSimilarTransactions(result.similar_transactions, textarea);
            }

        } catch (error) {
            console.error('Error saving explanation:', error);
            // Could add user feedback for errors here
        }
    }

    /**
     * Handle applying explanations to similar transactions
     * @param {Array} similarTransactions - Array of similar transactions
     * @param {HTMLTextAreaElement} sourceTextarea - The textarea containing the original explanation
     */
    async handleSimilarTransactions(similarTransactions, sourceTextarea) {
        const similarCount = similarTransactions.length;
        const shouldApplyToAll = confirm(
            `Found ${similarCount} similar transaction(s) with 70% or higher description similarity. Would you like to apply this explanation to them as well?`
        );

        if (shouldApplyToAll) {
            for (const similar of similarTransactions) {
                const similarTextarea = document.querySelector(`textarea[name="explanation_${similar.id}"]`);
                if (similarTextarea) {
                    similarTextarea.value = sourceTextarea.value;
                    similarTextarea.classList.add('has-content');
                    await this.saveExplanation(similarTextarea);
                }
            }
        }
    }
}

// Export a singleton instance
export default new ExplanationHandler();