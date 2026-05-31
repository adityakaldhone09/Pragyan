import { computeXpProgression, XP_LEVEL_TITLES, xpService } from '@/services/xp';

describe('xp progression', () => {
  it('computes progression with the expected titles', () => {
    const progression = computeXpProgression(0);
    expect(progression.level).toBe(1);
    expect(progression.title).toBe(XP_LEVEL_TITLES[1]);
    expect(progression.nextTitle).toBe(XP_LEVEL_TITLES[2]);
    expect(progression.progressPercent).toBe(0);
  });

  it('advances levels as xp grows', () => {
    const progression = computeXpProgression(450);
    expect(progression.level).toBeGreaterThan(1);
    expect(progression.title).toBeDefined();
    expect(progression.xpToNextLevel).toBeGreaterThanOrEqual(0);
  });

  it('uses the service helper consistently', () => {
    const progression = xpService.getProgression(900);
    expect(progression.level).toBeGreaterThanOrEqual(1);
    expect(progression.progressPercent).toBeLessThanOrEqual(100);
  });
});