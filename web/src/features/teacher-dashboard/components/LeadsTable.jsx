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
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Parent</th>
                <th className="p-3">Subjects</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr className="border-t border-white/10" key={lead.id}>
                  <td className="p-3">
                    <p className="font-bold text-white">{lead.studentName}</p>
                    <p className="text-slate-400">{lead.gradeLevel}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-white">{lead.parentName}</p>
                    <p className="text-slate-400">{lead.email || lead.phone}</p>
                  </td>
                  <td className="p-3 text-slate-300">{lead.subjectsInterested?.join(', ')}</td>
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
      )}
    </section>
  );
}
