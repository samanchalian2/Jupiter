import { describe, expect, it } from 'vitest';
import { HealthService } from '../src/health.service.js';

describe('HealthService', () => {
  it('returns the API health contract', () => {
    const response = new HealthService().getHealth();

    expect(response.service).toBe('jupiter-api');
    expect(response.status).toBe('ok');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
