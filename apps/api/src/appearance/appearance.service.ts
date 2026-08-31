import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

const brands = new Set(['JUPITER', 'OCEAN', 'TEAL']);
const densities = new Set(['COMFORTABLE', 'STANDARD', 'COMPACT']);
const radii = new Set(['SMALL', 'MEDIUM', 'LARGE']);

@Injectable()
export class AppearanceService {
  constructor(private readonly database: DatabaseService) {}

  private async platform(userId: string) {
    const user = (await this.database.query<{ is_platform_admin: boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId])).rows[0];
    if (!user?.is_platform_admin) throw new ForbiddenException();
  }

  async current() {
    const row = (await this.database.query<{ brand_preset: string; density_preset: string; radius_preset: string; logo_url: string | null; updated_at: string }>('SELECT brand_preset,density_preset,radius_preset,logo_url,updated_at FROM platform_appearance_settings WHERE singleton=true')).rows[0];
    return { brandPreset: row?.brand_preset ?? 'JUPITER', densityPreset: row?.density_preset ?? 'STANDARD', radiusPreset: row?.radius_preset ?? 'MEDIUM', logoUrl: row?.logo_url ?? null, updatedAt: row?.updated_at ?? null };
  }

  async save(userId: string, input: { brandPreset?: string; densityPreset?: string; radiusPreset?: string; logoUrl?: string | null }) {
    await this.platform(userId);
    const brandPreset = input.brandPreset?.trim().toUpperCase();
    const densityPreset = input.densityPreset?.trim().toUpperCase();
    const radiusPreset = input.radiusPreset?.trim().toUpperCase();
    const logoUrl = input.logoUrl?.trim() || null;
    if (!brands.has(brandPreset ?? '') || !densities.has(densityPreset ?? '') || !radii.has(radiusPreset ?? '') || (logoUrl !== null && !/^\/[A-Za-z0-9._/-]{1,512}$/.test(logoUrl))) throw new BadRequestException('تنظیمات ظاهر معتبر نیست.');
    await this.database.transaction(async client => {
      await client.query('UPDATE platform_appearance_settings SET brand_preset=$1,density_preset=$2,radius_preset=$3,logo_url=$4,updated_by_user_id=$5,updated_at=now() WHERE singleton=true', [brandPreset, densityPreset, radiusPreset, logoUrl, userId]);
      await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES(NULL,$1,$2,$3,NULL,$4)', [userId, 'appearance.platform_saved', 'platform_appearance_settings', { brandPreset, densityPreset, radiusPreset, hasLogo: Boolean(logoUrl) }]);
    });
    return this.current();
  }
}
