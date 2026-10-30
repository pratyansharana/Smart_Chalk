import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import { firebaseReady } from '../../../lib/firebase';
import { createLeadDocument } from '../../../services/firebase/leadsService';

const leadSchema = z.object({
  parentName: z.string().min(2, 'Parent name is required.'),
  studentName: z.string().min(2, 'Student name is required.'),
  email: z.string().email('Enter a valid email.'),
  phone: z.string().min(7, 'Enter a valid phone number.'),
  curriculum: z.string().min(1, 'Select a curriculum or board.'),
  gradeLevel: z.string().min(1, 'Select a school year or class.'),
  timeZone: z.string().min(1, 'Select a time zone.'),
  preferredSchedule: z.string().max(120, 'Keep the preferred schedule under 120 characters.').optional(),
  subjectsInterested: z.string().min(2, 'Add at least one subject.'),
  message: z.string().max(500, 'Message must stay under 500 characters.').optional(),
});

export function EnquiryForm() {
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      parentName: '',
      studentName: '',
      email: '',
      phone: '',
      curriculum: '',
      gradeLevel: '',
      timeZone: '',
      preferredSchedule: '',
      subjectsInterested: '',
      message: '',
    },
  });

  async function onSubmit(values) {
    setFormStatus({ type: '', message: '' });
    try {
      if (!firebaseReady) {
        throw new Error('Firebase is not configured yet. Add .env values before submitting live enquiries.');
      }

      await createLeadDocument({
        ...values,
        subjectsInterested: values.subjectsInterested.split(',').map((subject) => subject.trim()).filter(Boolean),
        message: values.message || '',
      });
      reset();
      setFormStatus({ type: 'success', message: 'Enquiry received. We will follow up shortly.' });
    } catch (error) {
      setFormStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <form className="glass-card grid gap-4 p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Book a trial</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-white">Tell us about your learner.</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReusableInput label="Parent name" error={errors.parentName?.message} {...register('parentName')} />
        <ReusableInput label="Student name" error={errors.studentName?.message} {...register('studentName')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReusableInput label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <ReusableInput label="Phone" error={errors.phone?.message} {...register('phone')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Curriculum / board
          <select className="apex-input" aria-invalid={Boolean(errors.curriculum)} {...register('curriculum')}>
            <option value="">Select curriculum</option>
            {['UK National Curriculum', 'CBSE', 'ICSE', 'IB', 'Other / Not sure'].map((curriculum) => (
              <option key={curriculum} value={curriculum}>{curriculum}</option>
            ))}
          </select>
          {errors.curriculum && <span className="text-xs text-red-300">{errors.curriculum.message}</span>}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          School year / class
          <select className="apex-input" aria-invalid={Boolean(errors.gradeLevel)} {...register('gradeLevel')}>
            <option value="">Select year or class</option>
            {['Year 6 (UK)', 'Year 7 (UK)', 'Year 8 (UK)', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Other'].map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          {errors.gradeLevel && <span className="text-xs text-red-300">{errors.gradeLevel.message}</span>}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Time zone
          <select className="apex-input" aria-invalid={Boolean(errors.timeZone)} {...register('timeZone')}>
            <option value="">Select time zone</option>
            {['UK (GMT/BST)', 'UAE (GST)', 'India (IST)', 'Other / Not sure'].map((timeZone) => (
              <option key={timeZone} value={timeZone}>{timeZone}</option>
            ))}
          </select>
          {errors.timeZone && <span className="text-xs text-red-300">{errors.timeZone.message}</span>}
        </label>
        <ReusableInput
          label="Preferred days / times"
          placeholder="Weekday evenings, weekends..."
          error={errors.preferredSchedule?.message}
          {...register('preferredSchedule')}
        />
      </div>
      <ReusableInput
        label="Subjects interested"
        placeholder="Math, Science, English"
        error={errors.subjectsInterested?.message}
        {...register('subjectsInterested')}
      />
      <label className="grid gap-2 text-sm font-semibold text-slate-100">
        Learning goals or questions
        <textarea className="apex-input min-h-28 resize-y" placeholder="Topics the student wants help with, or questions for the tutor..." {...register('message')} />
        {errors.message && <span className="text-xs text-red-300">{errors.message.message}</span>}
      </label>
      {formStatus.message && (
        <p className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${formStatus.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
          {formStatus.type === 'success' && <CheckCircle2 size={16} />}
          {formStatus.message}
        </p>
      )}
      <button className="apex-button-primary" disabled={isSubmitting || !firebaseReady} type="submit">
        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        Submit enquiry
      </button>
    </form>
  );
}
