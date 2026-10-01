import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login } = useHRMS();
  const [email, setEmail] = useState('official.wingsmarketing@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      login(selectedRole, email);
      setIsLoading(false);
    }, 400);
  };

  const handleQuickDemoSelect = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('wingscorp2026');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D2B45]">
          Wings Corporation
        </h1>
        <div className="text-sm font-semibold text-[#365CF5] tracking-wide mt-1">
          Wings HRMS Portal
        </div>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
          "Manage your workforce. Simplify your workplace."
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#365CF5] focus:border-transparent outline-hidden transition-all text-slate-900"
                  placeholder="name@wingscorp.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('For demonstration mode, password reset has been bypassed. Use any role below to sign in instantly.')}
                  className="text-[11px] font-medium text-[#365CF5] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#365CF5] focus:border-transparent outline-hidden transition-all text-slate-900"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#365CF5] focus:ring-[#365CF5] w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-600">Remember me for 30 days</span>
              </label>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-[#1D2B45] hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#1D2B45] transition-colors cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Roles */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demo Roles
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('super_admin', 'official.wingsmarketing@gmail.com')}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  selectedRole === 'super_admin' && email === 'official.wingsmarketing@gmail.com'
                    ? 'border-[#1D2B45] bg-slate-50 ring-1 ring-[#1D2B45]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Org. Admin</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Harshita (7044514241)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('super_admin', 'retail@wings-marketing.in')}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  email === 'retail@wings-marketing.in'
                    ? 'border-[#1D2B45] bg-slate-50 ring-1 ring-[#1D2B45]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Org. Admin</span>
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Ardhendu (9230554211)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('manager', 'sakshijais0309@gmail.com')}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  selectedRole === 'manager'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Manager</span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Sakshi Jaiswal</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoSelect('employee', 'subhasish.bose@wings-marketing.in')}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  selectedRole === 'employee'
                    ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-[11px]">Executive</span>
                  <User className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Subhasish Bose</div>
              </button>
            </div>

            <div className="mt-4 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-500 flex items-center justify-center gap-1.5 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full PostgreSQL & RBAC simulated data loaded</span>
            </div>
          </div>
        </div>

        {/* Corporate footer */}
        <div className="text-center mt-6 text-[11px] text-slate-400">
          © 2026 Wings Corporation. All corporate rights reserved.
        </div>
      </div>
    </div>
  );
};
