import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  Lock, 
  User, 
  Activity,
  Download
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';

export const AuditLogPage: React.FC = () => {
  const { auditLogs, currentUser } = useHRMS();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-500 mt-1">
          System audit logs contain sensitive corporate security forensics. Access is restricted to the Super Admin role (Vikramaditya Singhania).
        </p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.performedByName.toLowerCase().includes(search.toLowerCase()) ||
      (log.targetEmployeeName && log.targetEmployeeName.toLowerCase().includes(search.toLowerCase())) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase());

    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp,Performed By,Role,Action,Target Employee,Details,IP Address'];
    const rows = filteredLogs.map(l => 
      `"${l.timestamp}","${l.performedByName}","${l.performedByRole}","${l.action}","${l.targetEmployeeName || ''}","${l.details.replace(/"/g, '""')}","${l.ipAddress}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wings_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Security & Audit Log</h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100 font-mono">
              Immutable Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete trace of employee updates, salary modifications, attendance corrections, and executive actions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Forensics CSV</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, actor name, employee..."
            className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="p-1.5 border border-slate-200 rounded bg-white text-slate-700 text-xs"
          >
            <option value="all">All Actions</option>
            <option value="Attendance">Attendance Changes</option>
            <option value="Leave">Leave Approvals</option>
            <option value="Employee">Employee Operations</option>
            <option value="Salary">Salary & Payroll</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold font-mono">Timestamp</th>
                <th className="py-3 px-3 font-semibold">Performed By</th>
                <th className="py-3 px-3 font-semibold">Action</th>
                <th className="py-3 px-3 font-semibold">Affected Entity</th>
                <th className="py-3 px-3 font-semibold">Log Details</th>
                <th className="py-3 px-4 font-semibold text-right font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.performedByName}</div>
                    <div className="text-[10px] text-slate-400 capitalize font-medium">{log.performedByRole.replace('_', ' ')}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {log.targetEmployeeName || 'System'}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-sm">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredLogs.length} verified security audit records</span>
          <span className="font-mono text-[11px] text-slate-400">SOC2 Type II & GDPR compliant</span>
        </div>
      </div>
    </div>
  );
};
