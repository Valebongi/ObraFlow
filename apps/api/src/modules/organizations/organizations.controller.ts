import { Body, Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtPayload, UserRole } from '@obraflow/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';

export class UpdateOrgBodyDto {
  @ApiProperty({ required: false, example: 'My Company' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, example: 'America/Santiago' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false, example: 'CLP' })
  @IsOptional()
  @IsString()
  currency?: string;
}

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my organization details' })
  @ApiResponse({ status: 200, description: 'Organization with stats' })
  getMyOrg(@CurrentUser() user: JwtPayload) {
    return this.organizationsService.getMyOrg(user.orgId);
  }

  @Patch()
  @Roles(UserRole.ORG_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({ status: 200, description: 'Updated organization' })
  updateMyOrg(@CurrentUser() user: JwtPayload, @Body() dto: UpdateOrgBodyDto) {
    return this.organizationsService.updateMyOrg(user.orgId, dto);
  }

  @Get('stats')
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Organization stats' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.organizationsService.getStats(user.orgId);
  }
}
