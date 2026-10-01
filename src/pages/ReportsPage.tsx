import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  Calendar, 
  Printer, 
  Users, 
  Clock, 
  DollarSign, 
  CheckSquare, 
  Award,
  CalendarOff
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';

type ReportType = 
  | 'attendance' 
  | 'late_arrival' 
  | 'leave' 
  | 'employee' 
  | 'payroll' 
  | 'department' 
  | 'task_performance' 
  | 'employee_performance';

export const ReportsPage: React.FC = () => {
  const { 
    employees, 
    departments, 
    attendance, 
    leaveRequests, 
    payrollRecords, 
    tasks, 
    performanceReviews 
  } = useHRMS();

  const [activeReport, setActiveReport] = useState<ReportType>('attendance');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-28');

  const reportTabs: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: 'attendance', label: 'Attendance Report', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'late_arrival', label: 'Late Arrival Report', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'leave', label: 'Leave Report', icon: <CalendarOff className="w-3.5 h-3.5" /> },
    { id: 'employee', label: 'Employee Master Report', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'payroll', label: 'Payroll & Compensation', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'department', label: 'Department Headcount', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'task_performance', label: 'Task Execution Report', icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { id: 'employee_performance', label: 'Appraisal & Ratings', icon: <Award className="w-3.5 h-3.5" /> },
  ];

  // Export handlers
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeReport === 'attendance' || activeReport === 'late_arrival') {
      headers = ['Date,Employee ID,Employee Name,Check In,Check Out,Working Hours,Status'];
      const data = activeReport === 'late_arrival' 
        ? attendance.filter(a => a.status === 'Late')
        : attendance;

      rows = data.map(a => {
        const emp = employees.find(e => e.id === a.employeeId);
        return [`"${a.date}"`, `"${emp?.employeeCode}"`, `"${emp?.fullName}"`, `"${a.checkIn || ''}"`, `"${a.checkOut || ''}"`, `"${a.workingHours}"`, `"${a.status}"`];
      });
    } else if (activeReport === 'payroll') {
      headers = ['Month,Employee ID,Employee Name,Basic,HRA,Gross,Total Deductions,Net Salary,Status'];
      rows = payrollRecords.map(p => {
        const emp = employees.find(e => e.id === p.employeeId);
        return [`"${p.monthYear}"`, `"${emp?.employeeCode}"`, `"${emp?.fullName}"`, `"${p.basicSalary}"`, `"${p.hra}"`, `"${p.grossSalary}"`, `"${p.totalDeductions}"`, `"${p.netSalary}"`, `"${p.status}"`];
      });
    } else if (activeReport === 'leave') {
      headers = ['Employee ID,Employee Name,Leave Type,Start Date,End Date,Days,Status,Reason'];
      rows = leaveRequests.map(l => {
        const emp = employees.find(e => e.id === l.employeeId);
        return [`"${emp?.employeeCode}"`, `"${emp?.fullName}"`, `"${l.leaveType}"`, `"${l.startDate}"`, `"${l.endDate}"`, `"${l.totalDays}"`, `"${l.status}"`, `"${l.reason}"`];
      });
    } else {
      headers = ['Employee ID,Full Name,Department,Designation,Email,Phone,Status'];
      rows = employees.map(e => {
        const dept = departments.find(d => d.id === e.departmentId)?.name || '';
        return [`"${e.employeeCode}"`, `"${e.fullName}"`, `"${dept}"`, `"${e.designation}"`, `"${e.workEmail}"`, `"${e.phone}"`, `"${e.status}"`];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wings_${activeReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready exportable reports across attendance, statutory payroll, leaves, tasks, and KPI reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 8 Report Type Selector Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-1 overflow-x-auto text-xs">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeReport === tab.id ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Report Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-1.5 border border-slate-200 rounded font-mono"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-1.5 border border-slate-200 rounded font-mono"
            />
          </div>

          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="p-1.5 border border-slate-200 rounded bg-white text-slate-700"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Company: Wings Corporation (Mumbai HQ)
        </span>
      </div>

      {/* Report Display Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* REPORT 1: Attendance Report */}
        {activeReport === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold font-mono">Check In</th>
                  <th className="py-3 px-3 font-semibold font-mono">Check Out</th>
                  <th className="py-3 px-3 font-semibold font-mono">Hours</th>
                  <th className="py-3 px-3 font-semibold font-mono">Overtime</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map(a => {
                  const emp = employees.find(e => e.id === a.employeeId);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{a.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{emp?.fullName} ({emp?.employeeCode})</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{a.checkIn || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{a.checkOut || 'Active'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{a.workingHours}h</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{a.overtimeHours}h</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="font-semibold text-slate-700">{a.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 2: Late Arrival Report */}
        {activeReport === 'late_arrival' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold font-mono">Expected</th>
                  <th className="py-3 px-3 font-semibold font-mono">Actual Punch In</th>
                  <th className="py-3 px-3 font-semibold">Grace Buffer Exceeded</th>
                  <th className="py-3 px-4 font-semibold text-right">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.filter(a => a.status === 'Late').map(a => {
                  const emp = employees.find(e => e.id === a.employeeId);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{a.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{emp?.fullName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">09:30 AM</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600">{a.checkIn}</td>
                      <td className="py-2.5 px-3 text-slate-600">Late (&gt;15 min grace window)</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-red-600">₹500 Ded.</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 5: Payroll Report */}
        {activeReport === 'payroll' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Month</th>
                  <th className="py-3 px-3 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold font-mono">Basic</th>
                  <th className="py-3 px-3 font-semibold font-mono">HRA</th>
                  <th className="py-3 px-3 font-semibold font-mono">Gross Pay</th>
                  <th className="py-3 px-3 font-semibold font-mono">Total Deductions</th>
                  <th className="py-3 px-3 font-semibold font-mono">Net Salary</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRecords.map(p => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-slate-600">{p.monthYear}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{emp?.fullName} ({emp?.employeeCode})</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">₹{p.basicSalary.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">₹{p.hra.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹{p.grossSalary.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono text-red-600 font-medium">-₹{p.totalDeductions.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">₹{p.netSalary.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="font-semibold text-blue-700">{p.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DEFAULT/FALLBACK REPORT VIEW */}
        {(activeReport !== 'attendance' && activeReport !== 'late_arrival' && activeReport !== 'payroll') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-3 font-semibold">Employee Name</th>
                  <th className="py-3 px-3 font-semibold">Designation</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Joining Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(e => {
                  const dept = departments.find(d => d.id === e.departmentId)?.name || 'General';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">{e.employeeCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{e.fullName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{e.designation}</td>
                      <td className="py-2.5 px-3 text-slate-600">{dept}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{e.joiningDate}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="font-semibold text-slate-800">{e.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Report Generated: September 28, 2026 · Confidential Internal Document</span>
          <span>Authorized by Wings Corporation HRMS</span>
        </div>
      </div>
    </div>
  );
};
