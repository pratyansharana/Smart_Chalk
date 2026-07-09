import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { createSubmissionDocument } from '../../../services/firebase/submissionsService';

export function WorksheetUploader({ assignment, studentId, submission }) {
  const { upload, loading, progress } = useFileUpload();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file || !studentId) return;

    setError('');
    setSuccess('');
    try {
      const path = `submissions/${assignment.id}/${studentId}/${file.name}`;
      const submittedFileURL = await upload(path, file);
      await createSubmissionDocument({
        assignmentId: assignment.id,
        studentId,
        submittedFileURL,
        submittedFileName: file.name,
        status: 'submitted',
        grade: null,
        feedback: null,
        gradedAt: null,
        gradedBy: null,
      });
      setSuccess('Uploaded successfully.');
      event.target.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-950/50 p-4">
      {submission ? (
        <div className="flex items-start gap-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18} />
          <div>
            <p className="font-bold">Submitted</p>
            <p className="text-slate-400">{submission.submittedFileName || 'Worksheet uploaded'}</p>
            {submission.feedback && <p className="mt-2 text-slate-300">Feedback: {submission.feedback}</p>}
          </div>
        </div>
      ) : (
        <label className="grid cursor-pointer place-items-center gap-3 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-300 hover:border-amber-400/40">
          {loading ? <Loader2 className="animate-spin text-amber-400" size={24} /> : <UploadCloud className="text-amber-400" size={24} />}
          <span>{loading ? `Uploading ${progress}%` : 'Upload completed worksheet'}</span>
          <input accept=".pdf,image/*" className="sr-only" disabled={loading} onChange={handleFileChange} type="file" />
        </label>
      )}
      {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
      {success && <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2 text-xs text-emerald-200">{success}</p>}
    </div>
  );
}
