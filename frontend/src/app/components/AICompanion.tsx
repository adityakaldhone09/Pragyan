import React, { useEffect, useReducer } from 'react';
import { apiClient } from '../../services/apiClient';

const personas = ['strategic', 'analytical', 'motivational', 'technical'];

type CompanionState = {
  persona: string;
  greeting: string;
  stateLabel: string;
  topRecommendations: any[];
};

type CompanionAction =
  | { type: 'hydrate'; persona: string; greeting: string; stateLabel: string; topRecommendations: any[] }
  | { type: 'fallback_greeting'; greeting: string }
  | { type: 'decision_updated'; stateLabel: string; topRecommendations: any[] }
  | { type: 'set_persona'; persona: string; greeting: string };

function companionReducer(state: CompanionState, action: CompanionAction): CompanionState {
  switch (action.type) {
    case 'hydrate':
      return {
        persona: action.persona,
        greeting: action.greeting,
        stateLabel: action.stateLabel,
        topRecommendations: action.topRecommendations,
      };
    case 'fallback_greeting':
      return { ...state, greeting: action.greeting };
    case 'decision_updated':
      return {
        ...state,
        stateLabel: action.stateLabel,
        topRecommendations: action.topRecommendations,
      };
    case 'set_persona':
      return { ...state, persona: action.persona, greeting: action.greeting };
    default:
      return state;
  }
}

function emotionalStateFromVelocity(avg: number) {
  if (avg > 6) return 'energized';
  if (avg > 3) return 'encouraging';
  return 'supportive';
}

export default function AICompanion() {
  const [{ persona, greeting, topRecommendations }, dispatch] = useReducer(companionReducer, {
    persona: 'strategic',
    greeting: '',
    stateLabel: 'neutral',
    topRecommendations: [],
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [p, mem, decision] = await Promise.allSettled([
          apiClient.get<any>('/ai/personality').catch(() => null),
          apiClient.get<any>('/ai/memory').catch(() => null),
          apiClient.get<any>('/ai/decision/evaluate').catch(() => null),
        ]);

        const personaType = (p as PromiseFulfilledResult<any>).status === 'fulfilled' && (p as PromiseFulfilledResult<any>).value?.type
          ? (p as PromiseFulfilledResult<any>).value.type
          : 'strategic';

        const memVal = (mem as PromiseFulfilledResult<any>).status === 'fulfilled' ? (mem as PromiseFulfilledResult<any>).value : null;
        const name = memVal?.profileName || memVal?.profile?.name || 'Learner';

        let nextStateLabel = 'neutral';
        let recommendations: any[] = [];

        if ((decision as PromiseFulfilledResult<any>).status === 'fulfilled') {
          const val = (decision as PromiseFulfilledResult<any>).value;
          const evaluated = val?.evaluated || [];
          if (Array.isArray(evaluated)) {
            recommendations = evaluated.slice(0, 3);
            nextStateLabel = emotionalStateFromVelocity(val?.meta?.avgVelocity || 0);
          }
        }

        if (mounted) {
          dispatch({
            type: 'hydrate',
            persona: personaType,
            stateLabel: nextStateLabel,
            topRecommendations: recommendations,
            greeting: `Hello ${name}, I'm your ${personaType} companion — currently ${nextStateLabel}.`,
          });
        }
      } catch {
        if (mounted) dispatch({ type: 'fallback_greeting', greeting: 'Hello — your AI companion is ready.' });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function onDecisionUpdated(e: any) {
      const val = e?.detail;
      const evaluated = val?.evaluated || [];
      if (!Array.isArray(evaluated)) return;

      const nextStateLabel = emotionalStateFromVelocity(val?.meta?.avgVelocity || 0);
      dispatch({
        type: 'decision_updated',
        stateLabel: nextStateLabel,
        topRecommendations: evaluated.slice(0, 3),
      });

      const anim = document.createElement('div');
      anim.className = 'ai-reaction-burst';
      anim.textContent = 'AI adapted recommendations';
      document.body.appendChild(anim);
      setTimeout(() => {
        anim.classList.add('ai-reaction-hide');
      }, 900);
      setTimeout(() => {
        try {
          document.body.removeChild(anim);
        } catch {
          // ignore
        }
      }, 1500);
    }

    window.addEventListener('ai:decision:updated', onDecisionUpdated as EventListener);
    return () => window.removeEventListener('ai:decision:updated', onDecisionUpdated as EventListener);
  }, []);

  async function changePersona(p: string) {
    dispatch({ type: 'set_persona', persona: p, greeting: `Switched to ${p} mentor voice.` });
    try {
      await apiClient.post('/ai/personality', { type: p }).catch(() => null);
    } catch {
      // ignore
    }
  }

  return (
    <div className="glass p-4 rounded-xl ai-companion">
      <div className="flex items-start gap-4">
        <div className="hologram-viewport"><div className="hologram-core" /></div>
        <div style={{ flex: 1 }}>
          <div className="text-sm text-muted-foreground">AI Companion</div>
          <div className="font-medium mt-1">{greeting}</div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {personas.map((p) => (
              <button type="button" key={p} className={`pill ${p === persona ? '' : 'muted'}`} onClick={() => changePersona(p)}>{p}</button>
            ))}
          </div>

          {topRecommendations && topRecommendations.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold">Adaptive Recommendations</div>
              <div className="mt-2 space-y-2">
                {topRecommendations.map((r: any) => (
                  <div key={r.career} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.career}</div>
                      <div className="text-xs text-muted-foreground">{(r.reasons || []).slice(0, 2).join(' • ')}</div>
                    </div>
                    <div className="text-sm font-semibold">{Math.round(r.adaptiveScore || 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
