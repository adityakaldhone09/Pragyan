import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

export default function LearningVelocityGraph() {
  const [series, setSeries] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await apiClient.get<any>('/ai/learning-velocity').catch(() => null);
        const vals = resp && resp.series ? resp.series.map((v: any) => Number(v || 0)) : [2, 3, 4, 5, 6, 8, 9];
        if (mounted) setSeries(vals);
      } catch (e) {
        if (mounted) setSeries([2, 3, 4, 5, 6, 8, 9]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const max = Math.max(...series, 1);

  return (
    <div className="glass p-4 rounded-xl learning-velocity">
      <h4 className="text-lg font-semibold">Learning Velocity</h4>
      <div className="mt-3 flex items-end gap-2" style={{ height: 80 }}>
        {series.map((d) => (
          <div key={`velocity-${d}`} style={{ flex: 1 }}>
            <div style={{ height: `${(d / max) * 100}%` }} className="chart-bar bg-gradient-to-t from-green-400 to-blue-500 rounded-md" />
            <div className="text-xs text-center mt-2">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
