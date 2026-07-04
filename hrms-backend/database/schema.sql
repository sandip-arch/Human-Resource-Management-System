-- Create Database if not exists (User can import this schema)
CREATE DATABASE IF NOT EXISTS `hrms_db`;
USE `hrms_db`;

-- Users Table (emp_id as PRIMARY KEY)
CREATE TABLE IF NOT EXISTS `users` (
  `emp_id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'employee') NOT NULL,
  `status` ENUM('pending', 'approved') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employee Profiles Table (user_id as VARCHAR(50))
CREATE TABLE IF NOT EXISTS `employee_profiles` (
  `user_id` VARCHAR(50) PRIMARY KEY,
  `phone` VARCHAR(20) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT NULL,
  `joining_date` DATE DEFAULT NULL,
  `basic_pay` DECIMAL(10, 2) DEFAULT 0.00,
  `about` TEXT DEFAULT NULL,
  `skills` TEXT DEFAULT NULL,
  `certifications` TEXT DEFAULT NULL,
  `performance_rating` DECIMAL(2, 1) DEFAULT 5.0,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bank Details Table (user_id as VARCHAR(50))
CREATE TABLE IF NOT EXISTS `bank_details` (
  `user_id` VARCHAR(50) PRIMARY KEY,
  `bank_name` VARCHAR(255) DEFAULT NULL,
  `account_number` VARCHAR(255) DEFAULT NULL,
  `ifsc_code` VARCHAR(100) DEFAULT NULL,
  `pan_number` VARCHAR(100) DEFAULT NULL,
  `uan_number` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'unverified',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance Table (user_id as VARCHAR(50))
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `clock_in` TIME NOT NULL,
  `clock_out` TIME DEFAULT NULL,
  `status` ENUM('present', 'absent', 'late', 'half-day') DEFAULT 'present',
  `working_hours` DECIMAL(4, 2) DEFAULT NULL,
  UNIQUE KEY `user_date_unique` (`user_id`, `date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leaves Table (user_id as VARCHAR(50))
CREATE TABLE IF NOT EXISTS `leaves` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `leave_type` ENUM('casual', 'sick', 'lop', 'other') NOT NULL,
  `from_date` DATE NOT NULL,
  `to_date` DATE NOT NULL,
  `reason` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payslips Table (user_id as VARCHAR(50))
CREATE TABLE IF NOT EXISTS `payslips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `month` INT NOT NULL,
  `year` INT NOT NULL,
  `basic_pay` DECIMAL(10, 2) NOT NULL,
  `allowance_hra` DECIMAL(10, 2) DEFAULT 0.00,
  `allowance_da` DECIMAL(10, 2) DEFAULT 0.00,
  `allowance_special` DECIMAL(10, 2) DEFAULT 0.00,
  `deduction_pf` DECIMAL(10, 2) DEFAULT 0.00,
  `deduction_tax` DECIMAL(10, 2) DEFAULT 0.00,
  `deduction_tds` DECIMAL(10, 2) DEFAULT 0.00,
  `net_salary` DECIMAL(10, 2) NOT NULL,
  `pdf_path` VARCHAR(255) DEFAULT NULL,
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`emp_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Holidays Table
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `date` DATE UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
