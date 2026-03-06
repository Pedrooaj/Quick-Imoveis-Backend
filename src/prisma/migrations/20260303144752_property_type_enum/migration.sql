/*
  Warnings:

  - The `property_type` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('CASA', 'APARTAMENTO', 'COMERCIAL', 'RURAL', 'TERRENO');

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "property_type",
ADD COLUMN     "property_type" "PropertyType";
