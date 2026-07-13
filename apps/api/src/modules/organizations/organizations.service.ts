import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export class UpdateOrgDto {
  name?: string;
  logoUrl?: string;
  timezone?: string;
  currency?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOrg(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const [userCount, crewCount, woStats] = await Promise.all([
      this.prisma.user.count({ where: { orgId, isActive: true } }),
      this.prisma.crew.count({ where: { orgId } }),
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let totalWorkOrders = 0;
    for (const s of woStats) {
      byStatus[s.status] = s._count.id;
      totalWorkOrders += s._count.id;
    }

    return {
      ...org,
      userCount,
      crewCount,
      workOrders: { total: totalWorkOrders, byStatus },
    };
  }

  async updateMyOrg(orgId: string, dto: UpdateOrgDto) {
    await this.getMyOrg(orgId);
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
    });
  }

  async getStats(orgId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [woStats, woTypeStats, activeCrews, totalWorkers, totalClients, timesheets, allWOs, allMaterials] = await Promise.all([
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),
      this.prisma.workOrder.groupBy({
        by: ['type'],
        where: { orgId },
        _count: { id: true },
      }),
      this.prisma.crew.count({
        where: { orgId, status: 'AVAILABLE' },
      }),
      this.prisma.worker.count({
        where: { orgId, status: 'ACTIVE' },
      }),
      this.prisma.client.count({
        where: { orgId, isActive: true },
      }),
      this.prisma.timesheet.findMany({
        where: { orgId, date: { gte: sixMonthsAgo } },
        select: { date: true, totalCost: true },
      }),
      this.prisma.workOrder.findMany({
        where: { orgId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, status: true, costTotal: true },
      }),
      this.prisma.material.findMany({
        where: { orgId },
        select: { stockTotal: true, stockMin: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let totalWorkOrders = 0;
    for (const s of woStats) {
      byStatus[s.status] = s._count.id;
      totalWorkOrders += s._count.id;
    }

    const byType: Record<string, number> = {};
    for (const t of woTypeStats) {
      byType[t.type] = t._count.id;
    }

    const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthKeys: string[] = [];
    const monthlyMap: Record<string, { month: string; creadas: number; completadas: number; canceladas: number; costTotal: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(key);
      monthlyMap[key] = { month: MONTH_ABBR[d.getMonth()], creadas: 0, completadas: 0, canceladas: 0, costTotal: 0 };
    }

    for (const wo of allWOs) {
      const d = new Date(wo.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyMap) {
        monthlyMap[key].creadas++;
        if (wo.status === 'COMPLETED' || wo.status === 'INVOICED') monthlyMap[key].completadas++;
        if (wo.status === 'CANCELLED') monthlyMap[key].canceladas++;
        monthlyMap[key].costTotal += wo.costTotal ?? 0;
      }
    }

    for (const ts of timesheets) {
      const d = new Date(ts.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyMap) {
        monthlyMap[key].costTotal += ts.totalCost;
      }
    }

    const monthlyWOs = monthKeys.map((k) => monthlyMap[k]);
    const monthlyCosts = monthKeys.map((k) => ({ month: k, costTotal: monthlyMap[k].costTotal }));

    const lowStockCount = allMaterials.filter((m) => m.stockMin != null && m.stockMin > 0 && m.stockTotal <= m.stockMin).length;

    const overdueCount = await this.prisma.workOrder.count({
      where: {
        orgId,
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED'] },
        plannedEnd: { lt: now },
      },
    });

    return {
      totalWorkOrders,
      byStatus,
      byType,
      activeCrews,
      totalWorkers,
      totalClients,
      monthlyWOs,
      monthlyCosts,
      lowStockCount,
      overdueCount,
    };
  }
}
