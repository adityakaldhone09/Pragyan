import React, { Suspense, lazy } from 'react';
import { AdaptiveAIProvider, useAdaptiveAI } from '../context/adaptiveAI';
import NeuralBackground from '../components/NeuralBackground';
import FloatingParticles from '../components/FloatingParticles';
const NeuralNeonScene = lazy(() => import('../components/NeuralNeonScene'));
import HeroAI from '../components/HeroAI';
import LiveMetrics from '../components/LiveMetrics';
import IntelligenceCenter from '../components/IntelligenceCenter';
import EvolutionTimeline from '../components/EvolutionTimeline';
import DriftVisualization from '../components/DriftVisualization';

const ResultsCanvas: React.FC = () => {
  const adaptiveAI = useAdaptiveAI();
  const decision = adaptiveAI?.decision ?? null;
  const confidence = Math.max(0, Math.min(1, Number(decision?.confidence ?? 0.72)));

  return (
    <div className="results-premium relative overflow-hidden min-h-[80vh]">
      <NeuralBackground />
      <FloatingParticles count={36} />
      <Suspense fallback={null}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <NeuralNeonScene confidence={confidence} />
        </div>
      </Suspense>
      <div className="p-6 space-y-6 relative z-10">
      {/* HERO */}
      <div>
        <HeroAI />
      </div>

      {/* LIVE METRICS */}
      <div>
        <LiveMetrics />
      </div>

      {/* INTELLIGENCE CENTER */}
      <div>
        <IntelligenceCenter />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <EvolutionTimeline />
        </div>
        <div className="col-span-4">
          <DriftVisualization />
        </div>
      </div>
      </div>
    </div>
  );
};

export const ResultsPremium: React.FC = () => (
  <AdaptiveAIProvider>
    <ResultsCanvas />
  </AdaptiveAIProvider>
);

export default ResultsPremium;
