import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { gradeSubmissionDocument } from '../../../services/firebase/submissionsService';

const gradeSchema = z.object({
  grade: z.coerce.number().min(0).max(100),
  feedback: z.string().min(2, 'Feedback is required.'),
});

export function SubmissionGrader({ assignments, submissions, teacherId, loading, error }) {
  const [activeSubmission, setActiveSubmission] = useState(null);
  const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(gradeSchema), defaultValues: { grade: 0, feedback: '' } });

  async function onSubmit(values) {
    if (!activeSubmission) return;
    await gradeSubmissionDocument(activeSubmission.id, { ...values, gradedBy: teacherId });
    setActiveSubmission(null);
    reset();
  }

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Grading</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-white">Submission grader</h2>
        </div>
        <Star className="text-amber-400" size={24} />
      </div>
      {loading && <p className="mt-4 text-sm text-slate-300">Loading submissions...</p>}
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error.message}</p>}
      {!loading && !error && submissions.length === 0 && <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No submissions yet.</p>}
      <div className="mt-5 grid gap-3">
        {submissions.map((submission) => (
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={submission.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">{assignmentById.get(submission.assignmentId)?.title || 'Assignment'}</p>
                <p className="text-sm text-slate-400">{submission.submittedFileName}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{submission.status}</p>
              </div>
              <div className="flex gap-2">
                {submission.submittedFileURL && (
                  <a className="apex-button-secondary" href={submission.submittedFileURL} rel="noreferrer" target="_blank">
                    <Download size={16} />
                    View
                  </a>
                )}
                <button className="apex-button-primary" onClick={() => setActiveSubmission(submission)} type="button">
                  Grade
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {activeSubmission && (
        <form className="mt-5 grid gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4" onSubmit={handleSubmit(onSubmit)}>
          <p className="font-bold text-white">Grade {activeSubmission.submittedFileName}</p>
          <label className="grid gap-2 text-sm font-semibold text-slate-100">
            Grade
            <input className="apex-input" type="number" {...register('grade')} />
            {errors.grade && <span className="text-xs text-red-300">{errors.grade.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-100">
            Feedback
            <textarea className="apex-input min-h-24 resize-y" {...register('feedback')} />
            {errors.feedback && <span className="text-xs text-red-300">{errors.feedback.message}</span>}
          </label>
          <button className="apex-button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Star size={18} />}
            Save grade
          </button>
        </form>
      )}
    </section>
  );
}
