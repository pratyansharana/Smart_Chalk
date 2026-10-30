import { BookOpen, CalendarDays, GraduationCap, LogOut, Upload, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const studentLinks = [
  ['Overview', '.', GraduationCap],
  ['Classes', '.', CalendarDays],
  ['Assignments', '.', BookOpen],
  ['Uploads', '.', Upload],
];

export function StudentLayout() {
  const { profile, logout } = useAuth();
  const [parentMode, setParentMode] = useState(
    localStorage.getItem('parent_mode_active') === 'true'
  );

  const toggleParentMode = () => {
    const nextVal = !parentMode;
    setParentMode(nextVal);
    localStorage.setItem('parent_mode_active', String(nextVal));
  };

  const studentLinks = parentMode 
    ? [['Overview Report', '.', GraduationCap]]
    : [
        ['Overview', '.', GraduationCap],
        ['Classes', '.', CalendarDays],
        ['Assignments', '.', BookOpen],
        ['Uploads', '.', Upload],
      ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Mobile Top Header */}
      <header className={`lg:hidden flex items-center justify-between border-b bg-navy-900/80 p-4 sticky top-0 z-40 backdrop-blur-xl transition-all duration-300 ${
        parentMode ? 'border-b-indigo-500/20' : 'border-b-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`grid size-11 place-items-center rounded-2xl border font-black transition-all ${
            parentMode 
              ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-400'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-400'
          }`}>
            {parentMode ? 'PP' : 'AT'}
          </span>
          <div>
            <p className="font-heading font-bold text-white text-base">
              {parentMode ? 'Parent Portal' : 'Student Hub'}
            </p>
            <p className="text-[10px] text-slate-400">
              {parentMode ? `Child: ${profile?.displayName || 'Learner'}` : (profile?.displayName || 'Learner')}
            </p>
          </div>
        </div>

        {/* Parent View Switch Toggle */}
        <div className={`p-2 rounded-xl border flex items-center gap-2 shadow-inner transition-all ${
          parentMode ? 'border-indigo-500/20 bg-indigo-500/[0.02]' : 'border-white/5 bg-white/[0.02]'
        }`}>
          <Users size={14} className={parentMode ? 'text-indigo-400' : 'text-slate-500'} />
          <button
            aria-label="Toggle parent view"
            aria-pressed={parentMode}
            onClick={toggleParentMode}
            type="button"
            className="relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <span aria-hidden="true" className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${parentMode ? 'bg-indigo-400' : 'bg-navy-800'}`}>
              <span className={`absolute left-0.5 top-0.5 size-3 rounded-full bg-navy-950 shadow transition-transform ${parentMode ? 'translate-x-3' : 'translate-x-0'}`} />
            </span>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className={`hidden lg:flex border-b border-white/10 bg-navy-900/80 p-4 backdrop-blur-xl lg:min-h-screen lg:border-b-0 lg:border-r flex-col justify-between transition-colors duration-300 ${
        parentMode ? 'border-r-indigo-500/20' : 'border-r-white/10'
      }`}>
        <div>
          <div className="mb-6 flex items-center gap-3">
            <span className={`grid size-11 place-items-center rounded-2xl border font-black transition-all ${
              parentMode 
                ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-400'
                : 'border-amber-400/30 bg-amber-500/10 text-amber-400'
            }`}>
              {parentMode ? 'PP' : 'AT'}
            </span>
            <div>
              <p className="font-heading font-bold text-white transition-all">
                {parentMode ? 'Parent Portal' : 'Student Hub'}
              </p>
              <p className="text-xs text-slate-400">
                {parentMode ? `Child: ${profile?.displayName || 'Learner'}` : (profile?.displayName || 'Learner')}
              </p>
            </div>
          </div>

          {/* Parent View Switch Toggle */}
          <div className={`mb-6 p-3 rounded-xl border flex items-center justify-between shadow-inner transition-all ${
            parentMode ? 'border-indigo-500/20 bg-indigo-500/[0.02]' : 'border-white/5 bg-white/[0.02]'
          }`}>
            <div className="flex items-center gap-2">
              <Users size={16} className={parentMode ? 'text-indigo-400' : 'text-slate-500'} />
              <div>
                <p className="text-xs font-bold text-slate-200">Parent View</p>
                <p className="text-[9px] text-slate-500 leading-none mt-0.5">Show progress reports</p>
              </div>
            </div>
            <button
              onClick={toggleParentMode}
              type="button"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                parentMode ? 'bg-indigo-400' : 'bg-navy-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-navy-950 shadow ring-0 transition duration-200 ease-in-out ${
                  parentMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <nav className="grid gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {studentLinks.map(([label, to, Icon]) => (
              <NavLink 
                className={`apex-button-secondary justify-start transition-all ${
                  parentMode ? 'hover:border-indigo-500/30 hover:bg-indigo-500/10' : 'hover:border-amber-500/40 hover:bg-amber-500/10'
                }`} 
                end 
                key={label} 
                to={to}
              >
                <Icon size={17} className={parentMode ? 'text-indigo-400' : 'text-amber-400'} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button 
          className={`apex-button-secondary mt-4 w-full justify-start shrink-0 transition-all ${
            parentMode ? 'hover:border-indigo-500/30 hover:bg-indigo-500/10' : ''
          }`} 
          onClick={logout} 
          type="button"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      {/* Main Content Viewport */}
      <div className="transition-all pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <Outlet context={{ parentMode }} />
      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-navy-900/90 p-2 mobile-tab-safe-area backdrop-blur-xl flex items-center justify-around shadow-2xl">
          {studentLinks.map(([label, to, Icon]) => (
            <NavLink 
              className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 rounded-xl text-[10px] text-center font-bold transition-all min-h-12 ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`} 
              end 
              key={label} 
              to={to}
            >
              <Icon size={20} className="mb-1" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={logout}
            type="button"
            className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 rounded-xl text-[10px] text-center font-bold text-slate-400 hover:text-red-400 transition-all min-h-12"
          >
            <LogOut size={20} className="mb-1" />
            Exit
          </button>
      </nav>
    </div>
  );
}
