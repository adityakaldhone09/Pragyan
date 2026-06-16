import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const METRICS = [
  { title: 'Learning Velocity', value: '1.2x' },
  { title: 'Adaptability', value: '78%' },
  { title: 'Analytical Growth', value: '65%' },
  { title: 'XP Progression', value: '1,420 XP' },
  { title: 'Focus Score', value: '83' },
  { title: 'Consistency', value: '72%' },
];

const MetricCard: React.FC<{ title: string; value: string; spark?: React.ReactNode }> = ({ title, value, spark }) => (
  <motion.div whileHover={{ y: -6, scale: 1.01 }} className="glass p-3 rounded-xl border border-white/6 shadow-[0_8px_30px_rgba(124,58,237,0.06)]" style={{ backdropFilter: 'blur(8px)' }}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">{value}</div>
      </div>
      <div className="w-24 h-10 flex items-center justify-end">{spark}</div>
    </div>
    <div className="absolute -inset-0.5 rounded-xl pointer-events-none opacity-30" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.14), rgba(6,182,212,0.08))', filter: 'blur(12px)' }} />
  </motion.div>
);

export default function LiveMetrics() {
  const [pulseMetric, setPulseMetric] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    function onStatus(e: any) {
      const msg = e?.detail?.message || null;
      setStatus(msg);
      setTimeout(() => setStatus(null), 4200);
      const idx = Math.floor(Math.random() * METRICS.length);
      setPulseMetric(idx);
      setTimeout(() => setPulseMetric(null), 1400);
    }
    function onInsight() {
      const idx = Math.floor(Math.random() * METRICS.length);
      setPulseMetric(idx);
      setTimeout(() => setPulseMetric(null), 1800);
    }

    window.addEventListener('ai:status', onStatus as EventListener);
    window.addEventListener('ai:insight', onInsight as EventListener);
    return () => {
      window.removeEventListener('ai:status', onStatus as EventListener);
      window.removeEventListener('ai:insight', onInsight as EventListener);
    };
  }, []);

  return (
    <div className="relative">
      {status && (
        <div className="absolute left-1/2 -translate-x-1/2 top-0 z-20">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/30 to-accent/20 text-xs text-white/90 backdrop-blur-sm">{status}</div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-4">
        {METRICS.map((m, i) => (
          <div key={m.title} className="col-span-2 relative">
            <MetricCard
              title={m.title}
              value={m.value}
              spark={<svg width="48" height="28" viewBox="0 0 48 28"><path d="M0 20 L12 12 L24 16 L36 8 L48 12" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            />
            {pulseMetric === i && (
              <motion.div animate={{ opacity: [0, 1, 0], scale: [1, 1.02, 1] }} transition={{ duration: 1.2 }} className="absolute inset-0 rounded-xl pointer-events-none border-2 border-white/6 shadow-[0_20px_40px_rgba(99,102,241,0.06)]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
