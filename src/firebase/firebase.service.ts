import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: admin.app.App;
  private bucket!: ReturnType<admin.storage.Storage['bucket']>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.app = admin.apps[0] as admin.app.App;
      this.logger.log('Firebase conectado (app já inicializado)');
    } else {
      const serviceAccount = this.loadCredentials();

      const storageBucket =
        this.configService.get<string>('FIREBASE_STORAGE_BUCKET') ??
        `${serviceAccount.project_id ?? serviceAccount.projectId}.firebasestorage.app`;

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket,
      });
      this.logger.log('Firebase conectado com sucesso');
    }

    this.bucket = admin.storage().bucket();
  }

  private loadCredentials(): Record<string, string> {
    // 1) Variável FIREBASE_CREDENTIALS com JSON inline (Render, Railway, etc.)
    const credentialsJson =
      this.configService.get<string>('FIREBASE_CREDENTIALS');
    if (credentialsJson) {
      return JSON.parse(credentialsJson);
    }

    // 2) Arquivo local via GOOGLE_APPLICATION_CREDENTIALS ou firebase.json
    const credentialsPath =
      this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ??
      'firebase.json';

    const serviceAccountPath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.join(process.cwd(), credentialsPath);

    return require(serviceAccountPath);
  }

  auth(): admin.auth.Auth {
    return admin.auth();
  }

  firestore(): admin.firestore.Firestore {
    return admin.firestore();
  }

  storage(): admin.storage.Storage {
    return admin.storage();
  }

  getApp(): admin.app.App {
    return this.app;
  }

  /**
   * Faz upload de um arquivo para o Firebase Storage e retorna a URL pública.
   */
  async uploadFile(
    filePath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const file = this.bucket.file(filePath);
    await file.save(buffer, {
      metadata: { contentType, cacheControl: 'no-cache, max-age=0' },
      public: true,
    });
    return `${file.publicUrl()}?t=${Date.now()}`;
  }

  /**
   * Remove um arquivo do Firebase Storage pelo path.
   */
  async deleteFile(filePath: string): Promise<void> {
    const file = this.bucket.file(filePath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
  }

  /**
   * Remove múltiplos arquivos do Firebase Storage.
   */
  async deleteFiles(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map((p) => this.deleteFile(p)));
  }

  /**
   * Gera um path único para avatar de usuário.
   */
  avatarPath(userId: string, mimetype: string): string {
    const ext = mimetype.split('/')[1] ?? 'jpeg';
    return `avatars/${userId}.${ext}`;
  }

  /**
   * Gera um path único para imagem de imóvel.
   */
  propertyImagePath(propertyId: string, mimetype: string): string {
    const ext = mimetype.split('/')[1] ?? 'jpeg';
    return `properties/${propertyId}/${randomUUID()}.${ext}`;
  }
}
