import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUser,
  Employee,
  Department,
  AttendanceRecord,
  AttendanceBreakSession,
  LeaveRequest,
  LeaveBalance,
  TaskItem,
  PerformanceReview,
  PayrollRecord,
  DocumentItem,
  Holiday,
  Announcement,
  NotificationItem,
  AuditLog,
  CompanySettings,
  UserRole,
  AttendanceStatus,
  TaskStatus,
  LeaveStatus,
  PayrollStatus
} from '../types';

import { useDatabaseStore } from './useDatabaseStore';
import { downloadDocument } from '../lib/hrmsDatabase';
import { requireSupabase } from '../lib/supabase';

interface HRMSContextType {
  currentUser: AuthUser | null;
  todayDate: string;
  currentBreakWindow: { id: string; label: string } | null;
  authenticate: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  loading: boolean;
  saving: boolean;
  message: { kind: 'error' | 'success'; text: string } | null;
  dismissMessage: () => void;
  downloadStoredDocument: (doc: DocumentItem) => Promise<void>;
  
  // Data
  employees: Employee[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance>;
  tasks: TaskItem[];
  performanceReviews: PerformanceReview[];
  payrollRecords: PayrollRecord[];
  documents: DocumentItem[];
  holidays: Holiday[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  companySettings: CompanySettings;
  
  // Employee actions
  addEmployee: (emp: Omit<Employee, 'id' | 'employeeCode'>) => Promise<Employee | null>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<boolean>;
  deactivateEmployee: (id: string) => Promise<boolean>;
  reactivateEmployee: (id: string) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  
  // Attendance actions
  todayAttendance: AttendanceRecord | undefined;
  checkIn: () => Promise<boolean>;
  checkOut: () => Promise<boolean>;
  startBreak: () => Promise<boolean>;
  endBreak: () => Promise<boolean>;
  correctAttendance: (recordId: string, changes: Partial<AttendanceRecord>, reason: string) => Promise<boolean>;
  
  // Leave actions
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  reviewLeave: (leaveId: string, status: 'Approved' | 'Rejected', comment: string) => Promise<boolean>;
  cancelLeave: (leaveId: string) => Promise<boolean>;
  
  // Task actions
  createTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<boolean>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<boolean>;
  addTaskComment: (taskId: string, text: string) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  
  // Performance actions
  submitPerformanceReview: (review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt' | 'finalRating'>) => Promise<boolean>;
  
  // Payroll actions
  generateMonthlyPayroll: (monthYear: string) => Promise<boolean>;
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => Promise<boolean>;
  updatePayrollRecord: (payrollId: string, data: Partial<PayrollRecord>) => Promise<boolean>;
  
  // Documents actions
  uploadDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate' | 'uploadedById' | 'uploadedByName'>, file: File) => Promise<boolean>;
  deleteDocument: (docId: string) => Promise<boolean>;
  
  // Department actions
  createDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => Promise<boolean>;
  updateDepartment: (id: string, dept: Partial<Department>) => Promise<boolean>;
  
  // Holiday actions
  createHoliday: (hol: Omit<Holiday, 'id'>) => Promise<boolean>;
  deleteHoliday: (id: string) => Promise<boolean>;
  
  // Announcement actions
  createAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt' | 'createdById' | 'createdByName'>) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  
  // Notification actions
  markNotificationRead: (id: string) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  
  // Settings actions
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<boolean>;
  
  // System
  resetAllData: () => Promise<boolean>;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const HRMSContext = createContext<HRMSContextType | undefined>(undefined);

interface ScheduledBreakWindow {
  id: string;
  label: string;
  startMinute: number;
  endMinute: number;
}

const BREAK_WINDOWS: ScheduledBreakWindow[] = [
  { id: 'lunch', label: '1:30 PM - 2:00 PM', startMinute: 13 * 60 + 30, endMinute: 14 * 60 },
  { id: 'afternoon', label: '4:30 PM - 4:45 PM', startMinute: 16 * 60 + 30, endMinute: 16 * 60 + 45 },
  { id: 'evening', label: '6:30 PM - 6:45 PM', startMinute: 18 * 60 + 30, endMinute: 18 * 60 + 45 }
];

function getBreakWindowAt(date: Date): ScheduledBreakWindow | null {
  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  return BREAK_WINDOWS.find(window => minuteOfDay >= window.startMinute && minuteOfDay < window.endMinute) || null;
}

function getNextBreakBoundary(date: Date): number {
  const now = date.getTime();
  const futureBoundaries = BREAK_WINDOWS.flatMap(window => [window.startMinute, window.endMinute])
    .map(minuteOfDay => {
      const boundary = new Date(date);
      boundary.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
      return boundary.getTime();
    })
    .filter(timestamp => timestamp > now);

  if (futureBoundaries.length) return Math.min(...futureBoundaries);

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(13, 30, 0, 0);
  return tomorrow.getTime();
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const HRMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const database = useDatabaseStore();
  const { currentUser, authenticate, logout } = database;
  const { employees, departments, attendance, leaveRequests, leaveBalances, tasks, performanceReviews, payrollRecords, documents, holidays, announcements, notifications, auditLogs, companySettings } = database.data;
  const setEmployees = database.setter('employees');
  const setDepartments = database.setter('departments');
  const setAttendance = database.setter('attendance');
  const setLeaveRequests = database.setter('leaveRequests');
  const setLeaveBalances = database.setter('leaveBalances');
  const setTasks = database.setter('tasks');
  const setPerformanceReviews = database.setter('performanceReviews');
  const setPayrollRecords = database.setter('payrollRecords');
  const setDocuments = database.setter('documents');
  const setHolidays = database.setter('holidays');
  const setAnnouncements = database.setter('announcements');
  const setNotifications = database.setter('notifications');
  const setCompanySettings = database.setter('companySettings');

  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [todayDate, setTodayDate] = useState(() => getLocalDateString(new Date()));
  const [currentBreakWindow, setCurrentBreakWindow] = useState(() => getBreakWindowAt(new Date()));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = window.setTimeout(
      () => setTodayDate(getLocalDateString(new Date())),
      nextMidnight.getTime() - now.getTime() + 50
    );

    return () => window.clearTimeout(timeout);
  }, [todayDate]);

  useEffect(() => {
    let timeout: number;
    const updateBreakWindow = () => {
      const now = new Date();
      setCurrentBreakWindow(getBreakWindowAt(now));
      timeout = window.setTimeout(
        updateBreakWindow,
        Math.max(50, getNextBreakBoundary(now) - now.getTime() + 50)
      );
    };

    updateBreakWindow();
    return () => window.clearTimeout(timeout);
  }, []);

  // Auditing is generated by database triggers, with the authenticated actor.
  const addAuditLog = (..._args: unknown[]) => {};
  const switchRole = (_role: UserRole) => {
    database.fail(new Error('Roles are assigned by your administrator. Sign in with the appropriate account.'));
  };

  // Find today's attendance for current employee
  const todayAttendance = attendance.find(
    a => a.employeeId === currentUser?.employeeId && a.date === todayDate
  );

  const checkIn = () => {
    if (!currentUser || todayAttendance?.checkIn) return;
    if (!window.confirm('Are you sure you want to punch in?')) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // Determine status based on office start time and grace period
    const [startH, startM] = companySettings.officeStartTime.split(':').map(Number);
    const startTotalM = startH * 60 + startM;
    const graceCutoff = startTotalM + companySettings.gracePeriodMinutes;
    const currentTotalM = now.getHours() * 60 + now.getMinutes();

    let status: AttendanceStatus = 'Present';
    if (currentTotalM > graceCutoff) {
      status = 'Late';
    }

    if (todayAttendance) {
      // Already has record, update checkIn
      setAttendance(prev => prev.map(a => a.id === todayAttendance.id ? {
        ...a,
        checkIn: timeStr,
        status: status
      } : a));
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${crypto.randomUUID()}`,
        employeeId: currentUser.employeeId,
        date: todayDate,
        checkIn: timeStr,
        workingHours: 0,
        breakMinutes: 0,
        overtimeHours: 0,
        status: status
      };
      setAttendance(prev => [newRec, ...prev]);
    }

    addAuditLog('Punch In', `Punched in at ${timeStr} with status ${status}`, currentUser.employeeId, currentUser.fullName);
  };

  const checkOut = () => {
    if (!currentUser || !todayAttendance) return;
    if (todayAttendance.breakSessions?.some(session => !session.endedAt)) {
      window.alert('End your break before punching out.');
      return;
    }
    if (!window.confirm('Are you sure you want to punch out?')) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // Calculate total hours
    let hoursWorked = 8.5;
    if (todayAttendance.checkIn) {
      const [cinH, cinM] = todayAttendance.checkIn.split(':').map(Number);
      const minutesWorked = (now.getHours() * 60 + now.getMinutes()) - (cinH * 60 + cinM) - todayAttendance.breakMinutes;
      hoursWorked = Math.max(0.1, Number((minutesWorked / 60).toFixed(1)));
    }

    const overtime = Math.max(0, Number((hoursWorked - companySettings.workingHoursPerDay).toFixed(1)));
    let status = todayAttendance.status;
    if (hoursWorked < companySettings.minHalfDayHours) {
      status = 'Half Day';
    }

    setAttendance(prev => prev.map(a => a.id === todayAttendance.id ? {
      ...a,
      checkOut: timeStr,
      workingHours: hoursWorked,
      overtimeHours: overtime,
      status: status
    } : a));

    addAuditLog('Punch Out', `Punched out at ${timeStr}. Total hours: ${hoursWorked}h`, currentUser.employeeId, currentUser.fullName);
  };

  const startBreak = () => {
    if (!currentUser || !todayAttendance?.checkIn || todayAttendance.checkOut) return;

    const now = new Date();
    const breakWindow = getBreakWindowAt(now);
    if (!breakWindow) return;

    const sessions = todayAttendance.breakSessions || [];
    if (sessions.some(session => session.windowId === breakWindow.id) || sessions.some(session => !session.endedAt)) return;

    const newSession: AttendanceBreakSession = {
      windowId: breakWindow.id,
      startedAt: now.toISOString()
    };
    setAttendance(prev => prev.map(record => record.id === todayAttendance.id ? {
      ...record,
      breakSessions: [...(record.breakSessions || []), newSession]
    } : record));
    addAuditLog('Break Started', `Started break during ${breakWindow.label}`, currentUser.employeeId, currentUser.fullName);
  };

  const endBreak = () => {
    if (!currentUser || !todayAttendance) return;
    const activeSession = todayAttendance.breakSessions?.find(session => !session.endedAt);
    if (!activeSession) return;

    const now = new Date();
    const durationMinutes = Math.max(1, Math.ceil((now.getTime() - new Date(activeSession.startedAt).getTime()) / 60000));
    setAttendance(prev => prev.map(record => record.id === todayAttendance.id ? {
      ...record,
      breakMinutes: record.breakMinutes + durationMinutes,
      breakSessions: (record.breakSessions || []).map(session =>
        session.windowId === activeSession.windowId && session.startedAt === activeSession.startedAt
          ? { ...session, endedAt: now.toISOString() }
          : session
      )
    } : record));
    addAuditLog('Break Ended', `Ended break after ${durationMinutes} minute(s)`, currentUser.employeeId, currentUser.fullName);
  };

  const correctAttendance = (recordId: string, changes: Partial<AttendanceRecord>, reason: string) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role)) return;

    const record = attendance.find(a => a.id === recordId);
    const targetEmp = employees.find(e => e.id === record?.employeeId);

    setAttendance(prev => prev.map(a => {
      if (a.id === recordId) {
        return {
          ...a,
          ...changes,
          isManualCorrection: true,
          correctedBy: currentUser?.fullName || 'HR Administrator',
          correctionReason: reason
        };
      }
      return a;
    }));

    addAuditLog(
      'Attendance Corrected',
      `Manual correction: ${reason}. Changes: ${JSON.stringify(changes)}`,
      record?.employeeId,
      targetEmp?.fullName
    );
  };

  // Employee CRUD
  const addEmployee = (empData: Omit<Employee, 'id' | 'employeeCode'>): Employee => {
    // Generate next WC code
    const maxNum = employees.reduce((max, e) => {
      const num = parseInt(e.employeeCode.replace('WC-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextCode = `WC-${String(maxNum + 1).padStart(3, '0')}`;
    const newId = `emp-${crypto.randomUUID()}`;

    const newEmployee: Employee = {
      ...empData,
      id: newId,
      employeeCode: nextCode,
    };

    setEmployees(prev => [...prev, newEmployee]);
    addAuditLog('Employee Created', `Created employee ${newEmployee.fullName} (${nextCode}) in ${newEmployee.designation}`, newId, newEmployee.fullName);
    return newEmployee;
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role)) return;

    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...empData } : e));
    const emp = employees.find(e => e.id === id);
    addAuditLog('Employee Updated', `Updated employee record details`, id, emp?.fullName);
  };

  const deactivateEmployee = (id: string) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role) || currentUser.employeeId === id) return;
    const emp = employees.find(e => e.id === id);
    if (!emp || emp.status === 'Deactivated') return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'Deactivated' } : e));
    addAuditLog('Employee Deactivated', `Deactivated profile for ${emp.fullName} (${emp.employeeCode})`, id, emp.fullName);
  };

  const reactivateEmployee = (id: string) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role) || currentUser.employeeId === id) return;
    const emp = employees.find(e => e.id === id);
    if (!emp || emp.status !== 'Deactivated') return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'Active' } : e));
    addAuditLog('Employee Reactivated', `Reactivated profile for ${emp.fullName} (${emp.employeeCode})`, id, emp.fullName);
  };

  const deleteEmployee = (id: string) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role) || currentUser.employeeId === id) return;
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    setEmployees(prev => prev
      .filter(employee => employee.id !== id)
      .map(employee => employee.managerId === id
        ? { ...employee, managerId: undefined, reportingTo: undefined }
        : employee));
    setDepartments(prev => prev.map(department => department.managerId === id
      ? { ...department, managerId: undefined }
      : department));
    setAttendance(prev => prev.filter(record => record.employeeId !== id));
    setLeaveRequests(prev => prev.filter(request => request.employeeId !== id));
    setLeaveBalances(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setTasks(prev => prev
      .filter(task => task.assignedToId !== id)
      .map(task => ({
        ...task,
        createdById: task.createdById === id ? currentUser.employeeId : task.createdById,
        comments: task.comments.filter(comment => comment.authorId !== id)
      })));
    setPerformanceReviews(prev => prev.filter(review => review.employeeId !== id && review.reviewerId !== id));
    setPayrollRecords(prev => prev.filter(record => record.employeeId !== id));
    setDocuments(prev => prev.filter(document => document.employeeId !== id));
    setNotifications(prev => prev.filter(notification => notification.userId !== id));
    setAnnouncements(prev => prev
      .filter(announcement => announcement.targetEmployeeId !== id)
      .map(announcement => announcement.createdById === id
        ? { ...announcement, createdById: 'system', createdByName: 'Wings Corporation' }
        : announcement));

    addAuditLog('Employee Profile Deleted', `Permanently deleted profile for ${emp.fullName} (${emp.employeeCode})`, id, emp.fullName);
  };

  // Leave handling
  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newLeave: LeaveRequest = {
      ...req,
      id: `leave-${crypto.randomUUID()}`,
      status: 'Pending',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setLeaveRequests(prev => [newLeave, ...prev]);

    const applicant = employees.find(e => e.id === req.employeeId);
    addAuditLog('Leave Applied', `Applied for ${req.totalDays} day(s) ${req.leaveType}`, req.employeeId, applicant?.fullName);


  };

  const reviewLeave = (leaveId: string, status: 'Approved' | 'Rejected', comment: string) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role)) return;

    const req = leaveRequests.find(l => l.id === leaveId);
    if (!req || req.status !== 'Pending') return;
    const applicant = employees.find(e => e.id === req.employeeId);

    setLeaveRequests(prev => prev.map(l => l.id === leaveId ? {
      ...l,
      status,
      reviewedBy: currentUser?.fullName,
      reviewerComment: comment
    } : l));

    addAuditLog(
      `Leave ${status}`,
      `${status} leave for ${req.totalDays} day(s) (${req.leaveType}). Reviewer comment: ${comment}`,
      req.employeeId,
      applicant?.fullName
    );


  };

  const cancelLeave = (leaveId: string) => {
    setLeaveRequests(prev => prev.map(l => l.id === leaveId && l.status === 'Pending' ? { ...l, status: 'Cancelled' } : l));
  };

  // Task handling
  const createTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${crypto.randomUUID()}`,
      comments: [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    setTasks(prev => [newTask, ...prev]);

    const assignee = employees.find(e => e.id === taskData.assignedToId);
    addAuditLog('Task Created', `Created task "${taskData.title}" assigned to ${assignee?.fullName}`, taskData.assignedToId, assignee?.fullName);


  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status,
      updatedAt: new Date().toISOString().slice(0, 10)
    } : t));
  };

  const addTaskComment = (taskId: string, text: string) => {
    if (!currentUser) return;
    const newComment = {
      id: `tc-${crypto.randomUUID()}`,
      taskId,
      authorId: currentUser.employeeId,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatarUrl,
      text,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      comments: [...t.comments, newComment],
      updatedAt: new Date().toISOString().slice(0, 10)
    } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Performance handling
  const submitPerformanceReview = (reviewData: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt' | 'finalRating'>) => {
    const avg = Number((
      (reviewData.qualityOfWork +
       reviewData.productivity +
       reviewData.communication +
       reviewData.teamwork +
       reviewData.punctuality +
       reviewData.responsibility) / 6
    ).toFixed(1));

    const newRev: PerformanceReview = {
      ...reviewData,
      id: `rev-${crypto.randomUUID()}`,
      finalRating: avg,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    setPerformanceReviews(prev => [newRev, ...prev]);
    const emp = employees.find(e => e.id === reviewData.employeeId);
    addAuditLog('Performance Review Submitted', `Submitted review for ${emp?.fullName} (${reviewData.reviewPeriod}) with rating ${avg}/5`, reviewData.employeeId, emp?.fullName);
  };

  // Payroll handling
  const generateMonthlyPayroll = (monthYear: string) => {
    // Generate for all active employees
    const newRecords: PayrollRecord[] = employees
      .filter(e => e.status === 'Active' || e.status === 'Probation')
      .map(emp => {
        const sal = emp.salary;
        const gross = sal.basic + sal.hra + sal.allowances + sal.incentives + sal.bonus;
        const [startHour, startMinute] = companySettings.officeStartTime.split(':').map(Number);
        const graceCutoff = startHour * 60 + startMinute + companySettings.gracePeriodMinutes;
        const lateDates = new Set(attendance.filter(record => {
          if (record.employeeId !== emp.id || !record.date.startsWith(`${monthYear}-`) || !record.checkIn) return false;
          const [checkInHour, checkInMinute] = record.checkIn.split(':').map(Number);
          return record.status === 'Late' || checkInHour * 60 + checkInMinute > graceCutoff;
        }).map(record => record.date));
        const lateDeduction = Math.round((Math.floor(lateDates.size / 3) * gross / 30) * 100) / 100;
        const totalDeductions = sal.pf + sal.esi + sal.professionalTax + sal.tds + sal.otherDeductions + lateDeduction;
        const net = Math.max(0, gross - totalDeductions);

        return {
          id: `pay-${monthYear}-${emp.id}`,
          monthYear,
          employeeId: emp.id,
          basicSalary: sal.basic,
          hra: sal.hra,
          allowances: sal.allowances,
          incentives: sal.incentives,
          bonus: sal.bonus,
          overtime: 0,
          grossSalary: gross,
          lateDeduction,
          leaveWithoutPay: 0,
          pf: sal.pf,
          esi: sal.esi,
          professionalTax: sal.professionalTax,
          tds: sal.tds,
          advance: 0,
          otherDeduction: sal.otherDeductions,
          totalDeductions,
          netSalary: net,
          status: 'Draft' as PayrollStatus,
          generatedAt: new Date().toISOString().slice(0, 10),
          generatedBy: currentUser?.fullName || 'HR Manager'
        };
      });

    // Replace existing records for this monthYear or append
    setPayrollRecords(prev => {
      const filtered = prev.filter(p => p.monthYear !== monthYear);
      return [...filtered, ...newRecords];
    });

    addAuditLog('Payroll Batch Generated', `Generated draft payroll for ${newRecords.length} employees for ${monthYear}`);
  };

  const updatePayrollStatus = (payrollId: string, status: PayrollStatus) => {
    setPayrollRecords(prev => prev.map(p => p.id === payrollId ? {
      ...p,
      status,
      paymentDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : p.paymentDate
    } : p));
  };

  const updatePayrollRecord = (payrollId: string, data: Partial<PayrollRecord>) => {
    if (!currentUser || !['super_admin', 'hr', 'manager'].includes(currentUser.role)) return;

    setPayrollRecords(prev => prev.map(p => {
      if (p.id === payrollId) {
        const updated = { ...p, ...data };
        // Recalculate gross, total deductions, net
        const gross = (updated.basicSalary || 0) + (updated.hra || 0) + (updated.allowances || 0) + (updated.incentives || 0) + (updated.bonus || 0) + (updated.overtime || 0);
        const totalDeductions = (updated.pf || 0) + (updated.esi || 0) + (updated.professionalTax || 0) + (updated.tds || 0) + (updated.lateDeduction || 0) + (updated.leaveWithoutPay || 0) + (updated.advance || 0) + (updated.otherDeduction || 0);
        const net = Math.max(0, gross - totalDeductions);
        return {
          ...updated,
          grossSalary: gross,
          totalDeductions,
          netSalary: net
        };
      }
      return p;
    }));
  };

  // Documents
  const uploadDocument = (doc: Omit<DocumentItem, 'id' | 'uploadDate' | 'uploadedById' | 'uploadedByName'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${crypto.randomUUID()}`,
      uploadDate: new Date().toISOString().slice(0, 10),
      uploadedById: currentUser?.employeeId || 'sys',
      uploadedByName: currentUser?.fullName || 'System User'
    };
    setDocuments(prev => [newDoc, ...prev]);
    const emp = employees.find(e => e.id === doc.employeeId);
    addAuditLog('Document Uploaded', `Uploaded ${doc.title} (${doc.category})`, doc.employeeId, emp?.fullName);
  };

  const deleteDocument = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
    addAuditLog('Document Deleted', `Deleted document ${doc?.title}`, doc?.employeeId);
  };

  // Departments
  const createDepartment = (dept: Omit<Department, 'id' | 'createdAt'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setDepartments(prev => [...prev, newDept]);
    addAuditLog('Department Created', `Created department ${dept.name} (${dept.code})`);
  };

  const updateDepartment = (id: string, dept: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...dept } : d));
    addAuditLog('Department Updated', `Updated department settings for ${id}`);
  };

  // Holidays
  const createHoliday = (hol: Omit<Holiday, 'id'>) => {
    const newHol: Holiday = {
      ...hol,
      id: `hol-${crypto.randomUUID()}`
    };
    setHolidays(prev => [...prev, newHol]);
    addAuditLog('Holiday Created', `Added company holiday ${hol.name} on ${hol.date}`);
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  // Announcements
  const createAnnouncement = (ann: Omit<Announcement, 'id' | 'createdAt' | 'createdById' | 'createdByName'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${crypto.randomUUID()}`,
      createdById: currentUser?.employeeId || 'sys',
      createdByName: currentUser?.fullName || 'Administrator',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addAuditLog('Announcement Created', `Published announcement: "${ann.title}" for audience: ${ann.audience}`);


  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Settings
  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('Company Settings Updated', 'Modified corporate HRMS operational rules and company profile');
  };

  // Never reset a production database to mock records.
  const resetAllData = async () => {
    database.fail(new Error('Demo reset is disabled for the permanent database. No records were changed.'));
    return false;
  };

  const uploadStoredDocument = async (doc: Omit<DocumentItem, 'id' | 'uploadDate' | 'uploadedById' | 'uploadedByName'>, file: File) => {
    if (!database.companyId || !currentUser || !file) return false;
    if (file.size > 25 * 1024 * 1024) { database.fail(new Error('Maximum document size is 25 MB.')); return false; }
    const owner = doc.isCompanyWide ? 'company' : doc.employeeId || currentUser.employeeId;
    const path = database.companyId + '/' + owner + '/' + crypto.randomUUID() + '/' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    try {
      const client = requireSupabase();
      const { error } = await client.storage.from('hrms-documents').upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const saved = await database.action(uploadDocument)({ ...doc, employeeId: doc.isCompanyWide ? undefined : owner, fileUrl: path, fileType: file.type, fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB' });
      if (!saved) {
        const cleanup = await client.storage.from('hrms-documents').remove([path]);
        if (cleanup.error) database.fail(new Error('Record save failed and upload cleanup failed. Ask an administrator to remove the orphan file.'));
      }
      return !!saved;
    } catch (error) { database.fail(error); return false; }
  };
  const downloadStoredDocument = async (doc: DocumentItem) => {
    try { await downloadDocument(doc); } catch (error) { database.fail(error); }
  };

  const isEmployeeRole = currentUser?.role === 'employee';
  const employeeId = currentUser?.employeeId;
  const signedInEmployee = employees.find(employee => employee.id === employeeId);
  const visibleEmployees = isEmployeeRole
    ? employees.filter(employee => employee.id === employeeId).map(employee => ({
        ...employee,
        managerId: undefined,
        reportingTo: undefined
      }))
    : employees;
  const visibleDepartments = isEmployeeRole
    ? departments
        .filter(department => department.id === signedInEmployee?.departmentId)
        .map(department => ({ ...department, managerId: undefined }))
    : departments;
  const visibleAttendance = isEmployeeRole
    ? attendance.filter(record => record.employeeId === employeeId)
    : attendance;
  const visibleLeaveRequests = isEmployeeRole
    ? leaveRequests
        .filter(request => request.employeeId === employeeId)
        .map(request => ({ ...request, reviewedBy: undefined, reviewerComment: undefined }))
    : leaveRequests;
  const visibleLeaveBalances: Record<string, LeaveBalance> = isEmployeeRole
    ? employeeId && leaveBalances[employeeId]
      ? { [employeeId]: leaveBalances[employeeId] }
      : {}
    : leaveBalances;
  const visibleTasks = isEmployeeRole
    ? tasks
        .filter(task => task.assignedToId === employeeId)
        .map(task => ({
          ...task,
          createdById: employeeId || '',
          comments: task.comments?.filter(comment => comment.authorId === employeeId) || []
        }))
    : tasks;
  const visiblePerformanceReviews = isEmployeeRole
    ? performanceReviews
        .filter(review => review.employeeId === employeeId)
        .map(review => ({ ...review, reviewerId: '', managerComments: '' }))
    : performanceReviews;
  const visiblePayrollRecords = isEmployeeRole
    ? payrollRecords
        .filter(record => record.employeeId === employeeId)
        .map(record => ({ ...record, generatedBy: undefined }))
    : payrollRecords;
  const visibleDocuments = isEmployeeRole
    ? documents
        .filter(document => document.employeeId === employeeId || document.isCompanyWide)
        .map(document => document.isCompanyWide
          ? { ...document, uploadedById: 'company', uploadedByName: 'Wings Corporation' }
          : document)
    : documents;
  const visibleAnnouncements = isEmployeeRole
    ? announcements
        .filter(announcement =>
          announcement.audience === 'Everyone' ||
          (announcement.audience === 'Specific Department' && announcement.targetDepartmentId === signedInEmployee?.departmentId) ||
          (announcement.audience === 'Individual Employees' && announcement.targetEmployeeId === employeeId)
        )
        .map(announcement => ({ ...announcement, createdById: '', createdByName: 'Wings Corporation' }))
    : announcements;
  const visibleNotifications = isEmployeeRole
    ? notifications.filter(notification => notification.userId === employeeId)
    : notifications;
  const visibleAuditLogs = isEmployeeRole ? [] : auditLogs;

  return (
    <HRMSContext.Provider
      value={{
        currentUser,
        loading: database.loading,
        saving: database.saving,
        message: database.message,
        dismissMessage: database.dismissMessage,
        todayDate,
        currentBreakWindow,
        authenticate,
        logout,
        switchRole,
        employees: visibleEmployees,
        departments: visibleDepartments,
        attendance: visibleAttendance,
        leaveRequests: visibleLeaveRequests,
        leaveBalances: visibleLeaveBalances,
        tasks: visibleTasks,
        performanceReviews: visiblePerformanceReviews,
        payrollRecords: visiblePayrollRecords,
        documents: visibleDocuments,
        holidays,
        announcements: visibleAnnouncements,
        notifications: visibleNotifications,
        auditLogs: visibleAuditLogs,
        companySettings,
        addEmployee: database.action(addEmployee),
        updateEmployee: database.action(updateEmployee),
        deactivateEmployee: database.action(deactivateEmployee),
        reactivateEmployee: database.action(reactivateEmployee),
        deleteEmployee: database.action(deleteEmployee),
        todayAttendance,
        checkIn: database.action(checkIn),
        checkOut: database.action(checkOut),
        startBreak: database.action(startBreak),
        endBreak: database.action(endBreak),
        correctAttendance: database.action(correctAttendance),
        applyLeave: database.action(applyLeave),
        reviewLeave: database.action(reviewLeave),
        cancelLeave: database.action(cancelLeave),
        createTask: database.action(createTask),
        updateTaskStatus: database.action(updateTaskStatus),
        addTaskComment: database.action(addTaskComment),
        deleteTask: database.action(deleteTask),
        submitPerformanceReview: database.action(submitPerformanceReview),
        generateMonthlyPayroll: database.action(generateMonthlyPayroll),
        updatePayrollStatus: database.action(updatePayrollStatus),
        updatePayrollRecord: database.action(updatePayrollRecord),
        uploadDocument: uploadStoredDocument,
        downloadStoredDocument,
        deleteDocument: database.action(deleteDocument),
        createDepartment: database.action(createDepartment),
        updateDepartment: database.action(updateDepartment),
        createHoliday: database.action(createHoliday),
        deleteHoliday: database.action(deleteHoliday),
        createAnnouncement: database.action(createAnnouncement),
        deleteAnnouncement: database.action(deleteAnnouncement),
        markNotificationRead: database.action(markNotificationRead),
        markAllNotificationsRead: database.action(markAllNotificationsRead),
        updateCompanySettings: database.action(updateCompanySettings),
        resetAllData,
        activeNav,
        setActiveNav,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen
      }}
    >
      {children}
    </HRMSContext.Provider>
  );
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) {
    throw new Error('useHRMS must be used within an HRMSProvider');
  }
  return context;
};
