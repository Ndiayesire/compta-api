import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './modules/company/company.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionsModule } from './modules/settings/regions/regions.module';
import { CountriesModule } from './modules/settings/countries/countries.module';
import { PaymentMethodsModule } from './modules/settings/payment-methods/payment-methods.module';
import { RolesModule } from './modules/settings/roles/roles.module';
import { PermissionsModule } from './modules/settings/permissions/permissions.module';

@Module({
  imports: [CompanyModule, PrismaModule, RegionsModule, CountriesModule, PaymentMethodsModule, RolesModule, PermissionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
