import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { createAssignmentDocument } from '../../../services/firebase/assignmentsService';

const assignmentSchema = z.object({
  title: z.string().min(3, 'Assignment title is required.'),
  description: z.string().min(5, 'Description is required.'),
  subject: z.string().min(2, 'Subject is required.'),
  classId: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required.'),
  maxScore: z.coerce.number().min(1, 'Max score must be positive.'),
  assignedStudentIds: z.array(z.string()).min(1, 'Select at least one student.'),
});

export function AssignmentCreator({ teacherId, students, classes }) {
  const [worksheetFile, setWorksheetFile] = useState(null);
  const { upload, loading: uploading, progress } = useFileUpload();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      classId: '',
      dueDate: '',
      maxScore: 100,
      assignedStudentIds: [],
    },
  });

  async function onSubmit(values) {
    let worksheetFileURL = '';
    let worksheetFileName = '';
    const draftId = `${Date.now()}`;
    if (worksheetFile) {
      worksheetFileURL = await upload(`worksheets/${draftId}/${worksheetFile.name}`, worksheetFile);
      worksheetFileName = worksheetFile.name;
    }

    await createAssignmentDocument({
      ...values,
      teacherId,
      classId: values.classId || null,
      dueDate: new Date(values.dueDate),
      worksheetFileURL,
      worksheetFileName,
    });
    setWorksheetFile(null);
    reset();
  }

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Assignments</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-white">Assignment creator</h2>
        </div>
        <ClipboardList className="text-amber-400" size={24} />
      </div>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <ReusableInput label="Title" error={errors.title?.message} {...register('title')} />
        <ReusableInput label="Subject" error={errors.subject?.message} {...register('subject')} />
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Description
          <textarea className="apex-input min-h-24 resize-y" {...register('description')} />
          {errors.description && <span className="text-xs text-red-300">{errors.description.message}</span>}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <ReusableInput label="Due date" type="datetime-local" error={errors.dueDate?.message} {...register('dueDate')} />
          <ReusableInput label="Max score" type="number" error={errors.maxScore?.message} {...register('maxScore')} />
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Class
          <select className="apex-input" {...register('classId')}>
            <option value="">No class link</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Students
          <select className="apex-input min-h-28" multiple {...register('assignedStudentIds')}>
            {students.map((student) => <option key={student.uid || student.id} value={student.uid || student.id}>{student.displayName}</option>)}
          </select>
          {errors.assignedStudentIds && <span className="text-xs text-red-300">{errors.assignedStudentIds.message}</span>}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-100">
          Worksheet
          <input className="apex-input" onChange={(event) => setWorksheetFile(event.target.files?.[0] || null)} type="file" />
          {uploading && <span className="text-xs text-amber-300">Uploading {progress}%</span>}
        </label>
        <button className="apex-button-primary" disabled={isSubmitting || uploading || !teacherId} type="submit">
          {isSubmitting || uploading ? <Loader2 className="animate-spin" size={18} /> : <ClipboardList size={18} />}
          Create assignment
        </button>
      </form>
    </section>
  );
}
