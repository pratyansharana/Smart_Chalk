import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '../../../components/common/Skeleton';

export function GradeVisualizerCard({ submissions, loading, error, className = '' }) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setChartReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  const graded = submissions.filter((submission) => typeof submission.grade === 'number');
  const latest = graded.at(-1);
  const chartData = graded.map((submission, index) => ({
    name: `A${index + 1}`,
    grade: submission.grade,
  }));

  if (loading) return <Skeleton className="h-64" />;

  return (
    <section className={`glass-card min-h-64 p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-400">Recent grades</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-white">{latest ? `${latest.grade}%` : 'No grades yet'}</h2>
        </div>
        <Trophy className="text-amber-400" size={28} />
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error.message}</p>}
      {!error && chartData.length === 0 && <p className="mt-5 text-sm text-slate-300">Graded submissions will appear here after your teacher reviews your work.</p>}
      {chartData.length > 0 && (
        <div className="mt-5 h-36">
          {chartReady && (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
                <Bar dataKey="grade" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </section>
  );
}
