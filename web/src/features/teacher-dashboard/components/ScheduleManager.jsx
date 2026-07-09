import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus, Loader2, GraduationCap, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import { createClassDocument } from '../../../services/firebase/classesService';

const batchSchema = z.object({
  title: z.string().min(3, 'Batch title is required.'),
  subject: z.string().min(2, 'Subject is required.'),
  meetingLink: z.string().url('Enter a valid meeting URL.'),
  schedule: z.string().min(3, 'Schedule is required (e.g., Mon & Wed 5 PM).'),
  nextSessionTime: z.string().min(1, 'Next session date/time is required.'),
  studentIdInput: z.string().optional(),
});

export function ScheduleManager({ teacherId, students, classes }) {
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
        <h3 className="font-heading text-lg font-bold text-white mb-4">Your Active Batches</h3>
        <div className="grid gap-4">
          {classes.map((item) => {
            const enrolledCount = item.studentIds?.length || 0;
            return (
              <article className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-amber-400/25 transition-all" key={item.id}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-amber-400">{item.subject}</span>
                    {item.status === 'live' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 text-xs text-emerald-300">
                        Live
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 font-heading text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.schedule} • {enrolledCount} enrolled</p>
                </div>

                <Link
                  className="apex-button-secondary py-2 px-3 text-xs flex items-center gap-1 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 hover:border-amber-500/20 text-amber-300"
                  to={`batch/${item.id}`}
                >
                  Workspace
                  <ChevronRight size={14} />
                </Link>
              </article>
            );
          })}
          {classes.length === 0 && (
            <p className="text-sm text-slate-400">No active batches created yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
