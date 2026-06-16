import React, { useEffect, useReducer } from 'react';
import { motion } from 'motion/react';
import '../../styles/results-premium.css';

type Props = { visible?: boolean; speed?: number };

const streaming = [
  'Analyzing behavioral patterns...',
  'Detecting analytical tendencies...',
  'Matching cognitive strengths...',
  'Comparing career pathways...',
  'Calculating roadmap compatibility...',
  'Generating adaptive intelligence...',
];

type ReasoningState = {
  lineIndex: number;
  text: string;
  cursorOn: boolean;
};

type ReasoningAction =
  | { type: 'set_text'; text: string }
  | { type: 'next_line' }
  | { type: 'toggle_cursor' };

function reasoningReducer(state: ReasoningState, action: ReasoningAction): ReasoningState {
  switch (action.type) {
    case 'set_text':
      return { ...state, text: action.text };
    case 'next_line':
      return { lineIndex: (state.lineIndex + 1) % streaming.length, text: '' };
    case 'toggle_cursor':
      return { ...state, cursorOn: !state.cursorOn };
    default:
      return state;
  }
}

export const LiveReasoningPanel: React.FC<Props> = ({ visible = true, speed = 36 }) => {
  const [{ lineIndex, text, cursorOn }, dispatch] = useReducer(reasoningReducer, {
    lineIndex: 0,
    text: '',
    cursorOn: true,
  });

  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    let charTimer: number | undefined;
    let switchTimer: number | undefined;

    const typeLine = (idx: number) => {
      const line = streaming[idx];
      let i = 0;
      dispatch({ type: 'set_text', text: '' });

      const tick = () => {
        if (!mounted) return;
        if (i <= line.length) {
          dispatch({ type: 'set_text', text: line.slice(0, i) });
          i += 1;
          charTimer = window.setTimeout(tick, speed);
        } else {
          switchTimer = window.setTimeout(() => dispatch({ type: 'next_line' }), 700 + Math.random() * 700);
        }
      };

      tick();
    };

    typeLine(lineIndex);

    const blink = window.setInterval(() => dispatch({ type: 'toggle_cursor' }), 450);

    return () => {
      mounted = false;
      if (charTimer) clearTimeout(charTimer);
      if (switchTimer) clearTimeout(switchTimer);
      clearInterval(blink);
    };
  }, [lineIndex, visible, speed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: 0.4 }}
      className="live-reasoning-panel glass p-4 rounded-xl"
      style={{ width: 360, maxWidth: '90vw', position: 'relative' }}
    >
      <div className="reasoning-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div className="status-dot" style={{ width: 10, height: 10, borderRadius: 20, background: 'linear-gradient(90deg,#06b6d4,#7c3aed)' }} />
        <div style={{ fontSize: 12, fontWeight: 700 }}>AI Reasoning</div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>live</div>
      </div>

      <div className="reasoning-body" style={{ minHeight: 38, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>
        <span className="reasoning-text">{text}</span>
        <span className="cursor" style={{ display: 'inline-block', width: 8, marginLeft: 6, opacity: cursorOn ? 1 : 0.15, background: 'linear-gradient(90deg,#06b6d4,#7c3aed)', height: 14 }} />
      </div>
    </motion.div>
  );
};

export default LiveReasoningPanel;
