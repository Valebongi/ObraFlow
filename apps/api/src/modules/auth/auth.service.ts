import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import {
  AuthTokens,
  JwtPayload,
  LoginResponse,
  UserRole,
  generateOrgSlug,
} from '@obraflow/shared';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<LoginResponse> {
    const slug = generateOrgSlug(dto.orgName);
    const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      throw new ConflictException('Ya existe una organización con ese nombre');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.orgName,
          slug,
          plan: 'STARTER',
        },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          role: 'ORG_ADMIN',
          orgId: org.id,
        },
      });
      return { org, user };
    });
    const tokens = await this.generateTokens(result.user.id, result.org.id, 'ORG_ADMIN', result.user.email);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role as UserRole,
        orgId: result.user.orgId,
        createdAt: result.user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { org: { select: { isActive: true } } },
    });
    if (!user || !user.org.isActive) {
      await bcrypt.compare(dto.password, '$2b$12$invalid.hash.to.prevent.timing.attack.ok');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const tokens = await this.generateTokens(user.id, user.orgId, user.role, user.email, ipAddress, userAgent);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        orgId: user.orgId,
        avatarUrl: user.avatarUrl ?? undefined,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, role: true, orgId: true, isActive: true } } },
    });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    if (!stored.user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });
    return this.generateTokens(stored.user.id, stored.user.orgId, stored.user.role, stored.user.email);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  private async generateTokens(
    userId: string,
    orgId: string,
    role: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, orgId, role: role as UserRole };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('auth.jwtSecret'),
        expiresIn: this.configService.get('auth.jwtExpiresIn', '15m'),
      }),
      this.generateRefreshToken(userId, orgId, ipAddress, userAgent),
    ]);
    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(
    userId: string,
    orgId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    await this.prisma.refreshToken.create({
      data: { token, userId, orgId, expiresAt, ipAddress, userAgent },
    });
    const oldTokens = await this.prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });
    if (oldTokens.length > 10) {
      const toRevoke = oldTokens.slice(0, oldTokens.length - 10);
      await this.prisma.refreshToken.updateMany({
        where: { id: { in: toRevoke.map((t) => t.id) } },
        data: { isRevoked: true },
      });
    }
    return token;
  }

  async getMe(userId: string, orgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, orgId },
      include: {
        org: {
          select: { id: true, name: true, slug: true, plan: true, logoUrl: true, timezone: true, currency: true },
        },
      },
    });
    if (!user)
      throw new UnauthorizedException();
    return user;
  }
}
