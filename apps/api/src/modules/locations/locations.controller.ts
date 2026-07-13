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
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtPayload, UserRole } from '@obraflow/shared';
import { SanitizeText } from '../../common/transforms/sanitize.transform';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LocationsService } from './locations.service';

class CreateLocationBodyDto {
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name: string;

  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  lng?: number;

  @IsOptional()
  @IsString()
  @SanitizeText()
  notes?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}

class UpdateLocationBodyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  lng?: number;

  @IsOptional()
  @IsString()
  @SanitizeText()
  notes?: string;

  @IsOptional()
  @IsString()
  clientId?: string | null;
}

@ApiTags('Locations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List locations' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.locationsService.findAll(
      user.orgId,
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.locationsService.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create location' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLocationBodyDto) {
    return this.locationsService.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update location' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLocationBodyDto,
  ) {
    return this.locationsService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete location' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.locationsService.remove(id, user.orgId);
  }
}
