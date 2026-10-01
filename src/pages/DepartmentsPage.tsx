import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  UserCheck, 
  Edit3, 
  X, 
  Check, 
  Search,
  Briefcase
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { Department } from '../types';
import { Avatar } from '../components/common/Avatar';

export const DepartmentsPage: React.FC = () => {
  const { departments, employees, createDepartment, updateDepartment, currentUser } = useHRMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [managerId, setManagerId] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'hr';

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setManagerId('');
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setManagerId(dept.managerId || '');
    setDescription(dept.description);
    setIsActive(dept.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (editingDept) {
      updateDepartment(editingDept.id, {
        name,
        code: code.toUpperCase(),
        managerId: managerId || undefined,
        description,
        isActive
      });
    } else {
      createDepartment({
        name,
        code: code.toUpperCase(),
        managerId: managerId || undefined,
        description,
        isActive
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Department Architecture</h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-[#365CF5] rounded-full border border-blue-100 font-mono">
              {departments.length} Units
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational divisions, business unit leaders, headcount allocation, and organizational governance.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Department</span>
          </button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptEmployees = employees.filter(e => e.departmentId === dept.id);
          const manager = employees.find(e => e.id === dept.managerId);

          return (
            <div
              key={dept.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-[#1D2B45]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                      {dept.code}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      dept.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-slate-900">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5" /> Headcount:
                  </span>
                  <strong className="font-mono font-bold text-slate-900">{deptEmployees.length} staff</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <UserCheck className="w-3.5 h-3.5" /> Lead Manager:
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 truncate max-w-[160px]">
                    {manager ? (
                      <>
                        <Avatar name={manager.fullName} size="xs" />
                        <span className="truncate">{manager.fullName}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Vacant</span>
                    )}
                  </div>
                </div>

                {canManage && (
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="text-xs text-[#365CF5] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Unit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDept ? 'Edit Department Unit' : 'Create New Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence Research"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AI-LAB"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Manager</label>
                  <select
                    value={managerId}
                    onChange={e => setManagerId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Select Manager</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Mandate</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Core business responsibilities and departmental scope..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deptActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-[#365CF5]"
                />
                <label htmlFor="deptActive" className="font-semibold text-slate-700 cursor-pointer">
                  Department is currently active
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  {editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
