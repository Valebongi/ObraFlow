import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtPayload, UserRole } from '@obraflow/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TimesheetsService } from './timesheets.service';

class CreateTimesheetBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(24)
  hours: number;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags('Timesheets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get()
  @ApiOperation({ summary: 'List timesheets for the org' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.timesheetsService.findAll(user.orgId, Number(page), Number(limit));
  }

  @Post()
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Log worked hours' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTimesheetBodyDto) {
    return this.timesheetsService.create(user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERVISOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a timesheet entry' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.timesheetsService.remove(id, user.orgId);
  }

  @Get('workers')
  @ApiOperation({ summary: 'List workers available for timesheets' })
  findWorkers(@CurrentUser() user: JwtPayload) {
    return this.timesheetsService.findWorkers(user.orgId);
  }
}
