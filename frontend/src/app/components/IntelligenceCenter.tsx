import React from 'react';
import CinematicRadar from './CinematicRadar';
import DecisionHistory from './DecisionHistory';
import EcosystemHealth from './EcosystemHealth';
import { motion } from 'motion/react';

export default function IntelligenceCenter() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="col-span-4">
        <div className="glass p-4 rounded-xl hover:scale-[1.01] transition-transform duration-300" style={{ boxShadow: '0 10px 40px rgba(7,12,19,0.6)' }}>
          <h4 className="text-lg font-semibold">Morphing Radar</h4>
          <div className="mt-4 flex items-center justify-center">
            <CinematicRadar size={300} scores={{ 'Problem Solving': 80, 'Systems Design': 68, 'Data Literacy': 74, 'Communication': 60, 'Product Sense': 66 }} />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="col-span-5">
        <div className="glass p-4 rounded-xl hover:scale-[1.01] transition-transform duration-300" style={{ boxShadow: '0 10px 40px rgba(7,12,19,0.6)' }}>
          <h4 className="text-lg font-semibold">Adaptive Roadmap</h4>
          <div className="mt-3">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/6 to-transparent border border-primary/10">Milestone: Complete Core ML Module — 2d remaining</div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-accent/6 to-transparent border border-accent/10">Mutation: Prioritize 'Systems Design' in next cycle</div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/6 to-transparent border border-secondary/10">Progress: 42% across active modules</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="col-span-3">
        <div className="glass p-4 rounded-xl hover:scale-[1.01] transition-transform duration-300" style={{ boxShadow: '0 10px 40px rgba(7,12,19,0.6)' }}>
          <h4 className="text-lg font-semibold">AI Mentor</h4>
          <div className="mt-3">
            <div className="text-sm text-muted-foreground">Emotion</div>
            <div className="mt-2 text-2xl font-semibold">Calm — Encouraging</div>
            <div className="mt-3 text-sm">"You're making strong progress — focus on systems thinking to accelerate placements."</div>
            <div className="mt-4">
              <button type="button" className="px-3 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-white">Chat with Mentor</button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DecisionHistory />
        </div>
      </motion.div>
    </div>
  );
}
