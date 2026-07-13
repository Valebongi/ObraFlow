import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResponse } from '@obraflow/shared';

export class CreateMaterialDto {
  name: string;
  code?: string;
  unit: string;
  unitCost: number;
  stockTotal: number;
  stockMin?: number;
  description?: string;
}

export class UpdateMaterialDto {
  name?: string;
  code?: string;
  unit?: string;
  unitCost?: number;
  stockTotal?: number;
  stockMin?: number;
  description?: string;
}

@Injectable()
export class MaterialsService {
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
      this.prisma.material.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.material.count({ where }),
    ]);
    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(id: string, orgId: string) {
    const material = await this.prisma.material.findFirst({ where: { id, orgId } });
    if (!material)
      throw new NotFoundException('Material not found');
    return material;
  }

  async create(orgId: string, dto: CreateMaterialDto) {
    return this.prisma.material.create({
      data: {
        name: dto.name,
        code: dto.code,
        unit: dto.unit,
        unitCost: dto.unitCost,
        stockTotal: dto.stockTotal ?? 0,
        stockMin: dto.stockMin ?? 0,
        description: dto.description,
        orgId,
      },
    });
  }

  async update(id: string, orgId: string, dto: UpdateMaterialDto) {
    await this.findOne(id, orgId);
    return this.prisma.material.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.unitCost !== undefined && { unitCost: dto.unitCost }),
        ...(dto.stockTotal !== undefined && { stockTotal: dto.stockTotal }),
        ...(dto.stockMin !== undefined && { stockMin: dto.stockMin }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.prisma.material.delete({ where: { id } });
  }
}
