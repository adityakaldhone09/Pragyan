import { apiClient } from './apiClient';

export const intelligenceService = {
  getForecastSignals: <T = any>() => apiClient.get<T>('/intelligence/forecast'),
  getDebugPayload: <T = any>() => apiClient.get<T>('/intelligence/debug'),
  getAuditLogs: <T = any>(params?: any) => apiClient.get<T>('/intelligence/audits', { params }),
};
