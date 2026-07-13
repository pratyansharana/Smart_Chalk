import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { uploadFileResumable } from '../../../services/firebase/storageService';
import { createSubmissionDocument } from '../../../services/firebase/submissionsService';

export function WorksheetUploader({ assignment, studentId, submission }) {
  const [files, setFiles] = useState([]);
  const [uploadState, setUploadState] = useState(null); // { progress, status }
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleFileChange(event) {
    if (event.target.files) {
      const selected = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleUpload(e) {
    e.preventDefault();
    if (files.length === 0 || !studentId) return;

    setError('');
    setSuccess('');
    setUploadState({ progress: 0, status: 'Uploading...' });

    try {
      let uploadedUrls = [];
      const draftId = `${Date.now()}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `submissions/${assignment.id}/${studentId}/${file.name}`;
        
        const fileUrl = await uploadFileResumable(path, file, (progressVal) => {
          const fileContribution = progressVal / files.length;
          const currentBase = (i / files.length) * 100;
          setUploadState({
            progress: Math.round(currentBase + fileContribution),
            status: `Uploading file ${i + 1} of ${files.length} (${progressVal}%)...`
          });
        });

        uploadedUrls.push({
          fileURL: fileUrl,
          fileName: file.name
        });
      }

      setUploadState({ progress: 100, status: 'Saving...' });

      await createSubmissionDocument({
        assignmentId: assignment.id,
        studentId,
        submittedFileURL: uploadedUrls[0]?.fileURL || null,
        submittedFileName: uploadedUrls[0]?.fileName || null,
        submittedFiles: uploadedUrls,
        status: 'submitted',
        grade: null,
        feedback: null,
        gradedAt: null,
        gradedBy: null,
      });

      setSuccess('Uploaded successfully.');
      setFiles([]);
      setUploadState(null);
    } catch (uploadError) {
      setError(uploadError.message);
      setUploadState(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-950/50 p-4">
      {submission ? (
        <div className="flex items-start gap-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18} />
          <div className="w-full">
            <p className="font-bold">Submitted</p>
            {submission.submittedFiles && submission.submittedFiles.length > 0 ? (
              <div className="flex flex-col gap-1 mt-1 text-xs">
                {submission.submittedFiles.map((file, idx) => (
                  <a
                    key={idx}
                    className="text-amber-300 underline block font-mono truncate max-w-[240px]"
                    href={file.fileURL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {file.fileName || `File ${idx + 1}`}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 truncate max-w-[240px]">{submission.submittedFileName || 'Worksheet uploaded'}</p>
            )}
            {submission.feedback && <p className="mt-2 text-slate-300">Feedback: {submission.feedback}</p>}
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="grid gap-3">
          <div className="relative">
            {uploadState ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center flex flex-col items-center justify-center min-h-[90px] gap-2">
                <div className="w-full max-w-[150px] h-1.5 bg-navy-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">
                  {uploadState.status}
                </span>
              </div>
            ) : (
              <label className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-300 hover:border-amber-400/40">
                <UploadCloud className="text-amber-400" size={20} />
                <span>Select completed worksheet(s)</span>
                <input
                  accept=".pdf,image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  type="file"
                />
              </label>
            )}
          </div>

          {files.length > 0 && !uploadState && (
            <div className="grid gap-1 max-h-32 overflow-y-auto pr-1">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-lg text-[10px]">
                  <span className="truncate text-slate-300 font-mono flex-1">{file.name}</span>
                  <button
                    type="button"
                    className="text-red-400 hover:text-red-300 font-bold underline flex-shrink-0"
                    onClick={() => removeFile(idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="submit"
                className="apex-button-primary mt-2 py-1.5 px-3 text-[10px] font-bold w-full"
              >
                Upload {files.length} Solution(s)
              </button>
            </div>
          )}
        </form>
      )}
      {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
      {success && <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2 text-xs text-emerald-200">{success}</p>}
    </div>
  );
}
