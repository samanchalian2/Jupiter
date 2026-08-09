import { Module } from '@nestjs/common';
import { TicketModule } from '../tickets/ticket.module.js';
import { AttachmentController } from './attachment.controller.js';
import { AttachmentService } from './attachment.service.js';
import { S3AttachmentStorageService } from './s3-attachment-storage.service.js';

@Module({ imports: [TicketModule], controllers: [AttachmentController], providers: [AttachmentService, { provide: 'AttachmentStorage', useExisting: S3AttachmentStorageService }, S3AttachmentStorageService] })
export class AttachmentModule {}
