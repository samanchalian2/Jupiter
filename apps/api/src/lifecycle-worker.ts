import type { SubscriptionLifecycleService } from './commercial/subscription-lifecycle.service.js';
import type { CommercialService } from './commercial/commercial.service.js';
import type { DatabaseService } from './database/database.service.js';
import type { DirectoryConnectorService } from './directory/directory-connector.service.js';
import type { HubBindingService } from './observability/hub-binding.service.js';

type Services={
 lifecycle:Pick<SubscriptionLifecycleService,'expireDue'>;
 commercial:Pick<CommercialService,'provisionCurrent'>;
 database:Pick<DatabaseService,'query'>;
 directory:Pick<DirectoryConnectorService,'scheduleDue'|'evaluateHealth'>;
 observation:Pick<HubBindingService,'observeBackgroundOperation'>;
};
/** Existing product order/fail-fast cycle; observation does not change commercial results. */
export async function runLifecycleWorkerCycle({lifecycle,commercial,database,directory,observation}:Services){
 try{
  await observation.observeBackgroundOperation('subscription.expire_due',null,()=>lifecycle.expireDue());
  const organizations=await observation.observeBackgroundOperation('commercial.enumerate_organizations',null,()=>database.query<{id:string}>("SELECT id FROM organizations WHERE status='active'"));
  for(const organization of organizations.rows)await observation.observeBackgroundOperation('commercial.provision_current',organization.id,()=>commercial.provisionCurrent(organization.id));
  await observation.observeBackgroundOperation('directory.schedule_due',null,()=>directory.scheduleDue());
  await observation.observeBackgroundOperation('directory.evaluate_health',null,()=>directory.evaluateHealth());
  return true;
 }catch{
  // The observation boundary emits a bounded fixed-field diagnostic, never raw Error.
  // Retain fail-fast behavior and the existing next-minute retry.
  return false;
 }
}
