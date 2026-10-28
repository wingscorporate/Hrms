import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CheckSquare, 
  CalendarOff, 
  User, 
  Clock 
} from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';

export const MobileNav: React.FC = () => {
  const { 
    activeNav, 
    setActiveNav, 
    todayAttendance, 
    checkIn, 
    checkOut,
    currentUser 
  } = useHRMS();

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setActiveNav('dashboard')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
          activeNav === 'dashboard' ? 'text-[#365CF5]' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setActiveNav('attendance')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
          activeNav === 'attendance' ? 'text-[#365CF5]' : 'text-slate-500'
        }`}
      >
        <CalendarCheck className="w-5 h-5" />
        <span>Attendance</span>
      </button>

      {/* Prominent Quick Punch Button in Center */}
      <div className="-mt-5">
        <button
          onClick={isCheckedIn ? checkOut : checkIn}
          className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-white shadow-lg border-2 border-white transition-transform active:scale-95 ${
            isCheckedIn ? 'bg-amber-600' : 'bg-[#16A34A]'
          }`}
          title={isCheckedIn ? 'Punch Out' : 'Punch In'}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tight">
            {isCheckedIn ? 'Out' : 'In'}
          </span>
        </button>
      </div>

      <button
        onClick={() => setActiveNav('tasks')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
          activeNav === 'tasks' ? 'text-[#365CF5]' : 'text-slate-500'
        }`}
      >
        <CheckSquare className="w-5 h-5" />
        <span>Tasks</span>
      </button>

      <button
        onClick={() => setActiveNav('leave')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
          activeNav === 'leave' ? 'text-[#365CF5]' : 'text-slate-500'
        }`}
      >
        <CalendarOff className="w-5 h-5" />
        <span>Leave</span>
      </button>
    </div>
  );
};
