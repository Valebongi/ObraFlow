import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isDev: boolean;

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    this.isDev = !config.get('SMTP_HOST') || config.get('nodeEnv') === 'development';
  }

  async sendOverdueAlert(
    to: string[],
    orgName: string,
    overdueWOs: {
      code: string;
      title: string;
      plannedEnd: Date;
    }[],
  ): Promise<void> {
    const subject = `[ObraFlow] ${overdueWOs.length} orden(es) vencida(s) — ${orgName}`;
    const rows = overdueWOs.map(wo => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${wo.code}</td>
       <td style="padding:4px 8px;border-bottom:1px solid #eee">${wo.title}</td>
       <td style="padding:4px 8px;border-bottom:1px solid #eee;color:#ef4444">${new Date(wo.plannedEnd).toLocaleDateString('es-CL')}</td></tr>`).join('');
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#111;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#F5C518;margin:0">ObraFlow</h2>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee">
          <h3 style="margin-top:0">Órdenes de trabajo vencidas</h3>
          <p>Las siguientes órdenes superaron su fecha de finalización planificada:</p>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f5f5f5">
              <th style="padding:6px 8px;text-align:left">Código</th>
              <th style="padding:6px 8px;text-align:left">Título</th>
              <th style="padding:6px 8px;text-align:left">Vencía</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:16px"><a href="${this.config.get('APP_URL') ?? 'http://localhost:5173'}/work-orders" style="background:#111;color:#F5C518;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Ver órdenes</a></p>
        </div>
        <div style="padding:12px 24px;color:#999;font-size:12px">ObraFlow — Sistema de gestión de órdenes de trabajo</div>
      </div>`;
    await this._send(to, subject, html);
  }

  async sendLowStockAlert(
    to: string[],
    orgName: string,
    materials: {
      name: string;
      code?: string | null;
      stockTotal: number;
      stockMin: number | null;
    }[],
  ): Promise<void> {
    const subject = `[ObraFlow] Stock bajo en ${materials.length} material(es) — ${orgName}`;
    const rows = materials.map(m => `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee">${m.code ?? '—'}</td>
       <td style="padding:4px 8px;border-bottom:1px solid #eee">${m.name}</td>
       <td style="padding:4px 8px;border-bottom:1px solid #eee;color:#ef4444">${m.stockTotal}</td>
       <td style="padding:4px 8px;border-bottom:1px solid #eee">${m.stockMin ?? 0}</td></tr>`).join('');
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#111;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#F5C518;margin:0">ObraFlow</h2>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee">
          <h3 style="margin-top:0">Alerta de stock bajo</h3>
          <p>Los siguientes materiales están por debajo del stock mínimo:</p>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f5f5f5">
              <th style="padding:6px 8px;text-align:left">Código</th>
              <th style="padding:6px 8px;text-align:left">Material</th>
              <th style="padding:6px 8px;text-align:left">Stock actual</th>
              <th style="padding:6px 8px;text-align:left">Mínimo</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:16px"><a href="${this.config.get('APP_URL') ?? 'http://localhost:5173'}/materials" style="background:#111;color:#F5C518;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Ver materiales</a></p>
        </div>
        <div style="padding:12px 24px;color:#999;font-size:12px">ObraFlow — Sistema de gestión de órdenes de trabajo</div>
      </div>`;
    await this._send(to, subject, html);
  }

  private async _send(to: string[], subject: string, html: string) {
    if (this.isDev) {
      this.logger.log(`[MAIL DEV] To: ${to.join(', ')} | Subject: ${subject}`);
      return;
    }
    try {
      await this.mailer.sendMail({ to, subject, html });
      this.logger.log(`Mail sent to ${to.join(', ')}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send mail: ${err}`);
    }
  }
}
