import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  Star, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  User, 
  X, 
  TrendingUp, 
  Filter 
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { PerformanceReview } from '../types';
import { Avatar } from '../components/common/Avatar';

export const PerformancePage: React.FC = () => {
  const { 
    performanceReviews, 
    employees, 
    tasks, 
    currentUser, 
    submitPerformanceReview 
  } = useHRMS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  // New review form
  const [employeeId, setEmployeeId] = useState('emp-5');
  const [reviewPeriod, setReviewPeriod] = useState('Q3 2026 (July - Sept)');
  const [qualityOfWork, setQualityOfWork] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [communication, setCommunication] = useState(4);
  const [teamwork, setTeamwork] = useState(5);
  const [punctuality, setPunctuality] = useState(4);
  const [responsibility, setResponsibility] = useState(5);
  const [managerComments, setManagerComments] = useState('');
  const [employeeComments, setEmployeeComments] = useState('');

  const canReview = currentUser?.role === 'super_admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

  const calculatedRating = Number(((qualityOfWork + productivity + communication + teamwork + punctuality + responsibility) / 6).toFixed(1));

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerComments.trim()) {
      alert('Please add appraisal observations and manager feedback.');
      return;
    }

    submitPerformanceReview({
      employeeId,
      reviewerId: currentUser?.employeeId || 'emp-1',
      reviewPeriod,
      qualityOfWork,
      productivity,
      communication,
      teamwork,
      punctuality,
      responsibility,
      managerComments,
      employeeComments: employeeComments || undefined,
      status: 'Completed'
    });

    setIsModalOpen(false);
    setManagerComments('');
    setEmployeeComments('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performance Appraisal & KPI Reviews</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quarterly and monthly review assessments across quality, productivity, collaboration, and accountability.
          </p>
        </div>

        {canReview && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Performance Review</span>
          </button>
        )}
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Corporate Avg Score</span>
          <div className="text-2xl font-bold text-[#365CF5] font-mono tabular-nums mt-1">4.6 / 5.0</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">+0.3 from Q2 cycle</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">On-Time Attendance</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">94.2%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Late arrival rate: 5.8%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Task Completion Velocity</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">88.5%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Average cycle: 4.2 days</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Appraisals Completed</span>
          <div className="text-2xl font-bold text-purple-600 font-mono tabular-nums mt-1">{performanceReviews.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All active departments</div>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recorded Performance Appraisals</h2>
            <p className="text-xs text-slate-500">6-factor evaluated ratings and management evaluations</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
            Scale: 1 (Needs Improvement) to 5 (Exceeds Expectations)
          </span>
        </div>

        <div className="space-y-4">
          {performanceReviews.map(rev => {
            const emp = employees.find(e => e.id === rev.employeeId);
            const reviewer = employees.find(e => e.id === rev.reviewerId);

            return (
              <div 
                key={rev.id} 
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={emp?.fullName || ''}
                      size="md"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{emp?.fullName}</span>
                        <span className="font-mono text-xs px-2 py-0.2 bg-white rounded border border-slate-200 text-slate-500 font-normal">
                          {emp?.employeeCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {emp?.designation} · Reviewed by <strong className="font-semibold text-slate-700">{reviewer?.fullName || 'Manager'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{rev.reviewPeriod}</div>
                      <div className="text-2xl font-bold font-mono text-[#365CF5] tabular-nums">
                        {rev.finalRating} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6 Category Rating Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs pt-2 border-t border-slate-200/80">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Quality of Work</span>
                    <strong className="font-mono text-slate-900 font-bold">{rev.qualityOfWork} / 5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Productivity</span>
                    <strong className="font-mono text-slate-900 font-bold">{rev.productivity} / 5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Communication</span>
                    <strong className="font-mono text-slate-900 font-bold">{rev.communication} / 5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Teamwork</span>
                    <strong className="font-mono text-slate-900 font-bold">{rev.teamwork} / 5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Punctuality</span>
                    <strong className="font-mono text-slate-900 font-bold">{rev.punctuality} / 5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Responsibility</span>
                    <strong className="font-mono text-slate-900 font-bold">{rev.responsibility} / 5</strong>
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Manager Assessment & Commendation:</span>
                    <p className="text-slate-600 leading-relaxed italic">"{rev.managerComments}"</p>
                  </div>

                  {rev.employeeComments && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px] mb-0.5">Employee Self-Reflection:</span>
                      <p className="text-slate-600 leading-relaxed italic">"{rev.employeeComments}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Performance Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Conduct Employee Performance Review</h3>
                <div className="text-xs text-slate-500">6-Dimensional Weighted Assessment</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Evaluate Employee</label>
                  <select
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.designation})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Review Period</label>
                  <input
                    type="text"
                    value={reviewPeriod}
                    onChange={e => setReviewPeriod(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* 6 Sliders with Live Values */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">1. Quality of Work</span>
                  <span className="font-mono font-bold text-blue-600">{qualityOfWork} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={qualityOfWork}
                  onChange={e => setQualityOfWork(Number(e.target.value))}
                  className="w-full accent-[#365CF5]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">2. Productivity & Output</span>
                  <span className="font-mono font-bold text-blue-600">{productivity} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={productivity}
                  onChange={e => setProductivity(Number(e.target.value))}
                  className="w-full accent-[#365CF5]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">3. Communication & Transparency</span>
                  <span className="font-mono font-bold text-blue-600">{communication} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={communication}
                  onChange={e => setCommunication(Number(e.target.value))}
                  className="w-full accent-[#365CF5]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">4. Teamwork & Culture Contribution</span>
                  <span className="font-mono font-bold text-blue-600">{teamwork} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={teamwork}
                  onChange={e => setTeamwork(Number(e.target.value))}
                  className="w-full accent-[#365CF5]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">5. Punctuality & Schedule Adherence</span>
                  <span className="font-mono font-bold text-blue-600">{punctuality} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={punctuality}
                  onChange={e => setPunctuality(Number(e.target.value))}
                  className="w-full accent-[#365CF5]"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">6. Ownership & Responsibility</span>
                  <span className="font-mono font-bold text-blue-600">{responsibility} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={responsibility}
                  onChange={e => setResponsibility(Number(e.target.value))}
                  className="w-full accent-[#365CF5]"
                />
              </div>

              {/* Calculated Final Rating Preview */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-900">Calculated Final Rating:</span>
                <span className="text-base font-bold font-mono text-[#365CF5]">{calculatedRating} / 5.0</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Manager Comments & Feedback *</label>
                <textarea
                  required
                  rows={3}
                  value={managerComments}
                  onChange={e => setManagerComments(e.target.value)}
                  placeholder="Key accomplishments, strengths, and goals for upcoming cycle..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee Reflection (Optional)</label>
                <textarea
                  rows={2}
                  value={employeeComments}
                  onChange={e => setEmployeeComments(e.target.value)}
                  placeholder="Employee feedback or personal milestone reflections..."
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
                  Publish Appraisal Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
