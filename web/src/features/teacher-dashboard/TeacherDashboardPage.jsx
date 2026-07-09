import { CalendarPlus, ClipboardList, Mail, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLeads } from '../../hooks/useLeads';
import { useStudents } from '../../hooks/useStudents';
import { useTeacherAssignments } from '../../hooks/useTeacherAssignments';
import { useTeacherClasses } from '../../hooks/useTeacherClasses';
import { useTeacherSubmissions } from '../../hooks/useTeacherSubmissions';
import { AssignmentCreator } from './components/AssignmentCreator';
import { LeadsTable } from './components/LeadsTable';
import { ScheduleManager } from './components/ScheduleManager';
import { SubmissionGrader } from './components/SubmissionGrader';

export function TeacherDashboardPage() {
  const { currentUser, profile } = useAuth();
  const teacherId = currentUser?.uid;
  const students = useStudents();
  const classes = useTeacherClasses(teacherId);
  const assignments = useTeacherAssignments(teacherId);
  const submissions = useTeacherSubmissions(assignments.data);
  const leads = useLeads();

  const cards = [
    ['Students', students.data.length, Users],
    ['Assignments', assignments.data.length, ClipboardList],
    ['Enquiries', leads.data.length, Mail],
    ['Classes', classes.data.length, CalendarPlus],
  ];

  return (
    <main className="p-5 lg:p-8">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Teacher workspace</p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-white">Command center</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Welcome, {profile?.displayName || 'educator'}. Manage leads, classes, assignments, and grading from one real-time Firebase workspace.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, Icon]) => (
          <section className="glass-card p-5" key={title}>
            <Icon className="text-amber-400" size={24} />
            <h2 className="mt-4 font-heading text-xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-3xl font-black text-amber-400">{value}</p>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ScheduleManager classes={classes.data} students={students.data} teacherId={teacherId} />
        <AssignmentCreator classes={classes.data} students={students.data} teacherId={teacherId} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <LeadsTable teacherId={teacherId} />
        <SubmissionGrader
          assignments={assignments.data}
          error={submissions.error}
          loading={submissions.loading || assignments.loading}
          submissions={submissions.data}
          teacherId={teacherId}
        />
      </div>
    </main>
  );
}
