/**
 * Storage module: Handles reading and writing data to LocalStorage.
 */

const STORAGE_KEYS = {
    LEAVE_REQUESTS: 'leaveRequests',
    CURRENT_USER: 'currentUser',
    STUDENTS: 'students',
    TEACHERS: 'teachers_accounts',
    HODS: 'hods_accounts'
};

/**
 * Retrieves all leave requests from LocalStorage.
 */
export function getLeaveRequests() {
    const requestsJson = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    return requestsJson ? JSON.parse(requestsJson) : [];
}

/**
 * Saves the array of leave requests back to LocalStorage.
 */
export function saveLeaveRequests(requests) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
}

/**
 * Adds a new request to LocalStorage.
 */
export function addLeaveRequest(newRequest) {
    const requests = getLeaveRequests();
    requests.push(newRequest);
    saveLeaveRequests(requests);
}

/**
 * Retrieves all students from LocalStorage.
 */
export function getStudents() {
    const studentsJson = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return studentsJson ? JSON.parse(studentsJson) : [];
}

/**
 * Saves the array of students back to LocalStorage.
 */
export function saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

/**
 * Adds a new student to LocalStorage.
 */
export function addStudent(student) {
    const students = getStudents();
    students.push(student);
    saveStudents(students);
}

/**
 * Deletes a student from LocalStorage.
 */
export function deleteStudent(regNo) {
    let students = getStudents();
    const initialLength = students.length;
    students = students.filter(s => s.regNo !== regNo);

    if (students.length < initialLength) {
        saveStudents(students);
        return true;
    }
    return false;
}

/**
 * Updates an existing student in LocalStorage.
 */
export function updateStudent(regNo, updatedData) {
    let students = getStudents();
    const index = students.findIndex(s => s.regNo === regNo);

    if (index !== -1) {
        students[index] = { ...students[index], ...updatedData };
        saveStudents(students);
        return true;
    }
    return false;
}

/**
 * Get all Teachers.
 */
export function getTeachers() {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return data ? JSON.parse(data) : [];
}

/**
 * Save Teachers.
 */
export function saveTeachers(teachers) {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
}

/**
 * Get all HODs.
 */
export function getHods() {
    const data = localStorage.getItem(STORAGE_KEYS.HODS);
    return data ? JSON.parse(data) : [];
}

/**
 * Save HODs.
 */
export function saveHods(hods) {
    localStorage.setItem(STORAGE_KEYS.HODS, JSON.stringify(hods));
}

/**
 * Retrieves the current logged-in user session.
 */
export function getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Sets the current logged-in user session.
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
 */
export function getRequestById(requestId) {
    const requests = getLeaveRequests();
    return requests.find(req => req.requestId === requestId);
}

/**
 * Updates a specific request in LocalStorage.
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