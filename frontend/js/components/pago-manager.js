// ================================================================
// PAGO-MANAGER.JS - Gestor de pagos y métodos de pago
// Maneja pagos parciales, completos y múltiples métodos
// ================================================================

import { Utils } from '../utils/utils.js';

export class PagoManager {
  constructor(dataService, modalManager) {
    this.dataService = dataService;
    this.modalManager = modalManager;
    this.metodosPago = [];
    this.pagosEnProceso = new Map();
  }

  async init() {
    await this.cargarMetodosPago();
    this.setupEvents();
    Utils.log('PagoManager inicializado');
  }

  async cargarMetodosPago() {
    try {
      this.metodosPago = await this.dataService.getMetodosPago();
      Utils.log(`${this.metodosPago.length} métodos de pago cargados`);
    } catch (error) {
      Utils.error('Error cargando métodos de pago', error);
      // Métodos por defecto si falla la carga
      this.metodosPago = [
        { id: 'efectivo', nombre: 'Efectivo', activo: true, requiere_referencia: false },
        { id: 'tarjeta', nombre: 'Tarjeta', activo: true, requiere_referencia: true },
        { id: 'transferencia', nombre: 'Transferencia', activo: true, requiere_referencia: true }
      ];
    }
  }

  setupEvents() {
    // Escuchar eventos de pagos
    document.addEventListener('pago:iniciar', (e) => {
      this.iniciarPago(e.detail);
    });

    document.addEventListener('pago:confirmar', (e) => {
      this.confirmarPago(e.detail);
    });

    document.addEventListener('pago:cancelar', (e) => {
      this.cancelarPago(e.detail);
    });
  }

  // ================================================================
  // PAGO DE RONDAS INDIVIDUALES
  // ================================================================

  async pagarRonda(rondaId, pedidoId) {
    try {
      const pedidoElement = document.getElementById(pedidoId);
      if (!pedidoElement) return;

      const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
      const ronda = rondas.find(r => r.id === rondaId);
      
      if (!ronda) {
        Utils.showError('Ronda no encontrada');
        return;
      }

      const totalRonda = ronda.total || 0;
      const totalPagado = (ronda.pagos || []).reduce((sum, pago) => sum + pago.monto, 0);
      const pendiente = totalRonda - totalPagado;

      if (pendiente <= 0) {
        Utils.showInfo('Esta ronda ya está completamente pagada');
        return;
      }

      // Mostrar modal de pago
      const resultadoPago = await this.mostrarModalPago({
        tipo: 'ronda',
        titulo: `Pagar Ronda ${ronda.numero_ronda}`,
        monto_total: totalRonda,
        monto_pagado: totalPagado,
        monto_pendiente: pendiente,
        ronda_id: rondaId,
        pedido_id: pedidoId
      });

      if (resultadoPago && resultadoPago.confirmado) {
        await this.procesarPagoRonda(resultadoPago, ronda, pedidoId);
      }

    } catch (error) {
      Utils.error('Error procesando pago de ronda', error);
      Utils.showError('Error al procesar el pago');
    }
  }

  async procesarPagoRonda(datoPago, ronda, pedidoId) {
    try {
      // Crear registro de pago
      const nuevoPago = {
        id: Utils.generateId('pago'),
        ronda_id: ronda.id,
        pedido_id: pedidoId,
        metodo_pago: datoPago.metodo_seleccionado.nombre,
        monto: datoPago.monto_pagado,
        referencia: datoPago.referencia || null,
        fecha_pago: new Date().toISOString(),
        estado: 'confirmado',
        observaciones: datoPago.observaciones || ''
      };

      // Agregar pago a la ronda
      if (!ronda.pagos) ronda.pagos = [];
      ronda.pagos.push(nuevoPago);

      // Verificar si la ronda está completamente pagada
      const totalPagado = ronda.pagos.reduce((sum, pago) => sum + pago.monto, 0);
      if (totalPagado >= ronda.total) {
        ronda.estado = 'pagada';
      }

      // Persistir cambios
      await this.dataService.savePago(nuevoPago);
      await this.dataService.saveRonda(ronda, pedidoId);

      // Log de actividad
      await this.dataService.logActividad(
        'pago_ronda',
        `Pago de ${Utils.formatoCOP(nuevoPago.monto)} para ronda ${ronda.numero_ronda}`,
        { 
          pedido_id: pedidoId, 
          ronda_id: ronda.id, 
          pago_id: nuevoPago.id,
          metodo: nuevoPago.metodo_pago,
          monto: nuevoPago.monto
        }
      );

      // Actualizar UI
      this.actualizarUIDespuesDePago(pedidoId, ronda);

      // Mostrar confirmación
      Utils.showSuccess(
        `Pago de ${Utils.formatoCOP(nuevoPago.monto)} registrado correctamente` +
        (ronda.estado === 'pagada' ? '. Ronda completamente pagada.' : '')
      );

      // Disparar evento
      const event = new CustomEvent('pago:completado', {
        detail: {
          tipo: 'ronda',
          pedidoId: pedidoId,
          rondaId: ronda.id,
          pago: nuevoPago
        }
      });
      document.dispatchEvent(event);

    } catch (error) {
      Utils.error('Error guardando pago de ronda', error);
      Utils.showError('Error al guardar el pago');
    }
  }

  // ================================================================
  // PAGO COMPLETO DE PEDIDOS
  // ================================================================

  async pagarPedidoCompleto(pedidoId) {
    try {
      const pedido = window.pedidoManager?.getPedido(pedidoId);
      if (!pedido) {
        Utils.showError('Pedido no encontrado');
        return;
      }

      // Calcular totales
      const totalRondas = this.calcularTotalRondas(pedido.rondas || []);
      const totalMesa = pedido.mesa_alquilada?.costo_total || 0;
      const totalGeneral = totalRondas + totalMesa;

      const totalPagadoRondas = this.calcularTotalPagadoRondas(pedido.rondas || []);
      const pendienteTotal = totalGeneral - totalPagadoRondas;

      if (pendienteTotal <= 0) {
        Utils.showInfo('Este pedido ya está completamente pagado');
        return;
      }

      // Mostrar modal de pago completo
      const resultadoPago = await this.mostrarModalPagoCompleto({
        pedido,
        total_general: totalGeneral,
        total_pagado: totalPagadoRondas,
        total_pendiente: pendienteTotal,
        breakdown: {
          rondas: { total: totalRondas, pagado: totalPagadoRondas },
          mesa: { total: totalMesa, pagado: 0 }
        }
      });

      if (resultadoPago && resultadoPago.confirmado) {
        await this.procesarPagoCompleto(resultadoPago, pedido);
      }

    } catch (error) {
      Utils.error('Error procesando pago completo', error);
      Utils.showError('Error al procesar el pago completo');
    }
  }

  async procesarPagoCompleto(datoPago, pedido) {
    try {
      const pagosRealizados = [];

      // Procesar pagos por cada método seleccionado
      for (const metodoPago of datoPago.metodos_pago) {
        const nuevoPago = {
          id: Utils.generateId('pago'),
          pedido_id: pedido.id,
          tipo_pago: 'pedido_completo',
          metodo_pago: metodoPago.metodo.nombre,
          monto: metodoPago.monto,
          referencia: metodoPago.referencia || null,
          fecha_pago: new Date().toISOString(),
          estado: 'confirmado',
          observaciones: datoPago.observaciones || ''
        };

        pagosRealizados.push(nuevoPago);
        await this.dataService.savePago(nuevoPago);
      }

      // Marcar todas las rondas como pagadas
      if (pedido.rondas) {
        for (const ronda of pedido.rondas) {
          if (ronda.estado === 'activa') {
            ronda.estado = 'pagada';
            
            // Agregar pago proporcional si no tiene pagos previos
            const totalPagadoRonda = (ronda.pagos || []).reduce((sum, p) => sum + p.monto, 0);
            const pendienteRonda = ronda.total - totalPagadoRonda;
            
            if (pendienteRonda > 0) {
              const pagoRonda = {
                id: Utils.generateId('pago'),
                ronda_id: ronda.id,
                pedido_id: pedido.id,
                metodo_pago: 'Pago completo del pedido',
                monto: pendienteRonda,
                referencia: null,
                fecha_pago: new Date().toISOString(),
                estado: 'confirmado',
                observaciones: 'Liquidado con el pago completo del pedido'
              };

              if (!ronda.pagos) ronda.pagos = [];
              ronda.pagos.push(pagoRonda);
              await this.dataService.saveRonda(ronda, pedido.id);
            }
          }
        }
      }

      // Log de actividad
      await this.dataService.logActividad(
        'pago_completo',
        `Pago completo de ${Utils.formatoCOP(datoPago.monto_total)} para pedido ${pedido.numero_pedido}`,
        { 
          pedido_id: pedido.id,
          monto_total: datoPago.monto_total,
          metodos: pagosRealizados.map(p => ({ metodo: p.metodo_pago, monto: p.monto }))
        }
      );

      // Mostrar confirmación
      Utils.showSuccess(
        `Pago completo de ${Utils.formatoCOP(datoPago.monto_total)} registrado correctamente.\nPedido completamente liquidado.`
      );

      // Disparar evento para eliminar el pedido
      const event = new CustomEvent('pago:completado', {
        detail: {
          tipo: 'pedido_completo',
          pedidoId: pedido.id,
          pagos: pagosRealizados
        }
      });
      document.dispatchEvent(event);

    } catch (error) {
      Utils.error('Error guardando pago completo', error);
      Utils.showError('Error al guardar el pago completo');
    }
  }

  // ================================================================
  // MODALES DE PAGO
  // ================================================================

  async mostrarModalPago(configuracion) {
    return new Promise((resolve) => {
      const modal = this.modalManager.createModal({
        title: configuracion.titulo,
        size: 'lg',
        showCloseButton: true
      });

      const contenido = this.generarContenidoModalPago(configuracion);
      modal.body.innerHTML = contenido;

      // Variables de control
      let montoAPagar = configuracion.monto_pendiente;
      let metodoSeleccionado = this.metodosPago[0];

      // Referencias a elementos
      const selectMetodo = modal.body.querySelector('#metodo-pago');
      const inputMonto = modal.body.querySelector('#monto-pago');
      const inputReferencia = modal.body.querySelector('#referencia-pago');
      const contenedorReferencia = modal.body.querySelector('#contenedor-referencia');
      const btnConfirmar = modal.body.querySelector('#btn-confirmar-pago');
      const btnCancelar = modal.body.querySelector('#btn-cancelar-pago');

      // Configurar eventos
      selectMetodo.addEventListener('change', () => {
        const metodoId = selectMetodo.value;
        metodoSeleccionado = this.metodosPago.find(m => m.id === metodoId);
        
        if (metodoSeleccionado.requiere_referencia) {
          contenedorReferencia.classList.remove('hidden');
          inputReferencia.required = true;
        } else {
          contenedorReferencia.classList.add('hidden');
          inputReferencia.required = false;
          inputReferencia.value = '';
        }
      });

      inputMonto.addEventListener('input', () => {
        const monto = parseFloat(inputMonto.value) || 0;
        btnConfirmar.disabled = monto <= 0 || monto > configuracion.monto_pendiente;
      });

      btnConfirmar.addEventListener('click', () => {
        const monto = parseFloat(inputMonto.value) || 0;
        const referencia = inputReferencia.value.trim();

        if (monto <= 0) {
          Utils.showError('El monto debe ser mayor a cero');
          return;
        }

        if (monto > configuracion.monto_pendiente) {
          Utils.showError('El monto no puede ser mayor al pendiente');
          return;
        }

        if (metodoSeleccionado.requiere_referencia && !referencia) {
          Utils.showError('Este método de pago requiere una referencia');
          inputReferencia.focus();
          return;
        }

        modal.close();
        resolve({
          confirmado: true,
          monto_pagado: monto,
          metodo_seleccionado: metodoSeleccionado,
          referencia: referencia || null,
          observaciones: modal.body.querySelector('#observaciones-pago')?.value || ''
        });
      });

      btnCancelar.addEventListener('click', () => {
        modal.close();
        resolve({ confirmado: false });
      });

      // Enfocar el campo de monto
      setTimeout(() => inputMonto.focus(), 100);
    });
  }

  generarContenidoModalPago(config) {
    return `
      <div class="pago-modal-content">
        <!-- Resumen del pago -->
        <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold text-blue-800 mb-2">Resumen del Pago</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div class="text-gray-600">Total:</div>
              <div class="font-bold">${Utils.formatoCOP(config.monto_total)}</div>
            </div>
            <div>
              <div class="text-gray-600">Pagado:</div>
              <div class="font-bold text-green-600">${Utils.formatoCOP(config.monto_pagado)}</div>
            </div>
            <div>
              <div class="text-gray-600">Pendiente:</div>
              <div class="font-bold text-red-600">${Utils.formatoCOP(config.monto_pendiente)}</div>
            </div>
          </div>
        </div>

        <!-- Formulario de pago -->
        <form class="space-y-4">
          <!-- Método de pago -->
          <div>
            <label for="metodo-pago" class="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select id="metodo-pago" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${this.metodosPago.filter(m => m.activo).map(metodo => `
                <option value="${metodo.id}">${metodo.nombre}</option>
              `).join('')}
            </select>
          </div>

          <!-- Monto -->
          <div>
            <label for="monto-pago" class="block text-sm font-medium text-gray-700 mb-2">
              Monto a Pagar
            </label>
            <input type="number" 
                   id="monto-pago" 
                   class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   min="0" 
                   max="${config.monto_pendiente}"
                   step="0.01"
                   value="${config.monto_pendiente}"
                   placeholder="Ingrese el monto">
            <div class="text-xs text-gray-500 mt-1">
              Máximo: ${Utils.formatoCOP(config.monto_pendiente)}
            </div>
          </div>

          <!-- Referencia (condicional) -->
          <div id="contenedor-referencia" class="hidden">
            <label for="referencia-pago" class="block text-sm font-medium text-gray-700 mb-2">
              Referencia / Número de Transacción
            </label>
            <input type="text" 
                   id="referencia-pago" 
                   class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Ingrese la referencia">
          </div>

          <!-- Observaciones -->
          <div>
            <label for="observaciones-pago" class="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (Opcional)
            </label>
            <textarea id="observaciones-pago" 
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Notas adicionales sobre el pago"></textarea>
          </div>
        </form>

        <!-- Botones -->
        <div class="flex gap-3 mt-6 pt-4 border-t">
          <button id="btn-cancelar-pago" 
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold">
            Cancelar
          </button>
          <button id="btn-confirmar-pago" 
                  class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">
            Confirmar Pago
          </button>
        </div>
      </div>
    `;
  }

  async mostrarModalPagoCompleto(config) {
    return new Promise((resolve) => {
      const modal = this.modalManager.createModal({
        title: `Pago Completo - ${config.pedido.numero_pedido}`,
        size: 'xl',
        showCloseButton: true
      });

      modal.body.innerHTML = this.generarContenidoModalPagoCompleto(config);

      // Variables de control
      let metodosPagoSeleccionados = [];
      let montoTotal = config.total_pendiente;
      let montoAsignado = 0;

      // Referencias a elementos
      const listaMetodos = modal.body.querySelector('#lista-metodos-pago');
      const btnAgregarMetodo = modal.body.querySelector('#btn-agregar-metodo');
      const totalAsignadoSpan = modal.body.querySelector('#total-asignado');
      const pendienteSpan = modal.body.querySelector('#pendiente-asignar');
      const btnConfirmar = modal.body.querySelector('#btn-confirmar-pago-completo');
      const btnCancelar = modal.body.querySelector('#btn-cancelar-pago-completo');

      // Funciones auxiliares
      const actualizarTotales = () => {
        montoAsignado = metodosPagoSeleccionados.reduce((sum, m) => sum + m.monto, 0);
        const pendiente = montoTotal - montoAsignado;
        
        totalAsignadoSpan.textContent = Utils.formatoCOP(montoAsignado);
        pendienteSpan.textContent = Utils.formatoCOP(pendiente);
        
        btnConfirmar.disabled = Math.abs(pendiente) > 0.01; // Permitir diferencias menores por redondeo
        
        if (pendiente < -0.01) {
          pendienteSpan.classList.add('text-red-600');
          pendienteSpan.classList.remove('text-gray-700');
        } else {
          pendienteSpan.classList.remove('text-red-600');
          pendienteSpan.classList.add('text-gray-700');
        }
      };

      const agregarMetodoPago = () => {
        const pendiente = montoTotal - montoAsignado;
        if (pendiente <= 0) return;

        const metodoPago = {
          id: Utils.generateId('metodo'),
          metodo: this.metodosPago[0],
          monto: pendiente,
          referencia: ''
        };

        metodosPagoSeleccionados.push(metodoPago);
        renderizarMetodos();
        actualizarTotales();
      };

      const eliminarMetodoPago = (id) => {
        metodosPagoSeleccionados = metodosPagoSeleccionados.filter(m => m.id !== id);
        renderizarMetodos();
        actualizarTotales();
      };

      const renderizarMetodos = () => {
        listaMetodos.innerHTML = metodosPagoSeleccionados.map((metodoPago, index) => `
          <div class="metodo-pago-item border rounded-lg p-4 bg-gray-50" data-id="${metodoPago.id}">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold">Método ${index + 1}</h4>
              <button class="btn-eliminar-metodo text-red-500 hover:text-red-700" data-id="${metodoPago.id}">
                🗑️ Eliminar
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <select class="select-metodo w-full border rounded px-2 py-1" data-id="${metodoPago.id}">
                  ${this.metodosPago.filter(m => m.activo).map(m => `
                    <option value="${m.id}" ${m.id === metodoPago.metodo.id ? 'selected' : ''}>${m.nombre}</option>
                  `).join('')}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input type="number" 
                       class="input-monto w-full border rounded px-2 py-1" 
                       data-id="${metodoPago.id}"
                       value="${metodoPago.monto}" 
                       min="0" 
                       step="0.01">
              </div>
            </div>

            <div class="referencia-container mt-3 ${metodoPago.metodo.requiere_referencia ? '' : 'hidden'}">
              <label class="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
              <input type="text" 
                     class="input-referencia w-full border rounded px-2 py-1" 
                     data-id="${metodoPago.id}"
                     value="${metodoPago.referencia}"
                     placeholder="Número de referencia">
            </div>
          </div>
        `).join('');

        // Configurar eventos para los controles
        listaMetodos.querySelectorAll('.btn-eliminar-metodo').forEach(btn => {
          btn.addEventListener('click', () => eliminarMetodoPago(btn.dataset.id));
        });

        listaMetodos.querySelectorAll('.select-metodo').forEach(select => {
          select.addEventListener('change', (e) => {
            const metodoPago = metodosPagoSeleccionados.find(m => m.id === e.target.dataset.id);
            metodoPago.metodo = this.metodosPago.find(m => m.id === e.target.value);
            
            const container = e.target.closest('.metodo-pago-item');
            const refContainer = container.querySelector('.referencia-container');
            const refInput = container.querySelector('.input-referencia');
            
            if (metodoPago.metodo.requiere_referencia) {
              refContainer.classList.remove('hidden');
            } else {
              refContainer.classList.add('hidden');
              refInput.value = '';
              metodoPago.referencia = '';
            }
          });
        });

        listaMetodos.querySelectorAll('.input-monto').forEach(input => {
          input.addEventListener('input', (e) => {
            const metodoPago = metodosPagoSeleccionados.find(m => m.id === e.target.dataset.id);
            metodoPago.monto = parseFloat(e.target.value) || 0;
            actualizarTotales();
          });
        });

        listaMetodos.querySelectorAll('.input-referencia').forEach(input => {
          input.addEventListener('input', (e) => {
            const metodoPago = metodosPagoSeleccionados.find(m => m.id === e.target.dataset.id);
            metodoPago.referencia = e.target.value;
          });
        });
      };

      // Configurar eventos principales
      btnAgregarMetodo.addEventListener('click', agregarMetodoPago);

      btnConfirmar.addEventListener('click', () => {
        // Validar que todos los métodos requeridos tengan referencia
        for (const metodoPago of metodosPagoSeleccionados) {
          if (metodoPago.metodo.requiere_referencia && !metodoPago.referencia.trim()) {
            Utils.showError(`El método ${metodoPago.metodo.nombre} requiere una referencia`);
            return;
          }
        }

        modal.close();
        resolve({
          confirmado: true,
          monto_total: montoTotal,
          metodos_pago: metodosPagoSeleccionados,
          observaciones: modal.body.querySelector('#observaciones-completo')?.value || ''
        });
      });

      btnCancelar.addEventListener('click', () => {
        modal.close();
        resolve({ confirmado: false });
      });

      // Agregar un método inicial
      agregarMetodoPago();
    });
  }

  generarContenidoModalPagoCompleto(config) {
    return `
      <div class="pago-completo-modal">
        <!-- Resumen del pedido -->
        <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold text-blue-800 mb-3">Resumen del Pedido - ${config.pedido.nombre_cliente}</h3>
          
          <div class="grid grid-cols-2 gap-6">
            <!-- Desglose -->
            <div>
              <h4 class="font-medium mb-2">Desglose:</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>Rondas:</span>
                  <span>${Utils.formatoCOP(config.breakdown.rondas.total)}</span>
                </div>
                ${config.breakdown.mesa.total > 0 ? `
                  <div class="flex justify-between">
                    <span>Mesa:</span>
                    <span>${Utils.formatoCOP(config.breakdown.mesa.total)}</span>
                  </div>
                ` : ''}
                <div class="border-t pt-1 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${Utils.formatoCOP(config.total_general)}</span>
                </div>
              </div>
            </div>
            
            <!-- Estado actual -->
            <div>
              <h4 class="font-medium mb-2">Estado Actual:</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>Total a Pagar:</span>
                  <span class="font-bold">${Utils.formatoCOP(config.total_general)}</span>
                </div>
                <div class="flex justify-between text-green-600">
                  <span>Ya Pagado:</span>
                  <span>${Utils.formatoCOP(config.total_pagado)}</span>
                </div>
                <div class="border-t pt-1 flex justify-between font-semibold text-red-600">
                  <span>Pendiente:</span>
                  <span>${Utils.formatoCOP(config.total_pendiente)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Métodos de pago -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold">Métodos de Pago</h3>
            <button id="btn-agregar-metodo" 
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
              + Agregar Método
            </button>
          </div>
          
          <div id="lista-metodos-pago" class="space-y-3">
            <!-- Métodos se insertan aquí dinámicamente -->
          </div>
        </div>

        <!-- Resumen de pagos -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-sm text-gray-600">Total a Pagar</div>
              <div class="font-bold text-lg">${Utils.formatoCOP(config.total_pendiente)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Total Asignado</div>
              <div id="total-asignado" class="font-bold text-lg text-blue-600">${Utils.formatoCOP(0)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Pendiente</div>
              <div id="pendiente-asignar" class="font-bold text-lg">${Utils.formatoCOP(config.total_pendiente)}</div>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="mb-6">
          <label for="observaciones-completo" class="block text-sm font-medium text-gray-700 mb-2">
            Observaciones (Opcional)
          </label>
          <textarea id="observaciones-completo" 
                    class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Notas adicionales sobre el pago completo"></textarea>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 pt-4 border-t">
          <button id="btn-cancelar-pago-completo" 
                  class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold">
            Cancelar
          </button>
          <button id="btn-confirmar-pago-completo" 
                  class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                  disabled>
            Confirmar Pago Completo
          </button>
        </div>
      </div>
    `;
  }

  // ================================================================
  // UTILIDADES
  // ================================================================

  calcularTotalRondas(rondas) {
    return rondas.reduce((total, ronda) => total + (ronda.total || 0), 0);
  }

  calcularTotalPagadoRondas(rondas) {
    return rondas.reduce((total, ronda) => {
      const totalPagadoRonda = (ronda.pagos || []).reduce((sum, pago) => sum + pago.monto, 0);
      return total + totalPagadoRonda;
    }, 0);
  }

  actualizarUIDespuesDePago(pedidoId, ronda) {
    // Disparar evento para que RondaManager actualice la UI
    const event = new CustomEvent('ronda:actualizada', {
      detail: { pedidoId, ronda }
    });
    document.dispatchEvent(event);
  }

  // Métodos para compatibilidad con el código existente
  getMetodosPagoActivos() {
    return this.metodosPago.filter(m => m.activo);
  }

  async validarPago(metodoPago, monto, referencia) {
    if (!metodoPago || !monto || monto <= 0) {
      return { valido: false, error: 'Datos de pago incompletos' };
    }

    if (metodoPago.requiere_referencia && (!referencia || !referencia.trim())) {
      return { valido: false, error: 'Este método de pago requiere una referencia' };
    }

    return { valido: true };
  }
}

// Funciones globales para compatibilidad
window.pagarRonda = function(element, rondaId) {
  if (window.pagoManager) {
    const pedidoElement = element.closest('[data-id]');
    const pedidoId = pedidoElement?.dataset.id;
    if (pedidoId) {
      window.pagoManager.pagarRonda(rondaId, pedidoId);
    }
  }
};

window.pagarPedidoCompleto = function(element) {
  if (window.pagoManager) {
    const pedidoElement = element.closest('[data-id]');
    const pedidoId = pedidoElement?.dataset.id;
    if (pedidoId) {
      window.pagoManager.pagarPedidoCompleto(pedidoId);
    }
  }
};

window.pagoCompletoTotal = function(element) {
  // Alias para compatibilidad
  window.pagarPedidoCompleto(element);
};