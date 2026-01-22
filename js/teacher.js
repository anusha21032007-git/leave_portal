import { getCurrentUser, setCurrentUser, getLeaveRequests, updateRequest, getStudents, addStudent, deleteStudent, updateStudent } from './storage.js';
import { showToast, formatDate, renderStatusBadge, redirect } from './utils.js';
import { handleLogout } from './auth.js';

const SHORT_REQUEST_DAYS = 2;
let currentView = 'dashboard';

/**
 * Initializes the teacher dashboard.
 */
export function renderTeacherDashboard() {
    console.log("Initializing Teacher Dashboard...");
    let user = getCurrentUser();

    // Fallback for development/testing if no user is logged in
    if (!user || user.role !== 'teacher') {
        console.warn("No teacher session found, using guest fallback.");
        user = {
            name: 'Guest Teacher',
            dept: 'CSE',
            role: 'teacher',
            email: 'teacher@college.edu'
        };
    }

    // 0. Initialize mock data if empty
    initializeMockStudents();

    // 1. Setup UI elements
    renderProfileDetails(user);
    setupNavigation(user);
    setupMobileMenu();
    setupThemeToggle();
    setupAddUserForm();
    setupEditStudentForm();
    setupProfileEditForm(user);
    setupHistoryFilter(user);

    // 2. Render Default View
    renderView(currentView, user);
}

/**
 * Renders teacher details in the sidebar and profile card.
 * @param {Object} user 
 */
function renderProfileDetails(user) {
    // Sidebar
    document.getElementById('sidebar-teacher-name').textContent = user.name;
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('sidebar-avatar-initial').textContent = initial;

    // Profile Section
    document.getElementById('profile-teacher-name').textContent = user.name;
    document.getElementById('profile-teacher-dept').textContent = user.dept;
    document.getElementById('profile-teacher-email').textContent = user.email || 'N/A';
}

/**
 * Sets up sidebar navigation and logout.
 * @param {Object} user 
 */
function setupNavigation(user) {
    const navItems = document.querySelectorAll('.sidebar-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-view');
            if (targetView) {
                renderView(targetView, user);
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                    document.getElementById('sidebar').classList.remove('open');
                    document.getElementById('backdrop').style.display = 'none';
                }
            }
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        handleLogout('../index.html');
    });
}

/**
 * Switches between different sections.
 * @param {string} viewName 
 * @param {Object} user 
 */
function renderView(viewName, user) {
    currentView = viewName;
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.sidebar-item');

    sections.forEach(s => s.classList.add('hidden'));
    navItems.forEach(i => i.classList.remove('active'));

    document.getElementById(`${viewName}-section`).classList.remove('hidden');
    document.querySelector(`.sidebar-item[data-view="${viewName}"]`).classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard Overview',
        users: 'Student Management',
        history: 'Request History',
        profile: 'Teacher Profile'
    };
    document.getElementById('main-title').textContent = titles[viewName];

    // Refresh data for the view
    if (viewName === 'dashboard') renderDashboardSummary(user);
    if (viewName === 'users') renderStudentList(user);
    if (viewName === 'history') renderHistoryUnified(user);
}

/**
 * Renders the dashboard overview - stats and pending table.
 */
function renderDashboardSummary(user) {
    const allRequests = getLeaveRequests();
    const deptRequests = allRequests.filter(r => r.dept === user.dept);

    const pending = deptRequests.filter(r => r.status === 'Pending');
    const approved = deptRequests.filter(r => r.status.includes('Approved'));
    const forwarded = deptRequests.filter(r => r.status === 'Forwarded to HOD');

    document.getElementById('total-pending-stat').textContent = pending.length;
    document.getElementById('total-approved-stat').textContent = approved.length;
    document.getElementById('total-forwarded-stat').textContent = forwarded.length;

    const tableBody = document.getElementById('pending-requests-body');
    tableBody.innerHTML = '';

    if (pending.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No pending requests requiring action.</td></tr>';
        return;
    }

    pending.sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt));

    pending.forEach(req => {
        const row = tableBody.insertRow();
        row.className = 'border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer';
        row.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                redirect(`request-details.html?id=${req.requestId}`);
            }
        };

        row.innerHTML = `
            <td class="p-4 text-sm font-medium">${req.requestId}</td>
            <td class="p-4 text-sm">${req.studentName}</td>
            <td class="p-4 text-sm">${req.requestType}</td>
            <td class="p-4 text-sm">${formatDate(req.fromDate)} - ${formatDate(req.toDate)}</td>
            <td class="p-4 text-sm">${renderStatusBadge(req.status)}</td>
            <td class="p-4 text-sm">
                <button onclick="window.location.href='request-details.html?id=${req.requestId}'" class="text-[hsl(var(--accent))] font-semibold hover:underline">Review</button>
            </td>
        `;
    });
}

/**
 * Renders the student list in the users section.
 */
function renderStudentList(user) {
    const students = getStudents();
    const tableBody = document.getElementById('student-list-body');
    const allRequests = getLeaveRequests();

    tableBody.innerHTML = '';

    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gray-500">No students added yet.</td></tr>';
        return;
    }

    students.forEach(student => {
        const studentLeaves = allRequests.filter(r =>
            (r.regNo === student.regNo || r.studentRegNo === student.regNo) &&
            r.status.includes('Approved')
        ).length;

        // Logical "Inactive" status based on year - mocking this for now
        // If year < current year, it's inactive
        const currentYear = new Date().getFullYear();
        const endYear = parseInt(student.academicYear.split('-')[1]);
        const status = (endYear < currentYear) ? 'Inactive' : 'Active';
        const badgeClass = status === 'Active' ? 'badge-approved' : 'badge-rejected';

        const row = tableBody.insertRow();
        row.className = 'border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
        row.innerHTML = `
            <td class="p-4 text-sm font-medium">${student.name}</td>
            <td class="p-4 text-sm">${student.regNo}</td>
            <td class="p-4 text-sm">${student.academicYear} / ${student.semester}</td>
            <td class="p-4 text-sm"><span class="badge ${badgeClass}">${status}</span></td>
            <td class="p-4 text-sm">
                <div class="flex flex-col">
                    <span class="text-gray-600 dark:text-gray-400 text-xs">${student.email}</span>
                    <span>${student.mobile}</span>
                </div>
            </td>
            <td class="p-4 text-sm font-bold text-red-500">${studentLeaves}</td>
            <td class="p-4 text-sm">
                <div class="flex space-x-2">
                    <button onclick="window.handleEditStudent('${student.regNo}')" class="text-blue-500 hover:text-blue-700 transition-colors">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="window.handleDeleteStudent('${student.regNo}')" class="text-gray-400 hover:text-red-500 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Sets up history status filter listener.
 */
function setupHistoryFilter(user) {
    const filter = document.getElementById('history-status-filter');
    if (filter) {
        filter.onchange = () => renderHistoryUnified(user);
    }
}

/**
 * Renders the unified history table with filtering support.
 */
function renderHistoryUnified(user) {
    const filterValue = document.getElementById('history-status-filter')?.value || 'all';
    const allRequests = getLeaveRequests().filter(r => r.dept === user.dept);

    const container = document.getElementById('unified-history-container');
    if (!container) return;

    // Filter logic
    let filteredRequests = allRequests;
    if (filterValue !== 'all') {
        filteredRequests = allRequests.filter(r => r.status === filterValue);
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-gray-500">No matching requests found in history.</div>';
        return;
    }

    // Sort by date (newest first)
    filteredRequests.sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt));

    let html = `
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th class="p-4 text-xs font-bold uppercase tracking-wider">ID</th>
                    <th class="p-4 text-xs font-bold uppercase tracking-wider">Student</th>
                    <th class="p-4 text-xs font-bold uppercase tracking-wider">Dates</th>
                    <th class="p-4 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th class="p-4 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    filteredRequests.forEach(req => {
        html += `
            <tr class="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td class="p-4 text-sm font-medium">${req.requestId}</td>
                <td class="p-4 text-sm">${req.studentName}</td>
                <td class="p-4 text-sm">${formatDate(req.fromDate)} - ${formatDate(req.toDate)}</td>
                <td class="p-4 text-sm">${renderStatusBadge(req.status)}</td>
                <td class="p-4 text-sm text-right">
                    <button onclick="window.location.href='request-details.html?id=${req.requestId}'" 
                            class="text-[hsl(var(--accent))] hover:underline font-semibold">View Details</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderMiniTable(containerId, requests) {
    const container = document.getElementById(containerId);
    if (!requests || requests.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No records found.</div>';
        return;
    }

    let html = `
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th class="p-3 text-xs font-semibold uppercase">ID</th>
                    <th class="p-3 text-xs font-semibold uppercase">Student</th>
                    <th class="p-3 text-xs font-semibold uppercase">Dates</th>
                    <th class="p-3 text-xs font-semibold uppercase">Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    requests.sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt));

    requests.forEach(req => {
        html += `
            <tr class="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td class="p-3 text-xs">${req.requestId}</td>
                <td class="p-3 text-xs font-medium">${req.studentName}</td>
                <td class="p-3 text-xs">${formatDate(req.fromDate)} - ${formatDate(req.toDate)}</td>
                <td class="p-3 text-xs">
                    <button onclick="window.location.href='request-details.html?id=${req.requestId}'" class="text-accent hover:underline font-medium">View</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Setup Edit Profile Form logic.
 */
function setupProfileEditForm(user) {
    const modal = document.getElementById('profile-modal');
    const editBtn = document.getElementById('edit-profile-btn');
    const closeBtn = document.getElementById('close-profile-modal');
    const form = document.getElementById('edit-profile-form');

    if (editBtn) {
        editBtn.onclick = () => {
            const currentUser = getCurrentUser() || user;
            document.getElementById('edit-profile-name').value = currentUser.name;
            document.getElementById('edit-profile-email').value = currentUser.email || '';
            document.getElementById('edit-profile-dept').value = currentUser.dept;
            modal.classList.remove('hidden');
        };
    }

    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const currentUser = getCurrentUser() || user;

            const updatedUser = {
                ...currentUser,
                name: formData.get('name'),
                email: formData.get('email'),
                dept: formData.get('dept')
            };

            setCurrentUser(updatedUser);
            renderProfileDetails(updatedUser);
            showToast('Profile updated successfully!', 'success');
            modal.classList.add('hidden');

            // Re-render current view to reflect dept changes if necessary
            renderView(currentView, updatedUser);
        };
    }
}

/**
 * Setup Add User Form logic.
 */
function setupAddUserForm() {
    const modal = document.getElementById('user-modal');
    const addBtn = document.getElementById('add-user-btn');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('add-user-form');

    if (addBtn) addBtn.onclick = () => modal.classList.remove('hidden');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const studentData = {
                name: formData.get('name'),
                regNo: formData.get('regNo'),
                academicYear: formData.get('year'),
                semester: formData.get('semester'),
                dept: formData.get('dept'),
                mobile: formData.get('mobile'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            addStudent(studentData);
            showToast('Student added successfully!', 'success');
            form.reset();
            modal.classList.add('hidden');
            renderStudentList(getCurrentUser());
        };
    }
}

/**
 * Setup Edit Student Form logic.
 */
function setupEditStudentForm() {
    const modal = document.getElementById('edit-user-modal');
    const closeBtn = document.getElementById('close-edit-modal');
    const form = document.getElementById('edit-user-form');

    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const oldRegNo = formData.get('oldRegNo');
            const pass = formData.get('password');

            const updatedData = {
                name: formData.get('name'),
                regNo: formData.get('regNo'),
                academicYear: formData.get('year'),
                semester: formData.get('semester'),
                dept: formData.get('dept'),
                mobile: formData.get('mobile'),
                email: formData.get('email')
            };

            if (pass && pass.trim()) {
                updatedData.password = pass;
            }

            if (updateStudent(oldRegNo, updatedData)) {
                showToast('Student updated successfully!', 'success');
                modal.classList.add('hidden');
                renderStudentList(getCurrentUser());
            } else {
                showToast('Failed to update student.', 'error');
            }
        };
    }

    // Expose handlers to window for inline onclick
    window.handleEditStudent = (regNo) => {
        const student = getStudents().find(s => s.regNo === regNo);
        if (!student) return;

        document.getElementById('edit-old-reg-no').value = student.regNo;
        document.getElementById('edit-user-name').value = student.name;
        document.getElementById('edit-user-reg-no').value = student.regNo;
        document.getElementById('edit-user-year').value = student.academicYear;
        document.getElementById('edit-user-semester').value = student.semester;
        document.getElementById('edit-user-dept').value = student.dept;
        document.getElementById('edit-user-email').value = student.email;
        document.getElementById('edit-user-mobile').value = student.mobile;
        document.getElementById('edit-user-password').value = '';

        modal.classList.remove('hidden');
    };

    window.handleDeleteStudent = (regNo) => {
        if (confirm(`Are you sure you want to delete student with Reg No: ${regNo}?`)) {
            if (deleteStudent(regNo)) {
                showToast('Student deleted successfully!', 'success');
                renderStudentList(getCurrentUser());
            } else {
                showToast('Failed to delete student.', 'error');
            }
        }
    };
}

/**
 * Mobile and Theme setup.
 */
function setupMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    const toggle = document.getElementById('menu-toggle');

    if (toggle) {
        toggle.onclick = () => {
            sidebar.classList.toggle('open');
            backdrop.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        };
    }

    if (backdrop) {
        backdrop.onclick = () => {
            sidebar.classList.remove('open');
            backdrop.style.display = 'none';
        };
    }
}

function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const applyTheme = (theme) => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', theme);

        // Update icon based on theme
        const icon = btn.querySelector('svg');
        if (icon) {
            if (theme === 'dark') {
                icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';
            } else {
                icon.innerHTML = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';
            }
        }
    };

    btn.onclick = () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
}

/**
 * Initializes mock students if the list is empty.
 */
function initializeMockStudents() {
    if (getStudents().length === 0) {
        const mockStudents = [
            {
                name: 'Anjali Sharma',
                regNo: '21CSE101',
                academicYear: '2021-2025',
                semester: 'VIII',
                dept: 'CSE',
                mobile: '9845012345',
                email: 'anjali@college.edu',
                password: 'password123'
            },
            {
                name: 'Rahul Kumar',
                regNo: '23CSE045',
                academicYear: '2023-2027',
                semester: 'IV',
                dept: 'CSE',
                mobile: '9765432109',
                email: 'rahul@college.edu',
                password: 'password123'
            },
            {
                name: 'Old Batch Student',
                regNo: '20CSE001',
                academicYear: '2020-2024',
                semester: 'Passed Out',
                dept: 'CSE',
                mobile: '9123456780',
                email: 'old@college.edu',
                password: 'password123'
            }
        ];
        localStorage.setItem('students', JSON.stringify(mockStudents));
    }
}

/**
 * Handles teacher action (Approve, Reject, Forward) on a request.
 * @param {string} requestId
 * @param {'approve' | 'reject' | 'forward'} action
 * @param {string} remark
 */
export function handleTeacherAction(requestId, action, remark) {
    console.log(`Action: ${action} on ${requestId}`);
    const user = getCurrentUser() || { name: 'Teacher', role: 'teacher' };

    if (action !== 'approve' && (!remark || !remark.trim())) {
        showToast('Remark is required for Reject or Forward actions.', 'error');
        return false;
    }

    const requests = getLeaveRequests();
    const request = requests.find(r => r.requestId === requestId);

    if (!request || (request.status !== "Pending" && request.status !== "Pending Teacher Approval")) {
        showToast('Request status is no longer pending.', 'warning');
        return false;
    }

    let newStatus;
    let toastMessage;

    if (action === 'reject') {
        newStatus = "Rejected by Teacher";
        toastMessage = 'Request rejected.';
    } else if (action === 'approve') {
        if (parseInt(request.noOfDays) > SHORT_REQUEST_DAYS) {
            showToast('Note: Approving a long-duration request directly.', 'info');
        }
        newStatus = "Approved by Teacher";
        toastMessage = 'Request approved successfully.';
    } else if (action === 'forward') {
        if (parseInt(request.noOfDays) <= SHORT_REQUEST_DAYS) {
            showToast('Short duration requests should be approved directly.', 'info');
        }
        newStatus = "Forwarded to HOD";
        toastMessage = 'Request forwarded to HOD.';
    }

    const updates = {
        status: newStatus,
        teacherRemark: remark || 'No remark',
        teacherActionDate: new Date().toISOString()
    };

    if (updateRequest(requestId, updates)) {
        showToast(toastMessage, 'success');

        // Refresh mechanism:
        // If the current page is the teacher dashboard, refresh the view
        const dashboardBtn = document.querySelector('.sidebar-item[data-view="dashboard"]');
        if (dashboardBtn) {
            renderView(currentView, user);
        } else {
            // If on details page, refresh after a short delay
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
        return true;
    }
    else {
        showToast('Failed to update request.', 'error');
        return false;
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeMockStudents();
    renderTeacherDashboard();
});