/**
 * main.js
 * 
 * Main entry point for the analyze page functionality.
 * This module:
 * 1. Initializes all core modules
 * 2. Sets up global event listeners
 * 3. Coordinates module interactions
 * 4. Manages global state and form handling
 */

// Import core modules
import ExplanationHandler from './explanationHandler.js';
import AccountSuggestionHandler from './accountSuggestions.js';
import TutorialManager from './tutorial.js';
import SimilarTransactionHandler from './similarTransactions.js';
import { debounce } from './debounce.js';

/**
 * Main Application Class
 * Coordinates all module functionality and global state
 */
class AnalyzeApplication {
    /**
     * Initialize the application and its modules
     */
    constructor() {
        // Core state
        this.initialized = false;
        this.form = null;
        this.analysisSelects = null;

        // Bind methods
        this.handleFormSubmission = this.handleFormSubmission.bind(this);
        this.initializeTooltips = this.initializeTooltips.bind(this);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Application already initialized');
            return;
        }

        try {
            // Get core DOM elements
            this.form = document.getElementById('analyzeForm');
            this.analysisSelects = document.querySelectorAll('.form-select');

            if (!this.form) {
                throw new Error('Required form element not found');
            }

            // Initialize core modules
            await this.initializeCoreModules();
            
            // Set up global event listeners
            this.setupEventListeners();
            
            // Initialize Bootstrap components
            this.initializeBootstrapComponents();

            this.initialized = true;
            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Error initializing application:', error);
            this.showErrorMessage('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize all core application modules
     */
    async initializeCoreModules() {
        try {
            // These modules are self-initializing due to being singletons
            // but we keep references to them for potential future use
            this.explanationHandler = ExplanationHandler;
            this.accountSuggestionHandler = AccountSuggestionHandler;
            this.tutorialManager = TutorialManager;
            this.similarTransactionHandler = SimilarTransactionHandler;

            // Add any additional module initialization here
        } catch (error) {
            throw new Error(`Failed to initialize core modules: ${error.message}`);
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Form submission handling
        if (this.form) {
            this.form.addEventListener('submit', this.handleFormSubmission);
        }

        // Analysis select change handlers
        this.analysisSelects.forEach(select => {
            select.addEventListener('change', () => this.form.submit());
        });

        // Add global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));
    }

    /**
     * Initialize Bootstrap components
     */
    initializeBootstrapComponents() {
        // Initialize tooltips
        this.initializeTooltips();

        // Add any other Bootstrap component initialization here
    }

    /**
     * Initialize Bootstrap tooltips
     */
    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    /**
     * Handle form submission
     * @param {Event} event - The form submission event
     */
    handleFormSubmission(event) {
        // Add any pre-submission validation or data processing here
        // For now, we just let the form submit normally
    }

    /**
     * Handle global errors
     * @param {ErrorEvent} event - The error event
     */
    handleGlobalError(event) {
        console.error('Global error:', event.error);
        this.showErrorMessage('An unexpected error occurred. Please try again.');
    }

    /**
     * Show error message to user
     * @param {string} message - The error message to display
     */
    showErrorMessage(message) {
        const toastElement = document.createElement('div');
        toastElement.className = 'toast position-fixed bottom-0 end-0 m-3';
        toastElement.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        document.body.appendChild(toastElement);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Create and initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AnalyzeApplication();
    app.initialize().catch(error => {
        console.error('Failed to initialize application:', error);
    });
});

// Export the application class for potential testing or extension
export default AnalyzeApplication;