DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_code VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  available_days VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  health_issue VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(30) DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL
);

INSERT INTO doctors
(doctor_code, name, specialization, department, available_days, start_time, end_time, password)
VALUES
('D101', 'Dr. Ananya Sharma', 'General Physician',  'General Medicine', 'Monday,Tuesday,Wednesday,Thursday,Friday', '09:00:00', '17:00:00', 'doctor123'),
('D102', 'Dr. Rahul Mehta',   'Cardiologist',        'Cardiology',       'Monday,Wednesday,Friday',                  '10:00:00', '16:00:00', 'doctor123'),
('D103', 'Dr. Priya Nair',    'Dermatologist',       'Dermatology',      'Tuesday,Thursday,Saturday',                '09:00:00', '15:00:00', 'doctor123'),
('D104', 'Dr. Kabir Khan',    'Orthopedic',          'Orthopedics',      'Monday,Tuesday,Thursday',                  '11:00:00', '18:00:00', 'doctor123'),
('D105', 'Dr. Meera Iyer',    'Neurologist',         'Neurology',        'Wednesday,Friday,Saturday',                '10:00:00', '14:00:00', 'doctor123'),
('D106', 'Dr. Arjun Rao',     'Ophthalmologist',     'Eye Care',         'Monday,Thursday,Saturday',                 '09:30:00', '13:30:00', 'doctor123'),
('D107', 'Dr. Nisha Patel',   'Dentist',             'Dental',           'Tuesday,Wednesday,Friday',                 '10:00:00', '17:00:00', 'doctor123'),
('D108', 'Dr. Kavya Menon',   'Gynecologist',        'Gynecology',       'Monday,Wednesday,Friday',                  '09:00:00', '15:00:00', 'doctor123');

INSERT INTO admins (username, password)
VALUES ('admin', 'admin123');

-- Verify data loaded correctly
SELECT * FROM doctors;
select* From patients;
USE hospital_db;

-- Add 3 test patients
INSERT INTO patients (patient_code, name, age, gender, phone, address, email, password)
VALUES
('P1001', 'Ravi Kumar',  25, 'Male',   '9876543210', 'Chennai',    'ravi@gmail.com',  'ravi123'),
('P1002', 'Priya Devi',  30, 'Female', '9123456789', 'Madurai',    'priya@gmail.com', 'priya123'),
('P1003', 'Arun Selvam', 40, 'Male',   '9988776655', 'Coimbatore', 'arun@gmail.com',  'arun123');

-- Add 3 test appointments
INSERT INTO appointments (patient_id, doctor_id, health_issue, appointment_date, appointment_time, status)
VALUES
(1, 1, 'Regular Checkup', '2025-06-10', '10:00:00', 'Scheduled'),
(2, 2, 'Heart Problem',   '2025-06-11', '11:00:00', 'Completed'),
(3, 4, 'Bone Pain',       '2025-06-12', '14:00:00', 'Scheduled');

-- Verify
SELECT * FROM patients;
SELECT * FROM appointments;
