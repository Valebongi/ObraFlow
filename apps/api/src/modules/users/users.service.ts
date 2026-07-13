import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@obraflow/shared';

const BCRYPT_ROUNDS = 12;

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: false,
};

export class CreateUserDto {
  name: string;
  email: string;
  role: string;
  password: string;
}

export class UpdateUserDto {
  name?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { orgId },
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where: { orgId } }),
    ]);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, orgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, orgId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(orgId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, orgId },
    });
    if (existing) {
      throw new ConflictException('Email already in use in this organization');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        passwordHash,
        orgId,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, orgId: string, dto: UpdateUserDto) {
    await this.findOne(id, orgId);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: USER_SELECT,
    });
  }

  async changePassword(id: string, orgId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, orgId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async remove(id: string, orgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, orgId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ORG_ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { orgId, role: UserRole.ORG_ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot remove the only ORG_ADMIN of the organization');
      }
    }
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
