import { Module } from '@nestjs/common';
import { EtatAnnuelSommesVerseesExcelService } from './services/etat-annuel-sommes-versees-excel.service';
import { EtatTrimestrielSommesVerseesExcelService } from './services/etat-trimestriel-sommes-versees-excel.service';

/**
 * Générateurs Excel pour les états / rapports métier.
 */
@Module({
  providers: [
    EtatTrimestrielSommesVerseesExcelService,
    EtatAnnuelSommesVerseesExcelService,
  ],
  exports: [
    EtatTrimestrielSommesVerseesExcelService,
    EtatAnnuelSommesVerseesExcelService,
  ],
})
export class ExcelReportsModule {}
