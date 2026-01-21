import { setCurrentUser, clearCurrentUser, getCurrentUser } from './storage.js';
import { showToast, redirect } from './utils.js';

const USER_DATA_PATHS = {
    student: '../data/students.json',
    teacher: '../data/teachers.json',
    hod: '../data/hod.json'
};

/**
 * Fetches user data based on role.
 * @param {'student' | 'teacher' | 'hod'} role
 * @returns {Promise<Array<Object>>}
 */
async function fetchUserData(role) {
    try {
        const response = await fetch(USER_DATA_PATHS[role]);
        if (!response.ok) {
            throw new Error(`Failed to load ${role} data.`);
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching user data:", error);
        showToast(`Authentication service error: ${error.message}`, 'error');
        return [];
    }
}

/**
 * Handles the login process for a specific role.
 * @param {string} email
 * @param {string} password
 * @param {'student' | 'teacher' | 'hod'} role
 * @param {string} dashboardPath
 */
export async function handleLogin(email, password, role, dashboardPath) {
    const users = await fetchUserData(role);
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        const sessionUser = { ...user, role: role };
        setCurrentUser(sessionUser);
        showToast(`Welcome, ${user.name}!`, 'success');
        redirect(dashboardPath);
    } else {
        showToast('Invalid email or password.', 'error');
    }
}

/**
 * Checks if a user is logged in and redirects if not.
 * @param {string | null} requiredRole - The role required for the page. If null, any logged-in user is allowed.
 * @param {string} loginPath - Path to redirect to if not logged in.
 */
export function sessionGuard(requiredRole, loginPath) {
    const user = getCurrentUser();
    if (!user || (requiredRole && user.role !== requiredRole)) {
        showToast('Please log in to access this page.', 'error');
        redirect(loginPath);
        return false;
    }
    return user;
}

/**
 * Handles user logout.
 * @param {string} redirectPath - Path to redirect to after logout.
 */
export function handleLogout(redirectPath = '../index.html') {
    clearCurrentUser();
    showToast('Logged out successfully.', 'info');
    redirect(redirectPath);
}