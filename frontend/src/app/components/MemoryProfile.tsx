import React, { useEffect, useMemo, useState } from 'react';
import { assessmentService } from '../../services/assessmentService';
import '../../styles/results-premium.css';

function averageScoreFrom(entry: any) {
  try {
    const scores = entry?.analysis?.scores || entry?.summary?.scores || entry?.scores || {};
    const vals = Object.values(scores).flatMap((v: any) => {
      const n = Number(v || 0);
      return !Number.isNaN(n) ? [n] : [];
    });
    if (!vals.length) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  } catch {
    return 0;
  }
}

export const MemoryProfile: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        setLoading(true);
        const res = await assessmentService.getAssessmentHistory();
        if (!mounted) return;
        setHistory(Array.isArray(res) ? res.slice(0, 20) : []);
      } catch (e) {
        if (mounted) setHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const scoresSeries = useMemo(() => history.map((h) => averageScoreFrom(h)), [history]);
  const latest = scoresSeries[scoresSeries.length - 1] || 0;
  const previous = scoresSeries.length > 1 ? scoresSeries[scoresSeries.length - 2] : 0;
  const delta = latest - previous;

  const unlockedCareers = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      const sc = h?.analysis?.suggestedCareers || h?.summary?.suggestedCareers || h?.suggestedCareers || [];
      (sc || []).forEach((c: string) => set.add(c));
    });
    return Array.from(set).slice(0, 6);
  }, [history]);

  return (
    <div className="memory-profile glass p-4 rounded-xl mt-6">
      <h4 className="text-lg font-semibold">AI Memory & Growth</h4>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Latest composite</div>
          <div className="text-2xl font-bold">{latest}%</div>
          <div className={`text-sm ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>{delta >= 0 ? `+${delta}% since last` : `${delta}% since last`}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">History</div>
          <div style={{ height: 44 }}>
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 44 }}>
              <polyline
                fill="none"
                stroke="#7c3aed"
                strokeWidth="1.6"
                points={scoresSeries.map((v, i) => `${(i / Math.max(1, scoresSeries.length - 1)) * 100},${30 - (v / 100) * 28}`).join(' ')}
              />
            </svg>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Unlocked careers</div>
          <div className="flex gap-2 flex-wrap mt-2">{unlockedCareers.map((c: string) => <div key={c} className="pill muted">{c}</div>)}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium">Personality signals</div>
        <div className="flex gap-2 mt-2">
          <div className="pill">Analytical</div>
          <div className="pill muted">Reflective</div>
          <div className="pill">Growth-oriented</div>
        </div>
      </div>
    </div>
  );
};

export default MemoryProfile;
