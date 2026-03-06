-- CreateTable
CREATE TABLE "property_comments" (
    "id" CHAR(36) NOT NULL,
    "author_id" CHAR(36) NOT NULL,
    "property_id" CHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corretor_comments" (
    "id" CHAR(36) NOT NULL,
    "author_id" CHAR(36) NOT NULL,
    "corretor_id" CHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corretor_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "property_comments" ADD CONSTRAINT "property_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_comments" ADD CONSTRAINT "property_comments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corretor_comments" ADD CONSTRAINT "corretor_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corretor_comments" ADD CONSTRAINT "corretor_comments_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
