import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, CheckSquare, Building, FileText, Bell, ArrowRight } from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';
import { Avatar } from './Avatar';

export const GlobalSearchModal: React.FC = () => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    employees, 
    tasks, 
    departments, 
    documents, 
    announcements,
    setActiveNav
  } = useHRMS();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedEmployees = q ? employees.filter(e => 
    e.fullName.toLowerCase().includes(q) || 
    e.employeeCode.toLowerCase().includes(q) ||
    e.designation.toLowerCase().includes(q) ||
    e.workEmail.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchedTasks = q ? tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    (t.projectName && t.projectName.toLowerCase().includes(q))
  ).slice(0, 4) : [];

  const matchedDepartments = q ? departments.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.code.toLowerCase().includes(q)
  ).slice(0, 4) : [];

  const matchedDocuments = q ? documents.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.fileName.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const matchedAnnouncements = q ? announcements.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const totalResults = matchedEmployees.length + matchedTasks.length + matchedDepartments.length + matchedDocuments.length + matchedAnnouncements.length;

  const handleSelect = (nav: string) => {
    setActiveNav(nav);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search employees, tasks, departments, documents, announcements..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-hidden"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 text-xs">
          {!q && (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-sm font-medium text-slate-600">Global Search</p>
              <p className="text-xs mt-1">Type a name, task, department code (e.g. "WC-005", "Shopify", "HR")</p>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="py-10 text-center text-slate-500">
              <p className="text-sm font-medium text-slate-700">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for an employee name, WC code, department, or task keyword.</p>
            </div>
          )}

          {/* Employees */}
          {matchedEmployees.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> EMPLOYEES ({matchedEmployees.length})
              </div>
              <div className="space-y-1">
                {matchedEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelect('employees')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar 
                        name={emp.fullName} 
                        size="xs" 
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-[#365CF5] transition-colors">
                          {emp.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span className="font-mono text-slate-400">{emp.employeeCode}</span>
                          <span>·</span>
                          <span>{emp.designation}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {matchedTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> TASKS ({matchedTasks.length})
              </div>
              <div className="space-y-1">
                {matchedTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect('tasks')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900 group-hover:text-[#365CF5] transition-colors">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-600 font-medium">{t.priority}</span>
                        <span>·</span>
                        <span>Status: {t.status}</span>
                        <span>·</span>
                        <span>Due {t.deadline}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          {matchedDepartments.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> DEPARTMENTS ({matchedDepartments.length})
              </div>
              <div className="space-y-1">
                {matchedDepartments.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect('departments')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900 group-hover:text-[#365CF5] transition-colors">
                        {d.name} <span className="font-mono text-[11px] text-slate-400">({d.code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-md">
                        {d.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {matchedDocuments.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> DOCUMENTS ({matchedDocuments.length})
              </div>
              <div className="space-y-1">
                {matchedDocuments.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect('documents')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900 group-hover:text-[#365CF5]">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.fileName} · {doc.fileSize}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {matchedAnnouncements.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> ANNOUNCEMENTS ({matchedAnnouncements.length})
              </div>
              <div className="space-y-1">
                {matchedAnnouncements.map(ann => (
                  <button
                    key={ann.id}
                    onClick={() => handleSelect('announcements')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900 group-hover:text-[#365CF5]">
                        {ann.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-md">
                        {ann.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search Wings HRMS database</span>
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Click</kbd></span>
            <span>Close: <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
};
