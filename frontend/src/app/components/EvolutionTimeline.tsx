import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useAdaptiveAI } from '../context/adaptiveAI';

type TimelineEvent = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  type?: string;
};

export default function EvolutionTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { decision } = useAdaptiveAI();

  useEffect(() => {
    if (!decision) return;

    const note = `AI adapted recommendations — top: ${((decision.evaluated || [])[0] || {}).career || '—'}`;
    setEvents((prev) => [
      { id: `snap-${Date.now()}`, title: 'AI Adapted', description: note, date: new Date().toISOString(), type: 'adaptive' },
      ...prev,
    ].slice(0, 8));
  }, [decision]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [history, memory] = await Promise.allSettled([
          apiClient.get<any>('/assessment/history'),
          apiClient.get<any>('/ai/memory'),
        ]);

        const collected: TimelineEvent[] = [];

        if ((history as PromiseFulfilledResult<any>).status === 'fulfilled') {
          const h = (history as PromiseFulfilledResult<any>).value || [];
          (h as any[]).slice(0, 6).forEach((s: any) => {
            collected.push({ id: `a-${s.id}`, title: 'Assessment', description: s.analysis?.summary?.suggestedCareers?.join(', '), date: s.completedAt, type: 'assessment' });
          });
        }

        if ((memory as PromiseFulfilledResult<any>).status === 'fulfilled') {
          const m = (memory as PromiseFulfilledResult<any>).value;
          if (m && m.events) {
            m.events.slice(-6).forEach((e: any, i: number) => collected.push({ id: `m-${i}`, title: e.title || 'AI update', description: e.note || e.summary, date: e.at, type: 'memory' }));
          } else if (m && m.summary) {
            collected.push({ id: 'm-profile', title: 'Memory snapshot', description: m.summary?.suggestedCareers?.join(', '), date: m.updatedAt, type: 'memory' });
          }
        }

        if (!collected.length) {
          collected.push({ id: 's-1', title: 'Welcome', description: 'AI companion activated', date: new Date().toISOString(), type: 'system' });
        }

        if (mounted) setEvents(collected.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
      } catch {
        if (mounted) setEvents([{ id: 'err', title: 'Data unavailable', description: 'Unable to fetch evolution timeline' }]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="glass p-4">Loading evolution timeline...</div>;

  return (
    <div className="glass p-4 rounded-xl evolution-timeline">
      <h4 className="text-lg font-semibold">AI Evolution Timeline</h4>
      <div className="timeline-list mt-4">
        {events.map((ev) => (
          <div key={ev.id} className={`timeline-item ${ev.type || ''}`}>
            <div className="timeline-dot" />
            <div className="timeline-body">
              <div className="timeline-title">{ev.title}</div>
              <div className="timeline-desc">{ev.description}</div>
              {ev.date && <div className="timeline-date">{new Date(ev.date).toLocaleString()}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
