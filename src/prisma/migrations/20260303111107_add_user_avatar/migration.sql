-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_content_type" VARCHAR(100),
ADD COLUMN     "avatar_data" BYTEA;
