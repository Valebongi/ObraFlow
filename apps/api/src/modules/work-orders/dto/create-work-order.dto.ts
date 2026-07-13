import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  MaxLength,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
  Min,
  IsInt,
  Max,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WOStatus, WOPriority, WOType } from '@obraflow/shared';
import { SanitizeText } from '../../../common/transforms/sanitize.transform';

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'Mantenimiento bomba centrífuga #3', minLength: 3, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  @SanitizeText()
  title: string;

  @ApiPropertyOptional({ example: 'Reemplazo de sello mecánico y rodamiento del eje principal', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @SanitizeText()
  description?: string;

  @ApiPropertyOptional({ enum: WOPriority, default: WOPriority.MEDIUM })
  @IsOptional()
  @IsEnum(WOPriority)
  priority?: WOPriority;

  @ApiProperty({ enum: WOType, example: WOType.CORRECTIVE })
  @IsEnum(WOType)
  @IsNotEmpty()
  type: WOType;

  @ApiPropertyOptional({ example: 'uuid-of-client' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-location' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-contract' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-crew' })
  @IsOptional()
  @IsUUID()
  crewId?: string;

  @ApiPropertyOptional({ example: '2024-03-15T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional({ example: '2024-03-15T17:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @ApiPropertyOptional({ example: 8, description: 'Horas estimadas de trabajo' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 250000, description: 'Costo estimado en la moneda de la organización' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ example: 'Coordinar con operaciones para detener equipo', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @SanitizeText()
  notes?: string;
}

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {}

export class ChangeWOStatusDto {
  @ApiProperty({ enum: WOStatus, example: WOStatus.IN_PROGRESS })
  @IsEnum(WOStatus)
  @IsNotEmpty()
  status: WOStatus;

  @ApiPropertyOptional({ example: 'Equipo disponible para intervención', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SanitizeText()
  reason?: string;
}

export class WorkOrderQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: WOStatus, example: WOStatus.PENDING })
  @IsOptional()
  @IsEnum(WOStatus)
  status?: WOStatus;

  @ApiPropertyOptional({ enum: WOPriority, example: WOPriority.HIGH })
  @IsOptional()
  @IsEnum(WOPriority)
  priority?: WOPriority;

  @ApiPropertyOptional({ enum: WOType, example: WOType.CORRECTIVE })
  @IsOptional()
  @IsEnum(WOType)
  type?: WOType;

  @ApiPropertyOptional({ example: 'uuid-of-client' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-crew' })
  @IsOptional()
  @IsUUID()
  crewId?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Fecha de inicio del rango (plannedStart >= from)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Fecha de fin del rango (plannedStart <= to)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({ example: 'bomba centrífuga', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Campo de ordenamiento' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: '2024-01-01', description: 'scheduledDate >= scheduledFrom' })
  @IsOptional()
  @IsString()
  scheduledFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'scheduledDate <= scheduledTo' })
  @IsOptional()
  @IsString()
  scheduledTo?: string;
}
