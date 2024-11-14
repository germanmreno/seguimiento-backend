/*
  Warnings:

  - You are about to alter the column `status` on the `forums` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `forums` MODIFY `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN';
