import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get('SMTP_HOST');
        const isDev = !host || config.get('nodeEnv') === 'development';
        return {
          transport: isDev
            ? { jsonTransport: true }
            : {
                host,
                port: config.get('SMTP_PORT') ?? 587,
                secure: false,
                auth: {
                  user: config.get('SMTP_USER'),
                  pass: config.get('SMTP_PASS'),
                },
              },
          defaults: {
            from: config.get('SMTP_FROM') ?? '"ObraFlow" <no-reply@obraflow.app>',
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
