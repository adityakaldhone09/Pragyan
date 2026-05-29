import React from 'react';

export default function LevelUpModal({ open, onClose, previousLevel, newLevel, newTitle, xpGained }: { open: boolean; onClose: () => void; previousLevel?: number; newLevel?: number; newTitle?: string | null; xpGained?: number }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-card/90 p-6 text-center">
        <h2 className="text-2xl font-bold">🎉 LEVEL UP</h2>
        <p className="mt-3 text-sm text-muted-foreground">{previousLevel} → {newLevel}</p>
        <p className="mt-2 text-lg font-semibold">New Title: {newTitle || 'Learner'}</p>
        <p className="mt-2 text-sm text-muted-foreground">+{xpGained || 0} XP Earned</p>
        <div className="mt-6 flex justify-center"><button onClick={onClose} className="rounded-md bg-primary px-4 py-2 text-white">Continue</button></div>
      </div>
    </div>
  );
}
