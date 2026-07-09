import { CalendarDays, Video, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '../../../components/common/Skeleton';
import { getClassDocument, requestToJoinClass } from '../../../services/firebase/classesService';

export function UpcomingClassesCard({ classes, studentId, loading, error }) {
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
    <section className="glass-card p-6 md:col-span-2">
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

              <div className="mt-6">
                {item.meetingLink ? (
                  <a
                    className={`w-full ${isLive ? 'apex-button-primary' : 'apex-button-secondary'}`}
                    href={item.meetingLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Video size={16} />
                    {isLive ? 'Join live session' : 'Meeting link'}
                  </a>
                ) : (
                  <span className="block text-center text-xs text-slate-500">No meeting link set</span>
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
