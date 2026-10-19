import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AiGatewayService } from '../ai/ai-gateway.service.js';
import { DatabaseService } from '../database/database.service.js';
import { TranscriptionService } from '../transcription/transcription.service.js';
import { HttpAiProvider, HttpTranscriptionProvider } from './http-providers.js';
import { TicketIntakeService } from '../ticket-intake/ticket-intake.service.js';
import { HubBindingService } from '../observability/hub-binding.service.js';

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
  private lastIntakeCleanupAt = 0;

  constructor(
    private readonly database: DatabaseService,
    private readonly ai: AiGatewayService,
    private readonly transcription: TranscriptionService,
    private readonly intakes: TicketIntakeService,
    private readonly observation: HubBindingService,
  ) {}

  onModuleInit() {
    if (process.env.JUPITER_WORKER_ENABLED !== 'true') return;
    this.timer = setInterval(() => void this.drain(), 2_000);
    void this.drain();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async persistedOutcome(operation:'queue.ai.process'|'queue.intake.process',organizationId:string,read:()=>Promise<{status:string;next_attempt_at?:string|null}|undefined>){
    try{const state=await read();if(state?.status==='FAILED')this.observation.reportBackgroundOutcome(operation,organizationId,'FAILED');else if(operation==='queue.intake.process'&&state?.next_attempt_at)this.observation.reportBackgroundOutcome(operation,organizationId,'RETRY');}
    catch{this.logger.warn('Queue worker outcome observation unavailable');}
  }

  private async drain() {
    if (this.working) return;
    this.working = true;
    try {
      const providers=await this.observation.observeBackgroundOperation('queue.providers.initialize',null,async()=>({aiProvider:new HttpAiProvider(),transcriptionProvider:new HttpTranscriptionProvider()}));
      const aiJobs = await this.observation.observeBackgroundOperation('queue.ai.enumerate',null,()=>this.database.query<{ id: string; organization_id: string }>("SELECT id,organization_id FROM ai_requests WHERE status='QUEUED' ORDER BY created_at LIMIT 10"));
      for (const job of aiJobs.rows) await this.observation.observeBackgroundOperation('queue.ai.process',job.organization_id,async()=>{await this.ai.process(job.id,providers.aiProvider);await this.persistedOutcome('queue.ai.process',job.organization_id,()=>this.database.query<{status:string}>('SELECT status FROM ai_requests WHERE id=$1 AND organization_id=$2',[job.id,job.organization_id]).then(result=>result.rows[0]));});
      const transcriptionJobs = await this.observation.observeBackgroundOperation('queue.transcription.enumerate',null,()=>this.database.query<{ id: string; organization_id: string }>("SELECT id,organization_id FROM transcription_jobs WHERE status IN ('QUEUED','RETRY') ORDER BY updated_at LIMIT 10"));
      for (const job of transcriptionJobs.rows) { const result=await this.observation.observeBackgroundOperation('queue.transcription.process',job.organization_id,()=>this.transcription.process(job.organization_id, job.id, providers.transcriptionProvider)); if(result?.status==='RETRY'||result?.status==='DEAD_LETTER')this.observation.reportBackgroundOutcome('queue.transcription.process',job.organization_id,result.status); }
      const intakeJobs = await this.observation.observeBackgroundOperation('queue.intake.enumerate',null,()=>this.intakes.pending(10));
      for (const job of intakeJobs) await this.observation.observeBackgroundOperation('queue.intake.process',job.organization_id,async()=>{await this.intakes.process(job.organization_id,job.id,providers.aiProvider,providers.transcriptionProvider);await this.persistedOutcome('queue.intake.process',job.organization_id,()=>this.database.query<{status:string;next_attempt_at:string|null}>('SELECT status,next_attempt_at FROM ticket_intake_sessions WHERE id=$1 AND organization_id=$2',[job.id,job.organization_id]).then(result=>result.rows[0]));});
      if (Date.now()-this.lastIntakeCleanupAt>=60_000) { await this.observation.observeBackgroundOperation('queue.intake.cleanup',null,()=>this.intakes.cleanupExpired(100)); this.lastIntakeCleanupAt=Date.now(); }
    } catch {
      // Fixed fields only. The observation boundary owns sanitized diagnostics.
      this.logger.warn('Queue worker cycle failed');
    } finally { this.working = false; }
  }
}
