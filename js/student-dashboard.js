import { getCurrentUser } from './storage.js';
import { showToast, redirect } from './utils.js';
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
    setupThemeToggle();

    // 2. Render Default View
    renderView(currentView, user);
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
 * Sets up theme toggle functionality.
 */
function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const icon = toggleBtn.querySelector('svg');

    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.classList.add('dark');
        icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>'; // Moon icon
    } else {
        htmlEl.classList.remove('dark');
        icon.innerHTML = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>'; // Sun icon
    }

    toggleBtn.addEventListener('click', () => {
        if (htmlEl.classList.contains('dark')) {
            htmlEl.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            icon.innerHTML = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';
        } else {
            htmlEl.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';
        }
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

    // Initialize specific views (currently only profile needs dynamic rendering beyond the initial load)
    if (viewName === 'profile') {
        renderProfileSection(user); // Re-render profile details if needed
    }
    // Note: Leave/OD Request forms and Status table logic will be implemented later
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStudentDashboard);