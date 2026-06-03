CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patientName VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  doctorName VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  date VARCHAR(20) NOT NULL,
  time VARCHAR(20) NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'Scheduled'
);
USE hospital_db;
SELECT * FROM appointments;
