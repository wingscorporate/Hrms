import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Clock, 
  Calendar, 
  DollarSign, 
  Check, 
  RotateCcw, 
  ShieldCheck,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useHRMS } from '../context/HRMSContext';

export const SettingsPage: React.FC = () => {
  const { companySettings, updateCompanySettings, resetAllData, currentUser } = useHRMS();

  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [tagline, setTagline] = useState(companySettings.tagline);
  const [address, setAddress] = useState(companySettings.address);
  const [email, setEmail] = useState(companySettings.email);
  const [phone, setPhone] = useState(companySettings.phone);
  const [officeStartTime, setOfficeStartTime] = useState(companySettings.officeStartTime);
  const [officeEndTime, setOfficeEndTime] = useState(companySettings.officeEndTime);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(companySettings.gracePeriodMinutes);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(companySettings.workingHoursPerDay);
  const [financialYear, setFinancialYear] = useState(companySettings.financialYear);
  const [isSaved, setIsSaved] = useState(false);

  const canEdit = currentUser?.role === 'super_admin' || currentUser?.role === 'hr';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      companyName,
      tagline,
      address,
      email,
      phone,
      officeStartTime,
      officeEndTime,
      gracePeriodMinutes: Number(gracePeriodMinutes),
      workingHoursPerDay: Number(workingHoursPerDay),
      financialYear
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Wings Corporation Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise rules, office hours, biometric grace periods, and company identifiers.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset entire system to initial demonstration dataset? All edits will be restored.')) {
                resetAllData();
                alert('Database successfully restored to pristine demonstration state.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Data</span>
          </button>
        )}
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Company settings updated successfully across all operational modules.</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#365CF5]" />
            <span>Company Brand & Profile</span>
          </h2>

          <div className="flex items-center gap-4 pt-2">
            <div>
              <div className="font-extrabold text-slate-900 text-lg tracking-tight">Wings Corporation</div>
              <div className="text-xs text-slate-500 mt-0.5">{companySettings.tagline}</div>
              <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Verified Corporate Entity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Tagline</label>
              <input
                type="text"
                disabled={!canEdit}
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official HR Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Phone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Registered HQ Address</label>
            <input
              type="text"
              disabled={!canEdit}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Operating Hours & Attendance Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#365CF5]" />
            <span>Attendance Timings & Compliance Thresholds</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Start Time</label>
              <input
                type="time"
                disabled={!canEdit}
                value={officeStartTime}
                onChange={e => setOfficeStartTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift End Time</label>
              <input
                type="time"
                disabled={!canEdit}
                value={officeEndTime}
                onChange={e => setOfficeEndTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grace Buffer (Mins)</label>
              <input
                type="number"
                disabled={!canEdit}
                value={gracePeriodMinutes}
                onChange={e => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Work Hours</label>
              <input
                type="number"
                disabled={!canEdit}
                value={workingHoursPerDay}
                onChange={e => setWorkingHoursPerDay(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Financial Year</label>
              <input
                type="text"
                disabled={!canEdit}
                value={financialYear}
                onChange={e => setFinancialYear(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Code</label>
              <input
                type="text"
                disabled
                value="INR (₹) - Indian Rupee"
                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-100 font-mono text-slate-600"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1D2B45] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Company Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
