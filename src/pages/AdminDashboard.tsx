import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  CalendarOff, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Cake, 
  Award, 
  CheckCircle2, 
  FileText, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { AttendanceStatus } from '../types';
import { Avatar } from '../components/common/Avatar';
import { MonthlyLeaveDeductionSummary } from '../components/common/MonthlyLeaveDeductionSummary';

export const AdminDashboard: React.FC = () => {
  const { 
    employees, 
    departments, 
    attendance, 
    leaveRequests, 
    payrollRecords, 
    holidays, 
    announcements,
    companySettings,
    todayDate,
    setActiveNav,
    reviewLeave
  } = useHRMS();

  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [shiftStartHour, shiftStartMinute] = companySettings.officeStartTime.split(':').map(Number);
  const lateCutoffMinutes = shiftStartHour * 60 + shiftStartMinute + companySettings.gracePeriodMinutes;
  const lateCutoffClock = new Date();
  lateCutoffClock.setHours(Math.floor(lateCutoffMinutes / 60), lateCutoffMinutes % 60, 0, 0);
  const lateCutoffLabel = lateCutoffClock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Metrics calculations for today
  const totalEmployees = employees.length;
  
  // Today's attendance records
  const todayRecords = attendance.filter(a => a.date === todayDate);
  const presentToday = todayRecords.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
  const absentToday = todayRecords.filter(a => a.status === 'Absent').length;
  const onLeaveToday = todayRecords.filter(a => a.status === 'Leave' || a.status === 'Half Day').length;
  const lateToday = todayRecords.filter(a => a.status === 'Late').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;

  const attendanceRate = totalEmployees > 0 ? Math.round(((presentToday + lateToday) / totalEmployees) * 100) : 0;

  // Filtered Today's attendance list
  const filteredTodayRecords = todayRecords.filter(rec => {
    if (attendanceFilter === 'all') return true;
    return rec.status.toLowerCase() === attendanceFilter.toLowerCase();
  });

  // Department distribution
  const deptDistribution = departments.map(dept => {
    const count = employees.filter(e => e.departmentId === dept.id).length;
    const percentage = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
    return { ...dept, count, percentage };
  }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

  // Status badge styling helper
  const getStatusStyle = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Late':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Absent':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Half Day':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Leave':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Work From Home':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  // Monthly attendance trend simulation (last 5 business days)
  const trendDayLabels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${todayDate}T00:00:00`);
    date.setDate(date.getDate() + index - 5);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  });
  const attendanceTrend = [
    { day: trendDayLabels[0], rate: 95, present: 21, late: 1, absent: 0 },
    { day: trendDayLabels[1], rate: 91, present: 20, late: 2, absent: 0 },
    { day: trendDayLabels[2], rate: 95, present: 21, late: 0, absent: 1 },
    { day: trendDayLabels[3], rate: 86, present: 19, late: 2, absent: 1 },
    { day: trendDayLabels[4], rate: 91, present: 20, late: 1, absent: 1 },
    { day: trendDayLabels[5], rate: attendanceRate, present: presentToday, late: lateToday, absent: absentToday },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Corporate HR Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workforce attendance, leaves, payroll liabilities, and departmental performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveNav('employees')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1D2B45] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            + Add Employee
          </button>
          <button 
            onClick={() => setActiveNav('reports')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Export Reports
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Workforce</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {totalEmployees}
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+2 this month</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {presentToday}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="font-mono tabular-nums text-emerald-600 font-semibold">{attendanceRate}%</span> turnout rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Absent Today</span>
            <UserX className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {absentToday}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Uninformed: 1 staff
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">On Leave</span>
            <CalendarOff className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {onLeaveToday}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Planned & Half-days
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Late Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {lateToday}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            After {lateCutoffLabel}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Leaves</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {pendingLeaves}
          </div>
          <div className="text-[11px] text-[#365CF5] mt-1 font-medium hover:underline cursor-pointer" onClick={() => setActiveNav('leave')}>
            Action needed →
          </div>
        </div>
      </div>

      <MonthlyLeaveDeductionSummary />

      {/* Two Column Section: Attendance Trend Chart & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Overview Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Overview Trends</h2>
              <p className="text-xs text-slate-500">Daily reporting presence across Wings Corporation offices</p>
            </div>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Avg: 93.4% Present
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-4 px-2">
              {attendanceTrend.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[11px] font-mono tabular-nums text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    {item.rate}%
                  </div>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md relative flex flex-col justify-end overflow-hidden h-36">
                    <div 
                      className="w-full bg-[#1D2B45] group-hover:bg-[#365CF5] transition-all rounded-t-md"
                      style={{ height: `${item.rate}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap mt-1">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#1D2B45] rounded-xs" /> Present Rate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" /> Late Threshold (&gt;15m)
                </span>
              </div>
              <span className="text-slate-400">September 2026 Roster</span>
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department Distribution</h2>
              <p className="text-xs text-slate-500">{departments.length} total departments</p>
            </div>
            <button 
              onClick={() => setActiveNav('departments')}
              className="text-xs text-[#365CF5] font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {deptDistribution.slice(0, 6).map(dept => (
              <div key={dept.id} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">{dept.name}</span>
                  <span className="font-mono tabular-nums text-slate-500 font-semibold">
                    {dept.count} <span className="text-slate-400 font-normal">({dept.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#365CF5] h-full rounded-full transition-all"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Primary Hub: Mumbai HQ</span>
            <span>Remote Staff: 14%</span>
          </div>
        </div>
      </div>

      {/* Two Column: Today's Attendance Table (2 cols) & Upcoming Events / Pending Actions (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Attendance Roster</h2>
              <p className="text-xs text-slate-500">Live timestamp logs for Monday, September 28, 2026</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs overflow-x-auto">
              {['all', 'present', 'late', 'absent', 'work from home'].map(st => (
                <button
                  key={st}
                  onClick={() => setAttendanceFilter(st)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors whitespace-nowrap ${
                    attendanceFilter === st 
                      ? 'bg-[#1D2B45] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Employee</th>
                  <th className="py-2.5 px-3 font-semibold">Department</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Punch In</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Punch Out</th>
                  <th className="py-2.5 px-3 font-semibold font-mono">Hours</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTodayRecords.slice(0, 8).map(record => {
                  const emp = employees.find(e => e.id === record.employeeId);
                  const dept = departments.find(d => d.id === emp?.departmentId);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
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
                      <td className="py-2.5 px-3 text-slate-600">{dept?.name || 'General'}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                        {record.checkIn || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                        {record.checkOut || 'Active'}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-slate-900">
                        {record.workingHours > 0 ? `${record.workingHours}h` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {Math.min(8, filteredTodayRecords.length)} of {filteredTodayRecords.length} records</span>
            <button 
              onClick={() => setActiveNav('attendance')}
              className="text-[#365CF5] font-semibold hover:underline"
            >
              Open Full Attendance Roster →
            </button>
          </div>
        </div>

        {/* Right Column: Pending Actions & Upcoming Events */}
        <div className="space-y-6">
          {/* Pending Actions Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Pending Action Items</span>
              <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full">
                {pendingLeaves + 2} urgent
              </span>
            </h2>

            <div className="space-y-2.5">
              {/* Leave request item */}
              {leaveRequests.filter(l => l.status === 'Pending').slice(0, 2).map(req => {
                const emp = employees.find(e => e.id === req.employeeId);
                return (
                  <div key={req.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{emp?.fullName}</span>
                      <span className="text-amber-600 font-semibold">{req.totalDays} day(s) {req.leaveType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">"{req.reason}"</p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => reviewLeave(req.id, 'Approved', 'Approved by administrator')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewLeave(req.id, 'Rejected', 'Requested rescheduling')}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">September 2026 Payroll Batch</div>
                  <div className="text-[11px] text-slate-500">22 payslips approved & ready for disbursement</div>
                </div>
                <button
                  onClick={() => setActiveNav('payroll')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#365CF5] hover:bg-blue-600 text-white rounded cursor-pointer"
                >
                  Review
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Upcoming Company Events
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Gandhi Jayanti (Gazetted Holiday)</div>
                  <div className="text-slate-500 text-[11px]">Fri, Oct 02, 2026 · All Offices Closed</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg shrink-0">
                  <Cake className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Vikram Singh's Birthday</div>
                  <div className="text-slate-500 text-[11px]">Director of Sales · Mon, Oct 05, 2026</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Wings Q3 Annual Town Hall</div>
                  <div className="text-slate-500 text-[11px]">Fri, Oct 02, 2026 · 4:30 PM Amphitheater</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
