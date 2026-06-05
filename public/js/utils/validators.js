// Form Validation Helpers

export const validators = {
    /**
     * Test whether email string matches regular expression pattern
     * @param {string} email 
     * @returns {boolean}
     */
    isValidEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email.trim());
    },

    /**
     * Enforce password criteria (e.g. minimum 6 characters long)
     * @param {string} password 
     * @returns {boolean}
     */
    isValidPassword(password) {
        return password && password.length >= 6;
    },

    /**
     * Validate that all values in object are non-empty
     * @param {Object} data - Key-value pair object
     * @returns {string[]} - Array of missing field keys
     */
    getMissingFields(data) {
        const missing = [];
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                missing.push(key);
            }
        }
        return missing;
    }
};
