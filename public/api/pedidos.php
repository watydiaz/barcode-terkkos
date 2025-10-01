<?php

require_once __DIR__ . '/../../app/Controllers/PedidoController.php';// Proxy para redirigir a la lógica real en ../../api/pedidos.php

use App\Controllers\PedidoController;require_once __DIR__ . '/../../../api/pedidos.php';


$controller = new PedidoController();
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
