-- ================================================================
-- SCRIPT DE CONFIGURACIÓN COMPLETA - BARCODE TERKKOS
-- Ejecuta este archivo para crear toda la base de datos de una vez
-- ================================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS barcode_terkkos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE barcode_terkkos;

-- Eliminar tablas existentes si existen (para reinstalación limpia)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS mesa_alquileres;
DROP TABLE IF EXISTS mesas;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS ronda_detalles;
DROP TABLE IF EXISTS rondas;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS inventario_movimientos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;

SET FOREIGN_KEY_CHECKS = 1;

-- Ejecutar schema principal
SOURCE schema.sql;

-- Insertar datos de ejemplo
SOURCE sample_data.sql;

-- Insertar configuración inicial del sistema
INSERT INTO configuracion (clave, valor, descripcion, tipo_dato, categoria) VALUES
('precio_mesa_hora', '7000', 'Precio por hora de alquiler de mesa', 'number', 'mesas'),
('redondear_tiempo_mesa', 'true', 'Si redondear tiempo de mesa hacia arriba cada hora', 'boolean', 'mesas'),
('permitir_stock_negativo', 'false', 'Permitir vender productos con stock negativo', 'boolean', 'inventario'),
('alertar_stock_minimo', 'true', 'Mostrar alertas cuando productos lleguen al stock mínimo', 'boolean', 'inventario'),
('metodos_pago_activos', '["Efectivo", "Nequi", "Daviplata", "Transferencia"]', 'Métodos de pago disponibles en el sistema', 'json', 'pagos'),
('permitir_precios_negativos', 'true', 'Permitir precios negativos para descuentos', 'boolean', 'productos'),
('auto_eliminar_rondas_pagadas', 'true', 'Eliminar automáticamente rondas cuando se paguen completas', 'boolean', 'rondas'),
('version_sistema', '1.0.0', 'Versión actual del sistema', 'string', 'sistema');

-- Mensaje de confirmación
SELECT 
    'BASE DE DATOS CONFIGURADA CORRECTAMENTE' as STATUS,
    COUNT(*) as TOTAL_PRODUCTOS 
FROM productos;

SELECT 
    'CATEGORÍAS CREADAS' as INFO,
    COUNT(*) as TOTAL_CATEGORIAS 
FROM categorias;

SELECT 
    'MESAS DISPONIBLES' as INFO,
    COUNT(*) as TOTAL_MESAS 
FROM mesas;

-- Verificar que los triggers funcionan
SELECT 
    'TRIGGERS ACTIVOS' as INFO,
    COUNT(*) as TOTAL_TRIGGERS
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'barcode_terkkos';

-- Mostrar resumen de productos por categoría
SELECT 
    c.nombre as CATEGORIA,
    COUNT(p.id) as PRODUCTOS,
    SUM(CASE WHEN p.stock_actual > 0 THEN 1 ELSE 0 END) as CON_STOCK
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
GROUP BY c.id, c.nombre
ORDER BY c.nombre;

SHOW TABLES;