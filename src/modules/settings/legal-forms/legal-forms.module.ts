import { Module } from '@nestjs/common';
import { LegalFormsController } from './legal-forms.controller';
import { LegalFormsService } from './legal-forms.service';

@Module({
  controllers: [LegalFormsController],
  providers: [LegalFormsService]
})
export class LegalFormsModule {}
