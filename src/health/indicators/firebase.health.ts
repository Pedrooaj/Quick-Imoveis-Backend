import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseHealthIndicator extends HealthIndicator {
  constructor(private readonly firebase: FirebaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const app = this.firebase.getApp();
      if (!app) {
        throw new Error('Firebase app não inicializado');
      }
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        'Firebase check failed',
        this.getStatus(key, false, { error: (e as Error).message }),
      );
    }
  }
}
