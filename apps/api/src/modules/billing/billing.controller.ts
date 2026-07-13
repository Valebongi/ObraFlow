import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  Request,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraflow/shared';
import { BillingService } from './billing.service';
import { IsString } from 'class-validator';

class CheckoutSessionDto {
  @IsString()
  successUrl: string;

  @IsString()
  cancelUrl: string;
}

class PortalSessionDto {
  @IsString()
  returnUrl: string;
}

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.billingService.getStatus(req.user.orgId);
  }

  @Post('create-checkout-session')
  @Roles(UserRole.ORG_ADMIN)
  createCheckoutSession(@Request() req: any, @Body() body: CheckoutSessionDto) {
    return this.billingService.createCheckoutSession(req.user.orgId, body.successUrl, body.cancelUrl);
  }

  @Post('create-portal-session')
  @Roles(UserRole.ORG_ADMIN)
  createPortalSession(@Request() req: any, @Body() body: PortalSessionDto) {
    return this.billingService.createPortalSession(req.user.orgId, body.returnUrl);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody, signature);
  }
}
