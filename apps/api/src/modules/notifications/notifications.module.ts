import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from '../mail/mail.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [ScheduleModule.forRoot(), MailModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
