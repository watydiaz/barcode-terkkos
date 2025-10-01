<?php

require_once __DIR__ . '/../../app/Controllers/ProductoController.php';// Proxy para redirigir a la lógica real en ../../api/productos.php

use App\Controllers\ProductoController;require_once __DIR__ . '/../../../api/productos.php';


$controller = new ProductoController();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $controller->index();
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $controller->store($data);
        break;
    case 'PUT':
        $id = $_GET['id'] ?? null;
        $data = json_decode(file_get_contents('php://input'), true);
        $controller->update($id, $data);
        break;
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        $controller->delete($id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
