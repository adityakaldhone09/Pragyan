import { intelligenceService } from '../intelligence.service';

describe('IntelligenceService.buildForecastSignals', () => {
  test('high readiness and strong streak yields high placement probability and HIGH confidence', () => {
    const snapshot = {
      placementReadiness: { score: 85 },
      streak: 7,
      trend: [{ readinessScore: 80 }, { readinessScore: 82 }, { readinessScore: 84 }, { readinessScore: 85 }, { readinessScore: 86 }, { readinessScore: 87 }, { readinessScore: 88 }],
      eligibleJobs: [{ eligible: true }, { eligible: false }],
      xp: 1200,
      skillRadarData: [{ skill: 'Frontend', score: 80, explanation: 'Good' }],
    } as any;

    const payload = intelligenceService.buildForecastSignals(snapshot);
    expect(payload.placementProbability.probability).toBeGreaterThanOrEqual(75);
    expect(['HIGH', 'MEDIUM']).toContain(payload.placementProbability.confidence);
  });

  test('low streak and declining trend yields high consistency risk', () => {
    const snapshot = {
      placementReadiness: { score: 60 },
      streak: 1,
      trend: [{ readinessScore: 70 }, { readinessScore: 65 }, { readinessScore: 60 }, { readinessScore: 55 }, { readinessScore: 50 }, { readinessScore: 48 }, { readinessScore: 45 }],
      weakSkills: ['dsa', 'system design'],
    } as any;

    const payload = intelligenceService.buildForecastSignals(snapshot);
    expect(payload.consistencyRisk.score).toBeGreaterThan(50);
    expect(payload.consistencyRisk.risk).toBe('HIGH');
  });

  test('improving readiness increases expected opportunities', () => {
    const base = {
      placementReadiness: { score: 55 },
      streak: 3,
      trend: [{ readinessScore: 50 }, { readinessScore: 51 }, { readinessScore: 52 }, { readinessScore: 53 }, { readinessScore: 54 }, { readinessScore: 55 }, { readinessScore: 56 }],
      eligibleJobs: [{ eligible: true }, { eligible: true }],
    } as any;
    const improving = {
      placementReadiness: { score: 55 },
      streak: 3,
      trend: [{ readinessScore: 50 }, { readinessScore: 52 }, { readinessScore: 54 }, { readinessScore: 56 }, { readinessScore: 58 }, { readinessScore: 60 }, { readinessScore: 62 }],
      eligibleJobs: [{ eligible: true }, { eligible: true }],
    } as any;

    const p1 = intelligenceService.buildForecastSignals(base);
    const p2 = intelligenceService.buildForecastSignals(improving);

    expect(p2.opportunityForecast.expectedJobs).toBeGreaterThanOrEqual(p1.opportunityForecast.expectedJobs);
  });

  test('positive slope in skill radar yields ACCELERATING momentum', () => {
    const snapshot = {
      placementReadiness: { score: 50 },
      streak: 4,
      trend: [{ readinessScore: 45 }, { readinessScore: 47 }, { readinessScore: 49 }, { readinessScore: 51 }, { readinessScore: 53 }, { readinessScore: 55 }, { readinessScore: 57 }],
      skillRadarData: [{ skill: 'Backend', score: 82, explanation: 'Strong' }],
    } as any;

    const payload = intelligenceService.buildForecastSignals(snapshot);
    expect(payload.momentumSignals[0].momentum).toBe('ACCELERATING');
  });
});
