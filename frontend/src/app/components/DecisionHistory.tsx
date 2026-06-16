import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../services/apiClient';

function sparklinePath(values: number[], w = 120, h = 36) {
  if (!values.length) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  return values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

const DEMO_SNAPSHOTS = Array.from({ length: 8 }).map((_, i) => {
  const now = Date.now();
  return {
    id: `demo-${i}`,
    topItems: [
      'AI Engineer',
      'Data Scientist',
      'ML Researcher',
      'Product Manager',
      'UX Designer',
    ].slice(0, 3 + (i % 3)),
    snapshot: { skills: { problemSolving: 80 + i, technical: 70 + i } },
    createdAt: new Date(now - (7 - i) * 24 * 60 * 60 * 1000).toISOString(),
  };
});

export default function DecisionHistory() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await apiClient.get<any>('/ai/decision/snapshots?limit=12').catch(() => null);
        if (mounted) {
          if (res && Array.isArray(res)) setList(res);
          else setList(DEMO_SNAPSHOTS);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const topCandidates = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const s of list) {
      const tops: string[] = s.topItems || [];
      tops.slice(0, 5).forEach((t) => {
        freq[t] = (freq[t] || 0) + 1;
      });
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map((x) => x[0]);
  }, [list]);

  const drift = useMemo(() => {
    if (!list.length) return {} as Record<string, number[]>;
    const snapshots = list.slice().reverse();
    const maxRank = 8;
    const map: Record<string, number[]> = {};
    const allKeys = new Set<string>(topCandidates);
    snapshots.forEach((s) => {
      const tops: string[] = s.topItems || [];
      allKeys.forEach((k) => {
        if (!map[k]) map[k] = [];
        const idx = tops.findIndex((t) => t === k);
        map[k].push(idx === -1 ? maxRank : idx + 1);
      });
    });
    return map;
  }, [list, topCandidates]);

  if (loading) return <div className="glass p-3">Loading history...</div>;
  if (!list || !list.length) return <div className="glass p-3">No snapshots yet</div>;

  return (
    <div className="glass p-3 rounded-xl decision-history">
      <h4 className="text-lg font-semibold">Decision History</h4>
      <div className="mt-3 space-y-3 max-h-72 overflow-auto">
        <div className="grid grid-cols-1 gap-2">
          {topCandidates.map((key) => {
            const values = drift[key] || [];
            const latest = values.length ? values[values.length - 1] : undefined;
            const prev = values.length > 1 ? values[values.length - 2] : undefined;
            const improved = prev && latest ? prev - latest : 0;
            const path = sparklinePath(values, 140, 36);
            return (
              <div key={key} className="flex items-center justify-between p-2 rounded-md" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.03), rgba(6,182,212,0.02))' }}>
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium">{key}</div>
                  <div className="text-xs text-muted-foreground">Rank {latest ?? '—'}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <svg width={150} height={40} viewBox="0 0 150 40">
                    <path d={path} fill="none" stroke="#7c3aed" strokeWidth={2} strokeOpacity={0.9} strokeLinecap="round" strokeLinejoin="round" />
                    {values.length ? (
                      <circle cx={(values.length - 1) / Math.max(1, values.length - 1) * 140} cy={20} r={4} fill="#fff" stroke="#7c3aed" strokeWidth={1.25} />
                    ) : null}
                  </svg>
                  <div className={`text-sm font-semibold ${improved > 0 ? 'text-emerald-400' : improved < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>{improved > 0 ? `+${improved}` : improved < 0 ? `${improved}` : '—'}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">Showing drift for frequently recurring top recommendations.</div>
      </div>
    </div>
  );
}
