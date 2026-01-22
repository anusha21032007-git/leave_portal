import { getCurrentUser, addLeaveRequest, getLeaveRequests } from './storage.js';
import { showToast, redirect, formatDate, calculateDays, renderStatusBadge } from './utils.js';
import { handleLogout } from './auth.js';

let currentView = 'dashboard'; // Tracks the current main content view

/**
 * Mock/Fallback User Data (Augmented for new profile fields)
 */
function getMockUser() {
    const user = getCurrentUser();
    if (user && user.role === 'student') {
        // If a user is logged in, ensure new fields have defaults if missing
        return {
            ...user,
            semester: user.semester || 'VI',
            mobile: user.mobile || '98765 43210',
            tutor: user.tutor || 'Mr. Karthik S',
            leavesTaken: user.leavesTaken || 3,
            status: 'Active'
        };
    }

    // Guest/Fallback user
    return {
        role: 'student',
        name: 'Guest Student',
        regNo: 'N/A',
        dept: 'CSE',
        year: '3rd Year',
        email: 'guest@portal.edu',
        semester: 'N/A',
        mobile: 'N/A',
        tutor: 'N/A',
        leavesTaken: 0,
        status: 'Inactive'
    };
}

/**
 * Initializes the student dashboard.
 */
export function initStudentDashboard() {
    const user = getMockUser();

    // 1. Setup UI elements
    renderProfileSection(user);
    setupNavigation(user);
    setupMobileMenu();

    // 2. Render Default View
    renderView(currentView, user);

    // 3. Initialize Forms
    initForms(user);
}

/**
 * Initializes form submission listeners.
 * @param {Object} user 
 */
function initForms(user) {
    const leaveForm = document.getElementById('leave-form');
    const odForm = document.getElementById('od-form');
    const today = new Date().toISOString().split('T')[0];

    if (leaveForm) {
        leaveForm.addEventListener('submit', (e) => handleFormSubmit(e, 'Leave', user));

        // Automatic day calculation for Leave
        const fromDateInput = document.getElementById('leaveFromDate');
        const toDateInput = document.getElementById('leaveToDate');
        const daysDisplay = document.getElementById('leaveDays');

        // Set min date to today
        fromDateInput.min = today;
        toDateInput.min = today;

        const updateLeaveDays = () => {
            if (fromDateInput.value && toDateInput.value) {
                const days = calculateDays(fromDateInput.value, toDateInput.value);
                daysDisplay.value = days > 0 ? days : 0;
            }
        };

        fromDateInput.addEventListener('change', updateLeaveDays);
        toDateInput.addEventListener('change', updateLeaveDays);
    }

    if (odForm) {
        odForm.addEventListener('submit', (e) => handleFormSubmit(e, 'OD', user));

        // Automatic day calculation for OD
        const fromDateInput = document.getElementById('odFromDate');
        const toDateInput = document.getElementById('odToDate');
        const durationDisplay = document.getElementById('odDuration');

        // Set min date to today
        fromDateInput.min = today;
        toDateInput.min = today;

        const updateODDuration = () => {
            if (fromDateInput.value && toDateInput.value) {
                const days = calculateDays(fromDateInput.value, toDateInput.value);
                durationDisplay.value = days > 0 ? days : 0;
            }
        };

        fromDateInput.addEventListener('change', updateODDuration);
        toDateInput.addEventListener('change', updateODDuration);
    }
}

/**
 * Handles form submission for both Leave and OD.
 * @param {Event} e 
 * @param {string} type 
 * @param {Object} user 
 */
function handleFormSubmit(e, type, user) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const requestData = {
        requestId: `REQ-${Date.now()}`,
        studentName: user.name,
        studentRegNo: user.regNo,
        requestType: type,
        subject: formData.get('subject'),
        fromDate: formData.get('fromDate'),
        toDate: formData.get('toDate'),
        noOfDays: formData.get('numDays'),
        reason: formData.get('reason'),
        status: 'Pending',
        appliedDate: new Date().toISOString(),
        dept: user.dept || 'CSE'
    };

    try {
        addLeaveRequest(requestData);
        showToast(`${type} request submitted successfully!`, 'success');
        form.reset();

        // Switch to status view to see the new request
        setTimeout(() => {
            renderView('status', user);
        }, 1500);
    } catch (error) {
        console.error('Error submitting request:', error);
        showToast('Failed to submit request. Please try again.', 'error');
    }
}

/**
 * Renders user details in the sidebar and profile card.
 * @param {Object} user
 */
function renderProfileSection(user) {
    // Sidebar Name
    document.getElementById('sidebar-student-name').textContent = user.name;

    // Profile Card
    document.getElementById('profile-card-name').textContent = user.name;
    document.getElementById('profile-card-regno').textContent = user.regNo;
    document.getElementById('profile-card-year').textContent = user.year;
    document.getElementById('profile-card-semester').textContent = user.semester;
    document.getElementById('profile-card-email').textContent = user.email;
    document.getElementById('profile-card-mobile').textContent = user.mobile;
    document.getElementById('profile-card-tutor').textContent = user.tutor;
    document.getElementById('profile-card-leaves-taken').textContent = user.leavesTaken;

    // Status Badge
    const statusBadgeEl = document.getElementById('profile-card-status');
    statusBadgeEl.textContent = user.status;
    if (user.status === 'Active') {
        statusBadgeEl.className = 'badge badge-approved';
    } else {
        statusBadgeEl.className = 'badge badge-pending';
    }

    // Avatar Initial
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('sidebar-avatar-initial').textContent = initial;
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

    // Setup Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        handleLogout('../index.html');
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
 * @param {string} viewName - 'dashboard', 'leave-request', 'od-request', 'status', 'profile'
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

    // Update main title
    const titleMap = {
        'dashboard': 'Dashboard Overview',
        'leave-request': 'Apply for Leave',
        'od-request': 'Apply for On Duty (OD)',
        'status': 'Request Status History',
        'profile': 'Student Profile Details'
    };
    document.getElementById('main-title').textContent = titleMap[viewName] || 'Portal';

    // Initialize specific views
    if (viewName === 'dashboard') {
        renderDashboardOverview(user);
    } else if (viewName === 'profile') {
        renderProfileSection(user); // Re-render profile details if needed
    } else if (viewName === 'status') {
        renderRequestHistory(user);
    }
}

/**
 * Renders the student's request history in a table.
 * @param {Object} user 
 * @param {string} filter - The status filter to apply ('all', 'Approved by HOD', 'Pending', 'Rejected')
 */
function renderRequestHistory(user, filter = 'all') {
    const statusSection = document.getElementById('status-section');
    const historyContainer = document.getElementById('history-container');
    const filterSelect = document.getElementById('status-filter');

    // Setup filter event listener only once
    if (filterSelect && !filterSelect.dataset.listenerAdded) {
        filterSelect.addEventListener('change', (e) => {
            renderRequestHistory(user, e.target.value);
        });
        filterSelect.dataset.listenerAdded = 'true';
    }

    let requests = getStudentRequests(user.regNo);

    // Apply filtering
    if (filter !== 'all') {
        if (filter === 'Pending') {
            requests = requests.filter(r => r.status === 'Pending' || r.status === 'Forwarded to HOD');
        } else if (filter === 'Rejected') {
            requests = requests.filter(r => r.status.includes('Rejected'));
        } else {
            requests = requests.filter(r => r.status === filter);
        }
    }

    // Sort by appliedDate descending
    requests.sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt));

    if (requests.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center py-10">
                <p class="text-gray-500">No ${filter !== 'all' ? filter.toLowerCase() : ''} requests found.</p>
                ${filter === 'all' ? '<button onclick="document.querySelector(\'.sidebar-item[data-view=\\\'leave-request\\\']\').click()" class="btn-primary mt-4 px-6 py-2">Submit Your First Request</button>' : ''}
            </div>
        `;
        return;
    }

    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <th class="p-4 font-semibold text-sm">Request ID</th>
                        <th class="p-4 font-semibold text-sm">Type</th>
                        <th class="p-4 font-semibold text-sm">Subject</th>
                        <th class="p-4 font-semibold text-sm">Dates</th>
                        <th class="p-4 font-semibold text-sm">Days</th>
                        <th class="p-4 font-semibold text-sm">Status</th>
                        <th class="p-4 font-semibold text-sm">Action</th>
                    </tr>
                </thead>
                <tbody>
    `;

    requests.forEach(req => {
        const days = req.noOfDays || calculateDays(req.fromDate, req.toDate);
        tableHtml += `
            <tr class="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="p-4 text-sm font-medium">${req.requestId}</td>
                <td class="p-4 text-sm">
                    <span class="inline-flex items-center">
                        ${req.requestType === 'Leave' ? '<i data-lucide="calendar-minus" class="w-4 h-4 mr-2 text-blue-500"></i>' : '<i data-lucide="briefcase" class="w-4 h-4 mr-2 text-purple-500"></i>'}
                        ${req.requestType}
                    </span>
                </td>
                <td class="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">${req.subject || 'N/A'}</td>
                <td class="p-4 text-sm">${formatDate(req.fromDate)} - ${formatDate(req.toDate)}</td>
                <td class="p-4 text-sm">${days} Day(s)</td>
                <td class="p-4 text-sm">${renderStatusBadge(req.status)}</td>
                <td class="p-4 text-sm">
                    <button onclick="window.location.href='request-details.html?id=${req.requestId}'" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">View Details</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    historyContainer.innerHTML = tableHtml;

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Renders the dashboard overview with real stats.
 * @param {Object} user 
 */
function renderDashboardOverview(user) {
    const requests = getStudentRequests(user.regNo);

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending' || r.status === 'Forwarded to HOD').length,
        approved: requests.filter(r => r.status === 'Approved by HOD').length,
        rejected: requests.filter(r => r.status === 'Rejected by HOD' || r.status === 'Rejected by Teacher').length
    };

    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-approved').textContent = stats.approved;
    document.getElementById('stat-rejected').textContent = stats.rejected;

    // 2. Update Recent Requests Table
    const tableBody = document.getElementById('recent-requests-body');
    if (!tableBody) return;

    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400 italic font-medium">No recent requests found. Start by applying for leave or OD!</td></tr>';
        return;
    }

    // Sort by date and take top 5
    const latest = [...requests]
        .sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt))
        .slice(0, 5);

    tableBody.innerHTML = latest.map(req => `
        <tr class="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" 
            onclick="window.location.href='request-details.html?id=${req.requestId}'">
            <td class="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">#${req.requestId.split('-')[1] || req.requestId}</td>
            <td class="p-4">
                <div class="flex items-center">
                    <span class="p-1.5 rounded-lg mr-2 ${req.requestType === 'Leave' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}">
                        <i data-lucide="${req.requestType === 'Leave' ? 'calendar-minus' : 'briefcase'}" class="w-3 h-3"></i>
                    </span>
                    <span class="text-sm font-semibold">${req.requestType}</span>
                </div>
            </td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${formatDate(req.fromDate)}</td>
            <td class="p-4">${renderStatusBadge(req.status)}</td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Returns requests associated with a student Reg No.
 * Robust to both 'studentRegNo' and 'regNo' field names.
 */
function getStudentRequests(regNo) {
    if (!regNo) return [];
    return getLeaveRequests().filter(req =>
        req.studentRegNo === regNo || req.regNo === regNo
    );
}

// Initialize on load if we are on the student dashboard
if (document.getElementById('sidebar-student-name')) {
    document.addEventListener('DOMContentLoaded', initStudentDashboard);
}