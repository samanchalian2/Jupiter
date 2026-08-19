export type StoredObject = { contentType?: string; contentLength?: number; metadata?: Record<string,string> };
export interface AttachmentStorage {
  createUploadUrl(key: string, contentType: string, expiresInSeconds: number, metadata?: Record<string,string>): Promise<string>;
  createDownloadUrl(key: string, filename: string, expiresInSeconds: number): Promise<string>;
  createViewUrl(key: string, expiresInSeconds: number): Promise<string>;
  head(key: string): Promise<StoredObject | undefined>;
  read(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}
