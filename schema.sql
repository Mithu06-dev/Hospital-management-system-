-- =============================================
--  MediCore HMS — database/schema.sql
--  MySQL Database Schema
--  Run: mysql -u root -p < schema.sql
-- =============================================

-- 1. Create & use the database
CREATE DATABASE IF NOT EXISTS medicore_hms
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE medicore_hms;

-- ──────────────────────────────────────────────
--  TABLE: users  (login credentials)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,          -- store hashed in production
    role       ENUM('admin','staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password: admin123)
INSERT IGNORE INTO users (username, password, role)
VALUES ('admin', 'admin123', 'admin');


-- ──────────────────────────────────────────────
--  TABLE: patients
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150)  NOT NULL,
    age        TINYINT UNSIGNED NOT NULL,
    disease    VARCHAR(200)  NOT NULL,
    mobile     VARCHAR(20)   NOT NULL,
    address    VARCHAR(300)  NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ──────────────────────────────────────────────
--  TABLE: doctors
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150)  NOT NULL,
    age            TINYINT UNSIGNED NOT NULL,
    specialization VARCHAR(150)  NOT NULL,
    experience     TINYINT UNSIGNED NOT NULL COMMENT 'Years of experience',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ──────────────────────────────────────────────
--  TABLE: appointments
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    date         DATE        NOT NULL,
    time         TIME        NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    doctor_name  VARCHAR(150) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ──────────────────────────────────────────────
--  SAMPLE DATA (optional — remove in production)
-- ──────────────────────────────────────────────
INSERT IGNORE INTO patients (name, age, disease, mobile, address) VALUES
('Ravi Kumar',    45, 'Hypertension',    '+91 9876543210', 'Chennai, Tamil Nadu'),
('Meena Devi',    32, 'Diabetes Type 2', '+91 9123456789', 'Coimbatore, Tamil Nadu'),
('Arjun Sharma',  58, 'Arthritis',       '+91 9988776655', 'Bangalore, Karnataka');

INSERT IGNORE INTO doctors (name, age, specialization, experience) VALUES
('Dr. Priya Nair',    40, 'Cardiology',    12),
('Dr. Suresh Menon',  52, 'Orthopedics',   20),
('Dr. Lakshmi Rao',   36, 'Neurology',      8);

INSERT IGNORE INTO appointments (date, time, patient_name, doctor_name) VALUES
(CURDATE(), '10:00:00', 'Ravi Kumar',   'Dr. Priya Nair'),
(CURDATE(), '11:30:00', 'Meena Devi',   'Dr. Lakshmi Rao'),
(CURDATE(), '14:00:00', 'Arjun Sharma', 'Dr. Suresh Menon');
