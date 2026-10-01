import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  Calendar, 
  User, 
  LayoutGrid, 
  List, 
  X, 
  Send, 
  CheckCircle2, 
  Briefcase
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { TaskItem, TaskPriority, TaskStatus } from '../types';
import { Avatar } from '../components/common/Avatar';

export const TasksPage: React.FC = () => {
  const { 
    tasks, 
    employees, 
    departments, 
    currentUser, 
    createTask, 
    updateTaskStatus, 
    addTaskComment 
  } = useHRMS();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  // Task Creation Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('emp-5');
  const [clientName, setClientName] = useState('Wings Corporation');
  const [projectName, setProjectName] = useState('Digital Transformation');
  const [departmentId, setDepartmentId] = useState('dept-2');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [startDate, setStartDate] = useState('2026-09-28');
  const [deadline, setDeadline] = useState('2026-10-10');

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const overdueTasks = tasks.filter(t => t.deadline < '2026-09-28' && t.status !== 'Completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const kanbanColumns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'To Do', label: 'To Do', color: 'border-slate-300' },
    { status: 'In Progress', label: 'In Progress', color: 'border-blue-400' },
    { status: 'In Review', label: 'In Review', color: 'border-purple-400' },
    { status: 'Completed', label: 'Completed', color: 'border-emerald-400' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title,
      description,
      assignedToId,
      createdById: currentUser?.employeeId || 'emp-1',
      clientName,
      projectName,
      departmentId,
      priority,
      startDate,
      deadline,
      status: 'To Do'
    });

    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentInput.trim()) return;
    addTaskComment(selectedTask.id, commentInput);
    setCommentInput('');
    // refresh selected task comments locally
    const updated = tasks.find(t => t.id === selectedTask.id);
    if (updated) setSelectedTask({ ...updated });
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low': return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Internal Task Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor client project deliverables, assign tasks, inspect reviews, and track team completion velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md flex items-center gap-1 ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center gap-1 ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'}`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task Summary Stat Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Tasks Assigned</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">{totalTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">In Progress</span>
          <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1">{inProgressTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Completed</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">{completedTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Overdue</span>
          <div className="text-2xl font-bold text-red-600 font-mono tabular-nums mt-1">{overdueTasks}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Completion Rate</span>
          <div className="text-2xl font-bold text-purple-600 font-mono tabular-nums mt-1">{completionRate}%</div>
        </div>
      </div>

      {/* View 1: Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.status);
            return (
              <div key={col.status} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 flex flex-col max-h-[75vh]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">{col.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white rounded border border-slate-200 font-bold text-slate-500">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      No tasks in this lane
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const assignee = employees.find(e => e.id === task.assignedToId);
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-[#365CF5] transition-all cursor-pointer space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{task.deadline}</span>
                          </div>

                          <h3 className="font-bold text-slate-900 line-clamp-2 leading-snug hover:text-[#365CF5] transition-colors">
                            {task.title}
                          </h3>

                          {task.projectName && (
                            <div className="text-[11px] text-slate-500 truncate">
                              {task.projectName}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Avatar
                                name={assignee?.fullName || ''}
                                size="xs"
                              />
                              <span className="text-slate-600 font-medium truncate max-w-[90px]">
                                {assignee?.firstName}
                              </span>
                            </div>

                            {task.comments.length > 0 && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <MessageSquare className="w-3 h-3" />
                                <span className="font-mono">{task.comments.length}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Task Title</th>
                <th className="py-3 px-3 font-semibold">Assignee</th>
                <th className="py-3 px-3 font-semibold">Project</th>
                <th className="py-3 px-3 font-semibold">Priority</th>
                <th className="py-3 px-3 font-semibold">Deadline</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(task => {
                const assignee = employees.find(e => e.id === task.assignedToId);
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate cursor-pointer" onClick={() => setSelectedTask(task)}>
                      {task.title}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={assignee?.fullName || ''}
                          size="xs"
                        />
                        <span className="text-slate-700">{assignee?.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{task.projectName || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{task.deadline}</td>
                    <td className="py-3 px-3">
                      <select
                        value={task.status}
                        onChange={e => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="px-2 py-1 border border-slate-200 rounded bg-white text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="text-[#365CF5] font-semibold hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Details & Comments Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
                <span className="text-xs font-mono text-slate-500">Due {selectedTask.deadline}</span>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <h2 className="text-base font-bold text-slate-900">{selectedTask.title}</h2>
              <p className="text-slate-600 leading-relaxed">{selectedTask.description}</p>

              {/* Status Switcher */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Workflow Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={e => {
                    updateTaskStatus(selectedTask.id, e.target.value as TaskStatus);
                    setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus });
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-900"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Comments Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#365CF5]" />
                  <span>Discussion & Progress Updates ({selectedTask.comments.length})</span>
                </h3>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {selectedTask.comments.length === 0 ? (
                    <div className="text-center py-4 text-slate-400">No comments yet. Start the conversation.</div>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{c.authorName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.createdAt}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder="Type progress update, blocker, or feedback..."
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create New Team Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Audit Form 24Q compliance and submit payroll vouchers"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Technical requirements, deliverables, and acceptance criteria..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden focus:ring-1 focus:ring-[#365CF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Employee</label>
                  <select
                    value={assignedToId}
                    onChange={e => setAssignedToId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
