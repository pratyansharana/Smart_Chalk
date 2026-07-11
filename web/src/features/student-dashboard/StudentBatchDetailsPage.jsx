import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  Video,
  Send,
  Download,
  BookOpen,
  ClipboardList,
  Star,
  Award,
  Trophy,
  CheckCircle,
  HelpCircle,
  Upload,
  Printer,
  Mail,
  Sparkles,
  Paperclip,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBatchDetails } from '../../hooks/useBatchDetails';
import { useBatchVault } from '../../hooks/useBatchVault';
import { useBatchTests } from '../../hooks/useBatchTests';
import { useStudentTestSubmissions } from '../../hooks/useStudentTestSubmissions';
import { useBatchQuizzes } from '../../hooks/useBatchQuizzes';
import { useQuizScores } from '../../hooks/useQuizScores';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useBatchAssignments } from '../../hooks/useBatchAssignments';
import { useSubmissions } from '../../hooks/useSubmissions';
import { createSubmissionDocument } from '../../services/firebase/submissionsService';
import { submitTestSolution } from '../../services/firebase/testService';
import { submitQuizScorecard } from '../../services/firebase/quizService';
import { handlePrintReport } from '../../utils/printReport';

export function StudentBatchDetailsPage() {
  const { batchId } = useParams();
  const { currentUser, profile } = useAuth();
  const studentId = currentUser?.uid;
  const studentName = profile?.displayName || currentUser?.email || 'Student';

  const { data: batch, loading: batchLoading, error: batchError } = useBatchDetails(batchId);
  const vault = useBatchVault(batchId);
  const tests = useBatchTests(batchId);
  const testSubmissions = useStudentTestSubmissions(studentId);
  const quizzes = useBatchQuizzes(batchId);
  const assignments = useBatchAssignments(batchId);
  const submissions = useSubmissions(studentId);

  const { parentMode } = useOutletContext() || {};

  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'vault' | 'assignments' | 'tests' | 'quizzes'
  const [activeQuizId, setActiveQuizId] = useState(null);



  if (batchLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={36} />
      </div>
    );
  }

  if (batchError || !batch) {
    return (
      <main className="p-4 lg:p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
          <h2 className="font-heading text-xl font-bold text-red-200">Workspace Error</h2>
          <p className="mt-2 text-sm text-red-300/80">{batchError?.message || 'Batch not found or you are not enrolled.'}</p>
          <Link className="apex-button-primary mt-4 inline-flex items-center gap-1" to="/student">
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Double check enrollment
  const enrolledStudentIds = batch.studentIds || [];
  const isEnrolled = enrolledStudentIds.includes(studentId);

  if (!isEnrolled) {
    return (
      <main className="p-4 lg:p-8">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-center">
          <h2 className="font-heading text-xl font-bold text-amber-200">Access Restricted</h2>
          <p className="mt-2 text-sm text-amber-300/80">Your enrollment request for this batch is currently pending teacher approval.</p>
          <Link className="apex-button-primary mt-4 inline-flex items-center gap-1" to="/student">
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isLive = batch.status === 'live';
  const announcements = batch.notes || [];

  return (
    <main className="p-4 lg:p-8">
      {/* Back button */}
      <Link className="inline-flex items-center gap-1 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors mb-4" to="/student">
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header card */}
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{batch.subject}</span>
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 text-xs text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live now
                </span>
              )}
            </div>
            <h1 className="mt-2 font-heading text-3xl font-bold text-white">{batch.title}</h1>
            <p className="mt-1 text-sm text-slate-300">{batch.schedule}</p>
          </div>

          <div className="flex items-center gap-2">
            {batch.meetingLink ? (
              <a
                className={`py-2.5 px-5 text-sm flex items-center gap-2 rounded-xl font-bold transition-all ${
                  isLive
                    ? 'bg-emerald-500 border border-emerald-400 text-slate-950 hover:bg-emerald-400'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}
                href={batch.meetingLink}
                rel="noreferrer"
                target="_blank"
              >
                <Video size={16} />
                {isLive ? 'Join Live Session' : 'Class Meet Link'}
              </a>
            ) : (
              <span className="text-xs text-slate-400 border border-dashed border-white/10 p-2.5 rounded-xl">Meeting link not configured</span>
            )}
          </div>
        </div>
      </section>

      {/* Navigation tabs */}
      <nav className="mt-6 flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible border-b border-white/10">
        {/* Category: Core */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-2xl">
          {[
            ['announcements', 'Announcements', Send],
          ].map(([tab, label, Icon]) => (
            <button
              className={`py-2 px-3 text-xs font-bold flex items-center gap-1.5 rounded-xl border transition-all ${
                activeTab === tab
                  ? 'bg-amber-400 border-amber-300 text-slate-900 shadow-md'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setActiveQuizId(null);
              }}
              type="button"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Category: Resources */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-2xl">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 pr-1">Resources</span>
          {[
            ['vault', 'Batch Vault', BookOpen],
          ].map(([tab, label, Icon]) => (
            <button
              className={`py-2 px-3 text-xs font-bold flex items-center gap-1.5 rounded-xl border transition-all ${
                activeTab === tab
                  ? 'bg-amber-400 border-amber-300 text-slate-900 shadow-md'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setActiveQuizId(null);
              }}
              type="button"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Category: Evaluations */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-2xl">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 pr-1">Evaluations</span>
          {[
            ['assignments', 'Assignments', Award],
            ['tests', 'Test Centre', ClipboardList],
            ['quizzes', 'Quiz Centre', Trophy],
          ].map(([tab, label, Icon]) => (
            <button
              className={`py-2 px-3 text-xs font-bold flex items-center gap-1.5 rounded-xl border transition-all ${
                activeTab === tab
                  ? 'bg-amber-400 border-amber-300 text-slate-900 shadow-md'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setActiveQuizId(null);
              }}
              type="button"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content pane */}
      <div className="mt-6">
        {/* Tab 1: Announcements */}
        {activeTab === 'announcements' && (
          <section className="glass-card p-5 max-w-3xl">
            <h2 className="font-heading text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <Send size={20} className="text-amber-400" />
              Teacher Broadcasts
            </h2>
            <div className="grid gap-4">
              {announcements.map((note) => (
                <article className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl" key={note.id}>
                  <p className="text-sm text-slate-200 leading-relaxed">{note.text}</p>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    Broadcasted on{' '}
                    {new Date(note.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </article>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No announcements posted for this batch yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Tab 2: Vault */}
        {activeTab === 'vault' && (
          <section className="glass-card p-5">
            <h2 className="font-heading text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <BookOpen size={20} className="text-amber-400" />
              Batch Vault
            </h2>
            {vault.loading && <p className="text-sm text-slate-300">Loading vault items...</p>}
            {!vault.loading && vault.data.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No syllabus or files have been uploaded to the vault yet.</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {vault.data.map((item) => (
                <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between" key={item.id}>
                  <div>
                    <h3 className="font-bold text-white text-lg">{item.title}</h3>
                    <p className="text-sm text-slate-400 mt-2">{item.description}</p>
                  </div>
                  {item.fileURL && (
                    <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 truncate max-w-xs">{item.fileName || 'Attachment'}</span>
                      <a
                        className="apex-button-primary py-1 px-3 text-xs flex items-center gap-1.5"
                        href={item.fileURL}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Test Centre */}
        {activeTab === 'tests' && (
          <section className="glass-card p-5">
            <h2 className="font-heading text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <ClipboardList size={20} className="text-amber-400" />
              Test Centre
            </h2>
            {tests.loading && <p className="text-sm text-slate-300">Loading tests...</p>}
            {!tests.loading && tests.data.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No formal tests scheduled for this batch.</p>
            )}
            <div className="grid gap-5">
              {tests.data.map((test) => {
                const submission = testSubmissions.data.find((s) => s.testId === test.id);
                return (
                  <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" key={test.id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-xl font-bold text-white">{test.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{test.description}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                          <span>Max Score: <strong className="text-amber-400">{test.maxScore}</strong></span>
                          <span>Due: <strong>{new Date(test.dueDate).toLocaleString()}</strong></span>
                        </div>
                      </div>

                      {test.testFileURL && (
                        <a
                          className="apex-button-secondary py-1.5 px-3 text-xs border-amber-400/25 text-amber-300"
                          href={test.testFileURL}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Download size={14} />
                          Test Paper
                        </a>
                      )}
                    </div>

                    {test.testContent && (
                      <QuestionPaperRenderer content={test.testContent} />
                    )}

                    {/* Solutions Submission / Grading section */}
                    <div className="mt-5 border-t border-white/5 pt-4">
                      {submission ? (
                        <div className="grid gap-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <span className="text-xs text-slate-500 uppercase tracking-wider block">Submission Status</span>
                              <span className="mt-1 font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                                <CheckCircle className="text-emerald-400" size={16} />
                                {submission.status === 'graded' ? 'Graded' : 'Submitted for Grading'}
                              </span>
                              <p className="text-xs text-slate-400 mt-1 truncate max-w-sm">Solution: {submission.submittedFileName || 'Text response submission'}</p>
                            </div>

                            {submission.status === 'graded' && (
                              <div className="flex gap-2">
                                <button
                                  className="apex-button-secondary bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20 py-1.5 px-3 text-xs flex items-center gap-1.5"
                                  onClick={() => handlePrintReport(test, submission, studentName, batch?.title || batch?.name, batch?.parentEmails?.[studentId])}
                                  type="button"
                                >
                                  <Printer size={14} />
                                  Save PDF / Print
                                </button>
                                <button
                                  className="apex-button-secondary bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 py-1.5 px-3 text-xs flex items-center gap-1.5"
                                  onClick={() => {
                                    const text = encodeURIComponent(
                                      `📚 *SmartChalk Academic Report* 📚\n\n` +
                                      `*Student Name:* ${studentName}\n` +
                                      `*Batch/Subject:* ${batch?.title || batch?.name || ''}\n` +
                                      `*Test:* ${test.title}\n` +
                                      `*Score:* *${submission.grade} / ${test.maxScore} marks*\n\n` +
                                      `*Teacher's Feedback:*\n"${submission.feedback}"\n\n` +
                                      `Log in to the SmartChalk dashboard to download the full PDF report with questions, answers, and teacher remarks.`
                                    );
                                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                                  }}
                                  type="button"
                                >
                                  <Send size={14} />
                                  Send to WhatsApp
                                </button>
                              </div>
                            )}
                          </div>

                          {submission.status === 'graded' && (
                            <div className="mt-3 border-t border-white/5 pt-3 grid gap-3">
                              <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 rounded-xl">
                                <span className="text-xs font-bold text-slate-300">Your Grade Score:</span>
                                <strong className="text-lg font-black text-emerald-400">{submission.grade} / {test.maxScore} marks</strong>
                              </div>

                              {submission.feedback && (
                                <div className="grid gap-1">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Teacher's Direct Feedback</span>
                                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed bg-white/[0.01] border border-white/5 p-3 rounded-lg font-sans">
                                    {submission.feedback}
                                  </div>
                                </div>
                              )}

                              {submission.studentText && (
                                <details className="text-xs mt-1">
                                  <summary className="cursor-pointer font-semibold text-slate-400 select-none text-[11px]">
                                    Show Your Submitted Answers Text
                                  </summary>
                                  <pre className="mt-2 p-3 bg-black/20 border border-white/5 rounded-lg text-[10px] text-slate-300 whitespace-pre-wrap font-mono">
                                    {submission.studentText}
                                  </pre>
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      ) : !parentMode ? (
                        <TestUploader test={test} classId={batch.id} studentId={studentId} studentName={studentName} />
                      ) : (
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-center flex items-center justify-center min-h-[90px]">
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pending Student Test Submission</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab: Assignments */}
        {activeTab === 'assignments' && (
          <StudentAssignmentPanel batch={batch} studentId={studentId} studentName={studentName} assignments={assignments.data} submissions={submissions.data} parentMode={parentMode} />
        )}
        {activeTab === 'quizzes' && (
          <section className="glass-card p-5">
            <h2 className="font-heading text-2xl font-bold text-white mb-5 flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              Quiz Centre
            </h2>
            {quizzes.loading && <p className="text-sm text-slate-300">Loading quizzes...</p>}
            {!quizzes.loading && quizzes.data.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No quizzes published for this batch yet.</p>
            )}

            {!activeQuizId ? (
              <div className="grid gap-4 md:grid-cols-2">
                {quizzes.data.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} batchId={batch.id} studentId={studentId} onStartQuiz={setActiveQuizId} parentMode={parentMode} />
                ))}
              </div>
            ) : (
              <QuizRunner
                quiz={quizzes.data.find((q) => q.id === activeQuizId)}
                studentId={studentId}
                studentName={studentName}
                batchId={batchId}
                onClose={() => setActiveQuizId(null)}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/* Reusable premium drag-and-drop file uploader */
function DropzoneUploader({ file, setFile, loading, progress }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="grid gap-1.5 w-full">
      <div
        className={`relative rounded-xl border-2 border-dashed p-5 transition-all text-center flex flex-col items-center justify-center min-h-[140px] ${
          dragActive
            ? 'border-amber-400 bg-amber-400/[0.03] scale-[1.01]'
            : file
            ? 'border-emerald-500/40 bg-emerald-500/[0.01]'
            : 'border-white/10 bg-white/[0.01] hover:border-white/20'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="w-full flex flex-col items-center justify-center gap-3">
            <div className="w-full max-w-[180px] h-2 bg-navy-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
              Uploading {Math.round(progress)}%...
            </span>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="text-emerald-400 animate-bounce" size={24} />
            <div>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{file.name}</p>
              <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              className="text-[10px] text-red-400 hover:text-red-300 font-bold underline mt-1"
              onClick={() => setFile(null)}
            >
              Remove File
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="text-slate-500 mb-1.5" size={26} />
            <p className="text-xs font-semibold text-slate-300">
              Drag & Drop solution file here
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">or click to browse from device</p>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* Sub-component: File uploader for test submissions */
function TestUploader({ test, classId, studentId, studentName }) {
  const [file, setFile] = useState(null);
  const [studentText, setStudentText] = useState('');
  const { upload, loading, progress } = useFileUpload();
  const [success, setSuccess] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file && !studentText.trim()) return;

    try {
      let fileURL = null;
      let fileName = null;

      if (file) {
        const draftId = `${Date.now()}`;
        fileURL = await upload(`test_submissions/${draftId}/${file.name}`, file);
        fileName = file.name;
      }

      await submitTestSolution({
        testId: test.id,
        classId,
        studentId,
        studentName,
        submittedFileURL: fileURL,
        submittedFileName: fileName,
        studentText: studentText.trim() || null,
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  }

  if (success) {
    return (
      <div className="text-sm text-emerald-400 font-bold flex items-center gap-1">
        <CheckCircle size={16} /> Submission uploaded successfully. Reloading data...
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleUpload}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5 text-xs font-semibold text-slate-300">
          <span>Upload Solution File (Optional - PDF/Image)</span>
          <DropzoneUploader file={file} setFile={setFile} loading={loading} progress={progress} />
        </div>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-300">
          <span>Or Type/Paste Written Answers (Enables AI Grading)</span>
          <textarea
            className="apex-input py-1.5 px-3 text-xs min-h-[140px] resize-y flex-1"
            disabled={loading}
            onChange={(e) => setStudentText(e.target.value)}
            placeholder="Type your questions answers, steps, or notes here..."
            value={studentText}
          />
        </label>
      </div>
      <div className="flex justify-end">
        <button
          className="apex-button-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
          disabled={loading || (!file && !studentText.trim())}
          type="submit"
        >
          {loading ? `Uploading ${progress}%` : <Upload size={12} />}
          {loading ? 'Submitting...' : 'Submit solution'}
        </button>
      </div>
    </form>
  );
}

/* Sub-component: Quiz Item Card and Leaderboard listing */
function QuizCard({ quiz, batchId, studentId, onStartQuiz, parentMode }) {
  const { data: scores } = useQuizScores(quiz.id);
  const myScore = scores.find((s) => s.studentId === studentId);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between">
      <div>
        <h3 className="font-heading text-lg font-bold text-white mb-2">{quiz.title}</h3>
        <p className="text-xs text-slate-500 mb-4">Total Questions: {quiz.questions?.length || 0}</p>
        
        {myScore ? (
          <div className="bg-emerald-500/10 border border-emerald-400/20 p-3 rounded-xl mb-4">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Your Score</span>
            <span className="text-xl font-black text-emerald-300">{myScore.score} / {myScore.totalQuestions}</span>
          </div>
        ) : !parentMode ? (
          <button
            className="apex-button-primary w-full py-2 text-sm flex items-center justify-center gap-1.5"
            onClick={() => onStartQuiz(quiz.id)}
            type="button"
          >
            <HelpCircle size={16} />
            Start Quiz Competition
          </button>
        ) : (
          <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl text-center mb-4 min-h-[44px] flex items-center justify-center">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Not Taken by Student</span>
          </div>
        )}
      </div>

      {/* Real-time leaderboard */}
      <div className="border-t border-white/5 pt-4 mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1">
          <Award size={14} />
          Batch Leaderboard ({scores.length})
        </h4>
        <div className="grid gap-1.5 max-h-36 overflow-y-auto pr-1">
          {scores.map((score, index) => {
            const rank = index + 1;
            const isMe = score.studentId === studentId;
            return (
              <div
                className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-xs ${
                  isMe ? 'bg-amber-400/20 border border-amber-400/30' : 'bg-white/[0.01]'
                }`}
                key={score.id}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`font-bold flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                    rank === 1 ? 'bg-yellow-500 text-slate-950 font-black' : rank === 2 ? 'bg-slate-300 text-slate-950 font-black' : rank === 3 ? 'bg-amber-700 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {rank}
                  </span>
                  <span className={`truncate font-semibold ${isMe ? 'text-amber-300' : 'text-slate-300'}`}>
                    {score.studentName}
                  </span>
                </div>
                <span className="font-black text-white">{score.score} / {score.totalQuestions}</span>
              </div>
            );
          })}
          {scores.length === 0 && (
            <p className="text-[10px] text-slate-500 text-center py-2">No attempts submitted yet.</p>
          )}
        </div>
      </div>
    </article>
  );
}

/* Sub-component: MCQ interactive quiz player */
function QuizRunner({ quiz, studentId, studentName, batchId, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!quiz) {
    return (
      <div className="flex justify-center p-6 text-slate-400 text-sm">
        <Loader2 className="animate-spin text-amber-400 mr-2" size={18} />
        Loading quiz content...
      </div>
    );
  }

  const questions = quiz.questions || [];

  if (questions.length === 0) {
    return (
      <div className="text-center p-6 text-slate-400 text-sm">
        <p>This quiz has no questions published yet.</p>
        <button className="apex-button-secondary mt-4 mx-auto py-1.5 px-4 text-xs" onClick={onClose} type="button">
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  // Reset timer on question change
  useEffect(() => {
    if (quizFinished) return;
    setTimeLeft(30);
  }, [currentIdx, quizFinished]);

  // Tick down timer every second (only if not submitted and quiz not finished)
  useEffect(() => {
    if (quizFinished || hasSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // If time expires, auto-check as incorrect/skipped
          setHasSubmitted(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, quizFinished, hasSubmitted]);

  function handleCheckAnswer() {
    if (selectedOpt === null) return;
    setHasSubmitted(true);
    if (selectedOpt === currentQuestion?.correctOptionIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  async function handleNextQuestion() {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setHasSubmitted(false);
    } else {
      setSubmitting(true);
      try {
        const finalScore = selectedOpt === currentQuestion?.correctOptionIndex ? correctCount : correctCount;
        await submitQuizScorecard({
          quizId: quiz.id,
          classId: batchId,
          studentId,
          studentName,
          score: finalScore,
          totalQuestions: questions.length,
        });
        setQuizFinished(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  }

  if (quizFinished) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 text-center max-w-md mx-auto">
        <Trophy className="text-yellow-400 mx-auto mb-4 animate-bounce" size={48} />
        <h3 className="font-heading text-2xl font-bold text-white">Quiz Finished!</h3>
        <p className="text-sm text-slate-300 mt-2">Congratulations, you finished the quiz competition.</p>
        <div className="bg-emerald-500/10 border border-emerald-400/20 p-4 rounded-xl my-4 text-center">
          <span className="text-xs text-emerald-400 block font-bold">Your Score</span>
          <span className="text-3xl font-black text-emerald-300">
            {correctCount} / {questions.length}
          </span>
        </div>
        <button className="apex-button-primary w-full py-2" onClick={onClose} type="button">
          Close and View Leaderboard
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 max-w-xl mx-auto">
      {/* Ticking Timer progress bar */}
      <div className="w-full bg-white/10 h-1.5 rounded-full mb-6 overflow-hidden">
        <div 
          className="bg-amber-400 h-full transition-all duration-1000"
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-center gap-3 border-b border-white/5 pb-3 mb-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md animate-pulse">
          {hasSubmitted ? 'Paused' : `Time Remaining: ${timeLeft}s`}
        </span>
        <button className="text-xs text-slate-400 hover:text-white" onClick={onClose} type="button">
          Quit Quiz
        </button>
      </div>

      <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">
        {currentQuestion?.questionText}
      </h3>

      <div className="grid gap-3">
        {currentQuestion?.options.map((option, index) => {
          const isSelected = selectedOpt === index;
          const isCorrectAnswer = index === currentQuestion?.correctOptionIndex;
          const isMyWrongAnswer = isSelected && selectedOpt !== currentQuestion?.correctOptionIndex;

          let btnClass = 'bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/[0.03] hover:text-white';
          if (hasSubmitted) {
            if (isCorrectAnswer) {
              btnClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold';
            } else if (isMyWrongAnswer) {
              btnClass = 'bg-red-500/15 border-red-500 text-red-400 font-bold';
            } else {
              btnClass = 'opacity-40 border-white/5 text-slate-500';
            }
          } else if (isSelected) {
            btnClass = 'bg-amber-400/20 border-amber-300 text-amber-300';
          }

          return (
            <button
              className={`w-full py-3 px-4 rounded-xl text-left font-semibold text-sm transition-all border ${btnClass}`}
              disabled={hasSubmitted}
              key={index}
              onClick={() => setSelectedOpt(index)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>

      {hasSubmitted && (
        <div className="mt-4">
          {selectedOpt === currentQuestion?.correctOptionIndex ? (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
              ✓ Correct Answer! Well done!
            </div>
          ) : selectedOpt === null ? (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold flex items-center gap-2">
              ✗ Time expired! The correct answer was option {currentQuestion?.correctOptionIndex + 1}.
            </div>
          ) : (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold flex items-center gap-2">
              ✗ Incorrect! The correct answer was option {currentQuestion?.correctOptionIndex + 1}.
            </div>
          )}
        </div>
      )}

      <div className="mt-8 border-t border-white/5 pt-4 flex justify-end">
        {!hasSubmitted ? (
          <button
            className="apex-button-primary py-2 px-6 flex items-center gap-1"
            disabled={selectedOpt === null}
            onClick={handleCheckAnswer}
            type="button"
          >
            Check Answer
          </button>
        ) : (
          <button
            className="apex-button-primary py-2 px-6 flex items-center gap-1"
            disabled={submitting}
            onClick={handleNextQuestion}
            type="button"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : currentIdx === questions.length - 1 ? (
              'Finish & Submit'
            ) : (
              'Next Question'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function QuestionPaperRenderer({ content }) {
  if (!content) return null;
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-5 bg-slate-950/60 p-7 rounded-2xl border border-white/5 my-5 shadow-2xl">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) {
          return (
            <h3 key={idx} className="font-heading text-xl font-bold text-white mt-5 mb-4 border-b border-white/10 pb-2.5 tracking-wide">
              {line.replace('# ', '')}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h4 key={idx} className="font-heading text-sm uppercase tracking-wider text-amber-400/90 mt-5 mb-3">
              {line.replace('## ', '')}
            </h4>
          );
        }
        if (/^\d+[\.\)]\s/.test(line)) {
          const cleanText = line.replace(/^\d+[\.\)]\s/, '');
          const matchNum = line.match(/^(\d+)[\.\)]/);
          const qNum = matchNum ? matchNum[1] : idx + 1;
          return (
            <div key={idx} className="bg-white/[0.01] border border-white/5 p-5 rounded-xl shadow-md hover:border-amber-400/30 hover:bg-white/[0.02] transition-all grid gap-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/10 text-amber-300 font-bold px-2 py-0.5 rounded text-[9px] tracking-wide uppercase">
                  Question {qNum}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                {cleanText.replace(/\*\*/g, '')}
              </p>
            </div>
          );
        }
        return (
          <p key={idx} className="text-xs text-slate-300 mt-2 leading-relaxed pl-3 border-l-2 border-amber-400/20">
            {line.replace(/^\*\s/, '').replace(/\*\*/g, '')}
          </p>
        );
      })}
    </div>
  );
}

/* SUB PANEL: Student Assignments Hub */
function StudentAssignmentPanel({ batch, studentId, studentName, assignments, submissions, parentMode }) {
  return (
    <section className="glass-card p-5 animate-fadeIn">
      <h2 className="font-heading text-2xl font-bold text-white mb-5 flex items-center gap-2">
        <Award size={20} className="text-amber-400" />
        Assignments
      </h2>

      <div className="grid gap-6">
        {assignments.map((assignment) => {
          // Check if this student has submitted a solution for this assignment
          const submission = submissions.find((s) => s.assignmentId === assignment.id);
          const isSubmitted = !!submission;
          const isGraded = submission?.status === 'graded';

          return (
            <article className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 hover:border-white/10 transition-all" key={assignment.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-200">{assignment.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">{assignment.description || 'No description provided'}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-slate-400">
                    <span>Max Score: <strong className="text-slate-300">{assignment.maxScore} marks</strong></span>
                    <span>Due Date: <strong className="text-amber-400">{assignment.dueDate}</strong></span>
                    {assignment.submittedFileName && (
                      <span>
                        Resource Attachment:{' '}
                        <a
                          className="text-amber-300 underline hover:text-amber-400"
                          href={assignment.submittedFileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {assignment.submittedFileName}
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {isGraded ? (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block mb-1">Graded Score</span>
                      <strong className="text-lg text-emerald-400">{submission.grade} / {assignment.maxScore} marks</strong>
                    </div>
                  ) : isSubmitted ? (
                    <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-xl border border-white/5">
                      Submitted - Awaiting Grade
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-400/10 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-400/15">
                      Not Started
                    </span>
                  )}
                </div>
              </div>

              {/* Assignment Questions */}
              {assignment.assignmentContent && (
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Assignment Tasks & Guidelines</span>
                  <QuestionPaperRenderer content={assignment.assignmentContent} />
                </div>
              )}

              {/* Student Interaction Space */}
              <div className="mt-5 pt-5 border-t border-white/5">
                {isSubmitted ? (
                  <div className="grid gap-3">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="text-emerald-400" size={14} />
                        Your Submitted Work
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Submitted file: {submission.submittedFileName || 'Text response submission'}</p>

                      {submission.status === 'graded' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            className="apex-button-secondary bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20 py-1.5 px-3 text-xs flex items-center gap-1.5"
                            onClick={() => handlePrintReport(assignment, submission, studentName, batch?.title || batch?.name, batch?.parentEmails?.[studentId])}
                            type="button"
                          >
                            <Printer size={14} />
                            Save PDF / Print
                          </button>
                          <button
                            className="apex-button-secondary bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 py-1.5 px-3 text-xs flex items-center gap-1.5"
                            onClick={() => {
                              const text = encodeURIComponent(
                                `📚 *SmartChalk Academic Report* 📚\n\n` +
                                `*Student Name:* ${studentName}\n` +
                                `*Batch/Subject:* ${batch?.title || batch?.name || ''}\n` +
                                `*Assignment:* ${assignment.title}\n` +
                                `*Score:* *${submission.grade} / ${assignment.maxScore} marks*\n\n` +
                                `*Teacher's Feedback:*\n"${submission.feedback}"\n\n` +
                                `Log in to the SmartChalk dashboard to download the full PDF report with questions, answers, and teacher remarks.`
                              );
                              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                            }}
                            type="button"
                          >
                            <Send size={14} />
                            Send to WhatsApp
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Teacher Feedback segment */}
                    {isGraded && submission.feedback && (
                      <div className="border border-emerald-500/10 bg-emerald-500/[0.02] p-4 rounded-xl grid gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Teacher Evaluation Conversation</span>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : !parentMode ? (
                  <AssignmentUploader assignment={assignment} classId={batch.id} studentId={studentId} studentName={studentName} />
                ) : (
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-center flex items-center justify-center min-h-[90px]">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Pending Student Submission</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {assignments.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No assignments published for this batch yet.</p>
        )}
      </div>
    </section>
  );
}

/* SUB PANEL: Assignment File/Text Solution Uploader */
function AssignmentUploader({ assignment, classId, studentId, studentName }) {
  const [file, setFile] = useState(null);
  const [studentText, setStudentText] = useState('');
  const { upload, loading: uploading, progress } = useFileUpload();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file && !studentText.trim()) {
      alert('Please upload a file or write a typed response answer.');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = null;
      if (file) {
        fileUrl = await upload(file);
      }

      console.log('[Student Submission] Submitting assignment solution:', {
        assignmentId: assignment.id,
        studentName,
        fileName: file ? file.name : null
      });

      await createSubmissionDocument({
        assignmentId: assignment.id,
        classId,
        studentId,
        studentName,
        submittedFileURL: fileUrl,
        submittedFileName: file ? file.name : null,
        studentText: studentText.trim(),
        status: 'submitted',
      });

      console.log('[Student Submission] Assignment submitted successfully!');
      setSuccess(true);
    } catch (err) {
      console.error('[Student Submission] Error:', err);
      alert('Failed to submit assignment solution.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-center">
        <CheckCircle className="text-emerald-400 mx-auto mb-2" size={24} />
        <span className="text-xs font-bold text-emerald-400 block">Solution Submitted Successfully!</span>
        <p className="text-[10px] text-slate-400 mt-1">Your teacher has been notified and will evaluate it shortly.</p>
      </div>
    );
  }

  return (
    <form className="grid gap-3.5" onSubmit={handleSubmit}>
      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Submit Your Solution</span>

        <div className="grid gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5 text-[11px] font-semibold text-slate-300">
            <span>Write/Type your Answer notes here</span>
            <textarea
              className="apex-input py-2 px-3 text-xs min-h-[140px] resize-y font-mono"
              onChange={(e) => setStudentText(e.target.value)}
              placeholder="Type your final answers or details here..."
              value={studentText}
            />
          </label>

          <div className="grid gap-1.5 text-[11px] font-semibold text-slate-300">
            <span>Upload solution attachment (Optional - PDF/Image)</span>
            <DropzoneUploader file={file} setFile={setFile} loading={uploading} progress={progress} />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-1">
        <button
          className="apex-button-primary py-2 px-6 text-xs font-bold"
          disabled={submitting || uploading}
          type="submit"
        >
          {submitting ? <Loader2 className="animate-spin" size={14} /> : null}
          {submitting ? 'Submitting solution...' : 'Submit Solutions'}
        </button>
      </div>
    </form>
  );
}


