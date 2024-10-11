-- AlterTable
ALTER TABLE `memos` MODIFY `attachment` ENUM('NO', 'CD', 'DIGITAL', 'PENDRIVE', 'CARPETA', 'IMPRESO', 'OTHER') NOT NULL;
