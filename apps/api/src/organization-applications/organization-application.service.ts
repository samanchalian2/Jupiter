import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PoolClient } from 'pg';
import { hashPassword } from '../auth/password.js';
import { DatabaseService } from '../database/database.service.js';
import { VERIFICATION_NOTIFICATION_DELIVERY, VerificationNotificationDelivery } from './verification-notification.service.js';

type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type DeliveryStatus = 'DELIVERED' | 'PENDING_CONFIGURATION' | 'FAILED';
type ApplicationRow = {
  id: string;
  applicant_user_id: string;
  organization_name: string;
  preferred_slug: string | null;
  contact_name: string;
  contact_phone: string | null;
  details: Record<string, unknown>;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  provisioned_organization_id: string | null;
  assigned_slug?: string | null;
};
type PlatformApplicationRow = ApplicationRow & { applicant_email: string | null; applicant_display_name: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9-]{3,63}$/;
const emailPattern = /^\S+@\S+\.\S+$/;
const applicationColumns = 'id,applicant_user_id,organization_name,preferred_slug,contact_name,contact_phone,details,status,created_at,updated_at,submitted_at,review_note,reviewed_at,provisioned_organization_id';
const platformApplicationColumns = applicationColumns.split(',').map((column) => `application.${column}`).join(',');

@Injectable()
export class OrganizationApplicationService {
  constructor(
    private readonly database: DatabaseService,
    @Inject(VERIFICATION_NOTIFICATION_DELIVERY) private readonly verificationDelivery: VerificationNotificationDelivery,
  ) {}

  async createPublicAccount(input: { email?: string; displayName?: string; password?: string }) {
    const email = this.email(input.email);
    const displayName = this.displayName(input.displayName);
    const password = this.password(input.password);
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hash(rawToken);
    const passwordHash = await hashPassword(password);
    try {
      const created = await this.database.transaction(async (client) => {
        const user = (await client.query<{id:string;email:string;display_name:string}>(
          'INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,NULL) RETURNING id,email,display_name', [email, displayName],
        )).rows[0];
        const identity = (await client.query<{id:string}>(
          `INSERT INTO authentication_identities(user_id,identity_type,identifier,password_hash)
           VALUES($1,'EMAIL_PASSWORD',$2,$3) RETURNING id`, [user.id,email,passwordHash],
        )).rows[0];
        const token = (await client.query<{id:string;expires_at:string}>(
          `INSERT INTO public_account_verification_tokens(user_id,identity_id,token_hash,expires_at)
           VALUES($1,$2,$3,now()+interval '24 hours') RETURNING id,expires_at`, [user.id,identity.id,tokenHash],
        )).rows[0];
        await client.query('INSERT INTO public_account_verification_deliveries(token_id,recipient_email) VALUES($1,$2)', [token.id,email]);
        await this.audit(client, user.id, 'public_account.created', 'user', user.id, { verificationRequired: true });
        return { user, tokenId: token.id, expiresAt: token.expires_at };
      });
      const deliveryStatus = await this.dispatch(created.tokenId, email, rawToken, created.expiresAt);
      return { id: created.user.id, email: created.user.email, displayName: created.user.display_name, verificationDeliveryStatus: deliveryStatus };
    } catch (cause) {
      if (this.uniqueViolation(cause)) throw new ConflictException('This email is already registered.');
      throw cause;
    }
  }

  async resendVerification(userId: string) {
    const rawToken = randomBytes(32).toString('base64url');
    const created = await this.database.transaction(async (client) => {
      const identity = (await client.query<{id:string;identifier:string;email_verified_at:string|null}>(
        `SELECT id,identifier,email_verified_at FROM authentication_identities
         WHERE user_id=$1 AND identity_type='EMAIL_PASSWORD' AND organization_id IS NULL AND status='ACTIVE'
         FOR UPDATE`, [userId],
      )).rows[0];
      if (!identity) throw new NotFoundException('A public email identity was not found.');
      if (identity.email_verified_at) return { verified: true as const };
      const recent = (await client.query<{id:string}>(
        `SELECT id FROM public_account_verification_tokens
         WHERE user_id=$1 AND created_at>now()-interval '60 seconds' ORDER BY created_at DESC LIMIT 1`, [userId],
      )).rows[0];
      if (recent) throw new HttpException('Please wait before requesting another verification email.', HttpStatus.TOO_MANY_REQUESTS);
      const token = (await client.query<{id:string;expires_at:string}>(
        `INSERT INTO public_account_verification_tokens(user_id,identity_id,token_hash,expires_at)
         VALUES($1,$2,$3,now()+interval '24 hours') RETURNING id,expires_at`, [userId,identity.id,this.hash(rawToken)],
      )).rows[0];
      await client.query('INSERT INTO public_account_verification_deliveries(token_id,recipient_email) VALUES($1,$2)', [token.id,identity.identifier]);
      await this.audit(client,userId,'public_account.verification_resent','user',userId,{});
      return { verified: false as const, tokenId: token.id, email: identity.identifier, expiresAt: token.expires_at };
    });
    if (created.verified) return { alreadyVerified: true, verificationDeliveryStatus: 'DELIVERED' as const };
    return { alreadyVerified: false, verificationDeliveryStatus: await this.dispatch(created.tokenId,created.email,rawToken,created.expiresAt) };
  }

  async verifyEmail(token: string) {
    if (!token || token.length < 32 || token.length > 512) throw new BadRequestException('Verification link is invalid or expired.');
    const result = await this.database.transaction(async (client) => {
      const row = (await client.query<{id:string;user_id:string;identity_id:string}>(
        `SELECT id,user_id,identity_id FROM public_account_verification_tokens
         WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`, [this.hash(token)],
      )).rows[0];
      if (!row) throw new BadRequestException('Verification link is invalid or expired.');
      await client.query('UPDATE public_account_verification_tokens SET consumed_at=now() WHERE id=$1', [row.id]);
      await client.query('UPDATE authentication_identities SET email_verified_at=COALESCE(email_verified_at,now()),updated_at=now() WHERE id=$1', [row.identity_id]);
      await this.audit(client,row.user_id,'public_account.email_verified','user',row.user_id,{});
      return { verified: true };
    });
    return result;
  }

  async publicAccountStatus(userId: string) {
    const result = await this.database.query<{email:string;email_verified_at:string|null;delivery_status:string|null}>(
      `SELECT i.identifier AS email,i.email_verified_at,d.status AS delivery_status
       FROM authentication_identities i
       LEFT JOIN LATERAL (
         SELECT status FROM public_account_verification_tokens t
         JOIN public_account_verification_deliveries d ON d.token_id=t.id
         WHERE t.identity_id=i.id ORDER BY t.created_at DESC LIMIT 1
       ) d ON true
       WHERE i.user_id=$1 AND i.identity_type='EMAIL_PASSWORD' AND i.organization_id IS NULL AND i.status='ACTIVE'`, [userId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException('A public email identity was not found.');
    return { email: row.email, emailVerified: Boolean(row.email_verified_at), verificationDeliveryStatus: row.delivery_status ?? 'PENDING_CONFIGURATION' };
  }

  async createApplication(userId: string, input: { organizationName?: string; preferredSlug?: string; contactName?: string; contactPhone?: string; details?: Record<string, unknown> }, idempotencyKey: string) {
    const key = this.idempotencyKey(idempotencyKey);
    const organizationName = this.organizationName(input.organizationName);
    const contactName = this.displayName(input.contactName);
    const preferredSlug = this.preferredSlug(input.preferredSlug);
    const contactPhone = this.phone(input.contactPhone);
    const details = this.details(input.details);
    try {
      return await this.database.transaction(async (client) => {
        const duplicate = (await client.query<ApplicationRow>(
          `SELECT ${applicationColumns} FROM organization_applications
           WHERE applicant_user_id=$1 AND client_request_id=$2`, [userId,key],
        )).rows[0];
        if (duplicate) return this.publicApplication(duplicate);
        const application = (await client.query<ApplicationRow>(
          `INSERT INTO organization_applications(applicant_user_id,organization_name,preferred_slug,contact_name,contact_phone,details,client_request_id)
           VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)
           RETURNING ${applicationColumns}`,
          [userId,organizationName,preferredSlug,contactName,contactPhone,JSON.stringify(details),key],
        )).rows[0];
        await this.transitionAudit(client,application.id,userId,null,'DRAFT',key,{ source: 'public_account' });
        return this.publicApplication(application);
      });
    } catch (cause) {
      if (this.uniqueViolation(cause)) throw new ConflictException('An active organization application already exists for this account.');
      throw cause;
    }
  }

  async listApplications(userId: string) {
    const result = await this.database.query<ApplicationRow>(
      `SELECT ${platformApplicationColumns}, organization.slug AS assigned_slug
       FROM organization_applications application
       LEFT JOIN organizations organization ON organization.id=application.provisioned_organization_id
       WHERE application.applicant_user_id=$1 ORDER BY application.created_at DESC`, [userId],
    );
    return result.rows.map((row) => this.publicApplication(row));
  }

  async updateApplication(userId: string, applicationId: string, input: { organizationName?: string; preferredSlug?: string; contactName?: string; contactPhone?: string; details?: Record<string, unknown> }, idempotencyKey: string) {
    if (!uuidPattern.test(applicationId)) throw new BadRequestException('Application identifier is invalid.');
    const key = this.idempotencyKey(idempotencyKey);
    const organizationName = this.organizationName(input.organizationName);
    const contactName = this.displayName(input.contactName);
    const preferredSlug = this.preferredSlug(input.preferredSlug);
    const contactPhone = this.phone(input.contactPhone);
    const details = this.details(input.details);
    return this.database.transaction(async (client) => {
      const application = (await client.query<ApplicationRow>(
        `SELECT ${applicationColumns} FROM organization_applications
         WHERE id=$1 AND applicant_user_id=$2 FOR UPDATE`, [applicationId,userId],
      )).rows[0];
      if (!application) throw new NotFoundException('Organization application not found.');
      const prior = (await client.query<{id:string}>(
        'SELECT id FROM organization_application_transitions WHERE application_id=$1 AND idempotency_key=$2', [applicationId,key],
      )).rows[0];
      if (prior) return this.publicApplication(application);
      if (!['DRAFT','NEEDS_INFORMATION'].includes(application.status)) throw new BadRequestException('This application cannot be updated in its current state.');
      const updated = (await client.query<ApplicationRow>(
        `UPDATE organization_applications
         SET organization_name=$2,preferred_slug=$3,contact_name=$4,contact_phone=$5,details=$6::jsonb,updated_at=now()
         WHERE id=$1
         RETURNING ${applicationColumns}`,
        [applicationId,organizationName,preferredSlug,contactName,contactPhone,JSON.stringify(details)],
      )).rows[0];
      await client.query(
        `INSERT INTO organization_application_transitions(application_id,actor_user_id,from_status,to_status,idempotency_key,metadata)
         VALUES($1,$2,$3,$3,$4,$5::jsonb)`, [applicationId,userId,application.status,key,JSON.stringify({ kind: 'updated' })],
      );
      await this.audit(client,userId,'organization_application.updated','organization_application',applicationId,{});
      return this.publicApplication(updated);
    });
  }

  async submitApplication(userId: string, applicationId: string, idempotencyKey: string) {
    return this.transitionApplicantApplication(userId, applicationId, this.idempotencyKey(idempotencyKey), 'SUBMITTED');
  }

  async cancelApplication(userId: string, applicationId: string, idempotencyKey: string) {
    return this.transitionApplicantApplication(userId, applicationId, this.idempotencyKey(idempotencyKey), 'CANCELLED');
  }

  async platformApplications(userId: string, status?: ApplicationStatus) {
    await this.platform(userId);
    if (status && !['SUBMITTED','UNDER_REVIEW','NEEDS_INFORMATION','APPROVED','REJECTED','CANCELLED'].includes(status)) throw new BadRequestException('Application review status is invalid.');
    const rows = await this.database.query<PlatformApplicationRow>(
      `SELECT ${platformApplicationColumns}, applicant.email AS applicant_email, applicant.display_name AS applicant_display_name,
        organization.slug AS assigned_slug
       FROM organization_applications application
       JOIN users applicant ON applicant.id=application.applicant_user_id
       LEFT JOIN organizations organization ON organization.id=application.provisioned_organization_id
       WHERE ($1::text IS NULL OR application.status=$1)
       ORDER BY application.submitted_at DESC NULLS LAST, application.created_at DESC`, [status ?? null],
    );
    return rows.rows.map((row) => this.platformApplication(row));
  }

  async startReview(userId: string, applicationId: string, idempotencyKey: string) {
    return this.platformTransition(userId, applicationId, idempotencyKey, 'UNDER_REVIEW');
  }

  async requestInformation(userId: string, applicationId: string, note: string | undefined, idempotencyKey: string) {
    return this.platformTransition(userId, applicationId, idempotencyKey, 'NEEDS_INFORMATION', this.reviewNote(note, true));
  }

  async rejectApplication(userId: string, applicationId: string, note: string | undefined, idempotencyKey: string) {
    return this.platformTransition(userId, applicationId, idempotencyKey, 'REJECTED', this.reviewNote(note, true));
  }

  async approveApplication(userId: string, applicationId: string, slug: string | undefined, idempotencyKey: string, note?: string) {
    await this.platform(userId);
    if (!uuidPattern.test(applicationId)) throw new BadRequestException('Application identifier is invalid.');
    const key = this.idempotencyKey(idempotencyKey);
    const approvedSlug = this.approvedSlug(slug);
    const reviewNote = this.reviewNote(note, false);
    try {
      return await this.database.transaction(async (client) => {
        const application = (await client.query<ApplicationRow>(
          `SELECT ${applicationColumns} FROM organization_applications WHERE id=$1 FOR UPDATE`, [applicationId],
        )).rows[0];
        if (!application) throw new NotFoundException('Organization application not found.');
        const prior = (await client.query<{id:string}>(
          'SELECT id FROM organization_application_transitions WHERE application_id=$1 AND idempotency_key=$2', [applicationId,key],
        )).rows[0];
        if (prior || (application.status === 'APPROVED' && application.provisioned_organization_id)) return this.approvedResult(client, application);
        if (application.status !== 'UNDER_REVIEW') throw new BadRequestException('Only an application under review can be approved.');
        const organization = (await client.query<{id:string;slug:string;name:string;status:string}>(
          `INSERT INTO organizations(name,slug,status) VALUES($1,$2,'setup') RETURNING id,slug,name,status`, [application.organization_name,approvedSlug],
        )).rows[0];
        const membership = (await client.query<{id:string}>(
          `INSERT INTO memberships(organization_id,user_id,status) VALUES($1,$2,'active') RETURNING id`, [organization.id,application.applicant_user_id],
        )).rows[0];
        await client.query(
          `INSERT INTO membership_roles(membership_id,role_id)
           SELECT $1,id FROM roles WHERE code IN ('ORG_OWNER','ORG_ADMIN') ON CONFLICT DO NOTHING`, [membership.id],
        );
        const updated = (await client.query<ApplicationRow>(
          `UPDATE organization_applications
           SET status='APPROVED',reviewed_by_user_id=$2,review_note=$3,reviewed_at=now(),provisioned_organization_id=$4,updated_at=now()
           WHERE id=$1 RETURNING ${applicationColumns}`,
          [applicationId,userId,reviewNote,organization.id],
        )).rows[0];
        await this.transitionAudit(client,applicationId,userId,application.status,'APPROVED',key,{ reviewNotePresent: Boolean(reviewNote), provisioned: true });
        await client.query(
          `INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
           VALUES($1,$2,'organization.provisioned','organization',$1,$3::jsonb)`, [organization.id,userId,JSON.stringify({ applicationId, slug: organization.slug, initialOwnerUserId: application.applicant_user_id })],
        );
        return { ...this.publicApplication(updated), assignedSlug: organization.slug, organizationStatus: organization.status };
      });
    } catch (cause) {
      if (this.uniqueViolation(cause)) throw new ConflictException('The selected organization slug is already assigned.');
      throw cause;
    }
  }

  private async platformTransition(userId: string, applicationId: string, idempotencyKey: string, next: 'UNDER_REVIEW' | 'NEEDS_INFORMATION' | 'REJECTED', reviewNote?: string | null) {
    await this.platform(userId);
    if (!uuidPattern.test(applicationId)) throw new BadRequestException('Application identifier is invalid.');
    const key = this.idempotencyKey(idempotencyKey);
    return this.database.transaction(async (client) => {
      const application = (await client.query<ApplicationRow>(
        `SELECT ${applicationColumns} FROM organization_applications WHERE id=$1 FOR UPDATE`, [applicationId],
      )).rows[0];
      if (!application) throw new NotFoundException('Organization application not found.');
      const prior = (await client.query<{id:string}>(
        'SELECT id FROM organization_application_transitions WHERE application_id=$1 AND idempotency_key=$2', [applicationId,key],
      )).rows[0];
      if (prior) return this.publicApplication(application);
      const expected = next === 'UNDER_REVIEW' ? 'SUBMITTED' : 'UNDER_REVIEW';
      if (application.status !== expected) throw new BadRequestException('This application cannot move to the requested review state.');
      const updated = (await client.query<ApplicationRow>(
        `UPDATE organization_applications
         SET status=$2,reviewed_by_user_id=$3,review_note=$4,reviewed_at=now(),updated_at=now()
         WHERE id=$1 RETURNING ${applicationColumns}`,
        [applicationId,next,userId,reviewNote ?? null],
      )).rows[0];
      await this.transitionAudit(client,applicationId,userId,application.status,next,key,{ reviewNotePresent: Boolean(reviewNote) });
      return this.publicApplication(updated);
    });
  }

  private async transitionApplicantApplication(userId: string, applicationId: string, idempotencyKey: string, next: 'SUBMITTED' | 'CANCELLED') {
    if (!uuidPattern.test(applicationId)) throw new BadRequestException('Application identifier is invalid.');
    return this.database.transaction(async (client) => {
      const prior = (await client.query<{to_status:ApplicationStatus}>(
        'SELECT to_status FROM organization_application_transitions WHERE application_id=$1 AND idempotency_key=$2', [applicationId,idempotencyKey],
      )).rows[0];
      const application = (await client.query<ApplicationRow>(
        `SELECT ${applicationColumns} FROM organization_applications
         WHERE id=$1 AND applicant_user_id=$2 FOR UPDATE`, [applicationId,userId],
      )).rows[0];
      if (!application) throw new NotFoundException('Organization application not found.');
      if (prior) return this.publicApplication(application);
      if (next === 'SUBMITTED') {
        const verified = (await client.query<{id:string}>(
          `SELECT id FROM authentication_identities WHERE user_id=$1 AND identity_type='EMAIL_PASSWORD'
           AND organization_id IS NULL AND status='ACTIVE' AND email_verified_at IS NOT NULL`, [userId],
        )).rows[0];
        if (!verified) throw new ForbiddenException('Verify your email before submitting an organization application.');
        if (!['DRAFT','NEEDS_INFORMATION'].includes(application.status)) throw new BadRequestException('This application cannot be submitted in its current state.');
      } else if (!['DRAFT','SUBMITTED','NEEDS_INFORMATION'].includes(application.status)) {
        throw new BadRequestException('This application cannot be cancelled in its current state.');
      }
      const updated = (await client.query<ApplicationRow>(
        `UPDATE organization_applications SET status=$2,submitted_at=CASE WHEN $2='SUBMITTED' THEN now() ELSE submitted_at END,updated_at=now()
         WHERE id=$1
         RETURNING ${applicationColumns}`, [applicationId,next],
      )).rows[0];
      await this.transitionAudit(client,applicationId,userId,application.status,next,idempotencyKey,{});
      return this.publicApplication(updated);
    });
  }

  private async dispatch(tokenId: string, email: string, rawToken: string, expiresAt: string): Promise<DeliveryStatus> {
    try {
      const outcome = await this.verificationDelivery.deliver({ email, token: rawToken, expiresAt });
      await this.database.query(
        `UPDATE public_account_verification_deliveries
         SET status=$2,delivered_at=CASE WHEN $2='DELIVERED' THEN now() ELSE NULL END,updated_at=now(),failure_code=NULL
         WHERE token_id=$1`, [tokenId,outcome.status],
      );
      return outcome.status;
    } catch {
      await this.database.query(
        `UPDATE public_account_verification_deliveries
         SET status='FAILED',failure_code='DELIVERY_FAILED',updated_at=now() WHERE token_id=$1`, [tokenId],
      );
      return 'FAILED';
    }
  }

  private async transitionAudit(client: PoolClient, applicationId: string, actorUserId: string, from: ApplicationStatus | null, to: ApplicationStatus, idempotencyKey: string, metadata: Record<string, unknown>) {
    await client.query(
      `INSERT INTO organization_application_transitions(application_id,actor_user_id,from_status,to_status,idempotency_key,metadata)
       VALUES($1,$2,$3,$4,$5,$6::jsonb)`, [applicationId,actorUserId,from,to,idempotencyKey,JSON.stringify(metadata)],
    );
    await this.audit(client,actorUserId,`organization_application.${to.toLowerCase()}`,'organization_application',applicationId,{});
  }

  private async audit(client: PoolClient, actorUserId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
    await client.query(
      `INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata)
       VALUES(NULL,$1,$2,$3,$4,$5::jsonb)`, [actorUserId,action,targetType,targetId,JSON.stringify(metadata)],
    );
  }

  private publicApplication(row: ApplicationRow) {
    return {
      id: row.id,
      organizationName: row.organization_name,
      preferredSlug: row.preferred_slug,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      details: row.details,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
      reviewNote: row.review_note,
      reviewedAt: row.reviewed_at,
      assignedSlug: row.assigned_slug ?? null,
    };
  }
  private platformApplication(row: PlatformApplicationRow) {
    return { ...this.publicApplication(row), applicant: { email: row.applicant_email, displayName: row.applicant_display_name } };
  }
  private async approvedResult(client: PoolClient, application: ApplicationRow) {
    if (!application.provisioned_organization_id) throw new BadRequestException('Approved application is missing its provisioned organization.');
    const organization = (await client.query<{slug:string;status:string}>(
      'SELECT slug,status FROM organizations WHERE id=$1', [application.provisioned_organization_id],
    )).rows[0];
    if (!organization) throw new NotFoundException('Provisioned organization not found.');
    return { ...this.publicApplication(application), assignedSlug: organization.slug, organizationStatus: organization.status };
  }
  private async platform(userId: string) {
    const user = (await this.database.query<{is_platform_admin:boolean}>(
      'SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId],
    )).rows[0];
    if (!user?.is_platform_admin) throw new ForbiddenException();
  }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private email(value: string | undefined) { const normalized = value?.trim().toLowerCase(); if (!normalized || !emailPattern.test(normalized) || normalized.length > 320) throw new BadRequestException('A valid email is required.'); return normalized; }
  private displayName(value: string | undefined) { const normalized = value?.trim(); if (!normalized || normalized.length < 2 || normalized.length > 160) throw new BadRequestException('A valid display name is required.'); return normalized; }
  private password(value: string | undefined) { if (!value || value.length < 10 || value.length > 200) throw new BadRequestException('Password must be between 10 and 200 characters.'); return value; }
  private organizationName(value: string | undefined) { const normalized = value?.trim(); if (!normalized || normalized.length < 2 || normalized.length > 160) throw new BadRequestException('A valid organization name is required.'); return normalized; }
  private preferredSlug(value: string | undefined) { if (!value?.trim()) return null; const normalized = value.trim().toLowerCase(); if (!slugPattern.test(normalized)) throw new BadRequestException('Preferred slug is invalid.'); return normalized; }
  private phone(value: string | undefined) { if (!value?.trim()) return null; const normalized = value.trim(); if (normalized.length < 5 || normalized.length > 40) throw new BadRequestException('Contact phone is invalid.'); return normalized; }
  private details(value: Record<string, unknown> | undefined) { if (!value) return {}; if (Array.isArray(value) || typeof value !== 'object' || JSON.stringify(value).length > 10_000) throw new BadRequestException('Application details are invalid.'); return value; }
  private reviewNote(value: string | undefined, required: boolean) { const normalized=value?.trim() ?? ''; if (required && !normalized) throw new BadRequestException('A review note is required.'); if (normalized.length > 1000) throw new BadRequestException('Review note is too long.'); return normalized || null; }
  private approvedSlug(value: string | undefined) { const normalized=value?.trim().toLowerCase(); if (!normalized || !slugPattern.test(normalized)) throw new BadRequestException('A valid approved organization slug is required.'); return normalized; }
  private idempotencyKey(value: string | undefined) { if (!value || !uuidPattern.test(value)) throw new BadRequestException('A valid idempotency key is required.'); return value; }
  private uniqueViolation(cause: unknown) { return typeof cause === 'object' && cause !== null && 'code' in cause && (cause as {code?:string}).code === '23505'; }
}
