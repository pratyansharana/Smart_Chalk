import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Trophy, Loader2, Download, FolderOpen, FileText } from 'lucide-react';
import { useAssignments } from '../../hooks/useAssignments';
import { useAuth } from '../../hooks/useAuth';
import { useClasses } from '../../hooks/useClasses';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useEnrolledTests } from '../../hooks/useEnrolledTests';
import { useEnrolledQuizzes } from '../../hooks/useEnrolledQuizzes';
import { useEnrolledVaultItems } from '../../hooks/useEnrolledVaultItems';
import { AssignmentsCard } from './components/AssignmentsCard';
import { GradeVisualizerCard } from './components/GradeVisualizerCard';
import { UpcomingClassesCard } from './components/UpcomingClassesCard';

export function StudentDashboardPage() {
  const { currentUser, profile } = useAuth();
  const studentId = currentUser?.uid;
  const classes = useClasses(studentId);
  const assignments = useAssignments(studentId);
  const submissions = useSubmissions(studentId);

  const batchIds = classes.data.map((c) => c.id);
  const enrolledTests = useEnrolledTests(batchIds);
  const enrolledQuizzes = useEnrolledQuizzes(batchIds);
  const enrolledVault = useEnrolledVaultItems(batchIds);

  return (
    <main className="p-5 lg:p-8">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Student workspace</p>
      <h1 className="mt-3 font-heading text-4xl font-bold text-white">Welcome back, {profile?.displayName || 'learner'}.</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Your live classes, pending assignments, uploads, and grades update in real time from Firebase.
      </p>

      {/* Main interactive grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <UpcomingClassesCard classes={classes.data} studentId={studentId} error={classes.error} loading={classes.loading} />
        <GradeVisualizerCard error={submissions.error} loading={submissions.loading} submissions={submissions.data} />
        <AssignmentsCard
          assignments={assignments.data}
          error={assignments.error}
          loading={assignments.loading || submissions.loading}
          studentId={studentId}
          submissions={submissions.data}
        />
      </div>

      {/* Vault, Tests & Quizzes summary overview */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Vault Items Card */}
        <section className="glass-card p-5">
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
            <BookOpen className="text-amber-400" size={20} />
            Syllabus & Vault
          </h2>
          {enrolledVault.loading && <Loader2 className="animate-spin text-amber-400" size={16} />}
          {!enrolledVault.loading && enrolledVault.data.length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/[0.005]">
              <FolderOpen className="text-slate-600 mx-auto mb-2" size={24} />
              <p className="text-xs text-slate-400 font-semibold">No vault resources uploaded</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Your teacher will upload study materials here.</p>
            </div>
          )}
          <div className="grid gap-3">
            {enrolledVault.data.slice(0, 3).map((item) => {
              const batchName = classes.data.find((c) => c.id === item.classId)?.title || 'Batch';
              return (
                <div className="border border-white/5 bg-white/[0.01] p-3 rounded-xl flex flex-col justify-between" key={item.id}>
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{batchName}</span>
                    <h3 className="font-bold text-slate-200 text-sm mt-0.5">{item.title}</h3>
                  </div>
                  {item.fileURL && (
                    <a
                      className="apex-button-primary py-1 px-2.5 text-[10px] flex items-center gap-1.5 self-end mt-2 bg-amber-400/10 border-amber-400/20 text-amber-300 hover:bg-amber-400/20"
                      href={item.fileURL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download size={10} />
                      Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Tests Card */}
        <section className="glass-card p-5">
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
            <ClipboardList className="text-amber-400" size={20} />
            Active Tests
          </h2>
          {enrolledTests.loading && <Loader2 className="animate-spin text-amber-400" size={16} />}
          {!enrolledTests.loading && enrolledTests.data.length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/[0.005]">
              <FileText className="text-slate-600 mx-auto mb-2" size={24} />
              <p className="text-xs text-slate-400 font-semibold">No active tests assigned</p>
              <p className="text-[10px] text-slate-500 mt-0.5">No syllabus-compliant tests scheduled right now.</p>
            </div>
          )}
          <div className="grid gap-3">
            {enrolledTests.data.slice(0, 3).map((test) => {
              const batchName = classes.data.find((c) => c.id === test.classId)?.title || 'Batch';
              return (
                <div className="border border-white/5 bg-white/[0.01] p-3 rounded-xl flex items-center justify-between gap-3" key={test.id}>
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{batchName}</span>
                    <h3 className="font-bold text-slate-200 text-sm mt-0.5">{test.title}</h3>
                    <p className="text-[9px] text-slate-500 mt-1">Due: {new Date(test.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Link
                    className="apex-button-secondary py-1 px-2 text-[10px] flex-shrink-0"
                    to={`batch/${test.classId}`}
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quizzes Card */}
        <section className="glass-card p-5">
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Trophy className="text-amber-400" size={20} />
            Active Quizzes
          </h2>
          {enrolledQuizzes.loading && <Loader2 className="animate-spin text-amber-400" size={16} />}
          {!enrolledQuizzes.loading && enrolledQuizzes.data.length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/[0.005]">
              <Trophy className="text-slate-600 mx-auto mb-2" size={24} />
              <p className="text-xs text-slate-400 font-semibold">No active quizzes published</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Stay tuned for real-time quiz competitions!</p>
            </div>
          )}
          <div className="grid gap-3">
            {enrolledQuizzes.data.slice(0, 3).map((quiz) => {
              const batchName = classes.data.find((c) => c.id === quiz.classId)?.title || 'Batch';
              return (
                <div className="border border-white/5 bg-white/[0.01] p-3 rounded-xl flex items-center justify-between gap-3" key={quiz.id}>
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{batchName}</span>
                    <h3 className="font-bold text-slate-200 text-sm mt-0.5">{quiz.title}</h3>
                    <p className="text-[9px] text-slate-500 mt-1">{quiz.questions?.length || 0} Questions</p>
                  </div>
                  <Link
                    className="apex-button-primary py-1 px-2.5 text-[10px] flex items-center gap-1.5 flex-shrink-0 bg-amber-400 text-slate-900 border-amber-300"
                    to={`batch/${quiz.classId}`}
                  >
                    Play
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
