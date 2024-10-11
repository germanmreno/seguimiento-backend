/*
  Warnings:

  - You are about to drop the column `attachment` on the `memos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `memos` DROP COLUMN `attachment`;

-- CreateTable
CREATE TABLE `memo_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memoId` VARCHAR(191) NOT NULL,
    `attachment` ENUM('NO', 'CD', 'DIGITAL', 'PENDRIVE', 'CARPETA', 'IMPRESO') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `memo_attachments` ADD CONSTRAINT `memo_attachments_memoId_fkey` FOREIGN KEY (`memoId`) REFERENCES `memos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
