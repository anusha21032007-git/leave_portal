import { getCurrentUser, getLeaveRequests, addLeaveRequest } from './storage.js';
import { showToast, formatDate, calculateDays, getCurrentDate, generateRequestId, renderStatusBadge, redirect } from './utils.js';
import { handleLogout } from './auth.js';

const SHORT_REQUEST_DAYS = 2;
let currentView = 'dashboard'; // Tracks the current main content view

/**
 * Initializes the student dashboard: loads user, sets up navigation, and renders the default view.
 */
export function initStudentDashboard() {
    const user = getCurrentUser() || { 
        role: 'student', 
        name: 'Guest Student', 
        regNo: 'N/A', 
        dept: 'N/A', 
        year: 'N/A', 
        email: 'guest@portal.edu' 
    };

    // 1. Render Profile and User Info
    renderProfileSection(user);
    
    // 2. Setup Navigation
    setupNavigation(user);

    // 3. Setup Mobile Menu Toggle
    setupMobileMenu();

    // 4. Render Default View
    renderView(currentView, user);
}

/**
 * Renders the user's profile details in the top right and the profile dropdown.
 * @param {Object} user
 */
function renderProfileSection(user) {
    document.getElementById('profile-name-nav').textContent = user.name.split(' ')[0];
    
    // Populate Profile Dropdown Details
    document.getElementById('profile-detail-name').textContent = user.name;
    document.getElementById('profile-detail-regno').textContent = user.regNo;
    document.getElementById('profile-detail-dept').textContent = user.dept;
    document.getElementById('profile-detail-year').textContent = user.year;
    document.getElementById('profile-detail-email').textContent = user.email;

    // Setup Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        handleLogout('../index.html');
    });
}

/**
 * Sets up event listeners for sidebar navigation.
 * @param {Object} user
 */
function setupNavigation(user) {
    const navItems = document.querySelectorAll('.sidebar-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-view');
            if (targetView) {
                renderView(targetView, user);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 1024) {
                    document.getElementById('sidebar').classList.remove('open');
                    document.getElementById('backdrop').style.display = 'none';
                }
            }
        });
    });

    // Setup Profile Dropdown Toggle
    const profileToggle = document.getElementById('profile-toggle');
    const profileMenu = document.getElementById('profile-dropdown-menu');
    profileToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing immediately if click originated from toggle
        profileMenu.classList.toggle('hidden');
    });
    // Close dropdown if clicked outside
    document.addEventListener('click', (e) => {
        if (!profileToggle.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.add('hidden');
        }
    });
}

/**
 * Sets up mobile menu toggle functionality.
 */
function setupMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    
    document.getElementById('menu-toggle').addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    });

    backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.style.display = 'none';
    });
}

/**
 * Switches the main content view based on the selected navigation item.
 * @param {string} viewName - 'dashboard', 'apply', or 'history'
 * @param {Object} user
 */
function renderView(viewName, user) {
    currentView = viewName;
    const contentSections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.sidebar-item');

    contentSections.forEach(section => {
        section.classList.add('hidden');
    });
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    document.getElementById(`${viewName}-section`).classList.remove('hidden');
    document.querySelector(`.sidebar-item[data-view="${viewName}"]`).classList.add('active');
    document.getElementById('main-title').textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1).replace('-', ' ');

    if (viewName === 'dashboard') {
        renderDashboardSummary(user);
    } else if (viewName === 'apply') {
        initApplyRequestForm(user);
    } else if (viewName === 'history') {
        initRequestHistory(user.regNo);
    }
}

// --- Dashboard Summary View ---

function renderDashboardSummary(user) {
    // Display basic profile info in the summary card
    document.getElementById('summary-student-name').textContent = user.name;
    document.getElementById('summary-student-regno').textContent = user.regNo;
    document.getElementById('summary-student-dept').textContent = user.dept;
    document.getElementById('summary-student-year').textContent = user.year;

    // Calculate request counts
    const requests = user.regNo !== 'N/A' ? getLeaveRequests().filter(req => req.studentRegNo === user.regNo) : [];
    const pendingCount = requests.filter(req => req.status.includes('Pending') || req.status.includes('Forwarded')).length;
    const approvedCount = requests.filter(req => req.status.includes('Approved')).length;
    const rejectedCount = requests.filter(req => req.status.includes('Rejected')).length;

    document.getElementById('stat-total').textContent = requests.length;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-approved').textContent = approvedCount;
    document.getElementById('stat-rejected').textContent = rejectedCount;
}


// --- Apply Request View ---

/**
 * Fetches leave types and populates the dropdown.
 */
async function populateRequestTypes() {
    const selectEl = document.getElementById('requestType');
    if (!selectEl) return;

    try {
        const response = await fetch('../data/leaveTypes.json');
        if (!response.ok) throw new Error('Failed to load leave types.');
        const leaveTypes = await response.json();

        selectEl.innerHTML = '<option value="">Select Type</option>';

        leaveTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name;
            selectEl.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading leave types:", error);
        showToast('Could not load request types.', 'error');
    }
}

/**
 * Initializes the Apply Request form, setting min dates and event listeners.
 * @param {Object} user
 */
export function initApplyRequestForm(user) {
    const today = getCurrentDate();
    const fromDateEl = document.getElementById('fromDate');
    const toDateEl = document.getElementById('toDate');
    const daysEl = document.getElementById('noOfDays');
    const form = document.getElementById('apply-request-form');

    if (fromDateEl) fromDateEl.min = today;
    if (toDateEl) toDateEl.min = today;
    daysEl.textContent = '0'; // Reset days count

    populateRequestTypes();

    // Date change listener to calculate days
    const calculateAndDisplayDays = () => {
        const fromDate = fromDateEl.value;
        const toDate = toDateEl.value;
        if (fromDate && toDate && new Date(fromDate) <= new Date(toDate)) {
            daysEl.textContent = calculateDays(fromDate, toDate);
        } else {
            daysEl.textContent = '0';
        }
    };

    fromDateEl.onchange = calculateAndDisplayDays;
    toDateEl.onchange = calculateAndDisplayDays;

    // Remove previous listener to prevent duplicates
    form.removeEventListener('submit', (e) => handleApplyRequest(e, user));
    // Add new listener
    form.onsubmit = (e) => handleApplyRequest(e, user);
}

/**
 * Handles the submission of a new leave/OD request.
 * @param {Event} e
 * @param {Object} user
 */
function handleApplyRequest(e, user) {
    e.preventDefault();

    if (user.regNo === 'N/A') {
        showToast('Cannot submit request as a Guest. Please log in.', 'error');
        return;
    }

    const requestType = document.getElementById('requestType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const reason = document.getElementById('reason').value.trim();
    const noOfDays = parseInt(document.getElementById('noOfDays').textContent);

    // --- Validation ---
    if (!requestType || !fromDate || !toDate || !reason) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        showToast('From Date cannot be after To Date.', 'error');
        return;
    }

    if (noOfDays <= 0) {
        showToast('Invalid date range.', 'error');
        return;
    }

    // Check for duplicate requests
    const existingRequests = getLeaveRequests().filter(req => 
        req.studentRegNo === user.regNo && 
        req.requestType === requestType &&
        req.fromDate === fromDate &&
        req.toDate === toDate &&
        (req.status !== 'Rejected by Teacher' && req.status !== 'Rejected by HOD')
    );

    if (existingRequests.length > 0) {
        showToast('A similar pending or approved request already exists for this date range.', 'error');
        return;
    }
    // --- End Validation ---

    const newRequest = {
        requestId: generateRequestId(),
        studentRegNo: user.regNo,
        studentName: user.name,
        studentEmail: user.email,
        dept: user.dept,
        requestType: requestType,
        fromDate: fromDate,
        toDate: toDate,
        noOfDays: noOfDays,
        reason: reason,
        appliedDate: getCurrentDate(),
        status: "Pending Teacher Approval",
        teacherRemark: "",
        hodRemark: "",
        teacherActionDate: "",
        hodActionDate: ""
    };

    addLeaveRequest(newRequest);
    showToast('Request submitted successfully!', 'success');
    
    // Clear form and switch to history view
    e.target.reset();
    document.getElementById('noOfDays').textContent = '0';
    renderView('history', user);
}

// --- Request History View ---

let allRequests = [];

/**
 * Initializes the request history view, loads data, and sets up filters.
 * @param {string} regNo
 */
function initRequestHistory(regNo) {
    allRequests = regNo !== 'N/A' ? getLeaveRequests().filter(req => req.studentRegNo === regNo) : [];
    
    // Setup event listeners for search and filter
    document.getElementById('history-search').oninput = applyFilters;
    document.getElementById('status-filter').onchange = applyFilters;
    
    applyFilters();
}

/**
 * Applies search and status filters to the request list and renders the table.
 */
function applyFilters() {
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const tableBody = document.getElementById('request-history-body');
    const historyCount = document.getElementById('history-count');

    let filteredRequests = allRequests;

    // 1. Status Filter
    if (statusFilter) {
        filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
    }

    // 2. Search Filter (by ID or Type)
    if (searchTerm) {
        filteredRequests = filteredRequests.filter(req => 
            req.requestId.toLowerCase().includes(searchTerm) ||
            req.requestType.toLowerCase().includes(searchTerm)
        );
    }

    // Sort by applied date (newest first)
    filteredRequests.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

    historyCount.textContent = filteredRequests.length;
    tableBody.innerHTML = '';

    if (filteredRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">No matching requests found.</td></tr>';
        return;
    }

    filteredRequests.forEach(req => {
        const row = tableBody.insertRow();
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer';
        row.onclick = () => redirect(`request-details.html?id=${req.requestId}`);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${req.requestId}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${req.requestType}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${formatDate(req.fromDate)} - ${formatDate(req.toDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${req.noOfDays}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${formatDate(req.appliedDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${renderStatusBadge(req.status)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 font-semibold">View</td>
        `;
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStudentDashboard);