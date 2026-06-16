import React from 'react';

export default function EvolutionCharts({ series }: { series?: number[] }) {
  const data = series && series.length ? series : [20, 30, 45, 60, 68, 75, 82];
  const max = Math.max(...data, 1);

  return (
    <div className="glass p-4 rounded-xl evolution-charts">
      <h4 className="text-lg font-semibold">Evolution Charts</h4>
      <div className="mt-3 flex items-end gap-2" style={{ height: 80 }}>
        {data.map((d) => (
          <div key={`evolution-${d}`} style={{ flex: 1 }}>
            <div style={{ height: `${(d / max) * 100}%` }} className="chart-bar bg-gradient-to-t from-purple-600 to-cyan-400 rounded-md" />
            <div className="text-xs text-center mt-2">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
