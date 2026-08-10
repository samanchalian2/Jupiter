import { describe, expect, it } from 'vitest';
import { ReportingService } from '../src/reporting/reporting.service.js';
describe('Reporting access policy',()=>{const service=new ReportingService({withOrganization:async()=>[]} as never);it('rejects requester workload access',async()=>await expect(service.workload({organizationId:'org',roles:['REQUESTER']})).rejects.toBeDefined())});
