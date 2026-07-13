import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResponse } from '@obraflow/shared';

export class CreateClientDto {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export class UpdateClientDto {
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

const ACTIVE_WO_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED'];

@Injectable()
export class ClientsService {
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
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.count({ where }),
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
    const client = await this.prisma.client.findFirst({
      where: { id, orgId },
      include: {
        locations: true,
        contracts: true,
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(orgId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        name: dto.name,
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        orgId,
      },
    });
  }

  async update(id: string, orgId: string, dto: UpdateClientDto) {
    await this.findOne(id, orgId);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    const activeWOs = await this.prisma.workOrder.count({
      where: {
        clientId: id,
        orgId,
        status: { in: ACTIVE_WO_STATUSES },
      },
    });
    if (activeWOs > 0) {
      throw new BadRequestException(
        `Cannot delete client with ${activeWOs} active work order(s)`,
      );
    }
    await this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
