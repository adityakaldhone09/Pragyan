import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

export default function DecisionPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<any>('/ai/decision/evaluate').catch(() => null);
        if (mounted) setData(res);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="glass p-3">Evaluating...</div>;
  if (!data) return <div className="glass p-3">No adaptive data available</div>;

  const tops = data.evaluated.slice(0, 5);

  async function sendFeedback(target: any, feedbackType: string) {
    try {
      await apiClient.post('/ai/memory/feedback', { target, feedbackType }).catch(() => null);
      // Immediately re-evaluate adaptive decisions and update UI
      const re = await apiClient.get<any>('/ai/decision/evaluate').catch(() => null);
      if (re && Array.isArray(re.evaluated)) {
        // trigger animation state
        setAnimating(true);
        setTimeout(() => setAnimating(false), 850);
        setData(re);
        // notify other components (AICompanion) of updated decision
        try {
          window.dispatchEvent(new CustomEvent('ai:decision:updated', { detail: re }));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className={`glass p-4 rounded-xl decision-panel ${animating ? 'animating' : ''}`}>
      <h4 className="text-lg font-semibold">Adaptive Decision Engine</h4>
      <div className="mt-3 space-y-3">
        {tops.map((t: any, i: number) => (
          <div key={t.career} className={`flex items-center justify-between rank-item rank-${i}`}>
            <div>
              <div className="font-medium">{t.career}</div>
              <div className="text-xs text-muted-foreground">{t.reasons?.slice(0,2).join(' • ')}</div>
            </div>
            <div style={{ minWidth: 160 }} className="flex items-center gap-2">
              <div className="text-sm font-semibold score-value">{Math.round((t.adaptiveScore || 0))}</div>
              <div className="flex gap-2">
                <button type="button" className="pill" onClick={() => void sendFeedback({ career: t.career }, 'helpful')}>Helpful</button>
                <button type="button" className="pill muted" onClick={() => void sendFeedback({ career: t.career }, 'not_interested')}>Not interested</button>
                <button type="button" className="pill muted" onClick={() => void sendFeedback({ career: t.career }, 'too_difficult')}>Too difficult</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
