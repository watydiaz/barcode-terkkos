-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3307
-- Generation Time: Sep 24, 2025 at 01:08 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `barcode_terkkos`
--

-- --------------------------------------------------------

--
-- Table structure for table `actividad_log`
--

CREATE TABLE `actividad_log` (
  `id` int NOT NULL,
  `pedido_id` int DEFAULT NULL,
  `ronda_id` int DEFAULT NULL,
  `mesa_alquiler_id` int DEFAULT NULL,
  `tipo_actividad` enum('crear_pedido','crear_ronda','editar_ronda','pago_parcial','pago_completo','alquiler_mesa','terminar_mesa','eliminar_ronda','duplicar_ronda') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `usuario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `actividad_log`
--

INSERT INTO `actividad_log` (`id`, `pedido_id`, `ronda_id`, `mesa_alquiler_id`, `tipo_actividad`, `descripcion`, `datos_anteriores`, `datos_nuevos`, `usuario`, `ip_address`, `created_at`) VALUES
(1, 1, 1, NULL, 'crear_ronda', 'Nueva ronda #1 creada para pedido ID: 1', NULL, '{\"total\": 0.00, \"ronda_id\": 1, \"numero_ronda\": 1}', NULL, NULL, '2025-09-16 03:28:39'),
(2, NULL, 1, NULL, 'pago_parcial', 'Pago de $5000.00 por Juan (Efectivo)', NULL, '{\"monto\": 5000.00, \"metodo\": \"Efectivo\", \"pago_id\": 1, \"persona\": \"Juan\"}', NULL, NULL, '2025-09-16 03:28:39');

-- --------------------------------------------------------

--
-- Table structure for table `categorias`
--

CREATE TABLE `categorias` (
  `id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Bebidas Alcoh├│licas', 'Cervezas, licores, vinos y cocteles', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(2, 'Bebidas No Alcoh├│licas', 'Gaseosas, jugos, agua y bebidas calientes', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(3, 'Comida R├ípida', 'Hamburguesas, perros, sandwiches', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(4, 'Aperitivos', 'Papas, nachos, alitas, piqueos', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(5, 'Postres', 'Helados, tortas, dulces', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(6, 'Platos Principales', 'Carnes, pollo, pescado, pasta', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(7, 'Desayunos', 'Huevos, arepas, caf├®, pan', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(8, 'Otros', 'Productos varios y servicios', 1, '2025-09-16 03:28:38', '2025-09-16 03:28:38');

-- --------------------------------------------------------

--
-- Table structure for table `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int NOT NULL,
  `clave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `tipo_dato` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `categoria` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `configuracion`
--

INSERT INTO `configuracion` (`id`, `clave`, `valor`, `descripcion`, `tipo_dato`, `categoria`, `created_at`, `updated_at`) VALUES
(1, 'precio_mesa_hora', '7000', 'Precio por hora de alquiler de mesa', 'number', 'mesas', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(2, 'redondear_tiempo_mesa', 'true', 'Si redondear tiempo de mesa hacia arriba cada hora', 'boolean', 'mesas', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(3, 'permitir_stock_negativo', 'false', 'Permitir vender productos con stock negativo', 'boolean', 'inventario', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(4, 'alertar_stock_minimo', 'true', 'Mostrar alertas cuando productos lleguen al stock m├¡nimo', 'boolean', 'inventario', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(5, 'metodos_pago_activos', '[\"Efectivo\", \"Nequi\", \"Daviplata\", \"Transferencia\"]', 'M├®todos de pago disponibles en el sistema', 'json', 'pagos', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(6, 'permitir_precios_negativos', 'true', 'Permitir precios negativos para descuentos', 'boolean', 'productos', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(7, 'auto_eliminar_rondas_pagadas', 'true', 'Eliminar autom├íticamente rondas cuando se paguen completas', 'boolean', 'rondas', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(8, 'version_sistema', '1.0.0', 'Versi├│n actual del sistema', 'string', 'sistema', '2025-09-16 03:28:39', '2025-09-16 03:28:39');

-- --------------------------------------------------------

--
-- Table structure for table `inventario_movimientos`
--

CREATE TABLE `inventario_movimientos` (
  `id` int NOT NULL,
  `producto_id` int NOT NULL,
  `tipo_movimiento` enum('entrada','salida','ajuste') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `stock_anterior` int NOT NULL,
  `stock_nuevo` int NOT NULL,
  `motivo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventario_movimientos`
--

INSERT INTO `inventario_movimientos` (`id`, `producto_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `motivo`, `referencia`, `usuario`, `created_at`) VALUES
(1, 1, 'salida', 2, 120, 118, 'Venta en ronda ID: 1', 'RONDA_1', NULL, '2025-09-16 03:28:39'),
(2, 21, 'salida', 1, 1, 0, 'Venta en ronda ID: 1', 'RONDA_1', NULL, '2025-09-16 03:28:39');

-- --------------------------------------------------------

--
-- Table structure for table `mesas`
--

CREATE TABLE `mesas` (
  `id` int NOT NULL,
  `numero_mesa` int NOT NULL,
  `capacidad` int DEFAULT '4',
  `precio_hora` decimal(10,2) DEFAULT '7000.00',
  `activa` tinyint(1) DEFAULT '1',
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mesas`
--

INSERT INTO `mesas` (`id`, `numero_mesa`, `capacidad`, `precio_hora`, `activa`, `descripcion`, `created_at`) VALUES
(1, 1, 4, 7000.00, 1, 'Mesa 1 - Interior', '2025-09-16 03:28:39'),
(2, 2, 4, 7000.00, 1, 'Mesa 2 - Interior', '2025-09-16 03:28:39'),
(3, 3, 6, 7000.00, 1, 'Mesa 3 - Terraza', '2025-09-16 03:28:39'),
(4, 4, 4, 7000.00, 1, 'Mesa 4 - Interior', '2025-09-16 03:28:39');

-- --------------------------------------------------------

--
-- Stand-in structure for view `mesas_estado_actual`
-- (See below for the actual view)
--
CREATE TABLE `mesas_estado_actual` (
`id` int
,`numero_mesa` int
,`capacidad` int
,`precio_hora` decimal(10,2)
,`estado` varchar(10)
,`pedido_id` int
,`nombre_cliente` varchar(200)
,`fecha_inicio` datetime
,`tiempo_minutos` int
,`costo_total` decimal(10,2)
,`minutos_reales_transcurridos` bigint
);

-- --------------------------------------------------------

--
-- Table structure for table `mesa_alquileres`
--

CREATE TABLE `mesa_alquileres` (
  `id` int NOT NULL,
  `pedido_id` int NOT NULL,
  `mesa_id` int NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `tiempo_minutos` int DEFAULT '0',
  `tiempo_segundos` int DEFAULT '0',
  `costo_total` decimal(10,2) DEFAULT '0.00',
  `precio_hora_aplicado` decimal(10,2) NOT NULL,
  `estado` enum('activo','terminado','pausado') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `contador_pausas` int DEFAULT '0',
  `tiempo_pausado_minutos` int DEFAULT '0',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mesa_alquileres`
--

INSERT INTO `mesa_alquileres` (`id`, `pedido_id`, `mesa_id`, `fecha_inicio`, `fecha_fin`, `tiempo_minutos`, `tiempo_segundos`, `costo_total`, `precio_hora_aplicado`, `estado`, `contador_pausas`, `tiempo_pausado_minutos`, `notas`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2025-09-15 21:58:39', NULL, 31, 1883, 7000.00, 7000.00, 'activo', 0, 0, NULL, '2025-09-16 03:28:39', '2025-09-16 03:30:02');

--
-- Triggers `mesa_alquileres`
--
DELIMITER $$
CREATE TRIGGER `actualizar_costo_mesa` BEFORE UPDATE ON `mesa_alquileres` FOR EACH ROW BEGIN
    -- Solo calcular si el estado cambia o se actualiza fecha_fin
    IF NEW.estado = 'activo' AND NEW.fecha_inicio IS NOT NULL THEN
        -- Calcular tiempo transcurrido en minutos
        SET NEW.tiempo_minutos = TIMESTAMPDIFF(MINUTE, NEW.fecha_inicio, NOW());
        SET NEW.tiempo_segundos = TIMESTAMPDIFF(SECOND, NEW.fecha_inicio, NOW());
        
        -- Calcular costo basado en minutos (redondear hacia arriba cada hora)
        SET NEW.costo_total = CEILING(NEW.tiempo_minutos / 60) * NEW.precio_hora_aplicado;
    END IF;
    
    -- Si se termina el alquiler, usar fecha_fin para cálculo final
    IF NEW.estado = 'terminado' AND NEW.fecha_fin IS NOT NULL THEN
        SET NEW.tiempo_minutos = TIMESTAMPDIFF(MINUTE, NEW.fecha_inicio, NEW.fecha_fin);
        SET NEW.tiempo_segundos = TIMESTAMPDIFF(SECOND, NEW.fecha_inicio, NEW.fecha_fin);
        SET NEW.costo_total = CEILING(NEW.tiempo_minutos / 60) * NEW.precio_hora_aplicado;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `pagos`
--

CREATE TABLE `pagos` (
  `id` int NOT NULL,
  `ronda_id` int NOT NULL,
  `persona` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('Efectivo','Nequi','Daviplata','Transferencia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_pago` datetime NOT NULL,
  `es_pago_completo` tinyint(1) DEFAULT '0',
  `division_personas` int DEFAULT '1',
  `monto_por_persona` decimal(10,2) DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pagos`
--

INSERT INTO `pagos` (`id`, `ronda_id`, `persona`, `monto`, `metodo_pago`, `fecha_pago`, `es_pago_completo`, `division_personas`, `monto_por_persona`, `notas`, `created_at`) VALUES
(1, 1, 'Juan', 5000.00, 'Efectivo', '2025-09-15 22:28:39', 0, 2, 2500.00, NULL, '2025-09-16 03:28:39');

--
-- Triggers `pagos`
--
DELIMITER $$
CREATE TRIGGER `log_actividad_pagos` AFTER INSERT ON `pagos` FOR EACH ROW BEGIN
    DECLARE actividad_tipo VARCHAR(50);
    
    IF NEW.es_pago_completo THEN
        SET actividad_tipo = 'pago_completo';
    ELSE
        SET actividad_tipo = 'pago_parcial';
    END IF;
    
    INSERT INTO actividad_log (ronda_id, tipo_actividad, descripcion, datos_nuevos)
    VALUES (
        NEW.ronda_id,
        actividad_tipo,
        CONCAT('Pago de $', NEW.monto, ' por ', NEW.persona, ' (', NEW.metodo_pago, ')'),
        JSON_OBJECT('pago_id', NEW.id, 'monto', NEW.monto, 'persona', NEW.persona, 'metodo', NEW.metodo_pago)
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int NOT NULL,
  `numero_pedido` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_cliente` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('activo','pagado','cancelado') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `total_pedido` decimal(10,2) DEFAULT '0.00',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pedidos`
--

INSERT INTO `pedidos` (`id`, `numero_pedido`, `nombre_cliente`, `estado`, `total_pedido`, `notas`, `created_at`, `updated_at`) VALUES
(1, 'PED-001', 'Cliente Ejemplo', 'activo', 22050.00, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39');

-- --------------------------------------------------------

--
-- Table structure for table `productos`
--

CREATE TABLE `productos` (
  `id` int NOT NULL,
  `codigo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `categoria_id` int DEFAULT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `precio_costo` decimal(10,2) DEFAULT NULL,
  `stock_actual` int DEFAULT '0',
  `stock_minimo` int DEFAULT '5',
  `unidad_medida` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'unidad',
  `activo` tinyint(1) DEFAULT '1',
  `imagen_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `productos`
--

INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `precio_venta`, `precio_costo`, `stock_actual`, `stock_minimo`, `unidad_medida`, `activo`, `imagen_url`, `created_at`, `updated_at`) VALUES
(1, 'BEER001', 'Cerveza ├üguila 330ml', NULL, 1, 3500.00, 2200.00, 118, 20, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:39'),
(2, 'BEER002', 'Cerveza Club Colombia 330ml', NULL, 1, 4000.00, 2500.00, 80, 15, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(3, 'BEER003', 'Cerveza Corona 355ml', NULL, 1, 5500.00, 3500.00, 60, 12, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(4, 'BEER004', 'Cerveza Heineken 330ml', NULL, 1, 6000.00, 3800.00, 45, 10, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(5, 'BEER005', 'Cerveza Poker 330ml', NULL, 1, 3000.00, 1900.00, 150, 25, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(6, 'WINE001', 'Vino Tinto Alamos', NULL, 1, 45000.00, 28000.00, 12, 3, 'botella', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(7, 'WINE002', 'Vino Blanco Santa Rita', NULL, 1, 38000.00, 24000.00, 8, 2, 'botella', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(8, 'LIQU001', 'Aguardiente Antioque├▒o 375ml', NULL, 1, 35000.00, 22000.00, 25, 5, 'botella', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(9, 'LIQU002', 'Ron Medell├¡n A├▒ejo 375ml', NULL, 1, 42000.00, 26000.00, 15, 3, 'botella', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(10, 'LIQU003', 'Whisky Old Parr 750ml', NULL, 1, 120000.00, 75000.00, 8, 2, 'botella', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(11, 'LIQU004', 'Vodka Smirnoff 750ml', NULL, 1, 85000.00, 55000.00, 6, 2, 'botella', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(12, 'SODA001', 'Coca Cola 350ml', NULL, 2, 2500.00, 1200.00, 200, 30, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(13, 'SODA002', 'Pepsi 350ml', NULL, 2, 2500.00, 1200.00, 180, 30, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(14, 'SODA003', 'Sprite 350ml', NULL, 2, 2500.00, 1200.00, 150, 25, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(15, 'SODA004', 'Fanta Naranja 350ml', NULL, 2, 2500.00, 1200.00, 120, 20, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(16, 'SODA005', 'Colombiana 350ml', NULL, 2, 2800.00, 1400.00, 100, 20, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(17, 'WATER001', 'Agua Cristal 600ml', NULL, 2, 2000.00, 800.00, 300, 50, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(18, 'WATER002', 'Agua Manantial 600ml', NULL, 2, 1800.00, 700.00, 250, 40, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(19, 'JUICE001', 'Jugo Natural Naranja', NULL, 2, 4500.00, 2000.00, 0, 0, 'vaso', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(20, 'JUICE002', 'Jugo Natural Lulo', NULL, 2, 5000.00, 2200.00, 0, 0, 'vaso', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(21, 'JUICE003', 'Jugo Natural Mora', NULL, 2, 5000.00, 2200.00, 0, 0, 'vaso', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(22, 'HOT001', 'Caf├® Americano', NULL, 2, 3000.00, 800.00, 0, 0, 'taza', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(23, 'HOT002', 'Caf├® con Leche', NULL, 2, 3500.00, 1000.00, 0, 0, 'taza', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(24, 'HOT003', 'Chocolate Caliente', NULL, 2, 4000.00, 1500.00, 0, 0, 'taza', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(25, 'HOT004', 'Arom├ítica', NULL, 2, 2500.00, 600.00, 0, 0, 'taza', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(26, 'BURG001', 'Hamburguesa Sencilla', NULL, 3, 12000.00, 6000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(27, 'BURG002', 'Hamburguesa Doble Carne', NULL, 3, 18000.00, 9000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(28, 'BURG003', 'Hamburguesa de Pollo', NULL, 3, 14000.00, 7000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(29, 'BURG004', 'Hamburguesa Vegetariana', NULL, 3, 13000.00, 6500.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(30, 'HOTD001', 'Perro Sencillo', NULL, 3, 8000.00, 4000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(31, 'HOTD002', 'Perro Especial', NULL, 3, 12000.00, 6000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(32, 'HOTD003', 'Choripan', NULL, 3, 10000.00, 5000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(33, 'SAND001', 'Sandwich Mixto', NULL, 3, 9000.00, 4500.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(34, 'SAND002', 'Sandwich de Pollo', NULL, 3, 11000.00, 5500.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(35, 'SNACK001', 'Papas Francesas Peque├▒a', NULL, 4, 4000.00, 1500.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(36, 'SNACK002', 'Papas Francesas Grande', NULL, 4, 7000.00, 2500.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(37, 'SNACK003', 'Papas Cascos', NULL, 4, 8000.00, 3000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(38, 'SNACK004', 'Yuca Frita', NULL, 4, 6000.00, 2200.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(39, 'WING001', 'Alitas BBQ (6 unidades)', NULL, 4, 15000.00, 8000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(40, 'WING002', 'Alitas Picantes (6 unidades)', NULL, 4, 15000.00, 8000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(41, 'WING003', 'Alitas B├║falo (6 unidades)', NULL, 4, 16000.00, 8500.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(42, 'NCHO001', 'Nachos con Queso', NULL, 4, 12000.00, 5000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(43, 'NCHO002', 'Nachos Especiales', NULL, 4, 18000.00, 8000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(44, 'PICK001', 'Picada Personal', NULL, 4, 25000.00, 12000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(45, 'PICK002', 'Picada para 2', NULL, 4, 45000.00, 22000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(46, 'PICK003', 'Picada Familiar', NULL, 4, 65000.00, 32000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:38', '2025-09-16 03:28:38'),
(47, 'DESS001', 'Helado 1 Bola', NULL, 5, 3500.00, 1200.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(48, 'DESS002', 'Helado 2 Bolas', NULL, 5, 6000.00, 2000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(49, 'DESS003', 'Helado 3 Bolas', NULL, 5, 8500.00, 3000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(50, 'CAKE001', 'Torta Tres Leches', NULL, 5, 7000.00, 3000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(51, 'CAKE002', 'Torta de Chocolate', NULL, 5, 6500.00, 2800.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(52, 'CAKE003', 'Cheesecake', NULL, 5, 9000.00, 4000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(53, 'SWEE001', 'Brownie con Helado', NULL, 5, 8000.00, 3500.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(54, 'SWEE002', 'Flan de Caramelo', NULL, 5, 5000.00, 2200.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(55, 'MAIN001', 'Bandeja Paisa', NULL, 6, 28000.00, 15000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(56, 'MAIN002', 'Pechuga a la Plancha', NULL, 6, 22000.00, 12000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(57, 'MAIN003', 'Churrasco', NULL, 6, 35000.00, 18000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(58, 'MAIN004', 'Mojarra Frita', NULL, 6, 25000.00, 13000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(59, 'MAIN005', 'Pasta Carbonara', NULL, 6, 18000.00, 9000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(60, 'MAIN006', 'Pasta Bolognesa', NULL, 6, 16000.00, 8000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(61, 'MAIN007', 'Arroz con Pollo', NULL, 6, 20000.00, 10000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(62, 'BREK001', 'Huevos Pericos', NULL, 7, 8000.00, 3500.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(63, 'BREK002', 'Huevos al Gusto', NULL, 7, 7000.00, 3000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(64, 'BREK003', 'Calentado Paisa', NULL, 7, 12000.00, 6000.00, 0, 0, 'plato', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(65, 'BREK004', 'Arepa con Queso', NULL, 7, 5000.00, 2000.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(66, 'BREK005', 'Arepa Rellena', NULL, 7, 8000.00, 3500.00, 0, 0, 'unidad', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(67, 'BREK006', 'Tostadas Francesas', NULL, 7, 9000.00, 4000.00, 0, 0, 'porci├│n', 1, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39');

-- --------------------------------------------------------

--
-- Stand-in structure for view `productos_mas_vendidos`
-- (See below for the actual view)
--
CREATE TABLE `productos_mas_vendidos` (
`id` int
,`codigo` varchar(50)
,`nombre_producto` varchar(200)
,`categoria` varchar(100)
,`veces_pedido` bigint
,`cantidad_total_vendida` decimal(32,0)
,`ingresos_totales` decimal(32,2)
,`precio_promedio` decimal(14,6)
,`stock_actual` int
,`precio_actual` decimal(10,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `productos_stock_bajo`
-- (See below for the actual view)
--
CREATE TABLE `productos_stock_bajo` (
`id` int
,`codigo` varchar(50)
,`nombre` varchar(200)
,`categoria` varchar(100)
,`stock_actual` int
,`stock_minimo` int
,`precio_venta` decimal(10,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `producto_cambios`
--

CREATE TABLE `producto_cambios` (
  `id` int NOT NULL,
  `ronda_detalle_id` int NOT NULL,
  `producto_original_id` int DEFAULT NULL,
  `producto_nuevo_id` int DEFAULT NULL,
  `nombre_producto_original` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre_producto_nuevo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cantidad_original` int DEFAULT NULL,
  `cantidad_nueva` int DEFAULT NULL,
  `precio_original` decimal(10,2) DEFAULT NULL,
  `precio_nuevo` decimal(10,2) DEFAULT NULL,
  `tipo_operacion` enum('cambio','devolucion','descuento') COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto_descuento` decimal(10,2) DEFAULT '0.00',
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `usuario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `resumen_financiero_diario`
-- (See below for the actual view)
--
CREATE TABLE `resumen_financiero_diario` (
`fecha` date
,`rondas_pagadas` bigint
,`total_pagos` bigint
,`ingresos_totales` decimal(32,2)
,`efectivo` decimal(32,2)
,`nequi` decimal(32,2)
,`daviplata` decimal(32,2)
,`transferencia` decimal(32,2)
,`ingresos_mesas` decimal(32,2)
,`mesas_alquiladas` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `resumen_pedidos_activos`
-- (See below for the actual view)
--
CREATE TABLE `resumen_pedidos_activos` (
`id` int
,`numero_pedido` varchar(50)
,`nombre_cliente` varchar(200)
,`total_pedido` decimal(10,2)
,`total_rondas` bigint
,`rondas_pagadas` bigint
,`rondas_activas` bigint
,`total_pagado` decimal(32,2)
,`saldo_pendiente` decimal(33,2)
,`mesa_numero` int
,`mesa_activa` bigint
,`tiempo_mesa_minutos` int
,`costo_mesa_actual` decimal(10,2)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `rondas`
--

CREATE TABLE `rondas` (
  `id` int NOT NULL,
  `pedido_id` int NOT NULL,
  `numero_ronda` int NOT NULL,
  `total_ronda` decimal(10,2) DEFAULT '0.00',
  `responsable` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('activa','pagada') COLLATE utf8mb4_unicode_ci DEFAULT 'activa',
  `es_duplicada` tinyint(1) DEFAULT '0',
  `ronda_origen_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rondas`
--

INSERT INTO `rondas` (`id`, `pedido_id`, `numero_ronda`, `total_ronda`, `responsable`, `estado`, `es_duplicada`, `ronda_origen_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 22050.00, 'Juan\nPedro', 'activa', 0, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39');

--
-- Triggers `rondas`
--
DELIMITER $$
CREATE TRIGGER `log_actividad_rondas` AFTER INSERT ON `rondas` FOR EACH ROW BEGIN
    INSERT INTO actividad_log (pedido_id, ronda_id, tipo_actividad, descripcion, datos_nuevos)
    VALUES (
        NEW.pedido_id,
        NEW.id,
        'crear_ronda',
        CONCAT('Nueva ronda #', NEW.numero_ronda, ' creada para pedido ID: ', NEW.pedido_id),
        JSON_OBJECT('ronda_id', NEW.id, 'numero_ronda', NEW.numero_ronda, 'total', NEW.total_ronda)
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `ronda_detalles`
--

CREATE TABLE `ronda_detalles` (
  `id` int NOT NULL,
  `ronda_id` int NOT NULL,
  `producto_id` int DEFAULT NULL,
  `nombre_producto` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `es_descuento` tinyint(1) DEFAULT '0',
  `es_producto_personalizado` tinyint(1) DEFAULT '0',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ronda_detalles`
--

INSERT INTO `ronda_detalles` (`id`, `ronda_id`, `producto_id`, `nombre_producto`, `cantidad`, `precio_unitario`, `subtotal`, `es_descuento`, `es_producto_personalizado`, `notas`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Cerveza ├üguila 330ml', 2, 3500.00, 7000.00, 0, 0, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(2, 1, 21, 'Coca Cola 350ml', 1, 2500.00, 2500.00, 0, 0, NULL, '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(3, 1, NULL, 'Combo especial personalizado', 1, 15000.00, 15000.00, 0, 1, 'Combo creado especialmente para el cliente', '2025-09-16 03:28:39', '2025-09-16 03:28:39'),
(4, 1, 1, 'DESCUENTO: Cerveza devuelta', 1, -2450.00, -2450.00, 1, 0, 'Cliente devolvi├│ cerveza, descuento del 70%', '2025-09-16 03:28:39', '2025-09-16 03:28:39');

--
-- Triggers `ronda_detalles`
--
DELIMITER $$
CREATE TRIGGER `actualizar_stock_devolucion` AFTER DELETE ON `ronda_detalles` FOR EACH ROW BEGIN
    -- Solo restaurar stock si no era un descuento y tenía producto_id válido
    IF OLD.es_descuento = FALSE AND OLD.producto_id IS NOT NULL AND OLD.cantidad > 0 THEN
        -- Restaurar stock solo si el producto existe en inventario
        IF EXISTS (SELECT 1 FROM productos WHERE id = OLD.producto_id) THEN
            UPDATE productos 
            SET stock_actual = stock_actual + OLD.cantidad
            WHERE id = OLD.producto_id;
            
            -- Registrar movimiento de inventario
            INSERT INTO inventario_movimientos 
            (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia)
            SELECT 
                OLD.producto_id,
                'entrada',
                OLD.cantidad,
                stock_actual - OLD.cantidad,
                stock_actual,
                CONCAT('Devoluci├│n de ronda ID: ', OLD.ronda_id),
                CONCAT('DEV_RONDA_', OLD.ronda_id)
            FROM productos 
            WHERE id = OLD.producto_id;
        END IF;
    END IF;
    
    -- Actualizar total de la ronda
    UPDATE rondas 
    SET total_ronda = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM ronda_detalles 
        WHERE ronda_id = OLD.ronda_id
    )
    WHERE id = OLD.ronda_id;
    
    -- Actualizar total del pedido
    UPDATE pedidos 
    SET total_pedido = (
        SELECT COALESCE(SUM(r.total_ronda), 0)
        FROM rondas r
        WHERE r.pedido_id = (
            SELECT pedido_id FROM rondas WHERE id = OLD.ronda_id
        ) AND r.estado = 'activa'
    )
    WHERE id = (
        SELECT pedido_id FROM rondas WHERE id = OLD.ronda_id
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `actualizar_stock_salida` AFTER INSERT ON `ronda_detalles` FOR EACH ROW BEGIN
    -- Solo reducir stock si no es un descuento y tiene producto_id válido
    IF NEW.es_descuento = FALSE AND NEW.producto_id IS NOT NULL AND NEW.cantidad > 0 THEN
        -- Reducir stock solo si el producto existe en inventario
        IF EXISTS (SELECT 1 FROM productos WHERE id = NEW.producto_id AND stock_actual >= 0) THEN
            UPDATE productos 
            SET stock_actual = GREATEST(0, stock_actual - NEW.cantidad)
            WHERE id = NEW.producto_id;
            
            -- Registrar movimiento de inventario
            INSERT INTO inventario_movimientos 
            (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia)
            SELECT 
                NEW.producto_id,
                'salida',
                NEW.cantidad,
                stock_actual + NEW.cantidad,
                stock_actual,
                CASE 
                    WHEN NEW.es_producto_personalizado THEN CONCAT('Venta personalizada: ', NEW.nombre_producto)
                    ELSE CONCAT('Venta en ronda ID: ', NEW.ronda_id)
                END,
                CONCAT('RONDA_', NEW.ronda_id)
            FROM productos 
            WHERE id = NEW.producto_id;
        END IF;
    END IF;
    
    -- Actualizar total de la ronda (siempre, incluyendo descuentos)
    UPDATE rondas 
    SET total_ronda = (
        SELECT COALESCE(SUM(subtotal), 0) 
        FROM ronda_detalles 
        WHERE ronda_id = NEW.ronda_id
    )
    WHERE id = NEW.ronda_id;
    
    -- Actualizar total del pedido
    UPDATE pedidos 
    SET total_pedido = (
        SELECT COALESCE(SUM(r.total_ronda), 0)
        FROM rondas r
        WHERE r.pedido_id = (
            SELECT pedido_id FROM rondas WHERE id = NEW.ronda_id
        ) AND r.estado = 'activa'  -- Solo contar rondas activas
    )
    WHERE id = (
        SELECT pedido_id FROM rondas WHERE id = NEW.ronda_id
    );
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `actividad_log`
--
ALTER TABLE `actividad_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ronda_id` (`ronda_id`),
  ADD KEY `mesa_alquiler_id` (`mesa_alquiler_id`),
  ADD KEY `idx_pedido` (`pedido_id`),
  ADD KEY `idx_tipo` (`tipo_actividad`),
  ADD KEY `idx_fecha` (`created_at`);

--
-- Indexes for table `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `clave` (`clave`),
  ADD KEY `idx_categoria` (`categoria`),
  ADD KEY `idx_clave` (`clave`);

--
-- Indexes for table `inventario_movimientos`
--
ALTER TABLE `inventario_movimientos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_producto` (`producto_id`),
  ADD KEY `idx_fecha` (`created_at`),
  ADD KEY `idx_tipo` (`tipo_movimiento`);

--
-- Indexes for table `mesas`
--
ALTER TABLE `mesas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_mesa` (`numero_mesa`);

--
-- Indexes for table `mesa_alquileres`
--
ALTER TABLE `mesa_alquileres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pedido` (`pedido_id`),
  ADD KEY `idx_mesa` (`mesa_id`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_fecha_inicio` (`fecha_inicio`),
  ADD KEY `idx_activo_mesa` (`mesa_id`,`estado`);

--
-- Indexes for table `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ronda` (`ronda_id`),
  ADD KEY `idx_fecha` (`fecha_pago`),
  ADD KEY `idx_metodo` (`metodo_pago`),
  ADD KEY `idx_pago_completo` (`es_pago_completo`);

--
-- Indexes for table `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_pedido` (`numero_pedido`),
  ADD KEY `idx_numero` (`numero_pedido`),
  ADD KEY `idx_cliente` (`nombre_cliente`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_fecha` (`created_at`),
  ADD KEY `idx_pedidos_estado_fecha` (`estado`,`created_at`);

--
-- Indexes for table `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `idx_codigo` (`codigo`),
  ADD KEY `idx_nombre` (`nombre`),
  ADD KEY `idx_categoria` (`categoria_id`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_productos_categoria_activo` (`categoria_id`,`activo`),
  ADD KEY `idx_stock_bajo` (`stock_actual`,`stock_minimo`);

--
-- Indexes for table `producto_cambios`
--
ALTER TABLE `producto_cambios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `producto_original_id` (`producto_original_id`),
  ADD KEY `producto_nuevo_id` (`producto_nuevo_id`),
  ADD KEY `idx_ronda_detalle` (`ronda_detalle_id`),
  ADD KEY `idx_tipo` (`tipo_operacion`),
  ADD KEY `idx_fecha` (`created_at`);

--
-- Indexes for table `rondas`
--
ALTER TABLE `rondas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_pedido_ronda` (`pedido_id`,`numero_ronda`),
  ADD KEY `ronda_origen_id` (`ronda_origen_id`),
  ADD KEY `idx_pedido` (`pedido_id`),
  ADD KEY `idx_numero_ronda` (`numero_ronda`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_duplicada` (`es_duplicada`),
  ADD KEY `idx_rondas_pedido_estado` (`pedido_id`,`estado`);

--
-- Indexes for table `ronda_detalles`
--
ALTER TABLE `ronda_detalles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ronda` (`ronda_id`),
  ADD KEY `idx_producto` (`producto_id`),
  ADD KEY `idx_descuento` (`es_descuento`),
  ADD KEY `idx_personalizado` (`es_producto_personalizado`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `actividad_log`
--
ALTER TABLE `actividad_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `inventario_movimientos`
--
ALTER TABLE `inventario_movimientos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `mesas`
--
ALTER TABLE `mesas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `mesa_alquileres`
--
ALTER TABLE `mesa_alquileres`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `producto_cambios`
--
ALTER TABLE `producto_cambios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rondas`
--
ALTER TABLE `rondas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ronda_detalles`
--
ALTER TABLE `ronda_detalles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

-- --------------------------------------------------------

--
-- Structure for view `mesas_estado_actual`
--
DROP TABLE IF EXISTS `mesas_estado_actual`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `mesas_estado_actual`  AS SELECT `m`.`id` AS `id`, `m`.`numero_mesa` AS `numero_mesa`, `m`.`capacidad` AS `capacidad`, `m`.`precio_hora` AS `precio_hora`, (case when (`ma`.`id` is not null) then 'ocupada' else 'disponible' end) AS `estado`, `ma`.`pedido_id` AS `pedido_id`, `p`.`nombre_cliente` AS `nombre_cliente`, `ma`.`fecha_inicio` AS `fecha_inicio`, `ma`.`tiempo_minutos` AS `tiempo_minutos`, `ma`.`costo_total` AS `costo_total`, timestampdiff(MINUTE,`ma`.`fecha_inicio`,now()) AS `minutos_reales_transcurridos` FROM ((`mesas` `m` left join `mesa_alquileres` `ma` on(((`m`.`id` = `ma`.`mesa_id`) and (`ma`.`estado` = 'activo')))) left join `pedidos` `p` on((`ma`.`pedido_id` = `p`.`id`))) WHERE (`m`.`activa` = true) ORDER BY `m`.`numero_mesa` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `productos_mas_vendidos`
--
DROP TABLE IF EXISTS `productos_mas_vendidos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `productos_mas_vendidos`  AS SELECT `p`.`id` AS `id`, `p`.`codigo` AS `codigo`, `p`.`nombre` AS `nombre_producto`, `c`.`nombre` AS `categoria`, count(`rd`.`id`) AS `veces_pedido`, sum(`rd`.`cantidad`) AS `cantidad_total_vendida`, sum(`rd`.`subtotal`) AS `ingresos_totales`, avg(`rd`.`precio_unitario`) AS `precio_promedio`, `p`.`stock_actual` AS `stock_actual`, `p`.`precio_venta` AS `precio_actual` FROM ((`productos` `p` join `categorias` `c` on((`p`.`categoria_id` = `c`.`id`))) left join `ronda_detalles` `rd` on((`p`.`id` = `rd`.`producto_id`))) WHERE ((`rd`.`es_descuento` = false) AND (`rd`.`es_producto_personalizado` = false)) GROUP BY `p`.`id` ORDER BY `cantidad_total_vendida` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `productos_stock_bajo`
--
DROP TABLE IF EXISTS `productos_stock_bajo`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `productos_stock_bajo`  AS SELECT `p`.`id` AS `id`, `p`.`codigo` AS `codigo`, `p`.`nombre` AS `nombre`, `c`.`nombre` AS `categoria`, `p`.`stock_actual` AS `stock_actual`, `p`.`stock_minimo` AS `stock_minimo`, `p`.`precio_venta` AS `precio_venta` FROM (`productos` `p` left join `categorias` `c` on((`p`.`categoria_id` = `c`.`id`))) WHERE ((`p`.`activo` = true) AND (`p`.`stock_actual` <= `p`.`stock_minimo`)) ;

-- --------------------------------------------------------

--
-- Structure for view `resumen_financiero_diario`
--
DROP TABLE IF EXISTS `resumen_financiero_diario`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `resumen_financiero_diario`  AS SELECT cast(`pg`.`fecha_pago` as date) AS `fecha`, count(distinct `pg`.`ronda_id`) AS `rondas_pagadas`, count(`pg`.`id`) AS `total_pagos`, sum(`pg`.`monto`) AS `ingresos_totales`, sum((case when (`pg`.`metodo_pago` = 'Efectivo') then `pg`.`monto` else 0 end)) AS `efectivo`, sum((case when (`pg`.`metodo_pago` = 'Nequi') then `pg`.`monto` else 0 end)) AS `nequi`, sum((case when (`pg`.`metodo_pago` = 'Daviplata') then `pg`.`monto` else 0 end)) AS `daviplata`, sum((case when (`pg`.`metodo_pago` = 'Transferencia') then `pg`.`monto` else 0 end)) AS `transferencia`, coalesce(`mesa_ingresos`.`total_mesas`,0) AS `ingresos_mesas`, count(distinct `mesa_ingresos`.`mesa_id`) AS `mesas_alquiladas` FROM (`pagos` `pg` left join (select cast(`ma`.`fecha_fin` as date) AS `fecha`,sum(`ma`.`costo_total`) AS `total_mesas`,count(distinct `ma`.`mesa_id`) AS `mesa_id` from `mesa_alquileres` `ma` where ((`ma`.`estado` = 'terminado') and (`ma`.`fecha_fin` is not null)) group by cast(`ma`.`fecha_fin` as date)) `mesa_ingresos` on((cast(`pg`.`fecha_pago` as date) = `mesa_ingresos`.`fecha`))) GROUP BY cast(`pg`.`fecha_pago` as date) ORDER BY `fecha` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `resumen_pedidos_activos`
--
DROP TABLE IF EXISTS `resumen_pedidos_activos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `resumen_pedidos_activos`  AS SELECT `p`.`id` AS `id`, `p`.`numero_pedido` AS `numero_pedido`, `p`.`nombre_cliente` AS `nombre_cliente`, `p`.`total_pedido` AS `total_pedido`, count(`r`.`id`) AS `total_rondas`, count((case when (`r`.`estado` = 'pagada') then 1 end)) AS `rondas_pagadas`, count((case when (`r`.`estado` = 'activa') then 1 end)) AS `rondas_activas`, coalesce(sum(`pg`.`monto`),0) AS `total_pagado`, (`p`.`total_pedido` - coalesce(sum(`pg`.`monto`),0)) AS `saldo_pendiente`, max(`ma`.`mesa_numero`) AS `mesa_numero`, max((case when `ma`.`mesa_activa` then 1 else 0 end)) AS `mesa_activa`, max(`ma`.`tiempo_mesa_minutos`) AS `tiempo_mesa_minutos`, max(`ma`.`costo_mesa_actual`) AS `costo_mesa_actual`, `p`.`created_at` AS `created_at` FROM (((`pedidos` `p` left join `rondas` `r` on((`p`.`id` = `r`.`pedido_id`))) left join `pagos` `pg` on((`r`.`id` = `pg`.`ronda_id`))) left join (select `ma`.`pedido_id` AS `pedido_id`,`m`.`numero_mesa` AS `mesa_numero`,(case when (`ma`.`estado` = 'activo') then true else false end) AS `mesa_activa`,`ma`.`tiempo_minutos` AS `tiempo_mesa_minutos`,`ma`.`costo_total` AS `costo_mesa_actual` from (`mesa_alquileres` `ma` join `mesas` `m` on((`ma`.`mesa_id` = `m`.`id`))) where (`ma`.`estado` in ('activo','terminado'))) `ma` on((`p`.`id` = `ma`.`pedido_id`))) WHERE (`p`.`estado` = 'activo') GROUP BY `p`.`id`, `p`.`numero_pedido`, `p`.`nombre_cliente`, `p`.`total_pedido`, `p`.`created_at` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `actividad_log`
--
ALTER TABLE `actividad_log`
  ADD CONSTRAINT `actividad_log_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `actividad_log_ibfk_2` FOREIGN KEY (`ronda_id`) REFERENCES `rondas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `actividad_log_ibfk_3` FOREIGN KEY (`mesa_alquiler_id`) REFERENCES `mesa_alquileres` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventario_movimientos`
--
ALTER TABLE `inventario_movimientos`
  ADD CONSTRAINT `inventario_movimientos_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Constraints for table `mesa_alquileres`
--
ALTER TABLE `mesa_alquileres`
  ADD CONSTRAINT `mesa_alquileres_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `mesa_alquileres_ibfk_2` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`);

--
-- Constraints for table `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`ronda_id`) REFERENCES `rondas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);

--
-- Constraints for table `producto_cambios`
--
ALTER TABLE `producto_cambios`
  ADD CONSTRAINT `producto_cambios_ibfk_1` FOREIGN KEY (`ronda_detalle_id`) REFERENCES `ronda_detalles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `producto_cambios_ibfk_2` FOREIGN KEY (`producto_original_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `producto_cambios_ibfk_3` FOREIGN KEY (`producto_nuevo_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `rondas`
--
ALTER TABLE `rondas`
  ADD CONSTRAINT `rondas_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rondas_ibfk_2` FOREIGN KEY (`ronda_origen_id`) REFERENCES `rondas` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ronda_detalles`
--
ALTER TABLE `ronda_detalles`
  ADD CONSTRAINT `ronda_detalles_ibfk_1` FOREIGN KEY (`ronda_id`) REFERENCES `rondas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ronda_detalles_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
