import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'motion/react';

type Props = { size?: number; confidence?: number };

export default function AdaptiveCore({ size = 220, confidence = 0.78 }: Props) {
  const [started, setStarted] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // startup cinematic sequence
    const seq = async () => {
      await controls.start({ opacity: [0, 1], scale: [0.96, 1], transition: { duration: 0.6 } });
      setStarted(true);
      // slow breathing pulse
      controls.start({ '--pulse': [0.9, 1.06, 0.96], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } } as any);
    };
    seq();
  }, [controls]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18; // -9..9
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 18;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const ringStroke = 'url(#ringGrad)';

  return (
    <motion.div ref={containerRef} animate={controls} style={{ ['--pulse' as any]: 1 }} className="adaptive-core pointer-events-none relative" aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="orbGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.06" />
          </radialGradient>
          <linearGradient id="ringGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="60%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge><feMergeNode in="b" /></feMerge>
          </filter>
        </defs>

        {/* faint energy field */}
        <g style={{ transformOrigin: '50% 50%' }}>
          <motion.circle cx={size / 2} cy={size / 2} r={size * 0.45} fill="none" stroke={ringStroke} strokeWidth={2} strokeOpacity={0.06} />
          <motion.circle cx={size / 2} cy={size / 2} r={size * 0.36} fill="none" stroke={ringStroke} strokeWidth={1.5} strokeOpacity={0.08} />
        </g>

        {/* rotating rings */}
        <motion.g animate={{ rotate: started ? 360 : 0 }} transition={{ repeat: Infinity, duration: 28, ease: 'linear' }} style={{ transformOrigin: '50% 50%' }}>
          <circle cx={size / 2} cy={size / 2} r={size * 0.22} fill="none" stroke={ringStroke} strokeWidth={1.6} strokeOpacity={0.9} strokeDasharray="6 8" />
        </motion.g>

        <motion.g animate={{ rotate: started ? -360 : 0 }} transition={{ repeat: Infinity, duration: 42, ease: 'linear' }} style={{ transformOrigin: '50% 50%' }}>
          <circle cx={size / 2} cy={size / 2} r={size * 0.12} fill="none" stroke={ringStroke} strokeWidth={1.2} strokeOpacity={0.75} strokeDasharray="2 10" />
        </motion.g>

        {/* core orb */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.08}
          fill="url(#orbGrad)"
          style={{ filter: 'url(#glowBlur)', transform: 'translate(var(--mx,0), var(--my,0))' }}
          animate={{ scale: ['calc(var(--pulse) * 0.9)', 'calc(var(--pulse) * 1.02)'] } as any}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* confidence wave */}
        <motion.circle cx={size / 2} cy={size / 2} r={size * 0.14} fill="none" stroke="#06b6d4" strokeWidth={2} strokeOpacity={0.12} strokeDasharray={`${(confidence * 100) * 2} 400`} strokeLinecap="round" style={{ mixBlendMode: 'screen' }} animate={{ rotate: started ? 360 : 0 }} transition={{ repeat: Infinity, duration: 18, ease: 'linear' }} />
      </svg>

      <style>{`
        .adaptive-core { width: ${size}px; height: ${size}px; display:block }
        .adaptive-core svg { display:block }
      `}</style>
    </motion.div>
  );
}
