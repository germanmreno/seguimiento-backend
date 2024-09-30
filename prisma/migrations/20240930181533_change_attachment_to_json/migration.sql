-- CreateTable
CREATE TABLE `users` (
    `user_id` BINARY(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    `user_handle` VARCHAR(191) NOT NULL,
    `user_password` VARCHAR(191) NOT NULL,
    `user_role` VARCHAR(191) NOT NULL,
    `user_office` VARCHAR(191) NOT NULL,
    `email_address` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memos` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `applicant` VARCHAR(191) NOT NULL,
    `reception_method` ENUM('MESA_DE_PARTES', 'CORREO', 'PRE_VP') NOT NULL,
    `instruction` ENUM('PROCESAR', 'CHEQUEAR', 'COORDINAR', 'VERIFICAR', 'EVALUAR', 'PREPARAR', 'RESOLVER', 'SEGUIR', 'COORDINAREU', 'APOYAR', 'DIFUNDIR', 'PRESENTE', 'ESPERAR', 'ARCHIVAR') NOT NULL,
    `response_require` ENUM('YES', 'NO') NOT NULL,
    `urgency` ENUM('NORMAL', 'MEDIUM', 'PRIORITY', 'URGENT') NULL,
    `observation` VARCHAR(191) NOT NULL,
    `reception_date` DATE NOT NULL,
    `reception_hour` VARCHAR(191) NOT NULL,
    `attachment` JSON NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices` (
    `id` VARCHAR(191) NOT NULL,
    `abrev` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memos_offices` (
    `memo_id` VARCHAR(191) NOT NULL,
    `office_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`memo_id`, `office_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `memos_offices` ADD CONSTRAINT `memos_offices_memo_id_fkey` FOREIGN KEY (`memo_id`) REFERENCES `memos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memos_offices` ADD CONSTRAINT `memos_offices_office_id_fkey` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
