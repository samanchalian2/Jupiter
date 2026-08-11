import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/health.service.js';

describe('HealthService', () => {
  it('returns the API health contract', () => {
    const response = new HealthService({ query: async () => ({}) } as never).getHealth();

    expect(response.service).toBe('jupiter-api');
    expect(response.status).toBe('ok');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
  it('turns a database readiness failure into a service-unavailable response', async () => {
    const service = new HealthService({ query: async () => { throw new Error('offline'); } } as never);
    await expect(service.readiness()).rejects.toMatchObject({ status: 503 });
  });
});
