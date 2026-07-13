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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CrewStatus, CrewType, JwtPayload, UserRole } from '@obraflow/shared';
import { SanitizeText } from '../../common/transforms/sanitize.transform';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CrewsService } from './crews.service';

export class CreateCrewBodyDto {
  @ApiProperty({ example: 'Cuadrilla Norte' })
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name: string;

  @ApiProperty({ example: 'CRW-001' })
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  code: string;

  @ApiProperty({ enum: CrewType, example: CrewType.OWN })
  @IsEnum(CrewType)
  type: string;

  @ApiProperty({ required: false, description: 'User ID of leader' })
  @IsOptional()
  @IsUUID()
  leaderId?: string;

  @ApiProperty({ required: false, description: 'Vehicle ID' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  notes?: string;
}

export class UpdateCrewBodyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @SanitizeText()
  code?: string;

  @ApiProperty({ required: false, enum: CrewType })
  @IsOptional()
  @IsEnum(CrewType)
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  leaderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  notes?: string;
}

export class UpdateCrewStatusBodyDto {
  @ApiProperty({ enum: CrewStatus })
  @IsEnum(CrewStatus)
  status: string;
}

@ApiTags('Crews')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crews')
export class CrewsController {
  constructor(private readonly crewsService: CrewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all crews' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.crewsService.findAll(user.orgId, Number(page), Number(limit));
  }

  @Get('availability')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Get crew availability for a given date' })
  @ApiQuery({ name: 'date', required: true, type: String, example: '2025-07-15' })
  getAvailability(@CurrentUser() user: JwtPayload, @Query('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.crewsService.getAvailability(user.orgId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crew details with workers, leader and vehicle' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.crewsService.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Create a new crew' })
  @ApiResponse({ status: 201, description: 'Crew created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCrewBodyDto) {
    return this.crewsService.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update crew details' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCrewBodyDto,
  ) {
    return this.crewsService.update(id, user.orgId, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update crew availability status' })
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCrewStatusBodyDto,
  ) {
    return this.crewsService.updateStatus(id, user.orgId, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a crew (blocked if active WOs exist)' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.crewsService.remove(id, user.orgId);
  }
}
