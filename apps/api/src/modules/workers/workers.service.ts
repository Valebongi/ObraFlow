import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResponse } from '@obraflow/shared';

export class CreateWorkerDto {
  name: string;
  rut?: string;
  role?: string;
  phone?: string;
  email?: string;
  hourlyRate?: number;
  crewId?: string;
}

export class UpdateWorkerDto {
  name?: string;
  rut?: string;
  role?: string;
  phone?: string;
  email?: string;
  hourlyRate?: number;
  crewId?: string | null;
  status?: string;
}

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    orgId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const where: any = { orgId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { role: { contains: search } },
        { rut: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.worker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { crew: { select: { id: true, name: true } } },
      }),
      this.prisma.worker.count({ where }),
    ]);
    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(id: string, orgId: string) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, orgId },
      include: { crew: { select: { id: true, name: true } } },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async create(orgId: string, dto: CreateWorkerDto) {
    return this.prisma.worker.create({
      data: {
        name: dto.name,
        ...(dto.rut !== undefined && { rut: dto.rut }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.crewId ? { crew: { connect: { id: dto.crewId } } } : {}),
        org: { connect: { id: orgId } },
      },
      include: { crew: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, orgId: string, dto: UpdateWorkerDto) {
    await this.findOne(id, orgId);
    return this.prisma.worker.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.rut !== undefined && { rut: dto.rut }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.crewId !== undefined && (dto.crewId ? { crew: { connect: { id: dto.crewId } } } : { crewId: null })),
      },
      include: { crew: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.prisma.worker.delete({ where: { id } });
  }
}
