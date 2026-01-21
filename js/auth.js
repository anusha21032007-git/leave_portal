import { clearCurrentUser } from './storage.js';
import { showToast, redirect } from './utils.js';

/**
 * Handles user logout.
 * @param {string} redirectPath - Path to redirect to after logout.
 */
export function handleLogout(redirectPath = '../index.html') {
    clearCurrentUser();
    showToast('Logged out successfully.', 'info');
    redirect(redirectPath);
}

// Note: getCurrentUser and setCurrentUser are imported/exported via storage.js
// We keep this file simple as per user request to remove authentication logic.