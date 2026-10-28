import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  X, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { Holiday, HolidayType } from '../types';

export const HolidaysPage: React.FC = () => {
  const { holidays, createHoliday, deleteHoliday, currentUser, todayDate } = useHRMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayDate);
  const [type, setType] = useState<HolidayType>('National Holiday');
  const [description, setDescription] = useState('');

  const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'hr';

  const filteredHolidays = holidays.filter(h => {
    return filterType === 'all' || h.type === filterType;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createHoliday({
      name,
      date,
      type,
      description
    });

    setIsModalOpen(false);
    setName('');
    setDescription('');
  };

  const getTypeBadge = (t: HolidayType) => {
    switch (t) {
      case 'National Holiday': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Company Holiday': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Optional Holiday': return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Holiday Calendar 2026-2027</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official statutory national gazetted holidays and corporate leave schedules.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holiday</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {['all', 'National Holiday', 'Company Holiday', 'Optional Holiday'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterType === t ? 'bg-[#1D2B45] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t === 'all' ? 'All Holidays' : t}
            </button>
          ))}
        </div>
        <span className="text-slate-400 font-mono text-[11px]">{filteredHolidays.length} Listed</span>
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHolidays.map(hol => {
          const holDate = new Date(hol.date + 'T00:00:00');
          const dayName = holDate.toLocaleDateString('en-US', { weekday: 'long' });
          const monthYear = holDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return (
            <div
              key={hol.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTypeBadge(hol.type)}`}>
                    {hol.type}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${hol.name}" from company holidays?`)) {
                          deleteHoliday(hol.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Delete holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-slate-900">{hol.name}</h3>
                  <div className="text-xs text-[#365CF5] font-mono font-semibold mt-1">
                    {monthYear} · {dayName}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {hol.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>All Indian offices closed</span>
                <span className="font-semibold text-emerald-600">Paid Off</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Company Holiday</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Diwali (Deepavali)"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as HolidayType)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="National Holiday">National Holiday</option>
                    <option value="Company Holiday">Company Holiday</option>
                    <option value="Optional Holiday">Optional Holiday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Significance and holiday protocol..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
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
                  Publish Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
