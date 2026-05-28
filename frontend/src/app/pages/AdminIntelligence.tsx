import { useEffect, useState } from 'react';
import { RequireAuth } from '@/app/components/RequireAuth';
import { useAuth } from '@/context/useAuth';
import { intelligenceService } from '@/services/intelligenceService';

export default function AdminIntelligence() {
  const { user } = useAuth();
  const [payload, setPayload] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') return;

    setLoading(true);
    intelligenceService
      .getDebugPayload()
      .then((res) => setPayload(res.data ?? res))
      .catch((err) => setError(err?.message || 'Failed to fetch debug payload'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="p-8">Please sign in to access admin intelligence tools.</div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="p-8">Insufficient permissions — admin only.</div>
    );
  }

  return (
    <RequireAuth>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Intelligence Debug — Admin</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 bg-card p-4 rounded">
            <h2 className="text-lg font-medium mb-2">Snapshot / Inputs</h2>
            {loading && <div>Loading...</div>}
            {error && <div className="text-destructive">{error}</div>}
            {payload?.inputs ? (
              <div className="text-sm">
                <div>Readiness: <strong>{payload.inputs.readiness}</strong></div>
                <div>Streak: <strong>{payload.inputs.streak}</strong></div>
                <div>Avg Delta: <strong>{payload.inputs.avgDelta}</strong></div>
                <div>Weak Skills: <strong>{(payload.inputs.weakSkills || []).join(', ') || 'none'}</strong></div>
              </div>
            ) : (
              <div className="text-sm">No input snapshot available.</div>
            )}
          </div>

          <div className="bg-card p-4 rounded">
            <h2 className="text-lg font-medium mb-2">Placement Probability</h2>
            {payload?.derivedSignals?.placementProbability ? (
              <div>
                <div className="text-3xl font-bold">{payload.derivedSignals.placementProbability.probability}%</div>
                <div className="text-sm">Confidence: {payload.derivedSignals.placementProbability.confidence}</div>
              </div>
            ) : (
              <div>No placement probability</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 bg-card p-4 rounded">
            <h2 className="text-lg font-medium mb-2">Explainability / Top Factors</h2>
            <ul className="list-disc pl-5 text-sm">
              {payload?.explanations?.length ? (
                payload.explanations.map((e: string, i: number) => <li key={i}>{e}</li>)
              ) : (
                <li>No explanations provided</li>
              )}
            </ul>
          </div>

          <div className="bg-card p-4 rounded">
            <h2 className="text-lg font-medium mb-2">Config Used</h2>
            <div className="text-xs max-h-48 overflow-auto"><pre>{payload?.configUsed ? JSON.stringify(payload.configUsed, null, 2) : '—'}</pre></div>
          </div>
        </div>

        <div className="bg-card p-4 rounded">
          <h2 className="text-lg font-medium mb-2">Raw Payload (collapsible)</h2>
          <details>
            <summary className="cursor-pointer">Show raw JSON</summary>
            <pre className="mt-2 text-xs max-h-[60vh] overflow-auto">{payload ? JSON.stringify(payload, null, 2) : 'No payload'}</pre>
          </details>
        </div>
      </div>
    </RequireAuth>
  );
}
