# Intelligence Module

Purpose
-------
This module implements Pragyan's centralized intelligence engine: deterministic, explainable, and tunable heuristics that power the dashboard's placement readiness, opportunity forecasting, consistency risk detection, and momentum signals.

Architecture & Signal Flow
--------------------------
- Input: `journeyService.getDashboardJourney(userId)` snapshot (readiness, trend, xp, streak, weakSkills, eligibleJobs, skill radar data).
- Processing: `intelligence.service` computes a bundle of signals using small, deterministic heuristics.
- Output: `/api/intelligence/forecast` — JSON payload with `placementProbability`, `opportunityForecast`, `consistencyRisk`, `momentumSignals`, and `readinessForecast`.

Scoring Philosophy
------------------
- Keep it explainable: every score is derived from observable inputs (readiness, trend slope, streak, weak skills, eligible roles, xp).
- Keep it deterministic: avoid randomness; same input → same output.
- Keep it lightweight: use simple arithmetic heuristics so results are auditable and fast.

Explainability Rules
--------------------
All intelligence signals must:

- Be deterministic and reproducible.
- Provide an explanation string describing primary inputs.
- Expose a confidence label (`LOW` | `MEDIUM` | `HIGH`) when applicable.
- Avoid black-box behavior (no hidden randomness or opaque priors).

Config & Runtime Overrides
--------------------------
Tunable constants live in `intelligence.config.ts`. For operational flexibility, these values may be overridden at runtime using environment variables. Example env names:

- `INTELLIGENCE_SLOPE_MULTIPLIER`
- `INTELLIGENCE_MAX_SLOPE_IMPACT`
- `INTELLIGENCE_STREAK_LOW_THRESHOLD`
- `INTELLIGENCE_STREAK_HIGH_THRESHOLD`
- `INTELLIGENCE_STREAK_PENALTY`
- `INTELLIGENCE_WEAK_PENALTY_PER_SKILL`
- `INTELLIGENCE_MAX_WEAK_PENALTY`
- `INTELLIGENCE_JOBS_BOOST_PER_ROLE`
- `INTELLIGENCE_MAX_JOBS_BOOST`
- `INTELLIGENCE_OPPORTUNITY_HORIZON_DAYS`
- `INTELLIGENCE_CONFIDENCE_HIGH_DELTA`
- `INTELLIGENCE_CONFIDENCE_MEDIUM_DELTA`
- `INTELLIGENCE_MOMENTUM_*` (several tuning knobs)

Defaults are safe and documented in `intelligence.config.ts`. Use env overrides for A/B testing or production tuning without changing code.

Response Shape
--------------
The endpoint returns an `IntelligencePayload` containing:

- `placementProbability`: { probability:number, confidence:string, explanation:string }
- `opportunityForecast`: { expectedJobs:number, timelineDays:number, note?:string }
- `consistencyRisk`: { risk: 'LOW'|'MEDIUM'|'HIGH', score:number, reason:string }
- `momentumSignals`: Array<{ skill, momentum, score, explanation }>
- `readinessForecast`: { currentReadiness, projected14d, daysTo85?, dailyMomentum }

Future ML Integration
---------------------
- Keep heuristics isolated behind `intelligence.service` so ML models can replace or augment outputs without touching frontend.
- When ready to add ML, provide a model adapter that accepts the same snapshot input and returns the `IntelligencePayload` shape.
- Collect training datasets: user snapshots, eventual placement outcomes, interview success, job applications accepted. Instrument telemetry to capture labeled outcomes.

Operational Notes
-----------------
- Unit tests live alongside the service (`__tests__`) and should validate scoring rules and edge cases.
- Add production feature flags when experimenting with new heuristics or ML models.
- Maintain explainability in any ML-enhanced outputs: include top contributing features and confidence.
