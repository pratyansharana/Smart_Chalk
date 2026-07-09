import { formatDistanceToNow, isAfter, isBefore, subMinutes } from 'date-fns';
import { CalendarDays, Video } from 'lucide-react';
import { Skeleton } from '../../../components/common/Skeleton';

function toDate(value) {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
}

function isLiveNow(item) {
  const start = toDate(item.startTime);
  const end = toDate(item.endTime);
  const now = new Date();
  if (item.status === 'live') return true;
  if (!start || !end) return false;
  return isAfter(now, subMinutes(start, 5)) && isBefore(now, end);
}

export function UpcomingClassesCard({ classes, loading, error }) {
  const nextClass = classes?.[0];
  const live = nextClass ? isLiveNow(nextClass) : false;
  const start = toDate(nextClass?.startTime);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <section className="glass-card min-h-64 p-6 md:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Next live class</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-white">{nextClass?.title || 'No classes scheduled yet'}</h2>
        </div>
        <CalendarDays className="text-amber-400" size={28} />
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error.message}</p>}
      {!error && !nextClass && <p className="mt-5 text-slate-300">Your upcoming live classes will appear here once your teacher schedules them.</p>}
      {nextClass && (
        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-slate-300">{nextClass.subject}</p>
            <p className="mt-1 text-lg font-bold text-white">
              {start ? `${formatDistanceToNow(start, { addSuffix: true })}` : 'Time pending'}
            </p>
            {live && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-300">
                <span className="live-dot" />
                Live now
              </p>
            )}
          </div>
          <a className={live ? 'apex-button-primary' : 'apex-button-secondary'} href={nextClass.meetingLink || '#'} rel="noreferrer" target="_blank">
            <Video size={18} />
            {live ? 'Join now' : 'Open meeting link'}
          </a>
        </div>
      )}
    </section>
  );
}
