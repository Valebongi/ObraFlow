import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPortalAuthGuard } from './guards/jwt-portal-auth.guard';
import { ClientPortalAuthService } from './client-portal-auth.service';
import { PortalLoginDto } from './dto/portal-login.dto';

@Controller('portal/auth')
export class ClientPortalAuthController {
  constructor(private authService: ClientPortalAuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: PortalLoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(JwtPortalAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.sub, req.user.orgId);
  }
}
