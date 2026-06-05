// Global Loading Overlay Controller

export const loader = {
    /**
     * Show the global loading spinner overlay
     */
    show() {
        const overlay = document.getElementById('loader');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    },

    /**
     * Hide the global loading spinner overlay
     */
    hide() {
        const overlay = document.getElementById('loader');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
};
