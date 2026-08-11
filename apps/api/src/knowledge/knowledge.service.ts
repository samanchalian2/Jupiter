import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

type Actor = { userId: string; organizationId: string; roles: string[] };
const contributors = new Set(['ORG_ADMIN', 'SUPERVISOR', 'EXPERT']);
const reviewers = new Set(['ORG_ADMIN', 'SUPERVISOR']);

@Injectable()
export class KnowledgeService {
  constructor(private readonly database: DatabaseService) {}

  async list(actor: Actor, q = '') {
    return this.database.withOrganization(actor.organizationId, async (client) =>
      (await client.query(
        `SELECT id,title,body,status,updated_at FROM knowledge_articles
         WHERE status='PUBLISHED' AND (title ILIKE $1 OR body ILIKE $1)
         ORDER BY updated_at DESC`,
        [`%${q.trim()}%`],
      )).rows,
    );
  }

  async reviewQueue(actor: Actor) {
    this.requireReviewer(actor);
    return this.database.withOrganization(actor.organizationId, async (client) =>
      (await client.query(
        `SELECT id,title,body,status,created_at,updated_at
         FROM knowledge_articles WHERE status IN ('DRAFT','IN_REVIEW') ORDER BY updated_at`,
      )).rows,
    );
  }

  async create(actor: Actor, input: { title: string; body: string }) {
    if (!actor.roles.some((role) => contributors.has(role))) throw new ForbiddenException();
    const title = input.title?.trim();
    const body = input.body?.trim();
    if (!title || title.length < 3 || title.length > 200 || !body || body.length > 20_000) {
      throw new BadRequestException('Article title or body is invalid');
    }
    return this.database.withOrganization(actor.organizationId, async (client) =>
      (await client.query(
        `INSERT INTO knowledge_articles(organization_id,title,body,author_user_id)
         VALUES($1,$2,$3,$4) RETURNING id,title,status`,
        [actor.organizationId, title, body, actor.userId],
      )).rows[0],
    );
  }

  async submitReview(actor: Actor, id: string) {
    if (!actor.roles.some((role) => contributors.has(role))) throw new ForbiddenException();
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const result = await client.query(
        `UPDATE knowledge_articles SET status='IN_REVIEW',updated_at=now()
         WHERE id=$1 AND status='DRAFT' AND (author_user_id=$2 OR $3)
         RETURNING id,status`,
        [id, actor.userId, actor.roles.some((role) => reviewers.has(role))],
      );
      if (!result.rowCount) throw new NotFoundException('Draft article not found');
      return result.rows[0];
    });
  }

  async publish(actor: Actor, id: string) {
    this.requireReviewer(actor);
    return this.database.withOrganization(actor.organizationId, async (client) => {
      const result = await client.query(
        `UPDATE knowledge_articles
         SET status='PUBLISHED',reviewer_user_id=$1,published_at=now(),updated_at=now()
         WHERE id=$2 AND status='IN_REVIEW' RETURNING id,status`,
        [actor.userId, id],
      );
      if (!result.rowCount) throw new NotFoundException('Article awaiting review not found');
      return result.rows[0];
    });
  }

  private requireReviewer(actor: Actor) {
    if (!actor.roles.some((role) => reviewers.has(role))) throw new ForbiddenException();
  }
}
