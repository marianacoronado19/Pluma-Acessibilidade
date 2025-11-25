CREATE DATABASE  IF NOT EXISTS `extensao-pluma` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `extensao-pluma`;
-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: extensao-pluma
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `preferencias`
--

DROP TABLE IF EXISTS `preferencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preferencias` (
  `idpreferencias` int NOT NULL AUTO_INCREMENT,
  `preferencias_json` json NOT NULL,
  `data_atualizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idpreferencias`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preferencias`
--

LOCK TABLES `preferencias` WRITE;
/*!40000 ALTER TABLE `preferencias` DISABLE KEYS */;
INSERT INTO `preferencias` VALUES (1,'{\"ttsRate\": 1.0, \"themeName\": \"padrao\", \"ttsVolume\": 1.0, \"fontFamily\": \"Atkinson Hyperlegible\", \"themeStyles\": {\"buttonBg\": \"#008000\", \"linkColor\": \"#0000FF\", \"textColor\": \"#000000\", \"buttonText\": \"#FFFFFF\", \"selectedBg\": \"#008000\", \"selectedText\": \"#FFFFFF\", \"disabledColor\": \"#B0B0B0\", \"backgroundColor\": \"#FFFFFF\"}, \"fontSizeFactor\": 1.0, \"keyboardNavToggle\": false, \"fontSettingsToggle\": false, \"highContrastToggle\": false, \"distractionFreeToggle\": false}','2025-11-25 14:17:29');
/*!40000 ALTER TABLE `preferencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_preferencia`
--

DROP TABLE IF EXISTS `usuario_preferencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_preferencia` (
  `idusuario_preferencia` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_preferencia` int NOT NULL,
  PRIMARY KEY (`idusuario_preferencia`),
  KEY `fk_id_usuario_idx` (`id_usuario`),
  KEY `fk_preferencia_usuario` (`id_preferencia`),
  CONSTRAINT `fk_id_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`idusuarios`),
  CONSTRAINT `fk_preferencia_usuario` FOREIGN KEY (`id_preferencia`) REFERENCES `preferencias` (`idpreferencias`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_preferencia`
--

LOCK TABLES `usuario_preferencia` WRITE;
/*!40000 ALTER TABLE `usuario_preferencia` DISABLE KEYS */;
INSERT INTO `usuario_preferencia` VALUES (1,1,1);
/*!40000 ALTER TABLE `usuario_preferencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idusuarios` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `telefone` varchar(11) NOT NULL,
  `nascimento` date NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `genero` enum('Feminino','Masculino','Outro','nao-dizer') NOT NULL,
  `acessibilidade` set('Baixa Visibilidade','Dislexia','60+','Daltonismo','Surdez','Outro') NOT NULL,
  PRIMARY KEY (`idusuarios`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Usuário Teste','11987654321','2000-01-01','teste@gmail.com','$2b$10$7.i8i9p3HxmZKXJ8IT485uTp6uLB1c6TmtTVCJffgRVEGgjgotp/.','Feminino','Dislexia'),(2,'Teste Acessibilidades','11900008111','1212-12-12','acess@gmail.com','$2b$10$ZWWY62ovCzIoMm0hMFE.6ubYf0ziFnvLUy6xiMNvS5HLya9cySdDW','Outro','Baixa Visibilidade,Dislexia'),(3,'João Pedro Minucci Regueira','11920003194','2007-11-11','japabossminecraft@gmail.com','$2b$10$vygLYVia8ZadVuGJn53zM.SmqPvXpEHnOsvVg.CbfNGzcCN.KG6DS','Masculino','Baixa Visibilidade,Dislexia,Outro'),(4,'Fernanda','11929079325','1971-11-10','fernanda@gmail.com','$2b$10$cThwp0kY8UgeI3kzs7Z.3eQZYz1gryjaekEXYHerLuO284qc3Jhki','Feminino','Daltonismo,Surdez');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `view_preferencias_atuais`
--

DROP TABLE IF EXISTS `view_preferencias_atuais`;
/*!50001 DROP VIEW IF EXISTS `view_preferencias_atuais`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_preferencias_atuais` AS SELECT 
 1 AS `id_usuario`,
 1 AS `preferencias_json`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'extensao-pluma'
--

--
-- Dumping routines for database 'extensao-pluma'
--

--
-- Final view structure for view `view_preferencias_atuais`
--

/*!50001 DROP VIEW IF EXISTS `view_preferencias_atuais`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_preferencias_atuais` AS select `u`.`idusuarios` AS `id_usuario`,`p`.`preferencias_json` AS `preferencias_json` from ((`usuarios` `u` join `usuario_preferencia` `up` on((`u`.`idusuarios` = `up`.`id_usuario`))) join `preferencias` `p` on((`up`.`id_preferencia` = `p`.`idpreferencias`))) where (`p`.`data_atualizacao` = (select max(`p2`.`data_atualizacao`) from (`usuario_preferencia` `up2` join `preferencias` `p2` on((`up2`.`id_preferencia` = `p2`.`idpreferencias`))) where (`up2`.`id_usuario` = `u`.`idusuarios`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-25 16:33:32
