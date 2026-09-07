import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { OrganizationAccessPolicy } from '../organization/organization-access.policy.js';
import type { TicketActor } from '../tickets/ticket-actor.service.js';
import { derivePrimaryTokens, JUPITER_PRIMARY, normalizeCustomPrimary } from './appearance-color.js';

const brands = new Set(['JUPITER', 'OCEAN', 'TEAL']);
const densities = new Set(['COMFORTABLE', 'STANDARD', 'COMPACT']);
const radii = new Set(['SMALL', 'MEDIUM', 'LARGE']);
const presetPrimary: Record<string, string> = { JUPITER: JUPITER_PRIMARY, OCEAN: '#266A91', TEAL: '#176C68' };
type PlatformRow = { brand_preset: string; density_preset: string; radius_preset: string; logo_url: string | null; custom_primary: string | null; updated_at: string };

@Injectable()
export class AppearanceService {
  constructor(private readonly database: DatabaseService, private readonly access: OrganizationAccessPolicy = new OrganizationAccessPolicy()) {}

  private async platform(userId: string) {
    const user = (await this.database.query<{ is_platform_admin: boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId])).rows[0];
    if (!user?.is_platform_admin) throw new ForbiddenException();
  }

  private async platformRow() {
    return (await this.database.query<PlatformRow>('SELECT brand_preset,density_preset,radius_preset,logo_url,custom_primary,updated_at FROM platform_appearance_settings WHERE singleton=true')).rows[0] ?? null;
  }

  private projection(row: PlatformRow | null, organizationPrimary: string | null = null) {
    const brandPreset = row?.brand_preset ?? 'JUPITER';
    const platformPrimary = row?.custom_primary ?? presetPrimary[brandPreset] ?? JUPITER_PRIMARY;
    const effectivePrimary = organizationPrimary ?? platformPrimary;
    const tokens = derivePrimaryTokens(effectivePrimary);
    const primarySource = organizationPrimary ? 'ORGANIZATION' : row?.custom_primary || brandPreset !== 'JUPITER' ? 'PLATFORM' : 'SYSTEM';
    return { brandPreset, densityPreset: row?.density_preset ?? 'STANDARD', radiusPreset: row?.radius_preset ?? 'MEDIUM', logoUrl: row?.logo_url ?? null, customPrimary: organizationPrimary ?? row?.custom_primary ?? null, effectivePrimary, primarySource, onPrimary: tokens.onPrimary, updatedAt: row?.updated_at ?? null };
  }

  async current() { return this.projection(await this.platformRow()); }

  async organizationCurrent(actor: TicketActor) {
    const row = await this.database.withOrganization(actor.organizationId, async client => (await client.query<{ appearance_primary: string | null }>('SELECT appearance_primary FROM organization_settings WHERE organization_id=$1', [actor.organizationId])).rows[0]);
    return this.projection(await this.platformRow(), row?.appearance_primary ?? null);
  }

  async save(userId: string, input: { brandPreset?: string; densityPreset?: string; radiusPreset?: string; logoUrl?: string | null; customPrimary?: string | null }) {
    await this.platform(userId);
    const current = await this.platformRow();
    const brandPreset = input.brandPreset?.trim().toUpperCase() ?? current?.brand_preset;
    const densityPreset = input.densityPreset?.trim().toUpperCase() ?? current?.density_preset;
    const radiusPreset = input.radiusPreset?.trim().toUpperCase() ?? current?.radius_preset;
    const logoUrl = input.logoUrl === undefined ? current?.logo_url ?? null : input.logoUrl?.trim() || null;
    const customPrimary = input.customPrimary === undefined ? current?.custom_primary ?? null : input.customPrimary === null ? null : normalizeCustomPrimary(input.customPrimary);
    if (!brands.has(brandPreset ?? '') || !densities.has(densityPreset ?? '') || !radii.has(radiusPreset ?? '') || (logoUrl !== null && !/^\/[A-Za-z0-9._/-]{1,512}$/.test(logoUrl))) throw new BadRequestException('تنظیمات ظاهر معتبر نیست.');
    await this.database.transaction(async client => {
      await client.query('UPDATE platform_appearance_settings SET brand_preset=$1,density_preset=$2,radius_preset=$3,logo_url=$4,custom_primary=$5,updated_by_user_id=$6,updated_at=now() WHERE singleton=true', [brandPreset, densityPreset, radiusPreset, logoUrl, customPrimary, userId]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES(NULL,$1,$2,$3,NULL,$4)', [userId, 'appearance.platform_updated', 'platform_appearance_settings', { primaryChanged: input.customPrimary !== undefined, source: customPrimary ? 'PLATFORM' : brandPreset === 'JUPITER' ? 'SYSTEM' : 'PLATFORM' }]);
    });
    return this.current();
  }

  async resetPlatformPrimary(userId: string) {
    await this.platform(userId);
    const current = await this.platformRow();
    const source = current?.brand_preset === 'JUPITER' ? 'SYSTEM' : 'PLATFORM';
    await this.database.transaction(async client => {
      await client.query('UPDATE platform_appearance_settings SET custom_primary=NULL WHERE singleton=true');
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES(NULL,$1,$2,$3,NULL,$4)', [userId, 'appearance.platform_reset', 'platform_appearance_settings', { reset: true, source }]);
    });
    return this.current();
  }

  async saveOrganizationPrimary(actor: TicketActor, input: { customPrimary?: unknown }) {
    this.access.operator(actor);
    const primary = normalizeCustomPrimary(input.customPrimary);
    await this.database.withOrganization(actor.organizationId, async client => {
      await client.query('INSERT INTO organization_settings(organization_id,appearance_primary) VALUES($1,$2) ON CONFLICT(organization_id) DO UPDATE SET appearance_primary=EXCLUDED.appearance_primary,updated_at=now()', [actor.organizationId, primary]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$1,$5)', [actor.organizationId, actor.userId, 'appearance.organization_updated', 'organization', { primaryChanged: true, source: 'ORGANIZATION' }]);
    });
    return this.organizationCurrent(actor);
  }

  async resetOrganizationPrimary(actor: TicketActor) {
    this.access.operator(actor);
    const inheritedSource = this.projection(await this.platformRow()).primarySource;
    await this.database.withOrganization(actor.organizationId, async client => {
      await client.query('INSERT INTO organization_settings(organization_id,appearance_primary) VALUES($1,NULL) ON CONFLICT(organization_id) DO UPDATE SET appearance_primary=NULL,updated_at=now()', [actor.organizationId]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES($1,$2,$3,$4,$1,$5)', [actor.organizationId, actor.userId, 'appearance.organization_reset', 'organization', { reset: true, source: inheritedSource }]);
    });
    return this.organizationCurrent(actor);
  }
}
