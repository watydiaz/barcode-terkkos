<?php
// ================================================================
// TEST DE CONEXIÓN A BASE DE DATOS
// Verifica la conexión y muestra información básica
// ================================================================

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Test de Conexión - Barcode Terkkos</h1>";
echo "<div style='font-family: Arial, sans-serif; margin: 20px;'>";

// Configuración de la base de datos
$host = 'localhost';
$dbname = 'barcode_terkkos';
$username = 'root';
$password = '';

try {
    echo "<h2>🔗 Probando conexión a MySQL...</h2>";
    
    // Intentar conexión
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✅ <strong>Conexión exitosa!</strong></p>";
    echo "<p>📊 Base de datos: <strong>$dbname</strong></p>";
    echo "<p>🖥️ Servidor: <strong>$host</strong></p>";
    
    // Verificar tablas
    echo "<h2>📋 Verificando estructura de tablas...</h2>";
    
    $tablas = ['productos', 'pedidos', 'rondas', 'pagos', 'mesa_alquileres'];
    
    foreach ($tablas as $tabla) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM $tabla");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p>📄 Tabla <strong>$tabla</strong>: {$result['total']} registros</p>";
        } catch (Exception $e) {
            echo "<p style='color: red;'>❌ Error en tabla <strong>$tabla</strong>: " . $e->getMessage() . "</p>";
        }
    }
    
    // Probar consulta de pedidos activos
    echo "<h2>🍽️ Probando consulta de pedidos activos...</h2>";
    
    $sql = "SELECT 
                p.numero_pedido,
                p.nombre_cliente,
                p.estado,
                COUNT(DISTINCT r.id) as total_rondas,
                COALESCE(SUM(r.total), 0) as total_pedido
            FROM pedidos p
            LEFT JOIN rondas r ON p.id = r.pedido_id
            WHERE p.estado = 'activo'
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 5";
    
    $stmt = $pdo->query($sql);
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($pedidos) > 0) {
        echo "<table style='border-collapse: collapse; width: 100%; border: 1px solid #ddd;'>";
        echo "<tr style='background-color: #f2f2f2;'>";
        echo "<th style='padding: 10px; border: 1px solid #ddd;'>Número Pedido</th>";
        echo "<th style='padding: 10px; border: 1px solid #ddd;'>Cliente</th>";
        echo "<th style='padding: 10px; border: 1px solid #ddd;'>Rondas</th>";
        echo "<th style='padding: 10px; border: 1px solid #ddd;'>Total</th>";
        echo "</tr>";
        
        foreach ($pedidos as $pedido) {
            echo "<tr>";
            echo "<td style='padding: 10px; border: 1px solid #ddd;'>" . htmlspecialchars($pedido['numero_pedido']) . "</td>";
            echo "<td style='padding: 10px; border: 1px solid #ddd;'>" . htmlspecialchars($pedido['nombre_cliente']) . "</td>";
            echo "<td style='padding: 10px; border: 1px solid #ddd;'>" . $pedido['total_rondas'] . "</td>";
            echo "<td style='padding: 10px; border: 1px solid #ddd;'>$" . number_format($pedido['total_pedido']) . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        echo "<p style='color: green;'>✅ Consulta ejecutada correctamente - " . count($pedidos) . " pedidos encontrados</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ No se encontraron pedidos activos</p>";
        echo "<p>💡 <strong>Sugerencia:</strong> Ejecuta el archivo <code>test_data.sql</code> para insertar datos de prueba</p>";
    }
    
    // Información adicional
    echo "<h2>ℹ️ Información del servidor</h2>";
    echo "<p>🐘 Versión PHP: " . phpversion() . "</p>";
    echo "<p>🗄️ Driver PDO MySQL: " . (extension_loaded('pdo_mysql') ? 'Disponible' : 'No disponible') . "</p>";
    echo "<p>🕒 Zona horaria: " . date_default_timezone_get() . "</p>";
    echo "<p>📅 Fecha/Hora actual: " . date('Y-m-d H:i:s') . "</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ <strong>Error de conexión:</strong> " . $e->getMessage() . "</p>";
    echo "<h3>🔧 Posibles soluciones:</h3>";
    echo "<ul>";
    echo "<li>Verificar que MySQL esté ejecutándose</li>";
    echo "<li>Comprobar las credenciales (usuario: $username)</li>";
    echo "<li>Asegurarse de que la base de datos '$dbname' exista</li>";
    echo "<li>Verificar los permisos del usuario de la BD</li>";
    echo "</ul>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ <strong>Error general:</strong> " . $e->getMessage() . "</p>";
}

echo "</div>";

// Agregar enlaces de navegación
echo "<div style='margin: 20px; padding: 20px; background-color: #f9f9f9; border-radius: 5px;'>";
echo "<h3>🔗 Enlaces útiles:</h3>";
echo "<ul>";
echo "<li><a href='consulta_bd.html'>📊 Consulta de Pedidos Pendientes</a></li>";
echo "<li><a href='app.html'>📱 Sistema Principal</a></li>";
echo "<li><a href='api/get_pedidos_pendientes.php'>🔌 API Endpoint (JSON)</a></li>";
echo "</ul>";
echo "</div>";
?>