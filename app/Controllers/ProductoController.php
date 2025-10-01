<?php
namespace App\Controllers;

class ProductoController {
    public function index() {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();
        $sql = "SELECT id, codigo, nombre, precio_venta, stock_actual, unidad_medida, activo FROM productos WHERE activo = 1 ORDER BY nombre";
        $result = $conn->query($sql);
        $productos = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
        }
        echo json_encode($productos);
    }
    public function store($data) {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();
        $stmt = $conn->prepare("INSERT INTO productos (codigo, nombre, precio_venta, stock_actual, unidad_medida, activo) VALUES (?, ?, ?, ?, ?, 1)");
        $stmt->bind_param('ssdis', $data['codigo'], $data['nombre'], $data['precio_venta'], $data['stock_actual'], $data['unidad_medida']);
        $stmt->execute();
        $producto_id = $stmt->insert_id;
        echo json_encode(['success' => true, 'producto_id' => $producto_id]);
    }
    public function update($id, $data) {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del producto.']);
            exit;
        }
        $producto_id = intval($id);
        $stmt = $conn->prepare("UPDATE productos SET codigo=?, nombre=?, precio_venta=?, stock_actual=?, unidad_medida=?, activo=? WHERE id=?");
        $stmt->bind_param('ssdisii', $data['codigo'], $data['nombre'], $data['precio_venta'], $data['stock_actual'], $data['unidad_medida'], $data['activo'], $producto_id);
        $stmt->execute();
        echo json_encode(['success' => true]);
    }
    public function delete($id) {
        header('Content-Type: application/json; charset=utf-8');
        require_once __DIR__ . '/../../database/conn.php';
        $conn = getDbConnection();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del producto.']);
            exit;
        }
        $producto_id = intval($id);
        $stmt = $conn->prepare("DELETE FROM productos WHERE id=?");
        $stmt->bind_param('i', $producto_id);
        $stmt->execute();
        echo json_encode(['success' => true]);
    }
}
