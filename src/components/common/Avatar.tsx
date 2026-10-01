import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  role?: string;
}

const colorPairs = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-amber-100 text-amber-900 border-amber-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-cyan-100 text-cyan-900 border-cyan-200',
  'bg-teal-100 text-teal-900 border-teal-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-slate-100 text-slate-800 border-slate-300'
];

function getInitials(name: string): string {
  if (!name) return 'W';
  const clean = name.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % colorPairs.length;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  size = 'md', 
  className = '',
  role
}) => {
  const initials = getInitials(name);
  const colorClass = colorPairs[getColorIndex(name || 'user')];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] font-bold',
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-9 h-9 text-xs font-bold',
    lg: 'w-11 h-11 text-sm font-extrabold',
    xl: 'w-16 h-16 text-lg font-black tracking-wide'
  }[size];

  return (
    <div
      aria-label={name}
      title={`${name}${role ? ` (${role})` : ''}`}
      className={`inline-flex items-center justify-center shrink-0 rounded-lg border select-none ${sizeClasses} ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
};
