import { getCurrentUser, getLeaveRequests, updateRequest } from './storage.js';
import { showToast, formatDate, renderStatusBadge, redirect } from './utils.js';

const SHORT_REQUEST_DAYS = 2;

/**
 * Renders the teacher dashboard content.
 */
export function renderTeacherDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById('teacher-name').textContent = user.name;
    document.getElementById('teacher-dept').textContent = user.dept;

    renderPendingRequests(user.dept);
}

/**
 * Renders the list of pending requests for the teacher's department.
 * @param {string} dept
 */
export function renderPendingRequests(dept) {
    const allRequests = getLeaveRequests();
    const pendingRequests = allRequests.filter(req => 
        req.dept === dept && 
        req.status === "Pending Teacher Approval"
    );

    const tableBody = document.getElementById('pending-requests-body');
    const pendingCount = document.getElementById('pending-count');

    if (!tableBody) return;

    pendingCount.textContent = pendingRequests.length;
    tableBody.innerHTML = '';

    if (pendingRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">No pending requests requiring your action.</td></tr>';
        return;
    }

    pendingRequests.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());

    pendingRequests.forEach(req => {
        const row = tableBody.insertRow();
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer';
        row.onclick = () => redirect(`request-details.html?id=${req.requestId}`);

        const actionType = req.noOfDays <= SHORT_REQUEST_DAYS ? 'Approve/Reject' : 'Forward/Reject';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${req.requestId}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${req.studentName} (${req.studentRegNo})</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${req.requestType}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${req.noOfDays} days</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${formatDate(req.appliedDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${renderStatusBadge(req.status)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 font-semibold">${actionType}</td>
        `;
    });
}

/**
 * Handles teacher action (Approve, Reject, Forward) on a request.
 * This function is called from request-details.html.
 * @param {string} requestId
 * @param {'approve' | 'reject' | 'forward'} action
 * @param {string} remark
 */
export function handleTeacherAction(requestId, action, remark) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Session expired.', 'error');
        return false;
    }

    if (action !== 'approve' && !remark.trim()) {
        showToast('Remark is required for Reject or Forward actions.', 'error');
        return false;
    }

    const request = getLeaveRequests().find(r => r.requestId === requestId);
    if (!request || request.status !== "Pending Teacher Approval") {
        showToast('Request status is no longer pending teacher approval.', 'error');
        return false;
    }

    let newStatus;
    let toastMessage;

    if (action === 'reject') {
        newStatus = "Rejected by Teacher";
        toastMessage = 'Request rejected.';
    } else if (action === 'approve') {
        if (request.noOfDays > SHORT_REQUEST_DAYS) {
            showToast('Cannot approve long requests directly. Must forward to HOD.', 'error');
            return false;
        }
        newStatus = "Approved by Teacher";
        toastMessage = 'Request approved.';
    } else if (action === 'forward') {
        if (request.noOfDays <= SHORT_REQUEST_DAYS) {
            showToast('Short requests should be approved/rejected directly, not forwarded.', 'error');
            return false;
        }
        newStatus = "Forwarded to HOD";
        toastMessage = 'Request forwarded to HOD.';
    } else {
        showToast('Invalid action.', 'error');
        return false;
    }

    const updates = {
        status: newStatus,
        teacherRemark: remark,
        teacherActionDate: getCurrentDate()
    };

    if (updateRequest(requestId, updates)) {
        showToast(toastMessage, 'success');
        redirect('teacher-dashboard.html');
        return true;
    } else {
        showToast('Failed to update request.', 'error');
        return false;
    }
}