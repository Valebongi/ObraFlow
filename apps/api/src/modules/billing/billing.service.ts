import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

const StripeLib = require('stripe');

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: any = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const key = this.configService.get('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new StripeLib(key, { apiVersion: '2026-05-27.dahlia' });
    }
    else {
      this.logger.warn('STRIPE_SECRET_KEY no configurado — billing desactivado');
    }
  }

  private requireStripe() {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Billing no configurado en este entorno');
    }
    return this.stripe;
  }

  async getStatus(orgId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { orgId } });
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    return {
      plan: org?.plan ?? 'STARTER',
      status: subscription?.status ?? 'ACTIVE',
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      stripeEnabled: !!this.stripe,
    };
  }

  async getOrCreateCustomer(orgId: string): Promise<string> {
    const stripe = this.requireStripe();
    const subscription = await this.prisma.subscription.findUnique({ where: { orgId } });
    if (subscription?.stripeCustomerId)
      return subscription.stripeCustomerId;
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    const customer = await stripe.customers.create({
      name: org?.name,
      metadata: { orgId },
    });
    await this.prisma.subscription.upsert({
      where: { orgId },
      update: { stripeCustomerId: customer.id },
      create: {
        orgId,
        stripeCustomerId: customer.id,
        plan: 'STARTER',
        status: 'ACTIVE',
      },
    });
    return customer.id;
  }

  async createCheckoutSession(orgId: string, successUrl: string, cancelUrl: string) {
    const stripe = this.requireStripe();
    const customerId = await this.getOrCreateCustomer(orgId);
    const priceId = this.configService.get('STRIPE_PRICE_PRO_MONTHLY');
    if (!priceId) {
      throw new BadRequestException('Plan de precio no configurado (STRIPE_PRICE_PRO_MONTHLY)');
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId },
    });
    return { url: session.url };
  }

  async createPortalSession(orgId: string, returnUrl: string) {
    const stripe = this.requireStripe();
    const customerId = await this.getOrCreateCustomer(orgId);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.requireStripe();
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret no configurado');
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    catch (err) {
      throw new BadRequestException(`Webhook signature inválida: ${err.message}`);
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.metadata?.orgId) {
          const orgId = session.metadata.orgId;
          await this.prisma.subscription.upsert({
            where: { orgId },
            update: {
              stripeSubscriptionId: session.subscription,
              stripeCustomerId: session.customer,
              status: 'ACTIVE',
              plan: 'PRO',
            },
            create: {
              orgId,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              plan: 'PRO',
              status: 'ACTIVE',
            },
          });
          await this.prisma.organization.update({
            where: { id: orgId },
            data: { plan: 'PRO' },
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const orgSub = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (orgSub) {
          const status = sub.status === 'active'
            ? 'ACTIVE'
            : sub.status === 'past_due'
              ? 'PAST_DUE'
              : sub.status === 'trialing'
                ? 'TRIALING'
                : 'CANCELED';
          await this.prisma.subscription.update({
            where: { id: orgSub.id },
            data: {
              status,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
          if (status === 'CANCELED') {
            await this.prisma.organization.update({
              where: { id: orgSub.orgId },
              data: { plan: 'STARTER' },
            });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const orgSub = await this.prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (orgSub) {
          await this.prisma.subscription.update({
            where: { id: orgSub.id },
            data: { status: 'CANCELED' },
          });
          await this.prisma.organization.update({
            where: { id: orgSub.orgId },
            data: { plan: 'STARTER' },
          });
        }
        break;
      }
      default:
        this.logger.debug(`Webhook no procesado: ${event.type}`);
    }
    return { received: true };
  }
}
