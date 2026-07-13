import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginatedResponse } from '@obraflow/shared';

export class CreateTimesheetDto {
  workOrderId: string;
  workerId: string;
  date: string;
  hours: number;
  overtimeHours?: number;
  description?: string;
}

@Injectable()
export class TimesheetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.timesheet.findMany({
        where: { orgId },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          workOrder: { select: { id: true, title: true, code: true } },
          worker: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.timesheet.count({ where: { orgId } }),
    ]);
    const mapped = data.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      hours: t.hoursNormal,
      overtimeHours: t.hoursExtra,
      description: t.notes,
      hourlyRate: t.hourlyRate,
      totalCost: t.totalCost,
      workOrder: t.workOrder,
      worker: t.worker,
      createdAt: t.createdAt.toISOString(),
    }));
    return { data: mapped, meta: { total, page, limit, lastPage: Math.ceil(total / limit) } };
  }

  async create(orgId: string, dto: CreateTimesheetDto) {
    const worker = await this.prisma.worker.findFirst({
      where: { id: dto.workerId, orgId },
    });
    if (!worker)
      throw new NotFoundException('Worker not found');
    const hourlyRate = worker.hourlyRate ?? 0;
    const hoursNormal = dto.hours;
    const hoursExtra = dto.overtimeHours ?? 0;
    const totalCost = (hoursNormal + hoursExtra * 1.5) * hourlyRate;
    const ts = await this.prisma.timesheet.create({
      data: {
        workOrderId: dto.workOrderId,
        workerId: dto.workerId,
        date: new Date(dto.date),
        hoursNormal,
        hoursExtra,
        hourlyRate,
        totalCost,
        notes: dto.description,
        orgId,
      },
      include: {
        workOrder: { select: { id: true, title: true, code: true } },
        worker: { select: { id: true, name: true, role: true } },
      },
    });
    await this.rollupCostHH(dto.workOrderId);
    return {
      id: ts.id,
      date: ts.date.toISOString(),
      hours: ts.hoursNormal,
      overtimeHours: ts.hoursExtra,
      description: ts.notes,
      hourlyRate: ts.hourlyRate,
      totalCost: ts.totalCost,
      workOrder: ts.workOrder,
      worker: ts.worker,
      createdAt: ts.createdAt.toISOString(),
    };
  }

  async remove(id: string, orgId: string): Promise<void> {
    const ts = await this.prisma.timesheet.findFirst({ where: { id, orgId } });
    if (!ts)
      throw new NotFoundException('Timesheet not found');
    await this.prisma.timesheet.delete({ where: { id } });
    await this.rollupCostHH(ts.workOrderId);
  }

  private async rollupCostHH(workOrderId: string) {
    const agg = await this.prisma.timesheet.aggregate({
      where: { workOrderId },
      _sum: { totalCost: true },
    });
    const costHH = agg._sum.totalCost ?? 0;
    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        costHH,
        costTotal: {
          set: await this.computeCostTotal(workOrderId, costHH),
        },
      },
    });
  }

  private async computeCostTotal(workOrderId: string, costHH: number) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { costMaterials: true, costSubcontract: true, costExtra: true },
    });
    if (!wo)
      return costHH;
    return costHH + wo.costMaterials + wo.costSubcontract + wo.costExtra;
  }

  async findWorkers(orgId: string) {
    return this.prisma.worker.findMany({
      where: { orgId, status: 'ACTIVE' },
      select: { id: true, name: true, role: true, hourlyRate: true, crew: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
