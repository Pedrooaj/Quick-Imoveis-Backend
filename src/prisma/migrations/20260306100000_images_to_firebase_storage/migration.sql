-- Users: replace avatar binary with URL
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_data";
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_content_type";

-- PropertyImages: replace binary with URL
ALTER TABLE "property_images" ADD COLUMN "image_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "property_images" ADD COLUMN "storage_path" TEXT;
ALTER TABLE "property_images" DROP COLUMN IF EXISTS "image_data";
ALTER TABLE "property_images" ALTER COLUMN "image_url" DROP DEFAULT;
