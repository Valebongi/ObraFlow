import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CrewStatus, PaginatedResponse } from '@obraflow/shared';

export class CreateCrewDto {
  name: string;
  code: string;
  type: string;
  leaderId?: string;
  vehicleId?: string;
  notes?: string;
}

export class UpdateCrewDto {
  name?: string;
  code?: string;
  type?: string;
  leaderId?: string;
  vehicleId?: string;
  notes?: string;
}

const ACTIVE_WO_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED'];

const CREW_INCLUDE = {
  leader: {
    select: { id: true, name: true, email: true, role: true },
  },
  vehicle: {
    select: { id: true, plate: true, brand: true, model: true, status: true },
  },
  workers: true,
};

@Injectable()
export class CrewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.crew.findMany({
        where: { orgId },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          leader: { select: { id: true, name: true } },
          vehicle: { select: { id: true, plate: true } },
          _count: { select: { workers: true } },
        },
      }),
      this.prisma.crew.count({ where: { orgId } }),
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
    const crew = await this.prisma.crew.findFirst({
      where: { id, orgId },
      include: CREW_INCLUDE,
    });
    if (!crew) throw new NotFoundException('Crew not found');
    return crew;
  }

  async create(orgId: string, dto: CreateCrewDto) {
    return this.prisma.crew.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type,
        status: CrewStatus.AVAILABLE,
        ...(dto.leaderId !== undefined && { leaderId: dto.leaderId }),
        ...(dto.vehicleId !== undefined && { vehicleId: dto.vehicleId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        orgId,
      },
      include: CREW_INCLUDE,
    });
  }

  async update(id: string, orgId: string, dto: UpdateCrewDto) {
    await this.findOne(id, orgId);
    return this.prisma.crew.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.leaderId !== undefined && { leaderId: dto.leaderId }),
        ...(dto.vehicleId !== undefined && { vehicleId: dto.vehicleId }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: CREW_INCLUDE,
    });
  }

  async updateStatus(id: string, orgId: string, status: string) {
    await this.findOne(id, orgId);
    return this.prisma.crew.update({
      where: { id },
      data: { status },
      include: CREW_INCLUDE,
    });
  }

  async getAvailability(orgId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const crews = await this.prisma.crew.findMany({
      where: { orgId },
      include: {
        ...CREW_INCLUDE,
        workOrders: {
          where: {
            orgId,
            OR: [
              {
                plannedStart: { lte: dayEnd },
                plannedEnd: { gte: dayStart },
              },
              { plannedStart: { gte: dayStart, lte: dayEnd } },
            ],
          },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            plannedStart: true,
            plannedEnd: true,
          },
        },
      },
    });
    return crews;
  }

  async remove(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    const activeWOs = await this.prisma.workOrder.count({
      where: {
        crewId: id,
        orgId,
        status: { in: ACTIVE_WO_STATUSES },
      },
    });
    if (activeWOs > 0) {
      throw new BadRequestException(`Cannot delete crew with ${activeWOs} active work order(s)`);
    }
    await this.prisma.crew.delete({ where: { id } });
  }
}
