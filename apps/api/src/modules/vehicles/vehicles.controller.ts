import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraflow/shared';
import { VehiclesService } from './vehicles.service';

class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  plate?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.vehiclesService.findAll(req.user.orgId, +page, +limit, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.vehiclesService.findOne(id, req.user.orgId);
  }

  @Post()
  @Roles(UserRole.PLANNER)
  create(@Body() dto: CreateVehicleDto, @Req() req: any) {
    return this.vehiclesService.create(req.user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @Req() req: any) {
    return this.vehiclesService.update(id, req.user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PLANNER)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.vehiclesService.remove(id, req.user.orgId);
  }
}
