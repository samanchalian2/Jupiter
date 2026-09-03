import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SubscriptionLifecycleService } from './commercial/subscription-lifecycle.service.js';
import { CommercialService } from './commercial/commercial.service.js';
import { DatabaseService } from './database/database.service.js';
import { DirectoryConnectorService } from './directory/directory-connector.service.js';

async function bootstrap() {
  const app=await NestFactory.createApplicationContext(AppModule);
  const lifecycle=app.get(SubscriptionLifecycleService);
  const commercial=app.get(CommercialService);
  const database=app.get(DatabaseService);
  const directory=app.get(DirectoryConnectorService);
  const run=async()=>{try{await lifecycle.expireDue();const organizations=(await database.query<{id:string}>("SELECT id FROM organizations WHERE status='active'")).rows;for(const organization of organizations)await commercial.provisionCurrent(organization.id);await directory.scheduleDue();await directory.evaluateHealth();}catch(error){console.error('subscription lifecycle worker failed',error);}};
  await run();
  setInterval(()=>void run(),60_000).unref();
}

void bootstrap();
