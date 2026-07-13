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
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { JwtPayload, UserRole } from '@obraflow/shared';
import {
  SanitizeEmail,
  SanitizeText,
} from '../../common/transforms/sanitize.transform';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClientsService } from './clients.service';

export class CreateClientBodyDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name: string;

  @ApiProperty({ required: false, example: '12345678-9' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  taxId?: string;

  @ApiProperty({ required: false, example: 'contact@acme.com' })
  @IsOptional()
  @IsEmail()
  @SanitizeEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+56912345678' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  phone?: string;

  @ApiProperty({ required: false, example: 'Av. Principal 123' })
  @IsOptional()
  @IsString()
  @SanitizeText()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  notes?: string;
}

export class UpdateClientBodyDto {
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
  taxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @SanitizeEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @SanitizeText()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @SanitizeText()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  notes?: string;
}

@ApiTags('Clients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients with optional search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.clientsService.findAll(
      user.orgId,
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details with locations and contracts' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.clientsService.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateClientBodyDto) {
    return this.clientsService.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.PLANNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update client details' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClientBodyDto,
  ) {
    return this.clientsService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete client (isActive=false)' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.clientsService.remove(id, user.orgId);
  }
}
