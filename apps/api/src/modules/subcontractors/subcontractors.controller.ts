import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtPayload, UserRole } from '@obraflow/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SubcontractorsService } from './subcontractors.service';

class CreateSubcontractorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  rateModel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rateValue?: number;

  @IsOptional()
  @IsString()
  crewId?: string;
}

class UpdateSubcontractorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  rateModel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rateValue?: number;

  @IsOptional()
  @IsString()
  crewId?: string | null;
}

@ApiTags('Subcontractors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subcontractors')
export class SubcontractorsController {
  constructor(private readonly service: SubcontractorsService) {}

  @Get()
  @ApiOperation({ summary: 'List subcontractors' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(user.orgId, Number(page), Number(limit), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subcontractor by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create subcontractor' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSubcontractorDto) {
    return this.service.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update subcontractor' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSubcontractorDto,
  ) {
    return this.service.update(id, user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subcontractor' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, user.orgId);
  }
}
