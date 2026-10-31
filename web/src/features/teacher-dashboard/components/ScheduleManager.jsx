import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, CalendarPlus, ChevronRight, GraduationCap, Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import { createClassDocument, updateClassDocument } from '../../../services/firebase/classesService';

const batchSchema = z.object({
  title: z.string().min(3, 'Batch title is required.'),
  subject: z.string().min(2, 'Subject is required.'),
  meetingLink: z.string().url('Enter a valid meeting URL.'),
  schedule: z.string().min(3, 'Schedule is required (e.g., Mon & Wed 5 PM).'),
  nextSessionTime: z.string().min(1, 'Next session date/time is required.'),
  studentIdInput: z.string().optional(),
});

export function ScheduleManager({ teacherId, students, classes }) {
  const [batchView, setBatchView] = useState('active');
  const [updatingBatchId, setUpdatingBatchId] = useState('');
  const [batchActionError, setBatchActionError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: { title: '', subject: '', meetingLink: '', schedule: '', nextSessionTime: '', studentIdInput: '' },
  });

  async function onSubmit(values) {
    const directStudentIds = values.studentIdInput?.trim() ? [values.studentIdInput.trim()] : [];
    await createClassDocument({
      title: values.title,
      subject: values.subject,
      meetingLink: values.meetingLink,
      schedule: values.schedule,
      teacherId,
      status: 'scheduled',
      startTime: new Date(values.nextSessionTime),
      endTime: new Date(new Date(values.nextSessionTime).getTime() + 60 * 60 * 1000), // default 1 hour
      studentIds: directStudentIds,
    });
    reset();
  }

  async function setBatchStatus(batch, status) {
    setUpdatingBatchId(batch.id);
    setBatchActionError('');
    try {
      await updateClassDocument(batch.id, { status });
    } catch (error) {
      setBatchActionError(error.message || 'Could not update the batch. Please try again.');
    } finally {
      setUpdatingBatchId('');
    }
  }

  const activeBatches = classes.filter((batch) => batch.status !== 'discontinued');
  const discontinuedBatches = classes.filter((batch) => batch.status === 'discontinued');
  const visibleBatches = batchView === 'active' ? activeBatches : discontinuedBatches;

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Class Batches</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-white">Batch creator</h2>
        </div>
        <CalendarPlus className="text-amber-400" size={24} />
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <ReusableInput label="Batch Title" placeholder="e.g., Maths Class 9 - Evening" error={errors.title?.message} {...register('title')} />
        <ReusableInput label="Subject" placeholder="e.g., Mathematics" error={errors.subject?.message} {...register('subject')} />
        <ReusableInput label="Meeting Link" placeholder="e.g., Google Meet URL" error={errors.meetingLink?.message} {...register('meetingLink')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <ReusableInput label="Schedule Description" placeholder="e.g., Mon & Wed 5 PM" error={errors.schedule?.message} {...register('schedule')} />
          <ReusableInput label="Next Session Date/Time" type="datetime-local" error={errors.nextSessionTime?.message} {...register('nextSessionTime')} />
        </div>

        <ReusableInput
          label="Direct Enroll Student by ID (Optional)"
          placeholder="e.g., student-auth-uid"
          error={errors.studentIdInput?.message}
          {...register('studentIdInput')}
        />

        <button className="apex-button-primary" disabled={isSubmitting || !teacherId} type="submit">
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CalendarPlus size={18} />}
          Create Batch
        </button>
      </form>

      {/* Batches Management List */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-white">Your batches</h3>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Batch status filter">
            <button
              aria-selected={batchView === 'active'}
              className={batchView === 'active' ? 'apex-button-primary px-4 py-2 text-sm' : 'apex-button-secondary px-4 py-2 text-sm'}
              onClick={() => setBatchView('active')}
              role="tab"
              type="button"
            >
              Active ({activeBatches.length})
            </button>
            <button
              aria-selected={batchView === 'discontinued'}
              className={batchView === 'discontinued' ? 'apex-button-primary px-4 py-2 text-sm' : 'apex-button-secondary px-4 py-2 text-sm'}
              onClick={() => setBatchView('discontinued')}
              role="tab"
              type="button"
            >
              Discontinued ({discontinuedBatches.length})
            </button>
          </div>
        </div>
        {batchActionError && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{batchActionError}</p>}
        <div className="grid gap-4">
          {visibleBatches.map((item) => {
            const enrolledCount = item.studentIds?.length || 0;
            const isDiscontinued = item.status === 'discontinued';
            const isUpdating = updatingBatchId === item.id;
            return (
              <article className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-amber-400/25 transition-all" key={item.id}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-amber-400">{item.subject}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${isDiscontinued ? 'border-slate-400/20 bg-slate-500/10 text-slate-400' : item.status === 'live' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-sky-400/20 bg-sky-500/10 text-sky-300'}`}>
                      {isDiscontinued ? 'Discontinued' : item.status === 'live' ? 'Live' : 'Scheduled'}
                    </span>
                  </div>
                  <h4 className="mt-1 font-heading text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.schedule} • {enrolledCount} enrolled</p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Link
                    className="apex-button-secondary flex-1 justify-center px-3 py-2 text-sm sm:flex-none"
                    to={`batch/${item.id}`}
                  >
                    Workspace
                    <ChevronRight size={16} />
                  </Link>
                  <button
                    className="apex-button-secondary flex-1 justify-center px-3 py-2 text-sm text-slate-300 sm:flex-none"
                    disabled={isUpdating}
                    onClick={() => setBatchStatus(item, isDiscontinued ? 'scheduled' : 'discontinued')}
                    type="button"
                  >
                    {isUpdating ? <Loader2 className="animate-spin" size={16} /> : isDiscontinued ? <RotateCcw size={16} /> : <Archive size={16} />}
                    {isDiscontinued ? 'Restore batch' : 'Discontinue'}
                  </button>
                </div>
              </article>
            );
          })}
          {visibleBatches.length === 0 && (
            <p className="text-sm text-slate-400">{batchView === 'active' ? 'No active batches.' : 'No discontinued batches.'}</p>
          )}
        </div>
      </div>
    </section>
  );
}
