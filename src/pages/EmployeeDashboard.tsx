import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  CalendarOff, 
  Download, 
  Megaphone, 
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import { MonthlyLeaveDeductionSummary } from '../components/common/MonthlyLeaveDeductionSummary';

export const EmployeeDashboard: React.FC = () => {
  const { 
    currentUser, 
    employees, 
    tasks, 
    leaveBalances, 
    payrollRecords, 
    holidays, 
    announcements, 
    todayAttendance, 
    todayDate,
    currentBreakWindow,
    checkIn, 
    checkOut,
    startBreak,
    endBreak,
    companySettings,
    setActiveNav
  } = useHRMS();

  // Find full employee record
  const currentEmp = employees.find(e => e.id === currentUser?.employeeId) || employees[4];
  const balance = leaveBalances[currentEmp.id] || {
    casual: { allocated: 12, used: 3 },
    sick: { allocated: 10, used: 1 },
    paid: { allocated: 18, used: 5 },
    wfh: { allocated: 24, used: 8 },
  };

  // Live timer calculation for working hours
  const [liveDuration, setLiveDuration] = useState('00h 00m');

  useEffect(() => {
    const updateTimer = () => {
      if (todayAttendance?.checkIn && !todayAttendance.checkOut) {
        const [h, m] = todayAttendance.checkIn.split(':').map(Number);
        const checkInDate = new Date();
        checkInDate.setHours(h, m, 0, 0);

        const now = new Date();
        const diffMs = Math.max(0, now.getTime() - checkInDate.getTime());
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        setLiveDuration(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
      } else if (todayAttendance?.workingHours) {
        const hours = Math.floor(todayAttendance.workingHours);
        const mins = Math.round((todayAttendance.workingHours - hours) * 60);
        setLiveDuration(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
      } else {
        setLiveDuration('00h 00m');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [todayAttendance]);

  // Tasks assigned to this employee
  const myTasks = tasks.filter(t => t.assignedToId === currentEmp.id);
  const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
  const completedTasks = myTasks.filter(t => t.status === 'Completed');

  // Next upcoming holiday
  const nextHoliday = holidays[0];

  // Employee's payslips
  const myPayslips = payrollRecords
    .filter(p => p.employeeId === currentEmp.id)
    .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const activeBreak = todayAttendance?.breakSessions?.find(session => !session.endedAt);
  const breakAlreadyTaken = currentBreakWindow && todayAttendance?.breakSessions?.some(
    session => session.windowId === currentBreakWindow.id
  );

  const currentDateLong = new Date(`${todayDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Personalized Greeting Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#365CF5] tracking-wide uppercase">
            Employee Workspace
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Good Morning, {currentEmp.firstName}!
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>{currentDateLong}</span>
            <span>·</span>
            <span className="font-mono">{currentEmp.employeeCode}</span>
            <span>·</span>
            <span>{currentEmp.designation}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveNav('leave')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Apply for Leave
          </button>
          <button
            onClick={() => setActiveNav('tasks')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1D2B45] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            My Tasks ({pendingTasks.length})
          </button>
        </div>
      </div>

      {/* Main Grid: Attendance Punch Widget & Quick Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Large Punch In / Punch Out Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#1D2B45] to-[#253759] text-white p-6 rounded-xl shadow-xs border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Today's Attendance Punch
              </span>
              <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono tabular-nums">09:30 AM Shift</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <div className="text-xs text-slate-400">
                  {isCheckedIn ? 'Punched In Since' : todayAttendance?.checkIn ? 'Shift Finished' : 'Not Punched In Yet'}
                </div>
                <div className="text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
                  {todayAttendance?.checkIn || '09:00 AM'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Working Duration</div>
                <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 mt-1">
                  {liveDuration}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            {isCheckedIn ? (
              <button
                onClick={checkOut}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Clock className="w-4 h-4" />
                <span>PUNCH OUT NOW</span>
              </button>
            ) : !todayAttendance?.checkIn ? (
              <button
                onClick={checkIn}
                className="w-full py-3 px-4 bg-[#16A34A] hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Clock className="w-4 h-4" />
                <span>PUNCH IN NOW</span>
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold rounded-lg text-xs text-center">
                Punched Out at {todayAttendance.checkOut} · Total: {todayAttendance.workingHours} hrs
              </div>
            )}
            {activeBreak ? (
              <button
                onClick={endBreak}
                className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                END BREAK
              </button>
            ) : currentBreakWindow && isCheckedIn && !breakAlreadyTaken ? (
              <button
                onClick={startBreak}
                className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                START BREAK ({currentBreakWindow.label})
              </button>
            ) : null}
            <p className="text-[10px] text-slate-300 text-center">
              Break windows: 1:30 PM - 2:00 PM, 4:30 PM - 4:45 PM, 6:30 PM - 6:45 PM
            </p>
          </div>
        </div>

        {/* Pending Tasks Stat */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Assigned Tasks</span>
              <CheckSquare className="w-4 h-4 text-[#365CF5]" />
            </div>
            <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-3">
              {pendingTasks.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {completedTasks.length} completed this cycle
            </div>
          </div>
          <button 
            onClick={() => setActiveNav('tasks')}
            className="text-xs text-[#365CF5] font-semibold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-slate-100"
          >
            <span>View Kanban Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Next Holiday Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Next Company Holiday</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-base font-bold text-slate-900 mt-3 truncate">
              {nextHoliday?.name || 'Gandhi Jayanti'}
            </div>
            <div className="text-xs text-purple-700 font-medium font-mono mt-1">
              {nextHoliday?.date || '2026-10-02'} (Friday)
            </div>
          </div>
          <button 
            onClick={() => setActiveNav('holidays')}
            className="text-xs text-[#365CF5] font-semibold hover:underline flex items-center gap-1 mt-4 pt-3 border-t border-slate-100"
          >
            <span>Holiday Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leave Balances Row */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Annual Leave Balances</h2>
            <p className="text-xs text-slate-500">Allocated for Financial Year 2026-2027</p>
          </div>
          <button
            onClick={() => setActiveNav('leave')}
            className="text-xs text-[#365CF5] font-semibold hover:underline"
          >
            Apply Leave Request →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Casual Leave (CL)</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {balance.casual.allocated - balance.casual.used} <span className="text-xs font-normal text-slate-400">/ {balance.casual.allocated} left</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Sick Leave (SL)</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {balance.sick.allocated - balance.sick.used} <span className="text-xs font-normal text-slate-400">/ {balance.sick.allocated} left</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">Paid Leave (PL)</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {balance.paid.allocated - balance.paid.used} <span className="text-xs font-normal text-slate-400">/ {balance.paid.allocated} left</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">WFH Allowance</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {balance.wfh.allocated - balance.wfh.used} <span className="text-xs font-normal text-slate-400">/ {balance.wfh.allocated} left</span>
            </div>
          </div>
        </div>
      </div>

      <MonthlyLeaveDeductionSummary />

      {/* Two Column: Assigned Tasks & Recent Payslips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">My Assigned Tasks</h2>
            <button 
              onClick={() => setActiveNav('tasks')}
              className="text-xs text-[#365CF5] font-semibold hover:underline"
            >
              All Tasks ({myTasks.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {myTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active tasks assigned
              </div>
            ) : (
              myTasks.slice(0, 4).map(task => (
                <div key={task.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-xs text-slate-900">{task.title}</div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{task.description}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>Deadline: {task.deadline}</span>
                    <span className="font-medium text-slate-700 font-mono">{task.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payslips Section */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Payslips</h2>
              <p className="text-xs text-slate-500">Verified monthly salary statements</p>
            </div>
            <button 
              onClick={() => setActiveNav('payroll')}
              className="text-xs text-[#365CF5] font-semibold hover:underline"
            >
              Salary Details
            </button>
          </div>

          <div className="space-y-3">
            {myPayslips.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No payslips available yet
              </div>
            ) : (
              myPayslips.map(pay => (
                <div key={pay.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-[#365CF5] rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {pay.monthYear === '2026-09' ? 'September 2026 Payslip' : 'August 2026 Payslip'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Net: <span className="font-mono font-bold text-emerald-600">₹{pay.netSalary.toLocaleString('en-IN')}</span> · {pay.status}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => generatePayslipPDF(currentEmp, pay, companySettings)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>PDF</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Announcements Board */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#365CF5]" />
          <span>Wings Corporation Notice Board</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.slice(0, 2).map(ann => (
            <div key={ann.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900">{ann.title}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ann.description}</div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                Published by {ann.createdByName} · {ann.publishDate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
