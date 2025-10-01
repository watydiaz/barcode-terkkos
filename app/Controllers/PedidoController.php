<?php
namespace App\Controllers;

class PedidoController {
    public function index() {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();

        $result = $conn->query("SELECT * FROM pedidos ORDER BY created_at DESC");
        $pedidos = [];
        while ($row = $result->fetch_assoc()) {
            $pedido_id = $row['id'];
            $rondas = [];
            $rondasResult = $conn->query("SELECT * FROM rondas WHERE pedido_id = $pedido_id ORDER BY numero_ronda ASC");
            while ($ronda = $rondasResult->fetch_assoc()) {
                $ronda_id = $ronda['id'];
                $productos = [];
                $prodResult = $conn->query("SELECT * FROM ronda_detalles WHERE ronda_id = $ronda_id");
                while ($prod = $prodResult->fetch_assoc()) {
                    $productos[] = $prod;
                }
                $ronda['productos'] = $productos;
                $rondas[] = $ronda;
            }
            $row['rondas'] = $rondas;
            $pedidos[] = $row;
        }
        echo json_encode($pedidos);
    }
    public function store($data) {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();

        if (!isset($data['rondas']) || !is_array($data['rondas']) || count($data['rondas']) == 0) {
            http_response_code(400);
            echo json_encode(['error' => 'El pedido debe tener al menos una ronda.']);
            exit;
        }
        $rondasValidas = array_filter($data['rondas'], function($r) {
            return isset($r['productos']) && is_array($r['productos']) && count($r['productos']) > 0;
        });
        if (count($rondasValidas) == 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Debe haber al menos una ronda con productos.']);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO pedidos (numero_pedido, nombre_cliente, estado, total_pedido, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
        $stmt->bind_param('sssd', $data['numero_pedido'], $data['nombre_cliente'], $data['estado'], $data['total_pedido']);
        $stmt->execute();
        $pedido_id = $stmt->insert_id;
        // Guardar rondas y productos
        foreach ($data['rondas'] as $ronda) {
            if (!isset($ronda['productos']) || count($ronda['productos']) == 0) continue;
            $stmtR = $conn->prepare("INSERT INTO rondas (pedido_id, numero_ronda, total_ronda, estado, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
            $stmtR->bind_param('iids', $pedido_id, $ronda['numero_ronda'], $ronda['total'] ?? 0, $ronda['estado']);
            $stmtR->execute();
            $ronda_id = $stmtR->insert_id;
            foreach ($ronda['productos'] as $prod) {
                $stmtP = $conn->prepare("INSERT INTO ronda_detalles (ronda_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, es_descuento, es_producto_personalizado, notas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                $stmtP->bind_param('iisiddiis',
                    $ronda_id,
                    $prod['producto_id'],
                    $prod['nombre_producto'],
                    $prod['cantidad'],
                    $prod['precio_unitario'],
                    $prod['subtotal'],
                    $prod['es_descuento'] ?? 0,
                    $prod['es_producto_personalizado'] ?? 0,
                    $prod['notas'] ?? null
                );
                $stmtP->execute();
            }
        }
        echo json_encode(['success' => true, 'pedido_id' => $pedido_id]);
    }
    public function update($id, $data) {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del pedido.']);
            exit;
        }
        $pedido_id = intval($id);
        $stmt = $conn->prepare("UPDATE pedidos SET nombre_cliente=?, estado=?, total_pedido=?, updated_at=NOW() WHERE id=?");
        $stmt->bind_param('ssdi', $data['nombre_cliente'], $data['estado'], $data['total_pedido'], $pedido_id);
        $stmt->execute();
        // Eliminar rondas y detalles antiguos
        $rondasResult = $conn->query("SELECT id FROM rondas WHERE pedido_id = $pedido_id");
        $rondaIds = [];
        while ($r = $rondasResult->fetch_assoc()) { $rondaIds[] = $r['id']; }
        if (count($rondaIds) > 0) {
            $conn->query("DELETE FROM ronda_detalles WHERE ronda_id IN (" . implode(',', $rondaIds) . ")");
            $conn->query("DELETE FROM rondas WHERE pedido_id = $pedido_id");
        }
        // Insertar nuevas rondas y productos
        foreach ($data['rondas'] as $ronda) {
            if (!isset($ronda['productos']) || count($ronda['productos']) == 0) continue;
            $stmtR = $conn->prepare("INSERT INTO rondas (pedido_id, numero_ronda, total_ronda, estado, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
            $stmtR->bind_param('iids', $pedido_id, $ronda['numero_ronda'], $ronda['total'] ?? 0, $ronda['estado']);
            $stmtR->execute();
            $ronda_id = $stmtR->insert_id;
            foreach ($ronda['productos'] as $prod) {
                $stmtP = $conn->prepare("INSERT INTO ronda_detalles (ronda_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal, es_descuento, es_producto_personalizado, notas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                $stmtP->bind_param('iisiddiis',
                    $ronda_id,
                    $prod['producto_id'],
                    $prod['nombre_producto'],
                    $prod['cantidad'],
                    $prod['precio_unitario'],
                    $prod['subtotal'],
                    $prod['es_descuento'] ?? 0,
                    $prod['es_producto_personalizado'] ?? 0,
                    $prod['notas'] ?? null
                );
                $stmtP->execute();
            }
        }
        echo json_encode(['success' => true]);
    }
    public function delete($id) {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del pedido.']);
            exit;
        }
        $pedido_id = intval($id);
        $rondasResult = $conn->query("SELECT id FROM rondas WHERE pedido_id = $pedido_id");
        $rondaIds = [];
        while ($r = $rondasResult->fetch_assoc()) { $rondaIds[] = $r['id']; }
        if (count($rondaIds) > 0) {
            $conn->query("DELETE FROM ronda_detalles WHERE ronda_id IN (" . implode(',', $rondaIds) . ")");
        }
        $conn->query("DELETE FROM rondas WHERE pedido_id = $pedido_id");
        $conn->query("DELETE FROM pedidos WHERE id = $pedido_id");
        echo json_encode(['success' => true]);
    }
}
