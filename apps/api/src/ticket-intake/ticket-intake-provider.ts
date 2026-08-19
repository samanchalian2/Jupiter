import type { AiProviderConfiguration } from '../ai/ai-provider.js';

export const TICKET_INTAKE_CONTRACT_VERSION = 'ticket-intake.v1' as const;
export type TicketPriority = 'LOW'|'NORMAL'|'HIGH'|'URGENT';
export type CatalogOption = { id: string; name: string; categoryId?: string };
export type IntakeCustomFieldDefinition = { key: string; label: string; type: string; options: unknown[]; required: boolean };
export type TicketIntakeContext = {
  description: string;
  categories: CatalogOption[];
  subcategories: CatalogOption[];
  departments: CatalogOption[];
  locations: CatalogOption[];
  disciplines: CatalogOption[];
  customFields: IntakeCustomFieldDefinition[];
};
export type TicketIntakeProviderOutput = {
  contractVersion: typeof TICKET_INTAKE_CONTRACT_VERSION;
  title: string;
  categoryId: string|null;
  subcategoryId: string|null;
  departmentId: string|null;
  locationId: string|null;
  disciplineId: string|null;
  priority: TicketPriority;
  customFields: Record<string,unknown>;
  missingFields: string[];
  confidenceByField: Record<string,number>;
};
export interface TicketIntakeProvider {
  analyzeIntake(input: { context: TicketIntakeContext; configuration: AiProviderConfiguration }): Promise<{ output: TicketIntakeProviderOutput; usage: { inputTokens?: number; outputTokens?: number } }>;
}

