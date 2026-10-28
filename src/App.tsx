import React, { useState } from 'react';
import { HRMSProvider, useHRMS } from './context/HRMSContext';
import { Login } from './pages/Login';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { TasksPage } from './pages/TasksPage';
import { PerformancePage } from './pages/PerformancePage';
import { PayrollPage } from './pages/PayrollPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, activeNav } = useHRMS();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If not authenticated, show professional login screen
  if (!currentUser) {
    return <Login />;
  }

  // Render active module
  const renderContent = () => {
    const employeePages = ['dashboard', 'attendance', 'leave', 'tasks', 'documents', 'payroll', 'holidays', 'announcements'];
    if (currentUser.role === 'employee' && !employeePages.includes(activeNav)) {
      return <EmployeeDashboard />;
    }

    switch (activeNav) {
      case 'dashboard':
        return currentUser.role === 'employee' ? <EmployeeDashboard /> : <AdminDashboard />;
      case 'employees':
        return <EmployeesPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'leave':
        return <LeavePage />;
      case 'tasks':
        return <TasksPage />;
      case 'performance':
        return <PerformancePage />;
      case 'payroll':
        return <PayrollPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'departments':
        return <DepartmentsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'holidays':
        return <HolidaysPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'audit-log':
        return <AuditLogPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex text-[#111827]">
      {/* Collapsible / Drawer Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        setIsMobileOpen={setIsMobileSidebarOpen} 
      />

      {/* Main Content Frame */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Header */}
        <div className="flex items-center">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-3.5 text-slate-600 hover:text-slate-900 bg-white border-b border-slate-200"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Header />
          </div>
        </div>

        {/* Viewport Content */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Mobile Fixed Bottom Navigation */}
        <MobileNav />

        {/* Global Cmd+K Search Modal */}
        <GlobalSearchModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <HRMSProvider>
      <AppContent />
    </HRMSProvider>
  );
}
