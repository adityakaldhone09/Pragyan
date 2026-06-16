import React from 'react';
import { motion } from 'motion/react';

type Cell = { label: string; value: number };

type Props = { data: Cell[]; columns?: number };

export const SkillHeatmap: React.FC<Props> = ({ data = [], columns = 4 }) => {
  return (
    <div className="heatmap-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {data.map((cell) => {
        const intensity = Math.max(0, Math.min(1, cell.value / 100));
        const bg = `linear-gradient(135deg, rgba(124,58,237,${0.15 + 0.6 * intensity}), rgba(6,182,212,${0.08 + 0.4 * intensity}))`;
        return (
          <motion.div key={cell.label} className="heatmap-cell" style={{ padding: 12, borderRadius: 10, background: bg }} whileHover={{ scale: 1.02 }}>
            <div className="heatmap-label" style={{ fontSize: 12, color: 'white', opacity: 0.95 }}>{cell.label}</div>
            <div className="heatmap-value" style={{ fontSize: 14, fontWeight: 700 }}>{cell.value}%</div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SkillHeatmap;
