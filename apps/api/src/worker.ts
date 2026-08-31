import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SubscriptionLifecycleService } from './commercial/subscription-lifecycle.service.js';

async function bootstrap() {
  const app=await NestFactory.createApplicationContext(AppModule);
  const lifecycle=app.get(SubscriptionLifecycleService);
  const run=async()=>{try{await lifecycle.expireDue();}catch(error){console.error('subscription lifecycle worker failed',error);}};
  await run();
  setInterval(()=>void run(),60_000).unref();
}

void bootstrap();
