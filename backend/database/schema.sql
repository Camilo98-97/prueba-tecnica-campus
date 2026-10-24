CREATE DATABASE IF NOT EXISTS `CampusStudents` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `CampusStudents`;

CREATE TABLE `Professors` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) NOT NULL,
    PRIMARY KEY (`Id`)
);


CREATE TABLE `Students` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) NOT NULL,
    `Email` varchar(254) NOT NULL,
    `PasswordHash` varchar(512) NOT NULL,
    PRIMARY KEY (`Id`)
);


CREATE TABLE `Courses` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) NOT NULL,
    `Credits` int NOT NULL,
    `ProfessorId` int NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `AK_Courses_Id_ProfessorId` UNIQUE (`Id`, `ProfessorId`),
    CONSTRAINT `CK_Course_Credits` CHECK (Credits = 3),
    CONSTRAINT `FK_Courses_Professors_ProfessorId` FOREIGN KEY (`ProfessorId`) REFERENCES `Professors` (`Id`) ON DELETE RESTRICT
);


CREATE TABLE `Enrollments` (
    `StudentId` int NOT NULL,
    `CourseId` int NOT NULL,
    `ProfessorId` int NOT NULL,
    PRIMARY KEY (`StudentId`, `CourseId`),
    CONSTRAINT `FK_Enrollments_Courses_CourseId_ProfessorId` FOREIGN KEY (`CourseId`, `ProfessorId`) REFERENCES `Courses` (`Id`, `ProfessorId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Enrollments_Students_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `Students` (`Id`) ON DELETE CASCADE
);


INSERT INTO `Professors` (`Id`, `Name`)
VALUES (1, 'Laura Méndez');
SELECT ROW_COUNT();

INSERT INTO `Professors` (`Id`, `Name`)
VALUES (2, 'Carlos Rojas');
SELECT ROW_COUNT();

INSERT INTO `Professors` (`Id`, `Name`)
VALUES (3, 'Diana Torres');
SELECT ROW_COUNT();

INSERT INTO `Professors` (`Id`, `Name`)
VALUES (4, 'Andrés Ruiz');
SELECT ROW_COUNT();

INSERT INTO `Professors` (`Id`, `Name`)
VALUES (5, 'Sofía Castro');
SELECT ROW_COUNT();



INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (1, 3, 'Matemáticas', 1);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (2, 3, 'Estadística', 1);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (3, 3, 'Programación', 2);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (4, 3, 'Bases de datos', 2);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (5, 3, 'Física', 3);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (6, 3, 'Electrónica', 3);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (7, 3, 'Comunicación', 4);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (8, 3, 'Literatura', 4);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (9, 3, 'Inglés', 5);
SELECT ROW_COUNT();

INSERT INTO `Courses` (`Id`, `Credits`, `Name`, `ProfessorId`)
VALUES (10, 3, 'Emprendimiento', 5);
SELECT ROW_COUNT();



CREATE INDEX `IX_Courses_ProfessorId` ON `Courses` (`ProfessorId`);


CREATE INDEX `IX_Enrollments_CourseId_ProfessorId` ON `Enrollments` (`CourseId`, `ProfessorId`);


CREATE UNIQUE INDEX `IX_Enrollments_StudentId_ProfessorId` ON `Enrollments` (`StudentId`, `ProfessorId`);


CREATE UNIQUE INDEX `IX_Students_Email` ON `Students` (`Email`);


