import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AiGatewayService } from '../ai/ai-gateway.service.js';
import { DatabaseService } from '../database/database.service.js';
import { TranscriptionService } from '../transcription/transcription.service.js';
import { HttpAiProvider, HttpTranscriptionProvider } from './http-providers.js';

/**
 * Deliberately small worker adapter.  It is run in a separate application
 * context (see worker.ts) so request handling never owns queued AI work.
 * A provider is intentionally required through the deployment integration;
 * without one, jobs are transitioned to a visible failed/retry state instead
 * of being left in QUEUED indefinitely.
 */
@Injectable()
export class QueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorker.name);
  private timer?: NodeJS.Timeout;
  private working = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly ai: AiGatewayService,
    private readonly transcription: TranscriptionService,
  ) {}

  onModuleInit() {
    if (process.env.JUPITER_WORKER_ENABLED !== 'true') return;
    this.timer = setInterval(() => void this.drain(), 2_000);
    void this.drain();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async drain() {
    if (this.working) return;
    this.working = true;
    try {
      const aiJobs = await this.database.query<{ id: string }>("SELECT id FROM ai_requests WHERE status='QUEUED' ORDER BY created_at LIMIT 10");
      const aiProvider = new HttpAiProvider();
      for (const job of aiJobs.rows) await this.ai.process(job.id, aiProvider);
      const transcriptionJobs = await this.database.query<{ id: string; organization_id: string }>("SELECT id,organization_id FROM transcription_jobs WHERE status IN ('QUEUED','RETRY') ORDER BY updated_at LIMIT 10");
      const transcriptionProvider = new HttpTranscriptionProvider();
      for (const job of transcriptionJobs.rows) await this.transcription.process(job.organization_id, job.id, transcriptionProvider);
    } catch (error) {
      this.logger.error('Queue worker cycle failed', error instanceof Error ? error.stack : undefined);
    } finally { this.working = false; }
  }
}
