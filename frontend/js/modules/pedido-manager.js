// ================================================================
// PEDIDO-MANAGER.JS - Gestor principal de pedidos
// Maneja la creación, edición y eliminación de pedidos
// ================================================================

import { Utils } from '../utils/utils.js';

export class PedidoManager {
  constructor(dataService, modalManager) {
    this.dataService = dataService;
    this.modalManager = modalManager;
    this.pedidos = new Map();
    this.containerPedidos = null;
    this.nextPedidoId = 1;
  }

  async init() {
    this.containerPedidos = document.getElementById('acordeonesPedidos');
    if (!this.containerPedidos) {
      throw new Error('Contenedor de pedidos no encontrado');
    }

    await this.loadActivePedidos();
    this.setupEvents();
    
    Utils.log('PedidoManager inicializado');
  }

  setupEvents() {
    // Escuchar eventos de rondas
    document.addEventListener('ronda:guardar', (e) => {
      this.handleRondaGuardada(e.detail);
    });

    // Escuchar eventos de pagos
    document.addEventListener('pago:completado', (e) => {
      this.handlePagoCompletado(e.detail);
    });

    // Escuchar eventos de eliminación
    document.addEventListener('pedido:eliminar', (e) => {
      this.eliminarPedido(e.detail.pedidoId);
    });
  }

  // ================================================================
  // GESTIÓN DE PEDIDOS
  // ================================================================

  async loadActivePedidos() {
    try {
      const pedidosData = await this.dataService.getPedidos();
      
      pedidosData.forEach(pedidoData => {
        this.pedidos.set(pedidoData.id, pedidoData);
      });

      this.renderizarPedidos();
      Utils.log(`${pedidosData.length} pedidos cargados`);
    } catch (error) {
      Utils.error('Error cargando pedidos', error);
    }
  }

  async crearNuevoPedido() {
    try {
      const nombreCliente = await Utils.prompt(
        'Ingrese el nombre del cliente para este pedido:',
        '',
        'Nuevo Pedido'
      );
      
      if (!nombreCliente) return null;

      const sanitizedNombre = Utils.sanitizeInput(nombreCliente);
      if (!sanitizedNombre.trim()) {
        Utils.showError('El nombre del cliente es obligatorio');
        return null;
      }

      const pedidoId = this.generatePedidoId();
      const numeroPedido = `PED-${String(this.nextPedidoId).padStart(3, '0')}`;
      
      const nuevoPedido = {
        id: pedidoId,
        numero_pedido: numeroPedido,
        nombre_cliente: sanitizedNombre,
        estado: 'activo',
        total_pedido: 0,
        rondas: [],
        mesa_alquilada: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Guardar en el mapa local
      this.pedidos.set(pedidoId, nuevoPedido);
      
      // Persistir en storage/API
      await this.dataService.savePedido(nuevoPedido);
      
      // Log de actividad
      await this.dataService.logActividad(
        'crear_pedido',
        `Nuevo pedido creado: ${numeroPedido} para ${sanitizedNombre}`,
        { pedido_id: pedidoId, numero_pedido: numeroPedido }
      );

      this.nextPedidoId++;
      this.renderizarPedidos();
      
      Utils.showSuccess(`Pedido ${numeroPedido} creado para ${sanitizedNombre}`);
      
      return nuevoPedido;
    } catch (error) {
      Utils.error('Error creando pedido', error);
      Utils.showError('Error al crear el pedido');
      return null;
    }
  }

  async crearPedido(nombreCliente, pedidoId) {
    // Método programático para crear pedido (usado por tests)
    const numeroPedido = `PED-${String(this.nextPedidoId).padStart(3, '0')}`;
    
    const nuevoPedido = {
      id: pedidoId,
      numero_pedido: numeroPedido,
      nombre_cliente: nombreCliente,
      estado: 'activo',
      total_pedido: 0,
      rondas: [],
      mesa_alquilada: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.pedidos.set(pedidoId, nuevoPedido);
    await this.dataService.savePedido(nuevoPedido);
    
    this.nextPedidoId++;
    
    return nuevoPedido;
  }

  async eliminarPedido(pedidoId) {
    try {
      const pedido = this.pedidos.get(pedidoId);
      if (!pedido) return;

      const confirmar = await Utils.confirmar(
        `¿Estás seguro de eliminar el pedido ${pedido.numero_pedido} de ${pedido.nombre_cliente}?`,
        'Eliminar Pedido'
      );

      if (confirmar) {
        // Eliminar del DOM
        const elemento = document.getElementById(pedidoId);
        if (elemento) {
          elemento.style.transition = 'opacity 0.5s ease-out';
          elemento.style.opacity = '0';
          
          setTimeout(() => {
            if (elemento.parentNode) {
              elemento.parentNode.removeChild(elemento);
            }
          }, 500);
        }

        // Eliminar del mapa local
        this.pedidos.delete(pedidoId);
        
        // Eliminar del storage/API
        await this.dataService.deletePedido(pedidoId);
        
        // Log de actividad
        await this.dataService.logActividad(
          'eliminar_pedido',
          `Pedido eliminado: ${pedido.numero_pedido} de ${pedido.nombre_cliente}`,
          { pedido_id: pedidoId }
        );

        Utils.showSuccess('Pedido eliminado correctamente');
      }
    } catch (error) {
      Utils.error('Error eliminando pedido', error);
      Utils.showError('Error al eliminar el pedido');
    }
  }

  // ================================================================
  // RENDERIZADO DE PEDIDOS
  // ================================================================

  renderizarPedidos() {
    if (!this.containerPedidos) return;

    this.containerPedidos.innerHTML = '';

    for (const [pedidoId, pedido] of this.pedidos) {
      const elementoPedido = this.crearElementoPedido(pedido);
      this.containerPedidos.appendChild(elementoPedido);
    }

    Utils.log(`${this.pedidos.size} pedidos renderizados`);
  }

  crearElementoPedido(pedido) {
    const elemento = Utils.createElement('div', 'border rounded shadow');
    elemento.id = pedido.id;
    elemento.dataset.id = pedido.id;

    // Calcular totales
    const totalRondas = this.calcularTotalRondas(pedido.rondas || []);
    const totalMesa = pedido.mesa_alquilada?.costo_total || 0;
    const totalGeneral = totalRondas + totalMesa;

    elemento.innerHTML = `
      <div class="w-full flex justify-between items-center px-4 py-3 bg-gray-200 hover:bg-gray-300 cursor-pointer" 
           onclick="this.nextElementSibling.classList.toggle('hidden')">
        <span class="font-semibold">
          ${pedido.nombre_cliente} 
          <span class='text-xs text-gray-500'>(${pedido.numero_pedido})</span>
        </span>
        <div class="flex items-center gap-2">
          <button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs" 
                  onclick="event.stopPropagation(); pedidoManager.eliminarPedido('${pedido.id}')" 
                  title="Eliminar pedido">
            🗑️ Eliminar
          </button>
          <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold" 
                  onclick="event.stopPropagation(); pagoCompletoTotal(this)" 
                  title="Pagar toda la deuda">
            💰 Pago Completo
          </button>
          <span class="total-pill bg-blue-600 text-white font-bold rounded-full px-4 py-1 text-base" 
                style="min-width:120px;text-align:center;">
            ${Utils.formatoCOP(totalGeneral)}
          </span>
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
      <div class="px-4 py-3 bg-white">
        <!-- Botones de acción -->
        <div class="flex gap-2 mb-4">
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold" 
                  onclick="abrirModalRonda(this)">
            Crear ronda
          </button>
          <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold" 
                  onclick="alquilarMesa(this)">
            🪑 Alquilar Mesa
          </button>
        </div>
        
        <!-- Contenedor de rondas -->
        <div class="tabs-rondas flex gap-2 mb-4"></div>
        <div class="contenido-ronda"></div>
        
        <!-- Mesa alquilada -->
        <div class="mesa-alquilada ${pedido.mesa_alquilada ? '' : 'hidden'} bg-purple-50 p-3 rounded border mb-4">
          ${this.renderMesaAlquilada(pedido.mesa_alquilada)}
        </div>
        
        <!-- Total acumulado -->
        <div class="font-bold text-right mt-4 total-acumulado">
          Total del pedido: ${Utils.formatoCOP(totalGeneral)}
        </div>
      </div>
    `;

    // Guardar datos en el dataset para compatibilidad
    elemento.dataset.rondas = JSON.stringify(pedido.rondas || []);
    
    if (pedido.mesa_alquilada) {
      elemento.dataset.mesaAlquilada = JSON.stringify(pedido.mesa_alquilada);
    }

    return elemento;
  }

  renderMesaAlquilada(mesaData) {
    if (!mesaData) return '';

    if (mesaData.estado === 'activo') {
      const tiempoTranscurrido = Utils.calcularTiempoMesa(mesaData.fecha_inicio);
      const costoActual = Utils.calcularCostoMesa(tiempoTranscurrido, mesaData.precio_hora_aplicado);
      
      return `
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-semibold text-purple-700">🪑 Mesa ${mesaData.numero_mesa} - Alquilada</h4>
          <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" 
                  onclick="terminarAlquilerMesa(this)">
            Terminar
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="font-medium">Inicio:</div>
            <div class="text-gray-600">${Utils.formatearFecha(mesaData.fecha_inicio)}</div>
          </div>
          <div>
            <div class="font-medium">Tiempo transcurrido:</div>
            <div class="tiempo-transcurrido font-mono text-purple-700">${Utils.formatearTiempo(tiempoTranscurrido)}</div>
          </div>
          <div>
            <div class="font-medium">Costo actual:</div>
            <div class="costo-actual font-mono font-bold text-purple-700">${Utils.formatoCOP(costoActual)}</div>
          </div>
          <div>
            <div class="font-medium">Precio:</div>
            <div class="text-gray-600">${Utils.formatoCOP(mesaData.precio_hora_aplicado)}/hora</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-semibold text-gray-700">🪑 Mesa ${mesaData.numero_mesa} - Terminada</h4>
          <button class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" 
                  onclick="ocultarResumenMesa(this)">
            Ocultar
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="font-medium">Tiempo total:</div>
            <div class="font-mono text-gray-700">${Utils.formatearTiempo(mesaData.tiempo_minutos)}</div>
          </div>
          <div>
            <div class="font-medium">Costo final:</div>
            <div class="font-mono font-bold text-green-600">${Utils.formatoCOP(mesaData.costo_total)}</div>
          </div>
        </div>
        <div class="mt-3 p-2 bg-green-50 rounded text-center text-sm text-green-700">
          ✅ Alquiler completado - ${Utils.formatoCOP(mesaData.costo_total)} agregado a la cuenta
        </div>
      `;
    }
  }

  // ================================================================
  // MANEJO DE EVENTOS
  // ================================================================

  handleRondaGuardada(detalle) {
    const { acordeonId, productos, total } = detalle;
    const pedido = this.pedidos.get(acordeonId);
    
    if (!pedido) return;

    // Crear nueva ronda
    const numeroRonda = (pedido.rondas?.length || 0) + 1;
    const nuevaRonda = {
      id: Utils.generateId('ronda'),
      numero_ronda: numeroRonda,
      productos,
      total,
      responsable: '',
      pagos: [],
      estado: 'activa',
      created_at: new Date().toISOString()
    };

    // Agregar ronda al pedido
    if (!pedido.rondas) pedido.rondas = [];
    pedido.rondas.push(nuevaRonda);

    // Actualizar total del pedido
    pedido.total_pedido = this.calcularTotalRondas(pedido.rondas);
    pedido.updated_at = new Date().toISOString();

    // Persistir cambios
    this.dataService.savePedido(pedido);

    // Log de actividad
    this.dataService.logActividad(
      'crear_ronda',
      `Nueva ronda #${numeroRonda} creada en ${pedido.numero_pedido}`,
      { pedido_id: pedido.id, ronda_id: nuevaRonda.id, total }
    );

    // Actualizar DOM
    this.actualizarElementoPedido(pedido);

    Utils.log(`Ronda guardada para pedido ${pedido.id}`);
  }

  handlePagoCompletado(detalle) {
    const { pedidoId, tipo } = detalle;
    
    if (tipo === 'pedido_completo') {
      // Eliminar pedido completamente pagado
      this.eliminarPedidoCompletado(pedidoId);
    } else {
      // Actualizar pedido con pago parcial
      this.actualizarPedidoConPago(detalle);
    }
  }

  eliminarPedidoCompletado(pedidoId) {
    const elemento = document.getElementById(pedidoId);
    if (elemento) {
      elemento.style.transition = 'opacity 0.5s ease-out';
      elemento.style.opacity = '0';
      
      setTimeout(() => {
        if (elemento.parentNode) {
          elemento.parentNode.removeChild(elemento);
        }
      }, 500);
    }

    this.pedidos.delete(pedidoId);
  }

  actualizarPedidoConPago(detalle) {
    const pedido = this.pedidos.get(detalle.pedidoId);
    if (pedido) {
      // Actualizar datos del pedido
      this.dataService.savePedido(pedido);
      this.actualizarElementoPedido(pedido);
    }
  }

  actualizarElementoPedido(pedido) {
    const elemento = document.getElementById(pedido.id);
    if (!elemento) return;

    // Actualizar dataset
    elemento.dataset.rondas = JSON.stringify(pedido.rondas || []);
    
    // Actualizar total en la píldora
    const totalRondas = this.calcularTotalRondas(pedido.rondas || []);
    const totalMesa = pedido.mesa_alquilada?.costo_total || 0;
    const totalGeneral = totalRondas + totalMesa;
    
    const totalPill = elemento.querySelector('.total-pill');
    if (totalPill) {
      totalPill.textContent = Utils.formatoCOP(totalGeneral);
    }

    // Disparar evento para que RondaManager actualice las rondas
    const event = new CustomEvent('pedido:actualizado', {
      detail: { pedidoId: pedido.id, pedido }
    });
    document.dispatchEvent(event);
  }

  // ================================================================
  // UTILIDADES
  // ================================================================

  calcularTotalRondas(rondas) {
    return rondas.reduce((total, ronda) => total + (ronda.total || 0), 0);
  }

  generatePedidoId() {
    return `pedido-${this.nextPedidoId}`;
  }

  getPedidosCount() {
    return this.pedidos.size;
  }

  getPedido(pedidoId) {
    return this.pedidos.get(pedidoId);
  }

  getAllPedidos() {
    return Array.from(this.pedidos.values());
  }

  // Auto-save periódico
  async autoSave() {
    try {
      for (const [id, pedido] of this.pedidos) {
        await this.dataService.savePedido(pedido);
      }
      Utils.log('Auto-save completado');
    } catch (error) {
      Utils.error('Error en auto-save', error);
    }
  }
}

// Crear instancia global para compatibilidad
window.pedidoManager = null;