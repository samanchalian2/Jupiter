import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { applySecurityHeaders, FixedWindowRateLimiter } from './observability/request-guard.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',').map((origin) => origin.trim()) ?? ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization', 'x-organization-id', 'x-request-id'],
  });
  const limiter = new FixedWindowRateLimiter(Number(process.env.RATE_LIMIT_PER_MINUTE ?? 120));
  app.use((request: { ip?: string; method: string; originalUrl?: string; headers: Record<string, string | undefined> }, response: { status(code: number): { json(value: object): void }; setHeader(name: string, value: string): void; on(event: string, listener: () => void): void }, next: () => void) => {
    const requestId = request.headers['x-request-id'] || randomUUID();
    response.setHeader('X-Request-Id', requestId);
    applySecurityHeaders(response);
    const startedAt = performance.now();
    response.on('finish', () => console.info(JSON.stringify({ event: 'http.request', requestId, method: request.method, path: request.originalUrl, durationMs: Math.round(performance.now() - startedAt) })));
    if (!limiter.allow(request.ip ?? 'unknown')) return response.status(429).json({ message: 'Too many requests' });
    next();
  });
  await app.listen(Number(process.env.API_PORT ?? 3000));
}

void bootstrap();
