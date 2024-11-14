/*
  Warnings:

  - You are about to drop the `message_attachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `message_attachments` DROP FOREIGN KEY `message_attachments_message_id_fkey`;

-- AlterTable
ALTER TABLE `messages` ADD COLUMN `fileName` VARCHAR(191) NULL,
    ADD COLUMN `fileUrl` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `message_attachments`;
