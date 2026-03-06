import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class MailHealthIndicator extends HealthIndicator {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isConnected = await this.mailService.verifyConnection();
      if (!isConnected) {
        throw new Error('Conexão SMTP não verificada');
      }
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        'Mail (SMTP) check failed',
        this.getStatus(key, false, { error: (e as Error).message }),
      );
    }
  }
}
