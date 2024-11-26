-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_forum_id_fkey`;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `memo_id` VARCHAR(191) NULL,
    MODIFY `forum_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_forum_id_fkey` FOREIGN KEY (`forum_id`) REFERENCES `forums`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_memo_id_fkey` FOREIGN KEY (`memo_id`) REFERENCES `memos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
