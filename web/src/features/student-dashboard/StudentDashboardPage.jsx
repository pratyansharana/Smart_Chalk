import { Link, useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, ClipboardList, Trophy, Loader2, Download, FolderOpen, FileText, TrendingUp, Calendar, AlertCircle, Award } from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
import { handlePrintReport } from '../../utils/printReport';

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

  const { parentMode } = useOutletContext() || {};
  const [selectedTestId, setSelectedTestId] = useState(null);

  // Group graded test results chronologically
  const testSubmissionsList = submissions.data
    ? submissions.data
        .filter((sub) => sub.testId !== undefined && typeof sub.grade === 'number')
        .map((sub) => {
          const test = enrolledTests.data.find((t) => t.id === sub.testId);
          const testDate = sub.submittedAt
            ? new Date(sub.submittedAt.seconds ? sub.submittedAt.seconds * 1000 : sub.submittedAt)
            : new Date();
          const percent = sub.maxScore ? Math.round((sub.grade / sub.maxScore) * 100) : 0;
          return {
            id: sub.id,
            testTitle: sub.testTitle || test?.title || 'Class Test',
            grade: sub.grade,
            maxScore: sub.maxScore || test?.maxScore || 100,
            percentage: percent,
            date: testDate,
            dateStr: testDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            feedback: sub.feedback,
            submittedFileURL: sub.submittedFileURL,
            submittedFileName: sub.submittedFileName,
          };
        })
        .sort((a, b) => a.date - b.date)
    : [];

  const activeTest = testSubmissionsList.find((t) => t.id === selectedTestId) || testSubmissionsList.at(-1);

  if (parentMode) {
    const averageGrade = testSubmissionsList.length > 0 
      ? Math.round(testSubmissionsList.reduce((acc, curr) => acc + curr.percentage, 0) / testSubmissionsList.length)
      : 0;

    return (
      <main className="p-4 lg:p-8 animate-fadeIn">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-400">Parent oversight portal</p>
        <h1 className="mt-3 font-heading text-4xl font-bold text-white">Child's Academic Performance</h1>
        <p className="mt-2 text-slate-300 text-sm leading-relaxed max-w-3xl font-sans">
          Welcome back. Monitoring learning progress, attendance schedules, and teacher feedback reports for <strong>{profile?.displayName || 'Learner'}</strong>.
        </p>

        {/* KPI Insights Grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5 border border-indigo-500/15 bg-indigo-500/[0.01] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Active Batches</p>
              <h2 className="text-2xl font-black text-white mt-1.5">{classes.data.length} enrolled</h2>
              <p className="text-[10px] text-slate-500 mt-1">Direct syllabus mapping active</p>
            </div>
            <Calendar className="text-indigo-400" size={28} />
          </div>

          <div className="glass-card p-5 border border-emerald-500/15 bg-emerald-500/[0.01] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Test Average</p>
              <h2 className="text-2xl font-black text-white mt-1.5">{averageGrade}%</h2>
              <p className="text-[10px] text-slate-500 mt-1">Based on {testSubmissionsList.length} graded mock tests</p>
            </div>
            <TrendingUp className="text-emerald-400" size={28} />
          </div>

          <div className="glass-card p-5 border border-amber-500/15 bg-amber-500/[0.01] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Assignments Queue</p>
              <h2 className="text-2xl font-black text-white mt-1.5">
                {assignments.data.length} published
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">Check completed lists below</p>
            </div>
            <ClipboardList className="text-amber-400" size={28} />
          </div>
        </div>

        {/* Weekly Performance trend with click selection details */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          {/* Recharts AreaChart visualizer */}
          <section className="glass-card p-6 border border-white/5 flex flex-col justify-between min-h-[320px]">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400" />
                Weekly Test Performance Timeline
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                Shows child's score percentage progress over dates. <strong>Click on any data node to inspect comments below</strong>.
              </p>
            </div>

            {testSubmissionsList.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl mt-6 bg-white/[0.005]">
                <AlertCircle className="text-slate-600 mx-auto mb-2" size={28} />
                <p className="text-xs text-slate-400 font-semibold">No graded test scores available yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Performance trend will generate as tests are evaluated.</p>
              </div>
            ) : (
              <div className="mt-6 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={testSubmissionsList}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        setSelectedTestId(state.activePayload[0].payload.id);
                      }
                    }}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="dateStr" stroke="#64748b" tickLine={false} style={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tickLine={false} style={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                      formatter={(value) => [`${value}% Score`, 'Performance']}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorPercent)"
                      strokeWidth={2.5}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Dynamic details card updated on node click */}
          <section className="glass-card p-6 border border-white/5 min-h-[320px] flex flex-col justify-between">
            {activeTest ? (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    Graded Test Performance
                  </span>
                  <h3 className="font-heading text-xl font-bold text-white mt-2 leading-snug">{activeTest.testTitle}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar size={11} />
                    Evaluated on {activeTest.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-y border-white/5 py-3">
                    <div>
                      <p className="text-xs text-slate-400">Graded Marks</p>
                      <strong className="text-xl text-emerald-400 mt-0.5 block">{activeTest.grade} / {activeTest.maxScore} marks</strong>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Percentage</p>
                      <span className="text-lg font-black text-slate-200 mt-0.5 block">{activeTest.percentage}%</span>
                    </div>
                  </div>

                  {activeTest.feedback && (
                    <div className="mt-4 bg-white/[0.01] border border-white/5 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Teacher Point-wise Comments</span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{activeTest.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-white/5 pt-4">
                  <button
                    className="apex-button-primary bg-indigo-500 hover:bg-indigo-400 text-white border-transparent w-full text-xs font-bold py-2 px-3 justify-center"
                    onClick={() => handlePrintReport(
                      { title: activeTest.testTitle, maxScore: activeTest.maxScore },
                      { grade: activeTest.grade, feedback: activeTest.feedback, submittedFileURL: activeTest.submittedFileURL, submittedFileName: activeTest.submittedFileName },
                      profile?.displayName,
                      'Maths & Science Classes',
                      ''
                    )}
                    type="button"
                  >
                    <Download size={13} />
                    Save PDF / Print report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <AlertCircle className="text-slate-600 mb-2" size={28} />
                <p className="text-xs text-slate-400 font-semibold">Select a node on the chart</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Details and tutor remarks will render in this panel.</p>
              </div>
            )}
          </section>
        </div>

        {/* Worksheet Queue and Upload resources */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Assignments overview card */}
          <AssignmentsCard
            assignments={assignments.data}
            error={assignments.error}
            loading={assignments.loading || submissions.loading}
            studentId={studentId}
            submissions={submissions.data}
            parentMode={true}
          />

          {/* Quick study syllabus downloads */}
          <section className="glass-card p-6 border border-white/5">
            <h2 className="font-heading text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-indigo-400" />
              Syllabus Study Materials
            </h2>
            {enrolledVault.loading && <Loader2 className="animate-spin text-amber-400 mx-auto" size={16} />}
            {!enrolledVault.loading && enrolledVault.data.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.005]">
                <FolderOpen className="text-slate-600 mx-auto mb-2" size={24} />
                <p className="text-xs text-slate-400 font-semibold">No study resources shared</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Vault documents will list here when uploaded.</p>
              </div>
            )}
            <div className="grid gap-3">
              {enrolledVault.data.map((item) => {
                const batchName = classes.data.find((c) => c.id === item.classId)?.title || 'Batch';
                return (
                  <div className="border border-white/5 bg-white/[0.01] p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-indigo-500/20 transition-all" key={item.id}>
                    <div>
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{batchName}</span>
                      <h3 className="font-bold text-slate-200 text-xs mt-0.5">{item.title}</h3>
                    </div>
                    {item.fileURL && (
                      <a
                        className="apex-button-primary py-1 px-3 text-[10px] flex items-center gap-1.5 flex-shrink-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
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
        </div>
      </main>
    );
  }

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
