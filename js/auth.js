import { setCurrentUser, clearCurrentUser, getTeachers, saveTeachers, getHods, saveHods, getStudents } from './storage.js';
import { showToast, formatDate, renderStatusBadge, redirect } from './utils.js';

/**
 * Initializes the Authentication page (index.html).
 */
export function initAuthPage() {
    console.log("Initializing Auth Page...");
    const roleTabs = document.querySelectorAll('.role-tab');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authTypeContainer = document.getElementById('auth-type-container');
    const form = document.getElementById('auth-form');
    const roleInput = document.getElementById('role-input');
    const typeInput = document.getElementById('type-input');
    const formTitle = document.getElementById('form-title');
    const identityLabel = document.getElementById('identity-label');
    const identityInput = document.getElementById('identity-input');
    const nameField = document.getElementById('name-field');
    const deptField = document.getElementById('dept-field');

    // 1. Role Switching
    roleTabs.forEach(tab => {
        tab.onclick = () => {
            roleTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const role = tab.getAttribute('data-role');
            roleInput.value = role;

            // Student is LOGIN ONLY
            if (role === 'student') {
                authTypeContainer.classList.add('hidden');
                switchAuthType('login');
            } else {
                authTypeContainer.classList.remove('hidden');
            }

            updateUI(role, typeInput.value);
        };
    });

    // 2. Login/SignUp Switching
    authTabs.forEach(tab => {
        tab.onclick = () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.getAttribute('data-type');
            switchAuthType(type);
        };
    });

    function switchAuthType(type) {
        typeInput.value = type;
        updateUI(roleInput.value, type);
    }

    function updateUI(role, type) {
        const roleName = role.charAt(0).toUpperCase() + role.slice(1);
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);

        formTitle.textContent = `${roleName} ${typeName}`;
        identityLabel.textContent = 'Email Address';
        identityInput.placeholder = 'Enter your email';

        // Toggle Name and Dept for SignUp
        if (type === 'signup') {
            nameField.classList.remove('hidden');
            deptField.classList.remove('hidden');
        } else {
            nameField.classList.add('hidden');
            deptField.classList.add('hidden');
        }

        // Student never needs name/dept on index.html (added by teacher)
        if (role === 'student') {
            nameField.classList.add('hidden');
            deptField.classList.add('hidden');
        }
    }

    // 3. Form Submission
    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.type === 'signup') {
            handleSignup(data);
        } else {
            handleLogin(data.identity, data.password, data.role);
        }
    };

    // 4. Initial UI State
    updateUI(roleInput.value, typeInput.value);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Handles account creation for Teacher/HOD.
 */
function handleSignup(data) {
    const { name, identity: email, password, role, dept } = data;

    if (!name || !dept) {
        showToast('Please fill all fields for signup.', 'error');
        return;
    }

    const storageFuncs = {
        teacher: { get: getTeachers, save: saveTeachers },
        hod: { get: getHods, save: saveHods }
    };

    const funcs = storageFuncs[role];
    const users = funcs.get();

    if (users.find(u => u.email === email)) {
        showToast('User already exists. Please login.', 'error');
        return;
    }

    const newUser = { name, email, password, role, dept };
    users.push(newUser);
    funcs.save(users);

    showToast('Account created successfully!', 'success');
    loginUser(newUser);
}

/**
 * Handles user login with password verification.
 */
function handleLogin(identity, password, role) {
    let userFound = null;

    if (role === 'student') {
        const students = getStudents();
        const cleanIdentity = identity.trim().toLowerCase();
        userFound = students.find(s =>
            (s.email.toLowerCase() === cleanIdentity || s.regNo.toLowerCase() === cleanIdentity) &&
            s.password === password.trim()
        );
        if (userFound) userFound.role = 'student';
    } else {
        const users = (role === 'teacher') ? getTeachers() : getHods();
        const cleanEmail = identity.trim().toLowerCase();
        userFound = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password.trim());
    }

    if (userFound) {
        loginUser(userFound);
    } else {
        showToast('Invalid credentials or role.', 'error');
    }
}

function loginUser(user) {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');

    const paths = {
        student: 'pages/student-dashboard.html',
        teacher: 'pages/teacher-dashboard.html',
        hod: 'pages/hod-dashboard.html'
    };

    setTimeout(() => {
        redirect(paths[user.role]);
    }, 1000);
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