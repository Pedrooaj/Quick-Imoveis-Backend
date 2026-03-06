-- AlterTable: troca code por token (link de verificação)
ALTER TABLE "email_verifications" RENAME COLUMN "code" TO "token";
ALTER TABLE "email_verifications" ALTER COLUMN "token" TYPE VARCHAR(64);
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_token_key" UNIQUE ("token");
