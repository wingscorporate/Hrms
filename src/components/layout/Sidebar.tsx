import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CalendarOff, 
  CheckSquare, 
  Award, 
  DollarSign, 
  FileText, 
  Building2, 
  BarChart3, 
  Calendar, 
  Megaphone, 
  ShieldCheck, 
  Settings, 
  LogOut,
  X,
  Sparkles
} from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeNav, setActiveNav, currentUser, logout } = useHRMS();

  const role = currentUser?.role || 'employee';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'employees', label: 'Employees', icon: <Users className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'leave', label: 'Leave', icon: <CalendarOff className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <Award className="w-4 h-4" /> },
    { id: 'payroll', label: 'Payroll', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'departments', label: 'Departments', icon: <Building2 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'holidays', label: 'Holidays', icon: <Calendar className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
  ];

  // Super Admin audit log link
  if (role === 'super_admin') {
    navItems.push({ id: 'audit-log', label: 'Audit Logs', icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> });
  }

  const employeeNavItems = ['dashboard', 'attendance', 'leave', 'tasks', 'documents', 'payroll', 'holidays', 'announcements'];
  const visibleNavItems = role === 'employee'
    ? navItems.filter(item => employeeNavItems.includes(item.id))
    : navItems;

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#1D2B45] text-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out select-none border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="h-16 px-5 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <div className="text-base font-extrabold tracking-tight text-white leading-tight">
                  Wings Corporation
                </div>
                <div className="text-[11px] font-medium text-slate-400 tracking-tight mt-0.5">
                  HRMS Portal
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="py-3 px-3 overflow-y-auto max-h-[calc(100vh-14rem)] space-y-0.5 text-xs font-medium">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
              Workspace Menu
            </div>

            {visibleNavItems.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group cursor-pointer ${
                    isActive 
                      ? 'bg-[#365CF5] text-white shadow-xs font-semibold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Settings Section */}
        <div className="p-3 border-t border-slate-700/60 bg-[#162136]">
          {role !== 'employee' && (
            <div className="space-y-0.5 text-xs font-medium mb-2">
              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left cursor-pointer ${
                  activeNav === 'settings' 
                    ? 'bg-[#365CF5] text-white font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Company Settings</span>
              </button>
            </div>
          )}

          {/* Current User Card */}
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar 
                name={currentUser?.fullName || 'User'} 
                size="sm" 
              />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser?.fullName}
                </div>
                <div className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-semibold">
                  {role.replace('_', ' ')}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-md transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
