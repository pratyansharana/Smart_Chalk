import { Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { useLeads } from '../../../hooks/useLeads';
import { updateLeadDocument } from '../../../services/firebase/leadsService';

const statuses = ['new', 'contacted', 'trial_scheduled', 'converted', 'lost'];

export function LeadsTable({ teacherId }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const { data: leads, loading, error } = useLeads(statusFilter);

  async function updateStatus(leadId, status) {
    setUpdatingId(leadId);
    try {
      await updateLeadDocument(leadId, { status, assignedTeacherId: teacherId || null });
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <section className="glass-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Enquiries</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-white">Leads table</h2>
        </div>
        <Mail className="text-amber-400" size={24} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={!statusFilter ? 'apex-button-primary' : 'apex-button-secondary'} onClick={() => setStatusFilter('')} type="button">all</button>
        {statuses.map((status) => (
          <button className={statusFilter === status ? 'apex-button-primary' : 'apex-button-secondary'} key={status} onClick={() => setStatusFilter(status)} type="button">
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
      {loading && <p className="mt-4 text-sm text-slate-300">Loading leads...</p>}
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error.message}</p>}
      {!loading && !error && leads.length === 0 && <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">No leads found.</p>}
      {leads.length > 0 && (
        <>
          <div className="mt-5 grid gap-3 2xl:hidden">
            {leads.map((lead) => (
              <article className="glass-card min-w-0 p-4" key={lead.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-white">{lead.studentName}</h3>
                    <p className="text-sm text-slate-400">{lead.gradeLevel || 'Year/class not provided'}</p>
                  </div>
                  {updatingId === lead.id && <Loader2 className="animate-spin text-amber-400" size={18} />}
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0"><dt className="text-xs font-bold uppercase text-slate-500">Parent</dt><dd className="mt-1 break-words text-slate-200">{lead.parentName}</dd><dd className="break-all text-slate-400">{lead.email || lead.phone}</dd></div>
                  <div className="min-w-0"><dt className="text-xs font-bold uppercase text-slate-500">Curriculum</dt><dd className="mt-1 break-words text-slate-200">{lead.curriculum || 'Not provided'}</dd></div>
                  <div className="min-w-0"><dt className="text-xs font-bold uppercase text-slate-500">Time zone</dt><dd className="mt-1 break-words text-slate-200">{lead.timeZone || 'Not provided'}</dd></div>
                  <div className="min-w-0"><dt className="text-xs font-bold uppercase text-slate-500">Subjects</dt><dd className="mt-1 break-words text-slate-200">{lead.subjectsInterested?.join(', ') || 'Not provided'}</dd></div>
                  <div className="min-w-0 sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-500">Availability</dt><dd className="mt-1 break-words text-slate-200">{lead.preferredSchedule || 'Not provided'}</dd></div>
                </dl>
                <label className="mt-4 grid gap-1 text-xs font-bold uppercase text-slate-500" htmlFor={`mobile-lead-${lead.id}`}>
                  Status
                  <select
                    className="apex-input text-sm normal-case"
                    disabled={updatingId === lead.id}
                    id={`mobile-lead-${lead.id}`}
                    onChange={(event) => updateStatus(lead.id, event.target.value)}
                    value={lead.status}
                  >
                    {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
          <div className="mt-5 hidden overflow-x-auto 2xl:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Parent</th>
                <th className="p-3">Curriculum / time zone</th>
                <th className="p-3">Subjects</th>
                <th className="p-3">Availability</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr className="border-t border-white/10" key={lead.id}>
                  <td className="p-3">
                    <p className="font-bold text-white">{lead.studentName}</p>
                    <p className="text-slate-400">{lead.gradeLevel || 'Year/class not provided'}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-white">{lead.parentName}</p>
                    <p className="text-slate-400">{lead.email || lead.phone}</p>
                  </td>
                  <td className="p-3 text-slate-300">
                    <p>{lead.curriculum || 'Not provided'}</p>
                    <p className="text-slate-400">{lead.timeZone || 'Time zone not provided'}</p>
                  </td>
                  <td className="break-words p-3 text-slate-300">{lead.subjectsInterested?.join(', ')}</td>
                  <td className="break-words p-3 text-slate-300">{lead.preferredSchedule || 'Not provided'}</td>
                  <td className="p-3">
                    <label className="sr-only" htmlFor={`lead-${lead.id}`}>Lead status</label>
                    <select
                      className="apex-input"
                      disabled={updatingId === lead.id}
                      id={`lead-${lead.id}`}
                      onChange={(event) => updateStatus(lead.id, event.target.value)}
                      value={lead.status}
                    >
                      {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                    </select>
                    {updatingId === lead.id && <Loader2 className="mt-2 animate-spin text-amber-400" size={16} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </section>
  );
}
