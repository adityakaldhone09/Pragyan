import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import LiveReasoningPanel from './LiveReasoningPanel';
import AmbientBackground from './AmbientBackground';

type Props = { onComplete?: () => void; duration?: number };

const messages = [
  'Analyzing personality patterns...',
  'Evaluating behavioral indicators...',
  'Matching career intelligence...',
  'Generating adaptive roadmap...',
  'Calculating growth trajectory...',
];

export const AnalysisSequence: React.FC<Props> = ({ onComplete, duration = 3500 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const step = Math.max(1, Math.floor(duration / messages.length));
    const timers: Array<number> = [];

    messages.forEach((_, i) => {
      const t = window.setTimeout(() => {
        if (!mounted) return;
        setIndex(i);
      }, i * step);
      timers.push(t);
    });

    const finish = window.setTimeout(() => {
      if (mounted && onComplete) onComplete();
    }, duration + 150);
    timers.push(finish);

    return () => {
      mounted = false;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [onComplete, duration]);

  return (
    <div className="analysis-sequence min-h-[320px] flex items-center justify-center">
      <AmbientBackground />
      <LiveReasoningPanel />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="glass p-8 rounded-2xl text-center w-full max-w-2xl"
      >
        <div className="hologram-viewport relative inline-block mb-6">
          <div className="hologram-core" />
          <div className="hologram-pulse" />
          <div className="particle-layer" aria-hidden />
        </div>

        <motion.div
          key={messages[index]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="analysis-message text-lg font-medium"
        >
          {messages[index]}
        </motion.div>

        <div className="mt-4 text-xs text-muted-foreground">AI calibrating — this feels like magic ✨</div>
        <div className="mt-3">
          <div className="typing-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisSequence;
