// Local Storage Utility Wrappers

export const storage = {
    /**
     * Store data in localStorage with JSON serialization
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (e) {
            console.error('Error saving to localStorage', e);
        }
    },

    /**
     * Retrieve data from localStorage with auto JSON parsing
     * @param {string} key 
     * @returns {any}
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            // Try parsing as JSON; if it fails, return the raw string
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return null;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key 
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage', e);
        }
    },

    /**
     * Clear all storage items
     */
    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Error clearing localStorage', e);
        }
    }
};
