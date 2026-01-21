import { getCurrentUser, getLeaveRequests, updateRequest } from './storage.js';
import { showToast, formatDate, renderStatusBadge, redirect } from './utils.js';

/**
 * Renders the HOD dashboard content.
 */
export function renderHodDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById('hod-name').textContent = user.name;
    document.getElementById('hod-dept').textContent = user.dept;

    renderForwardedRequests(user.dept);
}

/**
 * Renders the list of requests forwarded to HOD.
 * @param {string} dept
 */
export function renderForwardedRequests(dept) {
    const allRequests = getLeaveRequests();
    const forwardedRequests = allRequests.filter(req => 
        req.dept === dept && 
        req.status === "Forwarded to HOD"
    );

    const tableBody = document.getElementById('forwarded-requests-body');
    const forwardedCount = document.getElementById('forwarded-count');

    if (!tableBody) return;

    forwardedCount.textContent = forwardedRequests.length;
    tableBody.innerHTML = '';

    if (forwardedRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">No requests forwarded for HOD approval.</td></tr>';
        return;
    }

    forwardedRequests.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());

    forwardedRequests.forEach(req => {
        const row = tableBody.insertRow();
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer';
        row.onclick = () => redirect(`request-details.html?id=${req.requestId}`);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${req.requestId}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${req.studentName} (${req.studentRegNo})</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${req.requestType}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${req.noOfDays} days</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${formatDate(req.appliedDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${renderStatusBadge(req.status)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 font-semibold">Review</td>
        `;
    });
}

/**
 * Handles HOD action (Approve or Reject) on a request.
 * This function is called from request-details.html.
 * @param {string} requestId
 * @param {'approve' | 'reject'} action
 * @param {string} remark
 */
export function handleHodAction(requestId, action, remark) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Session expired.', 'error');
        return false;
    }

    if (action === 'reject' && !remark.trim()) {
        showToast('Remark is required for Reject action.', 'error');
        return false;
    }

    const request = getLeaveRequests().find(r => r.requestId === requestId);
    if (!request || request.status !== "Forwarded to HOD") {
        showToast('Request status is no longer pending HOD approval.', 'error');
        return false;
    }

    let newStatus;
    let toastMessage;

    if (action === 'reject') {
        newStatus = "Rejected by HOD";
        toastMessage = 'Request rejected by HOD.';
    } else if (action === 'approve') {
        newStatus = "Approved by HOD";
        toastMessage = 'Request approved by HOD.';
    } else {
        showToast('Invalid action.', 'error');
        return false;
    }

    const updates = {
        status: newStatus,
        hodRemark: remark,
        hodActionDate: getCurrentDate()
    };

    if (updateRequest(requestId, updates)) {
        showToast(toastMessage, 'success');
        redirect('hod-dashboard.html');
        return true;
    } else {
        showToast('Failed to update request.', 'error');
        return false;
    }
}