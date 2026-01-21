import { getCurrentUser, getLeaveRequests, addLeaveRequest } from './storage.js';
import { showToast, formatDate, calculateDays, getCurrentDate, generateRequestId, renderStatusBadge, redirect } from './utils.js';

const SHORT_REQUEST_DAYS = 2;

/**
 * Renders the student dashboard content.
 */
export function renderStudentDashboard() {
    const user = getCurrentUser();
    if (!user) return; // Should be handled by sessionGuard

    document.getElementById('student-name').textContent = user.name;
    document.getElementById('student-regno').textContent = user.regNo;
    document.getElementById('student-dept').textContent = user.dept;
    document.getElementById('student-year').textContent = user.year;

    renderRequestHistory(user.regNo);
}

/**
 * Renders the student's leave request history table.
 * @param {string} regNo
 */
function renderRequestHistory(regNo) {
    const requests = getLeaveRequests().filter(req => req.studentRegNo === regNo);
    const tableBody = document.getElementById('request-history-body');
    const historyCount = document.getElementById('history-count');

    if (!tableBody) return;

    historyCount.textContent = requests.length;
    tableBody.innerHTML = '';

    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">No requests submitted yet.</td></tr>';
        return;
    }

    requests.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

    requests.forEach(req => {
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">View</td>
        `;
    });
}

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

        // Ensure the default "Select Type" option is the first one
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
 * Handles the submission of a new leave/OD request.
 * @param {Event} e
 */
export function handleApplyRequest(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
        showToast('Session expired. Please log in again.', 'error');
        return;
    }

    const requestType = document.getElementById('requestType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const reason = document.getElementById('reason').value.trim();

    // --- Validation ---
    if (!requestType || !fromDate || !toDate || !reason) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        showToast('From Date cannot be after To Date.', 'error');
        return;
    }

    const noOfDays = calculateDays(fromDate, toDate);
    if (noOfDays <= 0) {
        showToast('Invalid date range.', 'error');
        return;
    }

    // Check for duplicate requests (simple check: same type, same date range)
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
    redirect('student-dashboard.html');
}

/**
 * Initializes the Apply Request form, setting min dates and event listeners.
 */
export function initApplyRequestForm() {
    const today = getCurrentDate();
    document.getElementById('fromDate').min = today;
    document.getElementById('toDate').min = today;

    populateRequestTypes(); // Call the new function to load types

    const form = document.getElementById('apply-request-form');
    if (form) {
        form.addEventListener('submit', handleApplyRequest);
    }
}