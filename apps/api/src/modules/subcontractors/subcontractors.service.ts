import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SubcontractorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      orgId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { taxId: { contains: search } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.subcontractor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { crew: { select: { id: true, name: true } } },
      }),
      this.prisma.subcontractor.count({ where }),
    ]);
    return { data: items, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async findOne(id: string, orgId: string) {
    const item = await this.prisma.subcontractor.findFirst({
      where: { id, orgId },
      include: { crew: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException(`Subcontractor not found`);
    return item;
  }

  async create(
    orgId: string,
    dto: {
      name: string;
      taxId?: string;
      email?: string;
      phone?: string;
      rateModel?: string;
      rateValue?: number;
      crewId?: string;
    },
  ) {
    return this.prisma.subcontractor.create({
      data: {
        name: dto.name,
        taxId: dto.taxId,
        email: dto.email,
        phone: dto.phone,
        rateModel: dto.rateModel ?? 'PER_OT',
        rateValue: dto.rateValue ?? 0,
        org: { connect: { id: orgId } },
        ...(dto.crewId && { crew: { connect: { id: dto.crewId } } }),
      },
      include: { crew: { select: { id: true, name: true } } },
    });
  }

  async update(
    id: string,
    orgId: string,
    dto: {
      name?: string;
      taxId?: string;
      email?: string;
      phone?: string;
      rateModel?: string;
      rateValue?: number;
      crewId?: string | null;
    },
  ) {
    await this.findOne(id, orgId);
    return this.prisma.subcontractor.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.rateModel !== undefined && { rateModel: dto.rateModel }),
        ...(dto.rateValue !== undefined && { rateValue: dto.rateValue }),
        ...(dto.crewId !== undefined &&
          (dto.crewId
            ? { crew: { connect: { id: dto.crewId } } }
            : { crew: { disconnect: true } })),
      },
      include: { crew: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.prisma.subcontractor.delete({ where: { id } });
  }
}
