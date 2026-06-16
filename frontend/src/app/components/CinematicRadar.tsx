import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useAdaptiveAI } from '../context/adaptiveAI';

type Props = {
  scores: Record<string, number>;
  size?: number;
};

function polarPointsForScores(subjects: string[], scores: Record<string, number>, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = Math.min(size, size) * 0.38;
  const N = subjects.length || 6;
  const points: { x: number; y: number; r: number; subject: string }[] = [];
  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    const subject = subjects[i] || `s${i}`;
    const score = Math.max(0, Math.min(100, Number(scores[subject] ?? 0)));
    const r = (score / 100) * maxR + maxR * 0.06;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    points.push({ x, y, r, subject });
  }
  return { points, cx, cy, maxR };
}

function pathFromPoints(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  return `${d} Z`;
}

export const CinematicRadar: React.FC<Props> = ({ scores = {}, size = 320 }) => {
  const subjects = useMemo(() => Object.keys(scores), [scores]);
  const { decision, lastUpdated } = useAdaptiveAI();
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    // fetch DecisionSnapshots for timeline morphing; non-blocking if fails
    fetch('/api/ai/decision/snapshots')
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data) => {
        if (!mounted) return;
        // expect data.snapshots array
        const list = Array.isArray(data) ? data : data?.snapshots || [];
        setSnapshots(list.slice(-10));
      })
      .catch(() => {
        // ignore failures
      });
    return () => { mounted = false; };
  }, [lastUpdated]);

  // Build timeline of score maps (align to current subjects)
  const timeline = useMemo(() => {
    const baseSubjects = subjects.length ? subjects : Object.keys(scores);
    const maps = snapshots.map((snap) => {
      try {
        const s = typeof snap.snapshot === 'string' ? JSON.parse(snap.snapshot) : snap.snapshot;
        // try to locate recommendations or scores
        const recs = s?.evaluated || s?.recommendations || s?.results || s?.items || [];
        // build simple subject->score map from recs by name matching subjects
        const map: Record<string, number> = {};
        baseSubjects.forEach((sub) => (map[sub] = 0));
        if (Array.isArray(recs)) {
          for (const r of recs.slice(0, baseSubjects.length)) {
            const name = r?.title || r?.name || r?.subject;
            // attempt to map to a known subject
            const key = baseSubjects.find((b) => name && b && b.toLowerCase().includes(String(name).toLowerCase().split(' ')[0]));
            if (key) map[key] = Math.round((r?.score ?? r?.confidence ?? 0) * 100) / 100;
          }
        }
        return map;
      } catch (e) {
        return baseSubjects.reduce((acc, s) => ((acc[s] = 0), acc), {} as Record<string, number>);
      }
    });
    // include current scores as last frame
    return [...maps, scores];
  }, [snapshots, subjects, scores]);

  // Auto-advance timeline
  useEffect(() => {
    if (timeline.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % timeline.length);
    }, 2800);
    return () => clearInterval(t);
  }, [timeline.length]);

  const frame = timeline[index] || scores;
  const { points, cx, cy, maxR } = polarPointsForScores(subjects.length ? subjects : Object.keys(frame), frame, size);
  const path = pathFromPoints(points);

  // compute centroid (for glow) weighted by radius
  const centroid = useMemo(() => {
    if (!points.length) return { x: cx, y: cy };
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x * p.r, y: acc.y + p.y * p.r, w: acc.w + p.r }), { x: 0, y: 0, w: 0 });
    if (sum.w === 0) return { x: cx, y: cy };
    return { x: sum.x / sum.w, y: sum.y / sum.w };
  }, [points, cx, cy]);

  const avgConfidence = useMemo(() => {
    const vals = Object.values(frame || {}).map((v) => Number(v || 0));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [frame]);

  return (
    <motion.div
      key={lastUpdated || 'static-radar'}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: decision ? 1.01 : 1 }}
      transition={{ duration: 0.6 }}
      style={{ width: size, height: size }}
      className={`cinematic-radar adaptive-radar ${decision ? 'adaptive-active' : ''}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="radar-svg">
        <defs>
          <linearGradient id="radarGrad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.64" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <filter id="softblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /></feMerge>
          </filter>
        </defs>

        {/* background rings with depth */}
        {[0.25, 0.5, 0.75, 1].map((rFrac, i) => (
          <circle key={`radar-ring-${rFrac}`} cx={cx} cy={cy} r={maxR * rFrac} fill="none" strokeOpacity={0.04 - i*0.005} stroke="#8b5cf6" strokeWidth={1} />
        ))}

        {/* confidence arc */}
        <circle
          cx={cx}
          cy={cy}
          r={maxR + 8}
          fill="none"
          strokeOpacity={0.12}
          stroke="url(#radarGrad)"
          strokeWidth={6}
          strokeDasharray={`${(avgConfidence / 100) * (2 * Math.PI * (maxR + 8))} ${(2 * Math.PI * (maxR + 8))}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* animated polygon */}
        <motion.path d={path} fill="url(#radarGrad)" fillOpacity={0.28} stroke="#7c3aed" strokeWidth={1.6} strokeOpacity={0.9} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />

        {/* node dots */}
        {points.map((p, i) => (
          <motion.g key={p.subject} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
            <motion.circle cx={p.x} cy={p.y} r={4 + (p.r / maxR) * 3} fill="#fff" fillOpacity={0.98} stroke="#7c3aed" strokeWidth={1.25} />
            <motion.circle cx={p.x} cy={p.y} r={8 + (p.r / maxR) * 8} fill="url(#glow)" opacity={0.45} filter="url(#softblur)" />
          </motion.g>
        ))}

        {/* moving glow centroid */}
        <motion.circle cx={centroid.x} cy={centroid.y} r={18} fill="#7c3aed" fillOpacity={0.12} transition={{ duration: 1.2 }} filter="url(#softblur)" style={{ mixBlendMode: 'screen' }} />

        <style>{`.radar-svg { filter: drop-shadow(0 8px 30px rgba(7,12,19,0.6)); }`}</style>

      </svg>
    </motion.div>
  );
};

export default CinematicRadar;
