export type PlacementProbability = {
  probability: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
};

export type OpportunityForecast = {
  expectedJobs: number;
  timelineDays: number;
  note?: string;
};

export type ConsistencyRisk = {
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number; // 0-100
  reason: string;
};

export type MomentumSignal = {
  skill: string;
  momentum: 'ACCELERATING' | 'GROWING' | 'FLAT' | 'DECLINING';
  score: number;
  explanation?: string;
};

export type ReadinessForecast = {
  currentReadiness: number;
  projected14d: number;
  daysTo85?: number | null;
  dailyMomentum: number;
};

export type IntelligencePayload = {
  placementProbability: PlacementProbability;
  opportunityForecast: OpportunityForecast;
  consistencyRisk: ConsistencyRisk;
  momentumSignals: MomentumSignal[];
  readinessForecast: ReadinessForecast;
};
