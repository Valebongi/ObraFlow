import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResponse } from '@obraflow/shared';

export class CreateContractDto {
  name: string;
  code?: string;
  clientId: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  description?: string;
  isActive?: boolean;
}

export class UpdateContractDto {
  name?: string;
  code?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class ContractsService {
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
        { code: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { client: { select: { id: true, name: true } } },
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(id: string, orgId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, orgId },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async create(orgId: string, dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        name: dto.name,
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        client: { connect: { id: dto.clientId } },
        org: { connect: { id: orgId } },
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, orgId: string, dto: UpdateContractDto) {
    await this.findOne(id, orgId);
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.clientId !== undefined && { client: { connect: { id: dto.clientId } } }),
      },
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);
    await this.prisma.contract.delete({ where: { id } });
  }
}
