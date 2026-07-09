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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBatchDetails } from '../../hooks/useBatchDetails';
import { useStudents } from '../../hooks/useStudents';
import { useBatchAssignments } from '../../hooks/useBatchAssignments';
import { useTeacherSubmissions } from '../../hooks/useTeacherSubmissions';
import {
  approveStudentRequest,
  rejectStudentRequest,
  toggleBatchLiveStatus,
  addBatchNote,
  deleteBatchNote,
} from '../../services/firebase/classesService';
import { AssignmentCreator } from './components/AssignmentCreator';
import { SubmissionGrader } from './components/SubmissionGrader';

export function BatchDetailsPage() {
  const { batchId } = useParams();
  const { currentUser } = useAuth();
  const teacherId = currentUser?.uid;

  const { data: batch, loading: batchLoading, error: batchError } = useBatchDetails(batchId);
  const students = useStudents();
  const assignments = useBatchAssignments(batchId);
  const submissions = useTeacherSubmissions(assignments.data);

  const [copiedId, setCopiedId] = useState(false);
  const [liveActionLoading, setLiveActionLoading] = useState(false);
  const [pendingActionLoading, setPendingActionLoading] = useState({});
  const [newNoteText, setNewNoteText] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'grading'

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
          <p className="mt-2 text-sm text-red-300/80">{batchError?.message || 'The requested batch could not be found or you do not have permission.'}</p>
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
  const notes = batch.notes || [];

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

  async function handlePostNote(e) {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setLoadingNote(true);
    try {
      await addBatchNote(batch.id, newNoteText.trim());
      setNewNoteText('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNote(false);
    }
  }

  async function handleDeleteNote(noteId) {
    try {
      await deleteBatchNote(batch.id, noteId);
    } catch (err) {
      console.error(err);
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
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-start">
        {/* Left Side: Roster & Notes */}
        <div className="grid gap-6">
          {/* Notes/Announcements Section */}
          <section className="glass-card p-5">
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Send size={18} className="text-amber-400" />
              Announcements
            </h2>
            <form className="flex gap-2" onSubmit={handlePostNote}>
              <input
                className="apex-input py-2 px-3 text-sm flex-1 bg-white/[0.02]"
                disabled={loadingNote}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Post notes, links, or instructions..."
                type="text"
                value={newNoteText}
              />
              <button className="apex-button-primary py-2 px-3" disabled={loadingNote || !newNoteText.trim()} type="submit">
                {loadingNote ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>

            <div className="mt-4 grid gap-3 max-h-72 overflow-y-auto pr-1">
              {notes.map((note) => (
                <article
                  className="group flex justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5 hover:bg-white/[0.04] transition-colors"
                  key={note.id}
                >
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{note.text}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
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
              {notes.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No announcements posted for this batch yet.</p>
              )}
            </div>
          </section>

          {/* Enrollment requests */}
          {pendingStudentIds.length > 0 && (
            <section className="glass-card border-amber-400/20 bg-amber-500/[0.03] p-5">
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
              </div>
            </section>
          )}

          {/* Student Roster Card */}
          <section className="glass-card p-5">
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Users size={18} className="text-amber-400" />
              Student Roster ({enrolledStudentIds.length})
            </h2>
            <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
              {enrolledStudentIds.map((studentId) => {
                const student = studentMap.get(studentId);
                return (
                  <div className="flex items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5" key={studentId}>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-200 truncate">{student?.displayName || `Student (${studentId.slice(0, 6)})`}</p>
                      <p className="text-xs text-slate-400 truncate">{student?.email || 'No email registered'}</p>
                    </div>
                  </div>
                );
              })}
              {enrolledStudentIds.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No students enrolled in this batch yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Side: Tabbed Classwork Workspace */}
        <div className="grid gap-6">
          <nav className="flex rounded-xl bg-white/[0.02] p-1 border border-white/5">
            <button
              className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'assignments' ? 'bg-amber-400 text-slate-900 shadow-lg' : 'text-slate-300 hover:text-white'
              }`}
              onClick={() => setActiveTab('assignments')}
              type="button"
            >
              <ClipboardList size={16} />
              Assignments
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'grading' ? 'bg-amber-400 text-slate-900 shadow-lg' : 'text-slate-300 hover:text-white'
              }`}
              onClick={() => setActiveTab('grading')}
              type="button"
            >
              <Star size={16} />
              Submission Grading
            </button>
          </nav>

          {activeTab === 'assignments' && (
            <div className="grid gap-6">
              <AssignmentCreator batchId={batch.id} studentIds={enrolledStudentIds} teacherId={teacherId} />

              <section className="glass-card p-5">
                <h3 className="font-heading text-lg font-bold text-white mb-4">Active Assignments</h3>
                <div className="grid gap-3">
                  {assignments.data.map((item) => (
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-4" key={item.id}>
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Subject: {item.subject} • Max Score: {item.maxScore}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Due: {new Date(item.dueDate).toLocaleString()}
                        </p>
                      </div>
                      {item.worksheetFileURL && (
                        <a
                          className="apex-button-secondary py-1 px-2.5 text-xs text-amber-300 border-amber-400/20 hover:bg-amber-500/10 flex-shrink-0"
                          href={item.worksheetFileURL}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Worksheet
                        </a>
                      )}
                    </article>
                  ))}
                  {assignments.data.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No assignments published for this batch yet.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'grading' && (
            <SubmissionGrader
              assignments={assignments.data}
              error={submissions.error}
              loading={submissions.loading || assignments.loading}
              submissions={submissions.data}
              teacherId={teacherId}
            />
          )}
        </div>
      </div>
    </main>
  );
}
