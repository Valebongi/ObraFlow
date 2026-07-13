import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PaginatedResponse,
  WorkOrderSummary,
  WOPriority,
  WOStatus,
  generateWOCode,
  isValidStatusTransition,
  calculateTotalCost,
} from '@obraflow/shared';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  ChangeWOStatusDto,
  WorkOrderQueryDto,
} from './dto/create-work-order.dto';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, query: WorkOrderQueryDto): Promise<PaginatedResponse<WorkOrderSummary>> {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      type,
      clientId,
      crewId,
      from,
      to,
      search,
    } = query;
    const skip = (page - 1) * limit;
    const where: any = {
      orgId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(type && { type }),
      ...(clientId && { clientId }),
      ...(crewId && { crewId }),
      ...(from || to
        ? {
            plannedStart: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { code: { contains: search } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          location: { select: { name: true } },
          crew: { select: { name: true } },
        },
      }),
      this.prisma.workOrder.count({ where }),
    ]);
    const data = items.map((wo) => ({
      id: wo.id,
      code: wo.code,
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      type: wo.type,
      clientName: wo.client?.name,
      locationName: wo.location?.name,
      plannedStart: wo.plannedStart?.toISOString(),
      plannedEnd: wo.plannedEnd?.toISOString(),
      assignedCrewName: wo.crew?.name,
      costTotal: wo.costTotal,
      estimatedHours: wo.estimatedHours ?? undefined,
      createdAt: wo.createdAt.toISOString(),
    }) as WorkOrderSummary);
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
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, orgId },
      include: {
        client: true,
        location: true,
        crew: {
          include: {
            leader: { select: { id: true, name: true, email: true } },
          },
        },
        contract: true,
        createdBy: { select: { id: true, name: true, email: true } },
        statusLogs: {
          orderBy: { changedAt: 'desc' },
        },
        timesheets: {
          include: {
            worker: { select: { id: true, name: true, role: true } },
          },
          orderBy: { date: 'desc' },
        },
        materials: {
          include: {
            material: { select: { id: true, name: true, code: true, unit: true } },
          },
          orderBy: { registeredAt: 'desc' },
        },
        incidents: {
          orderBy: { reportedAt: 'desc' },
        },
        evidences: {
          orderBy: { takenAt: 'desc' },
        },
      },
    });
    if (!workOrder) {
      throw new NotFoundException(`Orden de trabajo con id "${id}" no encontrada`);
    }
    return workOrder;
  }

  async create(orgId: string, userId: string, dto: CreateWorkOrderDto) {
    const count = await this.prisma.workOrder.count({ where: { orgId } });
    const code = generateWOCode(count + 1);
    const workOrder = await this.prisma.workOrder.create({
      data: {
        code,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? WOPriority.MEDIUM,
        type: dto.type,
        status: WOStatus.PENDING,
        clientId: dto.clientId,
        locationId: dto.locationId,
        contractId: dto.contractId,
        crewId: dto.crewId,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        estimatedHours: dto.estimatedHours,
        estimatedCost: dto.estimatedCost,
        notes: dto.notes,
        costHH: 0,
        costMaterials: 0,
        costSubcontract: 0,
        costExtra: 0,
        costTotal: 0,
        orgId,
        createdById: userId,
      },
      include: {
        client: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        crew: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    this.logger.log(`WorkOrder created: ${workOrder.code} by user ${userId} in org ${orgId}`);
    return workOrder;
  }

  async update(id: string, orgId: string, dto: UpdateWorkOrderDto) {
    await this.findOne(id, orgId);
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.clientId !== undefined) updateData.client = { connect: { id: dto.clientId } };
    if (dto.locationId !== undefined) updateData.location = { connect: { id: dto.locationId } };
    if (dto.contractId !== undefined) updateData.contract = { connect: { id: dto.contractId } };
    if (dto.crewId !== undefined) updateData.crew = { connect: { id: dto.crewId } };
    if (dto.plannedStart !== undefined)
      updateData.plannedStart = dto.plannedStart ? new Date(dto.plannedStart) : null;
    if (dto.plannedEnd !== undefined)
      updateData.plannedEnd = dto.plannedEnd ? new Date(dto.plannedEnd) : null;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;
    if (dto.estimatedCost !== undefined) updateData.estimatedCost = dto.estimatedCost;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    return this.prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        crew: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async changeStatus(id: string, orgId: string, userId: string, dto: ChangeWOStatusDto) {
    const workOrder = await this.findOne(id, orgId);
    const currentStatus = workOrder.status as WOStatus;
    const newStatus = dto.status;
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new BadRequestException(`Transición de estado inválida: ${currentStatus} → ${newStatus}`);
    }
    const now = new Date();
    const updateData: any = { status: newStatus };
    if (newStatus === WOStatus.IN_PROGRESS && !workOrder.actualStart) {
      updateData.actualStart = now;
    }
    if (newStatus === WOStatus.COMPLETED || newStatus === WOStatus.CANCELLED) {
      updateData.closedAt = now;
      if (newStatus === WOStatus.COMPLETED) {
        updateData.actualEnd = now;
      }
    }
    const costTotal = calculateTotalCost({
      costHH: workOrder.costHH,
      costMaterials: workOrder.costMaterials,
      costSubcontract: workOrder.costSubcontract,
      costExtra: workOrder.costExtra,
    });
    updateData.costTotal = costTotal;
    const [updated] = await this.prisma.$transaction([
      this.prisma.workOrder.update({
        where: { id },
        data: updateData,
        include: {
          client: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          crew: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          statusLogs: { orderBy: { changedAt: 'desc' }, take: 5 },
        },
      }),
      this.prisma.wOStatusLog.create({
        data: {
          workOrderId: id,
          fromStatus: currentStatus,
          toStatus: newStatus,
          reason: dto.reason,
          changedById: userId,
          changedAt: now,
        },
      }),
    ]);
    this.logger.log(`WorkOrder ${workOrder.code} status changed: ${currentStatus} → ${newStatus} by user ${userId}`);
    return updated;
  }

  async remove(id: string, orgId: string): Promise<void> {
    const workOrder = await this.findOne(id, orgId);
    const status = workOrder.status;
    if (status !== WOStatus.PENDING && status !== WOStatus.CANCELLED) {
      throw new BadRequestException(
        `No se puede eliminar una orden de trabajo en estado "${status}". Solo se permite eliminar órdenes en estado PENDING o CANCELLED.`,
      );
    }
    await this.prisma.workOrder.delete({ where: { id } });
    this.logger.log(`WorkOrder ${workOrder.code} deleted from org ${orgId}`);
  }

  async getCosts(id: string, orgId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        code: true,
        costHH: true,
        costMaterials: true,
        costSubcontract: true,
        costExtra: true,
        costTotal: true,
        timesheets: {
          include: {
            worker: { select: { id: true, name: true, role: true } },
          },
          orderBy: { date: 'desc' },
        },
        materials: {
          include: {
            material: { select: { id: true, name: true, code: true, unit: true } },
          },
          orderBy: { registeredAt: 'desc' },
        },
      },
    });
    if (!workOrder) {
      throw new NotFoundException(`Orden de trabajo con id "${id}" no encontrada`);
    }
    return {
      costHH: workOrder.costHH,
      costMaterials: workOrder.costMaterials,
      costSubcontract: workOrder.costSubcontract,
      costExtra: workOrder.costExtra,
      costTotal: workOrder.costTotal,
      timesheets: workOrder.timesheets,
      materials: workOrder.materials,
    };
  }

  async getIncidents(workOrderId: string, orgId: string) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, orgId } });
    if (!wo) throw new NotFoundException(`Work order not found`);
    return this.prisma.incident.findMany({
      where: { workOrderId },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async addIncident(
    workOrderId: string,
    orgId: string,
    userId: string,
    dto: { type: string; description: string; severity?: string },
  ) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, orgId } });
    if (!wo) throw new NotFoundException(`Work order not found`);
    return this.prisma.incident.create({
      data: {
        workOrderId,
        type: dto.type,
        description: dto.description,
        severity: dto.severity ?? 'LOW',
        reportedById: userId,
      },
    });
  }

  async removeIncident(workOrderId: string, itemId: string, orgId: string): Promise<void> {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, orgId } });
    if (!wo) throw new NotFoundException(`Work order not found`);
    const item = await this.prisma.incident.findFirst({ where: { id: itemId, workOrderId } });
    if (!item) throw new NotFoundException(`Incident not found`);
    await this.prisma.incident.delete({ where: { id: itemId } });
  }

  async getWOMaterials(workOrderId: string, orgId: string) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, orgId } });
    if (!wo) throw new NotFoundException(`Work order not found`);
    return this.prisma.wOMaterial.findMany({
      where: { workOrderId },
      include: { material: { select: { id: true, name: true, code: true, unit: true, unitCost: true } } },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async addWOMaterial(
    workOrderId: string,
    orgId: string,
    dto: { materialId: string; quantity: number; notes?: string },
  ) {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, orgId } });
    if (!wo) throw new NotFoundException(`Work order not found`);
    const material = await this.prisma.material.findFirst({ where: { id: dto.materialId, orgId } });
    if (!material) throw new NotFoundException(`Material not found`);
    const unitCost = material.unitCost;
    const totalCost = unitCost * dto.quantity;
    const item = await this.prisma.wOMaterial.create({
      data: {
        workOrderId,
        materialId: dto.materialId,
        quantity: dto.quantity,
        unitCost,
        totalCost,
        notes: dto.notes,
      },
      include: { material: { select: { id: true, name: true, code: true, unit: true, unitCost: true } } },
    });
    await this.prisma.$transaction([
      this.prisma.material.update({
        where: { id: dto.materialId },
        data: { stockTotal: { decrement: dto.quantity } },
      }),
      this.prisma.inventoryMovement.create({
        data: {
          materialId: dto.materialId,
          type: 'WO_USE',
          quantity: -dto.quantity,
          reason: `Usado en OT ${workOrderId}`,
          reference: workOrderId,
          orgId,
        },
      }),
    ]);
    await this.rollupCostMaterials(workOrderId);
    return item;
  }

  async removeWOMaterial(workOrderId: string, itemId: string, orgId: string): Promise<void> {
    const wo = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, orgId } });
    if (!wo) throw new NotFoundException(`Work order not found`);
    const item = await this.prisma.wOMaterial.findFirst({ where: { id: itemId, workOrderId } });
    if (!item) throw new NotFoundException(`Material record not found`);
    await this.prisma.$transaction([
      this.prisma.material.update({
        where: { id: item.materialId },
        data: { stockTotal: { increment: item.quantity } },
      }),
      this.prisma.inventoryMovement.create({
        data: {
          materialId: item.materialId,
          type: 'WO_RESTORE',
          quantity: item.quantity,
          reason: `Devuelto de OT ${workOrderId}`,
          reference: workOrderId,
          orgId,
        },
      }),
    ]);
    await this.prisma.wOMaterial.delete({ where: { id: itemId } });
    await this.rollupCostMaterials(workOrderId);
  }

  private async rollupCostMaterials(workOrderId: string) {
    const agg = await this.prisma.wOMaterial.aggregate({
      where: { workOrderId },
      _sum: { totalCost: true },
    });
    const costMaterials = agg._sum.totalCost ?? 0;
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { costHH: true, costSubcontract: true, costExtra: true },
    });
    if (!wo) return;
    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        costMaterials,
        costTotal: wo.costHH + costMaterials + wo.costSubcontract + wo.costExtra,
      },
    });
  }
}
