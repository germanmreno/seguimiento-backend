/*
  Warnings:

  - You are about to alter the column `attachment` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `Json` to `Enum(EnumId(4))`.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `memos` MODIFY `attachment` ENUM('NO', 'CD', 'DIGITAL', 'PENDRIVE', 'CARPETA', 'IMPRESO') NOT NULL;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `User` (
    `ci` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `office` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_ci_key`(`ci`),
    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`ci`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forums` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `memo_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userCi` VARCHAR(191) NOT NULL,
    `forumId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `forums` ADD CONSTRAINT `forums_memo_id_fkey` FOREIGN KEY (`memo_id`) REFERENCES `memos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_userCi_fkey` FOREIGN KEY (`userCi`) REFERENCES `User`(`ci`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_forumId_fkey` FOREIGN KEY (`forumId`) REFERENCES `forums`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
