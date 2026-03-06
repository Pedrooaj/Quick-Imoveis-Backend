import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { FirebaseHealthIndicator } from './indicators/firebase.health';
import { MailHealthIndicator } from './indicators/mail.health';
import { PrismaHealthIndicator } from './indicators/prisma.health';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: FirebaseHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ firebase: { status: 'up' } }) },
        },
        {
          provide: MailHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ mail: { status: 'up' } }) },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { isHealthy: jest.fn().mockResolvedValue({ supabase: { status: 'up' } }) },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
