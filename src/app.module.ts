import { Module, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { CorsMiddleware } from './common/middleware/cors/cors.middleware';
import { CurrencyModule } from './modules/settings/currency/currency.module';
import { LegalFormsModule } from './modules/settings/legal-forms/legal-forms.module';
import { MorganMiddleware } from './common/middleware/logger/logger.middleware';

@Module({
  imports: [CompanyModule, PrismaModule, RegionsModule, CountriesModule, PaymentMethodsModule, RolesModule, PermissionsModule, AuthModule, UsersModule, CurrencyModule, LegalFormsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware, MorganMiddleware)
      .forRoutes('*');
  }
}
