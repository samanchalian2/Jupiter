import type { AiProviderConfiguration } from '../ai/ai-provider.js';

export const TICKET_INTAKE_CONTRACT_VERSION = 'ticket-intake.v5' as const;
export type TicketPriority = 'LOW'|'NORMAL'|'HIGH'|'URGENT';
export type CatalogOption = { id: string; name: string; categoryId?: string };
export type IntakeTitleOption = { id:string; title:string };
export type IntakeTagKind = 'DOMAIN'|'SERVICE_ASSET'|'ISSUE_TYPE'|'IMPACT_SCOPE'|'CONTEXT'|'OTHER';
export type IntakeTagOption = { id:string; name:string; kind:IntakeTagKind };
export type IntakeCustomFieldDefinition = { key: string; label: string; type: string; options: unknown[]; required: boolean };
export type TicketIntakeContext = {
  description: string;
  messages?: Array<{role:'USER'|'ASSISTANT';contentType:'TEXT'|'VOICE'|'CLARIFICATION';text:string}>;
  categories: CatalogOption[];
  subcategories: CatalogOption[];
  departments: CatalogOption[];
  locations: CatalogOption[];
  disciplines: CatalogOption[];
  customFields: IntakeCustomFieldDefinition[];
  titleLibrary: IntakeTitleOption[];
  tags: IntakeTagOption[];
};
export type IntakeTagProposal = { tagId:string|null; name:string; kind:IntakeTagKind };
export type SecondaryTicketProposal = {
  summary:string; confidence:number; title?:string; description?:string; categoryId?:string|null; subcategoryId?:string|null;
  departmentId?:string|null; locationId?:string|null; disciplineId?:string|null; priority?:TicketPriority;
  customFields?:Record<string,unknown>; tags?:IntakeTagProposal[]; confidenceByField?:Record<string,number>;
};
export type TicketIntakeProviderOutput = {
  contractVersion: typeof TICKET_INTAKE_CONTRACT_VERSION;
  title: string;
  titleLibraryId: string|null;
  categoryId: string|null;
  subcategoryId: string|null;
  departmentId: string|null;
  locationId: string|null;
  disciplineId: string|null;
  priority: TicketPriority;
  customFields: Record<string,unknown>;
  tags: IntakeTagProposal[];
  missingFields: string[];
  confidenceByField: Record<string,number>;
  interpretation?: string;
  primaryIssue?: { summary:string; serviceAsset:string|null; issueType:string|null; confidence:number };
  secondaryIssues?: SecondaryTicketProposal[];
  clarificationQuestion?: string|null;
  clarificationConfidence?: number|null;
};
export interface TicketIntakeProvider {
  analyzeIntake(input: { context: TicketIntakeContext; configuration: AiProviderConfiguration }): Promise<{ output: TicketIntakeProviderOutput; usage: { inputTokens?: number; outputTokens?: number } }>;
}
