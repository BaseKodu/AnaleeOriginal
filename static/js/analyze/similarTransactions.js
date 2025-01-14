/**
 * similarTransactions.js
 * 
 * This module handles the detection and management of similar transactions.
 * Features include:
 * - Real-time detection of similar transactions as users type explanations
 * - Display of similarity scores (both text and semantic)
 * - One-click explanation replication
 * - Debounced API calls for performance
 * - Visual feedback for similar transactions
 */

import { debounce } from '../utils/debounce.js';

export class SimilarTransactionHandler {
    /**
     * Initialize the similar transaction handler
     */
    constructor() {
        this.initializeSimilarTransactions();
    }

    /**
     * Initialize event listeners for detecting similar transactions
     */
    initializeSimilarTransactions() {
        const explanationInputs = document.querySelectorAll('.explanation-input');
        
        explanationInputs.forEach(textarea => {
            // Use debounce to prevent too many API calls
            textarea.addEventListener('input', 
                debounce(async () => this.handleSimilarTransactions(textarea), 500)
            );
        });
    }

    /**
     * Handle the detection and display of similar transactions
     * @param {HTMLTextAreaElement} textarea - The textarea being modified
     */
    async handleSimilarTransactions(textarea) {
        const transactionId = textarea.dataset.transactionId;
        const description = textarea.dataset.description;
        const explanation = textarea.value.trim();
        const similarTransactionsDiv = document.getElementById(`similar-transactions-${transactionId}`);

        if (explanation && description) {
            try {
                const similarTransactions = await this.fetchSimilarTransactions(description, explanation);
                this.displaySimilarTransactions(similarTransactions, similarTransactionsDiv, transactionId);
            } catch (error) {
                console.error('Error finding similar transactions:', error);
                this.handleError(similarTransactionsDiv);
            }
        } else {
            this.hideSimilarTransactions(similarTransactionsDiv);
        }
    }

    /**
     * Fetch similar transactions from the server
     * @param {string} description - Transaction description
     * @param {string} explanation - User-provided explanation
     * @returns {Promise<Array>} Array of similar transactions
     */
    async fetchSimilarTransactions(description, explanation) {
        const response = await fetch('/analyze/similar-transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: description,
                explanation: explanation
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch similar transactions');
        }

        return data.similar_transactions || [];
    }

    /**
     * Display similar transactions in the UI
     * @param {Array} similarTransactions - Array of similar transaction objects
     * @param {HTMLElement} container - Container element for similar transactions
     * @param {string} sourceTransactionId - ID of the source transaction
     */
    displaySimilarTransactions(similarTransactions, container, sourceTransactionId) {
        if (!similarTransactions.length) {
            this.hideSimilarTransactions(container);
            return;
        }

        const similarList = this.createSimilarTransactionsList(
            similarTransactions, 
            sourceTransactionId
        );

        container.innerHTML = '';
        container.appendChild(similarList);
        container.style.display = 'block';
    }

    /**
     * Create the list of similar transactions
     * @param {Array} transactions - Array of similar transaction objects
     * @param {string} sourceTransactionId - ID of the source transaction
     * @returns {HTMLElement} The list element containing similar transactions
     */
    createSimilarTransactionsList(transactions, sourceTransactionId) {
        const listContainer = document.createElement('div');
        listContainer.className = 'list-group mt-3';

        transactions.forEach(transaction => {
            const item = this.createSimilarTransactionItem(transaction, sourceTransactionId);
            listContainer.appendChild(item);
        });

        return listContainer;
    }

    /**
     * Create a single similar transaction item
     * @param {Object} transaction - Similar transaction data
     * @param {string} sourceTransactionId - ID of the source transaction
     * @returns {HTMLElement} The transaction item element
     */
    createSimilarTransactionItem(transaction, sourceTransactionId) {
        const button = document.createElement('button');
        button.className = 'list-group-item list-group-item-action';
        button.onclick = () => this.replicateExplanation(sourceTransactionId, transaction.id);

        button.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <p class="mb-1">${transaction.description}</p>
                    <small class="text-muted">${transaction.explanation}</small>
                </div>
                <div>
                    <span class="badge bg-primary">
                        ${Math.round(transaction.text_similarity * 100)}% text
                    </span>
                    <span class="badge bg-info">
                        ${Math.round(transaction.semantic_similarity * 100)}% semantic
                    </span>
                </div>
            </div>
        `;

        return button;
    }

    /**
     * Hide the similar transactions container
     * @param {HTMLElement} container - The container to hide
     */
    hideSimilarTransactions(container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }

    /**
     * Handle errors in fetching similar transactions
     * @param {HTMLElement} container - The container for similar transactions
     */
    handleError(container) {
        container.innerHTML = `
            <div class="alert alert-danger mt-3">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error finding similar transactions
            </div>
        `;
        container.style.display = 'block';
    }

    /**
     * Replicate an explanation from one transaction to another
     * @param {string} sourceTransactionId - ID of the source transaction
     * @param {string} targetTransactionId - ID of the target transaction
     */
    async replicateExplanation(sourceTransactionId, targetTransactionId) {
        try {
            const response = await fetch('/analyze/replicate-explanation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: targetTransactionId,
                    similar_transaction_id: sourceTransactionId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.updateExplanationUI(targetTransactionId, data.explanation);
            } else {
                throw new Error(data.message || 'Failed to replicate explanation');
            }
        } catch (error) {
            console.error('Error replicating explanation:', error);
            this.showReplicationError(error.message);
        }
    }

    /**
     * Update the UI after replicating an explanation
     * @param {string} transactionId - ID of the transaction to update
     * @param {string} explanation - The new explanation text
     */
    updateExplanationUI(transactionId, explanation) {
        const textarea = document.querySelector(`textarea[data-transaction-id="${transactionId}"]`);
        if (textarea) {
            textarea.value = explanation;
            textarea.classList.add('has-content');
            
            // Hide the similar transactions div
            const similarTransactionsDiv = document.getElementById(`similar-transactions-${transactionId}`);
            this.hideSimilarTransactions(similarTransactionsDiv);

            // Show success message
            this.showSuccessMessage(transactionId);
        }
    }

    /**
     * Show a success message after replicating an explanation
     * @param {string} transactionId - ID of the transaction
     */
    showSuccessMessage(transactionId) {
        const textarea = document.querySelector(`textarea[data-transaction-id="${transactionId}"]`);
        const message = document.createElement('div');
        message.className = 'alert alert-success mt-2';
        message.innerHTML = '<i class="fas fa-check-circle me-2"></i>Explanation applied successfully';
        
        textarea.parentNode.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    /**
     * Show an error message when replication fails
     * @param {string} errorMessage - The error message to display
     */
    showReplicationError(errorMessage) {
        const toast = document.createElement('div');
        toast.className = 'toast position-fixed bottom-0 end-0 m-3';
        toast.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                Failed to replicate explanation: ${errorMessage}
            </div>
        `;

        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Export a singleton instance
export default new SimilarTransactionHandler();