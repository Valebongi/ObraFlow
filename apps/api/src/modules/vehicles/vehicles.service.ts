import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      orgId,
      ...(search && {
        OR: [
          { plate: { contains: search } },
          { brand: { contains: search } },
          { model: { contains: search } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { crews: { select: { id: true, name: true } } },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { data: items, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(id: string, orgId: string) {
    const item = await this.prisma.vehicle.findFirst({ where: { id, orgId }, include: { crews: { select: { id: true, name: true } } } });
    if (!item)
      throw new NotFoundException(`Vehicle not found`);
    return item;
  }

  async create(orgId: string, dto: {
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
    status?: string;
    notes?: string;
  }) {
    return this.prisma.vehicle.create({
      data: {
        plate: dto.plate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        status: dto.status ?? 'AVAILABLE',
        notes: dto.notes,
        org: { connect: { id: orgId } },
      },
      include: { crews: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, orgId: string, dto: {
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    status?: string;
    notes?: string;
  }) {
    await this.findOne(id, orgId);
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.plate !== undefined && { plate: dto.plate }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { crews: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
