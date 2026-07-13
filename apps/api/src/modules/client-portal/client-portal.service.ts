import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ClientPortalService {
  constructor(private prisma: PrismaService) {}

  async getWorkOrders(clientId: string, orgId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where: { clientId, orgId },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          plannedStart: true,
          plannedEnd: true,
          actualStart: true,
          actualEnd: true,
          location: { select: { name: true, address: true } },
          crew: { select: { name: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workOrder.count({ where: { clientId, orgId } }),
    ]);
    return { data, meta: { total, page, limit, lastPage: Math.ceil(total / limit) || 1 } };
  }

  async getWorkOrderDetail(id: string, clientId: string, orgId: string) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id, clientId, orgId },
      include: {
        location: { select: { name: true, address: true } },
        crew: { select: { name: true, code: true } },
        statusLogs: { orderBy: { changedAt: 'desc' }, take: 20 },
        incidents: { orderBy: { reportedAt: 'desc' } },
      },
    });
    if (!wo)
      throw new NotFoundException('Orden de trabajo no encontrada');
    return wo;
  }
}
