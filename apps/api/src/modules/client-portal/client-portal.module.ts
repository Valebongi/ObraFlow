import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ClientPortalAuthService } from './client-portal-auth.service';
import { ClientPortalService } from './client-portal.service';
import { ClientPortalAuthController } from './client-portal-auth.controller';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalAdminController } from './client-portal-admin.controller';
import { JwtPortalStrategy } from './strategies/jwt-portal.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwtSecret'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [ClientPortalAuthController, ClientPortalController, ClientPortalAdminController],
  providers: [ClientPortalAuthService, ClientPortalService, JwtPortalStrategy],
})
export class ClientPortalModule {}
