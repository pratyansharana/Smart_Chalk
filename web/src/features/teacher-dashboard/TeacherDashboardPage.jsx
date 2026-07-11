import { CalendarPlus, Mail, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLeads } from '../../hooks/useLeads';
import { useStudents } from '../../hooks/useStudents';
import { useTeacherClasses } from '../../hooks/useTeacherClasses';
import { LeadsTable } from './components/LeadsTable';
import { ScheduleManager } from './components/ScheduleManager';

export function TeacherDashboardPage() {
  const { currentUser, profile } = useAuth();
  const teacherId = currentUser?.uid;
  const students = useStudents();
  const classes = useTeacherClasses(teacherId);
  const leads = useLeads();

  const cards = [
    ['Students Roster', students.data.length, Users],
    ['Enquiries/Leads', leads.data.length, Mail],
    ['Class Batches', classes.data.length, GraduationCap],
  ];

  return (
    <main className="p-4 lg:p-8">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Teacher workspace</p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-white">Command center</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Welcome, {profile?.displayName || 'educator'}. Manage your leads, active batches, and student classrooms from one real-time Firebase workspace.
      </p>

      {/* Metrics Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map(([title, value, Icon]) => (
          <section className="glass-card p-5" key={title}>
            <Icon className="text-amber-400" size={24} />
            <h2 className="mt-4 font-heading text-xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-3xl font-black text-amber-400">{value}</p>
          </section>
        ))}
      </div>

      {/* Main Workspace Split */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="min-w-0">
          <ScheduleManager classes={classes.data} students={students.data} teacherId={teacherId} />
        </div>
        <div className="min-w-0">
          <LeadsTable teacherId={teacherId} />
        </div>
      </div>
    </main>
  );
}
