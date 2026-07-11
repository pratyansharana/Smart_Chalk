import { CalendarDays, Video, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../../components/common/Skeleton';
import { getClassDocument, requestToJoinClass } from '../../../services/firebase/classesService';

export function UpcomingClassesCard({ classes, studentId, loading, error, className = '' }) {
  const [requestBatchId, setRequestBatchId] = useState('');
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  async function handleJoinRequest(e) {
    e.preventDefault();
    const trimmedId = requestBatchId.trim();
    if (!trimmedId || !studentId) return;

    setRequestLoading(true);
    setRequestStatus(null);
    try {
      const batch = await getClassDocument(trimmedId);
      if (!batch) {
        setRequestStatus({ type: 'error', message: 'Batch ID not found.' });
        return;
      }

      const enrolled = batch.studentIds?.includes(studentId);
      const pending = batch.pendingStudentIds?.includes(studentId);

      if (enrolled) {
        setRequestStatus({ type: 'error', message: 'Already enrolled in this batch.' });
      } else if (pending) {
        setRequestStatus({ type: 'success', message: 'Enrollment request is already pending.' });
      } else {
        await requestToJoinClass(trimmedId, studentId);
        setRequestStatus({
          type: 'success',
          message: 'Request submitted successfully! Waiting for teacher approval.',
        });
        setRequestBatchId('');
      }
    } catch (err) {
      setRequestStatus({ type: 'error', message: err.message || 'Failed to submit request.' });
    } finally {
      setRequestLoading(false);
    }
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <section className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Class Batches</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-white">My enrolled batches</h2>
        </div>
        <CalendarDays className="text-amber-400" size={28} />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error.message}
        </p>
      )}

      {/* Enrolled Batches List */}
      <div className="mt-6 grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
        {classes?.map((item) => {
          const isLive = item.status === 'live';
          return (
            <article
              className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                isLive
                  ? 'border-emerald-400/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
              key={item.id}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-400">
                    {item.subject}
                  </span>
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      <span className="live-dot" />
                      Live
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-heading text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{item.schedule || 'Schedule pending'}</p>
              </div>

              {item.notes && item.notes.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 mb-2">
                    Teacher Announcements
                  </p>
                  <div className="grid gap-2 max-h-36 overflow-y-auto pr-1">
                    {item.notes.map((note) => (
                      <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl" key={note.id}>
                        <p className="text-xs text-slate-300">{note.text}</p>
                        <span className="text-[9px] text-slate-500 block mt-1">
                          {new Date(note.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Link
                  className="apex-button-secondary text-xs flex-1 py-2 text-center flex items-center justify-center gap-1"
                  to={`batch/${item.id}`}
                >
                  Workspace
                </Link>
                {item.meetingLink ? (
                  <a
                    className={`flex-1 text-xs py-2 text-center rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      isLive
                        ? 'bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                    href={item.meetingLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Video size={14} />
                    {isLive ? 'Join Live' : 'Meet Link'}
                  </a>
                ) : (
                  <span className="flex-1 text-center text-xs text-slate-500 py-2 border border-dashed border-white/5 rounded-xl">No link</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {(!classes || classes.length === 0) && (
        <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          You are not enrolled in any batches yet. Enter a Batch ID below to request access.
        </p>
      )}

      {/* Join Batch Form */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="font-heading text-lg font-bold text-white">Join a new batch</h3>
        <p className="text-xs text-slate-400">Enter the Batch ID shared by your teacher to request enrollment.</p>

        <form className="mt-4 flex max-w-md gap-3" onSubmit={handleJoinRequest}>
          <input
            className="apex-input flex-1"
            disabled={requestLoading}
            onChange={(e) => setRequestBatchId(e.target.value)}
            placeholder="Batch ID (e.g., class-doc-id)"
            required
            type="text"
            value={requestBatchId}
          />
          <button className="apex-button-primary px-5" disabled={requestLoading || !requestBatchId.trim()} type="submit">
            {requestLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Request
          </button>
        </form>

        {requestStatus && (
          <p
            className={`mt-3 text-sm font-semibold ${
              requestStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {requestStatus.message}
          </p>
        )}
      </div>
    </section>
  );
}
