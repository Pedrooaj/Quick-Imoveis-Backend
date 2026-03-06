-- AlterTable: adiciona sort_order para controlar ordem de exibição das imagens
ALTER TABLE "property_images" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
