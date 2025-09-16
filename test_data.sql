-- ================================================================
-- SCRIPT DE DATOS DE PRUEBA - Barcode Terkkos
-- Inserta datos de prueba para demostrar la funcionalidad
-- ================================================================

USE barcode_terkkos;

-- Insertar algunos productos de prueba (si no existen)
INSERT IGNORE INTO productos (codigo_barras, nombre, precio, categoria, stock) VALUES
('7701234567890', 'Cerveza Corona 355ml', 4500, 'bebidas', 100),
('7701234567891', 'Coca Cola 350ml', 3500, 'bebidas', 80),
('7701234567892', 'Papas Fritas Margarita', 2800, 'snacks', 50),
('7701234567893', 'Sandwich Mixto', 8500, 'comida', 25),
('7701234567894', 'Agua Cristal 600ml', 2200, 'bebidas', 120);

-- Insertar pedidos de prueba
INSERT INTO pedidos (numero_pedido, nombre_cliente, telefono_cliente, estado, notas, created_at) VALUES
('PED-001', 'Carlos Rodríguez', '3001234567', 'activo', 'Mesa junto a la ventana', '2024-12-28 10:30:00'),
('PED-002', 'María González', '3007654321', 'activo', 'Sin cebolla en el sandwich', '2024-12-28 11:15:00'),
('PED-003', 'Juan Pérez', '3009876543', 'activo', NULL, '2024-12-28 12:00:00');

-- Obtener IDs de los pedidos insertados
SET @pedido1 = (SELECT id FROM pedidos WHERE numero_pedido = 'PED-001');
SET @pedido2 = (SELECT id FROM pedidos WHERE numero_pedido = 'PED-002');
SET @pedido3 = (SELECT id FROM pedidos WHERE numero_pedido = 'PED-003');

-- Insertar rondas para los pedidos
INSERT INTO rondas (pedido_id, numero_ronda, productos, total, estado_pago, created_at) VALUES
(@pedido1, 1, '[{"codigo":"7701234567890","nombre":"Cerveza Corona 355ml","precio":4500,"cantidad":2}]', 9000, 'pendiente', '2024-12-28 10:35:00'),
(@pedido1, 2, '[{"codigo":"7701234567892","nombre":"Papas Fritas Margarita","precio":2800,"cantidad":1},{"codigo":"7701234567893","nombre":"Sandwich Mixto","precio":8500,"cantidad":1}]', 11300, 'pendiente', '2024-12-28 11:00:00'),
(@pedido2, 1, '[{"codigo":"7701234567891","nombre":"Coca Cola 350ml","precio":3500,"cantidad":1},{"codigo":"7701234567893","nombre":"Sandwich Mixto","precio":8500,"cantidad":1}]', 12000, 'pagada', '2024-12-28 11:20:00'),
(@pedido3, 1, '[{"codigo":"7701234567894","nombre":"Agua Cristal 600ml","precio":2200,"cantidad":2}]', 4400, 'pendiente', '2024-12-28 12:05:00');

-- Insertar pagos (algunos pedidos tienen pagos parciales)
INSERT INTO pagos (pedido_id, monto, metodo_pago, observaciones, created_at) VALUES
(@pedido1, 5000, 'efectivo', 'Pago parcial - primera ronda parcial', '2024-12-28 10:45:00'),
(@pedido2, 12000, 'tarjeta', 'Pago completo de la primera ronda', '2024-12-28 11:25:00'),
(@pedido3, 0, 'efectivo', 'Sin pagos aún', '2024-12-28 12:05:00');

-- Insertar alquiler de mesas para algunos pedidos
INSERT INTO mesa_alquileres (pedido_id, numero_mesa, hora_inicio, precio_por_hora, estado, created_at) VALUES
(@pedido1, 5, '2024-12-28 10:30:00', 8000, 'activa', '2024-12-28 10:30:00'),
(@pedido2, 3, '2024-12-28 11:15:00', 8000, 'activa', '2024-12-28 11:15:00');

-- Mostrar resumen de datos insertados
SELECT '=== RESUMEN DE DATOS DE PRUEBA INSERTADOS ===' as info;

SELECT 'PRODUCTOS:' as seccion, COUNT(*) as total FROM productos;
SELECT 'PEDIDOS ACTIVOS:' as seccion, COUNT(*) as total FROM pedidos WHERE estado = 'activo';
SELECT 'RONDAS TOTALES:' as seccion, COUNT(*) as total FROM rondas;
SELECT 'PAGOS REGISTRADOS:' as seccion, COUNT(*) as total FROM pagos WHERE monto > 0;
SELECT 'MESAS ALQUILADAS:' as seccion, COUNT(*) as total FROM mesa_alquileres WHERE estado = 'activa';

-- Mostrar vista previa de pedidos pendientes
SELECT 
    p.numero_pedido,
    p.nombre_cliente,
    COALESCE(SUM(r.total), 0) as total_pedido,
    COALESCE(SUM(CASE WHEN pg.monto IS NOT NULL THEN pg.monto ELSE 0 END), 0) as total_pagado,
    (COALESCE(SUM(r.total), 0) - COALESCE(SUM(CASE WHEN pg.monto IS NOT NULL THEN pg.monto ELSE 0 END), 0)) as saldo_pendiente,
    COUNT(DISTINCT r.id) as total_rondas,
    ma.numero_mesa
FROM pedidos p
LEFT JOIN rondas r ON p.id = r.pedido_id
LEFT JOIN pagos pg ON p.id = pg.pedido_id
LEFT JOIN mesa_alquileres ma ON p.id = ma.pedido_id AND ma.estado = 'activa'
WHERE p.estado = 'activo'
GROUP BY p.id, p.numero_pedido, p.nombre_cliente, ma.numero_mesa
ORDER BY p.created_at DESC;

COMMIT;