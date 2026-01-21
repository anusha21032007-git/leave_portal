/**
 * Storage module: Handles reading and writing data to LocalStorage.
 */

const STORAGE_KEYS = {
    LEAVE_REQUESTS: 'leaveRequests',
    CURRENT_USER: 'currentUser'
};

/**
 * Retrieves all leave requests from LocalStorage.
 * @returns {Array<Object>} Array of leave request objects.
 */
export function getLeaveRequests() {
    const requestsJson = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    return requestsJson ? JSON.parse(requestsJson) : [];
}

/**
 * Saves the array of leave requests back to LocalStorage.
 * @param {Array<Object>} requests
 */
export function saveLeaveRequests(requests) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
}

/**
 * Adds a new request to LocalStorage.
 * @param {Object} newRequest
 */
export function addLeaveRequest(newRequest) {
    const requests = getLeaveRequests();
    requests.push(newRequest);
    saveLeaveRequests(requests);
}

/**
 * Retrieves the current logged-in user session.
 * @returns {Object | null}
 */
export function getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Sets the current logged-in user session.
 * @param {Object} user
 */
export function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

/**
 * Clears the current user session (Logout).
 */
export function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * Retrieves a single request by ID.
 * @param {string} requestId
 * @returns {Object | undefined}
 */
export function getRequestById(requestId) {
    const requests = getLeaveRequests();
    return requests.find(req => req.requestId === requestId);
}

/**
 * Updates a specific request in LocalStorage.
 * @param {string} requestId
 * @param {Object} updates
 * @returns {boolean} True if updated successfully.
 */
export function updateRequest(requestId, updates) {
    let requests = getLeaveRequests();
    const index = requests.findIndex(req => req.requestId === requestId);

    if (index !== -1) {
        requests[index] = { ...requests[index], ...updates };
        saveLeaveRequests(requests);
        return true;
    }
    return false;
}