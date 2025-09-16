-- ================================================================
-- DATOS DE EJEMPLO PARA BARCODE TERKKOS
-- Productos típicos de bar/restaurante con inventario
-- ================================================================

USE barcode_terkkos;

-- ================================================================
-- CATEGORÍAS DE PRODUCTOS
-- ================================================================

INSERT INTO categorias (nombre, descripcion) VALUES
('Bebidas Alcohólicas', 'Cervezas, licores, vinos y cocteles'),
('Bebidas No Alcohólicas', 'Gaseosas, jugos, agua y bebidas calientes'),
('Comida Rápida', 'Hamburguesas, perros, sandwiches'),
('Aperitivos', 'Papas, nachos, alitas, piqueos'),
('Postres', 'Helados, tortas, dulces'),
('Platos Principales', 'Carnes, pollo, pescado, pasta'),
('Desayunos', 'Huevos, arepas, café, pan'),
('Otros', 'Productos varios y servicios');

-- ================================================================
-- PRODUCTOS DE INVENTARIO
-- ================================================================

-- Bebidas Alcohólicas
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('BEER001', 'Cerveza Águila 330ml', 1, 3500, 2200, 120, 20, 'unidad'),
('BEER002', 'Cerveza Club Colombia 330ml', 1, 4000, 2500, 80, 15, 'unidad'),
('BEER003', 'Cerveza Corona 355ml', 1, 5500, 3500, 60, 12, 'unidad'),
('BEER004', 'Cerveza Heineken 330ml', 1, 6000, 3800, 45, 10, 'unidad'),
('BEER005', 'Cerveza Poker 330ml', 1, 3000, 1900, 150, 25, 'unidad'),

('WINE001', 'Vino Tinto Alamos', 1, 45000, 28000, 12, 3, 'botella'),
('WINE002', 'Vino Blanco Santa Rita', 1, 38000, 24000, 8, 2, 'botella'),

('LIQU001', 'Aguardiente Antioqueño 375ml', 1, 35000, 22000, 25, 5, 'botella'),
('LIQU002', 'Ron Medellín Añejo 375ml', 1, 42000, 26000, 15, 3, 'botella'),
('LIQU003', 'Whisky Old Parr 750ml', 1, 120000, 75000, 8, 2, 'botella'),
('LIQU004', 'Vodka Smirnoff 750ml', 1, 85000, 55000, 6, 2, 'botella');

-- Bebidas No Alcohólicas
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('SODA001', 'Coca Cola 350ml', 2, 2500, 1200, 200, 30, 'unidad'),
('SODA002', 'Pepsi 350ml', 2, 2500, 1200, 180, 30, 'unidad'),
('SODA003', 'Sprite 350ml', 2, 2500, 1200, 150, 25, 'unidad'),
('SODA004', 'Fanta Naranja 350ml', 2, 2500, 1200, 120, 20, 'unidad'),
('SODA005', 'Colombiana 350ml', 2, 2800, 1400, 100, 20, 'unidad'),

('WATER001', 'Agua Cristal 600ml', 2, 2000, 800, 300, 50, 'unidad'),
('WATER002', 'Agua Manantial 600ml', 2, 1800, 700, 250, 40, 'unidad'),

('JUICE001', 'Jugo Natural Naranja', 2, 4500, 2000, 0, 0, 'vaso'),
('JUICE002', 'Jugo Natural Lulo', 2, 5000, 2200, 0, 0, 'vaso'),
('JUICE003', 'Jugo Natural Mora', 2, 5000, 2200, 0, 0, 'vaso'),

('HOT001', 'Café Americano', 2, 3000, 800, 0, 0, 'taza'),
('HOT002', 'Café con Leche', 2, 3500, 1000, 0, 0, 'taza'),
('HOT003', 'Chocolate Caliente', 2, 4000, 1500, 0, 0, 'taza'),
('HOT004', 'Aromática', 2, 2500, 600, 0, 0, 'taza');

-- Comida Rápida
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('BURG001', 'Hamburguesa Sencilla', 3, 12000, 6000, 0, 0, 'unidad'),
('BURG002', 'Hamburguesa Doble Carne', 3, 18000, 9000, 0, 0, 'unidad'),
('BURG003', 'Hamburguesa de Pollo', 3, 14000, 7000, 0, 0, 'unidad'),
('BURG004', 'Hamburguesa Vegetariana', 3, 13000, 6500, 0, 0, 'unidad'),

('HOTD001', 'Perro Sencillo', 3, 8000, 4000, 0, 0, 'unidad'),
('HOTD002', 'Perro Especial', 3, 12000, 6000, 0, 0, 'unidad'),
('HOTD003', 'Choripan', 3, 10000, 5000, 0, 0, 'unidad'),

('SAND001', 'Sandwich Mixto', 3, 9000, 4500, 0, 0, 'unidad'),
('SAND002', 'Sandwich de Pollo', 3, 11000, 5500, 0, 0, 'unidad');

-- Aperitivos
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('SNACK001', 'Papas Francesas Pequeña', 4, 4000, 1500, 0, 0, 'porción'),
('SNACK002', 'Papas Francesas Grande', 4, 7000, 2500, 0, 0, 'porción'),
('SNACK003', 'Papas Cascos', 4, 8000, 3000, 0, 0, 'porción'),
('SNACK004', 'Yuca Frita', 4, 6000, 2200, 0, 0, 'porción'),

('WING001', 'Alitas BBQ (6 unidades)', 4, 15000, 8000, 0, 0, 'porción'),
('WING002', 'Alitas Picantes (6 unidades)', 4, 15000, 8000, 0, 0, 'porción'),
('WING003', 'Alitas Búfalo (6 unidades)', 4, 16000, 8500, 0, 0, 'porción'),

('NCHO001', 'Nachos con Queso', 4, 12000, 5000, 0, 0, 'porción'),
('NCHO002', 'Nachos Especiales', 4, 18000, 8000, 0, 0, 'porción'),

('PICK001', 'Picada Personal', 4, 25000, 12000, 0, 0, 'porción'),
('PICK002', 'Picada para 2', 4, 45000, 22000, 0, 0, 'porción'),
('PICK003', 'Picada Familiar', 4, 65000, 32000, 0, 0, 'porción');

-- Postres
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('DESS001', 'Helado 1 Bola', 5, 3500, 1200, 0, 0, 'porción'),
('DESS002', 'Helado 2 Bolas', 5, 6000, 2000, 0, 0, 'porción'),
('DESS003', 'Helado 3 Bolas', 5, 8500, 3000, 0, 0, 'porción'),

('CAKE001', 'Torta Tres Leches', 5, 7000, 3000, 0, 0, 'porción'),
('CAKE002', 'Torta de Chocolate', 5, 6500, 2800, 0, 0, 'porción'),
('CAKE003', 'Cheesecake', 5, 9000, 4000, 0, 0, 'porción'),

('SWEE001', 'Brownie con Helado', 5, 8000, 3500, 0, 0, 'porción'),
('SWEE002', 'Flan de Caramelo', 5, 5000, 2200, 0, 0, 'porción');

-- Platos Principales
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('MAIN001', 'Bandeja Paisa', 6, 28000, 15000, 0, 0, 'plato'),
('MAIN002', 'Pechuga a la Plancha', 6, 22000, 12000, 0, 0, 'plato'),
('MAIN003', 'Churrasco', 6, 35000, 18000, 0, 0, 'plato'),
('MAIN004', 'Mojarra Frita', 6, 25000, 13000, 0, 0, 'plato'),
('MAIN005', 'Pasta Carbonara', 6, 18000, 9000, 0, 0, 'plato'),
('MAIN006', 'Pasta Bolognesa', 6, 16000, 8000, 0, 0, 'plato'),
('MAIN007', 'Arroz con Pollo', 6, 20000, 10000, 0, 0, 'plato');

-- Desayunos
INSERT INTO productos (codigo, nombre, categoria_id, precio_venta, precio_costo, stock_actual, stock_minimo, unidad_medida) VALUES
('BREK001', 'Huevos Pericos', 7, 8000, 3500, 0, 0, 'plato'),
('BREK002', 'Huevos al Gusto', 7, 7000, 3000, 0, 0, 'plato'),
('BREK003', 'Calentado Paisa', 7, 12000, 6000, 0, 0, 'plato'),
('BREK004', 'Arepa con Queso', 7, 5000, 2000, 0, 0, 'unidad'),
('BREK005', 'Arepa Rellena', 7, 8000, 3500, 0, 0, 'unidad'),
('BREK006', 'Tostadas Francesas', 7, 9000, 4000, 0, 0, 'porción');

-- ================================================================
-- MESAS DISPONIBLES
-- ================================================================

INSERT INTO mesas (numero_mesa, capacidad, precio_hora, descripcion) VALUES
(1, 4, 7000.00, 'Mesa 1 - Interior'),
(2, 4, 7000.00, 'Mesa 2 - Interior'), 
(3, 6, 7000.00, 'Mesa 3 - Terraza'),
(4, 4, 7000.00, 'Mesa 4 - Interior');

-- ================================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ================================================================

-- Pedido de ejemplo
INSERT INTO pedidos (numero_pedido, nombre_cliente, estado) VALUES
('PED-001', 'Cliente Ejemplo', 'activo');

-- Ronda de ejemplo
INSERT INTO rondas (pedido_id, numero_ronda, responsable, estado) VALUES
(1, 1, 'Juan\nPedro', 'activa');

-- Productos en la ronda (esto activará los triggers de inventario)
INSERT INTO ronda_detalles (ronda_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, es_descuento, es_producto_personalizado) VALUES
(1, 1, 'Cerveza Águila 330ml', 2, 3500, 7000, FALSE, FALSE),  -- 2 Cervezas Águila
(1, 21, 'Coca Cola 350ml', 1, 2500, 2500, FALSE, FALSE); -- 1 Coca Cola

-- Pago parcial de ejemplo
INSERT INTO pagos (ronda_id, persona, monto, metodo_pago, fecha_pago, es_pago_completo, division_personas, monto_por_persona) VALUES
(1, 'Juan', 5000, 'Efectivo', NOW(), FALSE, 2, 2500);

-- Mesa alquilada de ejemplo (activa)
INSERT INTO mesa_alquileres (pedido_id, mesa_id, fecha_inicio, precio_hora_aplicado, estado) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 7000, 'activo');

-- Ejemplo de producto personalizado (sin producto_id)
INSERT INTO ronda_detalles (ronda_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, es_descuento, es_producto_personalizado, notas) VALUES
(1, NULL, 'Combo especial personalizado', 1, 15000, 15000, FALSE, TRUE, 'Combo creado especialmente para el cliente');

-- Ejemplo de descuento por devolución
INSERT INTO ronda_detalles (ronda_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, es_descuento, es_producto_personalizado, notas) VALUES
(1, 1, 'DESCUENTO: Cerveza devuelta', 1, -2450, -2450, TRUE, FALSE, 'Cliente devolvió cerveza, descuento del 70%');

-- ================================================================
-- CONSULTAS ÚTILES PARA VERIFICAR
-- ================================================================

-- Ver productos con stock
-- SELECT * FROM productos WHERE stock_actual > 0;

-- Ver movimientos de inventario
-- SELECT * FROM inventario_movimientos ORDER BY created_at DESC;

-- Ver resumen de pedidos activos
-- SELECT * FROM resumen_pedidos_activos;

-- Ver productos con stock bajo
-- SELECT * FROM productos_stock_bajo;