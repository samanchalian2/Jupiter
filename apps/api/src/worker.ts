import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SubscriptionLifecycleService } from './commercial/subscription-lifecycle.service.js';
import { CommercialService } from './commercial/commercial.service.js';
import { DatabaseService } from './database/database.service.js';
import { DirectoryConnectorService } from './directory/directory-connector.service.js';
import { HubBindingService } from './observability/hub-binding.service.js';
import { runLifecycleWorkerCycle } from './lifecycle-worker.js';

async function bootstrap() {
  const app=await NestFactory.createApplicationContext(AppModule);
  const lifecycle=app.get(SubscriptionLifecycleService);
  const commercial=app.get(CommercialService);
  const database=app.get(DatabaseService);
  const directory=app.get(DirectoryConnectorService);
  const observation=app.get(HubBindingService);
  const run=()=>runLifecycleWorkerCycle({lifecycle,commercial,database,directory,observation});
  await run();
  setInterval(()=>void run(),60_000).unref();
}

void bootstrap();
