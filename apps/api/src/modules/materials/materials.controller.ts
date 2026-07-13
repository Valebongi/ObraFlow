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
  ApiTags,
} from '@nestjs/swagger';
import {
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
import { MaterialsService } from './materials.service';

class CreateMaterialBodyDto {
  @ApiProperty({ example: 'Cable eléctrico 2.5mm' })
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @SanitizeText()
  code?: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  unit: string;

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockTotal: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  description?: string;
}

class UpdateMaterialBodyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name?: string;

  @IsOptional()
  @IsString()
  @SanitizeText()
  code?: string;

  @IsOptional()
  @IsString()
  @SanitizeText()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  description?: string;
}

@ApiTags('Materials')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'List materials' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.materialsService.findAll(user.orgId, Number(page), Number(limit), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.materialsService.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create material' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMaterialBodyDto) {
    return this.materialsService.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update material' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMaterialBodyDto,
  ) {
    return this.materialsService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete material' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.materialsService.remove(id, user.orgId);
  }
}
