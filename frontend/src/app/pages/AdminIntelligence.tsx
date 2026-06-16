import { useEffect, useReducer } from 'react';
import { RequireAuth } from '@/app/components/RequireAuth';
import { useAuth } from '@/context/useAuth';
import { intelligenceService } from '@/services/intelligenceService';

type AIHealthSnapshot = Awaited<ReturnType<typeof intelligenceService.getAiHealth>>;

type AdminState = {
  payload: any | null;
  aiHealth: AIHealthSnapshot | null;
  loading: boolean;
  healthLoading: boolean;
  error: string | null;
  healthError: string | null;
};

type AdminAction =
  | { type: 'debug_start' }
  | { type: 'health_start' }
  | { type: 'debug_success'; payload: any }
  | { type: 'debug_error'; error: string }
  | { type: 'health_success'; aiHealth: AIHealthSnapshot }
  | { type: 'health_error'; error: string };

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'debug_start':
      return { ...state, loading: true, error: null };
    case 'health_start':
      return { ...state, healthLoading: true, healthError: null };
    case 'debug_success':
      return { ...state, payload: action.payload, loading: false };
    case 'debug_error':
      return { ...state, error: action.error, loading: false };
    case 'health_success':
      return { ...state, aiHealth: action.aiHealth, healthLoading: false };
    case 'health_error':
      return { ...state, healthError: action.error, healthLoading: false };
    default:
      return state;
  }
}

export default function AdminIntelligence() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(adminReducer, {
    payload: null,
    aiHealth: null,
    loading: false,
    healthLoading: false,
    error: null,
    healthError: null,
  });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    dispatch({ type: 'debug_start' });
    dispatch({ type: 'health_start' });

    intelligenceService
      .getDebugPayload()
      .then((res) => dispatch({ type: 'debug_success', payload: res.data ?? res }))
      .catch((err) => dispatch({ type: 'debug_error', error: err?.message || 'Failed to fetch debug payload' }));

    intelligenceService
      .getAiHealth()
      .then((res) => dispatch({ type: 'health_success', aiHealth: res.data ?? res }))
      .catch((err) => dispatch({ type: 'health_error', error: err?.message || 'Failed to fetch AI health' }));
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

  const { payload, aiHealth, loading, healthLoading, error, healthError } = state;

  return (
    <RequireAuth>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Intelligence Debug — Admin</h1>

        <div className="bg-card p-4 rounded">
          <h2 className="text-lg font-medium mb-3">AI Status</h2>
          {healthLoading && <div>Checking providers...</div>}
          {healthError && <div className="text-destructive">{healthError}</div>}
          {aiHealth ? (
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div className="rounded border border-border/70 p-3">
                <div className="font-medium">Gemini</div>
                <div>Status: <span className={aiHealth.gemini.status === 'healthy' ? 'text-emerald-500' : 'text-destructive'}>{aiHealth.gemini.status}</span></div>
                <div>Model: {aiHealth.gemini.model}</div>
                <div>Latency: {aiHealth.gemini.latency}ms</div>
              </div>
              <div className="rounded border border-border/70 p-3">
                <div className="font-medium">Groq</div>
                <div>Status: <span className={aiHealth.groq.status === 'healthy' ? 'text-emerald-500' : 'text-destructive'}>{aiHealth.groq.status}</span></div>
                <div>Model: {aiHealth.groq.model}</div>
                <div>Latency: {aiHealth.groq.latency}ms</div>
              </div>
              <div className="rounded border border-border/70 p-3">
                <div className="font-medium">Fallback Rate</div>
                <div className="text-2xl font-semibold">{aiHealth.telemetry.fallbackRate}%</div>
                <div>Calls: {aiHealth.telemetry.calls}</div>
                <div>Fallbacks: {aiHealth.telemetry.fallbackCount}</div>
              </div>
            </div>
          ) : !healthLoading ? (
            <div className="text-sm text-muted-foreground">No AI health data available.</div>
          ) : null}
        </div>

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
                payload.explanations.map((e: string) => <li key={e}>{e}</li>)
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
