import { ClipboardList, GraduationCap, LogOut, Mail, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const teacherLinks = [
  ['Command', '.', GraduationCap],
  ['Students', '.', Users],
  ['Assignments', '.', ClipboardList],
  ['Enquiries', '.', Mail],
];

export function TeacherLayout() {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 lg:grid lg:grid-cols-[270px_1fr]">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between border-b border-white/10 bg-navy-900/80 p-4 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 font-black text-amber-400">
            AT
          </span>
          <div>
            <p className="font-heading font-bold text-white leading-tight">Command Center</p>
            <p className="text-[10px] text-slate-400">{profile?.displayName || 'Apex educator'}</p>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:flex border-b border-white/10 bg-navy-900/80 p-4 backdrop-blur-xl lg:min-h-screen lg:border-b-0 lg:border-r flex-col justify-between">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 font-black text-amber-400">
              AT
            </span>
            <div>
              <p className="font-heading font-bold text-white">Command Center</p>
              <p className="text-xs text-slate-400">{profile?.displayName || 'Apex educator'}</p>
            </div>
          </div>
          <nav className="grid gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {teacherLinks.map(([label, to, Icon]) => (
              <NavLink className="apex-button-secondary justify-start" end key={label} to={to}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button className="apex-button-secondary mt-4 w-full justify-start shrink-0" onClick={logout} type="button">
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      {/* Main Content Viewport */}
      <div className="pb-20 lg:pb-0">
        <Outlet />
      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-navy-900/90 p-2 backdrop-blur-xl flex items-center justify-around shadow-2xl">
        {teacherLinks.map(([label, to, Icon]) => (
          <NavLink 
            className={({ isActive }) => `flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all min-h-12 w-16 ${
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
          className="flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-red-400 transition-all min-h-12 w-16"
        >
          <LogOut size={20} className="mb-1" />
          Exit
        </button>
      </nav>
    </div>
  );
}
