import React from 'react';
import { useHRMS } from '../../context/HRMSContext';

function getMonthKeys(todayDate: string): string[] {
  const [year, month] = todayDate.split('-').map(Number);
  return [new Date(year, month - 1, 1), new Date(year, month - 2, 1)].map(date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  );
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getApprovedLeaveDays(employeeId: string, monthKey: string, leaveRequests: ReturnType<typeof useHRMS>['leaveRequests']): number {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

  return leaveRequests.reduce((total, request) => {
    if (request.employeeId !== employeeId || request.status !== 'Approved') return total;

    const overlapStart = request.startDate > monthStart ? request.startDate : monthStart;
    const overlapEnd = request.endDate < monthEnd ? request.endDate : monthEnd;
    if (overlapStart > overlapEnd) return total;
    if (request.isHalfDay) return total + 0.5;

    const start = new Date(`${overlapStart}T12:00:00`);
    const end = new Date(`${overlapEnd}T12:00:00`);
    let days = 0;
    while (start <= end) {
      days += 1;
      start.setDate(start.getDate() + 1);
    }
    return total + days;
  }, 0);
}

function formatDays(days: number): string {
  return `${Number(days.toFixed(1))}d`;
}

export const MonthlyLeaveDeductionSummary: React.FC = () => {
  const { currentUser, employees, leaveBalances, leaveRequests, payrollRecords, todayDate } = useHRMS();
  const months = getMonthKeys(todayDate);
  const visibleEmployees = currentUser?.role === 'employee'
    ? employees.filter(employee => employee.id === currentUser.employeeId)
    : employees;

  const formatMoney = (amount: number | null) => amount === null ? 'Not generated' : `₹${amount.toLocaleString('en-IN')}`;

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">Monthly Leave & Deduction Summary</h2>
        <p className="text-xs text-slate-500 mt-0.5">Available leave balance, approved leave, and payroll deductions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Leave Remaining (CL / SL / PL / WFH)</th>
              <th className="px-4 py-3 font-semibold">{formatMonth(months[0])} Leave</th>
              <th className="px-4 py-3 font-semibold">{formatMonth(months[0])} Deductions</th>
              <th className="px-4 py-3 font-semibold">{formatMonth(months[1])} Leave</th>
              <th className="px-4 py-3 font-semibold">{formatMonth(months[1])} Deductions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleEmployees.map(employee => {
              const balance = leaveBalances[employee.id];
              const payrollForMonth = (monthKey: string) => {
                const records = payrollRecords.filter(record => record.employeeId === employee.id && record.monthYear === monthKey);
                return records.length ? records.reduce((total, record) => total + record.totalDeductions, 0) : null;
              };
              const availableLeaves = balance
                ? `CL ${formatDays(balance.casual.allocated - balance.casual.used)} · SL ${formatDays(balance.sick.allocated - balance.sick.used)} · PL ${formatDays(balance.paid.allocated - balance.paid.used)} · WFH ${formatDays(balance.wfh.allocated - balance.wfh.used)}`
                : '—';

              return (
                <tr key={employee.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{employee.fullName}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{availableLeaves}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDays(getApprovedLeaveDays(employee.id, months[0], leaveRequests))}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-red-600">{formatMoney(payrollForMonth(months[0]))}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDays(getApprovedLeaveDays(employee.id, months[1], leaveRequests))}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-red-600">{formatMoney(payrollForMonth(months[1]))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {visibleEmployees.length === 0 && (
        <p className="p-5 text-xs text-slate-500">No employee summary data available.</p>
      )}
    </section>
  );
};