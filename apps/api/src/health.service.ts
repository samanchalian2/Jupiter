import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';

export interface HealthResponse {
  readonly service: 'jupiter-api';
  readonly status: 'ok';
  readonly timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}
  getHealth(): HealthResponse {
    return {
      service: 'jupiter-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
  async readiness() { await this.database.query('SELECT 1'); return { service: 'jupiter-api', status: 'ready' as const, timestamp: new Date().toISOString() }; }
}
