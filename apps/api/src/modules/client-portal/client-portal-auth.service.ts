import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { PortalLoginDto } from './dto/portal-login.dto';
import { CreatePortalUserDto } from './dto/create-portal-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class ClientPortalAuthService {
  private readonly logger = new Logger(ClientPortalAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: PortalLoginDto) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: dto.orgCode, isActive: true },
    });
    if (!org) {
      await bcrypt.compare(dto.password, '$2b$12$invalid.hash.to.prevent.timing.attacks');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const clientUser = await this.prisma.clientUser.findFirst({
      where: { email: dto.email, orgId: org.id, isActive: true },
      include: { client: { select: { name: true } } },
    });
    if (!clientUser) {
      await bcrypt.compare(dto.password, '$2b$12$invalid.hash.to.prevent.timing.attacks');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(dto.password, clientUser.passwordHash);
    if (!valid)
      throw new UnauthorizedException('Credenciales inválidas');
    const payload = {
      sub: clientUser.id,
      email: clientUser.email,
      clientId: clientUser.clientId,
      orgId: clientUser.orgId,
      type: 'portal',
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('auth.jwtSecret'),
      expiresIn: '7d',
    });
    await this.prisma.clientUser.update({
      where: { id: clientUser.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      accessToken,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        clientId: clientUser.clientId,
        clientName: clientUser.client.name,
        orgId: clientUser.orgId,
        orgName: org.name,
      },
    };
  }

  async createPortalAccess(orgId: string, dto: CreatePortalUserDto) {
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, orgId } });
    if (!client)
      throw new NotFoundException('Cliente no encontrado');
    const existing = await this.prisma.clientUser.findFirst({
      where: { email: dto.email, orgId },
    });
    if (existing)
      throw new ConflictException('Ya existe un acceso portal con ese email para esta organización');
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const clientUser = await this.prisma.clientUser.create({
      data: {
        email: dto.email,
        passwordHash,
        clientId: dto.clientId,
        orgId,
      },
      include: { client: { select: { name: true } } },
    });
    return {
      id: clientUser.id,
      email: clientUser.email,
      clientId: clientUser.clientId,
      clientName: clientUser.client.name,
      isActive: clientUser.isActive,
      createdAt: clientUser.createdAt,
    };
  }

  async listPortalUsers(orgId: string) {
    const users = await this.prisma.clientUser.findMany({
      where: { orgId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      clientId: u.clientId,
      clientName: u.client.name,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  }

  async revokePortalAccess(id: string, orgId: string) {
    const user = await this.prisma.clientUser.findFirst({ where: { id, orgId } });
    if (!user)
      throw new NotFoundException('Usuario de portal no encontrado');
    await this.prisma.clientUser.delete({ where: { id } });
  }

  async getMe(clientUserId: string, orgId: string) {
    const clientUser = await this.prisma.clientUser.findFirst({
      where: { id: clientUserId, orgId },
      include: {
        client: { select: { name: true } },
        org: { select: { name: true, slug: true } },
      },
    });
    if (!clientUser)
      throw new UnauthorizedException();
    return {
      id: clientUser.id,
      email: clientUser.email,
      clientId: clientUser.clientId,
      clientName: clientUser.client.name,
      orgName: clientUser.org.name,
      orgSlug: clientUser.org.slug,
    };
  }
}
