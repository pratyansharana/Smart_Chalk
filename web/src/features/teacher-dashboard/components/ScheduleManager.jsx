import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus, Loader2, Copy, Check, Radio, Ban, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import {
  createClassDocument,
  approveStudentRequest,
  rejectStudentRequest,
  toggleBatchLiveStatus,
} from '../../../services/firebase/classesService';

const batchSchema = z.object({
  title: z.string().min(3, 'Batch title is required.'),
  subject: z.string().min(2, 'Subject is required.'),
  meetingLink: z.string().url('Enter a valid meeting URL.'),
  schedule: z.string().min(3, 'Schedule is required (e.g., Mon & Wed 5 PM).'),
  nextSessionTime: z.string().min(1, 'Next session date/time is required.'),
  studentIdInput: z.string().optional(),
});

export function ScheduleManager({ teacherId, students, classes }) {
  const [copiedId, setCopiedId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: { title: '', subject: '', meetingLink: '', schedule: '', nextSessionTime: '', studentIdInput: '' },
  });

  const studentMap = new Map(students.map((s) => [s.uid || s.id, s]));

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

  function handleCopy(id) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleToggleLive(id, currentStatus) {
    const isLive = currentStatus === 'live';
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await toggleBatchLiveStatus(id, !isLive);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleApprove(classId, studentId) {
    const key = `${classId}-${studentId}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await approveStudentRequest(classId, studentId);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleReject(classId, studentId) {
    const key = `${classId}-${studentId}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await rejectStudentRequest(classId, studentId);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Class Batches</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-white">Batch manager</h2>
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
            const isLive = item.status === 'live';
            const pendingList = item.pendingStudentIds || [];
            return (
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-amber-400">{item.subject}</span>
                      {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 text-xs text-emerald-300">
                          Live now
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1 font-heading text-xl font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.schedule}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="apex-button-secondary py-1.5 px-3 text-xs"
                      onClick={() => handleCopy(item.id)}
                      type="button"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copiedId === item.id ? 'Copied ID' : 'Copy Batch ID'}
                    </button>

                    <button
                      className={`py-1.5 px-3 text-xs flex items-center gap-1.5 rounded-xl font-bold transition-all ${
                        isLive
                          ? 'bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                      disabled={actionLoading[item.id]}
                      onClick={() => handleToggleLive(item.id, item.status)}
                      type="button"
                    >
                      {actionLoading[item.id] ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isLive ? (
                        <Ban size={14} />
                      ) : (
                        <Radio size={14} />
                      )}
                      {isLive ? 'End Session' : 'Go Live'}
                    </button>
                  </div>
                </div>

                {/* Pending Enrollment Requests */}
                {pendingList.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      Pending Enrollment Requests ({pendingList.length})
                    </p>
                    <div className="grid gap-2">
                      {pendingList.map((studentId) => {
                        const student = studentMap.get(studentId);
                        const key = `${item.id}-${studentId}`;
                        return (
                          <div
                            className="flex items-center justify-between gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5"
                            key={studentId}
                          >
                            <span className="text-sm font-semibold text-slate-200">
                              {student?.displayName || student?.email || `Student (${studentId.slice(0, 6)})`}
                            </span>
                            <div className="flex gap-2">
                              <button
                                className="apex-button-primary py-1 px-2.5 text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                                disabled={actionLoading[key]}
                                onClick={() => handleApprove(item.id, studentId)}
                                type="button"
                              >
                                {actionLoading[key] ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                                Approve
                              </button>
                              <button
                                className="apex-button-secondary py-1 px-2.5 text-xs hover:bg-red-500/10 hover:text-red-300"
                                disabled={actionLoading[key]}
                                onClick={() => handleReject(item.id, studentId)}
                                type="button"
                              >
                                {actionLoading[key] ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
