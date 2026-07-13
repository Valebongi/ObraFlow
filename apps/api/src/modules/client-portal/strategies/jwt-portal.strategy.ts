import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtPortalStrategy extends PassportStrategy(Strategy, 'jwt-portal') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwtSecret'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'portal') {
      throw new UnauthorizedException('Token de portal inválido');
    }
    const clientUser = await this.prisma.clientUser.findFirst({
      where: { id: payload.sub, isActive: true },
    });
    if (!clientUser)
      throw new UnauthorizedException('Acceso al portal denegado');
    return {
      sub: clientUser.id,
      email: clientUser.email,
      clientId: clientUser.clientId,
      orgId: clientUser.orgId,
      type: 'portal' as const,
    };
  }
}
