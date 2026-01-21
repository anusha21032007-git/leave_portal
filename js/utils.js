/**
 * Utility functions for the Leave Portal application.
 */

// --- Date Utilities ---

/**
 * Formats a date string (YYYY-MM-DD) to a readable format (e.g., Jan 01, 2026).
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Calculates the number of days between two date strings (inclusive).
 * @param {string} fromDateStr - YYYY-MM-DD
 * @param {string} toDateStr - YYYY-MM-DD
 * @returns {number}
 */
export function calculateDays(fromDateStr, toDateStr) {
    if (!fromDateStr || !toDateStr) return 0;
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);

    // Reset time to midnight to ensure accurate day calculation
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(Math.abs((toDate - fromDate) / oneDay)) + 1;
    return diffDays;
}

/**
 * Gets the current date in YYYY-MM-DD format.
 * @returns {string}
 */
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// --- UI Utilities ---

/**
 * Displays a toast notification.
 * @param {string} message
 * @param {'success' | 'error' | 'info'} type
 */
export function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50 `;

    switch (type) {
        case 'success':
            toast.classList.add('bg-green-600');
            break;
        case 'error':
            toast.classList.add('bg-red-600');
            break;
        case 'info':
        default:
            toast.classList.add('bg-blue-600');
            break;
    }

    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Generates a unique request ID.
 * @returns {string}
 */
export function generateRequestId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `REQ-${timestamp}-${random}`.toUpperCase();
}

/**
 * Renders a status badge HTML string based on the status text.
 * @param {string} status
 * @returns {string} HTML string
 */
export function renderStatusBadge(status) {
    let className = 'badge-pending'; // Default
    let displayStatus = status;

    if (status.includes('Approved')) {
        className = 'badge-approved';
    } else if (status.includes('Rejected')) {
        className = 'badge-rejected';
    } else if (status.includes('Forwarded')) {
        className = 'badge-forwarded';
    }

    return `<span class="badge ${className}">${displayStatus}</span>`;
}

/**
 * Redirects the user to a specified path.
 * @param {string} path
 */
export function redirect(path) {
    window.location.href = path;
}