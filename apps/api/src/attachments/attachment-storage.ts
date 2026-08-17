export type StoredObject = { contentType?: string; contentLength?: number };
export interface AttachmentStorage {
  createUploadUrl(key: string, contentType: string, expiresInSeconds: number): Promise<string>;
  createDownloadUrl(key: string, filename: string, expiresInSeconds: number): Promise<string>;
  createViewUrl(key: string, expiresInSeconds: number): Promise<string>;
  head(key: string): Promise<StoredObject | undefined>;
}
