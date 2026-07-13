import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CrewsModule } from './modules/crews/crews.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { WorkersModule } from './modules/workers/workers.module';
import { SubcontractorsModule } from './modules/subcontractors/subcontractors.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { MailModule } from './modules/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ClientPortalModule } from './modules/client-portal/client-portal.module';
import { BillingModule } from './modules/billing/billing.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import configuration from './config/configuration';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    WorkOrdersModule,
    ClientsModule,
    CrewsModule,
    MaterialsModule,
    TimesheetsModule,
    WorkersModule,
    SubcontractorsModule,
    LocationsModule,
    ContractsModule,
    VehiclesModule,
    MailModule,
    NotificationsModule,
    ClientPortalModule,
    BillingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
