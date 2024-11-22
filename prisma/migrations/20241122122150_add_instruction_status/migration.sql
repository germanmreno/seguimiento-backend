-- AlterTable
ALTER TABLE `memos` ADD COLUMN `instruction_status` ENUM('PENDING', 'ASSIGNED') NOT NULL DEFAULT 'PENDING',
    MODIFY `instruction` VARCHAR(191) NULL;
