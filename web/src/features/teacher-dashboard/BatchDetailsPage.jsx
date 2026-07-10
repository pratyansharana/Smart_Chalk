import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  Radio,
  Ban,
  Send,
  Trash2,
  Users,
  ClipboardList,
  Star,
  UserCheck,
  UserX,
  BookOpen,
  Trophy,
  Upload,
  Plus,
  Award,
  Printer,
  Mail,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBatchDetails } from '../../hooks/useBatchDetails';
import { useStudents } from '../../hooks/useStudents';
import { useBatchVault } from '../../hooks/useBatchVault';
import { useBatchTests } from '../../hooks/useBatchTests';
import { useBatchTestSubmissions } from '../../hooks/useBatchTestSubmissions';
import { useBatchQuizzes } from '../../hooks/useBatchQuizzes';
import { useQuizScores } from '../../hooks/useQuizScores';
import { useFileUpload } from '../../hooks/useFileUpload';
import {
  approveStudentRequest,
  rejectStudentRequest,
  toggleBatchLiveStatus,
  addBatchNote,
  deleteBatchNote,
  updateClassDocument,
} from '../../services/firebase/classesService';
import { addVaultItem, deleteVaultItem } from '../../services/firebase/vaultService';
import { createTestDocument, gradeTestSubmission } from '../../services/firebase/testService';
import { createQuizDocument } from '../../services/firebase/quizService';
import { generateAITest, generateAIQuiz, gradeSubmissionWithAI } from '../../services/aiService';
import { handlePrintReport } from '../../utils/printReport';

export function BatchDetailsPage() {
  const { batchId } = useParams();
  const { currentUser } = useAuth();
  const teacherId = currentUser?.uid;

  const { data: batch, loading: batchLoading, error: batchError } = useBatchDetails(batchId);
  const students = useStudents();
  const vault = useBatchVault(batchId);
  const tests = useBatchTests(batchId);
  const testSubmissions = useBatchTestSubmissions(batchId);
  const quizzes = useBatchQuizzes(batchId);

  const [copiedId, setCopiedId] = useState(false);
  const [liveActionLoading, setLiveActionLoading] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'announcements' | 'vault' | 'tests' | 'quizzes'

  if (batchLoading || students.loading) {
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
          <h2 className="font-heading text-xl font-bold text-red-200">Batch Workspace Error</h2>
          <p className="mt-2 text-sm text-red-300/80">{batchError?.message || 'Batch not found.'}</p>
          <Link className="apex-button-primary mt-4 inline-flex items-center gap-1" to="/teacher">
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isLive = batch.status === 'live';
  const enrolledStudentIds = batch.studentIds || [];
  const pendingStudentIds = batch.pendingStudentIds || [];
  const studentMap = new Map(students.data.map((s) => [s.uid || s.id, s]));

  function handleCopyId() {
    navigator.clipboard.writeText(batch.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  async function handleToggleLive() {
    setLiveActionLoading(true);
    try {
      await toggleBatchLiveStatus(batch.id, !isLive);
    } catch (err) {
      console.error(err);
    } finally {
      setLiveActionLoading(false);
    }
  }

  async function handleApprove(studentId) {
    setPendingActionLoading((prev) => ({ ...prev, [studentId]: 'approve' }));
    try {
      await approveStudentRequest(batch.id, studentId);
    } catch (err) {
      console.error(err);
    } finally {
      setPendingActionLoading((prev) => ({ ...prev, [studentId]: null }));
    }
  }

  async function handleReject(studentId) {
    setPendingActionLoading((prev) => ({ ...prev, [studentId]: 'reject' }));
    try {
      await rejectStudentRequest(batch.id, studentId);
    } catch (err) {
      console.error(err);
    } finally {
      setPendingActionLoading((prev) => ({ ...prev, [studentId]: null }));
    }
  }

  return (
    <main className="p-5 lg:p-8">
      {/* Back button */}
      <Link className="inline-flex items-center gap-1 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors mb-4" to="/teacher">
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

          <div className="flex flex-wrap items-center gap-2">
            <button className="apex-button-secondary py-2 px-3 text-xs" onClick={handleCopyId} type="button">
              {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedId ? 'Copied ID' : 'Copy Batch ID'}
            </button>

            <button
              className={`py-2 px-4 text-sm flex items-center gap-2 rounded-xl font-bold transition-all ${
                isLive
                  ? 'bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30'
              }`}
              disabled={liveActionLoading}
              onClick={handleToggleLive}
              type="button"
            >
              {liveActionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isLive ? (
                <Ban size={16} />
              ) : (
                <Radio size={16} />
              )}
              {isLive ? 'End Session' : 'Go Live'}
            </button>

            {batch.meetingLink && (
              <a
                className="apex-button-primary py-2 px-4 text-sm bg-indigo-500/25 border-indigo-500/35 hover:bg-indigo-500/35 text-indigo-200"
                href={batch.meetingLink}
                rel="noreferrer"
                target="_blank"
              >
                Join Class Meet
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Roster & Announcements & Tabbed workspace */}
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          ['roster', 'Roster & Waitlist', Users],
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
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Main Tab Panels */}
      <div className="mt-6">
        {/* Tab 1: Roster & Requests */}
        {activeTab === 'roster' && (
          <div className="grid gap-6 md:grid-cols-2 lg:items-start">
            {/* Enrollment requests */}
            <section className="glass-card p-5">
              <h2 className="font-heading text-lg font-bold text-amber-400 flex items-center gap-2 mb-3">
                <UserCheck size={18} />
                Pending Join Requests ({pendingStudentIds.length})
              </h2>
              <div className="grid gap-2">
                {pendingStudentIds.map((studentId) => {
                  const student = studentMap.get(studentId);
                  const isApprove = pendingActionLoading[studentId] === 'approve';
                  const isReject = pendingActionLoading[studentId] === 'reject';
                  return (
                    <div
                      className="flex items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5"
                      key={studentId}
                    >
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-200 truncate">{student?.displayName || `Student (${studentId.slice(0, 6)})`}</p>
                        <p className="text-xs text-slate-400 truncate">{student?.email}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          className="apex-button-primary py-1 px-2.5 text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                          disabled={Boolean(pendingActionLoading[studentId])}
                          onClick={() => handleApprove(studentId)}
                          type="button"
                        >
                          {isApprove ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                          Approve
                        </button>
                        <button
                          className="apex-button-secondary py-1 px-2.5 text-xs hover:bg-red-500/10 hover:text-red-300"
                          disabled={Boolean(pendingActionLoading[studentId])}
                          onClick={() => handleReject(studentId)}
                          type="button"
                        >
                          {isReject ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pendingStudentIds.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No pending join requests.</p>
                )}
              </div>
            </section>

            {/* Student Roster Card */}
            <section className="glass-card p-5">
              <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-3">
                <Users size={18} className="text-amber-400" />
                Approved Student Roster ({enrolledStudentIds.length})
              </h2>
              <div className="grid gap-2">
                {enrolledStudentIds.map((studentId) => {
                  const student = studentMap.get(studentId);
                  const parentEmail = batch?.parentEmails?.[studentId] || '';
                  return (
                    <div className="flex flex-col gap-2 bg-white/[0.02] p-3 rounded-xl border border-white/5" key={studentId}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">
                          <p className="text-sm font-semibold text-slate-200 truncate">{student?.displayName || `Student (${studentId.slice(0, 6)})`}</p>
                          <p className="text-xs text-slate-400 truncate">{student?.email || 'No email registered'}</p>
                        </div>
                      </div>

                      {/* Parent Email Form Row */}
                      <div className="mt-1 pt-2 border-t border-white/5 flex gap-2 items-center">
                        <label className="text-[10px] text-slate-400 font-bold uppercase flex-shrink-0">Parent Email:</label>
                        <input
                          className="apex-input py-0.5 px-2 text-xs flex-1 min-w-0"
                          defaultValue={parentEmail}
                          onBlur={async (e) => {
                            const newEmail = e.target.value.trim();
                            if (newEmail !== parentEmail) {
                              try {
                                const currentEmails = batch.parentEmails || {};
                                await updateClassDocument(batch.id, {
                                  parentEmails: {
                                    ...currentEmails,
                                    [studentId]: newEmail
                                  }
                                });
                              } catch (err) {
                                console.error('Failed to update parent email:', err);
                              }
                            }
                          }}
                          placeholder="parent@example.com"
                          type="email"
                        />
                      </div>
                    </div>
                  );
                })}
                {enrolledStudentIds.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No approved students yet.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Announcements */}
        {activeTab === 'announcements' && (
          <AnnouncementsPanel batchId={batch.id} announcements={batch.notes || []} />
        )}

        {/* Tab 3: Batch Vault */}
        {activeTab === 'vault' && (
          <VaultPanel batchId={batch.id} teacherId={teacherId} items={vault.data} />
        )}

        {/* Tab 4: Test Centre */}
        {activeTab === 'tests' && (
          <TestPanel batchId={batch.id} batchTitle={batch.title} parentEmails={batch.parentEmails || {}} teacherId={teacherId} tests={tests.data} submissions={testSubmissions.data} />
        )}

        {/* Tab 5: Quiz Centre */}
        {activeTab === 'quizzes' && (
          <QuizPanel batchId={batch.id} teacherId={teacherId} quizzes={quizzes.data} />
        )}
      </div>
    </main>
  );
}

/* SUB PANEL: Announcements manager */
function AnnouncementsPanel({ batchId, announcements }) {
  const [newNoteText, setNewNoteText] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);

  async function handlePostNote(e) {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setLoadingNote(true);
    try {
      await addBatchNote(batchId, newNoteText.trim());
      setNewNoteText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNote(false);
    }
  }

  async function handleDeleteNote(noteId) {
    try {
      await deleteBatchNote(batchId, noteId);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="glass-card p-5 max-w-3xl">
      <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
        <Send size={18} className="text-amber-400" />
        Broadcast announcements
      </h2>
      <form className="flex gap-2" onSubmit={handlePostNote}>
        <input
          className="apex-input py-2.5 px-4 text-sm flex-1 bg-white/[0.02]"
          disabled={loadingNote}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Post notes, links, or instructions to students..."
          type="text"
          value={newNoteText}
        />
        <button className="apex-button-primary py-2.5 px-4" disabled={loadingNote || !newNoteText.trim()} type="submit">
          {loadingNote ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      <div className="mt-6 grid gap-4 max-h-[500px] overflow-y-auto pr-1">
        {announcements.map((note) => (
          <article
            className="group flex justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors"
            key={note.id}
          >
            <div className="flex-1">
              <p className="text-sm text-slate-200 leading-relaxed">{note.text}</p>
              <span className="text-[10px] text-slate-500 block mt-2">
                Published on{' '}
                {new Date(note.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <button
              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all py-1 px-1.5 self-start"
              onClick={() => handleDeleteNote(note.id)}
              type="button"
            >
              <Trash2 size={14} />
            </button>
          </article>
        ))}
        {announcements.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No announcements broadcasted yet.</p>
        )}
      </div>
    </section>
  );
}

/* SUB PANEL: Batch Vault manager */
function VaultPanel({ batchId, teacherId, items }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const { upload, loading: uploading, progress } = useFileUpload();
  const [submitting, setSubmitting] = useState(false);

  async function handleAddVault(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      let fileURL = '';
      let fileName = '';
      if (file) {
        const draftId = `${Date.now()}`;
        fileURL = await upload(`vault/${draftId}/${file.name}`, file);
        fileName = file.name;
      }

      await addVaultItem({
        classId: batchId,
        title: title.trim(),
        description: desc.trim(),
        fileURL,
        fileName,
        uploadedBy: teacherId,
      });

      setTitle('');
      setDesc('');
      setFile(null);
      // Reset input element
      e.target.reset();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteVault(id) {
    try {
      await deleteVaultItem(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <section className="glass-card p-5">
        <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Upload size={18} className="text-amber-400" />
          Add vault resource
        </h2>
        <form className="grid gap-4" onSubmit={handleAddVault}>
          <label className="grid gap-1 text-sm font-semibold text-slate-200">
            Resource Title
            <input
              className="apex-input"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mathematics Grade 9 Syllabus"
              required
              type="text"
              value={title}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-200">
            Description
            <textarea
              className="apex-input min-h-24 resize-y"
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Provide a syllabus summary or resource guidelines..."
              value={desc}
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-200">
            Attach Document / File
            <input
              className="apex-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              type="file"
            />
            {uploading && <span className="text-xs text-amber-300">Uploading: {progress}%</span>}
          </label>

          <button className="apex-button-primary" disabled={submitting || uploading} type="submit">
            {submitting || uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Upload to Vault
          </button>
        </form>
      </section>

      <section className="glass-card p-5">
        <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-amber-400" />
          Vault resources ({items.length})
        </h2>
        <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-1">
          {items.map((item) => (
            <article className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl flex flex-col justify-between" key={item.id}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </div>
                <button
                  className="text-slate-500 hover:text-red-400 py-1 px-1.5"
                  onClick={() => handleDeleteVault(item.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {item.fileURL && (
                <div className="mt-3 border-t border-white/5 pt-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-500 truncate max-w-xs">{item.fileName || 'Attachment'}</span>
                  <a
                    className="apex-button-primary py-1 px-2.5 text-xs flex items-center gap-1 bg-amber-400/10 border-amber-400/20 text-amber-300 hover:bg-amber-400/20"
                    href={item.fileURL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Download size={12} />
                    View File
                  </a>
                </div>
              )}
            </article>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Vault is currently empty.</p>
          )}
        </div>
      </section>
    </div>
  );
}

/* SUB PANEL: Test Centre manager */
function TestPanel({ batchId, batchTitle, parentEmails = {}, teacherId, tests, submissions }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState(null);
  const { upload, loading: uploading, progress } = useFileUpload();
  const [submitting, setSubmitting] = useState(false);

  const [testContent, setTestContent] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiGrade, setAiGrade] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('Medium');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingSubmitLoading, setGradingSubmitLoading] = useState(false);
  const [emailModalData, setEmailModalData] = useState(null);
  const [aiGradingLoading, setAiGradingLoading] = useState(false);
  const [aiGradingError, setAiGradingError] = useState(null);
  const [pastedAnswers, setPastedAnswers] = useState('');

  async function handleAIGrade(activeSub, test) {
    setAiGradingError(null);
    setAiGradingLoading(true);
    try {
      let imageUrl = null;
      if (activeSub.submittedFileURL && activeSub.submittedFileName) {
        const lowerName = activeSub.submittedFileName.toLowerCase();
        const isImg = lowerName.endsWith('.png') || 
                      lowerName.endsWith('.jpg') || 
                      lowerName.endsWith('.jpeg') || 
                      lowerName.endsWith('.webp') ||
                      lowerName.endsWith('.gif');
        if (isImg) {
          imageUrl = activeSub.submittedFileURL;
        }
      }

      const answersText = activeSub.studentText || pastedAnswers;
      if ((!answersText || !answersText.trim()) && !imageUrl) {
        throw new Error('Please type or paste the student\'s answers text in the textarea below before grading (or upload an image submission instead of PDF).');
      }

      const result = await gradeSubmissionWithAI({
        testTitle: test.title,
        testQuestions: test.testContent || test.description,
        maxScore: test.maxScore,
        studentAnswers: answersText ? answersText.trim() : null,
        imageUrl: imageUrl,
        studentName: activeSub.studentName,
      });
      setGradeInput(String(result.score));
      setFeedbackInput(result.feedback);
    } catch (err) {
      console.error(err);
      setAiGradingError(err.message || 'AI Grading failed.');
    } finally {
      setAiGradingLoading(false);
    }
  }



  async function handleAITestGenerate(e) {
    e.preventDefault();
    if (!aiGrade.trim() || !aiTopic.trim()) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAITest({
        grade: aiGrade.trim(),
        topic: aiTopic.trim(),
        level: aiLevel,
        instructions: aiInstructions.trim(),
      });

      setTitle(result.title);
      setDesc(result.description);
      setMaxScore(result.maxScore || 100);
      setTestContent(result.testContent || '');
      setShowAIPanel(false);
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'AI Generation failed.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAddTest(e) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSubmitting(true);
    try {
      let testFileURL = '';
      let testFileName = '';
      if (file) {
        const draftId = `${Date.now()}`;
        testFileURL = await upload(`tests/${draftId}/${file.name}`, file);
        testFileName = file.name;
      }

      await createTestDocument({
        classId: batchId,
        title: title.trim(),
        description: desc.trim(),
        maxScore: Number(maxScore),
        dueDate: new Date(dueDate).toISOString(),
        testFileURL,
        testFileName,
        testContent: testContent.trim() || null,
        teacherId,
      });

      setTitle('');
      setDesc('');
      setMaxScore(100);
      setDueDate('');
      setFile(null);
      setTestContent('');
      e.target.reset();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGradeSubmit(e) {
    e.preventDefault();
    if (!gradingSubmissionId || gradeInput === '') return;

    setGradingSubmitLoading(true);
    try {
      await gradeSubmissionDocument(gradingSubmissionId, {
        grade: Number(gradeInput),
        feedback: feedbackInput.trim(),
        gradedBy: teacherId,
      });
      setGradingSubmissionId(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setGradingSubmitLoading(false);
    }
  }

  async function gradeSubmissionDocument(submissionId, data) {
    return gradeTestSubmission(submissionId, data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      {/* Test Publisher form */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-amber-400" />
            Publish test paper
          </h2>
          <button
            className="apex-button-secondary py-1 px-2.5 text-[10px] bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-300 flex items-center gap-1.5"
            onClick={() => {
              setShowAIPanel(!showAIPanel);
              setAiError(null);
            }}
            type="button"
          >
            <Radio size={12} className="animate-pulse" />
            {showAIPanel ? 'Manual Mode' : 'AI Creator'}
          </button>
        </div>

        {showAIPanel ? (
          <form className="grid gap-4 bg-purple-500/[0.02] border border-purple-500/10 p-4 rounded-2xl" onSubmit={handleAITestGenerate}>
            <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">AI Test Generator</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Grade / Class
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setAiGrade(e.target.value)}
                  placeholder="e.g., Grade 9"
                  required
                  type="text"
                  value={aiGrade}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Difficulty Level
                <select
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setAiLevel(e.target.value)}
                  value={aiLevel}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>
            </div>

            <label className="grid gap-1 text-xs font-semibold text-slate-200">
              Topic
              <input
                className="apex-input py-1.5 px-3 text-xs"
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Quadratic Equations"
                required
                type="text"
                value={aiTopic}
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-slate-200">
              Custom Instructions (Optional)
              <textarea
                className="apex-input min-h-16 text-xs"
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="e.g., focus on word problems, include 5 questions..."
                value={aiInstructions}
              />
            </label>

            {aiError && <p className="text-xs text-red-300">{aiError}</p>}

            <button
              className="apex-button-primary bg-purple-500 hover:bg-purple-400 text-white font-bold py-2"
              disabled={aiLoading}
              type="submit"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : 'Generate Test questions'}
            </button>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={handleAddTest}>
            {testContent && (
              <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl flex flex-col gap-1 text-[11px] text-purple-300 leading-normal">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1">✨ AI-Generated Test Content Loaded</span>
                <span>We populated the title, description, max score, and markdown test paper content. Please review, edit if needed, and set the deadline below.</span>
              </div>
            )}
            <label className="grid gap-1 text-sm font-semibold text-slate-200">
              Test Title
              <input
                className="apex-input"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Algebra Mid-Term Test"
                required
                type="text"
                value={title}
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-slate-200">
              Syllabus / Description
              <textarea
                className="apex-input min-h-20 resize-y"
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Topics, guidelines, duration..."
                value={desc}
              />
            </label>

            {testContent && (
              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Generated Test Content (Markdown - Editable)
                <textarea
                  className="apex-input min-h-40 resize-y font-mono text-xs leading-relaxed"
                  onChange={(e) => setTestContent(e.target.value)}
                  required
                  value={testContent}
                />
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-200">
                Max Score
                <input
                  className="apex-input"
                  min="1"
                  onChange={(e) => setMaxScore(e.target.value)}
                  required
                  type="number"
                  value={maxScore}
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-200">
                Due Date / Time
                <input
                  className="apex-input"
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  type="datetime-local"
                  value={dueDate}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-slate-200">
              Question Paper File (PDF/Image - Optional if AI generated)
              <input
                className="apex-input"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                type="file"
              />
              {uploading && <span className="text-xs text-amber-300">Uploading: {progress}%</span>}
            </label>

            <button className="apex-button-primary" disabled={submitting || uploading} type="submit">
              {submitting || uploading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />}
              Publish Test
            </button>
          </form>
        )}
      </section>

      {/* Tests and Solutions list */}
      <section className="glass-card p-5">
        <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
          <ClipboardList size={18} className="text-amber-400" />
          Active tests ({tests.length})
        </h2>
        <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-1">
          {tests.map((test) => {
            const testSubs = submissions.filter((s) => s.testId === test.id);
            return (
              <article className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl" key={test.id}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-white text-lg">{test.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{test.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
                      <span>Max Score: <strong className="text-amber-400">{test.maxScore}</strong></span>
                      <span>Due: <strong>{new Date(test.dueDate).toLocaleString()}</strong></span>
                    </div>
                  </div>
                  {test.testFileURL && (
                    <a
                      className="apex-button-secondary py-1 px-2.5 text-xs flex-shrink-0"
                      href={test.testFileURL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Paper
                    </a>
                  )}
                </div>

                {test.testContent && (
                  <details className="mt-3 bg-white/[0.01] border border-white/5 rounded-xl p-3 text-xs">
                    <summary className="cursor-pointer font-bold text-amber-400 select-none">
                      View Test Questions Paper
                    </summary>
                    <div className="mt-2.5 max-h-60 overflow-y-auto pr-1 border-t border-white/5 pt-2 text-slate-300 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                      {test.testContent}
                    </div>
                  </details>
                )}

                {/* Submissions Grading sub-list */}
                <div className="mt-4 border-t border-white/5 pt-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Student Submissions ({testSubs.length})
                  </h4>
                  <div className="grid gap-2">
                    {testSubs.map((sub) => {
                      const isGraded = sub.status === 'graded';
                      return (
                        <div
                          className="bg-white/[0.01] border border-white/5 p-3 rounded-xl text-xs grid gap-2"
                          key={sub.id}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate flex-1">
                              <span className="font-bold text-slate-200 block truncate">{sub.studentName}</span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {sub.submittedFileName || 'No file uploaded'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {sub.submittedFileURL && (
                                <a
                                  className="apex-button-secondary py-0.5 px-2 text-[10px] hover:bg-white/10"
                                  href={sub.submittedFileURL}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  View File
                                </a>
                              )}

                              {isGraded ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-emerald-400 px-1">
                                    {sub.grade} / {test.maxScore}
                                  </span>
                                  <button
                                    className="apex-button-secondary py-0.5 px-1.5 text-[10px] hover:bg-white/10 text-amber-300 border-amber-400/20 flex items-center gap-1"
                                    onClick={() => handlePrintReport(test, sub, sub.studentName, batchTitle)}
                                    type="button"
                                    title="Save as PDF / Print"
                                  >
                                    <Printer size={10} />
                                    PDF
                                  </button>
                                  <button
                                    className="apex-button-secondary py-0.5 px-1.5 text-[10px] hover:bg-white/10 text-emerald-300 border-emerald-400/20 flex items-center gap-1"
                                    onClick={() => {
                                      const text = encodeURIComponent(
                                        `📚 *SmartChalk Academic Report* 📚\n\n` +
                                        `*Student Name:* ${sub.studentName}\n` +
                                        `*Batch/Subject:* ${batchTitle}\n` +
                                        `*Test:* ${test.title}\n` +
                                        `*Score:* *${sub.grade} / ${test.maxScore} marks*\n\n` +
                                        `*Teacher's Feedback:*\n"${sub.feedback}"\n\n` +
                                        `Log in to your SmartChalk account to download the full questions & answers PDF report.`
                                      );
                                      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                                    }}
                                    type="button"
                                    title="Send WhatsApp update to parents"
                                  >
                                    <Send size={10} />
                                    WhatsApp
                                  </button>
                                  
                                  {parentEmails[sub.studentId] ? (
                                    <button
                                      className="apex-button-secondary py-0.5 px-1.5 text-[10px] hover:bg-white/10 text-sky-300 border-sky-400/20 flex items-center gap-1"
                                      onClick={() => {
                                        const pEmail = parentEmails[sub.studentId];
                                        const percentage = Math.round((sub.grade / test.maxScore) * 100);
                                        setEmailModalData({
                                          to: pEmail,
                                          subject: `SmartChalk Academic Report - ${sub.studentName} - ${test.title}`,
                                          body: `Dear Parent,\n\n` +
                                                `I hope this email finds you well.\n\n` +
                                                `This is a professional academic update for your child, ${sub.studentName}, regarding their performance in our SmartChalk live class (${batchTitle}).\n\n` +
                                                `We recently completed and evaluated the test: "${test.title}".\n\n` +
                                                `Here is a summary of their performance:\n` +
                                                `- Graded Score: ${sub.grade} / ${test.maxScore} marks (${percentage}%)\n` +
                                                `- Performance Status: Evaluated & Graded\n\n` +
                                                `Teacher's Feedback & Comments:\n` +
                                                `--------------------------------------------------\n` +
                                                `"${sub.feedback || ''}"\n` +
                                                `--------------------------------------------------\n\n` +
                                                `If you would like to view the complete details of the test paper, including the original questions and your child's submitted answers, you can access the SmartChalk Student Dashboard using your secure credentials.\n\n` +
                                                `Thank you for your continued support in your child's learning journey. Please feel free to reply directly to this email if you have any questions or would like to discuss their progress in more detail.\n\n` +
                                                `Warm regards,\n` +
                                                `SmartChalk Tutoring`,
                                          copied: false
                                        });
                                      }}
                                      type="button"
                                      title="Share professional email report with parents"
                                    >
                                      <Mail size={10} />
                                      Email
                                    </button>
                                  ) : (
                                    <span 
                                      className="text-[9px] text-slate-500 italic px-1 cursor-help"
                                      title="Add parent email under Roster tab to email report"
                                    >
                                      (No Parent Email)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  className="apex-button-primary py-0.5 px-2 text-[10px]"
                                  onClick={() => {
                                    setGradingSubmissionId(sub.id);
                                    setGradeInput('');
                                    setFeedbackInput('');
                                    setAiGradingError(null);
                                    setPastedAnswers('');
                                  }}
                                  type="button"
                                >
                                  Grade
                                </button>
                              )}
                            </div>
                          </div>

                          {sub.studentText && (
                            <div className="mt-1 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg">
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Student Text Answers</span>
                              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto font-mono">{sub.studentText}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inline submission grader popup */}
                {(() => {
                  const activeSub = testSubs.find((s) => s.id === gradingSubmissionId);
                  if (!gradingSubmissionId || !activeSub) return null;
                  
                  return (
                    <form className="mt-4 border-t border-amber-400/20 bg-amber-500/5 p-3 rounded-xl grid gap-3" onSubmit={handleGradeSubmit}>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-white">Grade student paper</p>
                        <button
                          className="apex-button-secondary bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-300 py-0.5 px-2 text-[9px] flex items-center gap-1"
                          disabled={aiGradingLoading}
                          onClick={() => handleAIGrade(activeSub, test)}
                          type="button"
                        >
                          {aiGradingLoading ? (
                            <Loader2 className="animate-spin" size={10} />
                          ) : (
                            '✨ Grade with AI'
                          )}
                        </button>
                      </div>

                      {aiGradingError && (
                        <p className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{aiGradingError}</p>
                      )}

                      {!activeSub.studentText && (
                        <label className="grid gap-1 text-[10px] font-semibold text-slate-300">
                          Student Answers Text (Paste answers here to enable AI Grading)
                          <textarea
                            className="apex-input py-1 px-2 text-xs min-h-[60px] resize-y font-mono"
                            onChange={(e) => setPastedAnswers(e.target.value)}
                            placeholder="Copy and paste the student's solution text or key calculations here..."
                            value={pastedAnswers}
                          />
                        </label>
                      )}

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="grid gap-1 text-[11px] font-semibold text-slate-200">
                          Score
                          <input
                            className="apex-input py-1 px-2 text-xs"
                            max={test.maxScore}
                            min="0"
                            onChange={(e) => setGradeInput(e.target.value)}
                            required
                            type="number"
                            value={gradeInput}
                          />
                        </label>
                        <label className="grid gap-1 text-[11px] font-semibold text-slate-200">
                          Feedback
                          <input
                            className="apex-input py-1 px-2 text-xs"
                            onChange={(e) => setFeedbackInput(e.target.value)}
                            placeholder="Well done..."
                            type="text"
                            value={feedbackInput}
                          />
                        </label>
                      </div>
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          className="apex-button-secondary py-1 px-3 text-[10px]"
                          onClick={() => setGradingSubmissionId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="apex-button-primary py-1 px-3 text-[10px]"
                          disabled={gradingSubmitLoading}
                          type="submit"
                        >
                          {gradingSubmitLoading ? 'Saving...' : 'Save Grade'}
                        </button>
                      </div>
                    </form>
                  );
                })()}
              </article>
            );
          })}
          {tests.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No tests published yet.</p>
          )}
        </div>
      </section>

      {/* Email Modal Overlay */}
      {emailModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <h3 className="font-heading text-lg font-bold text-sky-400 flex items-center gap-2 mb-2">
              <Mail size={20} />
              Share Academic Report via Email
            </h3>
            
            <div className="grid gap-3 text-xs mt-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">To (Parent's Email):</label>
                <input
                  readOnly
                  className="w-full bg-white/[0.04] border border-white/10 p-2.5 rounded-lg text-slate-300 font-medium font-sans"
                  value={emailModalData.to}
                />
              </div>
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Subject:</label>
                <input
                  readOnly
                  className="w-full bg-white/[0.04] border border-white/10 p-2.5 rounded-lg text-slate-300 font-medium font-sans"
                  value={emailModalData.subject}
                />
              </div>
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Body Draft:</label>
                <textarea
                  readOnly
                  className="w-full bg-white/[0.04] border border-white/10 p-3 rounded-lg text-slate-300 leading-relaxed font-sans resize-none h-48 select-all"
                  value={emailModalData.body}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-end mt-6">
              <button
                className="apex-button-secondary py-2 px-4 text-xs font-semibold hover:bg-white/10"
                onClick={() => setEmailModalData(null)}
                type="button"
              >
                Close
              </button>
              
              <button
                className="apex-button-secondary bg-sky-500/10 border-sky-500/20 text-sky-300 hover:bg-sky-500/20 py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(emailModalData.body);
                    setEmailModalData(prev => ({ ...prev, copied: true }));
                    setTimeout(() => {
                      setEmailModalData(prev => prev ? { ...prev, copied: false } : null);
                    }, 2000);
                  } catch (err) {
                    console.error('Failed to copy text:', err);
                  }
                }}
                type="button"
              >
                {emailModalData.copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Draft Content
                  </>
                )}
              </button>
              
              <a
                className="apex-button-primary bg-sky-500 hover:bg-sky-600 text-slate-900 py-2 px-4 text-xs font-bold flex items-center gap-1.5 decoration-none"
                href={`mailto:${emailModalData.to}?subject=${encodeURIComponent(emailModalData.subject)}&body=${encodeURIComponent(emailModalData.body)}`}
                onClick={() => {
                  setTimeout(() => setEmailModalData(null), 1000);
                }}
              >
                <Mail size={14} />
                Send via Mail Client
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* SUB PANEL: Quiz Centre manager */
function QuizPanel({ batchId, teacherId, quizzes }) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Accumulated questions for the quiz
  const [questions, setQuestions] = useState([]);

  // Question fields
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIndex, setCorrectIndex] = useState(0);

  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiGrade, setAiGrade] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('Medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  async function handleAIQuizGenerate(e) {
    e.preventDefault();
    if (!aiGrade.trim() || !aiTopic.trim()) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAIQuiz({
        grade: aiGrade.trim(),
        topic: aiTopic.trim(),
        level: aiLevel,
        count: Number(aiCount),
      });

      setTitle(result.title);
      setQuestions(result.questions || []);
      setShowAIPanel(false);
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'AI Generation failed.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleAddQuestion(e) {
    e.preventDefault();
    if (!qText.trim() || !opt0.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim()) return;

    const newQ = {
      id: crypto.randomUUID(),
      questionText: qText.trim(),
      options: [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()],
      correctOptionIndex: Number(correctIndex),
    };

    setQuestions((prev) => [...prev, newQ]);

    setQText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setCorrectIndex(0);
  }

  async function handlePublishQuiz(e) {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) return;

    setSubmitting(true);
    try {
      await createQuizDocument({
        classId: batchId,
        title: title.trim(),
        teacherId,
        questions,
      });
      setTitle('');
      setQuestions([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      {/* Quiz Publisher builder */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-amber-400" />
            Create MCQ Quiz
          </h2>
          <button
            className="apex-button-secondary py-1 px-2.5 text-[10px] bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-300 flex items-center gap-1.5"
            onClick={() => {
              setShowAIPanel(!showAIPanel);
              setAiError(null);
            }}
            type="button"
          >
            <Radio size={12} className="animate-pulse" />
            {showAIPanel ? 'Manual Mode' : 'AI Creator'}
          </button>
        </div>

        {showAIPanel ? (
          <form className="grid gap-4 bg-purple-500/[0.02] border border-purple-500/10 p-4 rounded-2xl" onSubmit={handleAIQuizGenerate}>
            <p className="text-xs font-bold text-purple-300 uppercase tracking-wide">AI Quiz Generator</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Grade / Class
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setAiGrade(e.target.value)}
                  placeholder="e.g., Grade 9"
                  required
                  type="text"
                  value={aiGrade}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Difficulty Level
                <select
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setAiLevel(e.target.value)}
                  value={aiLevel}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Topic
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Fractions"
                  required
                  type="text"
                  value={aiTopic}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold text-slate-200">
                Questions count
                <select
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setAiCount(e.target.value)}
                  value={aiCount}
                >
                  <option value="3">3 questions</option>
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                </select>
              </label>
            </div>

            {aiError && <p className="text-xs text-red-300">{aiError}</p>}

            <button
              className="apex-button-primary bg-purple-500 hover:bg-purple-400 text-white font-bold py-2"
              disabled={aiLoading}
              type="submit"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : 'Generate MCQ Quiz'}
            </button>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={handlePublishQuiz}>
            {questions.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl flex flex-col gap-1 text-[11px] text-purple-300 leading-normal">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1">✨ AI-Generated Quiz Loaded ({questions.length} questions)</span>
                <span>We pre-filled the quiz title and the question list. Review them, add/edit items if needed, and click Publish below.</span>
              </div>
            )}
            <label className="grid gap-1 text-sm font-semibold text-slate-200">
              Quiz Title
              <input
                className="apex-input"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fractions Quiz Competition"
                required
                type="text"
                value={title}
              />
            </label>

          {/* Add Questions sub-form */}
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Add question ({questions.length} added)</h3>
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-slate-300">
                Question Text
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="What is 1/2 + 1/4?"
                  type="text"
                  value={qText}
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setOpt0(e.target.value)}
                  placeholder="Option 1"
                  type="text"
                  value={opt0}
                />
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setOpt1(e.target.value)}
                  placeholder="Option 2"
                  type="text"
                  value={opt1}
                />
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setOpt2(e.target.value)}
                  placeholder="Option 3"
                  type="text"
                  value={opt2}
                />
                <input
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setOpt3(e.target.value)}
                  placeholder="Option 4"
                  type="text"
                  value={opt3}
                />
              </div>

              <label className="grid gap-1 text-xs font-semibold text-slate-300">
                Correct Option index
                <select
                  className="apex-input py-1.5 px-3 text-xs"
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                  value={correctIndex}
                >
                  <option value="0">Option 1</option>
                  <option value="1">Option 2</option>
                  <option value="2">Option 3</option>
                  <option value="3">Option 4</option>
                </select>
              </label>

              <button
                className="apex-button-secondary py-1 px-3 text-[11px] self-end mt-2 flex items-center gap-1"
                onClick={handleAddQuestion}
                type="button"
              >
                <Plus size={12} />
                Add Question
              </button>
            </div>
          </div>

          <button className="apex-button-primary" disabled={submitting || questions.length === 0} type="submit">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
            Publish Quiz ({questions.length} questions)
          </button>
        </form>
        )}

        {/* Questions list preview */}
        {questions.length > 0 && (
          <div className="mt-4 bg-white/[0.01] border border-white/5 p-3 rounded-xl max-h-48 overflow-y-auto">
            <p className="text-xs font-bold text-white mb-2">Quiz Questions Preview:</p>
            <div className="grid gap-2">
              {questions.map((q, idx) => (
                <div className="text-[11px] text-slate-400" key={q.id}>
                  {idx + 1}. {q.questionText} (Answer: Opt {q.correctOptionIndex + 1})
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quizzes list and leaderboard score reports */}
      <section className="glass-card p-5">
        <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-amber-400" />
          Active quizzes ({quizzes.length})
        </h2>
        <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-1">
          {quizzes.map((quiz) => (
            <article className="border border-white/10 bg-white/[0.02] p-4 rounded-2xl" key={quiz.id}>
              <h3 className="font-bold text-white text-lg">{quiz.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Total Questions: {quiz.questions?.length || 0}</p>
              
              {/* Leaderboard sub-component */}
              <QuizLeaderboard quizId={quiz.id} />
            </article>
          ))}
          {quizzes.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No quizzes published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

/* SUB COMPONENT: Scoreboard display inside quiz card */
function QuizLeaderboard({ quizId }) {
  const { data: scores } = useQuizScores(quizId);

  return (
    <div className="border-t border-white/5 pt-3 mt-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1">
        <Award size={14} />
        Live Scoreboard ({scores.length})
      </h4>
      <div className="grid gap-1.5 max-h-36 overflow-y-auto pr-1">
        {scores.map((score, index) => {
          const rank = index + 1;
          return (
            <div
              className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-xs bg-white/[0.01] border border-white/5"
              key={score.id}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`font-bold flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                  rank === 1 ? 'bg-yellow-500 text-slate-950 font-black' : rank === 2 ? 'bg-slate-300 text-slate-950 font-black' : rank === 3 ? 'bg-amber-700 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}>
                  {rank}
                </span>
                <span className="truncate font-semibold text-slate-300">{score.studentName}</span>
              </div>
              <span className="font-black text-white">{score.score} / {score.totalQuestions}</span>
            </div>
          );
        })}
        {scores.length === 0 && (
          <p className="text-[10px] text-slate-500 py-1">No responses submitted yet.</p>
        )}
      </div>
    </div>
  );
}
