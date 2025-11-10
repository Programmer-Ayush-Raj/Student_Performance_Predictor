-- ================================================
-- STUDENT MANAGEMENT SYSTEM - DATABASE SETUP
-- ================================================

-- Create Database
DROP DATABASE IF EXISTS student_management;
CREATE DATABASE student_management;
USE student_management;

-- ================================================
-- CREATE TABLES
-- ================================================

-- Department Table
CREATE TABLE Department (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    DepartmentName VARCHAR(100) NOT NULL UNIQUE
);

-- Student Table
CREATE TABLE Student (
    StudentID INT PRIMARY KEY AUTO_INCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(15),
    DateOfBirth DATE,
    Gender ENUM('Male', 'Female', 'Other'),
    Address TEXT,
    DepartmentID INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON DELETE SET NULL
);

-- Classroom Table
CREATE TABLE Classroom (
    RoomNumber VARCHAR(20) PRIMARY KEY,
    Capacity INT NOT NULL,
    Building VARCHAR(50) NOT NULL
);

-- Teacher Table
CREATE TABLE Teacher (
    TeacherID INT PRIMARY KEY AUTO_INCREMENT,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(15),
    DepartmentID INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON DELETE SET NULL
);

-- Course Table
CREATE TABLE Course (
    CourseID INT PRIMARY KEY AUTO_INCREMENT,
    CourseName VARCHAR(100) NOT NULL,
    DepartmentID INT,
    Credits INT NOT NULL,
    TeacherID INT,
    RoomNumber VARCHAR(20),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON DELETE SET NULL,
    FOREIGN KEY (TeacherID) REFERENCES Teacher(TeacherID) ON DELETE SET NULL,
    FOREIGN KEY (RoomNumber) REFERENCES Classroom(RoomNumber) ON DELETE SET NULL
);

-- Enrollment Table
CREATE TABLE Enrollment (
    EnrollmentID INT PRIMARY KEY AUTO_INCREMENT,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    EnrollmentDate DATE NOT NULL,
    Grade VARCHAR(2),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID) ON DELETE CASCADE,
    FOREIGN KEY (CourseID) REFERENCES Course(CourseID) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (StudentID, CourseID)
);

-- Users Table for Authentication
CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Admin', 'Teacher', 'Student') NOT NULL DEFAULT 'Student',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- INSERT SAMPLE DATA
-- ================================================

-- Insert Departments
INSERT INTO Department (DepartmentName) VALUES 
('Computer Science'),
('Mathematics'),
('Physics'),
('Chemistry'),
('Biology'),
('English');

-- Insert Classrooms
INSERT INTO Classroom (RoomNumber, Capacity, Building) VALUES 
('101', 40, 'Building A'),
('102', 35, 'Building A'),
('103', 45, 'Building A'),
('201', 50, 'Building B'),
('202', 30, 'Building B'),
('203', 40, 'Building B'),
('301', 25, 'Building C'),
('302', 35, 'Building C');

-- Insert Teachers
INSERT INTO Teacher (FullName, Email, PhoneNumber, DepartmentID) VALUES 
('Dr. Srinivas Reddy', 'srinivas.reddy@university.edu', '1234567890', 1),
('Dr. Nidhi Tripathi', 'nidhi.tripathi@university.edu', '0987654321', 2),
('Dr. Raghuvendra Solakni', 'raghuvendra.solanki@university.edu', '1122334455', 3),
('Dr. Richa Dubey', 'richa.dubey@university.edu', '2233445566', 4),
('Dr. Ravichandra Singh', 'ravichandra.singh@university.edu', '3344556677', 5);

-- Insert Courses
INSERT INTO Course (CourseName, DepartmentID, Credits, TeacherID, RoomNumber) VALUES 
('Data Structures', 1, 4, 1, '101'),
('Algorithms', 1, 4, 1, '102'),
('Database Systems', 1, 3, 1, '103'),
('Calculus I', 2, 3, 2, '201'),
('Linear Algebra', 2, 3, 2, '202'),
('Physics I', 3, 4, 3, '301'),
('Quantum Mechanics', 3, 4, 3, '302'),
('Organic Chemistry', 4, 4, 4, '201'),
('Cell Biology', 5, 3, 5, '202');

-- Insert Students
INSERT INTO Student (FullName, Email, PhoneNumber, DateOfBirth, Gender, Address, DepartmentID) VALUES 
('Riya Jain', 'riya.jain@student.edu', '5551234567', '2000-05-15', 'Female', '123 Udaipur, Rajasthan', 1),
('Ankit Srivastav', 'ankit.srivastav@student.edu', '5559876543', '2001-08-20', 'Male', '456 Bangalore, Karnataka', 2),
('Abhishek Sharma', 'abhishek.sharma@student.edu', '5555555555', '1999-12-10', 'Male', '789 Chennai, Tamil Nadu', 3),
('Shreya Gupta', 'shreya.gupta@student.edu', '5552223333', '2000-03-25', 'Female', '321 Jaipur, Rajasthan', 1),
('Harsh Bansal', 'harsh.bansal@student.edu', '5554445555', '2001-07-08', 'Male', '654 Gurgaon, Delhi', 2),
('Deepti Dave', 'deepti.dave@student.edu', '5556667777', '2000-11-30', 'Female', '987 Bhopal, MP', 4),
('Yash Patel', 'yash.patel@student.edu', '5558889999', '1999-09-15', 'Male', '147 Ahmedabad, Gujarat', 3),
('Vaishali Tiwari', 'vaishali.tiwari@student.edu', '5551112222', '2001-02-14', 'Female', '258 Lucknow, UP', 5);

-- Insert Enrollments
INSERT INTO Enrollment (StudentID, CourseID, EnrollmentDate, Grade) VALUES 
(1, 1, '2024-01-15', 'A'),
(1, 2, '2024-01-15', 'A-'),
(2, 4, '2024-01-16', 'A+'),
(2, 5, '2024-01-16', 'A'),
(3, 6, '2024-01-17', 'B+'),
(3, 7, '2024-01-17', 'B'),
(4, 1, '2024-01-15', 'B+'),
(4, 3, '2024-01-15', 'A-'),
(5, 4, '2024-01-16', 'A'),
(6, 8, '2024-01-18', 'A+'),
(7, 6, '2024-01-17', 'B'),
(8, 9, '2024-01-19', 'A-');

-- Insert Default Admin User
-- Username: admin
-- Password: admin123
INSERT INTO Users (Username, Password, Role) VALUES 
('admin', '$2b$10$YQW8jV9WqFZ3K5Z5Z5Z5Z.YQW8jV9WqFZ3K5Z5Z5Z5Z5YQW8jV9Wq', 'Admin');

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Show all tables
SELECT 'Tables Created:' as Status;
SHOW TABLES;

-- Show counts
SELECT 'Data Summary:' as Status;
SELECT 
    (SELECT COUNT(*) FROM Department) as Departments,
    (SELECT COUNT(*) FROM Teacher) as Teachers,
    (SELECT COUNT(*) FROM Student) as Students,
    (SELECT COUNT(*) FROM Course) as Courses,
    (SELECT COUNT(*) FROM Classroom) as Classrooms,
    (SELECT COUNT(*) FROM Enrollment) as Enrollments,
    (SELECT COUNT(*) FROM Users) as Users;

SELECT '✓ Database setup complete!' as Status;