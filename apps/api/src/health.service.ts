import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  readonly service: 'jupiter-api';
  readonly status: 'ok';
  readonly timestamp: string;
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      service: 'jupiter-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
