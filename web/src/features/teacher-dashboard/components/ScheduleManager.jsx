import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import { createClassDocument } from '../../../services/firebase/classesService';

const classSchema = z.object({
  title: z.string().min(3, 'Class title is required.'),
  subject: z.string().min(2, 'Subject is required.'),
  meetingLink: z.string().url('Enter a valid meeting URL.'),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  studentIds: z.array(z.string()).min(1, 'Select at least one student.'),
});

export function ScheduleManager({ teacherId, students, classes }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: { title: '', subject: '', meetingLink: '', startTime: '', endTime: '', studentIds: [] },
  });

  async function onSubmit(values) {
    await createClassDocument({
      ...values,
      teacherId,
      status: 'scheduled',
      recurrence: 'none',
      startTime: new Date(values.startTime),
      endTime: new Date(values.endTime),
    });
    reset();
  }

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Schedule</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-white">Class manager</h2>
        </div>
        <CalendarPlus className="text-amber-400" size={24} />
      </div>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <ReusableInput label="Class title" error={errors.title?.message} {...register('title')} />
        <ReusableInput label="Subject" error={errors.subject?.message} {...register('subject')} />
        <ReusableInput label="Meeting link" error={errors.meetingLink?.message} {...register('meetingLink')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ReusableInput label="Start time" type="datetime-local" error={errors.startTime?.message} {...register('startTime')} />
          <ReusableInput label="End time" type="datetime-local" error={errors.endTime?.message} {...register('endTime')} />
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Students
          <select className="apex-input min-h-28" multiple {...register('studentIds')}>
            {students.map((student) => <option key={student.uid || student.id} value={student.uid || student.id}>{student.displayName}</option>)}
          </select>
          {errors.studentIds && <span className="text-xs text-red-300">{errors.studentIds.message}</span>}
        </label>
        <button className="apex-button-primary" disabled={isSubmitting || !teacherId} type="submit">
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CalendarPlus size={18} />}
          Schedule class
        </button>
      </form>
      <div className="mt-5 grid gap-2">
        {classes.slice(0, 4).map((item) => (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm" key={item.id}>
            <p className="font-bold text-white">{item.title}</p>
            <p className="text-slate-400">{item.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
