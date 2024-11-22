/*
  Warnings:

  - You are about to drop the column `attachment` on the `memos` table. All the data in the column will be lost.
  - Added the required column `attachment_type` to the `memos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reception_images` to the `memos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `memos` DROP COLUMN `attachment`,
    ADD COLUMN `attachment_files` JSON NULL,
    ADD COLUMN `attachment_type` JSON NOT NULL,
    ADD COLUMN `reception_images` JSON NOT NULL;
