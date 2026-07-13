import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron('0 8 * * *')
  async checkOverdueWorkOrders(): Promise<void> {
    this.logger.log('Checking overdue work orders...');
    const orgs = await this.prisma.organization.findMany({ select: { id: true, name: true } });
    for (const org of orgs) {
      const overdue = await this.prisma.workOrder.findMany({
        where: {
          orgId: org.id,
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED'] },
          plannedEnd: { lt: new Date() },
        },
        select: { code: true, title: true, plannedEnd: true },
      });
      if (overdue.length === 0)
        continue;
      const admins = await this.prisma.user.findMany({
        where: { orgId: org.id, role: 'ORG_ADMIN', isActive: true },
        select: { email: true },
      });
      if (admins.length === 0)
        continue;
      await this.mail.sendOverdueAlert(admins.map(a => a.email), org.name, overdue.map(wo => ({ code: wo.code, title: wo.title, plannedEnd: wo.plannedEnd! })));
    }
  }

  @Cron('30 8 * * *')
  async checkLowStock(): Promise<void> {
    this.logger.log('Checking low stock materials...');
    const orgs = await this.prisma.organization.findMany({ select: { id: true, name: true } });
    for (const org of orgs) {
      const filtered = (await this.prisma.material.findMany({
        where: { orgId: org.id, stockMin: { gt: 0 } },
        select: { name: true, code: true, stockTotal: true, stockMin: true },
      })).filter(m => m.stockTotal <= (m.stockMin ?? 0));
      if (filtered.length === 0)
        continue;
      const admins = await this.prisma.user.findMany({
        where: { orgId: org.id, role: 'ORG_ADMIN', isActive: true },
        select: { email: true },
      });
      if (admins.length === 0)
        continue;
      await this.mail.sendLowStockAlert(admins.map(a => a.email), org.name, filtered);
    }
  }
}
