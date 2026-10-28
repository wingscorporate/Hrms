import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Shield,
  FileCheck
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { Avatar } from '../components/common/Avatar';

export const AttendancePage: React.FC = () => {
  const { 
    attendance, 
    employees, 
    currentUser, 
    todayAttendance, 
    todayDate,
    currentBreakWindow,
    checkIn, 
    checkOut, 
    startBreak,
    endBreak,
    correctAttendance,
    companySettings,
    holidays
  } = useHRMS();

  const [shiftStartHour, shiftStartMinute] = companySettings.officeStartTime.split(':').map(Number);
  const lateCutoffMinutes = shiftStartHour * 60 + shiftStartMinute + companySettings.gracePeriodMinutes;
  const lateCutoffClock = new Date();
  lateCutoffClock.setHours(Math.floor(lateCutoffMinutes / 60), lateCutoffMinutes % 60, 0, 0);
  const lateCutoffLabel = lateCutoffClock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const [viewTab, setViewTab] = useState<'roster' | 'calendar'>('roster');
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Manual Correction Modal State
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);
  const [correctionCheckIn, setCorrectionCheckIn] = useState('');
  const [correctionCheckOut, setCorrectionCheckOut] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('Present');
  const [correctionReason, setCorrectionReason] = useState('');

  // Live timer for current punch
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
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [todayAttendance]);

  useEffect(() => {
    setSelectedDate(todayDate);
  }, [todayDate]);

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance.checkOut;
  const activeBreak = todayAttendance?.breakSessions?.find(session => !session.endedAt);
  const breakAlreadyTaken = currentBreakWindow && todayAttendance?.breakSessions?.some(
    session => session.windowId === currentBreakWindow.id
  );
  const canCorrect = currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  // Filtered roster for chosen date
  const rosterForDate = attendance.filter(rec => rec.date === selectedDate);
  const filteredRoster = rosterForDate.filter(rec => {
    const emp = employees.find(e => e.id === rec.employeeId);
    const matchesSearch = !searchEmployee || 
      emp?.fullName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp?.employeeCode.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'Half Day': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Leave': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Work From Home': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleOpenCorrection = (rec: AttendanceRecord) => {
    setCorrectingRecord(rec);
    setCorrectionCheckIn(rec.checkIn || '09:30');
    setCorrectionCheckOut(rec.checkOut || '18:30');
    setCorrectionStatus(rec.status);
    setCorrectionReason('');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingRecord) return;
    if (!correctionReason.trim()) {
      alert('Please provide an official reason for this audit-logged attendance correction.');
      return;
    }

    // Calculate updated hours
    let hoursWorked = correctingRecord.workingHours;
    if (correctionCheckIn && correctionCheckOut) {
      const [inH, inM] = correctionCheckIn.split(':').map(Number);
      const [outH, outM] = correctionCheckOut.split(':').map(Number);
      const diffMin = (outH * 60 + outM) - (inH * 60 + inM);
      hoursWorked = Math.max(0.1, Number((diffMin / 60).toFixed(1)));
    }

    correctAttendance(correctingRecord.id, {
      checkIn: correctionCheckIn,
      checkOut: correctionCheckOut,
      status: correctionStatus,
      workingHours: hoursWorked,
      overtimeHours: Math.max(0, Number((hoursWorked - companySettings.workingHoursPerDay).toFixed(1)))
    }, correctionReason);

    setCorrectingRecord(null);
  };

  // Monthly Calendar simulation for September 2026 (30 days)
  const daysInSeptember = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Top Banner / Punch Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Punch Action Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                My Attendance Today
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Shift: 11:00 AM - 08:00 PM ({companySettings.officeStartTime} - {companySettings.officeEndTime})
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Punch Status</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {isCheckedIn ? 'Punched In' : todayAttendance?.checkIn ? 'Shift Ended' : 'Not Punched In'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Punch Time: {todayAttendance?.checkIn || '—'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Active Duration</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
                  {liveDuration}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
            {isCheckedIn ? (
              <button
                onClick={checkOut}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>PUNCH OUT (END SHIFT)</span>
              </button>
            ) : !todayAttendance?.checkIn ? (
              <button
                onClick={checkIn}
                className="w-full py-2.5 px-4 bg-[#16A34A] hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>PUNCH IN (START SHIFT)</span>
              </button>
            ) : (
              <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg text-center">
                Shift Logged: {todayAttendance.checkIn} to {todayAttendance.checkOut} ({todayAttendance.workingHours}h)
              </div>
            )}
            {activeBreak ? (
              <button
                onClick={endBreak}
                className="w-full py-2 px-4 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                END BREAK
              </button>
            ) : currentBreakWindow && isCheckedIn && !breakAlreadyTaken ? (
              <button
                onClick={startBreak}
                className="w-full py-2 px-4 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                START BREAK ({currentBreakWindow.label})
              </button>
            ) : null}
            <p className="text-[10px] text-slate-400 text-center">
              Break windows: 1:30 PM - 2:00 PM, 4:30 PM - 4:45 PM, 6:30 PM - 6:45 PM
            </p>
          </div>
        </div>

        {/* Operating Rules & Policy Settings summary */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Wings Attendance Rules & Parameters</h2>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Automated Calculation
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Shift Timing</span>
                <span className="font-bold text-slate-800 text-xs block">11:00 AM - 08:00 PM</span>
                <span className="font-mono text-[10px] text-slate-500">{companySettings.officeStartTime} - {companySettings.officeEndTime}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Grace Buffer</span>
                <span className="font-mono font-bold text-slate-800">+{companySettings.gracePeriodMinutes} mins</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Min Full Day</span>
                <span className="font-mono font-bold text-slate-800">{companySettings.minFullDayHours} Hours</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Min Half Day</span>
                <span className="font-mono font-bold text-slate-800">{companySettings.minHalfDayHours} Hours</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Weekly Off: <strong className="font-semibold text-slate-700">{companySettings.weeklyOffDays.join(', ')}</strong></span>
              <span>·</span>
              <span>Late Arrival Penalty: <strong className="font-semibold text-slate-700">Flagged after {lateCutoffLabel}</strong></span>
              <span>·</span>
              <span>Audit Logging: <strong className="font-semibold text-slate-700">Active (Immutable)</strong></span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>All timestamps synced to Mumbai HQ IST time server</span>
            {canCorrect && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> HR Correction Mode Enabled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main View: Toggle between Roster Table & Monthly Calendar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Navigation & View Switcher */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewTab === 'roster' ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Daily Attendance Roster
            </button>
            <button
              onClick={() => setViewTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewTab === 'calendar' ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Monthly Calendar Matrix
            </button>
          </div>

          {/* Roster Controls */}
          {viewTab === 'roster' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-slate-700"
              />

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
                <option value="Work From Home">Work From Home</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchEmployee}
                  onChange={e => setSearchEmployee(e.target.value)}
                  placeholder="Filter employee..."
                  className="pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-white w-36 sm:w-44 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* View 1: Roster Table */}
        {viewTab === 'roster' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold font-mono">Punch In</th>
                  <th className="py-3 px-3 font-semibold font-mono">Punch Out</th>
                  <th className="py-3 px-3 font-semibold font-mono">Working Hours</th>
                  <th className="py-3 px-3 font-semibold font-mono">Overtime</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={emp?.fullName || ''}
                            size="xs"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{emp?.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                              <span>{emp?.employeeCode}</span>
                              {rec.isManualCorrection && (
                                <span className="text-amber-600 font-sans font-medium" title={rec.correctionReason}>
                                  · Corrected by {rec.correctedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                        {rec.checkIn || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                        {rec.checkOut || 'Active'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-900">
                        {rec.workingHours > 0 ? `${rec.workingHours}h` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600">
                        {rec.overtimeHours > 0 ? `+${rec.overtimeHours}h` : '0h'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusColor(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canCorrect ? (
                          <button
                            onClick={() => handleOpenCorrection(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-slate-500" />
                            <span>Correct</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {filteredRoster.length} attendance records for {selectedDate}</span>
              <span className="text-[11px] text-slate-400">All adjustments are audited per ISO-27001 HR compliance standards</span>
            </div>
          </div>
        )}

        {/* View 2: Monthly Calendar Matrix with Color Legends */}
        {viewTab === 'calendar' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">September 2026 Company Calendar View</h3>
                <p className="text-xs text-slate-500">Color-coded daily status representation</p>
              </div>

              {/* Color Code Legend mandated by prompt */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Green = Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Red = Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Orange = Late</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Yellow = Half Day</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Blue = Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Purple = WFH</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Grey = Holiday</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-slate-500 text-xs py-1">
                  {day}
                </div>
              ))}

              {/* 2 empty cells for Sep 1 starting on Tuesday */}
              <div className="h-20 bg-slate-50/50 rounded-lg border border-slate-100" />
              <div className="h-20 bg-slate-50/50 rounded-lg border border-slate-100" />

              {daysInSeptember.map(dayNum => {
                const dayStr = String(dayNum).padStart(2, '0');
                const isSunday = (dayNum + 1) % 7 === 0;
                const isToday = dayNum === 28;

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      setSelectedDate(`2026-09-${dayStr}`);
                      setViewTab('roster');
                    }}
                    className={`h-20 p-2 rounded-lg border flex flex-col justify-between transition-all cursor-pointer hover:border-[#365CF5] ${
                      isToday ? 'bg-blue-50/50 border-[#365CF5] ring-1 ring-[#365CF5]' : 
                      isSunday ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-bold ${isToday ? 'text-[#365CF5]' : isSunday ? 'text-slate-400' : 'text-slate-800'}`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 rounded">TODAY</span>
                      )}
                      {isSunday && (
                        <span className="text-[9px] font-semibold text-slate-400">WEEKLY OFF</span>
                      )}
                    </div>

                    {!isSunday && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-slate-600 font-mono">20 Pres</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-[10px] text-slate-600 font-mono">2 Late</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manual Attendance Correction Modal with Mandatory Audit Reason */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Manual Attendance Correction</h3>
                <div className="text-xs text-slate-500">
                  Target: {employees.find(e => e.id === correctingRecord.employeeId)?.fullName} · {correctingRecord.date}
                </div>
              </div>
              <button
                onClick={() => setCorrectingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Punch In Time</label>
                  <input
                    type="time"
                    required
                    value={correctionCheckIn}
                    onChange={e => setCorrectionCheckIn(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Punch Out Time</label>
                  <input
                    type="time"
                    required
                    value={correctionCheckOut}
                    onChange={e => setCorrectionCheckOut(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={correctionStatus}
                  onChange={e => setCorrectionStatus(e.target.value as AttendanceStatus)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Correction * <span className="text-slate-400 font-normal">(Logged to System Audit Trail)</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Employee biometric scanner timeout verified by security register."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>This change will be permanently attributed to {currentUser?.fullName} ({currentUser?.role}) in the Wings HRMS Audit Log.</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectingRecord(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Commit Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
