import { useEffect, useState } from 'react';
import { RequireAuth } from '@/app/components/RequireAuth';
import { useAuth } from '@/context/useAuth';
import { intelligenceService } from '@/services/intelligenceService';

export default function AdminIntelligenceAudits() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [endpointFilter, setEndpointFilter] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    setLoading(true);
    intelligenceService
      .getAuditLogs({ page, pageSize, endpoint: endpointFilter || undefined })
      .then((res) => {
        const data = res.data ?? res;
        setRows(data.rows || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page, pageSize, endpointFilter]);

  if (!user) return <div className="p-6">Please sign in.</div>;
  if (user.role !== 'ADMIN') return <div className="p-6">Admin only.</div>;

  return (
    <RequireAuth>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Intelligence Audit Logs</h1>

        <div className="flex items-center gap-2">
          <input value={endpointFilter} onChange={(e) => setEndpointFilter(e.target.value)} placeholder="Filter endpoint" className="input" />
          <button className="btn" onClick={() => setPage(1)}>Apply</button>
        </div>

        <div className="bg-card p-2 rounded">
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Admin</th>
                  <th className="text-left p-2">Endpoint</th>
                  <th className="text-left p-2">Target User</th>
                  <th className="text-left p-2">Env</th>
                  <th className="text-left p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.adminEmail || r.adminId}</td>
                    <td className="p-2">{r.endpoint}</td>
                    <td className="p-2">{r.targetUser || '-'}</td>
                    <td className="p-2">{r.env || '-'}</td>
                    <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="p-4">No audit logs found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>Showing {rows.length} of {total}</div>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <button className="btn" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>Next</button>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
