import { getCurrentUser, setCurrentUser, getLeaveRequests, updateRequest } from './storage.js';
import { showToast, formatDate, renderStatusBadge, redirect } from './utils.js';
import { handleLogout } from './auth.js';

let currentView = 'dashboard';

/**
 * Initializes the HOD dashboard.
 */
export function renderHodDashboard() {
    console.log("Initializing HOD Dashboard...");
    let user = getCurrentUser();

    // Fallback for development/testing
    if (!user || user.role !== 'hod') {
        console.warn("No HOD session found, using guest fallback.");
        user = {
            name: 'Kanimozhi (Guest)',
            dept: 'CSE-CYBER SECURITY',
            role: 'hod',
            email: 'hod.cse@college.edu'
        };
    }

    // 1. Setup UI elements
    renderProfileDetails(user);
    setupNavigation(user);
    setupMobileMenu();
    setupThemeToggle();
    setupProfileEditForm(user);
    setupHistoryFilter(user);

    // 2. Render Default View
    renderView(currentView, user);
}

/**
 * Renders HOD details in sidebar and profile.
 */
function renderProfileDetails(user) {
    // Sidebar
    document.getElementById('sidebar-hod-name').textContent = user.name;
    const initial = user.name.charAt(0).toUpperCase();
    document.getElementById('sidebar-avatar-initial').textContent = initial;

    // Welcome Banner
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) welcomeName.textContent = user.name;

    // Profile Section
    const profileName = document.getElementById('profile-hod-name');
    if (profileName) {
        profileName.textContent = user.name;
        document.getElementById('profile-hod-dept').textContent = user.dept;
        document.getElementById('profile-hod-email').textContent = user.email || 'N/A';
        document.getElementById('footer-dept').textContent = user.dept;
    }
}

/**
 * Sets up sidebar navigation.
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
 */
function renderView(viewName, user) {
    currentView = viewName;
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.sidebar-item');

    sections.forEach(s => s.classList.add('hidden'));
    navItems.forEach(i => i.classList.remove('active'));

    document.getElementById(`${viewName}-section`).classList.remove('hidden');
    const activeNav = document.querySelector(`.sidebar-item[data-view="${viewName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard Overview',
        history: 'Request History',
        profile: 'HOD Profile'
    };
    document.getElementById('main-title').textContent = titles[viewName];

    // Refresh data
    if (viewName === 'dashboard') renderDashboardSummary(user);
    if (viewName === 'history') renderHistoryUnified(user);
}

/**
 * Renders dashboard overview stats and forwarded requests.
 */
function renderDashboardSummary(user) {
    const allRequests = getLeaveRequests();
    const deptRequests = allRequests.filter(r => r.dept === user.dept);

    const pendingAction = deptRequests.filter(r => r.status === 'Forwarded to HOD');
    const approvedByMe = deptRequests.filter(r => r.status === 'Approved by HOD');
    const rejectedByMe = deptRequests.filter(r => r.status === 'Rejected by HOD');

    // Update Stats
    document.getElementById('total-pending-stat').textContent = pendingAction.length;
    document.getElementById('total-approved-stat').textContent = approvedByMe.length;
    document.getElementById('total-forwarded-stat').textContent = rejectedByMe.length; // Use this for rejected

    // Update Banner Badge if exists
    const badge = document.getElementById('pending-count-badge');
    if (badge) badge.textContent = pendingAction.length;

    const tableBody = document.getElementById('forwarded-requests-body');
    tableBody.innerHTML = '';

    if (pendingAction.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500 italic">Excellent! All forwarded requests have been processed.</td></tr>';
        return;
    }

    pendingAction.sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt));

    pendingAction.forEach(req => {
        const row = tableBody.insertRow();
        row.className = 'border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer';
        row.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                redirect(`request-details.html?id=${req.requestId}`);
            }
        };

        row.innerHTML = `
            <td class="p-4 text-sm font-medium">${req.requestId}</td>
            <td class="p-4 text-sm font-semibold">${req.studentName}</td>
            <td class="p-4 text-sm">${req.requestType}</td>
            <td class="p-4 text-sm">${req.noOfDays} Days</td>
            <td class="p-4 text-sm">${formatDate(req.appliedDate || req.appliedAt)}</td>
            <td class="p-4 text-sm text-right">
                <button class="px-4 py-1.5 bg-[hsl(var(--primary))] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                    Review
                </button>
            </td>
        `;
    });
}

/**
 * Sets up history status filter.
 */
function setupHistoryFilter(user) {
    const filter = document.getElementById('history-status-filter');
    if (filter) {
        filter.onchange = () => renderHistoryUnified(user);
    }
}

/**
 * Renders unified history table for HOD.
 */
function renderHistoryUnified(user) {
    const filterValue = document.getElementById('history-status-filter')?.value || 'all';
    const allRequests = getLeaveRequests().filter(r => r.dept === user.dept);

    // HOD should only see requests that are either Forwarded to HOD, Approved by HOD, or Rejected by HOD
    // They should NOT see initial "Pending" requests that are still with the teacher.
    const hodRelevantRequests = allRequests.filter(r =>
        r.status === 'Forwarded to HOD' ||
        r.status === 'Approved by HOD' ||
        r.status === 'Rejected by HOD'
    );

    const container = document.getElementById('unified-history-container');
    if (!container) return;

    let filtered = hodRelevantRequests;
    if (filterValue !== 'all') {
        filtered = hodRelevantRequests.filter(r => r.status === filterValue);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-gray-500 italic">No matching HOD-level requests found in history.</div>';
        return;
    }

    filtered.sort((a, b) => new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt));

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

    filtered.forEach(req => {
        html += `
            <tr class="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <td class="p-4 text-sm font-medium">${req.requestId}</td>
                <td class="p-4 text-sm">${req.studentName}</td>
                <td class="p-4 text-sm">${formatDate(req.fromDate)} - ${formatDate(req.toDate)}</td>
                <td class="p-4 text-sm">${renderStatusBadge(req.status)}</td>
                <td class="p-4 text-sm text-right">
                    <button onclick="window.location.href='request-details.html?id=${req.requestId}'" 
                            class="text-[hsl(var(--accent))] hover:underline font-semibold">View</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Setup Profile Editing for HOD.
 */
function setupProfileEditForm(user) {
    const modal = document.getElementById('profile-modal');
    const editBtn = document.getElementById('edit-profile-btn');
    const closeBtn = document.getElementById('close-profile-modal');
    const form = document.getElementById('edit-profile-form');

    if (editBtn) {
        editBtn.onclick = () => {
            const current = getCurrentUser() || user;
            document.getElementById('edit-profile-name').value = current.name;
            document.getElementById('edit-profile-email').value = current.email || '';
            document.getElementById('edit-profile-dept').value = current.dept;
            modal.classList.remove('hidden');
        };
    }

    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const current = getCurrentUser() || user;

            const updated = {
                ...current,
                name: formData.get('name'),
                email: formData.get('email'),
                dept: formData.get('dept')
            };

            setCurrentUser(updated);
            renderProfileDetails(updated);
            showToast('Profile updated successfully!', 'success');
            modal.classList.add('hidden');
            renderView(currentView, updated);
        };
    }
}

/**
 * Mobile navigation utils.
 */
function setupMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            backdrop.style.display = 'block';
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebar.classList.remove('active'); // just in case
            backdrop.style.display = 'none';
        });
    }
}

function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');

    // Initial State
    if (document.documentElement.classList.contains('dark')) {
        icon.setAttribute('data-lucide', 'sun');
    }

    if (toggle) {
        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // Re-render icon
            icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Handles HOD action (Approve or Reject) on a request.
 */
export function handleHodAction(requestId, action, remark) {
    const user = getCurrentUser() || { name: 'HOD', role: 'hod' };

    if (action === 'reject' && (!remark || !remark.trim())) {
        showToast('Remark is required for Reject action.', 'error');
        return false;
    }

    const request = getLeaveRequests().find(r => r.requestId === requestId);
    if (!request || request.status !== "Forwarded to HOD") {
        showToast('Request status is no longer pending HOD approval.', 'error');
        return false;
    }

    const updates = {
        status: action === 'reject' ? "Rejected by HOD" : "Approved by HOD",
        hodRemark: remark || 'No remark provided.',
        hodActionDate: new Date().toISOString()
    };

    if (updateRequest(requestId, updates)) {
        showToast(`Request ${action === 'reject' ? 'rejected' : 'approved'} successfully!`, 'success');

        // Success mechanism
        const dashboardBtn = document.querySelector('.sidebar-item[data-view="dashboard"]');
        if (dashboardBtn) {
            renderView(currentView, user);
        } else {
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
        return true;
    }
    return false;
}