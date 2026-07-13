import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class AddWOMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class AddIncidentDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  severity?: string;
}

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  ChangeWOStatusDto,
  WorkOrderQueryDto,
} from './dto/create-work-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '@obraflow/shared';

@ApiTags('Work Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de trabajo con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de órdenes de trabajo' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: WorkOrderQueryDto) {
    return this.workOrdersService.findAll(user.orgId, query);
  }

  @Post()
  @Roles(UserRole.PLANNER, UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Crear nueva orden de trabajo' })
  @ApiResponse({ status: 201, description: 'Orden de trabajo creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para crear órdenes de trabajo' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(user.orgId, user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de una orden de trabajo' })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Detalle de la orden de trabajo con todas sus relaciones' })
  @ApiResponse({ status: 404, description: 'Orden de trabajo no encontrada' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.workOrdersService.findOne(id, user.orgId);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER, UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de una orden de trabajo' })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Orden de trabajo actualizada' })
  @ApiResponse({ status: 404, description: 'Orden de trabajo no encontrada' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para modificar órdenes de trabajo' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, user.orgId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar el estado de una orden de trabajo' })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo', type: 'string' })
  @ApiResponse({ status: 200, description: 'Estado actualizado y registrado en el historial' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 404, description: 'Orden de trabajo no encontrada' })
  changeStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: ChangeWOStatusDto) {
    return this.workOrdersService.changeStatus(id, user.orgId, user.sub, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una orden de trabajo (solo PENDING o CANCELLED)' })
  @ApiParam({ name: 'id', description: 'ID de la orden de trabajo', type: 'string' })
  @ApiResponse({ status: 204, description: 'Orden de trabajo eliminada' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar una orden en el estado actual' })
  @ApiResponse({ status: 403, description: 'Solo el administrador puede eliminar órdenes de trabajo' })
  @ApiResponse({ status: 404, description: 'Orden de trabajo no encontrada' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.workOrdersService.remove(id, user.orgId);
  }

  @Get(':id/costs')
  @ApiOperation({ summary: 'Obtener desglose de costos de una orden de trabajo' })
  getCosts(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.workOrdersService.getCosts(id, user.orgId);
  }

  @Get(':id/materials')
  @ApiOperation({ summary: 'List materials used on a work order' })
  getWOMaterials(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.workOrdersService.getWOMaterials(id, user.orgId);
  }

  @Post(':id/materials')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Register material usage on a work order' })
  addWOMaterial(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddWOMaterialDto) {
    return this.workOrdersService.addWOMaterial(id, user.orgId, dto);
  }

  @Delete(':id/materials/:itemId')
  @Roles(UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove material usage record from a work order' })
  async removeWOMaterial(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    await this.workOrdersService.removeWOMaterial(id, itemId, user.orgId);
  }

  @Get(':id/incidents')
  @ApiOperation({ summary: 'List incidents for a work order' })
  getIncidents(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.workOrdersService.getIncidents(id, user.orgId);
  }

  @Post(':id/incidents')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Report an incident on a work order' })
  addIncident(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AddIncidentDto) {
    return this.workOrdersService.addIncident(id, user.orgId, user.sub, dto);
  }

  @Delete(':id/incidents/:itemId')
  @Roles(UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an incident record' })
  async removeIncident(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    await this.workOrdersService.removeIncident(id, itemId, user.orgId);
  }
}
