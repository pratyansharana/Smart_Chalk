import { useAssignments } from '../../hooks/useAssignments';
import { useAuth } from '../../hooks/useAuth';
import { useClasses } from '../../hooks/useClasses';
import { useSubmissions } from '../../hooks/useSubmissions';
import { AssignmentsCard } from './components/AssignmentsCard';
import { GradeVisualizerCard } from './components/GradeVisualizerCard';
import { UpcomingClassesCard } from './components/UpcomingClassesCard';

export function StudentDashboardPage() {
  const { currentUser, profile } = useAuth();
  const studentId = currentUser?.uid;
  const classes = useClasses(studentId);
  const assignments = useAssignments(studentId);
  const submissions = useSubmissions(studentId);

  return (
    <main className="p-5 lg:p-8">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Student workspace</p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-white">Welcome back, {profile?.displayName || 'learner'}.</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Your live classes, pending assignments, uploads, and grades update in real time from Firebase.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <UpcomingClassesCard classes={classes.data} error={classes.error} loading={classes.loading} />
        <GradeVisualizerCard error={submissions.error} loading={submissions.loading} submissions={submissions.data} />
        <AssignmentsCard
          assignments={assignments.data}
          error={assignments.error}
          loading={assignments.loading || submissions.loading}
          studentId={studentId}
          submissions={submissions.data}
        />
      </div>
    </main>
  );
}
