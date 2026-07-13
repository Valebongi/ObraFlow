import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPortalAuthGuard } from './guards/jwt-portal-auth.guard';
import { ClientPortalService } from './client-portal.service';

@Public()
@UseGuards(JwtPortalAuthGuard)
@Controller('portal')
export class ClientPortalController {
  constructor(private portalService: ClientPortalService) {}

  @Get('work-orders')
  getWorkOrders(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.portalService.getWorkOrders(req.user.clientId, req.user.orgId, +page, +limit);
  }

  @Get('work-orders/:id')
  getWorkOrderDetail(@Param('id') id: string, @Request() req: any) {
    return this.portalService.getWorkOrderDetail(id, req.user.clientId, req.user.orgId);
  }
}
