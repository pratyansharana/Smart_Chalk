import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBatchDetails } from '../../hooks/useBatchDetails';
import { useBatchVault } from '../../hooks/useBatchVault';
import { useBatchTests } from '../../hooks/useBatchTests';
import { useStudentTestSubmissions } from '../../hooks/useStudentTestSubmissions';
import { useBatchQuizzes } from '../../hooks/useBatchQuizzes';
import { useQuizScores } from '../../hooks/useQuizScores';
import { useFileUpload } from '../../hooks/useFileUpload';
import { submitTestSolution } from '../../services/firebase/testService';
import { submitQuizScorecard } from '../../services/firebase/quizService';

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

  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'vault' | 'tests' | 'quizzes'
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
      <main className="p-5 lg:p-8">
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
      <main className="p-5 lg:p-8">
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
    <main className="p-5 lg:p-8">
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
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          ['announcements', 'Announcements', Send],
          ['vault', 'Batch Vault', BookOpen],
          ['tests', 'Test Centre', ClipboardList],
          ['quizzes', 'Quiz Centre', Trophy],
        ].map(([tab, label, Icon]) => (
          <button
            className={`py-2 px-4 text-sm font-bold flex items-center gap-2 rounded-xl border transition-all ${
              activeTab === tab
                ? 'bg-amber-400 border-amber-300 text-slate-900 shadow-lg'
                : 'bg-white/[0.02] border-white/5 text-slate-300 hover:text-white hover:bg-white/[0.04]'
            }`}
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setActiveQuizId(null);
            }}
            type="button"
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
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
                      <div className="mt-4 bg-black/25 border border-white/5 p-4 rounded-xl max-h-96 overflow-y-auto">
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Test Questions</p>
                        <div className="text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                          {test.testContent}
                        </div>
                      </div>
                    )}

                    {/* Solutions Submission / Grading section */}
                    <div className="mt-5 border-t border-white/5 pt-4">
                      {submission ? (
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider block">Submission Status</span>
                            <span className="mt-1 font-bold text-slate-200 flex items-center gap-1.5">
                              <CheckCircle className="text-emerald-400" size={16} />
                              {submission.status === 'graded' ? 'Graded' : 'Submitted for Grading'}
                            </span>
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-sm">Solution: {submission.submittedFileName}</p>
                          </div>

                          {submission.status === 'graded' && (
                            <div className="bg-amber-400/10 border border-amber-400/20 px-4 py-2 rounded-xl text-right">
                              <span className="text-[10px] text-amber-400 uppercase tracking-wider block">Your Score</span>
                              <span className="text-lg font-black text-amber-300">{submission.grade} / {test.maxScore}</span>
                              {submission.feedback && (
                                <p className="text-xs text-slate-300 mt-1 text-left max-w-xs italic">
                                  "Feedback: {submission.feedback}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <TestUploader test={test} classId={batch.id} studentId={studentId} studentName={studentName} />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 4: Quiz Centre */}
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
                  <QuizCard key={quiz.id} quiz={quiz} batchId={batch.id} studentId={studentId} onStartQuiz={setActiveQuizId} />
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

/* Sub-component: File uploader for test submissions */
function TestUploader({ test, classId, studentId, studentName }) {
  const [file, setFile] = useState(null);
  const { upload, loading, progress } = useFileUpload();
  const [success, setSuccess] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    try {
      const draftId = `${Date.now()}`;
      const url = await upload(`test_submissions/${draftId}/${file.name}`, file);
      await submitTestSolution({
        testId: test.id,
        classId,
        studentId,
        studentName,
        submittedFileURL: url,
        submittedFileName: file.name,
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
    <form className="flex flex-wrap items-end gap-3" onSubmit={handleUpload}>
      <label className="grid gap-1.5 text-xs font-semibold text-slate-300 flex-1">
        Upload Solution File (PDF/Image)
        <input
          className="apex-input py-1.5 px-3 text-xs"
          disabled={loading}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          type="file"
        />
      </label>
      <button className="apex-button-primary py-1.5 px-4 text-xs" disabled={loading || !file} type="submit">
        {loading ? `Uploading ${progress}%` : <Upload size={12} />}
        {loading ? 'Submitting...' : 'Submit solution'}
      </button>
    </form>
  );
}

/* Sub-component: Quiz Item Card and Leaderboard listing */
function QuizCard({ quiz, batchId, studentId, onStartQuiz }) {
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
        ) : (
          <button
            className="apex-button-primary w-full py-2 text-sm flex items-center justify-center gap-1.5"
            onClick={() => onStartQuiz(quiz.id)}
            type="button"
          >
            <HelpCircle size={16} />
            Start Quiz Competition
          </button>
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

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIdx];

  async function handleNext() {
    // Check answer
    if (selectedOpt === currentQuestion.correctOptionIndex) {
      setCorrectCount((c) => c + 1);
    }

    const finalCorrectCount = selectedOpt === currentQuestion.correctOptionIndex ? correctCount + 1 : correctCount;

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
    } else {
      // Last question completed, submit scorecard
      setSubmitting(true);
      try {
        await submitQuizScorecard({
          quizId: quiz.id,
          classId: batchId,
          studentId,
          studentName,
          score: finalCorrectCount,
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
      <div className="flex justify-between items-center gap-3 border-b border-white/5 pb-3 mb-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Question {currentIdx + 1} of {questions.length}
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
          return (
            <button
              className={`w-full py-3 px-4 rounded-xl text-left font-semibold text-sm transition-all border ${
                isSelected
                  ? 'bg-amber-400/20 border-amber-300 text-amber-300'
                  : 'bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/[0.03] hover:text-white'
              }`}
              key={index}
              onClick={() => setSelectedOpt(index)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-8 border-t border-white/5 pt-4 flex justify-end">
        <button
          className="apex-button-primary py-2 px-6 flex items-center gap-1"
          disabled={selectedOpt === null || submitting}
          onClick={handleNext}
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
      </div>
    </div>
  );
}
