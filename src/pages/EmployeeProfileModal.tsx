import React, { useState } from 'react';
import { 
  X, 
  User, 
  CalendarCheck, 
  CalendarOff, 
  CheckSquare, 
  Award, 
  DollarSign, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldAlert,
  Building,
  Download,
  Pencil,
  Save
} from 'lucide-react';
import { Employee } from '../types';
import { useHRMS } from '../context/HRMSContext';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import { Avatar } from '../components/common/Avatar';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  onClose: () => void;
  canManageProfiles: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({ employee, onClose, canManageProfiles, onDeactivate, onReactivate, onDelete }) => {
  const { 
    currentUser, 
    departments, 
    employees, 
    attendance, 
    leaveRequests, 
    tasks, 
    performanceReviews, 
    payrollRecords, 
    documents,
    companySettings,
    updateEmployee
  } = useHRMS();

  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leave' | 'tasks' | 'performance' | 'payroll' | 'documents'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(employee);

  if (!employee) return null;

  const department = departments.find(d => d.id === employee.departmentId);
  const manager = employees.find(e => e.id === employee.managerId);

  const canViewSalary = currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager' || currentUser?.employeeId === employee.id;

  // Specific employee records
  const empAttendance = attendance.filter(a => a.employeeId === employee.id).slice(0, 10);
  const empLeaves = leaveRequests.filter(l => l.employeeId === employee.id);
  const empTasks = tasks.filter(t => t.assignedToId === employee.id);
  const empReviews = performanceReviews.filter(p => p.employeeId === employee.id);
  const empPayroll = payrollRecords.filter(p => p.employeeId === employee.id);
  const empDocs = documents.filter(d => d.employeeId === employee.id);

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const updateField = <K extends keyof Employee>(field: K, value: Employee[K]) => {
    setDraft(current => current ? { ...current, [field]: value } : current);
  };

  const updateSalary = <K extends keyof Employee['salary']>(field: K, value: Employee['salary'][K]) => {
    setDraft(current => current ? { ...current, salary: { ...current.salary, [field]: value } } : current);
  };

  const updateBankDetails = <K extends keyof Employee['bankDetails']>(field: K, value: Employee['bankDetails'][K]) => {
    setDraft(current => current ? { ...current, bankDetails: { ...current.bankDetails, [field]: value } } : current);
  };

  const updateEmergencyContact = <K extends keyof Employee['emergencyContact']>(field: K, value: Employee['emergencyContact'][K]) => {
    setDraft(current => current ? { ...current, emergencyContact: { ...current.emergencyContact, [field]: value } } : current);
  };

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    updateEmployee(employee.id, {
      ...draft,
      fullName: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim()
    });
    onClose();
  };

  const inputClassName = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900';

  const renderTextField = (label: string, value: string | undefined, onChange: (value: string) => void, type = 'text') => (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input type={type} value={value || ''} onChange={event => onChange(event.target.value)} className={`${inputClassName} mt-1 font-normal`} />
    </label>
  );

  const renderNumberField = (label: string, value: number, onChange: (value: number) => void) => (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input type="number" min="0" step="0.01" value={value} onChange={event => onChange(Number(event.target.value))} className={`${inputClassName} mt-1 font-normal font-mono`} />
    </label>
  );

  if (isEditing && draft) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <form onSubmit={handleSaveProfile} className="w-full max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Employee Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Update personal, employment, and compensation details.</p>
            </div>
            <button type="button" onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg" aria-label="Cancel profile editing">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 text-xs">
            <section className="space-y-3">
              <h3 className="font-bold text-slate-900">Personal and Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderTextField('First name', draft.firstName, value => updateField('firstName', value))}
                {renderTextField('Last name', draft.lastName, value => updateField('lastName', value))}
                {renderTextField('Date of birth', draft.dateOfBirth, value => updateField('dateOfBirth', value), 'date')}
                <label className="block text-xs font-semibold text-slate-700">Gender
                  <select value={draft.gender} onChange={event => updateField('gender', event.target.value as Employee['gender'])} className={`${inputClassName} mt-1 font-normal`}>
                    <option>Female</option><option>Male</option><option>Other</option>
                  </select>
                </label>
                {renderTextField('Work email', draft.workEmail, value => updateField('workEmail', value), 'email')}
                {renderTextField('Personal email', draft.personalEmail, value => updateField('personalEmail', value), 'email')}
                {renderTextField('Phone', draft.phone, value => updateField('phone', value), 'tel')}
                {renderTextField('Mobile number', draft.mobileNumber, value => updateField('mobileNumber', value), 'tel')}
                {renderTextField('Current address', draft.currentAddress, value => updateField('currentAddress', value))}
                {renderTextField('Permanent address', draft.permanentAddress, value => updateField('permanentAddress', value))}
                {renderTextField('PAN', draft.pan, value => updateField('pan', value))}
                {renderTextField('Aadhaar', draft.aadhaar, value => updateField('aadhaar', value))}
                {renderTextField('UAN', draft.uan, value => updateField('uan', value))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-slate-900">Employment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderTextField('Designation', draft.designation, value => updateField('designation', value))}
                <label className="block text-xs font-semibold text-slate-700">Department
                  <select value={draft.departmentId} onChange={event => updateField('departmentId', event.target.value)} className={`${inputClassName} mt-1 font-normal`}>
                    {departments.map(departmentOption => <option key={departmentOption.id} value={departmentOption.id}>{departmentOption.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Manager
                  <select value={draft.managerId || ''} onChange={event => updateField('managerId', event.target.value || undefined)} className={`${inputClassName} mt-1 font-normal`}>
                    <option value="">No manager</option>
                    {employees.filter(employeeOption => employeeOption.id !== draft.id).map(employeeOption => <option key={employeeOption.id} value={employeeOption.id}>{employeeOption.fullName}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Status
                  <select value={draft.status} onChange={event => updateField('status', event.target.value as Employee['status'])} className={`${inputClassName} mt-1 font-normal`}>
                    {(['Active', 'Probation', 'Notice Period', 'Resigned', 'Terminated', 'Inactive', 'Deactivated'] as Employee['status'][]).map(status => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Employment type
                  <select value={draft.employmentType} onChange={event => updateField('employmentType', event.target.value as Employee['employmentType'])} className={`${inputClassName} mt-1 font-normal`}>
                    {(['Full Time', 'Part Time', 'Intern', 'Contract', 'Freelancer'] as Employee['employmentType'][]).map(type => <option key={type}>{type}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Company role
                  <select value={draft.companyRole || ''} onChange={event => updateField('companyRole', (event.target.value || undefined) as Employee['companyRole'])} className={`${inputClassName} mt-1 font-normal`}>
                    <option value="">Unassigned</option><option>Org. Admin</option><option>Manager</option><option>Executive</option>
                  </select>
                </label>
                {renderTextField('Joining date', draft.joiningDate, value => updateField('joiningDate', value), 'date')}
                {renderTextField('Work location', draft.workLocation, value => updateField('workLocation', value))}
                {renderNumberField('Probation months', draft.probationPeriodMonths, value => updateField('probationPeriodMonths', value))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-slate-900">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {renderTextField('Contact name', draft.emergencyContact.name, value => updateEmergencyContact('name', value))}
                {renderTextField('Relationship', draft.emergencyContact.relationship, value => updateEmergencyContact('relationship', value))}
                {renderTextField('Contact phone', draft.emergencyContact.phone, value => updateEmergencyContact('phone', value), 'tel')}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-slate-900">Salary Components (INR)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {([
                  ['basic', 'Basic'], ['hra', 'HRA'], ['allowances', 'Allowances'], ['incentives', 'Incentives'], ['bonus', 'Bonus'],
                  ['pf', 'PF'], ['esi', 'ESI'], ['professionalTax', 'Professional tax'], ['tds', 'TDS'], ['otherDeductions', 'Other deductions']
                ] as const).map(([field, label]) => renderNumberField(label, draft.salary[field], value => updateSalary(field, value)))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-bold text-slate-900">Bank Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderTextField('Account holder', draft.bankDetails.accountHolderName, value => updateBankDetails('accountHolderName', value))}
                {renderTextField('Bank name', draft.bankDetails.bankName, value => updateBankDetails('bankName', value))}
                {renderTextField('Account number', draft.bankDetails.accountNumber, value => updateBankDetails('accountNumber', value))}
                {renderTextField('IFSC', draft.bankDetails.ifscCode, value => updateBankDetails('ifscCode', value))}
                {renderTextField('UPI ID', draft.bankDetails.upiId, value => updateBankDetails('upiId', value))}
                {renderTextField('Branch name', draft.bankDetails.branchName, value => updateBankDetails('branchName', value))}
              </div>
            </section>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D2B45] hover:bg-slate-800 rounded-lg cursor-pointer">
              <Save className="w-3.5 h-3.5" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={employee.fullName}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{employee.fullName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-200/70 text-slate-700 font-semibold rounded">
                  {employee.employeeCode}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  employee.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {employee.status}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{employee.designation}</span>
                <span>·</span>
                <span>{department?.name || 'Department'}</span>
                {manager && (
                  <>
                    <span>·</span>
                    <span>Reporting to: <strong className="font-semibold">{manager.fullName}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {canManageProfiles && (
              <button
                onClick={() => {
                  setDraft(employee);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
            {canManageProfiles && employee.status !== 'Deactivated' && currentUser?.employeeId !== employee.id && (
              <button
                onClick={onDeactivate}
                className="px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
              >
                Deactivate Profile
              </button>
            )}
            {canManageProfiles && employee.status === 'Deactivated' && currentUser?.employeeId !== employee.id && (
              <button
                onClick={onReactivate}
                className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
              >
                Reactivate Profile
              </button>
            )}
            {canManageProfiles && currentUser?.employeeId !== employee.id && (
              <button
                onClick={onDelete}
                className="px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg cursor-pointer"
              >
                Delete Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-2 overflow-x-auto bg-white text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'attendance' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Attendance ({empAttendance.length})
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'leave' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Leave ({empLeaves.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'tasks' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Tasks ({empTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'performance' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Performance ({empReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'payroll' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Payroll {!canViewSalary && '(Confidential)'}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'documents' ? 'border-[#365CF5] text-[#365CF5]' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Documents ({empDocs.length})
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)] space-y-6 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal & Employment Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                      <span className="font-medium text-slate-800">{employee.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gender</span>
                      <span className="font-medium text-slate-800">{employee.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">PAN Card</span>
                      <span className="font-mono font-medium text-slate-800">{employee.pan}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Aadhaar No.</span>
                      <span className="font-mono font-medium text-slate-800">{employee.aadhaar}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Joining Date</span>
                      <span className="font-medium text-slate-800">{employee.joiningDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Employment Type</span>
                      <span className="font-medium text-slate-800">{employee.employmentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Work Location</span>
                      <span className="font-medium text-slate-800">{employee.workLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Probation Period</span>
                      <span className="font-medium text-slate-800">{employee.probationPeriodMonths} Months</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact & Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    Contact Information
                  </h3>
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Work: {employee.workEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Personal: {employee.personalEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone: {employee.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-700 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{employee.currentAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    Emergency Contact
                  </h3>
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Contact Person</span>
                      <span className="font-medium text-slate-800">{employee.emergencyContact.name} ({employee.emergencyContact.relationship})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Emergency Phone</span>
                      <span className="font-medium text-slate-800">{employee.emergencyContact.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Permanent Address</span>
                      <span className="font-medium text-slate-800">{employee.permanentAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Overview (If permitted) */}
              {canViewSalary && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-900">
                      Salary Overview (INR)
                    </h3>
                    <span className="text-[11px] font-semibold text-[#365CF5] bg-blue-100/60 px-2 py-0.5 rounded-full border border-blue-200">
                      {employee.designation.includes('Manager') || employee.designation.includes('Admin') ? '30k CTC (₹30,000 / month)' : '20k CTC (₹20,000 / month)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Basic Pay</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(employee.salary.basic)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">HRA</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(employee.salary.hra)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Special Allowances</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(employee.salary.allowances)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Incentives / Bonus</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(employee.salary.incentives + employee.salary.bonus)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Recent Attendance Logs</h3>
                <span className="text-xs text-slate-500">Showing last 10 shift records</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Punch In</th>
                      <th className="py-2.5 px-3 font-semibold">Punch Out</th>
                      <th className="py-2.5 px-3 font-semibold">Hours</th>
                      <th className="py-2.5 px-3 font-semibold">Overtime</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empAttendance.map(att => (
                      <tr key={att.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{att.date}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{att.checkIn || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{att.checkOut || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{att.workingHours}h</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{att.overtimeHours}h</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Leave Applications History</h3>
              {empLeaves.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No leave requests recorded</div>
              ) : (
                <div className="space-y-2">
                  {empLeaves.map(leave => (
                    <div key={leave.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {leave.leaveType} · {leave.totalDays} Day(s)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {leave.startDate} to {leave.endDate} · Reason: "{leave.reason}"
                        </div>
                        {leave.reviewerComment && (
                          <div className="text-[11px] text-slate-600 italic mt-1">
                            Reviewer: {leave.reviewerComment}
                          </div>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                        leave.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Assigned Deliverables</h3>
              {empTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No assigned tasks</div>
              ) : (
                <div className="space-y-2">
                  {empTasks.map(t => (
                    <div key={t.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.projectName} · Deadline: {t.deadline}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                          {t.priority}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold font-mono">
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Quarterly Reviews & Appraisal Scores</h3>
              {empReviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No review ratings submitted yet</div>
              ) : (
                empReviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{rev.reviewPeriod} Review</div>
                        <div className="text-[11px] text-slate-500">Evaluated on {rev.createdAt}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-[#365CF5]">{rev.finalRating}</span>
                        <span className="text-slate-400 font-normal"> / 5.0</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                      <div>Quality of Work: <strong>{rev.qualityOfWork}/5</strong></div>
                      <div>Productivity: <strong>{rev.productivity}/5</strong></div>
                      <div>Communication: <strong>{rev.communication}/5</strong></div>
                      <div>Teamwork: <strong>{rev.teamwork}/5</strong></div>
                      <div>Punctuality: <strong>{rev.punctuality}/5</strong></div>
                      <div>Responsibility: <strong>{rev.responsibility}/5</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <div className="font-semibold text-slate-700">Manager Comments:</div>
                      <p className="text-slate-600 mt-0.5">"{rev.managerComments}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: PAYROLL */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              {!canViewSalary ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <ShieldAlert className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                  <p className="font-bold text-slate-800 text-sm">Confidential Salary Structure</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Managers are not permitted to view peer or team confidential remuneration details without designated HR authorization.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Monthly Compensation Records</h3>
                    <span className="text-xs text-slate-500">Net take-home after statutory deductions</span>
                  </div>

                  {empPayroll.map(pay => (
                    <div key={pay.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">
                          {pay.monthYear === '2026-09' ? 'September 2026' : 'August 2026'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                          <span>Gross: <strong className="font-mono text-slate-800">{formatINR(pay.grossSalary)}</strong></span>
                          <span>·</span>
                          <span>Deductions: <strong className="font-mono text-red-600">{formatINR(pay.totalDeductions)}</strong></span>
                          <span>·</span>
                          <span>Net Pay: <strong className="font-mono text-emerald-600">{formatINR(pay.netSalary)}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => generatePayslipPDF(employee, pay, companySettings)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download Payslip</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Employee Documents Vault</h3>
              {empDocs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No documents uploaded for this employee</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {empDocs.map(doc => (
                    <div key={doc.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="overflow-hidden">
                          <div className="font-semibold text-slate-900 truncate">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{doc.fileName} · {doc.fileSize}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-white rounded border border-slate-200 shrink-0">
                        {doc.category.replace(' Documents', '')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
