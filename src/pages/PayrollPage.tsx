import React, { useState } from 'react';
import { 
  DollarSign, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Edit3, 
  Plus, 
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { PayrollRecord, PayrollStatus } from '../types';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import { Avatar } from '../components/common/Avatar';

export const PayrollPage: React.FC = () => {
  const { 
    payrollRecords, 
    employees, 
    currentUser, 
    companySettings, 
    generateMonthlyPayroll, 
    updatePayrollStatus, 
    updatePayrollRecord 
  } = useHRMS();

  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Edit single payroll item state
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);

  const canManagePayroll = currentUser?.role === 'super_admin' || currentUser?.role === 'hr';

  // Filter records for selected month
  const monthlyRecords = payrollRecords.filter(p => p.monthYear === selectedMonth);
  const filteredRecords = monthlyRecords.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const matchesSearch = !searchEmployee ||
      emp?.fullName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp?.employeeCode.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();

    // If regular employee or manager without HR access, only show their own record
    if (!canManagePayroll) {
      return p.employeeId === currentUser?.employeeId;
    }

    return matchesSearch && matchesStatus;
  });

  // Totals for this month
  const totalGross = filteredRecords.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalDeductions = filteredRecords.reduce((acc, p) => acc + p.totalDeductions, 0);
  const totalNet = filteredRecords.reduce((acc, p) => acc + p.netSalary, 0);

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handleBulkGenerate = () => {
    generateMonthlyPayroll(selectedMonth);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updatePayrollRecord(editingRecord.id, editingRecord);
    setEditingRecord(null);
  };

  const getStatusBadge = (status: PayrollStatus) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Corporate Payroll & Compensation</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-[#365CF5] rounded-full border border-blue-200">
              Manager: 30k CTC · Executive: 20k CTC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage salary structures, deductions, TDS compliances, bank transfers, and verified payslip issuance.
          </p>
        </div>

        {canManagePayroll && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate {selectedMonth === '2026-09' ? 'Sept 2026' : selectedMonth} Batch</span>
            </button>
          </div>
        )}
      </div>

      {/* Month Selector & Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Payroll Cycle</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="mt-2 w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-slate-50"
          >
            <option value="2026-09">September 2026 (Active)</option>
            <option value="2026-08">August 2026 (Disbursed)</option>
            <option value="2026-07">July 2026 (Disbursed)</option>
          </select>
          <span className="text-[10px] text-slate-400 mt-2 font-mono">Status: Approved Batch</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Gross Earnings</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">{formatINR(totalGross)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{filteredRecords.length} Payroll Records</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Statutory Deductions (TDS+PF+PT)</span>
          <div className="text-2xl font-bold font-mono text-red-600 tabular-nums mt-1">{formatINR(totalDeductions)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Form 24Q compliant</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Net Disbursed Take-Home</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums mt-1">{formatINR(totalNet)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Direct Bank Transfer</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">
              {selectedMonth === '2026-09' ? 'September 2026' : 'August 2026'} Salary Slips ({filteredRecords.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Under Review">Under Review</option>
              <option value="Draft">Draft</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchEmployee}
                onChange={e => setSearchEmployee(e.target.value)}
                placeholder="Search staff..."
                className="pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-white w-40 sm:w-52 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Payroll Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-3 font-semibold font-mono">Basic</th>
                <th className="py-3 px-3 font-semibold font-mono">HRA</th>
                <th className="py-3 px-3 font-semibold font-mono">Gross (CTC)</th>
                <th className="py-3 px-3 font-semibold font-mono">Deductions</th>
                <th className="py-3 px-3 font-semibold font-mono">Net Salary</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map(pay => {
                const emp = employees.find(e => e.id === pay.employeeId);
                if (!emp) return null;

                const ctcTier = emp.designation.includes('Manager') || emp.designation.includes('Admin') ? '30k CTC' : '20k CTC';

                return (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={emp.fullName}
                          size="xs"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp.employeeCode} · {emp.designation} · <span className="font-semibold text-[#1D2B45] bg-slate-100 px-1 py-0.2 rounded font-sans">{ctcTier}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-700">{formatINR(pay.basicSalary)}</td>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-700">{formatINR(pay.hra)}</td>
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-900">{formatINR(pay.grossSalary)}</td>
                    <td className="py-3 px-3 font-mono tabular-nums text-red-600 font-medium">-{formatINR(pay.totalDeductions)}</td>
                    <td className="py-3 px-3 font-mono tabular-nums font-bold text-emerald-600 text-sm">
                      {formatINR(pay.netSalary)}
                    </td>
                    <td className="py-3 px-3">
                      {canManagePayroll ? (
                        <select
                          value={pay.status}
                          onChange={e => updatePayrollStatus(pay.id, e.target.value as PayrollStatus)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(pay.status)} focus:outline-hidden`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Paid">Paid</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusBadge(pay.status)}`}>
                          {pay.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {canManagePayroll && (
                          <button
                            onClick={() => setEditingRecord(pay)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit components"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => generatePayslipPDF(emp, pay, companySettings)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition-colors cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Payroll Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adjust Employee Remuneration</h3>
                <div className="text-xs text-slate-500">
                  {employees.find(e => e.id === editingRecord.employeeId)?.fullName} · {editingRecord.monthYear}
                </div>
              </div>
              <button onClick={() => setEditingRecord(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Basic Salary</label>
                  <input
                    type="number"
                    value={editingRecord.basicSalary}
                    onChange={e => setEditingRecord({ ...editingRecord, basicSalary: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HRA Allowance</label>
                  <input
                    type="number"
                    value={editingRecord.hra}
                    onChange={e => setEditingRecord({ ...editingRecord, hra: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incentives / Bonus</label>
                  <input
                    type="number"
                    value={editingRecord.incentives}
                    onChange={e => setEditingRecord({ ...editingRecord, incentives: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overtime Pay</label>
                  <input
                    type="number"
                    value={editingRecord.overtime}
                    onChange={e => setEditingRecord({ ...editingRecord, overtime: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Late Penalty</label>
                  <input
                    type="number"
                    value={editingRecord.lateDeduction}
                    onChange={e => setEditingRecord({ ...editingRecord, lateDeduction: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LWP Deduction</label>
                  <input
                    type="number"
                    value={editingRecord.leaveWithoutPay}
                    onChange={e => setEditingRecord({ ...editingRecord, leaveWithoutPay: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TDS Tax</label>
                  <input
                    type="number"
                    value={editingRecord.tds}
                    onChange={e => setEditingRecord({ ...editingRecord, tds: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Save Salary Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
