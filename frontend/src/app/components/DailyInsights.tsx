import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

export default function DailyInsights() {
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<any>('/ai/decision/evaluate').catch(() => null);
        const cards: string[] = [];
        if (res && res.meta) {
          const v = res.meta.avgVelocity || 0;
          if (v > 6) cards.push('Learning velocity improved — keep the streak going');
          else if (v > 3) cards.push('Consistency improving — small wins add up');
        }

        const evaluated = res?.evaluated || [];
        if (evaluated && evaluated.length) {
          const top = evaluated[0];
          if (top && top.reasons && top.reasons.length) cards.push(`${top.reasons[0]} — leads to ${top.career}`);
        }

        if (!cards.length) cards.push('Daily insight: small consistent practice yields big returns');
        if (mounted) setInsights(cards.slice(0,3));
      } catch (e) {
        if (mounted) setInsights(['AI insights unavailable']);
      } finally {
        // noop
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="glass p-4 rounded-xl daily-insights">
      <h4 className="text-lg font-semibold">Daily AI Insights</h4>
      <div className="mt-3 space-y-2">
        {insights.map((s) => (
          <div key={s} className="p-2 rounded-md" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.06), rgba(6,182,212,0.03))' }}>{s}</div>
        ))}
      </div>
    </div>
  );
}
