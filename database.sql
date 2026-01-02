

CREATE TABLE IF NOT EXISTS `admin_users` 
(
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `age` INT(3) DEFAULT NULL,
  `holding_number` VARCHAR(50) DEFAULT NULL,
  `phone` VARCHAR(15) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `donations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `donation_type` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `mobile_number` VARCHAR(15) NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `timestamp` DATETIME NOT NULL,
  `status` ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transaction_id` (`transaction_id`),
  INDEX `idx_donation_type` (`donation_type`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `income` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `source` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `date` DATE NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `date` DATE NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `prayer_times` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `prayer_name` ENUM('ফজর', 'জোহর', 'আসর', 'মাগরিব', 'এশা') NOT NULL,
  `prayer_time` TIME NOT NULL,
  `effective_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_effective_date` (`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Current Prayer Times
INSERT INTO `prayer_times` (`prayer_name`, `prayer_time`, `effective_date`) VALUES
('ফজর', '05:15:00', '2025-12-02'),
('জোহর', '12:00:00', '2025-12-02'),
('আসর', '15:30:00', '2025-12-02'),
('মাগরিব', '17:20:00', '2025-12-02'),
('এশা', '18:45:00', '2025-12-02');

-- ===================================
-- Views for Easy Reporting
-- ===================================

-- Total Income View
CREATE OR REPLACE VIEW `v_total_income` AS
SELECT 
    SUM(amount) as total_income,
    COUNT(*) as total_transactions,
    DATE_FORMAT(date, '%Y-%m') as month
FROM income
GROUP BY DATE_FORMAT(date, '%Y-%m');

-- Total Expenses View
CREATE OR REPLACE VIEW `v_total_expenses` AS
SELECT 
    SUM(amount) as total_expenses,
    COUNT(*) as total_transactions,
    DATE_FORMAT(date, '%Y-%m') as month
FROM expenses
GROUP BY DATE_FORMAT(date, '%Y-%m');

-- Donation Summary View
CREATE OR REPLACE VIEW `v_donation_summary` AS
SELECT 
    donation_type,
    COUNT(*) as total_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    payment_method
FROM donations
WHERE status = 'Completed'
GROUP BY donation_type, payment_method;

