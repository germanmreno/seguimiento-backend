/*
  Warnings:

  - The primary key for the `forums` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `reception_method` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.
  - You are about to alter the column `instruction` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `VarChar(191)`.
  - You are about to alter the column `response_require` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `VarChar(191)`.
  - You are about to alter the column `urgency` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `VarChar(191)`.
  - You are about to alter the column `status` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `VarChar(191)`.
  - The primary key for the `messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `forumId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `userCi` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `memo_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attachment` to the `memos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forum_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `memo_attachments` DROP FOREIGN KEY `memo_attachments_memoId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_forumId_fkey`;

-- DropForeignKey
ALTER TABLE `messages` DROP FOREIGN KEY `messages_userCi_fkey`;

-- AlterTable
ALTER TABLE `forums` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `memos` ADD COLUMN `attachment` JSON NOT NULL,
    MODIFY `reception_method` VARCHAR(191) NOT NULL,
    MODIFY `instruction` VARCHAR(191) NOT NULL,
    MODIFY `response_require` VARCHAR(191) NOT NULL,
    MODIFY `urgency` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `messages` DROP PRIMARY KEY,
    DROP COLUMN `createdAt`,
    DROP COLUMN `forumId`,
    DROP COLUMN `userCi`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `forum_id` BIGINT NOT NULL,
    ADD COLUMN `user_id` BIGINT NOT NULL,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `offices` ADD COLUMN `user_id` BIGINT NULL;

-- DropTable
DROP TABLE `memo_attachments`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `offices` ADD CONSTRAINT `offices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_forum_id_fkey` FOREIGN KEY (`forum_id`) REFERENCES `forums`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
