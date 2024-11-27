-- AlterTable
ALTER TABLE `forums` ADD COLUMN `created_by` VARCHAR(191) NOT NULL DEFAULT '110';

-- AddForeignKey
ALTER TABLE `forums` ADD CONSTRAINT `forums_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
