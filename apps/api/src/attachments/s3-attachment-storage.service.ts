import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { attachmentStorageConfig } from '../config.js';
import { AttachmentStorage, StoredObject } from './attachment-storage.js';

@Injectable()
export class S3AttachmentStorageService implements AttachmentStorage {
  private readonly config = attachmentStorageConfig();
  private readonly client = new S3Client({
    region: this.config.region,
    endpoint: this.config.endpoint,
    forcePathStyle: true,
    credentials: this.config.accessKeyId && this.config.secretAccessKey ? { accessKeyId: this.config.accessKeyId, secretAccessKey: this.config.secretAccessKey } : undefined,
  });

  async createUploadUrl(key: string, contentType: string, expiresInSeconds: number, metadata?: Record<string,string>) {
    this.assertConfigured();
    return getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.config.bucket, Key: key, ContentType: contentType, Metadata: metadata }), { expiresIn: expiresInSeconds });
  }

  async createDownloadUrl(key: string, filename: string, expiresInSeconds: number) {
    this.assertConfigured();
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.config.bucket, Key: key, ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(filename)}` }), { expiresIn: expiresInSeconds });
  }

  async createViewUrl(key: string, expiresInSeconds: number) {
    this.assertConfigured();
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.config.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async head(key: string): Promise<StoredObject | undefined> {
    this.assertConfigured();
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }));
      return { contentType: result.ContentType, contentLength: result.ContentLength, metadata: result.Metadata };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return undefined;
      throw error;
    }
  }

  async read(key: string) {
    this.assertConfigured();
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: key }));
    if (!result.Body) throw new ServiceUnavailableException('Stored attachment is unavailable');
    return result.Body.transformToByteArray();
  }

  async delete(key: string) {
    this.assertConfigured();
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  private assertConfigured() {
    if (!this.config.accessKeyId || !this.config.secretAccessKey || !this.config.bucket) throw new ServiceUnavailableException('Attachment storage is not configured');
  }
}
