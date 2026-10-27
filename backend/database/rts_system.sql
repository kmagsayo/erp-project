-- MariaDB dump 10.20-13.0.2-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: rts_system
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

--
-- Current Database: `rts_system`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `rts_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `rts_system`;

--
-- Table structure for table `billing_schedules`
--

DROP TABLE IF EXISTS `billing_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_schedules` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(255) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `project_id` varchar(255) NOT NULL,
  `project_name` varchar(255) NOT NULL,
  `invoice_no` varchar(255) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `withholding_tax` decimal(14,2) NOT NULL DEFAULT 0.00,
  `retention_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `recoupment_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `mobilization_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `contract_amount` decimal(14,2) NOT NULL,
  `monthly_amount` decimal(14,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `run_day` tinyint(3) unsigned NOT NULL,
  `remarks` text DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `installment_dates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`installment_dates`)),
  `installment_amounts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`installment_amounts`)),
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `billing_schedules_invoice_no_unique` (`invoice_no`),
  KEY `billing_schedules_status_index` (`status`),
  KEY `billing_schedules_start_date_index` (`start_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_schedules`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `billing_schedules` WRITE;
/*!40000 ALTER TABLE `billing_schedules` DISABLE KEYS */;
INSERT INTO `billing_schedules` VALUES
(1,'2','XYZ Industries','3','XYZ Plant Security System',NULL,'2026-10-23',0.00,0.00,0.00,0.00,10000.00,3333.33,'2026-10-23','2026-12-23',23,'test','[]','[null,\"2026-11-23\",\"2026-12-23\"]','[3333.33,3333.33,3333.34]','pending','2026-10-22 19:08:52','2026-10-22 19:09:19');
/*!40000 ALTER TABLE `billing_schedules` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `billings`
--

DROP TABLE IF EXISTS `billings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `billings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `billing_schedule_id` bigint(20) unsigned NOT NULL,
  `installment_no` smallint(5) unsigned NOT NULL,
  `due_date` date NOT NULL,
  `billing_no` varchar(255) NOT NULL,
  `invoice_no` varchar(255) NOT NULL,
  `customer_id` varchar(255) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `project_id` varchar(255) NOT NULL,
  `project_name` varchar(255) NOT NULL,
  `withholding_tax` decimal(14,2) NOT NULL DEFAULT 0.00,
  `retention_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `recoupment_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `mobilization_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `contract_amount` decimal(14,2) NOT NULL,
  `monthly_amount` decimal(14,2) NOT NULL,
  `net_amount` decimal(14,2) NOT NULL,
  `amount_paid` decimal(14,2) NOT NULL DEFAULT 0.00,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `run_script_date` varchar(255) NOT NULL,
  `remarks` text DEFAULT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `billings_billing_schedule_id_installment_no_unique` (`billing_schedule_id`,`installment_no`),
  UNIQUE KEY `billings_billing_schedule_id_due_date_unique` (`billing_schedule_id`,`due_date`),
  UNIQUE KEY `billings_billing_no_unique` (`billing_no`),
  UNIQUE KEY `billings_invoice_no_unique` (`invoice_no`),
  KEY `billings_due_date_index` (`due_date`),
  CONSTRAINT `billings_billing_schedule_id_foreign` FOREIGN KEY (`billing_schedule_id`) REFERENCES `billing_schedules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `billings` WRITE;
/*!40000 ALTER TABLE `billings` DISABLE KEYS */;
/*!40000 ALTER TABLE `billings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `contact_information` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_code_unique` (`code`),
  KEY `branches_status_index` (`status`),
  KEY `branches_company_id_foreign` (`company_id`),
  CONSTRAINT `branches_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES
(1,1,'RTS-MAIN','BR-001-RTS-MAIN','RM301E-3 MEDALLE BLDG. FUENTE OSMEÑA CAPITOL SITE, CEBU CITY','09175734911','active','2026-08-19 01:34:27','2026-10-21 03:07:25'),
(2,2,'RSC-MAIN','BR-002-RSC-MAIN','RM301E-2 MEDALLE BLDG. FUENTE OSMEÑA CAPITOL SITE, CEBU CITY','09175734911','active','2026-08-19 01:34:35','2026-10-21 03:07:25');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_code_unique` (`code`),
  KEY `brands_status_index` (`status`),
  KEY `brands_name_index` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES
(1,'HIKVISION','BRD-001',NULL,'active','2026-08-19 01:23:51','2026-10-21 03:01:12'),
(2,'DAHUA','BRD-002',NULL,'active','2026-08-19 01:23:56','2026-10-21 03:01:12'),
(3,'IMOU','BRD-003',NULL,'active','2026-08-19 01:23:59','2026-10-21 03:01:12'),
(4,'CISCO','BRD-004',NULL,'active','2026-08-19 01:24:03','2026-10-21 03:01:12'),
(5,'UBIQUITI','BRD-005',NULL,'active','2026-08-19 01:24:07','2026-10-21 03:01:12'),
(6,'SAMSUNG','BRD-006',NULL,'active','2026-08-19 01:24:48','2026-10-21 03:01:12'),
(7,'SUNMI','BRD-007',NULL,'active','2026-08-19 01:24:51','2026-10-21 03:01:12'),
(8,'BOSCH','BRD-008',NULL,'active','2026-08-19 01:25:37','2026-10-21 03:01:12'),
(9,'LOTUS','BRD-009',NULL,'active','2026-08-19 01:25:40','2026-10-21 03:01:12'),
(10,'KEN','BRD-010',NULL,'active','2026-08-19 01:25:49','2026-10-21 03:01:12'),
(11,'EPSON','BRD-011',NULL,'active','2026-08-19 01:25:52','2026-10-21 03:01:12'),
(12,'HP','BRD-012',NULL,'active','2026-08-19 01:25:56','2026-10-21 03:01:12'),
(13,'INGCO','BRD-013',NULL,'active','2026-08-19 01:26:01','2026-10-21 03:01:12'),
(14,'TPLINK','BRD-014',NULL,'active','2026-08-19 01:26:16','2026-10-21 03:01:12'),
(15,'ANKER','BRD-015',NULL,'active','2026-08-19 01:26:35','2026-10-21 03:01:12'),
(16,'RUIJIE','BRD-016',NULL,'active','2026-08-19 01:26:49','2026-10-21 03:01:12'),
(17,'BROTHER','BRD-017',NULL,'active','2026-08-19 01:27:00','2026-10-21 03:01:12'),
(18,'ROYU','BRD-018',NULL,'active','2026-08-19 01:27:17','2026-10-21 03:01:12'),
(19,'APC','BRD-019',NULL,'active','2026-08-19 01:27:37','2026-10-21 03:01:12'),
(20,'COMLINK','BRD-020',NULL,'active','2026-08-19 01:27:46','2026-10-21 03:01:12'),
(21,'VSOL','BRD-021',NULL,'active','2026-08-19 01:27:59','2026-10-21 03:01:12'),
(22,'SEAGATE','BRD-022',NULL,'active','2026-08-19 01:28:09','2026-10-21 03:01:12'),
(23,'PREMIUM LINE','BRD-023',NULL,'active','2026-08-19 01:28:14','2026-10-21 03:01:12'),
(24,'OMADA BY TPLINK','BRD-024',NULL,'active','2026-08-19 01:28:27','2026-10-21 03:01:12'),
(25,'ZKTECO','BRD-025',NULL,'active','2026-08-19 01:28:37','2026-10-21 03:01:12'),
(26,'ITC','BRD-026',NULL,'active','2026-08-19 01:28:45','2026-10-21 03:01:12'),
(27,'SPON','BRD-027',NULL,'active','2026-08-19 01:28:47','2026-10-21 03:01:12'),
(28,'GOODWE','BRD-028',NULL,'active','2026-08-19 01:29:01','2026-10-21 03:01:12'),
(29,'TIANDY','BRD-029',NULL,'active','2026-08-19 01:29:03','2026-10-21 03:01:12'),
(30,'PANASONIC','BRD-030',NULL,'active','2026-08-19 01:29:13','2026-10-21 03:01:12'),
(31,'ONTI','BRD-031',NULL,'active','2026-08-19 01:29:28','2026-10-21 03:01:12'),
(32,'CCA','BRD-032',NULL,'active','2026-08-19 01:29:30','2026-10-21 03:01:12'),
(33,'WESTERN DIGITAL','BRD-033',NULL,'active','2026-08-19 02:01:02','2026-10-21 03:01:12');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_code_unique` (`code`),
  KEY `categories_status_index` (`status`),
  KEY `categories_name_index` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'IP CAMERA','CAT-001',NULL,'active','2026-08-19 01:35:25','2026-10-21 03:01:12'),
(2,'NVR','CAT-002',NULL,'active','2026-08-19 01:36:52','2026-10-21 03:01:12'),
(3,'DVR','CAT-003',NULL,'active','2026-08-19 01:36:57','2026-10-21 03:01:12'),
(4,'SWITCHES/ROUTER','CAT-004',NULL,'active','2026-08-19 01:37:08','2026-10-21 03:01:12'),
(5,'ANALOG CAMERA','CAT-005',NULL,'active','2026-08-19 01:37:24','2026-10-21 03:01:12'),
(6,'CABLES','CAT-006',NULL,'active','2026-08-19 01:37:51','2026-10-21 03:01:12'),
(7,'OFFICE SUPPLIES','CAT-007','Office supplies.','active','2026-10-21 02:49:32','2026-10-21 03:01:12');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `contact_number` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `registration_information` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES
(1,'RESPONSIVCODE TECHNOLOGY SOLUTIONS','RM301E-3 MEDALLE BLDG. FUENTE OSMEÑA CAPITOL SITE, CEBU CITY','09175734911',NULL,NULL,'252-890-529-000','2026-08-19 01:31:11','2026-10-21 03:07:25'),
(2,'RSC TECHNOLOGY AND DEVELOPMENT CORPORATION','RM301E-2 MEDALLE BLDG. FUENTE OSMEÑA CAPITOL SITE, CEBU CITY','09175734911',NULL,NULL,'690-772-316-000','2026-08-19 01:32:06','2026-10-21 03:07:25');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `terms` int(10) unsigned DEFAULT NULL,
  `terms_type` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_code_unique` (`code`),
  KEY `customers_status_index` (`status`),
  KEY `customers_name_index` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES
(1,'ABC Corporation','CUST-001',NULL,NULL,'09171234567','123 Example Street, Cebu City','000-555-666-000',30,'IN DAYS','active','2026-10-21 02:15:43','2026-10-21 02:15:43'),
(2,'XYZ Industries','CUST-002',NULL,NULL,'09182345678','Mandaue City, Cebu','000-777-888-000',45,'IN DAYS','active','2026-10-21 02:15:43','2026-10-21 02:15:43'),
(3,'Global Tech Inc.','CUST-003',NULL,NULL,'09193456789','Cebu IT Park, Lahug, Cebu City','000-999-000-000',15,'IN DAYS','active','2026-10-21 02:15:43','2026-10-21 02:15:43');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `delivery_receipt_tokens`
--

DROP TABLE IF EXISTS `delivery_receipt_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_receipt_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `receipt_id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `received_by_name` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_receipt_tokens_token_unique` (`token`),
  KEY `delivery_receipt_tokens_user_id_foreign` (`user_id`),
  CONSTRAINT `delivery_receipt_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_receipt_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `delivery_receipt_tokens` WRITE;
/*!40000 ALTER TABLE `delivery_receipt_tokens` DISABLE KEYS */;
INSERT INTO `delivery_receipt_tokens` VALUES
(1,'039a82b2a89ce4d327bd2b894561f069','DR-000001',NULL,NULL,NULL,NULL,'2026-10-21 08:44:07','2026-10-21 08:44:07'),
(2,'ec72681e00e03ba5a2bb995fac8423a5','DR-000002',NULL,NULL,NULL,NULL,'2026-10-26 17:23:37','2026-10-26 17:23:37');
/*!40000 ALTER TABLE `delivery_receipt_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `item_code` varchar(255) NOT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `requires_serial` tinyint(1) NOT NULL DEFAULT 0,
  `item_name` varchar(255) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `category_id` bigint(20) unsigned NOT NULL,
  `brand_id` bigint(20) unsigned NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  `unit_of_measure_id` bigint(20) unsigned NOT NULL,
  `description` text DEFAULT NULL,
  `minimum_stock` int(10) unsigned NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `stock_on_hand` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_item_code_unique` (`item_code`),
  UNIQUE KEY `items_barcode_unique` (`barcode`),
  KEY `items_brand_id_foreign` (`brand_id`),
  KEY `items_model_id_foreign` (`model_id`),
  KEY `items_unit_of_measure_id_foreign` (`unit_of_measure_id`),
  KEY `items_status_index` (`status`),
  KEY `items_item_name_index` (`item_name`),
  KEY `items_category_id_brand_id_model_id_index` (`category_id`,`brand_id`,`model_id`),
  CONSTRAINT `items_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `items_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `product_models` (`id`),
  CONSTRAINT `items_unit_of_measure_id_foreign` FOREIGN KEY (`unit_of_measure_id`) REFERENCES `unit_of_measures` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(52,'ITM-0001','4800000000052',1,'DS-2CE76D0T-ITPFS',1800.00,5,1,1,5,'HIKVISION DS-2CE76D0T-ITPFS',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:29',4),
(53,'ITM-0002','4800000000053',0,'DH-PFS3206-4P-96',3500.00,4,2,35,5,'DAHUA DH-PFS3206-4P-96',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',3),
(54,'ITM-0003','4800000000054',1,'IP camera',4500.00,1,3,51,5,'IMOU IP camera',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(55,'ITM-0004','4800000000055',0,'Network switch',4500.00,4,4,52,5,'CISCO Network switch',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(56,'ITM-0005','4800000000056',0,'Access point',5500.00,4,5,53,5,'UBIQUITI Access point',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(57,'ITM-0006','4800000000057',0,'Monitor',7500.00,7,6,54,5,'SAMSUNG Monitor',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',1),
(58,'ITM-0007','4800000000058',1,'POS terminal',12000.00,7,7,55,5,'SUNMI POS terminal',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',1),
(59,'ITM-0008','4800000000059',1,'IP camera',4500.00,1,8,56,5,'BOSCH IP camera',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(60,'ITM-0009','4800000000060',0,'Electrical cable',40.00,6,9,57,7,'LOTUS Electrical cable',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',20),
(61,'ITM-0010','4800000000061',0,'Electrical cable',40.00,6,10,58,7,'KEN Electrical cable',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',20),
(62,'ITM-0011','4800000000062',1,'Printer',9000.00,7,11,59,5,'EPSON Printer',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',1),
(63,'ITM-0012','4800000000063',1,'Printer',9000.00,7,12,60,5,'HP Printer',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',1),
(64,'ITM-0013','4800000000064',0,'Power tool',2500.00,7,13,61,5,'INGCO Power tool',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(65,'ITM-0014','4800000000065',0,'Network switch',4500.00,4,14,62,5,'TPLINK Network switch',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(66,'ITM-0015','4800000000066',0,'Power bank',1500.00,7,15,63,1,'ANKER Power bank',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',4),
(67,'ITM-0016','4800000000067',0,'Network switch',4500.00,4,16,64,5,'RUIJIE Network switch',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(68,'ITM-0017','4800000000068',1,'Printer',9000.00,7,17,65,5,'BROTHER Printer',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',1),
(69,'ITM-0018','4800000000069',0,'Electrical cable',40.00,6,18,66,7,'ROYU Electrical cable',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',20),
(70,'ITM-0019','4800000000070',1,'UPS',6000.00,7,19,67,5,'APC UPS',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(71,'ITM-0020','4800000000071',0,'Network cable',25.00,6,20,68,7,'COMLINK Network cable',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',30),
(72,'ITM-0021','4800000000072',1,'ONU modem',1800.00,4,21,69,5,'VSOL ONU modem',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(73,'ITM-0022','4800000000073',1,'Hard disk drive',3500.00,7,22,70,1,'SEAGATE Hard disk drive',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',4),
(74,'ITM-0023','4800000000074',0,'Network cable',25.00,6,23,71,7,'PREMIUM LINE Network cable',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',30),
(75,'ITM-0024','4800000000075',0,'Access point',5500.00,4,24,72,5,'OMADA BY TPLINK Access point',0,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(76,'ITM-0025','4800000000076',1,'Access control terminal',8000.00,7,25,73,5,'ZKTECO Access control terminal',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',1),
(77,'ITM-0026','4800000000077',1,'IP speaker',4500.00,7,26,74,5,'ITC IP speaker',1,'active','2026-10-21 03:37:03','2026-10-21 03:37:04',2),
(78,'ITM-0027','4800000000078',1,'IP speaker',4500.00,7,27,75,5,'SPON IP speaker',1,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',2),
(79,'ITM-0028','4800000000079',1,'Solar inverter',25000.00,7,28,76,5,'GOODWE Solar inverter',1,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',1),
(80,'ITM-0029','4800000000080',1,'IP camera',4500.00,1,29,77,5,'TIANDY IP camera',1,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',2),
(81,'ITM-0030','4800000000081',1,'IP camera',4500.00,1,30,78,5,'PANASONIC IP camera',1,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',2),
(82,'ITM-0031','4800000000082',0,'Fiber optic cable',20.00,6,31,79,7,'ONTI Fiber optic cable',0,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',30),
(83,'ITM-0032','4800000000083',0,'Network cable',25.00,6,32,80,7,'CCA Network cable',0,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',30),
(84,'ITM-0033','4800000000084',1,'Hard disk drive',3500.00,7,33,81,1,'WESTERN DIGITAL Hard disk drive',1,'active','2026-10-21 03:37:04','2026-10-21 03:37:04',4);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2026_08_19_000001_create_settings_table',1),
(5,'2026_08_20_015425_create_personal_access_tokens_table',1),
(6,'2026_08_20_100000_create_companies_table',1),
(7,'2026_08_20_100010_create_branches_table',1),
(8,'2026_08_20_100020_create_customers_table',1),
(9,'2026_08_20_100030_create_suppliers_table',1),
(10,'2026_08_20_100040_create_positions_table',1),
(11,'2026_08_20_100050_create_categories_table',1),
(12,'2026_08_20_100060_create_brands_table',1),
(13,'2026_08_20_100070_create_product_models_table',1),
(14,'2026_08_20_100080_create_unit_of_measures_table',1),
(15,'2026_08_20_100090_create_items_table',1),
(16,'2026_08_20_100100_create_projects_table',1),
(17,'2026_08_20_210000_add_username_to_users_table',1),
(18,'2026_08_20_220000_add_setup_fields_to_users_table',1),
(19,'2026_08_25_100000_add_tin_to_customers_table',1),
(20,'2026_08_26_000011_add_tin_to_suppliers_table',1),
(21,'2026_08_26_000012_add_sample_setup_suppliers',1),
(22,'2026_08_26_000013_normalize_customer_codes',1),
(23,'2026_08_26_000014_add_terms_to_customers_table',1),
(24,'2026_08_26_000015_add_barcode_to_items_table',1),
(25,'2026_08_26_000015_add_stock_on_hand_to_items_table',1),
(26,'2026_08_26_000016_add_a4_bond_paper_item',1),
(27,'2026_08_27_000100_add_unit_price_to_items_table',1),
(28,'2026_08_27_000110_seed_item_unit_prices',1),
(29,'2026_08_27_000200_remove_sample_setup_records',1),
(30,'2026_08_27_000201_remove_remaining_sample_setups',1),
(31,'2026_08_27_000210_add_requires_serial_to_items',1),
(32,'2026_08_27_000220_restore_setup_items_suppliers_customers',1),
(33,'2026_10_21_000001_add_company_id_to_branches_table',1),
(34,'2026_10_21_210000_create_receiving_scans_table',1),
(35,'2026_10_22_003200_create_delivery_receipt_tokens_table',1),
(36,'2026_10_23_100000_create_billing_schedules_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES
(2,'App\\Models\\User',1,'erp-gui','9e3e2b37d9bcd97c435dfc2ca014509640d135f517e88268cca767be34e5a0a1','[\"*\"]','2026-10-21 02:17:18',NULL,'2026-10-21 02:17:17','2026-10-21 02:17:18'),
(12,'App\\Models\\User',1,'erp-gui','dfa41167a447a8addf9612006b066be04046623cee302591701fba6a5a0bd540','[\"*\"]','2026-10-21 02:45:28',NULL,'2026-10-21 02:45:28','2026-10-21 02:45:28'),
(18,'App\\Models\\User',1,'erp-gui','6b2e9db5ef84e7d818a14450a94e372712bbf4683660dc01dcf602c5b9de09b9','[\"*\"]',NULL,NULL,'2026-10-21 17:02:40','2026-10-21 17:02:40'),
(20,'App\\Models\\User',1,'erp-gui','524f93020b85ef50cb61065321b59762ba961bcb5dc7932dfded1aa262746d1d','[\"*\"]','2026-10-21 18:12:39',NULL,'2026-10-21 18:12:38','2026-10-21 18:12:39');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `positions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `positions_code_unique` (`code`),
  KEY `positions_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` VALUES
(1,'CEO/PRESIDENT','POS-001-CEOPRESIDENT',NULL,'active','2026-08-19 01:43:47','2026-08-19 01:43:47'),
(2,'ADMIN MANAGER','POS-002-ADMIN-MANAGER',NULL,'active','2026-08-19 01:43:50','2026-08-19 01:43:50'),
(3,'ADMIN STAFF','POS-003-ADMIN-STAFF',NULL,'active','2026-08-19 01:43:53','2026-08-19 01:43:53'),
(4,'AUTHORIZED PERSONNEL','POS-004-AUTHORIZED-PERSONNEL',NULL,'active','2026-08-19 01:44:28','2026-08-19 01:44:28'),
(5,'BUSINESS DEVELOPMENT OFFICER','POS-005-BUSINESS-DEVELOPMENT-OFF',NULL,'active','2026-08-19 01:44:40','2026-08-19 01:44:40'),
(6,'TECHNICAL PERSONNEL','POS-006-TECHNICAL-PERSONNEL',NULL,'active','2026-08-19 01:45:51','2026-08-19 01:45:51'),
(9,'INTERN','POS-001',NULL,'active','2026-10-21 18:13:55','2026-10-21 18:13:55');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `product_models`
--

DROP TABLE IF EXISTS `product_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_models` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `brand_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_models_brand_id_name_unique` (`brand_id`,`name`),
  KEY `product_models_brand_id_status_index` (`brand_id`,`status`),
  KEY `product_models_name_index` (`name`),
  CONSTRAINT `product_models_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_models`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `product_models` WRITE;
/*!40000 ALTER TABLE `product_models` DISABLE KEYS */;
INSERT INTO `product_models` VALUES
(1,1,'DS-2CE76D0T-ITPFS','DS-2CE76D0T-ITPFS','active','2026-08-19 01:54:30','2026-08-19 01:54:30'),
(2,1,'DS-2CD1023G0-IUF','DS-2CD1023G0-IUF','active','2026-08-19 01:54:41','2026-08-19 01:54:41'),
(3,1,'DS-2CD2155FWD-I #3','DS-2CD2155FWD-I','active','2026-08-19 01:54:58','2026-08-19 01:54:58'),
(4,1,'DS-7204HGHI-K1','DS-7204HGHI-K1','active','2026-08-19 01:55:14','2026-08-19 01:55:14'),
(5,1,'DS-7616NI-Q2','DS-7616NI-Q2','active','2026-08-19 01:55:25','2026-08-19 01:55:25'),
(6,1,'DS-2CD2047G2-L','DS-2CD2047G2-L','active','2026-08-19 01:55:39','2026-08-19 01:55:39'),
(7,1,'DS-2CE72DF3T-F','DS-2CE72DF3T-F','active','2026-08-19 01:55:52','2026-08-19 01:55:52'),
(8,1,'DS-2CD1327G2-LUF','DS-2CD1327G2-LUF','active','2026-08-19 01:56:07','2026-08-19 01:56:07'),
(9,1,'DS-2CD1047G0-L','DS-2CD1047G0-L','active','2026-08-19 01:56:23','2026-08-19 01:56:23'),
(10,1,'DS-2CD1023G0-IU','DS-2CD1023G0-IU','active','2026-08-19 01:56:38','2026-08-19 01:56:38'),
(11,1,'DS-2CD2347G2-L','DS-2CD2347G2-L','active','2026-08-19 01:57:14','2026-08-19 01:57:14'),
(12,1,'DS-3E0505P-EM','DS-3E0505P-EM','active','2026-08-19 01:57:36','2026-08-19 01:57:36'),
(13,1,'DS-3WR12GC','DS-3WR12GC','active','2026-08-19 01:57:55','2026-08-19 01:57:55'),
(14,1,'TVI-8CH4D4B-2MP-ECO','TVI-8CH4D4B-2MP-ECO','active','2026-08-19 01:58:06','2026-08-19 01:58:06'),
(15,1,'DS-3E1518P-EM','DS-3E1518P-EM','active','2026-08-19 01:58:21','2026-08-19 01:58:21'),
(16,1,'DS-2CD2T43G0-I5','DS-2CD2T43G0-I5','active','2026-08-19 01:58:35','2026-08-19 01:58:35'),
(17,1,'DS-2DE4425IW-DE','DS-2DE4425IW-DE','active','2026-08-19 01:58:45','2026-08-19 01:58:45'),
(18,1,'DS-2SE4C225MWG-E','DS-2SE4C225MWG-E','active','2026-08-19 01:58:55','2026-08-19 01:58:55'),
(19,1,'DS-1296ZJ-H','DS-1296ZJ-H','active','2026-08-19 01:59:04','2026-08-19 01:59:04'),
(20,1,'DS-3E0105P-E/M(B)','DS-3E0105P-E/M(B)','active','2026-08-19 01:59:17','2026-08-19 01:59:17'),
(21,1,'DS-9632NI-M8','DS-9632NI-M8','active','2026-08-19 02:01:22','2026-08-19 02:01:22'),
(22,1,'DS-2CE16D0T-IRPF ','DS-2CE16D0T-IRPF ','active','2026-08-19 02:01:51','2026-08-19 02:01:51'),
(23,1,'DS-7632NXI-K2(D)','DS-7632NXI-K2(D)','active','2026-08-19 02:02:07','2026-08-19 02:02:07'),
(24,1,'DS-2CD1027G2-L','DS-2CD1027G2-L','active','2026-08-19 02:02:44','2026-08-19 02:02:44'),
(25,1,'DS-2CD2155FWD-I','DS-2CD2155FWD-I','active','2026-08-19 02:04:10','2026-08-19 02:04:10'),
(26,1,'DS-7616NI-Q2/16P','DS-7616NI-Q2/16P','active','2026-08-19 02:28:32','2026-08-19 02:28:32'),
(27,1,'DS-2CD1047G3-LIU','DS-2CD1047G3-LIU','active','2026-08-19 02:28:45','2026-08-19 02:28:45'),
(28,1,'DS-7216HGHI-MI','DS-7216HGHI-MI','active','2026-08-19 02:28:58','2026-08-19 02:28:58'),
(29,1,'DS-7732NXI-K4(D)','DS-7732NXI-K4(D)','active','2026-08-19 02:29:22','2026-08-19 02:29:22'),
(30,1,'DS-3E0526P-E/M','DS-3E0526P-E/M','active','2026-08-19 02:30:10','2026-08-19 02:30:10'),
(31,1,'DS-2CD1347G2-L','DS-2CD1347G2-L','active','2026-08-19 02:31:48','2026-08-19 02:31:48'),
(32,1,'DS-2CD1047G2-L','DS-2CD1047G2-L','active','2026-08-19 02:32:22','2026-08-19 02:32:22'),
(33,1,'DS-2CE76D0T-EXIPF','DS-2CE76D0T-EXIPF','active','2026-08-19 02:32:31','2026-08-19 02:32:31'),
(34,1,'DS-3E0106HP-E','DS-3E0106HP-E','active','2026-08-19 02:33:10','2026-08-19 02:33:10'),
(35,2,'DH-PFS3206-4P-96','DH-PFS3206-4P-96','active','2026-08-19 02:34:13','2026-08-19 02:34:13'),
(36,2,'DH-PFS3106-4ET-60','DH-PFS3106-4ET-60','active','2026-08-19 02:34:25','2026-08-19 02:34:25'),
(37,2,'DH-HAC-HDW1200TRQN','DH-HAC-HDW1200TRQN','active','2026-08-19 02:35:03','2026-08-19 02:35:03'),
(38,2,'DH-HAC-HFW1239TLMN-LED','DH-HAC-HFW1239TLMN-LED','active','2026-08-19 02:35:41','2026-08-19 02:35:41'),
(39,2,'DH-HAC-HFW1509TLMN-LED','DH-HAC-HFW1509TLMN-LED','active','2026-08-19 02:35:58','2026-08-19 02:35:58'),
(40,2,'DH-XVR5104HS-X1','DH-XVR5104HS-X1','active','2026-08-19 02:36:09','2026-08-19 02:36:09'),
(41,2,'DH-XVR5104HS-I3','DH-XVR5104HS-I3','active','2026-08-19 02:36:18','2026-08-19 02:36:18'),
(42,2,'DH-IPC-HFW5442TN-ASE','DH-IPC-HFW5442TN-ASE','active','2026-08-19 02:36:28','2026-08-19 02:36:28'),
(43,2,'DH-IPC-HFW1230S1-S5','DH-IPC-HFW1230S1-S5','active','2026-08-19 02:37:05','2026-08-19 02:37:05'),
(44,2,'DHI-NVR5432-EI','DHI-NVR5432-EI','active','2026-08-19 02:37:15','2026-08-19 02:37:15'),
(45,2,'DHI-NVR5432-4KS3/L','DHI-NVR5432-4KS3/L','active','2026-08-19 02:37:28','2026-08-19 02:37:28'),
(46,2,'DHI-NVR5432-4KS3/L #46','DHI-NVR5432-4KS3/L','active','2026-08-19 02:37:58','2026-08-19 02:37:58'),
(47,2,'DHI-5432-4KS3/L','DHI-5432-4KS3/L','active','2026-08-19 03:06:39','2026-08-19 03:06:39'),
(48,2,'DH-CS4006-4GT-60','DH-CS4006-4GT-60','active','2026-08-19 03:07:14','2026-08-19 03:07:14'),
(49,2,'DH-CHS-4106-4ET-60','DH-CHS-4106-4ET-60','active','2026-08-19 03:31:03','2026-08-19 03:31:03'),
(51,3,'IP camera','MOD-003','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(52,4,'Network switch','MOD-004','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(53,5,'Access point','MOD-005','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(54,6,'Monitor','MOD-006','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(55,7,'POS terminal','MOD-007','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(56,8,'IP camera','MOD-008','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(57,9,'Electrical cable','MOD-009','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(58,10,'Electrical cable','MOD-010','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(59,11,'Printer','MOD-011','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(60,12,'Printer','MOD-012','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(61,13,'Power tool','MOD-013','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(62,14,'Network switch','MOD-014','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(63,15,'Power bank','MOD-015','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(64,16,'Network switch','MOD-016','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(65,17,'Printer','MOD-017','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(66,18,'Electrical cable','MOD-018','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(67,19,'UPS','MOD-019','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(68,20,'Network cable','MOD-020','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(69,21,'ONU modem','MOD-021','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(70,22,'Hard disk drive','MOD-022','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(71,23,'Network cable','MOD-023','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(72,24,'Access point','MOD-024','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(73,25,'Access control terminal','MOD-025','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(74,26,'IP speaker','MOD-026','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(75,27,'IP speaker','MOD-027','active','2026-10-21 03:37:03','2026-10-21 03:37:03'),
(76,28,'Solar inverter','MOD-028','active','2026-10-21 03:37:04','2026-10-21 03:37:04'),
(77,29,'IP camera','MOD-029','active','2026-10-21 03:37:04','2026-10-21 03:37:04'),
(78,30,'IP camera','MOD-030','active','2026-10-21 03:37:04','2026-10-21 03:37:04'),
(79,31,'Fiber optic cable','MOD-031','active','2026-10-21 03:37:04','2026-10-21 03:37:04'),
(80,32,'Network cable','MOD-032','active','2026-10-21 03:37:04','2026-10-21 03:37:04'),
(81,33,'Hard disk drive','MOD-033','active','2026-10-21 03:37:04','2026-10-21 03:37:04');
/*!40000 ALTER TABLE `product_models` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project_code` varchar(255) NOT NULL,
  `project_name` varchar(255) NOT NULL,
  `customer_id` bigint(20) unsigned NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_project_code_unique` (`project_code`),
  KEY `projects_status_index` (`status`),
  KEY `projects_customer_id_index` (`customer_id`),
  CONSTRAINT `projects_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES
(2,'PRJ-001','ABC Head Office CCTV',1,'123 Example Street, Cebu City','2026-10-22',NULL,'active',NULL,'2026-10-21 22:14:40','2026-10-21 22:14:40'),
(3,'PRJ-002','XYZ Plant Security System',2,'Mandaue City, Cebu','2026-10-22',NULL,'active',NULL,'2026-10-21 22:14:40','2026-10-21 22:14:40'),
(4,'PRJ-003','Global Tech Monitoring',3,'Cebu IT Park, Lahug, Cebu City','2026-10-22',NULL,'active',NULL,'2026-10-21 22:14:40','2026-10-21 22:14:40');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `receiving_scans`
--

DROP TABLE IF EXISTS `receiving_scans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `receiving_scans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receiving_scans_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receiving_scans`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `receiving_scans` WRITE;
/*!40000 ALTER TABLE `receiving_scans` DISABLE KEYS */;
/*!40000 ALTER TABLE `receiving_scans` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `company_address` text DEFAULT NULL,
  `company_phone` varchar(255) DEFAULT NULL,
  `company_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `date_format` varchar(255) NOT NULL DEFAULT 'F j, Y',
  `paper_size` varchar(255) NOT NULL DEFAULT 'A4',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
(1,'RESPONSIVCODE TECHNOLOGY SOLUTIONS','RM301-E3 Medalle Bldg., Fuente Osmeña, Capitol Site, Cebu City 6000','09175734911','info@responsivcode.com','WEB ADMINISTRATOR','admin@responsivcode.com','F j, Y','A4','2026-10-21 02:15:44','2026-10-21 02:15:44');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_code_unique` (`code`),
  KEY `suppliers_status_index` (`status`),
  KEY `suppliers_name_index` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES
(6,'Hikvision Philippines, Inc.','SUP-001','Ana Cruz',NULL,'09171234567','Cebu IT Park, Lahug, Cebu City','456-789-012-000','active','2026-10-21 02:15:43','2026-10-21 03:01:13'),
(7,'Dahua Technology Philippines, Inc.','SUP-002','Mark Reyes',NULL,'09182345678','Mandaue City, Cebu','567-890-123-000','active','2026-10-21 02:15:43','2026-10-21 03:01:13'),
(8,'Bosch Security Systems PH','SUP-003','Lara Tan',NULL,'09193456789','Cebu Business Park, Cebu City','678-901-234-000','active','2026-10-21 02:15:43','2026-10-21 03:01:13'),
(9,'Cebu Industrial Trading','SUP-004','Paolo Lim',NULL,'09204567890','Mandaue City, Cebu','789-012-345-000','active','2026-10-21 02:15:43','2026-10-21 03:01:13'),
(10,'Network Cable Trading','SUP-005','Nina Uy',NULL,'09215678901','Fuente Osmeña, Cebu City','890-123-456-000','active','2026-10-21 02:15:43','2026-10-21 03:01:13');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `unit_of_measures`
--

DROP TABLE IF EXISTS `unit_of_measures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_of_measures` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `symbol` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_of_measures_code_unique` (`code`),
  KEY `unit_of_measures_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_of_measures`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `unit_of_measures` WRITE;
/*!40000 ALTER TABLE `unit_of_measures` DISABLE KEYS */;
INSERT INTO `unit_of_measures` VALUES
(1,'PC/S','UOM-001','PC/S','active','2026-08-19 01:39:01','2026-10-21 03:01:12'),
(2,'BOX/ES','UOM-002','BOX/ES','active','2026-08-19 01:39:07','2026-10-21 03:01:12'),
(3,'PACK/S','UOM-003','PACK/S','active','2026-08-19 01:39:12','2026-10-21 03:01:12'),
(4,'SET','UOM-004','SET','active','2026-08-19 01:39:15','2026-10-21 03:01:12'),
(5,'UNIT','UOM-005','UNIT','active','2026-08-19 01:39:19','2026-10-21 03:01:12'),
(6,'LOT','UOM-006','LOT','active','2026-08-19 01:39:21','2026-10-21 03:01:12'),
(7,'METER/S','UOM-007','METER/S','active','2026-08-19 01:39:57','2026-10-21 03:01:12'),
(8,'FEET/FOOT','UOM-008','FEET/FOOT','active','2026-08-19 01:40:04','2026-10-21 03:01:12'),
(9,'REAM','UOM-009','rm','active','2026-10-21 02:49:32','2026-10-21 03:01:12');
/*!40000 ALTER TABLE `unit_of_measures` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `position_id` bigint(20) unsigned DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'user',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `users_position_id_foreign` (`position_id`),
  KEY `users_status_index` (`status`),
  KEY `users_type_index` (`type`),
  CONSTRAINT `users_position_id_foreign` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'WEB ADMINISTRATOR','admin',9,'admin@responsivcode.com',NULL,'$2y$12$jb4mBfP13WveUl4mosV3AeOiGOH.yZaVJ0Q/X1k5TXAE8j8VaPzV6','admin','active',NULL,'2026-10-21 02:15:44','2026-10-21 18:14:10'),
(2,'JON-ERIK SAYSON','skip',2,'skip@responsivcode.com',NULL,'$2y$12$3D1Ifo9Lt4ALMOqIPm/Ma.hlPhEwa4KpWWCBAxxLacz0ckzJR9JLK','admin','active',NULL,'2026-10-21 02:44:40','2026-10-21 02:44:40'),
(3,'LARKE GELBOLINGO','lark',1,'lark@responsivcode.com',NULL,'$2y$12$cVdL5Adb/ELIAXAYe0Kj5OfS2.LZBFqtozGiaAXZNtRano8jzAx22','admin','active',NULL,'2026-10-21 02:44:40','2026-10-21 02:44:40'),
(4,'CYRUS RANQUE','cyrus',3,'cyrus@responsivcode.com',NULL,'$2y$12$qSrwJpZUxT1zUG64mSDnWe0CP1Fjk9xA0FYXTboBysNFLMDOZiiOq','admin','active',NULL,'2026-10-21 02:44:40','2026-10-21 18:08:21'),
(5,'NIÑO ALONZO','nino',3,'nino@responsivcode.com',NULL,'$2y$12$ypc1sdypQET0Bo.qOKLNxe58Gc10gYNHSMvY.LrwT0.rPaGwlqq4m','user','active',NULL,'2026-10-21 02:44:41','2026-10-21 02:44:41');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- Dump completed on 2026-10-27 10:06:01
