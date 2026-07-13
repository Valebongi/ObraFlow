import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResponse } from '@obraflow/shared';

export class CreateLocationDto {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  notes?: string;
  clientId?: string;
}

export class UpdateLocationDto {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  clientId?: string | null;
}

@Injectable()
export class LocationsService {
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
        { address: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { client: { select: { id: true, name: true } } },
      }),
      this.prisma.location.count({ where }),
    ]);
    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(id: string, orgId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, orgId },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async create(orgId: string, dto: CreateLocationDto) {
    return this.prisma.location.create({
      data: {
        name: dto.name,
        address: dto.address,
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.lng !== undefined && { lng: dto.lng }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.clientId ? { client: { connect: { id: dto.clientId } } } : {}),
        org: { connect: { id: orgId } },
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, orgId: string, dto: UpdateLocationDto) {
    await this.findOne(id, orgId);
    return this.prisma.location.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.lng !== undefined && { lng: dto.lng }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.clientId !== undefined && (dto.clientId ? { client: { connect: { id: dto.clientId } } } : { clientId: null })),
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.prisma.location.delete({ where: { id } });
  }
}
