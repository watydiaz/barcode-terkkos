// ================================================================
// MESA-MANAGER.JS - Gestor de alquiler de mesas
// Maneja alquiler, tiempo real, cálculos automáticos y control de estados
// ================================================================

import { Utils } from '../utils/utils.js';

export class MesaManager {
  constructor(dataService, modalManager) {
    this.dataService = dataService;
    this.modalManager = modalManager;
    this.mesasDisponibles = [];
    this.configuracionMesas = null;
    this.timersActivos = new Map();
    this.intervalos = new Map();
  }

  async init() {
    await this.cargarConfiguracionMesas();
    await this.cargarMesasDisponibles();
    this.setupEvents();
    this.iniciarActualizacionTiempoReal();
    Utils.log('MesaManager inicializado');
  }

  async cargarConfiguracionMesas() {
    try {
      this.configuracionMesas = await this.dataService.getConfiguracionMesas();
      Utils.log('Configuración de mesas cargada');
    } catch (error) {
      Utils.error('Error cargando configuración de mesas', error);
      // Configuración por defecto
      this.configuracionMesas = {
        precio_hora_defecto: 10000,
        minutos_minimos: 30,
        redondeo_minutos: 15,
        descuento_hora_completa: 0.1
      };
    }
  }

  async cargarMesasDisponibles() {
    try {
      this.mesasDisponibles = await this.dataService.getMesas();
      Utils.log(`${this.mesasDisponibles.length} mesas disponibles cargadas`);
    } catch (error) {
      Utils.error('Error cargando mesas', error);
      // Mesas por defecto
      this.mesasDisponibles = Array.from({ length: 10 }, (_, i) => ({
        numero_mesa: i + 1,
        capacidad: 4,
        precio_hora: 10000,
        activa: true,
        ubicacion: i < 5 ? 'Interior' : 'Terraza'
      }));
    }
  }

  setupEvents() {
    // Escuchar eventos de pedidos
    document.addEventListener('pedido:actualizado', (e) => {
      this.actualizarMesaEnPedido(e.detail);
    });

    // Escuchar eventos de mesa terminada
    document.addEventListener('mesa:terminar', (e) => {
      this.terminarAlquilerMesa(e.detail);
    });
  }

  iniciarActualizacionTiempoReal() {
    // Actualizar cada minuto los tiempos y costos
    setInterval(() => {
      this.actualizarTodosLosTiempos();
    }, 60000); // Cada minuto

    Utils.log('Actualización en tiempo real iniciada');
  }

  // ================================================================
  // ALQUILER DE MESAS
  // ================================================================

  async alquilarMesa(pedidoId) {
    try {
      const pedido = window.pedidoManager?.getPedido(pedidoId);
      if (!pedido) {
        Utils.showError('Pedido no encontrado');
        return;
      }

      if (pedido.mesa_alquilada && pedido.mesa_alquilada.estado === 'activo') {
        Utils.showInfo('Este pedido ya tiene una mesa alquilada');
        return;
      }

      // Mostrar modal de selección de mesa
      const mesaSeleccionada = await this.mostrarModalSeleccionMesa();
      
      if (!mesaSeleccionada) return;

      // Confirmar alquiler
      const confirmacion = await Utils.confirmar(
        `¿Confirmar alquiler de Mesa ${mesaSeleccionada.numero_mesa}?\n` +
        `Capacidad: ${mesaSeleccionada.capacidad} personas\n` +
        `Precio: ${Utils.formatoCOP(mesaSeleccionada.precio_hora)}/hora\n` +
        `Cliente: ${pedido.nombre_cliente}`,
        'Confirmar Alquiler'
      );

      if (!confirmacion) return;

      // Crear registro de alquiler
      const alquiler = {
        id: Utils.generateId('mesa_alquiler'),
        pedido_id: pedidoId,
        numero_mesa: mesaSeleccionada.numero_mesa,
        capacidad: mesaSeleccionada.capacidad,
        precio_hora_aplicado: mesaSeleccionada.precio_hora,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: null,
        tiempo_minutos: 0,
        costo_total: 0,
        estado: 'activo',
        observaciones: ''
      };

      // Actualizar el pedido
      pedido.mesa_alquilada = alquiler;
      await this.dataService.savePedido(pedido);

      // Guardar registro de alquiler
      await this.dataService.saveMesaAlquiler(alquiler);

      // Log de actividad
      await this.dataService.logActividad(
        'alquilar_mesa',
        `Mesa ${mesaSeleccionada.numero_mesa} alquilada para ${pedido.nombre_cliente}`,
        {
          pedido_id: pedidoId,
          numero_mesa: mesaSeleccionada.numero_mesa,
          precio_hora: mesaSeleccionada.precio_hora
        }
      );

      // Iniciar timer para esta mesa
      this.iniciarTimerMesa(pedidoId, alquiler);

      // Actualizar UI
      this.actualizarUIMesa(pedidoId, alquiler);

      Utils.showSuccess(`Mesa ${mesaSeleccionada.numero_mesa} alquilada correctamente`);

    } catch (error) {
      Utils.error('Error alquilando mesa', error);
      Utils.showError('Error al alquilar la mesa');
    }
  }

  async mostrarModalSeleccionMesa() {
    return new Promise((resolve) => {
      const modal = this.modalManager.createModal({
        title: 'Seleccionar Mesa para Alquiler',
        size: 'lg',
        showCloseButton: true
      });

      modal.body.innerHTML = this.generarContenidoModalMesas();

      // Variables de control
      let mesaSeleccionada = null;

      // Referencias a elementos
      const listaMesas = modal.body.querySelector('#lista-mesas');
      const btnConfirmar = modal.body.querySelector('#btn-confirmar-mesa');
      const btnCancelar = modal.body.querySelector('#btn-cancelar-mesa');

      // Configurar eventos de selección
      listaMesas.addEventListener('click', (e) => {
        const mesaCard = e.target.closest('.mesa-card');
        if (!mesaCard) return;

        const numeroMesa = parseInt(mesaCard.dataset.numeroMesa);
        mesaSeleccionada = this.mesasDisponibles.find(m => m.numero_mesa === numeroMesa);

        // Actualizar selección visual
        listaMesas.querySelectorAll('.mesa-card').forEach(card => {
          card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
        });
        mesaCard.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');

        btnConfirmar.disabled = false;
      });

      btnConfirmar.addEventListener('click', () => {
        modal.close();
        resolve(mesaSeleccionada);
      });

      btnCancelar.addEventListener('click', () => {
        modal.close();
        resolve(null);
      });
    });
  }

  generarContenidoModalMesas() {
    const mesasActivas = this.mesasDisponibles.filter(m => m.activa);
    
    return `
      <div class="seleccion-mesa-content">
        <!-- Información -->
        <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold text-blue-800 mb-2">Selecciona una Mesa</h3>
          <p class="text-sm text-blue-700">
            Haz clic en una mesa para seleccionarla. El tiempo se contabilizará desde el momento de confirmación.
          </p>
          <div class="mt-2 text-xs text-blue-600">
            💡 Precio base: ${Utils.formatoCOP(this.configuracionMesas.precio_hora_defecto)}/hora
            • Tiempo mínimo: ${this.configuracionMesas.minutos_minimos} min
          </div>
        </div>

        <!-- Lista de mesas -->
        <div id="lista-mesas" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
          ${mesasActivas.map(mesa => `
            <div class="mesa-card border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
                 data-numero-mesa="${mesa.numero_mesa}">
              <div class="text-center">
                <div class="text-2xl mb-2">🪑</div>
                <div class="font-bold text-lg">Mesa ${mesa.numero_mesa}</div>
                <div class="text-sm text-gray-600 mb-2">${mesa.ubicacion}</div>
                <div class="text-xs text-gray-500 mb-2">
                  Capacidad: ${mesa.capacidad} personas
                </div>
                <div class="font-semibold text-blue-600">
                  ${Utils.formatoCOP(mesa.precio_hora)}/hora
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${mesasActivas.length === 0 ? `
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🪑</div>
            <p>No hay mesas disponibles</p>
          </div>
        ` : ''}

        <!-- Botones -->
        <div class="flex gap-3 pt-4 border-t">
          <button id="btn-cancelar-mesa" 
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold">
            Cancelar
          </button>
          <button id="btn-confirmar-mesa" 
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                  disabled>
            Alquilar Mesa Seleccionada
          </button>
        </div>
      </div>
    `;
  }

  // ================================================================
  // GESTIÓN DE TIEMPO Y CÁLCULOS
  // ================================================================

  iniciarTimerMesa(pedidoId, alquiler) {
    // Limpiar timer existente si existe
    this.detenerTimerMesa(pedidoId);

    // Crear nuevo timer
    const timer = {
      pedidoId,
      alquiler,
      startTime: new Date(),
      interval: setInterval(() => {
        this.actualizarTiempoMesa(pedidoId, alquiler);
      }, 30000) // Cada 30 segundos
    };

    this.timersActivos.set(pedidoId, timer);
    Utils.log(`Timer iniciado para mesa ${alquiler.numero_mesa} del pedido ${pedidoId}`);
  }

  detenerTimerMesa(pedidoId) {
    const timer = this.timersActivos.get(pedidoId);
    if (timer) {
      clearInterval(timer.interval);
      this.timersActivos.delete(pedidoId);
      Utils.log(`Timer detenido para pedido ${pedidoId}`);
    }
  }

  actualizarTiempoMesa(pedidoId, alquiler) {
    if (alquiler.estado !== 'activo') return;

    const ahora = new Date();
    const inicio = new Date(alquiler.fecha_inicio);
    const tiempoTranscurrido = Math.floor((ahora - inicio) / (1000 * 60)); // Minutos

    // Aplicar tiempo mínimo
    const tiempoFacturable = Math.max(tiempoTranscurrido, this.configuracionMesas.minutos_minimos);
    
    // Redondear según configuración
    const tiempoRedondeado = Math.ceil(tiempoFacturable / this.configuracionMesas.redondeo_minutos) 
                           * this.configuracionMesas.redondeo_minutos;

    // Calcular costo
    const costoActual = this.calcularCostoMesa(tiempoRedondeado, alquiler.precio_hora_aplicado);

    // Actualizar alquiler
    alquiler.tiempo_minutos = tiempoTranscurrido;
    alquiler.costo_total = costoActual;

    // Actualizar UI
    this.actualizarUITiempoReal(pedidoId, alquiler, tiempoTranscurrido, costoActual);
  }

  calcularCostoMesa(minutos, precioHora) {
    const horas = minutos / 60;
    let costo = horas * precioHora;

    // Aplicar descuento por hora completa si está configurado
    if (minutos >= 60 && this.configuracionMesas.descuento_hora_completa > 0) {
      const horasCompletas = Math.floor(minutos / 60);
      const descuento = horasCompletas * precioHora * this.configuracionMesas.descuento_hora_completa;
      costo -= descuento;
    }

    return Math.round(costo);
  }

  // ================================================================
  // TERMINAR ALQUILER
  // ================================================================

  async terminarAlquilerMesa(pedidoId) {
    try {
      const pedido = window.pedidoManager?.getPedido(pedidoId);
      if (!pedido || !pedido.mesa_alquilada || pedido.mesa_alquilada.estado !== 'activo') {
        Utils.showError('No hay mesa activa para este pedido');
        return;
      }

      const alquiler = pedido.mesa_alquilada;
      
      // Calcular tiempo y costo final
      const ahora = new Date();
      const inicio = new Date(alquiler.fecha_inicio);
      const tiempoTotal = Math.floor((ahora - inicio) / (1000 * 60));
      
      const tiempoFacturable = Math.max(tiempoTotal, this.configuracionMesas.minutos_minimos);
      const tiempoRedondeado = Math.ceil(tiempoFacturable / this.configuracionMesas.redondeo_minutos) 
                             * this.configuracionMesas.redondeo_minutos;
      const costoFinal = this.calcularCostoMesa(tiempoRedondeado, alquiler.precio_hora_aplicado);

      // Mostrar resumen y confirmación
      const confirmacion = await this.mostrarModalConfirmacionTerminar(alquiler, tiempoTotal, costoFinal);
      
      if (!confirmacion.confirmado) return;

      // Actualizar alquiler
      alquiler.fecha_fin = ahora.toISOString();
      alquiler.tiempo_minutos = tiempoTotal;
      alquiler.costo_total = costoFinal;
      alquiler.estado = 'terminado';
      alquiler.observaciones = confirmacion.observaciones || '';

      // Detener timer
      this.detenerTimerMesa(pedidoId);

      // Persistir cambios
      await this.dataService.savePedido(pedido);
      await this.dataService.saveMesaAlquiler(alquiler);

      // Log de actividad
      await this.dataService.logActividad(
        'terminar_mesa',
        `Mesa ${alquiler.numero_mesa} terminada. Tiempo: ${Utils.formatearTiempo(tiempoTotal)}, Costo: ${Utils.formatoCOP(costoFinal)}`,
        {
          pedido_id: pedidoId,
          numero_mesa: alquiler.numero_mesa,
          tiempo_minutos: tiempoTotal,
          costo_final: costoFinal
        }
      );

      // Actualizar UI
      this.actualizarUIMesa(pedidoId, alquiler);

      Utils.showSuccess(
        `Mesa ${alquiler.numero_mesa} terminada.\n` +
        `Tiempo total: ${Utils.formatearTiempo(tiempoTotal)}\n` +
        `Costo final: ${Utils.formatoCOP(costoFinal)}`
      );

      // Disparar evento
      const event = new CustomEvent('mesa:terminada', {
        detail: { pedidoId, alquiler }
      });
      document.dispatchEvent(event);

    } catch (error) {
      Utils.error('Error terminando alquiler de mesa', error);
      Utils.showError('Error al terminar el alquiler');
    }
  }

  async mostrarModalConfirmacionTerminar(alquiler, tiempoTotal, costoFinal) {
    return new Promise((resolve) => {
      const modal = this.modalManager.createModal({
        title: `Terminar Alquiler - Mesa ${alquiler.numero_mesa}`,
        size: 'md',
        showCloseButton: true
      });

      modal.body.innerHTML = `
        <div class="terminar-mesa-content">
          <!-- Resumen del alquiler -->
          <div class="bg-yellow-50 p-4 rounded-lg mb-6">
            <h3 class="font-semibold text-yellow-800 mb-3">Resumen del Alquiler</h3>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="font-medium">Mesa:</div>
                <div class="text-gray-700">Mesa ${alquiler.numero_mesa}</div>
              </div>
              <div>
                <div class="font-medium">Inicio:</div>
                <div class="text-gray-700">${Utils.formatearFecha(alquiler.fecha_inicio)}</div>
              </div>
              <div>
                <div class="font-medium">Tiempo Total:</div>
                <div class="font-mono text-lg font-bold text-blue-600">
                  ${Utils.formatearTiempo(tiempoTotal)}
                </div>
              </div>
              <div>
                <div class="font-medium">Costo Final:</div>
                <div class="font-mono text-lg font-bold text-green-600">
                  ${Utils.formatoCOP(costoFinal)}
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-yellow-200 text-xs text-yellow-700">
              💡 Precio aplicado: ${Utils.formatoCOP(alquiler.precio_hora_aplicado)}/hora
              • Tiempo mínimo: ${this.configuracionMesas.minutos_minimos} min
            </div>
          </div>

          <!-- Observaciones -->
          <div class="mb-6">
            <label for="observaciones-terminar" class="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (Opcional)
            </label>
            <textarea id="observaciones-terminar" 
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Notas sobre el alquiler, estado de la mesa, etc."></textarea>
          </div>

          <!-- Advertencia -->
          <div class="bg-red-50 p-3 rounded-lg mb-6 text-sm">
            <div class="flex items-start gap-2">
              <span class="text-red-500">⚠️</span>
              <div class="text-red-700">
                <strong>Importante:</strong> Una vez confirmado, el alquiler se marcará como terminado y el costo se agregará a la cuenta del pedido.
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex gap-3 pt-4 border-t">
            <button id="btn-cancelar-terminar" 
                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold">
              Cancelar
            </button>
            <button id="btn-confirmar-terminar" 
                    class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold">
              Terminar Alquiler
            </button>
          </div>
        </div>
      `;

      const btnConfirmar = modal.body.querySelector('#btn-confirmar-terminar');
      const btnCancelar = modal.body.querySelector('#btn-cancelar-terminar');
      const observaciones = modal.body.querySelector('#observaciones-terminar');

      btnConfirmar.addEventListener('click', () => {
        modal.close();
        resolve({
          confirmado: true,
          observaciones: observaciones.value.trim()
        });
      });

      btnCancelar.addEventListener('click', () => {
        modal.close();
        resolve({ confirmado: false });
      });
    });
  }

  // ================================================================
  // ACTUALIZACIONES DE UI
  // ================================================================

  actualizarUIMesa(pedidoId, alquiler) {
    const pedidoElement = document.getElementById(pedidoId);
    if (!pedidoElement) return;

    // Actualizar dataset del pedido
    const pedido = window.pedidoManager?.getPedido(pedidoId);
    if (pedido) {
      pedido.mesa_alquilada = alquiler;
      pedidoElement.dataset.mesaAlquilada = JSON.stringify(alquiler);
    }

    // Encontrar y actualizar el contenedor de mesa
    const mesaContainer = pedidoElement.querySelector('.mesa-alquilada');
    if (mesaContainer) {
      mesaContainer.classList.remove('hidden');
      mesaContainer.innerHTML = window.pedidoManager?.renderMesaAlquilada(alquiler) || '';
    }

    // Recalcular y actualizar total del pedido
    this.actualizarTotalPedidoConMesa(pedidoElement, pedido);

    Utils.log(`UI actualizada para mesa ${alquiler.numero_mesa} del pedido ${pedidoId}`);
  }

  actualizarUITiempoReal(pedidoId, alquiler, tiempoTranscurrido, costoActual) {
    const pedidoElement = document.getElementById(pedidoId);
    if (!pedidoElement) return;

    // Actualizar tiempo transcurrido
    const tiempoElement = pedidoElement.querySelector('.tiempo-transcurrido');
    if (tiempoElement) {
      tiempoElement.textContent = Utils.formatearTiempo(tiempoTranscurrido);
    }

    // Actualizar costo actual
    const costoElement = pedidoElement.querySelector('.costo-actual');
    if (costoElement) {
      costoElement.textContent = Utils.formatoCOP(costoActual);
    }

    // Actualizar total del pedido
    const pedido = window.pedidoManager?.getPedido(pedidoId);
    if (pedido) {
      pedido.mesa_alquilada.costo_total = costoActual;
      this.actualizarTotalPedidoConMesa(pedidoElement, pedido);
    }
  }

  actualizarTotalPedidoConMesa(pedidoElement, pedido) {
    const totalRondas = window.pedidoManager?.calcularTotalRondas(pedido.rondas || []) || 0;
    const totalMesa = pedido.mesa_alquilada?.costo_total || 0;
    const totalGeneral = totalRondas + totalMesa;

    // Actualizar píldora de total
    const totalPill = pedidoElement.querySelector('.total-pill');
    if (totalPill) {
      totalPill.textContent = Utils.formatoCOP(totalGeneral);
    }

    // Actualizar total acumulado
    const totalAcumulado = pedidoElement.querySelector('.total-acumulado');
    if (totalAcumulado) {
      totalAcumulado.innerHTML = `Total del pedido: ${Utils.formatoCOP(totalGeneral)}`;
    }
  }

  actualizarTodosLosTiempos() {
    for (const [pedidoId, timer] of this.timersActivos) {
      this.actualizarTiempoMesa(pedidoId, timer.alquiler);
    }
    
    if (this.timersActivos.size > 0) {
      Utils.log(`${this.timersActivos.size} mesas actualizadas en tiempo real`);
    }
  }

  actualizarMesaEnPedido(detalle) {
    const { pedidoId, pedido } = detalle;
    
    if (pedido.mesa_alquilada && pedido.mesa_alquilada.estado === 'activo') {
      // Asegurar que el timer esté activo
      if (!this.timersActivos.has(pedidoId)) {
        this.iniciarTimerMesa(pedidoId, pedido.mesa_alquilada);
      }
    } else {
      // Detener timer si la mesa ya no está activa
      this.detenerTimerMesa(pedidoId);
    }
  }

  // ================================================================
  // UTILIDADES Y FUNCIONES PÚBLICAS
  // ================================================================

  getMesasActivas() {
    return Array.from(this.timersActivos.keys());
  }

  getEstadoMesa(pedidoId) {
    const timer = this.timersActivos.get(pedidoId);
    if (!timer) return null;

    const tiempoTranscurrido = Math.floor((new Date() - timer.startTime) / (1000 * 60));
    const costoActual = this.calcularCostoMesa(tiempoTranscurrido, timer.alquiler.precio_hora_aplicado);

    return {
      pedidoId,
      alquiler: timer.alquiler,
      tiempo_transcurrido: tiempoTranscurrido,
      costo_actual: costoActual
    };
  }

  // Cleanup al destruir el manager
  destroy() {
    // Limpiar todos los timers
    for (const [pedidoId, timer] of this.timersActivos) {
      clearInterval(timer.interval);
    }
    this.timersActivos.clear();
    Utils.log('MesaManager destruido, timers limpiados');
  }
}

// Funciones globales para compatibilidad
window.alquilarMesa = function(element) {
  if (window.mesaManager) {
    const pedidoElement = element.closest('[data-id]');
    const pedidoId = pedidoElement?.dataset.id;
    if (pedidoId) {
      window.mesaManager.alquilarMesa(pedidoId);
    }
  }
};

window.terminarAlquilerMesa = function(element) {
  if (window.mesaManager) {
    const pedidoElement = element.closest('[data-id]');
    const pedidoId = pedidoElement?.dataset.id;
    if (pedidoId) {
      window.mesaManager.terminarAlquilerMesa(pedidoId);
    }
  }
};

window.ocultarResumenMesa = function(element) {
  const mesaContainer = element.closest('.mesa-alquilada');
  if (mesaContainer) {
    mesaContainer.classList.add('hidden');
  }
};