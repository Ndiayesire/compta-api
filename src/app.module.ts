import { Module, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './modules/company/company.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionsModule } from './modules/settings/regions/regions.module';
import { CountriesModule } from './modules/settings/countries/countries.module';
import { PaymentMethodsModule } from './modules/settings/payment-methods/payment-methods.module';
import { RolesModule } from './modules/settings/roles/roles.module';
import { PermissionsModule } from './modules/settings/permissions/permissions.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/jwt/jwt-auth.guard';
// import { CorsMiddleware } from './common/middleware/cors/cors.middleware';
import { CurrencyModule } from './modules/settings/currency/currency.module';
import { LegalFormsModule } from './modules/settings/legal-forms/legal-forms.module';
import { MorganMiddleware } from './common/middleware/logger/logger.middleware';
import { ClientsModule } from './modules/clients/clients.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ContractTypesModule } from './modules/settings/contract-types/contract-types.module';
import { GendersModule } from './modules/settings/genders/genders.module';
import { LanguagesModule } from './modules/settings/languages/languages.module';
import { TierTypesModule } from './modules/settings/tier-types/tier-types.module';
import { TiersModule } from './modules/tiers/tiers.module';
import { EmployeeContractsModule } from './modules/employee-contracts/employee-contracts.module';
import { DocumentCategoriesModule } from './modules/settings/document-categories/document-categories.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IdentificationTypesModule } from './modules/settings/identification-types/identification-types.module';
import { AccountingYearsModule } from './modules/accounting-years/accounting-years.module';
import { AccountingQuartersModule } from './modules/accounting-quarters/accounting-quarters.module';
import { AppMetaModule } from './modules/app-meta/app-meta.module';
import { TiersTransactionsModule } from './modules/tiers-transactions/tiers-transactions.module';
import { RentalUsagesModule } from './modules/rental-usages/rental-usages.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { BalancesModule } from './modules/balances/balances.module';
import { HttpLatencyInterceptor } from './common/interceptors/http-latency/http-latency.interceptor';
// import { MailerModule } from './modules/mailer/mailer.module';

@Module({
  imports: [
    CompanyModule,
    PrismaModule,
    RegionsModule,
    CountriesModule,
    PaymentMethodsModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    CurrencyModule,
    LegalFormsModule,
    DocumentCategoriesModule,
    ClientsModule,
    EmployeesModule,
    EmployeeContractsModule,
    ContractTypesModule,
    GendersModule,
    LanguagesModule,
    TierTypesModule,
    TiersModule,
    AccountingYearsModule,
    AccountingQuartersModule,
    AppMetaModule,
    TiersTransactionsModule,
    RentalUsagesModule,
    RentalsModule,
    BalancesModule,
    DocumentsModule,
    ActivitiesModule,
    NotificationsModule,
    IdentificationTypesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLatencyInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(/*CorsMiddleware, */MorganMiddleware)
      .forRoutes('*');
  }
}
