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
      <aside className="border-b border-white/10 bg-navy-900/80 p-4 backdrop-blur-xl lg:min-h-screen lg:border-b-0 lg:border-r">
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
        <button className="apex-button-secondary mt-4 w-full justify-start" onClick={logout} type="button">
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <Outlet />
    </div>
  );
}
