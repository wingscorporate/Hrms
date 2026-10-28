export type UserRole = 'super_admin' | 'hr' | 'manager' | 'employee';

export type EmploymentType = 'Full Time' | 'Part Time' | 'Intern' | 'Contract' | 'Freelancer';

export type EmployeeStatus = 'Active' | 'Probation' | 'Notice Period' | 'Resigned' | 'Terminated' | 'Inactive' | 'Deactivated';

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Half Day' | 'Leave' | 'Work From Home';

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave' | 'Half Day' | 'Work From Home';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Completed';

export type PayrollStatus = 'Draft' | 'Under Review' | 'Approved' | 'Paid';

export type HolidayType = 'National Holiday' | 'Company Holiday' | 'Optional Holiday';

export type AnnouncementAudience = 'Everyone' | 'Specific Department' | 'Managers Only' | 'Individual Employees';

export type DocumentCategory = 
  | 'Identity Documents' 
  | 'Employment Documents' 
  | 'Salary Documents' 
  | 'Certificates' 
  | 'Company Documents' 
  | 'Other Documents'
  | 'Identity'
  | 'Employment'
  | 'Salary'
  | 'Company Policy'
  | 'Other';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  panNumber?: string;
  branchName?: string;
}

export interface SalaryStructure {
  basic: number;
  hra: number;
  allowances: number;
  incentives: number;
  bonus: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. WC-001
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  personalEmail: string;
  workEmail: string;
  phone: string;
  mobileNumber?: string;
  reportingTo?: string;
  companyRole?: 'Org. Admin' | 'Manager' | 'Executive';
  expiryDate?: string;
  emergencyContact: EmergencyContact;
  currentAddress: string;
  permanentAddress: string;
  departmentId: string;
  designation: string;
  managerId?: string;
  joiningDate: string;
  employmentType: EmploymentType;
  workLocation: string;
  probationPeriodMonths: number;
  status: EmployeeStatus;
  salary: SalaryStructure;
  bankDetails: BankDetails;
  pan?: string;
  aadhaar?: string;
  uan?: string;
  documents?: any[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  description: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  workingHours: number; // e.g. 8.5
  breakMinutes: number;
  breakSessions?: AttendanceBreakSession[];
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  isManualCorrection?: boolean;
  correctedBy?: string;
  correctionReason?: string;
}

export interface AttendanceBreakSession {
  windowId: string;
  startedAt: string;
  endedAt?: string;
}

export interface LeaveBalance {
  casual: { allocated: number; used: number };
  sick: { allocated: number; used: number };
  paid: { allocated: number; used: number };
  wfh: { allocated: number; used: number };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'first_half' | 'second_half';
  totalDays: number;
  reason: string;
  attachmentName?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewerComment?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  createdById: string;
  clientName?: string;
  projectName?: string;
  departmentId: string;
  priority: TaskPriority;
  startDate: string;
  deadline: string;
  status: TaskStatus;
  attachments?: string[];
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  reviewPeriod: string; // e.g. "Q3 2026" or "September 2026"
  qualityOfWork: number; // 1-5
  productivity: number; // 1-5
  communication: number; // 1-5
  teamwork: number; // 1-5
  punctuality: number; // 1-5
  responsibility: number; // 1-5
  finalRating: number; // average
  managerComments: string;
  employeeComments?: string;
  status: 'Draft' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRecord {
  id: string;
  monthYear: string; // e.g. "2026-09"
  employeeId: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  incentives: number;
  bonus: number;
  overtime: number;
  grossSalary: number;
  lateDeduction: number;
  leaveWithoutPay: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  advance: number;
  otherDeduction: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  paymentDate?: string;
  paymentMode?: string;
  generatedAt?: string;
  generatedBy?: string;
  generatedDate?: string;
  disbursedDate?: string;
}

export interface DocumentItem {
  id: string;
  employeeId?: string;
  title: string;
  fileName: string;
  fileSize: string;
  category: DocumentCategory;
  uploadDate: string;
  uploadedById: string;
  uploadedByName: string;
  fileType: string;
  fileUrl?: string;
  isCompanyWide?: boolean;
  requiresAcknowledgement?: boolean;
  status?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  audience: AnnouncementAudience;
  targetDepartmentId?: string;
  targetEmployeeId?: string;
  publishDate: string;
  expiryDate: string;
  priority: 'normal' | 'important' | 'urgent';
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string; // or 'all'
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'task' | 'payroll' | 'announcement' | 'performance';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  performedById: string;
  performedByName: string;
  performedByRole: UserRole;
  action: string;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  officeStartTime: string; // "09:30"
  officeEndTime: string; // "18:30"
  gracePeriodMinutes: number; // 15
  workingHoursPerDay: number; // 8
  minFullDayHours: number; // 8
  minHalfDayHours: number; // 4
  weeklyOffDays: string[]; // ["Sunday"]
  financialYear: string; // "2026-2027"
  currencySymbol: string; // "₹"
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId: string;
  avatarUrl: string;
  departmentId?: string;
  designation?: string;
}
