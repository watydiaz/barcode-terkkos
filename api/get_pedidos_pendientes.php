<?php
// ================================================================
// API ENDPOINT - Consultar Pedidos Pendientes
// Consulta la base de datos MySQL para obtener pedidos activos
// ================================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'barcode_terkkos';
$username = 'root';
$password = '';

try {
    // Conexión a la base de datos
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Consulta para obtener pedidos pendientes (activos)
    $query = "
        SELECT 
            p.id,
            p.numero_pedido,
            p.nombre_cliente,
            p.estado,
            p.total_pedido,
            p.notas,
            p.created_at,
            p.updated_at,
            -- Información de rondas
            COUNT(r.id) as total_rondas,
            COUNT(CASE WHEN r.estado = 'pagada' THEN 1 END) as rondas_pagadas,
            COUNT(CASE WHEN r.estado = 'activa' THEN 1 END) as rondas_activas,
            -- Información de pagos
            COALESCE(SUM(pg.monto), 0) as total_pagado,
            (p.total_pedido - COALESCE(SUM(pg.monto), 0)) as saldo_pendiente,
            -- Información de mesa si está alquilada
            m.numero_mesa,
            ma.estado as mesa_estado,
            ma.fecha_inicio as mesa_fecha_inicio,
            ma.costo_total as mesa_costo,
            -- Calcular tiempo de mesa si está activa
            CASE 
                WHEN ma.estado = 'activo' THEN 
                    TIMESTAMPDIFF(MINUTE, ma.fecha_inicio, NOW())
                ELSE ma.tiempo_minutos 
            END as tiempo_mesa_minutos
        FROM pedidos p
        LEFT JOIN rondas r ON p.id = r.pedido_id
        LEFT JOIN pagos pg ON r.id = pg.ronda_id
        LEFT JOIN mesa_alquileres ma ON p.id = ma.pedido_id
        LEFT JOIN mesas m ON ma.mesa_id = m.id
        WHERE p.estado = 'activo'
        GROUP BY p.id, p.numero_pedido, p.nombre_cliente, p.estado, 
                 p.total_pedido, p.notas, p.created_at, p.updated_at,
                 m.numero_mesa, ma.estado, ma.fecha_inicio, ma.costo_total, ma.tiempo_minutos
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear fechas y datos para mejor legibilidad
    foreach ($pedidos as &$pedido) {
        $pedido['total_pedido'] = floatval($pedido['total_pedido']);
        $pedido['total_pagado'] = floatval($pedido['total_pagado']);
        $pedido['saldo_pendiente'] = floatval($pedido['saldo_pendiente']);
        $pedido['mesa_costo'] = $pedido['mesa_costo'] ? floatval($pedido['mesa_costo']) : null;
        
        // Calcular estado del pago
        if ($pedido['saldo_pendiente'] <= 0) {
            $pedido['estado_pago'] = 'pagado_completo';
        } elseif ($pedido['total_pagado'] > 0) {
            $pedido['estado_pago'] = 'pago_parcial';
        } else {
            $pedido['estado_pago'] = 'sin_pagar';
        }
        
        // Información de mesa
        $pedido['tiene_mesa'] = !is_null($pedido['numero_mesa']);
        $pedido['mesa_activa'] = $pedido['mesa_estado'] === 'activo';
    }
    
    // Estadísticas generales
    $total_pedidos = count($pedidos);
    $total_saldo_pendiente = array_sum(array_column($pedidos, 'saldo_pendiente'));
    $total_pagado_hoy = array_sum(array_column($pedidos, 'total_pagado'));
    
    $estadisticas = [
        'total_pedidos_activos' => $total_pedidos,
        'total_saldo_pendiente' => $total_saldo_pendiente,
        'total_pagado_hoy' => $total_pagado_hoy,
        'promedio_por_pedido' => $total_pedidos > 0 ? $total_saldo_pendiente / $total_pedidos : 0,
        'mesas_activas' => array_sum(array_map(function($p) { return $p['mesa_activa'] ? 1 : 0; }, $pedidos))
    ];
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'estadisticas' => $estadisticas,
        'pedidos' => $pedidos
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Error de base de datos
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Error general
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>