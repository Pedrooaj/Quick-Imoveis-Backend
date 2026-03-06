/*
  Warnings:

  - The `status` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('RASCUNHO', 'DISPONIVEL');

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "status",
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'RASCUNHO';
