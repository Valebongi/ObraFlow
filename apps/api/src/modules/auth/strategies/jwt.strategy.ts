import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload, UserRole } from '@obraflow/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        orgId: payload.orgId,
        isActive: true,
      },
      select: { id: true, email: true, role: true, orgId: true, isActive: true },
    });
    if (!user)
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    return {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      orgId: user.orgId,
    };
  }
}
