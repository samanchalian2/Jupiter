import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { HELP_AUDIENCES, type HelpAudience } from './help-seed.js';

type Viewer = { userId?: string; audiences: HelpAudience[] };
type ArticleRow = { slug:string; title:string; summary:string; content?:string; category:string; audience:string[]; tags:string[]; product_area:string; related_feature:string|null; related_route:string|null; version:number; published_at:string };
type AdminRow = ArticleRow & { article_id:string; article_status:string; current_published_revision_id:string|null; revision_id:string; publication_status:string; source:string; created_at:string };
type HelpInput = { slug?:string; title?:string; summary?:string; content?:string; category?:string; audience?:string[]; tags?:string[]; productArea?:string; relatedFeature?:string|null; relatedRoute?:string|null };

@Injectable()
export class ProductHelpService {
  constructor(private readonly database: DatabaseService) {}

  private async platform(userId: string) {
    const user = (await this.database.query<{ is_platform_admin:boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId])).rows[0];
    if (!user?.is_platform_admin) throw new ForbiddenException();
  }

  private id(value: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new NotFoundException('مقالهٔ راهنما یافت نشد.'); return value; }

  private input(value: HelpInput, includeSlug = false) {
    const text = (item: unknown, name: string, min: number, max: number, required = true) => {
      const result = typeof item === 'string' ? item.trim() : '';
      if ((required && (result.length < min || result.length > max)) || (!required && result.length > max)) throw new BadRequestException(`${name} معتبر نیست.`);
      return result || null;
    };
    const slug = includeSlug ? text(value.slug, 'شناسهٔ مقاله', 3, 121)! : undefined;
    if (slug && !/^[a-z0-9][a-z0-9-]{2,120}$/.test(slug)) throw new BadRequestException('شناسهٔ مقاله معتبر نیست.');
    const audience = Array.isArray(value.audience) ? [...new Set(value.audience.map(item => item.trim()))] : [];
    const tags = Array.isArray(value.tags) ? [...new Set(value.tags.map(item => item.trim()).filter(Boolean))] : [];
    if (!audience.length || audience.some(item => !HELP_AUDIENCES.includes(item as HelpAudience)) || tags.length > 20 || tags.some(item => item.length > 80)) throw new BadRequestException('مخاطب یا برچسب مقاله معتبر نیست.');
    const relatedRoute = text(value.relatedRoute, 'مسیر مرتبط', 1, 500, false);
    if (relatedRoute && (!relatedRoute.startsWith('/') || /\s/.test(relatedRoute))) throw new BadRequestException('مسیر مرتبط معتبر نیست.');
    return { slug, title:text(value.title,'عنوان',3,200)!, summary:text(value.summary,'خلاصه',3,600)!, content:text(value.content,'متن',1,50000)!, category:text(value.category,'دسته',2,100)!, audience, tags, productArea:text(value.productArea,'بخش محصول',2,100)!, relatedFeature:text(value.relatedFeature,'قابلیت مرتبط',1,100,false), relatedRoute };
  }

  private async audit(client: { query:(sql:string, values?:unknown[])=>Promise<unknown> }, actorId:string, action:string, articleId:string, metadata:Record<string,unknown>) {
    await client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES(NULL,$1,$2,$3,$4,$5)', [actorId, action, 'product_help_article', articleId, metadata]);
  }

  async viewer(userId?: string): Promise<Viewer> {
    if (!userId) return { audiences: ['ALL'] };
    const user = (await this.database.query<{ is_platform_admin:boolean }>('SELECT is_platform_admin FROM users WHERE id=$1 AND is_active=true', [userId])).rows[0];
    if (!user) return { audiences: ['ALL'] };
    const roles = (await this.database.query<{ code:HelpAudience }>(`SELECT DISTINCT r.code FROM memberships m JOIN membership_roles mr ON mr.membership_id=m.id JOIN roles r ON r.id=mr.role_id WHERE m.user_id=$1 AND m.status='active'`, [userId])).rows.map(row => row.code);
    const audiences: HelpAudience[] = ['ALL'];
    if (user.is_platform_admin) audiences.push('PLATFORM_ADMIN');
    audiences.push(...roles);
    return { userId, audiences: [...new Set(audiences)] };
  }

  private select(content: boolean) {
    return `SELECT article.slug,revision.title,revision.summary,${content ? 'revision.content,' : ''}revision.category,revision.audience,revision.tags,revision.product_area,revision.related_feature,revision.related_route,revision.version,revision.published_at
      FROM product_help_articles article JOIN product_help_article_revisions revision ON revision.id=article.current_published_revision_id
      WHERE article.status='PUBLISHED' AND revision.publication_status='PUBLISHED' AND revision.audience && $1::text[]`;
  }

  private map(row: ArticleRow, content: boolean) {
    const result = { slug:row.slug, title:row.title, summary:row.summary, category:row.category, audience:row.audience, tags:row.tags, productArea:row.product_area, relatedFeature:row.related_feature, relatedRoute:row.related_route, version:row.version, publishedAt:row.published_at } as Record<string, unknown>;
    if (content) result.content = row.content;
    return result;
  }

  async list(userId?: string, input: { q?:string; category?:string; relatedRoute?:string; relatedFeature?:string } = {}) {
    const viewer = await this.viewer(userId); const q = input.q?.trim() ?? '';
    const rows = (await this.database.query<ArticleRow>(`${this.select(false)} AND ($2='' OR revision.title ILIKE $3 OR revision.summary ILIKE $3) AND ($4='' OR revision.category=$4) AND ($5='' OR revision.related_route=$5) AND ($6='' OR revision.related_feature=$6) ORDER BY revision.published_at DESC,revision.title`, [viewer.audiences, q, `%${q}%`, input.category?.trim() ?? '', input.relatedRoute?.trim() ?? '', input.relatedFeature?.trim() ?? ''])).rows;
    return rows.map(row => this.map(row, false));
  }

  async detail(userId: string | undefined, slug: string) {
    const viewer = await this.viewer(userId);
    const row = (await this.database.query<ArticleRow>(`${this.select(true)} AND article.slug=$2`, [viewer.audiences, slug])).rows[0];
    if (!row) throw new NotFoundException('مقالهٔ راهنما یافت نشد.');
    return this.map(row, true);
  }

  private adminMap(row: AdminRow, content = true) {
    return { id:row.article_id, revisionId:row.revision_id, slug:row.slug, title:row.title, summary:row.summary, ...(content ? { content:row.content ?? '' } : {}), category:row.category, audience:row.audience, tags:row.tags, productArea:row.product_area, relatedFeature:row.related_feature, relatedRoute:row.related_route, version:row.version, status:row.article_status, publicationStatus:row.publication_status, source:row.source, publishedAt:row.published_at, createdAt:row.created_at };
  }

  private adminSelect() {
    return `SELECT article.id AS article_id,article.slug,article.status AS article_status,article.current_published_revision_id,revision.id AS revision_id,revision.title,revision.summary,revision.content,revision.category,revision.audience,revision.tags,revision.product_area,revision.related_feature,revision.related_route,revision.version,revision.publication_status,revision.source,revision.published_at,revision.created_at
      FROM product_help_articles article JOIN product_help_article_revisions revision ON revision.article_id=article.id`;
  }

  async adminList(actorId:string, q = '') {
    await this.platform(actorId); const query = q.trim();
    const rows = (await this.database.query<AdminRow>(`${this.adminSelect()} WHERE revision.id=COALESCE(article.current_published_revision_id,(SELECT latest.id FROM product_help_article_revisions latest WHERE latest.article_id=article.id ORDER BY latest.version DESC LIMIT 1)) AND ($1='' OR article.slug ILIKE $2 OR revision.title ILIKE $2 OR revision.summary ILIKE $2 OR $1 = ANY(revision.tags)) ORDER BY revision.created_at DESC`, [query, `%${query}%`])).rows;
    return rows.map(row => this.adminMap(row, false));
  }

  async adminDetail(actorId:string, articleId:string) {
    await this.platform(actorId); this.id(articleId);
    const rows = (await this.database.query<AdminRow>(`${this.adminSelect()} WHERE article.id=$1 ORDER BY revision.version DESC`, [articleId])).rows;
    if (!rows.length) throw new NotFoundException('مقالهٔ راهنما یافت نشد.');
    const current = rows.find(row => row.revision_id === row.current_published_revision_id) ?? rows[0];
    return { article: this.adminMap(current), revisions: rows.map(row => this.adminMap(row, false)) };
  }

  async create(actorId:string, raw:HelpInput) {
    await this.platform(actorId); const value = this.input(raw, true);
    return this.database.transaction(async client => {
      let article;
      try { article = (await client.query<{id:string}>('INSERT INTO product_help_articles(slug,status) VALUES($1,\'UNPUBLISHED\') RETURNING id', [value.slug])).rows[0]; }
      catch (cause: unknown) { if ((cause as { code?:string }).code === '23505') throw new ConflictException('این شناسهٔ مقاله قبلاً استفاده شده است.'); throw cause; }
      const revision = (await client.query<{id:string;version:number}>(`INSERT INTO product_help_article_revisions(article_id,version,title,summary,content,category,audience,tags,product_area,related_feature,related_route,publication_status,source,created_by_user_id) VALUES($1,1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT','RUNTIME',$11) RETURNING id,version`, [article.id,value.title,value.summary,value.content,value.category,value.audience,value.tags,value.productArea,value.relatedFeature,value.relatedRoute,actorId])).rows[0];
      await this.audit(client,actorId,'help.article_created',article.id,{slug:value.slug,revisionId:revision.id,version:revision.version});
      return { id:article.id, revisionId:revision.id, status:'UNPUBLISHED', publicationStatus:'DRAFT', version:revision.version };
    });
  }

  async draft(actorId:string, articleId:string, raw:HelpInput) {
    await this.platform(actorId); this.id(articleId); const value = this.input(raw);
    return this.database.transaction(async client => {
      const article = (await client.query<{id:string}>('SELECT id FROM product_help_articles WHERE id=$1 FOR UPDATE', [articleId])).rows[0]; if (!article) throw new NotFoundException('مقالهٔ راهنما یافت نشد.');
      const revision = (await client.query<{id:string;version:number}>(`INSERT INTO product_help_article_revisions(article_id,version,title,summary,content,category,audience,tags,product_area,related_feature,related_route,publication_status,source,created_by_user_id) SELECT $1,COALESCE(max(version),0)+1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT','RUNTIME',$11 FROM product_help_article_revisions WHERE article_id=$1 RETURNING id,version`, [articleId,value.title,value.summary,value.content,value.category,value.audience,value.tags,value.productArea,value.relatedFeature,value.relatedRoute,actorId])).rows[0];
      await this.audit(client,actorId,'help.draft_created',articleId,{revisionId:revision.id,version:revision.version});
      return { id:articleId, revisionId:revision.id, publicationStatus:'DRAFT', version:revision.version };
    });
  }

  async preview(actorId:string, articleId:string, revisionId:string) {
    await this.platform(actorId); this.id(articleId); this.id(revisionId);
    const row = (await this.database.query<AdminRow>(`${this.adminSelect()} WHERE article.id=$1 AND revision.id=$2`, [articleId,revisionId])).rows[0];
    if (!row) throw new NotFoundException('نسخهٔ راهنما یافت نشد.'); return this.adminMap(row);
  }

  async publish(actorId:string, articleId:string, revisionId:string) {
    await this.platform(actorId); this.id(articleId); this.id(revisionId);
    return this.database.transaction(async client => {
      const revision = (await client.query<{id:string;version:number}>('SELECT id,version FROM product_help_article_revisions WHERE id=$1 AND article_id=$2 FOR UPDATE', [revisionId,articleId])).rows[0]; if (!revision) throw new NotFoundException('نسخهٔ راهنما یافت نشد.');
      await client.query("UPDATE product_help_article_revisions SET publication_status='UNPUBLISHED' WHERE article_id=$1 AND publication_status='PUBLISHED'", [articleId]);
      await client.query("UPDATE product_help_article_revisions SET publication_status='PUBLISHED',published_at=COALESCE(published_at,now()) WHERE id=$1", [revisionId]);
      await client.query("UPDATE product_help_articles SET status='PUBLISHED',current_published_revision_id=$1,updated_at=now() WHERE id=$2", [revisionId,articleId]);
      await this.audit(client,actorId,'help.article_published',articleId,{revisionId,version:revision.version}); return { id:articleId,revisionId,status:'PUBLISHED' };
    });
  }

  async unpublish(actorId:string, articleId:string) {
    await this.platform(actorId); this.id(articleId);
    return this.database.transaction(async client => { const article=(await client.query<{id:string}>('UPDATE product_help_articles SET status=\'UNPUBLISHED\',updated_at=now() WHERE id=$1 RETURNING id',[articleId])).rows[0];if(!article)throw new NotFoundException('مقالهٔ راهنما یافت نشد.');await this.audit(client,actorId,'help.article_unpublished',articleId,{});return {id:articleId,status:'UNPUBLISHED'}; });
  }

  async restore(actorId:string, articleId:string, sourceRevisionId:string) {
    await this.platform(actorId); this.id(articleId); this.id(sourceRevisionId);
    return this.database.transaction(async client => {
      const article=(await client.query<{id:string}>('SELECT id FROM product_help_articles WHERE id=$1 FOR UPDATE',[articleId])).rows[0];if(!article)throw new NotFoundException('مقالهٔ راهنما یافت نشد.');
      const revision=(await client.query<{id:string;version:number}>(`INSERT INTO product_help_article_revisions(article_id,version,title,summary,content,category,audience,tags,product_area,related_feature,related_route,publication_status,source,created_by_user_id) SELECT article_id,(SELECT COALESCE(max(version),0)+1 FROM product_help_article_revisions WHERE article_id=$1),title,summary,content,category,audience,tags,product_area,related_feature,related_route,'DRAFT','RUNTIME',$3 FROM product_help_article_revisions WHERE id=$2 AND article_id=$1 RETURNING id,version`,[articleId,sourceRevisionId,actorId])).rows[0];if(!revision)throw new NotFoundException('نسخهٔ راهنما یافت نشد.');await this.audit(client,actorId,'help.article_restored_to_draft',articleId,{sourceRevisionId,revisionId:revision.id,version:revision.version});return{id:articleId,revisionId:revision.id,publicationStatus:'DRAFT',version:revision.version};
    });
  }

  async export(actorId:string, input:{format?:string;slug?:string;category?:string}) {
    await this.platform(actorId); const format=(input.format??'JSON').toUpperCase(); if(!['JSON','MARKDOWN'].includes(format)||input.slug&&input.category)throw new BadRequestException('درخواست خروجی معتبر نیست.');
    const rows=(await this.database.query<ArticleRow>(`${this.select(true)} AND ($2='' OR article.slug=$2) AND ($3='' OR revision.category=$3) ORDER BY revision.category,revision.title`,[['ALL','REQUESTER','EXPERT','SUPERVISOR','ORG_ADMIN','ORG_OWNER','PLATFORM_ADMIN'],input.slug?.trim()??'',input.category?.trim()??''])).rows.map(row=>this.map(row,true));
    const filename=`jupiter-help${input.slug?'-'+input.slug:input.category?'-'+input.category.replace(/[^\w-]+/g,'-'):''}.${format==='JSON'?'json':'md'}`;
    const content=format==='JSON'?JSON.stringify({generatedAt:new Date().toISOString(),articles:rows},null,2):(rows as Array<Record<string,unknown>>).map(article=>`---\nslug: ${article.slug}\ntitle: ${article.title}\ncategory: ${article.category}\naudience: ${JSON.stringify(article.audience)}\ntags: ${JSON.stringify(article.tags)}\nproductArea: ${article.productArea}\nrelatedFeature: ${article.relatedFeature??''}\nrelatedRoute: ${article.relatedRoute??''}\nversion: ${article.version}\n---\n\n${article.content}`).join('\n\n---\n\n');
    await this.database.transaction(client=>client.query('INSERT INTO audit_logs(organization_id,actor_user_id,action,target_type,target_id,metadata) VALUES(NULL,$1,$2,$3,NULL,$4)',[actorId,'help.exported','product_help_export',{format,slug:input.slug??null,category:input.category??null,count:rows.length}]));
    return { format, filename, content };
  }
}
