import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  LayoutGrid, 
  List, 
  Mail, 
  Phone, 
  MoreVertical, 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { Employee, EmploymentType, EmployeeStatus } from '../types';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { Avatar } from '../components/common/Avatar';

export const EmployeesPage: React.FC = () => {
  const { employees, departments, addEmployee, deactivateEmployee, reactivateEmployee, deleteEmployee, currentUser } = useHRMS();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const canManageProfiles = currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  // Multi-step Add Employee State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: '',
    dateOfBirth: '1998-05-12',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    personalEmail: '',
    workEmail: '',
    phone: '+91 ',
    emergencyName: '',
    emergencyRelationship: 'Parent',
    emergencyPhone: '+91 ',
    currentAddress: '',
    permanentAddress: '',
    departmentId: 'dept-2',
    designation: 'Sales Executive',
    managerId: 'emp-11',
    joiningDate: '2026-10-01',
    employmentType: 'Full Time' as EmploymentType,
    workLocation: 'Headquarters (Mumbai)',
    probationPeriodMonths: 0,
    status: 'Active' as EmployeeStatus,
    basic: 10000,
    hra: 4000,
    allowances: 5000,
    incentives: 1000,
    bonus: 0,
    pf: 1800,
    esi: 0,
    professionalTax: 200,
    tds: 0,
    otherDeductions: 0,
    accountHolderName: '',
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: 'HDFC0000053',
    upiId: '',
    pan: '',
    aadhaar: '',
    uan: ''
  });

  // Next auto ID calculation
  const maxNum = employees.reduce((max, e) => {
    const num = parseInt(e.employeeCode.replace('WC-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextEmployeeCode = `WC-${String(maxNum + 1).padStart(3, '0')}`;

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase()) ||
      emp.workEmail.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'all' || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
    const matchesType = selectedType === 'all' || emp.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesStatus && matchesType;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Employee ID,Name,Department,Designation,Email,Phone,Joining Date,Status,Type'];
    const rows = filteredEmployees.map(e => {
      const dept = departments.find(d => d.id === e.departmentId)?.name || '';
      return `"${e.employeeCode}","${e.fullName}","${dept}","${e.designation}","${e.workEmail}","${e.phone}","${e.joiningDate}","${e.status}","${e.employmentType}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wings_Employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.workEmail) {
      alert('Please fill in required fields (First Name, Last Name, Work Email)');
      return;
    }

    addEmployee({
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      avatarUrl: formData.avatarUrl,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      personalEmail: formData.personalEmail || `${formData.firstName.toLowerCase()}@gmail.com`,
      workEmail: formData.workEmail,
      phone: formData.phone,
      emergencyContact: {
        name: formData.emergencyName || 'Emergency Contact',
        relationship: formData.emergencyRelationship,
        phone: formData.emergencyPhone
      },
      currentAddress: formData.currentAddress || 'Mumbai, Maharashtra',
      permanentAddress: formData.permanentAddress || 'Mumbai, Maharashtra',
      departmentId: formData.departmentId,
      designation: formData.designation,
      managerId: formData.managerId,
      joiningDate: formData.joiningDate,
      employmentType: formData.employmentType,
      workLocation: formData.workLocation,
      probationPeriodMonths: Number(formData.probationPeriodMonths),
      status: formData.status,
      salary: {
        basic: Number(formData.basic),
        hra: Number(formData.hra),
        allowances: Number(formData.allowances),
        incentives: Number(formData.incentives),
        bonus: Number(formData.bonus),
        pf: Number(formData.pf),
        esi: Number(formData.esi),
        professionalTax: Number(formData.professionalTax),
        tds: Number(formData.tds),
        otherDeductions: Number(formData.otherDeductions)
      },
      bankDetails: {
        accountHolderName: formData.accountHolderName || `${formData.firstName} ${formData.lastName}`,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber || '50100' + Math.floor(Math.random() * 900000000 + 100000000),
        ifscCode: formData.ifscCode,
        upiId: formData.upiId || `${formData.firstName.toLowerCase()}@hdfcbank`
      },
      pan: formData.pan || 'ABCDE1234F',
      aadhaar: formData.aadhaar || '5829-1029-4820',
      uan: formData.uan || '100482910294'
    });

    setIsAddModalOpen(false);
    setStep(1);
  };

  const handleDeactivate = () => {
    if (!selectedEmployee || !window.confirm(`Deactivate ${selectedEmployee.fullName}'s profile? Their records will be retained.`)) return;
    deactivateEmployee(selectedEmployee.id);
    setSelectedEmployee(null);
  };

  const handleReactivate = () => {
    if (!selectedEmployee || !window.confirm(`Reactivate ${selectedEmployee.fullName}'s profile?`)) return;
    reactivateEmployee(selectedEmployee.id);
    setSelectedEmployee(null);
  };

  const handleDelete = () => {
    if (!selectedEmployee || !window.confirm(`Permanently delete ${selectedEmployee.fullName} and their related attendance, leave, task, payroll, review, and personal document data? This cannot be undone.`)) return;
    deleteEmployee(selectedEmployee.id);
    setSelectedEmployee(null);
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Probation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Notice Period':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Resigned':
      case 'Terminated':
      case 'Inactive':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Deactivated':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-[#365CF5] rounded-full border border-blue-100 font-mono">
              {employees.length} Staff
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company employees, job roles, departments, remuneration, and statutory onboarding files.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {(currentUser?.role === 'super_admin' || currentUser?.role === 'hr') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1D2B45] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID (e.g. WC-005), designation, email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#365CF5] bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:outline-hidden"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Notice Period">Notice Period</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
            <option value="Inactive">Inactive</option>
            <option value="Deactivated">Deactivated</option>
          </select>

          {/* Employment Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
            <option value="Intern">Intern</option>
            <option value="Contract">Contract</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No employees match criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing search filters or search queries.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Designation</th>
                  <th className="py-3 px-3 font-semibold">Contact</th>
                  <th className="py-3 px-3 font-semibold">Joining Date</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const dept = departments.find(d => d.id === emp.departmentId);
                  return (
                    <tr 
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={emp.fullName}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-[#365CF5] transition-colors">
                              {emp.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{dept?.name || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">{emp.designation}</td>
                      <td className="py-3 px-3 text-slate-500">
                        <div>{emp.workEmail}</div>
                        <div className="text-[10px] text-slate-400">{emp.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{emp.joiningDate}</td>
                      <td className="py-3 px-3 text-slate-600">{emp.employmentType}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStatusBadge(emp.status)}`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
            <span>Click any employee to inspect profile, attendance, and payroll</span>
          </div>
        </div>
      ) : (
        /* Grid View Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map(emp => {
            const dept = departments.find(d => d.id === emp.departmentId);
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Avatar
                      name={emp.fullName}
                      size="lg"
                    />
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadge(emp.status)}`}>
                      {emp.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="font-bold text-slate-900 text-sm hover:text-[#365CF5] transition-colors">
                      {emp.fullName}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">{emp.designation}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                      <span>{emp.employeeCode}</span>
                      <span>·</span>
                      <span className="font-sans">{dept?.name}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.workEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Joined {emp.joiningDate}</span>
                  <span className="font-semibold text-[#365CF5]">View Profile →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-step Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add New Employee Onboarding</h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Generated Employee ID: <strong className="font-mono text-[#365CF5]">{nextEmployeeCode}</strong>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Bar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 1 ? 'text-[#365CF5]' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
                <span>Personal</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 2 ? 'text-[#365CF5]' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">2</span>
                <span>Employment</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 3 ? 'text-[#365CF5]' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">3</span>
                <span>Salary</span>
              </div>
              <div className="w-8 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 font-semibold ${step >= 4 ? 'text-[#365CF5]' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">4</span>
                <span>Bank & Statutory</span>
              </div>
            </div>

            {/* Form Steps */}
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-14rem)] space-y-4 text-xs">
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                        placeholder="e.g. Tarun"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                        placeholder="e.g. Saxena"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.workEmail}
                        onChange={e => setFormData({ ...formData, workEmail: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                        placeholder="tarun.s@wingscorp.in"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        placeholder="+91 98200 00000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Residential Address</label>
                    <input
                      type="text"
                      value={formData.currentAddress}
                      onChange={e => setFormData({ ...formData, currentAddress: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                      placeholder="Flat 101, Palms Residency, Andheri West, Mumbai 400053"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Employment Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Department</label>
                      <select
                        value={formData.departmentId}
                        onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        placeholder="e.g. Sales Executive / HR Executive"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                      <select
                        value={formData.employmentType}
                        onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Intern">Intern</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelancer">Freelancer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Location</label>
                      <select
                        value={formData.workLocation}
                        onChange={e => setFormData({ ...formData, workLocation: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Headquarters (Mumbai)">Headquarters (Mumbai)</option>
                        <option value="Bangalore Hub">Bangalore Hub</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Probation Months</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={formData.probationPeriodMonths}
                        onChange={e => setFormData({ ...formData, probationPeriodMonths: Number(e.target.value) })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Salary Breakdown */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs">Select a standard compensation tier or customize component values below:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          basic: 10000,
                          hra: 4000,
                          allowances: 5000,
                          incentives: 1000,
                          bonus: 0,
                          pf: 1800,
                          esi: 0,
                          professionalTax: 200,
                          tds: 0
                        })}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-semibold rounded cursor-pointer transition-colors shadow-2xs"
                      >
                        Executive Tier (20k CTC)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          basic: 15000,
                          hra: 6000,
                          allowances: 7000,
                          incentives: 2000,
                          bonus: 0,
                          pf: 1800,
                          esi: 0,
                          professionalTax: 200,
                          tds: 0
                        })}
                        className="px-2.5 py-1 bg-[#1D2B45] hover:bg-slate-800 text-white text-[11px] font-semibold rounded cursor-pointer transition-colors shadow-2xs"
                      >
                        Manager Tier (30k CTC)
                      </button>
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Monthly CTC / Gross</span>
                      <strong className="text-sm text-slate-900 font-bold">
                        ₹{(formData.basic + formData.hra + formData.allowances + formData.incentives + formData.bonus).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Statutory Deductions</span>
                      <strong className="text-sm text-red-600 font-bold">
                        -₹{(formData.pf + formData.esi + formData.professionalTax + formData.tds).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Net Take-Home</span>
                      <strong className="text-sm text-emerald-600 font-bold">
                        ₹{Math.max(0, (formData.basic + formData.hra + formData.allowances + formData.incentives + formData.bonus) - (formData.pf + formData.esi + formData.professionalTax + formData.tds)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Basic Salary (INR)</label>
                      <input
                        type="number"
                        value={formData.basic}
                        onChange={e => setFormData({ 
                          ...formData, 
                          basic: Number(e.target.value)
                        })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">HRA (House Rent)</label>
                      <input
                        type="number"
                        value={formData.hra}
                        onChange={e => setFormData({ ...formData, hra: Number(e.target.value) })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Allowances</label>
                      <input
                        type="number"
                        value={formData.allowances}
                        onChange={e => setFormData({ ...formData, allowances: Number(e.target.value) })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Incentives</label>
                      <input
                        type="number"
                        value={formData.incentives}
                        onChange={e => setFormData({ ...formData, incentives: Number(e.target.value) })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">TDS (Monthly)</label>
                      <input
                        type="number"
                        value={formData.tds}
                        onChange={e => setFormData({ ...formData, tds: Number(e.target.value) })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Bank & Documents */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                        placeholder="50100492817291"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={formData.ifscCode}
                        onChange={e => setFormData({ ...formData, ifscCode: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                        placeholder="HDFC0000053"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">PAN Card Number</label>
                      <input
                        type="text"
                        value={formData.pan}
                        onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Aadhaar Card Number</label>
                    <input
                      type="text"
                      value={formData.aadhaar}
                      onChange={e => setFormData({ ...formData, aadhaar: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                      placeholder="8492-3819-2041"
                    />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : <div />}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg cursor-pointer font-semibold"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-lg cursor-pointer font-bold shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create & Onboard Employee</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Profile Detailed Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          canManageProfiles={canManageProfiles}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
