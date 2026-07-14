import { isBefore } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Skeleton } from '../../../components/common/Skeleton';
import { WorksheetUploader } from './WorksheetUploader';
import { MathView } from '../../../components/common/MathView';

function toDate(value) {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
}

export function AssignmentsCard({ assignments, submissions, studentId, loading, error, parentMode, className = '' }) {
  const [tab, setTab] = useState('pending');
  const submissionByAssignment = useMemo(
    () => new Map(submissions.map((submission) => [submission.assignmentId, submission])),
    [submissions],
  );

  const filteredAssignments = assignments.filter((assignment) => {
    const submission = submissionByAssignment.get(assignment.id);
    const dueDate = toDate(assignment.dueDate);
    if (tab === 'completed') return Boolean(submission);
    if (tab === 'overdue') return !submission && dueDate && isBefore(dueDate, new Date());
    return !submission;
  });

  if (loading) return <Skeleton className="h-96" />;

  return (
    <section className={`glass-card p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Assignments</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-white">Worksheet queue</h2>
        </div>
        <ClipboardList className="text-amber-400" size={28} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {['pending', 'overdue', 'completed'].map((item) => (
          <button className={tab === item ? 'apex-button-primary' : 'apex-button-secondary'} key={item} onClick={() => setTab(item)} type="button">
            {item}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error.message}</p>}
      {!error && filteredAssignments.length === 0 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          No {tab} assignments right now.
        </div>
      )}
      <div className="mt-5 grid gap-4">
        {filteredAssignments.map((assignment) => {
          const sub = submissionByAssignment.get(assignment.id);
          return (
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={assignment.id}>
              <div className="grid gap-3 lg:grid-cols-[1fr_360px] lg:items-start">
                <div>
                  <h3 className="font-heading text-xl font-bold text-white">{assignment.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{assignment.description || assignment.subject}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Due {toDate(assignment.dueDate)?.toLocaleDateString() || 'pending'} / Max score {assignment.maxScore || 100}
                  </p>
                  {assignment.worksheetFileURL && (
                    <a className="mt-4 inline-flex text-sm font-bold text-amber-400 hover:text-amber-300" href={assignment.worksheetFileURL} rel="noreferrer" target="_blank">
                      Download worksheet
                    </a>
                  )}
                </div>
                {!parentMode ? (
                  <WorksheetUploader assignment={assignment} studentId={studentId} submission={sub} />
                ) : (
                  <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl text-center self-stretch flex flex-col justify-center min-h-[90px]">
                    {sub ? (
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Graded Score:</span>
                        <span className="text-base font-black text-slate-200 mt-0.5 block">
                          {sub.grade !== undefined && sub.grade !== null
                            ? `${sub.grade} / ${assignment.maxScore || 100} marks (${Math.round((sub.grade / (assignment.maxScore || 100)) * 100)}%)`
                            : 'Pending teacher review...'}
                        </span>
                        {sub.feedback && (
                          <div className="mt-2 bg-white/[0.02] border border-white/5 p-2 rounded-lg text-xs">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teacher Remarks:</span>
                            <MathView text={sub.feedback} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">
                        Pending Submission
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
