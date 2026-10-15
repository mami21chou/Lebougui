-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: localhost    Database: Lebougui_DB
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',3,'add_permission'),(6,'Can change permission',3,'change_permission'),(7,'Can delete permission',3,'delete_permission'),(8,'Can view permission',3,'view_permission'),(9,'Can add group',2,'add_group'),(10,'Can change group',2,'change_group'),(11,'Can delete group',2,'delete_group'),(12,'Can view group',2,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add vehicule',10,'add_vehicule'),(22,'Can change vehicule',10,'change_vehicule'),(23,'Can delete vehicule',10,'delete_vehicule'),(24,'Can view vehicule',10,'view_vehicule'),(25,'Can add utilisateur',9,'add_utilisateur'),(26,'Can change utilisateur',9,'change_utilisateur'),(27,'Can delete utilisateur',9,'delete_utilisateur'),(28,'Can view utilisateur',9,'view_utilisateur'),(29,'Can add premium',6,'add_premium'),(30,'Can change premium',6,'change_premium'),(31,'Can delete premium',6,'delete_premium'),(32,'Can view premium',6,'view_premium'),(33,'Can add profil livreur',7,'add_profillivreur'),(34,'Can change profil livreur',7,'change_profillivreur'),(35,'Can delete profil livreur',7,'delete_profillivreur'),(36,'Can view profil livreur',7,'view_profillivreur'),(37,'Can add profil pecheur',8,'add_profilpecheur'),(38,'Can change profil pecheur',8,'change_profilpecheur'),(39,'Can delete profil pecheur',8,'delete_profilpecheur'),(40,'Can view profil pecheur',8,'view_profilpecheur'),(41,'Can add publication',13,'add_publication'),(42,'Can change publication',13,'change_publication'),(43,'Can delete publication',13,'delete_publication'),(44,'Can view publication',13,'view_publication'),(45,'Can add produit',12,'add_produit'),(46,'Can change produit',12,'change_produit'),(47,'Can delete produit',12,'delete_produit'),(48,'Can view produit',12,'view_produit'),(49,'Can add information',11,'add_information'),(50,'Can change information',11,'change_information'),(51,'Can delete information',11,'delete_information'),(52,'Can view information',11,'view_information'),(53,'Can add commande',15,'add_commande'),(54,'Can change commande',15,'change_commande'),(55,'Can delete commande',15,'delete_commande'),(56,'Can view commande',15,'view_commande'),(57,'Can add alerte',14,'add_alerte'),(58,'Can change alerte',14,'change_alerte'),(59,'Can delete alerte',14,'delete_alerte'),(60,'Can view alerte',14,'view_alerte'),(61,'Can add livraison',16,'add_livraison'),(62,'Can change livraison',16,'change_livraison'),(63,'Can delete livraison',16,'delete_livraison'),(64,'Can view livraison',16,'view_livraison'),(65,'Can add produit commande',18,'add_produitcommande'),(66,'Can change produit commande',18,'change_produitcommande'),(67,'Can delete produit commande',18,'delete_produitcommande'),(68,'Can view produit commande',18,'view_produitcommande'),(69,'Can add note',17,'add_note'),(70,'Can change note',17,'change_note'),(71,'Can delete note',17,'delete_note'),(72,'Can view note',17,'view_note'),(73,'Can add fcm token',19,'add_fcmtoken'),(74,'Can change fcm token',19,'change_fcmtoken'),(75,'Can delete fcm token',19,'delete_fcmtoken'),(76,'Can view fcm token',19,'view_fcmtoken');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_alerte`
--

DROP TABLE IF EXISTS `commandes_alerte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_alerte` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_poisson` varchar(100) NOT NULL,
  `zone` varchar(100) NOT NULL,
  `statut` varchar(10) NOT NULL,
  `acheteur_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `commandes_alerte_acheteur_id_8b189605_fk_utilisate` (`acheteur_id`),
  CONSTRAINT `commandes_alerte_acheteur_id_8b189605_fk_utilisate` FOREIGN KEY (`acheteur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_alerte`
--

LOCK TABLES `commandes_alerte` WRITE;
/*!40000 ALTER TABLE `commandes_alerte` DISABLE KEYS */;
INSERT INTO `commandes_alerte` VALUES (1,'Thiof','','active',12),(3,'Thiof','','active',17),(10,'crevette','','active',15);
/*!40000 ALTER TABLE `commandes_alerte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_commande`
--

DROP TABLE IF EXISTS `commandes_commande`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_commande` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) NOT NULL,
  `date_commande` datetime(6) NOT NULL,
  `date_limite_confirmation` datetime(6) DEFAULT NULL,
  `distance_km` decimal(6,2) DEFAULT NULL,
  `frais_livraison` decimal(10,2) NOT NULL,
  `statut` varchar(30) NOT NULL,
  `acheteur_id` bigint NOT NULL,
  `pecheur_id` bigint NOT NULL,
  `adresse_livraison` varchar(100) NOT NULL,
  `latitude_livraison` double DEFAULT NULL,
  `longitude_livraison` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  KEY `commandes_commande_acheteur_id_62b7fe1b_fk_utilisate` (`acheteur_id`),
  KEY `commandes_commande_pecheur_id_f271507c_fk_utilisate` (`pecheur_id`),
  CONSTRAINT `commandes_commande_acheteur_id_62b7fe1b_fk_utilisate` FOREIGN KEY (`acheteur_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `commandes_commande_pecheur_id_f271507c_fk_utilisate` FOREIGN KEY (`pecheur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_commande`
--

LOCK TABLES `commandes_commande` WRITE;
/*!40000 ALTER TABLE `commandes_commande` DISABLE KEYS */;
INSERT INTO `commandes_commande` VALUES (1,'CMD-4CB2789567','2026-09-18 01:06:57.187648',NULL,NULL,0.00,'livree',15,8,'bargny',NULL,NULL),(2,'CMD-1F681A5867','2026-09-18 01:31:00.274673',NULL,NULL,0.00,'en_attente_paiement',8,8,'rufique',NULL,NULL),(3,'CMD-2E70233C5E','2026-09-20 08:47:11.792592',NULL,NULL,0.00,'livree',15,8,'Bargny',NULL,NULL),(4,'CMD-09C17963CF','2026-09-20 09:25:15.254424',NULL,NULL,0.00,'refusee',15,8,'Bargny',NULL,NULL),(5,'CMD-95D0A033C0','2026-09-20 10:37:53.432842',NULL,NULL,0.00,'livree',15,13,'Bargny',NULL,NULL),(6,'CMD-BB13350017','2026-09-20 14:19:37.616981',NULL,NULL,0.00,'refusee',12,8,'Bargny',NULL,NULL),(7,'CMD-C30E819341','2026-09-21 09:08:46.834282',NULL,NULL,0.00,'refusee',12,8,'ggg',NULL,NULL),(8,'CMD-99C6D7054C','2026-09-21 10:47:36.868857',NULL,NULL,0.00,'refusee',12,8,'Dakar Senegal',NULL,NULL),(9,'CMD-D41191166C','2026-09-21 11:09:38.119323',NULL,NULL,0.00,'livree',15,8,'Kolda',NULL,NULL),(10,'CMD-AD81D2F9A9','2026-09-21 15:52:54.581872',NULL,NULL,0.00,'livree',15,8,'Yoff Tonghor',NULL,NULL),(11,'CMD-956197670F','2026-09-21 16:07:27.267001',NULL,NULL,0.00,'livree',15,13,'uuuu',NULL,NULL),(12,'CMD-8E5BF0379F','2026-09-23 10:26:13.052262',NULL,NULL,0.00,'en_livraison',15,8,'cite keur gorgui',NULL,NULL),(13,'CMD-3E088A182A','2026-09-23 12:30:03.373798',NULL,NULL,0.00,'livree',15,8,'Bargny',NULL,NULL),(14,'CMD-1EE9D79A1C','2026-09-23 12:30:50.954597',NULL,NULL,0.00,'livree',18,8,'Rufisque',NULL,NULL),(15,'CMD-CD33EAF9AB','2026-09-23 12:38:22.796387',NULL,NULL,0.00,'livree',12,8,'Bargny',NULL,NULL),(16,'CMD-512068E44C','2026-09-23 13:37:27.806303',NULL,NULL,0.00,'en_attente_pecheur',15,7,'mermoz',NULL,NULL),(17,'CMD-7C4E9CCA3F','2026-09-23 15:10:30.464092',NULL,NULL,0.00,'livree',12,8,'Bargny',NULL,NULL),(18,'CMD-827FFA70D9','2026-09-25 14:57:57.780058',NULL,NULL,0.00,'livree',18,8,'Bargny',NULL,NULL),(19,'CMD-D29476CC51','2026-09-25 15:01:56.960571',NULL,NULL,0.00,'livree',18,8,'Kolda',NULL,NULL),(20,'CMD-9C85AF275A','2026-09-25 16:25:18.913979',NULL,NULL,0.00,'livree',15,8,'Bargny Cite Est 2',NULL,NULL),(21,'CMD-DC5A46F462','2026-09-29 06:23:55.985151',NULL,NULL,0.00,'en_attente_pecheur',15,8,'Colobane bopp',NULL,NULL),(22,'CMD-39349AA134','2026-09-29 06:30:44.470142',NULL,NULL,0.00,'en_attente_pecheur',15,13,'Colobane',NULL,NULL),(23,'CMD-A7AF1406D6','2026-09-30 15:40:18.105685',NULL,NULL,0.00,'livree',15,8,'Colobane',NULL,NULL),(24,'CMD-1E16975ADF','2026-10-01 05:40:38.120274',NULL,NULL,0.00,'en_attente_pecheur',15,13,'Colobane',NULL,NULL),(25,'CMD-EB49825984','2026-10-01 05:41:30.841380',NULL,NULL,0.00,'livree',15,8,'Colobane',NULL,NULL),(26,'CMD-5613CE7204','2026-10-01 06:31:31.995947',NULL,NULL,0.00,'livree',15,8,'Colobane',NULL,NULL),(27,'CMD-E895CC898B','2026-10-01 10:22:04.210986',NULL,NULL,0.00,'livree',15,8,'Colobane',NULL,NULL),(28,'CMD-D524D6A63D','2026-10-01 12:10:22.040363',NULL,NULL,0.00,'en_attente_pecheur',15,24,'Colobane',NULL,NULL),(29,'CMD-125D476614','2026-10-06 10:50:41.832707',NULL,NULL,0.00,'livree',15,24,'Colobane',NULL,NULL),(30,'CMD-0D9A3D0A35','2026-10-06 11:40:53.048493',NULL,NULL,0.00,'payee',15,24,'Colobane',14.3025538,-16.0841367),(31,'CMD-54DAB7FA40','2026-10-07 12:32:07.426898',NULL,NULL,0.00,'en_attente_pecheur',15,7,'Colobane',14.3025538,-16.0841367),(32,'CMD-7BD4CA0000','2026-10-07 12:50:48.919664',NULL,NULL,0.00,'payee',15,24,'Colobane',14.3025538,-16.0841367),(33,'CMD-0BD3193B09','2026-10-07 13:01:34.298971',NULL,NULL,0.00,'en_attente_pecheur',15,7,'Colobane',14.3025538,-16.0841367),(34,'CMD-7DE7C74392','2026-10-07 13:02:20.141944',NULL,NULL,0.00,'payee',15,24,'Colobane',14.3025538,-16.0841367),(35,'CMD-57AFE4BEC7','2026-10-07 13:15:12.546354',NULL,NULL,0.00,'payee',15,8,'Colobane',14.3025538,-16.0841367),(36,'CMD-5DA4B9C0DC','2026-10-07 13:16:40.380678',NULL,NULL,0.00,'payee',15,24,'Colobane',14.3025538,-16.0841367);
/*!40000 ALTER TABLE `commandes_commande` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_livraison`
--

DROP TABLE IF EXISTS `commandes_livraison`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_livraison` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `statut` varchar(30) NOT NULL,
  `tarif_livraison` decimal(10,2) NOT NULL,
  `itineraire` json DEFAULT NULL,
  `date_livraison` datetime(6) DEFAULT NULL,
  `livreur_id` bigint DEFAULT NULL,
  `date_acceptation` datetime(6) DEFAULT NULL,
  `date_recuperation` datetime(6) DEFAULT NULL,
  `position_latitude` double DEFAULT NULL,
  `position_longitude` double DEFAULT NULL,
  `position_updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandes_livraison_livreur_id_5b6ee1fa_fk_utilisate` (`livreur_id`),
  CONSTRAINT `commandes_livraison_livreur_id_5b6ee1fa_fk_utilisate` FOREIGN KEY (`livreur_id`) REFERENCES `utilisateurs_profillivreur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_livraison`
--

LOCK TABLES `commandes_livraison` WRITE;
/*!40000 ALTER TABLE `commandes_livraison` DISABLE KEYS */;
INSERT INTO `commandes_livraison` VALUES (2,'livree',500.00,NULL,'2026-09-18 13:14:20.718879',4,'2026-09-18 13:13:27.355553','2026-09-18 13:13:57.936867',14.7193856,-17.4718976,'2026-09-18 13:14:18.437352'),(3,'livree',500.00,NULL,'2026-09-21 10:49:26.638020',3,'2026-09-21 10:48:52.819469','2026-09-21 10:49:09.501826',14.7193856,-17.4718976,'2026-09-21 10:49:26.289426'),(4,'livree',500.00,NULL,'2026-09-21 10:49:55.936631',3,'2026-09-21 10:49:49.914981','2026-09-21 10:49:53.099774',14.7193856,-17.4718976,'2026-09-21 10:49:55.312788'),(5,'livree',500.00,NULL,'2026-09-21 11:14:14.160795',4,'2026-09-21 11:13:35.265999','2026-09-21 11:13:47.360777',14.7110966,-17.4668526,'2026-09-21 11:13:52.186044'),(6,'livree',500.00,NULL,'2026-09-23 11:21:21.487925',4,'2026-09-23 10:44:35.974335','2026-09-23 10:44:46.226914',14.7110964,-17.4668466,'2026-09-23 10:44:53.045817'),(7,'livree',500.00,NULL,'2026-09-23 13:29:49.847083',4,'2026-09-23 12:42:32.079415','2026-09-23 12:42:32.180837',14.7554304,-17.4456832,'2026-09-23 12:44:53.687724'),(8,'livree',500.00,NULL,'2026-09-24 14:03:07.346814',5,'2026-09-23 12:47:57.882982','2026-09-23 12:47:58.014389',NULL,NULL,NULL),(9,'livree',500.00,NULL,'2026-09-23 13:29:06.596602',3,'2026-09-23 13:01:23.717230','2026-09-23 13:23:22.924644',NULL,NULL,NULL),(10,'livree',500.00,NULL,'2026-09-23 13:42:26.171093',4,'2026-09-23 13:41:57.393992','2026-09-23 13:42:07.863938',NULL,NULL,NULL),(11,'livree',500.00,NULL,'2026-09-23 15:12:29.328014',4,'2026-09-23 15:11:55.641326','2026-09-23 15:12:08.279443',NULL,NULL,NULL),(12,'livree',500.00,NULL,'2026-09-25 15:01:09.179164',4,'2026-09-25 15:00:19.975563','2026-09-25 15:00:34.831961',NULL,NULL,NULL),(13,'livree',500.00,NULL,'2026-09-25 16:24:41.264167',4,'2026-09-25 16:22:45.646727','2026-09-25 16:23:01.762812',NULL,NULL,NULL),(14,'livree',500.00,NULL,'2026-09-25 17:03:49.790844',4,'2026-09-25 16:32:18.570827','2026-09-25 16:33:39.710643',NULL,NULL,NULL),(15,'livree',500.00,NULL,'2026-09-30 15:42:23.731830',4,'2026-09-30 15:41:10.056813','2026-09-30 15:41:43.130737',NULL,NULL,NULL),(16,'livree',500.00,NULL,'2026-10-01 05:53:48.597936',4,'2026-10-01 05:53:29.167775','2026-10-01 05:53:34.085885',NULL,NULL,NULL),(17,'livree',500.00,NULL,'2026-10-01 06:32:02.297039',4,'2026-10-01 06:31:58.231169','2026-10-01 06:32:00.044607',NULL,NULL,NULL),(18,'livree',500.00,NULL,'2026-10-01 10:22:59.116468',4,'2026-10-01 10:22:49.227294','2026-10-01 10:22:53.500862',NULL,NULL,NULL),(19,'livree',500.00,NULL,'2026-10-06 10:54:24.635249',4,'2026-10-06 10:54:18.795777','2026-10-06 10:54:22.193948',NULL,NULL,NULL);
/*!40000 ALTER TABLE `commandes_livraison` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_livraison_commandes`
--

DROP TABLE IF EXISTS `commandes_livraison_commandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_livraison_commandes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `livraison_id` bigint NOT NULL,
  `commande_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `commandes_livraison_comm_livraison_id_commande_id_dda02501_uniq` (`livraison_id`,`commande_id`),
  KEY `commandes_livraison__commande_id_bf7526cc_fk_commandes` (`commande_id`),
  CONSTRAINT `commandes_livraison__commande_id_bf7526cc_fk_commandes` FOREIGN KEY (`commande_id`) REFERENCES `commandes_commande` (`id`),
  CONSTRAINT `commandes_livraison__livraison_id_fceaba78_fk_commandes` FOREIGN KEY (`livraison_id`) REFERENCES `commandes_livraison` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_livraison_commandes`
--

LOCK TABLES `commandes_livraison_commandes` WRITE;
/*!40000 ALTER TABLE `commandes_livraison_commandes` DISABLE KEYS */;
INSERT INTO `commandes_livraison_commandes` VALUES (2,2,1),(3,3,3),(4,4,5),(5,5,9),(6,6,12),(7,7,13),(8,7,15),(9,8,14),(10,9,10),(11,10,11),(12,11,17),(13,12,18),(14,13,19),(15,14,20),(16,15,23),(17,16,25),(18,17,26),(19,18,27),(20,19,29);
/*!40000 ALTER TABLE `commandes_livraison_commandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_note`
--

DROP TABLE IF EXISTS `commandes_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_note` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `etoile` smallint unsigned NOT NULL,
  `commentaire` longtext NOT NULL,
  `date` datetime(6) NOT NULL,
  `auteur_id` bigint NOT NULL,
  `cible_id` bigint NOT NULL,
  `commande_id` bigint NOT NULL,
  `action_prise` varchar(200) NOT NULL,
  `date_traitement` datetime(6) DEFAULT NULL,
  `traite` tinyint(1) NOT NULL,
  `traite_par_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `commandes_note_auteur_id_commande_id_cible_id_8637a546_uniq` (`auteur_id`,`commande_id`,`cible_id`),
  KEY `commandes_note_cible_id_a11654a8_fk_utilisateurs_utilisateur_id` (`cible_id`),
  KEY `commandes_note_commande_id_0621f43c_fk_commandes_commande_id` (`commande_id`),
  KEY `commandes_note_traite_par_id_8c0258c8_fk_utilisate` (`traite_par_id`),
  CONSTRAINT `commandes_note_auteur_id_daa1049f_fk_utilisateurs_utilisateur_id` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `commandes_note_cible_id_a11654a8_fk_utilisateurs_utilisateur_id` FOREIGN KEY (`cible_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `commandes_note_commande_id_0621f43c_fk_commandes_commande_id` FOREIGN KEY (`commande_id`) REFERENCES `commandes_commande` (`id`),
  CONSTRAINT `commandes_note_traite_par_id_8c0258c8_fk_utilisate` FOREIGN KEY (`traite_par_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `commandes_note_chk_1` CHECK ((`etoile` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_note`
--

LOCK TABLES `commandes_note` WRITE;
/*!40000 ALTER TABLE `commandes_note` DISABLE KEYS */;
INSERT INTO `commandes_note` VALUES (1,5,'Poisson excellent, très frais','2026-09-24 23:23:31.643221',15,8,1,'',NULL,0,NULL),(2,1,'livraison tres lente','2026-09-24 23:53:30.415217',15,20,13,'Signalement pris en compte','2026-09-24 23:54:58.197367',1,22),(3,4,'','2026-09-24 23:53:48.066680',15,8,13,'',NULL,0,NULL);
/*!40000 ALTER TABLE `commandes_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_produitcommande`
--

DROP TABLE IF EXISTS `commandes_produitcommande`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_produitcommande` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantite` decimal(8,2) NOT NULL,
  `prix_unitaire` decimal(10,2) NOT NULL,
  `commande_id` bigint NOT NULL,
  `produit_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `commandes_produitcom_commande_id_bf19935a_fk_commandes` (`commande_id`),
  KEY `commandes_produitcom_produit_id_22368e1f_fk_publicati` (`produit_id`),
  CONSTRAINT `commandes_produitcom_commande_id_bf19935a_fk_commandes` FOREIGN KEY (`commande_id`) REFERENCES `commandes_commande` (`id`),
  CONSTRAINT `commandes_produitcom_produit_id_22368e1f_fk_publicati` FOREIGN KEY (`produit_id`) REFERENCES `publications_produit` (`publication_ptr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_produitcommande`
--

LOCK TABLES `commandes_produitcommande` WRITE;
/*!40000 ALTER TABLE `commandes_produitcommande` DISABLE KEYS */;
INSERT INTO `commandes_produitcommande` VALUES (1,1.00,50000.00,1,14),(2,1.00,50000.00,2,14),(3,6.00,1500.00,2,11),(4,2.00,50000.00,3,14),(5,8.00,1500.00,3,11),(6,1.00,50000.00,4,14),(7,2.00,1500.00,4,11),(8,2.00,3000.00,5,15),(9,1.00,1500.00,6,11),(10,1.00,1500.00,7,11),(11,4.00,1500.00,8,19),(12,10.00,1500.00,9,19),(13,1.00,1500.00,10,19),(14,3.00,1500.00,11,16),(15,1.00,1500.00,12,19),(16,7.00,1500.00,13,19),(17,4.00,1500.00,14,19),(18,2.00,1500.00,15,19),(19,4.00,2500.00,16,2),(20,12.00,3500.00,17,18),(21,2.00,1500.00,18,19),(22,1.00,1500.00,19,19),(23,1.00,1500.00,20,19),(24,1.00,1500.00,21,22),(25,1.00,1500.00,22,16),(26,3.00,2500.00,23,23),(27,1.00,1500.00,23,22),(28,1.00,1500.00,24,16),(29,1.00,2500.00,25,23),(30,1.00,2500.00,26,23),(31,2.00,2500.00,27,23),(32,54.00,1500.00,28,25),(33,7.00,1500.00,29,24),(34,1.00,1500.00,30,25),(35,1.00,1500.00,30,24),(36,2.00,2500.00,31,1),(37,50.00,1500.00,32,25),(38,2.00,2500.00,33,1),(39,50.00,1500.00,34,24),(40,4.00,50000.00,35,14),(41,3.00,1500.00,36,25);
/*!40000 ALTER TABLE `commandes_produitcommande` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_utilisateurs_utilisateur_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_utilisateurs_utilisateur_id` FOREIGN KEY (`user_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(2,'auth','group'),(3,'auth','permission'),(14,'commandes','alerte'),(15,'commandes','commande'),(16,'commandes','livraison'),(17,'commandes','note'),(18,'commandes','produitcommande'),(4,'contenttypes','contenttype'),(11,'publications','information'),(12,'publications','produit'),(13,'publications','publication'),(5,'sessions','session'),(19,'utilisateurs','fcmtoken'),(6,'utilisateurs','premium'),(7,'utilisateurs','profillivreur'),(8,'utilisateurs','profilpecheur'),(9,'utilisateurs','utilisateur'),(10,'utilisateurs','vehicule');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-09-11 14:21:05.438449'),(2,'contenttypes','0002_remove_content_type_name','2026-09-11 14:21:05.520030'),(3,'auth','0001_initial','2026-09-11 14:21:05.858359'),(4,'auth','0002_alter_permission_name_max_length','2026-09-11 14:21:05.958463'),(5,'auth','0003_alter_user_email_max_length','2026-09-11 14:21:05.976063'),(6,'auth','0004_alter_user_username_opts','2026-09-11 14:21:05.997546'),(7,'auth','0005_alter_user_last_login_null','2026-09-11 14:21:06.019603'),(8,'auth','0006_require_contenttypes_0002','2026-09-11 14:21:06.025074'),(9,'auth','0007_alter_validators_add_error_messages','2026-09-11 14:21:06.046978'),(10,'auth','0008_alter_user_username_max_length','2026-09-11 14:21:06.068858'),(11,'auth','0009_alter_user_last_name_max_length','2026-09-11 14:21:06.090077'),(12,'auth','0010_alter_group_name_max_length','2026-09-11 14:21:06.130553'),(13,'auth','0011_update_proxy_permissions','2026-09-11 14:21:06.149477'),(14,'auth','0012_alter_user_first_name_max_length','2026-09-11 14:21:06.176162'),(15,'utilisateurs','0001_initial','2026-09-11 14:21:06.951260'),(16,'admin','0001_initial','2026-09-11 14:21:07.150292'),(17,'admin','0002_logentry_remove_auto_add','2026-09-11 14:21:07.181424'),(18,'admin','0003_logentry_add_action_flag_choices','2026-09-11 14:21:07.222065'),(19,'sessions','0001_initial','2026-09-11 14:21:07.273417'),(20,'utilisateurs','0002_profillivreur_vehicule','2026-09-11 15:27:08.841516'),(21,'publications','0001_initial','2026-09-12 19:31:48.860483'),(22,'commandes','0001_initial','2026-09-15 21:26:39.299340'),(23,'commandes','0002_commande_adresse_livraison_and_more','2026-09-16 23:47:40.409033'),(24,'commandes','0003_commande_paydunya_token','2026-09-18 00:16:33.102080'),(25,'commandes','0004_livraison_date_acceptation_and_more','2026-09-18 11:40:23.613134'),(26,'commandes','0005_alter_livraison_statut','2026-09-18 11:44:28.709786'),(27,'commandes','0006_note_action_prise_note_date_traitement_note_traite_and_more','2026-09-24 11:51:20.109729'),(28,'utilisateurs','0002_premium_motif_validation_premium_validation_auto','2026-09-24 13:52:04.936343'),(29,'utilisateurs','0003_premium_duree_mois','2026-09-24 14:00:32.121223'),(30,'commandes','0007_alter_note_options_alter_note_unique_together','2026-09-24 23:09:24.220851'),(31,'utilisateurs','0004_profillivreur_derniere_latitude_and_more','2026-10-06 10:32:59.862798'),(32,'utilisateurs','0005_fcmtoken','2026-10-07 22:48:02.696828'),(33,'commandes','0008_remove_commande_paydunya_token','2026-10-13 12:23:58.339120');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('l7ho8wh7v79avyjw00h94cmvrexwx5ms','.eJxVizsOwjAMQO-SGVVNnKYpG524RWW7thqBGJJmQIi7E6QOsL7PyyxY922pRfKSVnM21px-GSHf5PEVdU_3VHCXmkt34NJdn5TTemn9fJR_-4Zla2-wHnoPo0IvNFmmwUlUpxR1FBvJQ-CJmXCVCXQEHUKrbMDeMUYazPsDnIs38g:1x53BJ:2Qk0JCsuZ9slYalcMsfa1lTgeTurSQakmVbKnFLE5Ww','2026-09-25 15:28:49.140114');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publications_information`
--

DROP TABLE IF EXISTS `publications_information`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publications_information` (
  `publication_ptr_id` bigint NOT NULL,
  `description` longtext NOT NULL,
  PRIMARY KEY (`publication_ptr_id`),
  CONSTRAINT `publications_informa_publication_ptr_id_2c03a273_fk_publicati` FOREIGN KEY (`publication_ptr_id`) REFERENCES `publications_publication` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publications_information`
--

LOCK TABLES `publications_information` WRITE;
/*!40000 ALTER TABLE `publications_information` DISABLE KEYS */;
INSERT INTO `publications_information` VALUES (3,'il y\'a en a des grosses'),(12,'« Avez-vous entendu [B]'),(13,'je vais me coucher, je vais dormir, je vais dormir, je vais dormir, je vais dormir, je vais dormir, je vais dormir.');
/*!40000 ALTER TABLE `publications_information` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publications_produit`
--

DROP TABLE IF EXISTS `publications_produit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publications_produit` (
  `publication_ptr_id` bigint NOT NULL,
  `nom` varchar(100) NOT NULL,
  `categorie` varchar(20) NOT NULL,
  `prix` decimal(10,2) NOT NULL,
  `quantite` decimal(8,2) NOT NULL,
  `statut` varchar(15) NOT NULL,
  `media` varchar(100) NOT NULL,
  PRIMARY KEY (`publication_ptr_id`),
  CONSTRAINT `publications_produit_publication_ptr_id_18745607_fk_publicati` FOREIGN KEY (`publication_ptr_id`) REFERENCES `publications_publication` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publications_produit`
--

LOCK TABLES `publications_produit` WRITE;
/*!40000 ALTER TABLE `publications_produit` DISABLE KEYS */;
INSERT INTO `publications_produit` VALUES (1,'Thiof','poisson',2500.00,2.50,'disponible','publications/media/me_tHM9hlH.jpeg'),(2,'crevette','fruit_de_mer',2500.00,2.50,'disponible','publications/media/me_Xz9dfoL.jpeg'),(4,'crevette','fruit_de_mer',1500.00,70.00,'disponible','publications/media/images.webp'),(5,'crevette','fruit_de_mer',3000.00,40.00,'disponible','publications/media/images_RpGbbZ0.webp'),(6,'crevette','fruit_de_mer',3000.00,40.00,'disponible','publications/media/images_VTidCQt.webp'),(7,'crevette','fruit_de_mer',3000.00,40.00,'disponible','publications/media/images_s8zRR7b.webp'),(8,'crevette','fruit_de_mer',3000.00,40.00,'disponible','publications/media/images_T3PUT09.webp'),(9,'crevette','fruit_de_mer',3000.00,40.00,'disponible','publications/media/images_UOVdyZY.webp'),(10,'Thiof','',4000.00,20.00,'disponible',''),(11,'Capitaine','poisson',1500.00,12.00,'rupture','publications/media/poisson.jpg'),(14,'Dorade','poisson',50000.00,46.00,'disponible','publications/media/Image_collée.png'),(15,'Mulet','poisson',3000.00,70.00,'disponible','publications/media/i1.png'),(16,'Mulet','poisson',1500.00,60.00,'disponible','publications/media/i2_F7Fuv9t.png'),(17,'Mulet','poisson',500.00,50.00,'disponible','publications/media/i3_tqvLA4m.png'),(18,'Poisson','poisson',3500.00,50.00,'disponible','publications/media/i4_L7SOsnr.png'),(19,'Sardinelle','poisson',1500.00,50.00,'disponible','publications/media/Image_collée_2.png'),(20,'Crabe','fruit_de_mer',1500.00,100.00,'disponible','publications/media/crabe.png'),(21,'Produit non identifié','poisson',0.00,0.00,'disponible','publications/media/crabe_NVi8XQx.png'),(22,'yaboye','poisson',1500.00,100.00,'disponible','publications/media/yaboy.png'),(23,'Crevettes','fruit_de_mer',2500.00,50.00,'disponible','publications/media/crevettes.png'),(24,'Capitaine','poisson',1500.00,0.00,'rupture','publications/media/yaboy_EIGe4Uo.png'),(25,'Dorade','poisson',1500.00,47.00,'disponible','publications/media/yaboy_mF0K9y5.png'),(26,'Crevette','fruit_de_mer',0.00,0.00,'disponible','publications/media/crevettes_vFYmboN.png'),(27,'crevette','fruit_de_mer',500.00,50.00,'disponible','publications/media/crevettes_HlwaXmX.png'),(28,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_XmiGAZ8.png'),(29,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_xilDJLL.png'),(30,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_hbyhZz6.png'),(31,'crevette','fruit_de_mer',1500.00,70.00,'disponible','publications/media/crevettes_lb5T7MW.png'),(32,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_jFjOGrR.png'),(33,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_rTaGdGr.png'),(34,'capitaine','poisson',1500.00,50.00,'disponible','publications/media/yaboy_9r460hj.png'),(35,'capitaine','poisson',1500.00,50.00,'disponible','publications/media/yaboy_ZgomKZN.png'),(36,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_Iwk6Rxv.png'),(37,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_dmcP3mZ.png'),(38,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_PoRxH7s.png'),(39,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_lLxT9eb.png'),(40,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_ecrnibz.png'),(41,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_LfzotzI.png'),(42,'crevette','fruit_de_mer',1500.00,50.00,'disponible','publications/media/crevettes_qjQs6Ew.png');
/*!40000 ALTER TABLE `publications_produit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publications_publication`
--

DROP TABLE IF EXISTS `publications_publication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publications_publication` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_publication` datetime(6) NOT NULL,
  `audio` varchar(100) NOT NULL,
  `texte_transcrit` longtext NOT NULL,
  `texte_traduit` longtext NOT NULL,
  `score_confiance_ia` double DEFAULT NULL,
  `statut_moderation` varchar(15) NOT NULL,
  `adresse` varchar(50) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `pecheur_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `publications_publica_pecheur_id_22885f41_fk_utilisate` (`pecheur_id`),
  CONSTRAINT `publications_publica_pecheur_id_22885f41_fk_utilisate` FOREIGN KEY (`pecheur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publications_publication`
--

LOCK TABLES `publications_publication` WRITE;
/*!40000 ALTER TABLE `publications_publication` DISABLE KEYS */;
INSERT INTO `publications_publication` VALUES (1,'2026-09-13 02:22:53.757068','publications/audio/792_WDi7wyt.mp3','amna thiof bou bess','Ceci est un thiof fraichement peche ce matin',0.85,'visible','Rufisque',14.7167,-17.2833,7),(2,'2026-09-13 08:28:04.300872','publications/audio/792_crJFbkA.mp3','amna crevette bou bess','Ceci est un crevette fraichement peche ce matin',0.85,'visible','Rufisque',14.7167,-17.2833,7),(3,'2026-09-13 08:34:03.417401','publications/audio/792_1ph2mao.mp3','rufisque cote plage bi amna dieune you bari','il y\'a beacoup de poisson a rufisque a cote de le plage',0.85,'visible','Rufisque',14.7167,-17.2833,7),(4,'2026-09-15 10:58:35.682180','publications/audio/audio1.wav','','',NULL,'en_attente','Soumbedioune',NULL,-18.7656,8),(5,'2026-09-15 11:08:12.757202','publications/audio/audio1_DbSKUB7.wav','','',NULL,'en_attente','Soumbedioune',NULL,-18.7656,8),(6,'2026-09-15 21:12:05.056223','publications/audio/audio1_A1kn9Oo.wav','','',NULL,'en_attente','Soumbedioune',NULL,-18.7656,8),(7,'2026-09-15 21:14:30.119246','publications/audio/audio1_hF9WVGs.wav','','',NULL,'en_attente','Soumbedioune',NULL,-18.7656,8),(8,'2026-09-15 21:23:31.854297','publications/audio/audio1_oNdhWMf.wav','','',NULL,'en_attente','Soumbedioune',NULL,-18.7656,8),(9,'2026-09-15 21:26:45.628024','publications/audio/audio1_ysVDjyX.wav','','',NULL,'en_attente','Soumbedioune',NULL,-18.7656,8),(10,'2026-09-15 23:43:34.635817','','','',NULL,'rejete','',NULL,NULL,16),(11,'2026-09-16 22:52:52.389052','publications/audio/vocal_wolof.webm','am na coof 12kg maa koy jaayee 1500f/kg','il pèse 12 kg et je le vends pour 15 000 $ .',0.86,'visible','Non précisé',NULL,NULL,8),(12,'2026-09-16 23:05:52.871978','publications/audio/vocal_wolof_V1adFVW.webm','dégg nga [b]','« Avez-vous entendu [B]',1,'visible','Non précisé',NULL,NULL,8),(13,'2026-09-17 15:52:40.592147','publications/audio/vocal_wolof_3f1r2W0.webm','salaamaalekum mbokk yi tey sëdd laa am dix huit kilos kilos bi maa ngi koy jaayee dix mille franc maa ngi nekk ngor non maa ngi nekk asafurlaa damaciu maa ngi nekk yoff tangor','je vais me coucher, je vais dormir, je vais dormir, je vais dormir, je vais dormir, je vais dormir, je vais dormir.',1,'visible','Non précisé',NULL,NULL,8),(14,'2026-09-17 19:56:30.686115','publications/audio/vocal_wolof_v4j01Rb.webm','am na 50 kilos dorade maa ngi koy jaayee 1 kilo 50000f fii ci bargny','je pèse 50 kg et je vais acheter 50 kg ici.',0.99,'visible','Non précisé',NULL,NULL,8),(15,'2026-09-20 10:35:16.130907','publications/audio/vocal_wolof_8h6bpe2.webm','salaamaalekum am naa fi 70kg dorade maa ngi koy jaayee kilo bu nekk 3000f maa ngi rufisque','j\'ai 3 kg, j\'ai 3 kg, j\'ai un',0.95,'visible','Non précisé',NULL,NULL,13),(16,'2026-09-20 11:01:08.191391','publications/audio/vocal_wolof_RG1kNLB.webm','salaamaalekum maa ngi yéen am naa 60kg kerovet maa ngi koy jaayee kilo bu nekk 1500f','j\'ai un 60kg, et je vais acheter un 1500kg.',0.99,'visible','Non précisé',NULL,NULL,13),(17,'2026-09-20 11:57:35.572059','publications/audio/vocal_wolof_c1soNqt.webm','salaamaalekum coof amna maa ngi soumbédioune maa ngi am 50 kilos coof maa ngi koy jaayee 3 500 kilos bu nekk ca jëf waay','j\'essaie d\'obtenir un échange de 50 lb, mais j\'essaie d\'obtenir un échange de 3500 lb',0.89,'visible','Soumbédioune',NULL,NULL,13),(18,'2026-09-20 12:05:09.515368','publications/audio/vocal_wolof_Xztqw3Q.webm','salaamaalekum am na ma jën sëdd maa ngi fiy zool faajoot am naa ci 50kg maa ngi koy jaayee kilo 3500','j\'ai un chien et j\'ai un chien qui pèse 50 kg et j\'ai un chien qui pèse 3500 kg.',0.9,'visible','Non précisé',NULL,NULL,8),(19,'2026-09-20 12:21:40.796505','publications/audio/vocal_wolof_KMXp89S.webm','salaamaalekum am naa yaboy maïs geulhal fajjul am naa ci 50kg maïs jaay kilo bu nekk 1500f','je ne pense pas que je pourrai vendre 50 kg/s.',0.99,'visible','Non précisé',NULL,NULL,8),(20,'2026-09-25 22:12:09.512497','publications/audio/vocal_wolof_iUnHfis.webm','salaamaalekum am na ma ab joxoñ maa ngi koy jaayee 1 500f kilogramme bi maa ngi fii ci bargny','j\'ai un sac de 5 500 livres, et je suis en route pour',0.39,'visible','Bargny',NULL,NULL,8),(21,'2026-09-26 00:29:48.095653','publications/audio/vocal_wolof_602gJ9e.webm','[mic]','[citation nécessaire]',0.14,'rejete','Non précisé',NULL,NULL,8),(22,'2026-09-27 01:12:48.583149','publications/audio/vocal_wolof_EiaHQnZ.webm','salaamaalekum yaa booy am naa ba nga kaa jaayee 1500f kilo bu maa ngi fiy nii ci bargny','je suis tellement heureuse de vous avoir ici, et je suis tellement heureuse de vous avoir ici avec moi, je suis tellement heureuse de vous avoir dans ma vie. : D',0.45,'visible','Bargny',NULL,NULL,8),(23,'2026-09-29 14:44:49.640454','publications/audio/vocal_wolof_2u75yoh.webm','am naa keroog baat 50kg maa ngi koy jaayee kilo 2500 maa ngi sumb diw','j\'ai un 50kg, j\'ai un 2500kg, j\'ai un',0.52,'visible','Soumbedioune',NULL,NULL,8),(24,'2026-10-01 11:22:40.755787','publications/audio/vocal_wolof_44Xnuww.webm','salaamaalekum am na coof 50kg maa ngi koy jaayee kilo 1500f maa ngi sumbëjun','je pèse 50 kg et je vais acheter 15 kg et je vais l\'acheter.',0.86,'visible','Soumbédioune',NULL,NULL,24),(25,'2026-10-01 11:28:58.203856','publications/audio/vocal_wolof_6GRUHoG.webm','bonjour j\'ai 50kg de dorade à vendre à 1500f/kg je suis à soumbédioune','bonne chance avec l\'achat de 1500,00 $ / pi2 et je suis',1,'visible','Soumbédioune',NULL,NULL,24),(26,'2026-10-05 23:02:56.197493','publications/audio/vocal_wolof_owRc2Iy.webm','crevet','crevasses',0.38,'rejete','Non précisé',NULL,NULL,8),(27,'2026-10-08 10:58:15.056647','publications/audio/vocal_wolof_l15peO2.webm','am na 50kg crevette maa ngi koy jaayee kilo mi ci 500f maa ngi bari nii','je pèse 50 kg et je vais acheter un 500 kg, donc je suis presque sûr',0.97,'visible','Dakar',14.6928,-17.4467,8),(28,'2026-10-08 11:34:30.180970','publications/audio/vocal_wolof_SPr0ViW.webm','am na 50kg crevette maa ngi koy jaayee kilo 1500f maa ngi bari','j\'ai une grue de 50 kg et je suis à la recherche d\'une grue de 1500 kg',0.97,'visible','Dakar',14.6928,-17.4467,8),(29,'2026-10-08 11:44:15.014491','publications/audio/vocal_wolof_STinXkr.webm','am naa 50kg crevet maa ngi koy jaayee kilo 1500f maa ngi sumbëdiou','je pèse 50 kg et je cherche un 1500 kg.',0.83,'visible','Soumbédioune',14.6751334,-17.4561008,8),(30,'2026-10-08 12:03:10.746413','publications/audio/vocal_wolof_Vd2VSX0.webm','am na 50kg crevet maa koy jaayee kilo 1500f maa ngi sumbëjuñ','je pèse 50 kg et je cherche un 1500 kg',0.83,'visible','Soumbédioune',14.6751334,-17.4561008,8),(31,'2026-10-08 13:12:52.978085','publications/audio/vocal_wolof_lKWiByh.webm','am na 70kg grebet ma ngi mujjaayee kilo 1500f maa ngi sumbë diop','je pèse 70 kg et je pèse 1500 kg',0.62,'visible','Soumbedioune',14.6928,-17.4467,8),(32,'2026-10-08 16:18:57.173207','publications/audio/vocal_wolof_sCPUvqp.webm','am na 50kg crevette maa ngi koy jaayee 1500f maa ngi sumbëdioune','je pèse 50 kg et j\'attends avec impatience les 1500 kg.',0.97,'visible','Soumbédioune',14.6751334,-17.4561008,8),(33,'2026-10-08 21:10:04.081214','publications/audio/vocal_wolof_MsYqg6v.webm','am na 50kg crevet maa ngi koy jaayee 1500f maa ngi fii nii ci bariwul','je pèse 50 kg et je suis là pour toi.',0.83,'visible','Dakar',14.6928,-17.4467,8),(34,'2026-10-08 23:53:35.608332','publications/audio/vocal_wolof_5cyYOMp.webm','am na 50kg coof kilo 1500f maa ngi rufisque','il pèse environ 500 livres, et je suis',0.86,'visible','Rufisque',14.716417,-17.273844,8),(35,'2026-10-09 00:06:51.264113','publications/audio/vocal_wolof_Qh4j5kp.webm','am na 50kg coof maa koy jaayee 1500f maa ngi rufisque','je pèse 50 kg et je vais acheter un 1500 kg.',0.86,'visible','Rufisque',14.716417,-17.273844,8),(36,'2026-10-09 09:29:18.717700','publications/audio/vocal_wolof_Bm8KeWw.webm','am naa crevet 50kg maa ngi koy jaayee 1500f/kg maa ngi sumbëdioune','j\'ai un 50kg et je cherche un 1500kg',0.83,'visible','Soumbédioune',14.6751334,-17.4561008,8),(37,'2026-10-09 09:37:31.710832','publications/audio/vocal_wolof_FESgQJi.webm','am na 50kg crevet maa ngi koy jaayee kilo 1500f maa ngi sumbëjun','je pèse 50 kg et je cherche un 1500 kg.',0.83,'visible','Soumbédioune',14.6751334,-17.4561008,8),(38,'2026-10-09 09:52:34.197627','publications/audio/vocal_wolof_dEmNWm6.webm','am naa 50kg crevette maa ngi koy jaayee kaw 1 500f maa ngi sumbëjun','j\'ai une grue de 50 kg et je cherche une grue de 500 kg.',0.97,'visible','Soumbédioune',14.6751334,-17.4561008,8),(39,'2026-10-09 09:55:49.577520','publications/audio/vocal_wolof_h0XPCnc.webm','am naa 50kg crevette maa ngi jaayee kilo 1500f maa ngi sumbëjjul','je pèse 5 kg et je pèse 5 kg et je',0.97,'visible','Soumbédioune',14.6751334,-17.4561008,8),(40,'2026-10-09 10:04:23.927131','publications/audio/vocal_wolof_3pqAwKf.webm','am naa 50kg crevet maa ngi koy caayee kilo 1500f maa ngi sumbëjun','je pèse 5 kg et je pèse 5 kg et je',0.83,'visible','Soumbédioune',14.6751334,-17.4561008,8),(41,'2026-10-09 10:21:18.358971','publications/audio/vocal_wolof_qhxw7OT.webm','am na 50kg crevette kilo 1500f maa ngi sumbë diouf','j\'ai une grue de 50 kg et je suis',0.97,'visible','Dakar',14.6928,-17.4467,8),(42,'2026-10-09 10:37:20.184809','publications/audio/vocal_wolof_mFgLejz.webm','am naa 50kg crevet maa ngi koy jaayee kilo 1500f maa ngi sumbëtu','je pèse 5 kg et je pèse 5 kg et je',0.83,'visible','Dakar',14.6928,-17.4467,8);
/*!40000 ALTER TABLE `publications_publication` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_fcmtoken`
--

DROP TABLE IF EXISTS `utilisateurs_fcmtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_fcmtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `utilisateur_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `utilisateurs_fcmtoke_utilisateur_id_121c55e2_fk_utilisate` (`utilisateur_id`),
  CONSTRAINT `utilisateurs_fcmtoke_utilisateur_id_121c55e2_fk_utilisate` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_fcmtoken`
--

LOCK TABLES `utilisateurs_fcmtoken` WRITE;
/*!40000 ALTER TABLE `utilisateurs_fcmtoken` DISABLE KEYS */;
INSERT INTO `utilisateurs_fcmtoken` VALUES (6,'dyYNByYyZmtIibjMolzU4D:APA91bFCcdYuyAxI3xdiZ7XDvEc3oJWhsz-WyRff_nDPu8TqcuTvHa9ssxEwC9uhtiVfkHnifiixC6a8y-13mjZDLb9KL6c557sw0KgFOzNl3a6zxve3XbE','2026-10-08 09:25:09.942887',18),(45,'eMFoPxglszCdIUjkhioPUU:APA91bFRWSmMdRWtj95rGJrQr-sNfgc8F9JD16wM_QpBxgchStyeYYhblJc65L7Tr8_yJSgFdKD5ydwBR8WRmYgSvLNO5SyhJxDgpc2RL2KC3TkySt974SA','2026-10-09 09:46:36.170381',15),(46,'cemeMXARFNQPlozYV13OUs:APA91bF9IE7xVtbwx1hRu5TORvI2Lzxk3voea2fXA7FGJw_eYskDcAl5yOe2dWM7PK3v2j6lrueAJWsu8tquH11NQLz_yUomo__LgPvQF3bX8uFvSn-wbdM','2026-10-09 13:18:59.107695',15),(47,'cemeMXARFNQPlozYV13OUs:APA91bE5sP6DyuR8iBj0hbiins0pazZFgJuruwXGO4FgRzDgJEV8vUYHmVjXN1pBdFXbNA7knHPTiLkKjG2v9x2bcHxxFUrfFw5etlPVIfWeI-gggnZ42_o','2026-10-09 15:22:20.509991',15),(48,'dLVyzRGV9ZbqmOX0UrKAKX:APA91bFF-xll44XAegXh187sqRc8k17HoEbVuNyD3qoqAEdG8kFbt67K-cqeWVDzpk0__L7UmmI68hHeLdLMwS_dzqs82xB6qqC1DdS6YWYApQhgxcpuXyw','2026-10-13 14:20:59.256387',15);
/*!40000 ALTER TABLE `utilisateurs_fcmtoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_premium`
--

DROP TABLE IF EXISTS `utilisateurs_premium`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_premium` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fonction` varchar(30) NOT NULL,
  `date_obtention` datetime(6) DEFAULT NULL,
  `date_expiration` datetime(6) DEFAULT NULL,
  `statut` varchar(30) NOT NULL,
  `utilisateur_id` bigint NOT NULL,
  `valide_par_id` bigint DEFAULT NULL,
  `motif_validation` varchar(200) NOT NULL,
  `validation_auto` tinyint(1) NOT NULL,
  `duree_mois` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurs_premium_utilisateur_id_e63db72f_fk_utilisate` (`utilisateur_id`),
  KEY `utilisateurs_premium_valide_par_id_8ccf52c2_fk_utilisate` (`valide_par_id`),
  CONSTRAINT `utilisateurs_premium_utilisateur_id_e63db72f_fk_utilisate` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `utilisateurs_premium_valide_par_id_8ccf52c2_fk_utilisate` FOREIGN KEY (`valide_par_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `utilisateurs_premium_chk_1` CHECK ((`duree_mois` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_premium`
--

LOCK TABLES `utilisateurs_premium` WRITE;
/*!40000 ALTER TABLE `utilisateurs_premium` DISABLE KEYS */;
INSERT INTO `utilisateurs_premium` VALUES (1,'abonnement_acheteur','2026-09-15 22:39:00.775330','2026-10-15 22:39:00.775340','actif',15,NULL,'',0,1),(2,'abonnement_acheteur',NULL,NULL,'revoque',17,NULL,'',0,1),(3,'abonnement_acheteur','2026-09-23 20:14:12.470297','2026-10-23 20:14:12.470305','actif',12,22,'',0,1),(5,'badge_pecheur','2026-09-24 15:23:26.340858','2026-10-24 15:23:26.340870','actif',8,NULL,'Validation automatique',1,1),(6,'abonnement_acheteur','2026-09-24 20:45:09.642796','2026-10-24 20:45:09.642801','revoque',18,NULL,'Validation automatique',1,1),(8,'badge_livreur','2026-09-24 22:07:06.456667','2026-10-24 22:07:06.456677','actif',20,NULL,'Validation automatique',1,1);
/*!40000 ALTER TABLE `utilisateurs_premium` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_profillivreur`
--

DROP TABLE IF EXISTS `utilisateurs_profillivreur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_profillivreur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `disponible` tinyint(1) NOT NULL,
  `est_verifie` tinyint(1) NOT NULL,
  `document_verification` varchar(100) DEFAULT NULL,
  `utilisateur_id` bigint NOT NULL,
  `vehicule_id` bigint DEFAULT NULL,
  `derniere_latitude` double DEFAULT NULL,
  `derniere_longitude` double DEFAULT NULL,
  `derniere_position_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateur_id` (`utilisateur_id`),
  UNIQUE KEY `vehicule_id` (`vehicule_id`),
  CONSTRAINT `utilisateurs_profill_utilisateur_id_93a09374_fk_utilisate` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_utilisateur` (`id`),
  CONSTRAINT `utilisateurs_profill_vehicule_id_a2dfd5f8_fk_utilisate` FOREIGN KEY (`vehicule_id`) REFERENCES `utilisateurs_vehicule` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_profillivreur`
--

LOCK TABLES `utilisateurs_profillivreur` WRITE;
/*!40000 ALTER TABLE `utilisateurs_profillivreur` DISABLE KEYS */;
INSERT INTO `utilisateurs_profillivreur` VALUES (1,1,0,'',4,1,NULL,NULL,NULL),(2,1,0,'',10,2,NULL,NULL,NULL),(3,1,0,'',11,3,14.7110973,-17.4668363,'2026-10-07 12:35:46.979248'),(4,1,1,'',20,4,14.7110979,-17.4668387,'2026-10-06 11:42:21.873150'),(5,1,0,'',21,5,NULL,NULL,NULL);
/*!40000 ALTER TABLE `utilisateurs_profillivreur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_profilpecheur`
--

DROP TABLE IF EXISTS `utilisateurs_profilpecheur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_profilpecheur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `est_verifie` tinyint(1) NOT NULL,
  `documents_pecheur` varchar(100) DEFAULT NULL,
  `utilisateur_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateur_id` (`utilisateur_id`),
  CONSTRAINT `utilisateurs_profilp_utilisateur_id_9e38d6c8_fk_utilisate` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_profilpecheur`
--

LOCK TABLES `utilisateurs_profilpecheur` WRITE;
/*!40000 ALTER TABLE `utilisateurs_profilpecheur` DISABLE KEYS */;
INSERT INTO `utilisateurs_profilpecheur` VALUES (1,0,'',2),(2,0,'',3),(3,0,'',5),(4,0,'',7),(5,1,'',8),(6,0,'',9),(7,1,'',13),(8,0,'',14),(9,0,'',23),(10,0,'',24);
/*!40000 ALTER TABLE `utilisateurs_profilpecheur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_utilisateur`
--

DROP TABLE IF EXISTS `utilisateurs_utilisateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_utilisateur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `adresse` varchar(50) NOT NULL,
  `role` varchar(30) NOT NULL,
  `date_inscription` datetime(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telephone` (`telephone`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_utilisateur`
--

LOCK TABLES `utilisateurs_utilisateur` WRITE;
/*!40000 ALTER TABLE `utilisateurs_utilisateur` DISABLE KEYS */;
INSERT INTO `utilisateurs_utilisateur` VALUES (1,'pbkdf2_sha256$1500000$LGISC0bvZWtDTsuD6Sh2jy$5uItAzMVlqMzENGeeCMAbyS59TgQFeXVEhP9uJVufBQ=','2026-09-11 15:28:49.136874',1,NULL,'adja@lebougui.sn','Adja','Adja','','admin','2026-09-11 15:27:54.646728',1,1),(2,'pbkdf2_sha256$1500000$uSS5giPXIDppKaJX5O5igJ$fCNWV5DIGqW/vqwng4DQv3Z0M1LooWXvw0uTm4FXv9M=',NULL,0,'771234567',NULL,'Diop','Moussa','Yoff, Dakar','pecheur','2026-09-12 08:17:15.163082',1,0),(3,'pbkdf2_sha256$1500000$GTgvWtY10RyC7q0avWfwNO$nBWCskCqYrmgGov4syEsTsr+pzQXi8Q6NnCufYhV/oo=',NULL,0,'771233444',NULL,'Gueye','Moussa','Bargny','pecheur','2026-09-12 09:02:08.512615',1,0),(4,'pbkdf2_sha256$1500000$WASJYUoPf8Z83r4CgdwGEM$h7IzHXkn1n5CZEBbW3/CAKURFBkv0Qfb+nCT4I7j+Rk=',NULL,0,'773334567',NULL,'Diop','Moussa','Rufisque','livreur','2026-09-12 13:06:33.395879',1,0),(5,'pbkdf2_sha256$1500000$8FeB4eI6FEN0LLTYJRQNdN$VwNll7xn/xFD/Olp3Eiajp+uHxG247G1a2tuHLPeYUc=',NULL,0,'773334456',NULL,'Diop','Aliou','Rufisque','pecheur','2026-09-12 13:15:04.026943',1,0),(6,'pbkdf2_sha256$1500000$0hAZteIuUS3WJqRoiLxC6L$kygZ92ixui8SfrETpo76t3M/ySzRznvSsOgbtP2DIKA=',NULL,1,NULL,'mami@lebougui.sn','mami','samb','','admin','2026-09-12 13:20:39.918300',1,1),(7,'pbkdf2_sha256$1500000$ysuI0FoyjQdIgRLqo4gOL1$wfGuhUNxwXxGQw6Q5qzERbqp0jSbzSYl2uVy6ZDDd2M=',NULL,0,'775142630',NULL,'Diop','Omar','Yoff, Dakar','pecheur','2026-09-13 00:27:56.028094',1,0),(8,'pbkdf2_sha256$1500000$7OI1y6YEXCn4mWQhgUsPQl$YjCGHpqdcKSQQi+VsJce3ZNnKA7A9NDhT4fXVJAu0gA=',NULL,0,'708538752',NULL,'Diop','Issa','Dakar','pecheur','2026-09-14 14:00:00.681082',1,0),(9,'pbkdf2_sha256$1500000$sb2fz2Srh5MuAI7YPng295$7Kzkb3MLyYUoT/Uqz/HXjHbRFtcc+JZVa49x5gKEH90=',NULL,0,'776543434',NULL,'Gueye','Matar','Ouakam','pecheur','2026-09-14 20:14:03.749312',1,0),(10,'pbkdf2_sha256$1500000$qH6ohm7Z9jSxDALsvCtX36$Dga/VBk3QDchUv6GwJeG74gCabOjGLQNdibN9ed+XZ8=',NULL,0,'776545454',NULL,'Dieng','Omar','Pikine','livreur','2026-09-14 20:15:44.612819',1,0),(11,'pbkdf2_sha256$1500000$DtYADz2vUSA1cdd4GU4fw4$CZ1yecrxrEWmkBmU3/AAdN+XcZ8MVZyePk6v4uaJU0k=',NULL,0,'775142626',NULL,'Gueye','Awa','Thiaroye','livreur','2026-09-14 21:31:11.320738',1,0),(12,'pbkdf2_sha256$1500000$5B2E1rWbzDNN7PsjILdde1$US172Y1rFU7Ab2AUadNEWFGcKbzt/ReRIB9r1SJBk4k=',NULL,0,'771111111',NULL,'Bidiane','Bineta','Thies','acheteur','2026-09-14 21:42:52.728093',1,0),(13,'pbkdf2_sha256$1500000$Wyu0YdnnoVahebuHHhn6bQ$vaWjkeXo4C1/sculQa+1sUvVP5dKOMn4t9F8RAWG4r0=',NULL,0,'772222222',NULL,'Seck','Sarry','02 RUE BARGNY GUEDJ','pecheur','2026-09-14 23:02:24.191989',1,0),(14,'pbkdf2_sha256$1500000$x6Qen5ocAVJTwF6XEpmRrm$4+sJj8e8c/13/exRIHPG8pvGZNCsNoyX18dW8UAyalA=',NULL,0,'773333333',NULL,'Ndiaye','Saliou','Thiaroye','pecheur','2026-09-15 00:50:46.707985',1,0),(15,'pbkdf2_sha256$1500000$9aL8hwlv6VEA9qgkXF5iqR$5dRiyQzMFjPr9KuHZoKgGuJFTtcxmiSSw7q4jfDCknE=',NULL,0,'777777777',NULL,'Seck','Aissatou','Colobane','acheteur','2026-09-15 21:02:06.059807',1,0),(16,'',NULL,0,'770000001','pathe.pecheur@lebougui.sn','Pêcheur','Pathé','','pecheur','2026-09-15 23:34:54.205352',1,0),(17,'',NULL,0,'770000002','aissatou.premium@lebougui.sn','Acheteuse','Aïssatou','','acheteur','2026-09-15 23:34:54.210836',1,0),(18,'pbkdf2_sha256$1500000$wVZVIJgbmaaWfdXq8GASfz$0oGr+XW5XX5yWgMmk6tVxfbptUp7p9v/0KUAL1vad3c=',NULL,0,'788888888',NULL,'Gueye','Marie','Ndar','acheteur','2026-09-17 04:10:53.625391',1,0),(19,'pbkdf2_sha256$1500000$SXAB3cBwBHY8F09WnOt2PQ$upMt5CxPtiKF1HmQf9o92h2ZXZ4AV3XIcwnFWhEHCcI=',NULL,1,NULL,'maman@lebougui.sn','Maman','Sambe','','admin','2026-09-17 12:45:04.263642',1,1),(20,'pbkdf2_sha256$1500000$AaiMdNsVhmnrnyednvzB97$9+64jYeBxFn+JaFchA2W75dbet16oApiPFcMyzWfQuQ=',NULL,0,'766666666',NULL,'Ndiaye','Saliou','Dakar,Niari Talli','livreur','2026-09-18 13:12:14.487256',1,0),(21,'pbkdf2_sha256$1500000$9Fn4CWxP1gnL6XeelNwh8x$0ihJFvl1Y0mw3OQ/BkXIFE9UT8UlphR/cCMdoCgxQCg=',NULL,0,'755555555',NULL,'Thioune','Fallou','Almadies','livreur','2026-09-23 12:42:05.909682',1,0),(22,'pbkdf2_sha256$1500000$TItLZi6LBJluP5bo0WrmWK$q2Zuji4pcLaYYNBSYKfpXhSNIXaxelrsPZN0y3cs5T0=',NULL,1,NULL,'mamichou@lebougui.sn','mamichou','sambe','','admin','2026-09-23 16:22:30.796834',1,1),(23,'pbkdf2_sha256$1500000$I57Mq9OkxdZB8RkRB1BkpM$dSOiVyNBIRr6Y5tk6980yYc/pzI3FOfk40NP2LBtLs0=',NULL,0,'eeeee',NULL,'222','122','ba4r','pecheur','2026-09-25 20:45:49.021528',1,0),(24,'pbkdf2_sha256$1500000$rTCSA6RfkLfP3PJe1tGztY$LRj10VHr3vOozCl0NxGBHFHwVH2oSGK7zLWayWY7+8I=',NULL,0,'781507584',NULL,'KANE','SambaThiof','Rufisque','pecheur','2026-10-01 11:18:33.020887',1,0);
/*!40000 ALTER TABLE `utilisateurs_utilisateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_utilisateur_groups`
--

DROP TABLE IF EXISTS `utilisateurs_utilisateur_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_utilisateur_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `utilisateur_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateurs_utilisateur_utilisateur_id_group_id_954b1d5c_uniq` (`utilisateur_id`,`group_id`),
  KEY `utilisateurs_utilisa_group_id_9cd3c896_fk_auth_grou` (`group_id`),
  CONSTRAINT `utilisateurs_utilisa_group_id_9cd3c896_fk_auth_grou` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `utilisateurs_utilisa_utilisateur_id_3264257e_fk_utilisate` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_utilisateur_groups`
--

LOCK TABLES `utilisateurs_utilisateur_groups` WRITE;
/*!40000 ALTER TABLE `utilisateurs_utilisateur_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `utilisateurs_utilisateur_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_utilisateur_user_permissions`
--

DROP TABLE IF EXISTS `utilisateurs_utilisateur_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_utilisateur_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `utilisateur_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateurs_utilisateur_utilisateur_id_permissio_a16db5bb_uniq` (`utilisateur_id`,`permission_id`),
  KEY `utilisateurs_utilisa_permission_id_42b32d4e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `utilisateurs_utilisa_permission_id_42b32d4e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `utilisateurs_utilisa_utilisateur_id_604dcf80_fk_utilisate` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs_utilisateur` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_utilisateur_user_permissions`
--

LOCK TABLES `utilisateurs_utilisateur_user_permissions` WRITE;
/*!40000 ALTER TABLE `utilisateurs_utilisateur_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `utilisateurs_utilisateur_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs_vehicule`
--

DROP TABLE IF EXISTS `utilisateurs_vehicule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs_vehicule` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type_vehicule` varchar(20) NOT NULL,
  `immatriculation` varchar(20) NOT NULL,
  `est_frigorifie` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `immatriculation` (`immatriculation`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs_vehicule`
--

LOCK TABLES `utilisateurs_vehicule` WRITE;
/*!40000 ALTER TABLE `utilisateurs_vehicule` DISABLE KEYS */;
INSERT INTO `utilisateurs_vehicule` VALUES (1,'moto','12Af12',0),(2,'moto','AA-GG65',1),(3,'moto','BB-09-0a',1),(4,'moto','99-AA-00',1),(5,'tricycle','BB-76-98',1);
/*!40000 ALTER TABLE `utilisateurs_vehicule` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-13 16:50:59
