import { Body, Controller, Delete, Get, Param, Post, Request } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraflow/shared';
import { ClientPortalAuthService } from './client-portal-auth.service';
import { CreatePortalUserDto } from './dto/create-portal-user.dto';

@Controller('portal-admin')
export class ClientPortalAdminController {
  constructor(private authService: ClientPortalAuthService) {}

  @Post('users')
  @Roles(UserRole.PLANNER)
  createAccess(@Body() dto: CreatePortalUserDto, @Request() req: any) {
    return this.authService.createPortalAccess(req.user.orgId, dto);
  }

  @Get('users')
  listUsers(@Request() req: any) {
    return this.authService.listPortalUsers(req.user.orgId);
  }

  @Delete('users/:id')
  @Roles(UserRole.PLANNER)
  revokeAccess(@Param('id') id: string, @Request() req: any) {
    return this.authService.revokePortalAccess(id, req.user.orgId);
  }
}
