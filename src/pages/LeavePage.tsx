import React, { useState } from 'react';
import { 
  CalendarOff, 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock, 
  FileText, 
  User, 
  AlertCircle, 
  Filter, 
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { LeaveType, LeaveStatus, LeaveRequest } from '../types';
import { Avatar } from '../components/common/Avatar';

export const LeavePage: React.FC = () => {
  const { 
    leaveRequests, 
    leaveBalances, 
    employees, 
    currentUser, 
    applyLeave, 
    reviewLeave, 
    cancelLeave 
  } = useHRMS();

  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'balances'>('requests');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Review comment modal state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComment, setReviewComment] = useState('');

  // Apply form state
  const [leaveType, setLeaveType] = useState<LeaveType>('Paid Leave');
  const [startDate, setStartDate] = useState('2026-10-05');
  const [endDate, setEndDate] = useState('2026-10-06');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'first_half' | 'second_half'>('first_half');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const currentEmpId = currentUser?.employeeId || 'emp-5';
  const myBalance = leaveBalances[currentEmpId] || {
    casual: { allocated: 12, used: 3 },
    sick: { allocated: 10, used: 1 },
    paid: { allocated: 18, used: 5 },
    wfh: { allocated: 24, used: 8 },
  };

  const isApprover = currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  // Filtered requests
  const filteredRequests = leaveRequests.filter(req => {
    if (filterStatus === 'all') return true;
    return req.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the leave application.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = isHalfDay ? 0.5 : Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    applyLeave({
      employeeId: currentEmpId,
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      totalDays: diffDays,
      reason,
      attachmentName: attachmentName || undefined
    });

    setIsApplyModalOpen(false);
    setReason('');
  };

  const handleReviewConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    reviewLeave(selectedRequest.id, reviewAction, reviewComment || `${reviewAction} by ${currentUser?.fullName}`);
    setSelectedRequest(null);
    setReviewComment('');
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management & Workflow</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave requests, check entitlement balances, and process manager approvals.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Entitlement Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Casual Leave (CL)</span>
            <span className="text-slate-400 font-mono">12 Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {myBalance.casual.allocated - myBalance.casual.used}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {myBalance.casual.used} day(s) utilized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sick Leave (SL)</span>
            <span className="text-slate-400 font-mono">10 Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {myBalance.sick.allocated - myBalance.sick.used}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {myBalance.sick.used} day(s) utilized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Paid Leave (PL)</span>
            <span className="text-slate-400 font-mono">18 Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {myBalance.paid.allocated - myBalance.paid.used}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {myBalance.paid.used} day(s) utilized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>WFH Allowance</span>
            <span className="text-slate-400 font-mono">24 Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {myBalance.wfh.allocated - myBalance.wfh.used}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {myBalance.wfh.used} day(s) utilized
          </div>
        </div>
      </div>

      {/* Main Leave Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Tab & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'requests' ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Leave Requests ({leaveRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'calendar' ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Approved Leave Calendar
            </button>
          </div>

          {activeTab === 'requests' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Filter status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="all">All ({leaveRequests.length})</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Requests List */}
        {activeTab === 'requests' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold">Leave Type</th>
                  <th className="py-3 px-3 font-semibold">Dates</th>
                  <th className="py-3 px-3 font-semibold font-mono">Days</th>
                  <th className="py-3 px-3 font-semibold">Reason</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(req => {
                  const emp = employees.find(e => e.id === req.employeeId);
                  const isOwn = req.employeeId === currentEmpId;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={emp?.fullName || ''}
                            size="xs"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{emp?.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{req.leaveType}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {req.startDate} {req.endDate !== req.startDate && `to ${req.endDate}`}
                        {req.isHalfDay && <span className="text-amber-600 block text-[10px] font-sans">({req.halfDayPeriod?.replace('_', ' ')})</span>}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{req.totalDays}d</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                        "{req.reason}"
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {/* Manager / HR approval controls */}
                        {isApprover && req.status === 'Pending' && (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setReviewAction('Approved');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setReviewAction('Rejected');
                              }}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Employee cancel control */}
                        {isOwn && req.status === 'Pending' && !isApprover && (
                          <button
                            onClick={() => cancelLeave(req.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        {req.status !== 'Pending' && (
                          <span className="text-[11px] text-slate-400">
                            {req.reviewedBy ? `by ${req.reviewedBy}` : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Approved Leave Calendar */}
        {activeTab === 'calendar' && (
          <div className="p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Approved Team Leave Calendar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {leaveRequests.filter(l => l.status === 'Approved').map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId);
                return (
                  <div key={leave.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <Avatar
                      name={emp?.fullName || ''}
                      size="sm"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">{emp?.fullName}</div>
                      <div className="text-[#365CF5] font-semibold">{leave.leaveType} · {leave.totalDays} day(s)</div>
                      <div className="text-slate-500 font-mono mt-1 text-[11px]">
                        {leave.startDate} to {leave.endDate}
                      </div>
                      <div className="text-slate-400 mt-0.5 italic text-[11px]">
                        "{leave.reason}"
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit Leave Application</h3>
                <div className="text-xs text-slate-500">Routing directly to HR & Reporting Manager</div>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Paid Leave">Paid Leave (PL)</option>
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Work From Home">Work From Home (WFH)</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    disabled={isHalfDay}
                    value={isHalfDay ? startDate : endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={e => setIsHalfDay(e.target.checked)}
                    className="rounded border-slate-300 text-[#365CF5]"
                  />
                  <span className="font-semibold text-slate-700">Half Day Session</span>
                </label>

                {isHalfDay && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="halfPeriod"
                        checked={halfDayPeriod === 'first_half'}
                        onChange={() => setHalfDayPeriod('first_half')}
                      />
                      <span>First Half</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="halfPeriod"
                        checked={halfDayPeriod === 'second_half'}
                        onChange={() => setHalfDayPeriod('second_half')}
                      />
                      <span>Second Half</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Provide context for manager review and workload handover..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attachment (Optional)</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={e => setAttachmentName(e.target.value)}
                  placeholder="e.g. medical_certificate.pdf, travel_ticket.pdf"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {reviewAction} Leave Request
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewConfirm} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900">
                  {employees.find(e => e.id === selectedRequest.employeeId)?.fullName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedRequest.leaveType} · {selectedRequest.totalDays} day(s) ({selectedRequest.startDate})
                </div>
                <p className="text-[11px] text-slate-600 italic mt-1">"{selectedRequest.reason}"</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Manager Reviewer Comment
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder={`Optional comments on why this request is ${reviewAction.toLowerCase()}...`}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg font-bold cursor-pointer ${
                    reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {reviewAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
