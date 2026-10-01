import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUser,
  Employee,
  Department,
  AttendanceRecord,
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

import {
  initialEmployees,
  initialDepartments,
  initialAttendanceRecords,
  initialLeaveBalances,
  initialLeaveRequests,
  initialTasks,
  initialPerformanceReviews,
  initialPayrollRecords,
  initialDocuments,
  initialHolidays,
  initialAnnouncements,
  initialNotifications,
  initialAuditLogs,
  initialCompanySettings
} from '../lib/mockData';

interface HRMSContextType {
  currentUser: AuthUser | null;
  login: (role: UserRole, customEmail?: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  
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
  addEmployee: (emp: Omit<Employee, 'id' | 'employeeCode'>) => Employee;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  // Attendance actions
  todayAttendance: AttendanceRecord | undefined;
  checkIn: () => void;
  checkOut: () => void;
  correctAttendance: (recordId: string, changes: Partial<AttendanceRecord>, reason: string) => void;
  
  // Leave actions
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewLeave: (leaveId: string, status: 'Approved' | 'Rejected', comment: string) => void;
  cancelLeave: (leaveId: string) => void;
  
  // Task actions
  createTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTaskComment: (taskId: string, text: string) => void;
  deleteTask: (taskId: string) => void;
  
  // Performance actions
  submitPerformanceReview: (review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt' | 'finalRating'>) => void;
  
  // Payroll actions
  generateMonthlyPayroll: (monthYear: string) => void;
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => void;
  updatePayrollRecord: (payrollId: string, data: Partial<PayrollRecord>) => void;
  
  // Documents actions
  uploadDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate' | 'uploadedById' | 'uploadedByName'>) => void;
  deleteDocument: (docId: string) => void;
  
  // Department actions
  createDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => void;
  updateDepartment: (id: string, dept: Partial<Department>) => void;
  
  // Holiday actions
  createHoliday: (hol: Omit<Holiday, 'id'>) => void;
  deleteHoliday: (id: string) => void;
  
  // Announcement actions
  createAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt' | 'createdById' | 'createdByName'>) => void;
  deleteAnnouncement: (id: string) => void;
  
  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Settings actions
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // System
  resetAllData: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const HRMSContext = createContext<HRMSContextType | undefined>(undefined);

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`wings_hrms_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Storage read error:', e);
    return fallback;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`wings_hrms_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export const HRMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const cached = getStorage<AuthUser | null>('currentUser', null);
    if (cached && (cached.email === 'official.wingsmarketing@gmail.com' || cached.email === 'retail@wings-marketing.in' || cached.email === 'sakshijais0309@gmail.com') && !cached.avatarUrl && cached.designation?.includes('Admin')) {
      return cached;
    }
    return {
      id: 'usr-23',
      email: 'official.wingsmarketing@gmail.com',
      fullName: 'Harshita',
      role: 'super_admin',
      employeeId: 'emp-23',
      avatarUrl: '',
      designation: 'HR Org Admin',
      departmentId: 'dept-1'
    };
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const cached = getStorage<Employee[]>('employees', initialEmployees);
    // Invalidate if cache contains obsolete departments (e.g. dept-3, dept-4, etc.) or obsolete salaries (basic !== 15000 for manager or basic !== 10000 for executive)
    if (
      !cached || 
      cached.length !== initialEmployees.length || 
      cached.some(e => 
        e.avatarUrl !== '' || 
        (e.departmentId !== 'dept-1' && e.departmentId !== 'dept-2') ||
        (e.designation.includes('Manager') && e.salary.basic !== 15000) ||
        (e.designation.includes('Executive') && e.salary.basic !== 10000) ||
        (e.fullName === 'Sourav Roy' && e.designation !== 'HR Executive')
      )
    ) {
      setStorage('employees', initialEmployees);
      return initialEmployees;
    }
    return cached;
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const cached = getStorage<Department[]>('departments', initialDepartments);
    if (
      !cached || 
      cached.length !== 2 || 
      !cached.some(d => d.id === 'dept-1' && d.name === 'HR') || 
      !cached.some(d => d.id === 'dept-2' && d.name === 'Sales')
    ) {
      setStorage('departments', initialDepartments);
      return initialDepartments;
    }
    return cached;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const cached = getStorage<AttendanceRecord[]>('attendance', initialAttendanceRecords);
    if (!cached || cached.length < 30 || cached.some(a => a.checkIn === '09:20' || a.checkOut === '18:30')) {
      setStorage('attendance', initialAttendanceRecords);
      return initialAttendanceRecords;
    }
    return cached;
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => getStorage('leaveRequests', initialLeaveRequests));
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>(() => getStorage('leaveBalances', initialLeaveBalances));
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const cached = getStorage<TaskItem[]>('tasks', initialTasks);
    if (!cached || cached.some(t => t.title.includes('E-Commerce') || t.title.includes('Showreel'))) {
      setStorage('tasks', initialTasks);
      return initialTasks;
    }
    return cached;
  });
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>(() => {
    const cached = getStorage<PerformanceReview[]>('performanceReviews', initialPerformanceReviews);
    if (!cached || cached.some(r => r.managerComments.includes('digital store architecture'))) {
      setStorage('performanceReviews', initialPerformanceReviews);
      return initialPerformanceReviews;
    }
    return cached;
  });
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const cached = getStorage<PayrollRecord[]>('payrollRecords', initialPayrollRecords);
    if (!cached || cached.length < 30 || cached.some(p => p.grossSalary !== 30000 && p.grossSalary !== 20000)) {
      setStorage('payrollRecords', initialPayrollRecords);
      return initialPayrollRecords;
    }
    return cached;
  });
  const [documents, setDocuments] = useState<DocumentItem[]>(() => getStorage('documents', initialDocuments));
  const [holidays, setHolidays] = useState<Holiday[]>(() => getStorage('holidays', initialHolidays));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getStorage('announcements', initialAnnouncements));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStorage('notifications', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStorage('auditLogs', initialAuditLogs));
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const cached = getStorage<CompanySettings>('companySettings', initialCompanySettings);
    if (!cached || cached.officeStartTime !== '11:00' || cached.officeEndTime !== '20:00' || cached.logoUrl !== '') {
      const updated: CompanySettings = {
        ...initialCompanySettings,
        ...(cached || {}),
        logoUrl: '',
        officeStartTime: '11:00',
        officeEndTime: '20:00',
        workingHoursPerDay: 9
      };
      setStorage('companySettings', updated);
      return updated;
    }
    return cached;
  });

  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => { setStorage('currentUser', currentUser); }, [currentUser]);
  useEffect(() => { setStorage('employees', employees); }, [employees]);
  useEffect(() => { setStorage('departments', departments); }, [departments]);
  useEffect(() => { setStorage('attendance', attendance); }, [attendance]);
  useEffect(() => { setStorage('leaveRequests', leaveRequests); }, [leaveRequests]);
  useEffect(() => { setStorage('leaveBalances', leaveBalances); }, [leaveBalances]);
  useEffect(() => { setStorage('tasks', tasks); }, [tasks]);
  useEffect(() => { setStorage('performanceReviews', performanceReviews); }, [performanceReviews]);
  useEffect(() => { setStorage('payrollRecords', payrollRecords); }, [payrollRecords]);
  useEffect(() => { setStorage('documents', documents); }, [documents]);
  useEffect(() => { setStorage('holidays', holidays); }, [holidays]);
  useEffect(() => { setStorage('announcements', announcements); }, [announcements]);
  useEffect(() => { setStorage('notifications', notifications); }, [notifications]);
  useEffect(() => { setStorage('auditLogs', auditLogs); }, [auditLogs]);
  useEffect(() => { setStorage('companySettings', companySettings); }, [companySettings]);

  // Audit log helper
  const addAuditLog = (action: string, details: string, targetEmpId?: string, targetEmpName?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      performedById: currentUser?.employeeId || 'sys',
      performedByName: currentUser?.fullName || 'System',
      performedByRole: currentUser?.role || 'super_admin',
      action,
      targetEmployeeId: targetEmpId,
      targetEmployeeName: targetEmpName,
      details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 80 + 10),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Login handler
  const login = (role: UserRole, customEmail?: string): boolean => {
    let user: AuthUser;

    // Check if customEmail matches any employee
    if (customEmail) {
      const matched = employees.find(e => 
        e.workEmail.toLowerCase() === customEmail.toLowerCase() || 
        e.personalEmail.toLowerCase() === customEmail.toLowerCase() ||
        (e.mobileNumber && customEmail.includes(e.mobileNumber))
      );
      if (matched) {
        let mappedRole: UserRole = 'employee';
        if (matched.companyRole === 'Org. Admin') mappedRole = 'super_admin';
        else if (matched.companyRole === 'Manager') mappedRole = 'manager';
        else if (matched.designation.toLowerCase().includes('hr')) mappedRole = 'hr';

        user = {
          id: `usr-${matched.id}`,
          email: matched.workEmail,
          fullName: matched.fullName,
          role: mappedRole,
          employeeId: matched.id,
          avatarUrl: matched.avatarUrl,
          designation: matched.designation,
          departmentId: matched.departmentId
        };
        setCurrentUser(user);
        addAuditLog('User Login', `Signed in as ${user.fullName} (${user.role})`);
        return true;
      }
    }

    if (role === 'super_admin') {
      user = {
        id: 'usr-23',
        email: customEmail || 'official.wingsmarketing@gmail.com',
        fullName: 'Harshita',
        role: 'super_admin',
        employeeId: 'emp-23',
        avatarUrl: '',
        designation: 'HR Org Admin',
        departmentId: 'dept-1'
      };
    } else if (role === 'hr') {
      user = {
        id: 'usr-1',
        email: customEmail || 'varsha@wings-marketing.in',
        fullName: 'Varsha',
        role: 'hr',
        employeeId: 'emp-1',
        avatarUrl: '',
        designation: 'HR Manager',
        departmentId: 'dept-1'
      };
    } else if (role === 'manager') {
      user = {
        id: 'usr-11',
        email: customEmail || 'sakshijais0309@gmail.com',
        fullName: 'Sakshi Jaiswal',
        role: 'manager',
        employeeId: 'emp-11',
        avatarUrl: '',
        designation: 'Sales Manager',
        departmentId: 'dept-2'
      };
    } else {
      user = {
        id: 'usr-4',
        email: customEmail || 'subhasish.bose@wings-marketing.in',
        fullName: 'Subhasish Bose',
        role: 'employee',
        employeeId: 'emp-4',
        avatarUrl: '',
        designation: 'Sales Executive',
        departmentId: 'dept-2'
      };
    }
    setCurrentUser(user);
    addAuditLog('User Login', `Signed in as ${user.fullName} (${user.role})`);
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', `Signed out from ${currentUser.fullName}`);
    }
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    login(role);
  };

  // Find today's attendance for current employee
  const todayStr = '2026-09-28';
  const todayAttendance = attendance.find(
    a => a.employeeId === currentUser?.employeeId && a.date === todayStr
  );

  const checkIn = () => {
    if (!currentUser) return;
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
        id: `att-${Date.now()}`,
        employeeId: currentUser.employeeId,
        date: todayStr,
        checkIn: timeStr,
        workingHours: 0,
        breakMinutes: 0,
        overtimeHours: 0,
        status: status
      };
      setAttendance(prev => [newRec, ...prev]);
    }

    addAuditLog('Check In', `Checked in at ${timeStr} with status ${status}`, currentUser.employeeId, currentUser.fullName);
  };

  const checkOut = () => {
    if (!currentUser || !todayAttendance) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    // Calculate total hours
    let hoursWorked = 8.5;
    if (todayAttendance.checkIn) {
      const [cinH, cinM] = todayAttendance.checkIn.split(':').map(Number);
      const minutesWorked = (now.getHours() * 60 + now.getMinutes()) - (cinH * 60 + cinM);
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

    addAuditLog('Check Out', `Checked out at ${timeStr}. Total hours: ${hoursWorked}h`, currentUser.employeeId, currentUser.fullName);
  };

  const correctAttendance = (recordId: string, changes: Partial<AttendanceRecord>, reason: string) => {
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
    const newId = `emp-${Date.now()}`;

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
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...empData } : e));
    const emp = employees.find(e => e.id === id);
    addAuditLog('Employee Updated', `Updated employee record details`, id, emp?.fullName);
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    addAuditLog('Employee Deleted', `Removed employee ${emp?.fullName} (${emp?.employeeCode})`, id, emp?.fullName);
  };

  // Leave handling
  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newLeave: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setLeaveRequests(prev => [newLeave, ...prev]);

    const applicant = employees.find(e => e.id === req.employeeId);
    addAuditLog('Leave Applied', `Applied for ${req.totalDays} day(s) ${req.leaveType}`, req.employeeId, applicant?.fullName);

    // Notify HR
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Leave Request',
      message: `${applicant?.fullName} applied for ${req.totalDays} day(s) ${req.leaveType} (${req.startDate} to ${req.endDate}).`,
      type: 'leave',
      isRead: false,
      linkUrl: 'leave',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const reviewLeave = (leaveId: string, status: 'Approved' | 'Rejected', comment: string) => {
    const req = leaveRequests.find(l => l.id === leaveId);
    if (!req) return;
    const applicant = employees.find(e => e.id === req.employeeId);

    setLeaveRequests(prev => prev.map(l => l.id === leaveId ? {
      ...l,
      status,
      reviewedBy: currentUser?.fullName,
      reviewerComment: comment
    } : l));

    // Update leave balance if approved
    if (status === 'Approved') {
      setLeaveBalances(prev => {
        const empBalance = prev[req.employeeId] || { ...initialLeaveBalances.default };
        let category: 'casual' | 'sick' | 'paid' | 'wfh' = 'casual';
        if (req.leaveType === 'Sick Leave') category = 'sick';
        else if (req.leaveType === 'Paid Leave') category = 'paid';
        else if (req.leaveType === 'Work From Home') category = 'wfh';

        return {
          ...prev,
          [req.employeeId]: {
            ...empBalance,
            [category]: {
              ...empBalance[category],
              used: empBalance[category].used + req.totalDays
            }
          }
        };
      });
    }

    addAuditLog(
      `Leave ${status}`,
      `${status} leave for ${req.totalDays} day(s) (${req.leaveType}). Reviewer comment: ${comment}`,
      req.employeeId,
      applicant?.fullName
    );

    // Send notification to employee
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: req.employeeId,
      title: `Leave ${status}`,
      message: `Your ${req.leaveType} request for ${req.startDate} has been ${status.toLowerCase()} by ${currentUser?.fullName}.`,
      type: 'leave',
      isRead: false,
      linkUrl: 'leave',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const cancelLeave = (leaveId: string) => {
    setLeaveRequests(prev => prev.map(l => l.id === leaveId ? { ...l, status: 'Cancelled' } : l));
  };

  // Task handling
  const createTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      comments: [],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    setTasks(prev => [newTask, ...prev]);

    const assignee = employees.find(e => e.id === taskData.assignedToId);
    addAuditLog('Task Created', `Created task "${taskData.title}" assigned to ${assignee?.fullName}`, taskData.assignedToId, assignee?.fullName);

    // Notify assignee
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: taskData.assignedToId,
      title: 'New Task Assigned',
      message: `You were assigned: "${taskData.title}". Deadline: ${taskData.deadline}.`,
      type: 'task',
      isRead: false,
      linkUrl: 'tasks',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setNotifications(prev => [notif, ...prev]);
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
      id: `tc-${Date.now()}`,
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
      id: `rev-${Date.now()}`,
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
        const totalDeductions = sal.pf + sal.esi + sal.professionalTax + sal.tds + sal.otherDeductions;
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
          lateDeduction: 0,
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
      id: `doc-${Date.now()}`,
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
      id: `dept-${Date.now()}`,
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
      id: `hol-${Date.now()}`
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
      id: `ann-${Date.now()}`,
      createdById: currentUser?.employeeId || 'sys',
      createdByName: currentUser?.fullName || 'Administrator',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addAuditLog('Announcement Created', `Published announcement: "${ann.title}" for audience: ${ann.audience}`);

    // Broadcast notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Announcement',
      message: ann.title,
      type: 'announcement',
      isRead: false,
      linkUrl: 'announcements',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setNotifications(prev => [notif, ...prev]);
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

  // Reset to initial demo
  const resetAllData = () => {
    setEmployees(initialEmployees);
    setDepartments(initialDepartments);
    setAttendance(initialAttendanceRecords);
    setLeaveRequests(initialLeaveRequests);
    setLeaveBalances(initialLeaveBalances);
    setTasks(initialTasks);
    setPerformanceReviews(initialPerformanceReviews);
    setPayrollRecords(initialPayrollRecords);
    setDocuments(initialDocuments);
    setHolidays(initialHolidays);
    setAnnouncements(initialAnnouncements);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setCompanySettings(initialCompanySettings);
    addAuditLog('Demo Database Reset', 'Restored all Wings HRMS tables to pristine demonstration seed');
  };

  return (
    <HRMSContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchRole,
        employees,
        departments,
        attendance,
        leaveRequests,
        leaveBalances,
        tasks,
        performanceReviews,
        payrollRecords,
        documents,
        holidays,
        announcements,
        notifications,
        auditLogs,
        companySettings,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        todayAttendance,
        checkIn,
        checkOut,
        correctAttendance,
        applyLeave,
        reviewLeave,
        cancelLeave,
        createTask,
        updateTaskStatus,
        addTaskComment,
        deleteTask,
        submitPerformanceReview,
        generateMonthlyPayroll,
        updatePayrollStatus,
        updatePayrollRecord,
        uploadDocument,
        deleteDocument,
        createDepartment,
        updateDepartment,
        createHoliday,
        deleteHoliday,
        createAnnouncement,
        deleteAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
        updateCompanySettings,
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
