import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAdaptiveAI } from '../context/adaptiveAI';
import CinematicRadar from './CinematicRadar';
import AdaptiveCore from './AdaptiveCore';

export default function HeroAI() {
  const { decision } = useAdaptiveAI();
  const top = decision?.recommendations?.[0] || { title: 'AI Engineer', confidence: 0.92 };
  const [status, setStatus] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    function onStatus(e: any) {
      const msg = e?.detail?.message || e?.detail || 'Processing…';
      setStatus(String(msg));
      // auto-clear after 4s
      setTimeout(() => setStatus(null), 4200);
    }
    function onInsight(e: any) {
      const text = e?.detail?.text || e?.detail || null;
      if (text) {
        setInsight(String(text));
        setTimeout(() => setInsight(null), 6000);
      }
    }

    window.addEventListener('ai:status', onStatus as EventListener);
    window.addEventListener('ai:insight', onInsight as EventListener);
    return () => {
      window.removeEventListener('ai:status', onStatus as EventListener);
      window.removeEventListener('ai:insight', onInsight as EventListener);
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="glass p-6 rounded-2xl relative">
      <div className="grid grid-cols-12 gap-6 items-center">
        {/* Cinematic status overlay */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: status ? 1 : 0, y: status ? 0 : -8 }}
          transition={{ duration: 0.6 }}
          className="absolute left-1/2 top-4 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/30 to-accent/20 text-sm text-white/90 backdrop-blur-md shadow-xl">
            {status}
          </div>
        </motion.div>

        {/* Insight banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: insight ? 1 : 0, y: insight ? 0 : 8 }}
          transition={{ duration: 0.7 }}
          className="absolute right-6 top-6 z-30 pointer-events-none max-w-xl"
        >
          {insight && (
            <div className="glass p-3 rounded-lg text-sm text-white/95 shadow-[0_20px_50px_rgba(99,102,241,0.06)]">
              <div className="text-xs text-muted-foreground">Insight</div>
              <div className="font-semibold">{insight}</div>
            </div>
          )}
        </motion.div>
        <div className="col-span-5 flex items-center justify-center relative">
          <div className="relative z-10">
            <CinematicRadar scores={{
              [top.title || 'Top']: Math.round((top.confidence || 0.9) * 100),
              'Learning': 72,
              'Adaptability': 68,
              'Analysis': 80,
              'Creativity': 62
            }} size={340} />
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <AdaptiveCore size={260} confidence={top.confidence || 0.9} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-44 h-44 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-2xl opacity-80" />
          </div>
        </div>

        <div className="col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Top Career Match</div>
              <h2 className="text-3xl font-bold">{top.title || 'AI Engineer'}</h2>
              <div className="mt-2 text-sm text-muted-foreground max-w-xl">{decision?.summary || 'Adaptive AI reasoning and contextual suitability for your profile. The system fused assessment signals with historical snapshots to recommend this path.'}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Adaptive Confidence</div>
              <div className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">{Math.round((top.confidence || 0.9) * 100)}%</div>
              <div className="mt-2 text-xs text-muted-foreground">Real-time, evolving with each snapshot</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/6 to-transparent border border-primary/20"> 
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="font-semibold">Adaptive — Active</div>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-accent/6 to-transparent border border-accent/20"> 
              <div className="text-xs text-muted-foreground">Confidence Band</div>
              <div className="font-semibold">High</div>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/6 to-transparent border border-secondary/20"> 
              <div className="text-xs text-muted-foreground">Last Update</div>
              <div className="font-semibold">{decision?.updatedAt ? new Date(decision.updatedAt).toLocaleString() : 'Just now'}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-white font-semibold">Explore Roadmap</button>
            <button type="button" className="px-4 py-2 rounded-lg border border-primary/20 text-primary">Open Adaptive Log</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
