/*
  Warnings:

  - You are about to drop the column `user_id` on the `offices` table. All the data in the column will be lost.
  - You are about to drop the column `office` on the `user` table. All the data in the column will be lost.
  - Added the required column `office_id` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `offices` DROP FOREIGN KEY `offices_user_id_fkey`;

-- AlterTable
ALTER TABLE `offices` DROP COLUMN `user_id`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `office`,
    ADD COLUMN `office_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_ci_key` TO `user_ci_key`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_username_key` TO `user_username_key`;
