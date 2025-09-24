# BARCODE TERKKOS - Configuración de Base de Datos MySQL

## 📋 Descripción del Sistema

Sistema completo de gestión de pedidos para bar/restaurante con:
- **Inventario de productos** con códigos de barras
- **Control de stock** automático
- **Categorías de productos** 
- **Gestión de pedidos y rondas**
- **Pagos múltiples y parciales**
- **Alquiler de mesas** con tiempo
- **Histórial de movimientos**

## 🗃️ Estructura de la Base de Datos

### Tablas Principales:
- `categorias` - Categorías de productos
- `productos` - Catálogo e inventario de productos
- `inventario_movimientos` - Historial de entradas/salidas
- `pedidos` - Pedidos principales
- `rondas` - Rondas dentro de cada pedido (con duplicación)
- `ronda_detalles` - Productos específicos por ronda (editables, descuentos, personalizados)
- `pagos` - Pagos parciales y completos con división automática
- `mesas` - Mesas disponibles para alquiler
- `mesa_alquileres` - Alquileres con tiempo real y cálculo automático
- `producto_cambios` - Historial de cambios y devoluciones
- `actividad_log` - Log de auditoría de todas las acciones
- `configuracion` - Configuración del sistema

### Características Avanzadas:
- ✅ **Triggers automáticos** para control de stock y cálculos
- ✅ **Índices optimizados** para consultas rápidas  
- ✅ **Vistas útiles** para reportes en tiempo real
- ✅ **Integridad referencial** completa
- ✅ **Códigos de barras** para productos
- ✅ **Control de stock mínimo** con alertas
- ✅ **Productos editables** en tiempo real
- ✅ **Descuentos y devoluciones** con precios personalizados
- ✅ **Duplicación de rondas** completas
- ✅ **Pagos parciales** con división automática entre personas
- ✅ **Alquiler de mesas** con tiempo real y cálculo automático
- ✅ **Eliminación automática** de rondas pagadas
- ✅ **Log de auditoría** completo
- ✅ **Sistema de configuración** flexible
- ✅ **Productos personalizados** sin catálogo

## 🚀 Instalación

### 1. Prerrequisitos
- MySQL 8.0 o superior
- Cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)

### 2. Crear la Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# O usar phpMyAdmin si tienes XAMPP/WAMP
```

### 3. Ejecutar Scripts

```sql
-- 1. Crear estructura
SOURCE /ruta/a/schema.sql;

-- 2. Insertar datos de ejemplo
SOURCE /ruta/a/sample_data.sql;
```

### 4. Verificar Instalación

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Ver productos disponibles
SELECT p.nombre, c.nombre as categoria, p.stock_actual, p.precio_venta 
FROM productos p 
JOIN categorias c ON p.categoria_id = c.id 
WHERE p.activo = 1;

-- Ver resumen de pedidos
SELECT * FROM resumen_pedidos_activos;
```

## 📊 Datos de Ejemplo Incluidos

### Categorías:
- Bebidas Alcohólicas (cervezas, vinos, licores)
- Bebidas No Alcohólicas (gaseosas, jugos, café)  
- Comida Rápida (hamburguesas, perros)
- Aperitivos (papas, alitas, picadas)
- Postres (helados, tortas)
- Platos Principales (bandeja paisa, carnes)
- Desayunos (huevos, arepas)

### Productos de Ejemplo:
- **80+ productos** típicos de bar/restaurante
- **Códigos únicos** para cada producto
- **Precios de venta y costo** configurados
- **Stock inicial** para productos embotellados
- **Stock en 0** para productos preparados al momento

### Mesas:
- 4 mesas configuradas
- Capacidad y precio por hora
- Listas para alquilar

## 🔧 Configuración Avanzada

### Variables de Entorno (para backend)
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=barcode_terkkos
DB_USER=tu_usuario
DB_PASS=tu_contraseña
```

### Optimizaciones de MySQL
```sql
-- Para mejor rendimiento
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL max_connections = 100;
```

## 📈 Consultas Útiles

### Control de Inventario:
```sql
-- Productos con stock bajo
SELECT * FROM productos_stock_bajo;

-- Movimientos de inventario recientes
SELECT im.*, p.nombre 
FROM inventario_movimientos im
JOIN productos p ON im.producto_id = p.id
ORDER BY im.created_at DESC LIMIT 20;
```

### Reportes de Ventas:
```sql
-- Productos más vendidos
SELECT p.nombre, SUM(rd.cantidad) as total_vendido
FROM ronda_detalles rd
JOIN productos p ON rd.producto_id = p.id
GROUP BY p.id
ORDER BY total_vendido DESC;

-- Ventas por día
SELECT DATE(r.created_at) as fecha, SUM(r.total_ronda) as ventas_dia
FROM rondas r
GROUP BY DATE(r.created_at)
ORDER BY fecha DESC;
```

### Estado de Pedidos:
```sql
-- Resumen completo de pedidos activos
SELECT * FROM resumen_pedidos_activos;

-- Mesas ocupadas actualmente
SELECT m.numero_mesa, p.nombre_cliente, ma.fecha_inicio
FROM mesa_alquileres ma
JOIN mesas m ON ma.mesa_id = m.id  
JOIN pedidos p ON ma.pedido_id = p.id
WHERE ma.estado = 'activo';
```

## 🔄 Próximos Pasos

1. ✅ **Base de datos creada**
2. 🔄 **Crear API backend** (Node.js/Python)
3. 🔄 **Conectar frontend** existente con BD
4. 🔄 **Implementar scanner** de códigos de barras
5. 🔄 **Sistema de reportes** avanzado

## 📞 Soporte

La base de datos está diseñada para:
- ⚡ **Alto rendimiento** con índices optimizados
- 🔒 **Integridad de datos** con triggers automáticos  
- 📊 **Reportes completos** con vistas predefinidas
- 🔧 **Fácil mantenimiento** con estructura clara

¡Lista para conectar con el backend y frontend!