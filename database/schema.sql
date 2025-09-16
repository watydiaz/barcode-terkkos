-- ================================================================
-- BARCODE TERKKOS - ESQUEMA DE BASE DE DATOS MYSQL
-- Sistema de gestión de pedidos con inventario y alquiler de mesas
-- ================================================================

CREATE DATABASE IF NOT EXISTS barcode_terkkos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE barcode_terkkos;

-- ================================================================
-- TABLAS DE CATÁLOGO E INVENTARIO
-- ================================================================

-- Categorías de productos
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Productos del catálogo (inventario)
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE,  -- Para códigos de barras
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_costo DECIMAL(10,2),
    stock_actual INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    unidad_medida VARCHAR(20) DEFAULT 'unidad', -- unidad, ml, gr, etc.
    activo BOOLEAN DEFAULT TRUE,
    imagen_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    INDEX idx_codigo (codigo),
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria_id),
    INDEX idx_activo (activo)
);

-- Historial de movimientos de inventario
CREATE TABLE inventario_movimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    motivo VARCHAR(200),
    referencia VARCHAR(100), -- ID del pedido, proveedor, etc.
    usuario VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    INDEX idx_producto (producto_id),
    INDEX idx_fecha (created_at),
    INDEX idx_tipo (tipo_movimiento)
);

-- ================================================================
-- TABLAS DE PEDIDOS Y RONDAS
-- ================================================================

-- Pedidos principales
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL, -- Pedido #1, #2, etc.
    nombre_cliente VARCHAR(200) NOT NULL,
    estado ENUM('activo', 'pagado', 'cancelado') DEFAULT 'activo',
    total_pedido DECIMAL(10,2) DEFAULT 0.00,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_numero (numero_pedido),
    INDEX idx_cliente (nombre_cliente),
    INDEX idx_estado (estado),
    INDEX idx_fecha (created_at)
);

-- Rondas dentro de cada pedido
CREATE TABLE rondas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    numero_ronda INT NOT NULL, -- 1, 2, 3, etc.
    total_ronda DECIMAL(10,2) DEFAULT 0.00,
    responsable TEXT, -- Múltiples nombres separados por líneas
    estado ENUM('activa', 'pagada') DEFAULT 'activa',
    es_duplicada BOOLEAN DEFAULT FALSE, -- Para identificar rondas duplicadas
    ronda_origen_id INT NULL, -- ID de la ronda original si es duplicada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (ronda_origen_id) REFERENCES rondas(id) ON DELETE SET NULL,
    UNIQUE KEY unique_pedido_ronda (pedido_id, numero_ronda),
    INDEX idx_pedido (pedido_id),
    INDEX idx_numero_ronda (numero_ronda),
    INDEX idx_estado (estado),
    INDEX idx_duplicada (es_duplicada)
);

-- Detalles de productos en cada ronda (RELACIÓN CON INVENTARIO)
CREATE TABLE ronda_detalles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ronda_id INT NOT NULL,
    producto_id INT NULL, -- Puede ser NULL para productos personalizados/descuentos
    nombre_producto VARCHAR(300) NOT NULL, -- Nombre editable del producto
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL, -- Puede ser negativo para descuentos
    subtotal DECIMAL(10,2) NOT NULL, -- Puede ser negativo para descuentos
    es_descuento BOOLEAN DEFAULT FALSE, -- Para identificar líneas de descuento/devolución
    es_producto_personalizado BOOLEAN DEFAULT FALSE, -- Para productos no del catálogo
    notas TEXT, -- Para información adicional (cambios, devoluciones, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ronda_id) REFERENCES rondas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    INDEX idx_ronda (ronda_id),
    INDEX idx_producto (producto_id),
    INDEX idx_descuento (es_descuento),
    INDEX idx_personalizado (es_producto_personalizado)
);

-- ================================================================
-- TABLAS DE PAGOS
-- ================================================================

-- Pagos realizados por ronda
CREATE TABLE pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ronda_id INT NOT NULL,
    persona VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('Efectivo', 'Nequi', 'Daviplata', 'Transferencia') NOT NULL,
    fecha_pago DATETIME NOT NULL, -- DATETIME para incluir hora exacta
    es_pago_completo BOOLEAN DEFAULT FALSE, -- Para identificar pagos de ronda completa
    division_personas INT DEFAULT 1, -- Número de personas entre las que se dividió
    monto_por_persona DECIMAL(10,2), -- Monto calculado por persona si aplica
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ronda_id) REFERENCES rondas(id) ON DELETE CASCADE,
    INDEX idx_ronda (ronda_id),
    INDEX idx_fecha (fecha_pago),
    INDEX idx_metodo (metodo_pago),
    INDEX idx_pago_completo (es_pago_completo)
);

-- ================================================================
-- TABLAS DE ALQUILER DE MESAS
-- ================================================================

-- Mesas disponibles
CREATE TABLE mesas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_mesa INT UNIQUE NOT NULL,
    capacidad INT DEFAULT 4,
    precio_hora DECIMAL(10,2) DEFAULT 7000.00,
    activa BOOLEAN DEFAULT TRUE,
    descripcion VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alquileres de mesas
CREATE TABLE mesa_alquileres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    mesa_id INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NULL,
    tiempo_minutos INT DEFAULT 0, -- Actualizado en tiempo real
    tiempo_segundos INT DEFAULT 0, -- Para cálculos más precisos
    costo_total DECIMAL(10,2) DEFAULT 0.00, -- Actualizado en tiempo real
    precio_hora_aplicado DECIMAL(10,2) NOT NULL, -- Precio por hora al momento del alquiler
    estado ENUM('activo', 'terminado', 'pausado') DEFAULT 'activo',
    contador_pausas INT DEFAULT 0, -- Número de veces que se pausó
    tiempo_pausado_minutos INT DEFAULT 0, -- Tiempo total en pausa
    notas TEXT, -- Para observaciones del alquiler
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id),
    INDEX idx_pedido (pedido_id),
    INDEX idx_mesa (mesa_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_inicio (fecha_inicio),
    INDEX idx_activo_mesa (mesa_id, estado)
);

-- ================================================================
-- TABLAS ADICIONALES PARA FUNCIONALIDADES ESPECÍFICAS
-- ================================================================

-- Historial de cambios/devoluciones de productos
CREATE TABLE producto_cambios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ronda_detalle_id INT NOT NULL,
    producto_original_id INT,
    producto_nuevo_id INT,
    nombre_producto_original VARCHAR(300),
    nombre_producto_nuevo VARCHAR(300),
    cantidad_original INT,
    cantidad_nueva INT,
    precio_original DECIMAL(10,2),
    precio_nuevo DECIMAL(10,2),
    tipo_operacion ENUM('cambio', 'devolucion', 'descuento') NOT NULL,
    monto_descuento DECIMAL(10,2) DEFAULT 0.00,
    motivo TEXT,
    usuario VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ronda_detalle_id) REFERENCES ronda_detalles(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_original_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (producto_nuevo_id) REFERENCES productos(id) ON DELETE SET NULL,
    INDEX idx_ronda_detalle (ronda_detalle_id),
    INDEX idx_tipo (tipo_operacion),
    INDEX idx_fecha (created_at)
);

-- Log de actividad para auditoría
CREATE TABLE actividad_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT,
    ronda_id INT,
    mesa_alquiler_id INT,
    tipo_actividad ENUM('crear_pedido', 'crear_ronda', 'editar_ronda', 'pago_parcial', 'pago_completo', 'alquiler_mesa', 'terminar_mesa', 'eliminar_ronda', 'duplicar_ronda') NOT NULL,
    descripcion TEXT NOT NULL,
    datos_anteriores JSON, -- Estado anterior para rollback si es necesario
    datos_nuevos JSON, -- Estado nuevo
    usuario VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (ronda_id) REFERENCES rondas(id) ON DELETE CASCADE,
    FOREIGN KEY (mesa_alquiler_id) REFERENCES mesa_alquileres(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_tipo (tipo_actividad),
    INDEX idx_fecha (created_at)
);

-- Configuración del sistema
CREATE TABLE configuracion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo_dato ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    categoria VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_categoria (categoria),
    INDEX idx_clave (clave)
);

-- ================================================================
-- TRIGGERS PARA MANTENER INVENTARIO Y TOTALES
-- ================================================================

-- Trigger para actualizar stock cuando se agrega un producto a una ronda
DELIMITER //
CREATE TRIGGER actualizar_stock_salida 
AFTER INSERT ON ronda_detalles
FOR EACH ROW
BEGIN
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
END//

-- Trigger para restaurar stock cuando se elimina un producto de una ronda
CREATE TRIGGER actualizar_stock_devolucion
AFTER DELETE ON ronda_detalles
FOR EACH ROW
BEGIN
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
                CONCAT('Devolución de ronda ID: ', OLD.ronda_id),
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
END//

-- Trigger para actualizar costos de mesa en tiempo real
CREATE TRIGGER actualizar_costo_mesa
BEFORE UPDATE ON mesa_alquileres
FOR EACH ROW
BEGIN
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
END//

-- Trigger para logging de actividades importantes
CREATE TRIGGER log_actividad_rondas
AFTER INSERT ON rondas
FOR EACH ROW
BEGIN
    INSERT INTO actividad_log (pedido_id, ronda_id, tipo_actividad, descripcion, datos_nuevos)
    VALUES (
        NEW.pedido_id,
        NEW.id,
        'crear_ronda',
        CONCAT('Nueva ronda #', NEW.numero_ronda, ' creada para pedido ID: ', NEW.pedido_id),
        JSON_OBJECT('ronda_id', NEW.id, 'numero_ronda', NEW.numero_ronda, 'total', NEW.total_ronda)
    );
END//

-- Trigger para logging de pagos
CREATE TRIGGER log_actividad_pagos
AFTER INSERT ON pagos
FOR EACH ROW
BEGIN
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
END//
DELIMITER ;

-- ================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_pedidos_estado_fecha ON pedidos(estado, created_at);
CREATE INDEX idx_rondas_pedido_estado ON rondas(pedido_id, estado);
CREATE INDEX idx_productos_categoria_activo ON productos(categoria_id, activo);
CREATE INDEX idx_stock_bajo ON productos(stock_actual, stock_minimo);

-- ================================================================
-- VISTAS ÚTILES
-- ================================================================

-- Vista de productos con stock bajo
CREATE VIEW productos_stock_bajo AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    c.nombre as categoria,
    p.stock_actual,
    p.stock_minimo,
    p.precio_venta
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = TRUE 
AND p.stock_actual <= p.stock_minimo;

-- Vista resumen de pedidos activos
CREATE VIEW resumen_pedidos_activos AS
SELECT 
    p.id,
    p.numero_pedido,
    p.nombre_cliente,
    p.total_pedido,
    COUNT(r.id) as total_rondas,
    COUNT(CASE WHEN r.estado = 'pagada' THEN 1 END) as rondas_pagadas,
    COUNT(CASE WHEN r.estado = 'activa' THEN 1 END) as rondas_activas,
    COALESCE(SUM(pg.monto), 0) as total_pagado,
    (p.total_pedido - COALESCE(SUM(pg.monto), 0)) as saldo_pendiente,
    -- Información de mesa si está alquilada
    ma.mesa_numero,
    ma.mesa_activa,
    ma.tiempo_mesa_minutos,
    ma.costo_mesa_actual,
    p.created_at
FROM pedidos p
LEFT JOIN rondas r ON p.id = r.pedido_id
LEFT JOIN pagos pg ON r.id = pg.ronda_id
LEFT JOIN (
    SELECT 
        ma.pedido_id,
        m.numero_mesa as mesa_numero,
        CASE WHEN ma.estado = 'activo' THEN TRUE ELSE FALSE END as mesa_activa,
        ma.tiempo_minutos as tiempo_mesa_minutos,
        ma.costo_total as costo_mesa_actual
    FROM mesa_alquileres ma
    JOIN mesas m ON ma.mesa_id = m.id
    WHERE ma.estado IN ('activo', 'terminado')
) ma ON p.id = ma.pedido_id
WHERE p.estado = 'activo'
GROUP BY p.id;

-- Vista de mesas ocupadas en tiempo real
CREATE VIEW mesas_estado_actual AS
SELECT 
    m.id,
    m.numero_mesa,
    m.capacidad,
    m.precio_hora,
    CASE 
        WHEN ma.id IS NOT NULL THEN 'ocupada'
        ELSE 'disponible'
    END as estado,
    ma.pedido_id,
    p.nombre_cliente,
    ma.fecha_inicio,
    ma.tiempo_minutos,
    ma.costo_total,
    TIMESTAMPDIFF(MINUTE, ma.fecha_inicio, NOW()) as minutos_reales_transcurridos
FROM mesas m
LEFT JOIN mesa_alquileres ma ON m.id = ma.mesa_id AND ma.estado = 'activo'
LEFT JOIN pedidos p ON ma.pedido_id = p.id
WHERE m.activa = TRUE
ORDER BY m.numero_mesa;

-- Vista de productos más vendidos
CREATE VIEW productos_mas_vendidos AS
SELECT 
    p.id,
    p.codigo,
    p.nombre as nombre_producto,
    c.nombre as categoria,
    COUNT(rd.id) as veces_pedido,
    SUM(rd.cantidad) as cantidad_total_vendida,
    SUM(rd.subtotal) as ingresos_totales,
    AVG(rd.precio_unitario) as precio_promedio,
    p.stock_actual,
    p.precio_venta as precio_actual
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN ronda_detalles rd ON p.id = rd.producto_id 
WHERE rd.es_descuento = FALSE 
    AND rd.es_producto_personalizado = FALSE
GROUP BY p.id
ORDER BY cantidad_total_vendida DESC;

-- Vista de resumen financiero diario
CREATE VIEW resumen_financiero_diario AS
SELECT 
    DATE(pg.fecha_pago) as fecha,
    COUNT(DISTINCT pg.ronda_id) as rondas_pagadas,
    COUNT(pg.id) as total_pagos,
    SUM(pg.monto) as ingresos_totales,
    SUM(CASE WHEN pg.metodo_pago = 'Efectivo' THEN pg.monto ELSE 0 END) as efectivo,
    SUM(CASE WHEN pg.metodo_pago = 'Nequi' THEN pg.monto ELSE 0 END) as nequi,
    SUM(CASE WHEN pg.metodo_pago = 'Daviplata' THEN pg.monto ELSE 0 END) as daviplata,
    SUM(CASE WHEN pg.metodo_pago = 'Transferencia' THEN pg.monto ELSE 0 END) as transferencia,
    -- Ingresos por alquiler de mesas
    COALESCE(mesa_ingresos.total_mesas, 0) as ingresos_mesas,
    COUNT(DISTINCT mesa_ingresos.mesa_id) as mesas_alquiladas
FROM pagos pg
LEFT JOIN (
    SELECT 
        DATE(ma.fecha_fin) as fecha,
        SUM(ma.costo_total) as total_mesas,
        COUNT(DISTINCT ma.mesa_id) as mesa_id
    FROM mesa_alquileres ma
    WHERE ma.estado = 'terminado' 
        AND ma.fecha_fin IS NOT NULL
    GROUP BY DATE(ma.fecha_fin)
) mesa_ingresos ON DATE(pg.fecha_pago) = mesa_ingresos.fecha
GROUP BY DATE(pg.fecha_pago)
ORDER BY fecha DESC;