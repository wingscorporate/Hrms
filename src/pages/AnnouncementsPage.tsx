import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { Announcement, AnnouncementAudience } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const { announcements, departments, employees, createAnnouncement, deleteAnnouncement, currentUser, todayDate } = useHRMS();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('Everyone');
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [publishDate, setPublishDate] = useState(todayDate);
  const [expiryDate, setExpiryDate] = useState('2026-10-15');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('important');

  const canPublish = currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    createAnnouncement({
      title,
      description,
      audience,
      targetDepartmentId: targetDepartmentId || undefined,
      publishDate,
      expiryDate,
      priority
    });

    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const getPriorityBadge = (p: 'normal' | 'important' | 'urgent') => {
    switch (p) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'important': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'normal': return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Announcements Board</h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-[#365CF5] rounded-full border border-blue-100 font-mono">
              {announcements.length} Active Notices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast official circulars, event town halls, health policies, and departmental memoranda.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {announcements.map(ann => {
          const targetDept = departments.find(d => d.id === ann.targetDepartmentId);

          return (
            <div
              key={ann.id}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityBadge(ann.priority)}`}>
                    {ann.priority}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audience: <strong>{ann.audience} {targetDept && `(${targetDept.name})`}</strong></span>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Published: {ann.publishDate} · Expires: {ann.expiryDate}
                  </span>
                  {canPublish && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete announcement "${ann.title}"?`)) {
                          deleteAnnouncement(ann.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {ann.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-2 whitespace-pre-line">
                  {ann.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Issued by <strong className="text-slate-700 font-semibold">{ann.createdByName}</strong></span>
                <span className="font-semibold text-[#365CF5]">Wings Corporate Circular</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Publish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Broadcast Company Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Wings Corporation Q3 Town Hall & Festive Bonus"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Notice Body *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Official message, instructions, and venue/link details..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={e => setAudience(e.target.value as AnnouncementAudience)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Everyone">Everyone (All Staff)</option>
                    <option value="Specific Department">Specific Department</option>
                    <option value="Managers Only">Managers Only</option>
                    <option value="Individual Employees">Individual Employees</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="important">Important (Default)</option>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>

              {audience === 'Specific Department' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Department</label>
                  <select
                    value={targetDepartmentId}
                    onChange={e => setTargetDepartmentId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Choose department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publish Date</label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={e => setPublishDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
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
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
