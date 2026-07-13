import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { JwtPayload, UserRole } from '@obraflow/shared';
import { SanitizeEmail, SanitizeText } from '../../common/transforms/sanitize.transform';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

export class CreateUserBodyDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name: string;

  @ApiProperty({ example: 'jane@company.com' })
  @IsEmail()
  @SanitizeEmail()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PLANNER })
  @IsEnum(UserRole)
  role: string;

  @ApiProperty({ example: 'SecurePass1!' })
  @IsString()
  @Length(8, 64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must have uppercase, lowercase and a number',
  })
  password: string;
}

export class UpdateUserBodyDto {
  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @SanitizeText()
  name?: string;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordBodyDto {
  @ApiProperty({ example: 'OldPass1!' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass1!' })
  @IsString()
  @Length(8, 64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must have uppercase, lowercase and a number',
  })
  newPassword: string;
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.PLANNER)
  @ApiOperation({ summary: 'List all users in the organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@CurrentUser() user: JwtPayload, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(user.orgId, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.findOne(id, user.orgId);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserBodyDto) {
    return this.usersService.create(user.orgId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ORG_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateUserBodyDto) {
    return this.usersService.update(id, user.orgId, dto);
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: ChangePasswordBodyDto) {
    const isOwn = user.sub === id;
    const isAdmin = user.role === UserRole.ORG_ADMIN;
    if (!isOwn && !isAdmin) {
      throw new ForbiddenException('You can only change your own password unless you are an ORG_ADMIN');
    }
    await this.usersService.changePassword(id, user.orgId, dto.currentPassword, dto.newPassword);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user (set isActive=false)' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.usersService.remove(id, user.orgId);
  }
}
