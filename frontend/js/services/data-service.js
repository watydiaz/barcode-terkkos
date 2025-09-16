// ================================================================
// DATA-SERVICE.JS - Servicio de datos
// Maneja toda la comunicación con el backend/localStorage
// ================================================================

export class DataService {
  constructor() {
    this.baseUrl = '/api'; // Para el futuro backend API
    this.useLocalStorage = true; // Por ahora usar localStorage, luego cambiar a false
    this.config = {};
    this.isInitialized = false;
  }

  // ================================================================
  // INICIALIZACIÓN
  // ================================================================

  async init() {
    try {
      console.log('📁 Inicializando DataService...');
      
      // Cargar configuración del sistema
      await this.loadSystemConfig();
      
      // Verificar estructura de localStorage
      this.initializeLocalStorage();
      
      this.isInitialized = true;
      console.log('✅ DataService inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando DataService:', error);
      throw error;
    }
  }

  initializeLocalStorage() {
    // Verificar y crear estructuras básicas si no existen
    const keys = ['barcode_terkkos_pedidos', 'barcode_terkkos_mesas', 'barcode_terkkos_productos'];
    
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });

    // Verificar configuración
    if (!localStorage.getItem('barcode_terkkos_config')) {
      const defaultConfig = this.getDefaultConfig();
      localStorage.setItem('barcode_terkkos_config', JSON.stringify(defaultConfig));
    }
  }

  // ================================================================
  // CONFIGURACIÓN DEL SISTEMA
  // ================================================================

  async loadSystemConfig() {
    if (this.useLocalStorage) {
      const config = localStorage.getItem('barcode_terkkos_config');
      this.config = config ? JSON.parse(config) : this.getDefaultConfig();
    } else {
      // TODO: Cargar desde API
      const response = await fetch(`${this.baseUrl}/config`);
      this.config = await response.json();
    }
    return this.config;
  }

  getDefaultConfig() {
    return {
      precio_mesa_hora: 7000,
      redondear_tiempo_mesa: true,
      permitir_stock_negativo: false,
      alertar_stock_minimo: true,
      metodos_pago_activos: ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia'],
      permitir_precios_negativos: true,
      auto_eliminar_rondas_pagadas: true,
      version_sistema: '1.0.0'
    };
  }

  async getConfiguracion() {
    if (!this.config || Object.keys(this.config).length === 0) {
      await this.loadSystemConfig();
    }
    return this.config;
  }

  async saveConfig(key, value) {
    this.config[key] = value;
    if (this.useLocalStorage) {
      localStorage.setItem('barcode_terkkos_config', JSON.stringify(this.config));
    } else {
      // TODO: Enviar al API
      await fetch(`${this.baseUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
    }
  }

  // ================================================================
  // GESTIÓN DE PEDIDOS
  // ================================================================

  async getPedidos() {
    if (this.useLocalStorage) {
      const pedidos = localStorage.getItem('barcode_terkkos_pedidos');
      return pedidos ? JSON.parse(pedidos) : [];
    } else {
      // TODO: Cargar desde API
      const response = await fetch(`${this.baseUrl}/pedidos`);
      return await response.json();
    }
  }

  async savePedido(pedido) {
    if (this.useLocalStorage) {
      const pedidos = await this.getPedidos();
      const index = pedidos.findIndex(p => p.id === pedido.id);
      
      if (index >= 0) {
        pedidos[index] = pedido;
      } else {
        pedidos.push(pedido);
      }
      
      localStorage.setItem('barcode_terkkos_pedidos', JSON.stringify(pedidos));
    } else {
      // TODO: Enviar al API
      const method = pedido.id ? 'PUT' : 'POST';
      const url = pedido.id ? `${this.baseUrl}/pedidos/${pedido.id}` : `${this.baseUrl}/pedidos`;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });
      
      return await response.json();
    }
    return pedido;
  }

  async deletePedido(pedidoId) {
    if (this.useLocalStorage) {
      const pedidos = await this.getPedidos();
      const filtered = pedidos.filter(p => p.id !== pedidoId);
      localStorage.setItem('barcode_terkkos_pedidos', JSON.stringify(filtered));
    } else {
      // TODO: Enviar al API
      await fetch(`${this.baseUrl}/pedidos/${pedidoId}`, { method: 'DELETE' });
    }
  }

  // ================================================================
  // GESTIÓN DE PRODUCTOS (CATÁLOGO)
  // ================================================================

  async getProductos(categoriaId = null) {
    if (this.useLocalStorage) {
      // Por ahora devolver productos de prueba
      return this.getProductosPrueba();
    } else {
      // TODO: Cargar desde API
      const url = categoriaId 
        ? `${this.baseUrl}/productos?categoria=${categoriaId}` 
        : `${this.baseUrl}/productos`;
      const response = await fetch(url);
      return await response.json();
    }
  }

  async getCategorias() {
    if (this.useLocalStorage) {
      return [
        { id: 1, nombre: 'Bebidas Alcohólicas' },
        { id: 2, nombre: 'Bebidas No Alcohólicas' },
        { id: 3, nombre: 'Comida Rápida' },
        { id: 4, nombre: 'Aperitivos' },
        { id: 5, nombre: 'Postres' },
        { id: 6, nombre: 'Platos Principales' },
        { id: 7, nombre: 'Desayunos' }
      ];
    } else {
      // TODO: Cargar desde API
      const response = await fetch(`${this.baseUrl}/categorias`);
      return await response.json();
    }
  }

  getProductosPrueba() {
    return [
      { id: 1, codigo: 'BEER001', nombre: 'Cerveza Águila 330ml', precio_venta: 3500, categoria_id: 1, stock_actual: 118 },
      { id: 2, codigo: 'BEER002', nombre: 'Cerveza Club Colombia 330ml', precio_venta: 4000, categoria_id: 1, stock_actual: 80 },
      { id: 21, codigo: 'SODA001', nombre: 'Coca Cola 350ml', precio_venta: 2500, categoria_id: 2, stock_actual: 0 },
      { id: 22, codigo: 'WATER001', nombre: 'Agua Cristal 600ml', precio_venta: 2000, categoria_id: 2, stock_actual: 300 },
      { id: 31, codigo: 'BURG001', nombre: 'Hamburguesa Sencilla', precio_venta: 12000, categoria_id: 3, stock_actual: 0 },
      { id: 32, codigo: 'HOTD001', nombre: 'Perro Sencillo', precio_venta: 8000, categoria_id: 3, stock_actual: 0 }
    ];
  }

  // ================================================================
  // GESTIÓN DE MESAS
  // ================================================================

  async getMesas() {
    if (this.useLocalStorage) {
      return [
        { id: 1, numero_mesa: 1, capacidad: 4, precio_hora: 7000, activa: true },
        { id: 2, numero_mesa: 2, capacidad: 4, precio_hora: 7000, activa: true },
        { id: 3, numero_mesa: 3, capacidad: 6, precio_hora: 7000, activa: true },
        { id: 4, numero_mesa: 4, capacidad: 4, precio_hora: 7000, activa: true }
      ];
    } else {
      // TODO: Cargar desde API
      const response = await fetch(`${this.baseUrl}/mesas`);
      return await response.json();
    }
  }

  async saveMesaAlquiler(alquiler) {
    if (this.useLocalStorage) {
      const alquileres = this.getMesaAlquileres();
      const index = alquileres.findIndex(a => a.id === alquiler.id);
      
      if (index >= 0) {
        alquileres[index] = alquiler;
      } else {
        alquiler.id = Date.now(); // ID temporal
        alquileres.push(alquiler);
      }
      
      localStorage.setItem('barcode_terkkos_mesa_alquileres', JSON.stringify(alquileres));
    } else {
      // TODO: Enviar al API
      const response = await fetch(`${this.baseUrl}/mesa-alquileres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alquiler)
      });
      return await response.json();
    }
    return alquiler;
  }

  getMesaAlquileres() {
    const alquileres = localStorage.getItem('barcode_terkkos_mesa_alquileres');
    return alquileres ? JSON.parse(alquileres) : [];
  }

  // ================================================================
  // UTILIDADES DE BÚSQUEDA
  // ================================================================

  async buscarProductoPorCodigo(codigo) {
    const productos = await this.getProductos();
    return productos.find(p => p.codigo === codigo);
  }

  async buscarProductosPorNombre(nombre) {
    const productos = await this.getProductos();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(nombre.toLowerCase())
    );
  }

  // ================================================================
  // REPORTES Y ESTADÍSTICAS
  // ================================================================

  async getEstadisticasVentas(fechaInicio, fechaFin) {
    // TODO: Implementar cuando tengamos backend
    return {
      total_ventas: 0,
      productos_mas_vendidos: [],
      ingresos_por_categoria: []
    };
  }

  // ================================================================
  // LOGS Y AUDITORÍA
  // ================================================================

  async logActividad(tipo, descripcion, datos = {}) {
    const logEntry = {
      id: Date.now(),
      tipo,
      descripcion,
      datos,
      timestamp: new Date().toISOString(),
      usuario: 'Sistema' // TODO: Usuario actual cuando tengamos autenticación
    };

    if (this.useLocalStorage) {
      const logs = this.getLogs();
      logs.push(logEntry);
      // Mantener solo los últimos 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      localStorage.setItem('barcode_terkkos_logs', JSON.stringify(logs));
    } else {
      // TODO: Enviar al API
      await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    }
  }

  getLogs() {
    const logs = localStorage.getItem('barcode_terkkos_logs');
    return logs ? JSON.parse(logs) : [];
  }
}