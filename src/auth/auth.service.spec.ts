import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findOne: jest.fn(),
            updateUser: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
            decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 900 }),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            passwordReset: {
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
              findFirst: jest.fn(),
            },
            emailVerification: {
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
            $transaction: jest.fn((ops) => Promise.all(ops)),
          },
        },
        {
          provide: MailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') },
        },
        {
          provide: FirebaseService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('https://storage.example.com/avatar.jpg'),
            deleteFile: jest.fn().mockResolvedValue(undefined),
            avatarPath: jest.fn().mockReturnValue('avatars/test.jpg'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
