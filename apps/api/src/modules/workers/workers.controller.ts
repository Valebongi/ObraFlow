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
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtPayload, UserRole } from '@obraflow/shared';
import { SanitizeText } from '../../common/transforms/sanitize.transform';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkersService } from './workers.service';

class CreateWorkerBodyDto {
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name: string;

  @IsOptional()
  @IsString()
  @SanitizeText()
  rut?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @SanitizeText()
  role?: string;

  @IsOptional()
  @IsString()
  @SanitizeText()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  crewId?: string;
}

class UpdateWorkerBodyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name?: string;

  @IsOptional()
  @IsString()
  @SanitizeText()
  rut?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @SanitizeText()
  role?: string;

  @IsOptional()
  @IsString()
  @SanitizeText()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  crewId?: string | null;

  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('Workers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: 'List workers' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.workersService.findAll(user.orgId, Number(page), Number(limit), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.workersService.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create worker' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWorkerBodyDto) {
    return this.workersService.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update worker' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWorkerBodyDto,
  ) {
    return this.workersService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete worker' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.workersService.remove(id, user.orgId);
  }
}
