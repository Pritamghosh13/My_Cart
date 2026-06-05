// Toast Notification System

const getToastContainer = () => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
};

const showToast = (message, type = 'info', iconClass = 'fa-circle-info') => {
    // Toast notifications disabled as per user request
    return;
};

export const toast = {
    success(message) {
        showToast(message, 'success', 'fa-circle-check');
    },
    error(message) {
        showToast(message, 'error', 'fa-circle-xmark');
    },
    info(message) {
        showToast(message, 'info', 'fa-circle-info');
    }
};
