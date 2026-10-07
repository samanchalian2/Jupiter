import { Module } from '@nestjs/common';
import { PersonalWorkspaceService } from './personal-workspace.service.js';

@Module({
  providers: [PersonalWorkspaceService],
  exports: [PersonalWorkspaceService],
})
export class PersonalWorkspaceModule {}
