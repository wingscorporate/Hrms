import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Calendar, 
  ChevronDown, 
  UserCheck, 
  Clock, 
  LogOut, 
  Shield, 
  Briefcase, 
  User, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';
import { Avatar } from '../common/Avatar';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    switchRole, 
    logout, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    todayAttendance,
    checkIn,
    checkOut,
    setIsSearchOpen,
    setActiveNav
  } = useHRMS();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const roles: { role: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Full corporate authority & audit logs', icon: <Shield className="w-4 h-4 text-purple-600" /> },
    { role: 'hr', label: 'HR Manager', desc: 'Workforce, payroll & employee affairs', icon: <Briefcase className="w-4 h-4 text-blue-600" /> },
    { role: 'manager', label: 'Team Manager', desc: 'Department attendance, tasks & reviews', icon: <UserCheck className="w-4 h-4 text-emerald-600" /> },
    { role: 'employee', label: 'Staff Employee', desc: 'Self-service attendance, leave & tasks', icon: <User className="w-4 h-4 text-amber-600" /> },
  ];

  const currentDateFormatted = new Date('2026-09-28T09:30:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left zone: Global Search affordance */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200/80 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search employees, tasks, departments...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right zone: Date, Quick Punch, Notifications, User & Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Quick Punch Status (if checked in / checked out) */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2">
            {todayAttendance?.checkIn && !todayAttendance.checkOut ? (
              <button
                onClick={checkOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Click to Check Out"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Punch Out ({todayAttendance.checkIn})</span>
              </button>
            ) : !todayAttendance?.checkIn ? (
              <button
                onClick={checkIn}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Click to Check In"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Check In</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium">
                Punched: {todayAttendance.checkIn} - {todayAttendance.checkOut}
              </span>
            )}
          </div>
        )}

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-[#365CF5] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.linkUrl) setActiveNav(n.linkUrl);
                        setIsNotifOpen(false);
                      }}
                      className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.createdAt.split(' ')[0]}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 mx-0.5" />

        {/* User Profile & Role Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer group"
          >
            <Avatar 
              name={currentUser?.fullName || 'User'} 
              size="sm" 
              role={currentUser?.role} 
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span>{currentUser?.fullName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
              <div className="text-[11px] text-slate-500 font-medium capitalize flex items-center gap-1">
                <span>{currentUser?.role.replace('_', ' ')}</span>
                <span className="text-slate-300">·</span>
                <span className="text-[#365CF5] font-semibold">{currentUser?.employeeId}</span>
              </div>
            </div>
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser?.fullName}</div>
                <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{currentUser?.designation}</div>
              </div>

              {/* Quick Role Switcher section */}
              <div className="p-2 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Switch Active Role (Demo)
                </div>
                <div className="space-y-0.5">
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        currentUser?.role === r.role 
                          ? 'bg-blue-50 text-[#365CF5] font-semibold' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <div>
                          <div>{r.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{r.desc}</div>
                        </div>
                      </div>
                      {currentUser?.role === r.role && (
                        <Check className="w-3.5 h-3.5 text-[#365CF5]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log out option */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsRoleMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
