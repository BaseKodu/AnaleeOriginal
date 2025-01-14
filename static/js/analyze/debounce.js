/**
 * debounce.js
 * 
 * A utility module that provides debouncing functionality to prevent 
 * excessive function calls, particularly useful for:
 * - Input event handlers
 * - API calls
 * - Window resize handlers
 * - Scroll event handlers
 * 
 * The debounce function ensures that your function is only called once
 * after the specified delay, no matter how many times the event is fired.
 */

/**
 * Creates a debounced version of a function that delays its execution
 * until after a specified wait time has elapsed since the last time it was called.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} [immediate=false] - Whether to call the function immediately on the leading edge
 * @returns {Function} A debounced version of the passed function
 * 
 * @example
 * // Basic usage
 * const debouncedSave = debounce(() => saveToServer(), 1000);
 * inputElement.addEventListener('input', debouncedSave);
 * 
 * @example
 * // With immediate execution
 * const debouncedUpdate = debounce(() => updateUI(), 250, true);
 * window.addEventListener('resize', debouncedUpdate);
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        // Store the current context
        const context = this;

        // The function to be executed after the debounce
        const later = () => {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };

        // Should the function be called now?
        const callNow = immediate && !timeout;

        // Clear the existing timeout
        clearTimeout(timeout);

        // Set up the new timeout
        timeout = setTimeout(later, wait);

        // If immediate is true and not already in a timeout, execute now
        if (callNow) {
            func.apply(context, args);
        }
    };
}

/**
 * Creates a throttled version of a function that limits how often it can be called.
 * Unlike debounce, throttle guarantees the function is called at regular intervals.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} A throttled version of the passed function
 * 
 * @example
 * // Throttle scroll event handler
 * const throttledScroll = throttle(() => handleScroll(), 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

// Convenience method to create a debounced function with immediate execution
export const debounceImmediate = (func, wait) => debounce(func, wait, true);

// Export an object with all utilities
export default {
    debounce,
    debounceImmediate,
    throttle
};