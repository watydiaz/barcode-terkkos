// ================================================================
// RONDA-MANAGER.JS - Gestor de rondas y productos
// Maneja las pestañas de rondas, productos y edición
// ================================================================

import { Utils } from '../utils/utils.js';

export class RondaManager {
  constructor(dataService, modalManager) {
    this.dataService = dataService;
    this.modalManager = modalManager;
    this.activeTab = new Map(); // Pestaña activa por pedido
    this.editingProducts = new Map(); // Productos en edición por ronda
  }

  async init() {
    this.setupEvents();
    Utils.log('RondaManager inicializado');
  }

  setupEvents() {
    // Escuchar actualizaciones de pedidos
    document.addEventListener('pedido:actualizado', (e) => {
      this.handlePedidoActualizado(e.detail);
    });

    // Escuchar eventos de productos editados
    document.addEventListener('producto:editado', (e) => {
      this.handleProductoEditado(e.detail);
    });

    // Escuchar eventos de eliminación de productos
    document.addEventListener('producto:eliminar', (e) => {
      this.eliminarProductoDeRonda(e.detail);
    });
  }

  // ================================================================
  // RENDERIZADO DE RONDAS
  // ================================================================

  renderizarRondasEnPedido(pedidoElement, rondas) {
    const tabsContainer = pedidoElement.querySelector('.tabs-rondas');
    const contenidoContainer = pedidoElement.querySelector('.contenido-ronda');
    
    if (!tabsContainer || !contenidoContainer) return;

    const pedidoId = pedidoElement.dataset.id;

    // Limpiar contenedores
    tabsContainer.innerHTML = '';
    contenidoContainer.innerHTML = '';

    if (!rondas || rondas.length === 0) {
      contenidoContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🍽️</div>
          <p>No hay rondas creadas aún</p>
          <p class="text-sm">Haz clic en "Crear ronda" para empezar</p>
        </div>
      `;
      return;
    }

    // Crear pestañas
    rondas.forEach((ronda, index) => {
      const tab = this.crearPestanaRonda(ronda, index, pedidoId);
      tabsContainer.appendChild(tab);
    });

    // Determinar pestaña activa
    let activeTabIndex = this.activeTab.get(pedidoId) || 0;
    if (activeTabIndex >= rondas.length) {
      activeTabIndex = rondas.length - 1;
    }

    // Mostrar contenido de la pestaña activa
    this.mostrarContenidoRonda(rondas[activeTabIndex], activeTabIndex, pedidoId, contenidoContainer);
    this.activarPestana(tabsContainer, activeTabIndex);

    Utils.log(`${rondas.length} rondas renderizadas para pedido ${pedidoId}`);
  }

  crearPestanaRonda(ronda, index, pedidoId) {
    const tab = Utils.createElement('button', 'tab-ronda px-4 py-2 rounded-t border-b-2 transition-colors');
    
    const estadoClass = ronda.estado === 'pagada' ? 'bg-green-100 text-green-700 border-green-500' : 
                       ronda.estado === 'cancelada' ? 'bg-red-100 text-red-700 border-red-500' :
                       'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100';
    
    tab.className += ` ${estadoClass}`;
    
    const totalPendiente = this.calcularTotalPendienteRonda(ronda);
    const estadoIcono = ronda.estado === 'pagada' ? '✅' : 
                       ronda.estado === 'cancelada' ? '❌' : 
                       totalPendiente > 0 ? '💰' : '🍽️';

    tab.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${estadoIcono}</span>
        <span>Ronda ${ronda.numero_ronda}</span>
        ${totalPendiente > 0 ? `<span class="text-xs font-bold">(${Utils.formatoCOP(totalPendiente)})</span>` : ''}
      </div>
    `;

    tab.onclick = () => {
      this.cambiarPestanaRonda(pedidoId, index);
    };

    return tab;
  }

  mostrarContenidoRonda(ronda, index, pedidoId, container) {
    container.innerHTML = this.generarHTMLContenidoRonda(ronda, index, pedidoId);
    this.setupEventosContenidoRonda(container, ronda, pedidoId);
  }

  generarHTMLContenidoRonda(ronda, index, pedidoId) {
    const productos = ronda.productos || [];
    const pagos = ronda.pagos || [];
    const totalRonda = ronda.total || 0;
    const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const totalPendiente = totalRonda - totalPagado;

    return `
      <div class="ronda-content" data-ronda-id="${ronda.id}" data-pedido-id="${pedidoId}">
        <!-- Header de la ronda -->
        <div class="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded">
          <div>
            <h3 class="font-bold text-lg">Ronda ${ronda.numero_ronda}</h3>
            <p class="text-sm text-gray-600">
              Creada: ${Utils.formatearFecha(ronda.created_at)}
              ${ronda.responsable ? `• Responsable: ${ronda.responsable}` : ''}
            </p>
          </div>
          <div class="flex items-center gap-3">
            ${totalPendiente > 0 ? `
              <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm" 
                      onclick="pagarRonda(this, '${ronda.id}')" 
                      title="Pagar esta ronda">
                💰 Pagar Ronda
              </button>
            ` : ''}
            ${ronda.estado === 'activa' ? `
              <button class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm" 
                      onclick="editarRonda('${pedidoId}', ${index})" 
                      title="Editar productos">
                ✏️ Editar
              </button>
              <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" 
                      onclick="cancelarRonda('${pedidoId}', '${ronda.id}')" 
                      title="Cancelar ronda">
                ❌ Cancelar
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Productos de la ronda -->
        <div class="productos-ronda mb-4">
          <h4 class="font-semibold mb-3 flex items-center gap-2">
            <span>🍽️ Productos (${productos.length})</span>
            ${ronda.estado === 'activa' ? `
              <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs" 
                      onclick="agregarProductoARonda('${pedidoId}', '${ronda.id}')">
                + Agregar
              </button>
            ` : ''}
          </h4>
          
          ${productos.length === 0 ? `
            <div class="text-center py-4 text-gray-500 bg-gray-50 rounded">
              <p>No hay productos en esta ronda</p>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2 text-left">Producto</th>
                    <th class="border border-gray-300 p-2 text-center">Cant.</th>
                    <th class="border border-gray-300 p-2 text-right">P. Unit.</th>
                    <th class="border border-gray-300 p-2 text-right">Subtotal</th>
                    ${ronda.estado === 'activa' ? '<th class="border border-gray-300 p-2 text-center">Acciones</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${productos.map((producto, prodIndex) => `
                    <tr class="hover:bg-gray-50">
                      <td class="border border-gray-300 p-2">
                        <div class="font-medium">${producto.nombre}</div>
                        ${producto.codigo ? `<div class="text-xs text-gray-500">Código: ${producto.codigo}</div>` : ''}
                      </td>
                      <td class="border border-gray-300 p-2 text-center">
                        ${ronda.estado === 'activa' ? `
                          <input type="number" 
                                 class="cantidad-producto w-16 text-center border rounded px-1" 
                                 value="${producto.cantidad}" 
                                 min="1" 
                                 data-producto-index="${prodIndex}"
                                 onchange="actualizarCantidadProducto(this, '${pedidoId}', '${ronda.id}')">
                        ` : `<span class="font-mono">${producto.cantidad}</span>`}
                      </td>
                      <td class="border border-gray-300 p-2 text-right font-mono">
                        ${Utils.formatoCOP(producto.precio_unitario)}
                      </td>
                      <td class="border border-gray-300 p-2 text-right font-mono font-bold">
                        ${Utils.formatoCOP(producto.cantidad * producto.precio_unitario)}
                      </td>
                      ${ronda.estado === 'activa' ? `
                        <td class="border border-gray-300 p-2 text-center">
                          <button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs" 
                                  onclick="eliminarProductoDeRonda('${pedidoId}', '${ronda.id}', ${prodIndex})"
                                  title="Eliminar producto">
                            🗑️
                          </button>
                        </td>
                      ` : ''}
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="bg-gray-100 font-bold">
                    <td colspan="${ronda.estado === 'activa' ? '3' : '2'}" class="border border-gray-300 p-2 text-right">
                      Total Ronda:
                    </td>
                    <td class="border border-gray-300 p-2 text-right font-mono text-lg">
                      ${Utils.formatoCOP(totalRonda)}
                    </td>
                    ${ronda.estado === 'activa' ? '<td class="border border-gray-300 p-2"></td>' : ''}
                  </tr>
                </tfoot>
              </table>
            </div>
          `}
        </div>

        <!-- Resumen de pagos -->
        ${pagos.length > 0 ? `
          <div class="pagos-ronda mb-4">
            <h4 class="font-semibold mb-3">💳 Historial de Pagos</h4>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2 text-left">Fecha</th>
                    <th class="border border-gray-300 p-2 text-left">Método</th>
                    <th class="border border-gray-300 p-2 text-right">Monto</th>
                    <th class="border border-gray-300 p-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${pagos.map(pago => `
                    <tr>
                      <td class="border border-gray-300 p-2">
                        ${Utils.formatearFecha(pago.fecha_pago)}
                      </td>
                      <td class="border border-gray-300 p-2">
                        ${pago.metodo_pago}
                      </td>
                      <td class="border border-gray-300 p-2 text-right font-mono">
                        ${Utils.formatoCOP(pago.monto)}
                      </td>
                      <td class="border border-gray-300 p-2">
                        <span class="px-2 py-1 rounded text-xs ${pago.estado === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                          ${pago.estado}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Estado financiero -->
        <div class="estado-financiero p-4 rounded ${totalPendiente > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-sm text-gray-600">Total Ronda</div>
              <div class="font-bold text-lg">${Utils.formatoCOP(totalRonda)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Total Pagado</div>
              <div class="font-bold text-lg text-green-600">${Utils.formatoCOP(totalPagado)}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600">Pendiente</div>
              <div class="font-bold text-lg ${totalPendiente > 0 ? 'text-red-600' : 'text-green-600'}">
                ${Utils.formatoCOP(totalPendiente)}
              </div>
            </div>
          </div>
          
          ${totalPendiente <= 0 ? `
            <div class="text-center mt-3 p-2 bg-green-100 rounded text-green-700">
              ✅ Ronda completamente pagada
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  setupEventosContenidoRonda(container, ronda, pedidoId) {
    // Los eventos se manejan a través de onclick en el HTML por compatibilidad
    // Aquí se pueden agregar listeners adicionales si es necesario
    
    const cantidadInputs = container.querySelectorAll('.cantidad-producto');
    cantidadInputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          input.blur();
          this.actualizarCantidadProducto(input, pedidoId, ronda.id);
        }
      });
    });
  }

  // ================================================================
  // NAVEGACIÓN DE PESTAÑAS
  // ================================================================

  cambiarPestanaRonda(pedidoId, tabIndex) {
    const pedidoElement = document.getElementById(pedidoId);
    if (!pedidoElement) return;

    const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
    if (tabIndex < 0 || tabIndex >= rondas.length) return;

    // Actualizar pestaña activa
    this.activeTab.set(pedidoId, tabIndex);

    // Actualizar UI
    const tabsContainer = pedidoElement.querySelector('.tabs-rondas');
    const contenidoContainer = pedidoElement.querySelector('.contenido-ronda');
    
    this.activarPestana(tabsContainer, tabIndex);
    this.mostrarContenidoRonda(rondas[tabIndex], tabIndex, pedidoId, contenidoContainer);

    Utils.log(`Pestaña ${tabIndex} activada para pedido ${pedidoId}`);
  }

  activarPestana(tabsContainer, activeIndex) {
    const tabs = tabsContainer.querySelectorAll('.tab-ronda');
    tabs.forEach((tab, index) => {
      if (index === activeIndex) {
        tab.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
        tab.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-blue-100');
      } else {
        tab.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
        // Mantener clases de estado si existen
        if (!tab.classList.contains('bg-green-100') && !tab.classList.contains('bg-red-100')) {
          tab.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-blue-100');
        }
      }
    });
  }

  // ================================================================
  // EDICIÓN DE PRODUCTOS
  // ================================================================

  async actualizarCantidadProducto(input, pedidoId, rondaId) {
    const nuevaCantidad = parseInt(input.value);
    const productoIndex = parseInt(input.dataset.productoIndex);

    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      Utils.showError('La cantidad debe ser un número mayor a 0');
      input.focus();
      return;
    }

    try {
      // Obtener datos actuales
      const pedidoElement = document.getElementById(pedidoId);
      const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
      const ronda = rondas.find(r => r.id === rondaId);
      
      if (!ronda || !ronda.productos[productoIndex]) return;

      // Actualizar cantidad
      ronda.productos[productoIndex].cantidad = nuevaCantidad;
      
      // Recalcular total de la ronda
      ronda.total = ronda.productos.reduce((total, producto) => {
        return total + (producto.cantidad * producto.precio_unitario);
      }, 0);

      // Actualizar dataset
      pedidoElement.dataset.rondas = JSON.stringify(rondas);

      // Persistir cambios
      await this.guardarCambiosRonda(pedidoId, ronda);

      // Actualizar UI
      this.actualizarVisualizacionRonda(pedidoId, ronda);

      Utils.showSuccess('Cantidad actualizada');
    } catch (error) {
      Utils.error('Error actualizando cantidad', error);
      Utils.showError('Error al actualizar la cantidad');
    }
  }

  async eliminarProductoDeRonda(pedidoId, rondaId, productoIndex) {
    try {
      const confirmar = await Utils.confirmar(
        '¿Estás seguro de eliminar este producto de la ronda?',
        'Eliminar Producto'
      );

      if (!confirmar) return;

      // Obtener datos actuales
      const pedidoElement = document.getElementById(pedidoId);
      const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
      const ronda = rondas.find(r => r.id === rondaId);
      
      if (!ronda || !ronda.productos[productoIndex]) return;

      // Eliminar producto
      const productoEliminado = ronda.productos.splice(productoIndex, 1)[0];
      
      // Recalcular total
      ronda.total = ronda.productos.reduce((total, producto) => {
        return total + (producto.cantidad * producto.precio_unitario);
      }, 0);

      // Actualizar dataset
      pedidoElement.dataset.rondas = JSON.stringify(rondas);

      // Persistir cambios
      await this.guardarCambiosRonda(pedidoId, ronda);

      // Actualizar UI
      this.actualizarVisualizacionRonda(pedidoId, ronda);

      Utils.showSuccess(`Producto "${productoEliminado.nombre}" eliminado de la ronda`);
    } catch (error) {
      Utils.error('Error eliminando producto', error);
      Utils.showError('Error al eliminar el producto');
    }
  }

  async agregarProductoARonda(pedidoId, rondaId) {
    try {
      // Abrir modal de catálogo para seleccionar producto
      const producto = await this.modalManager.mostrarCatalogo();
      
      if (!producto) return;

      // Solicitar cantidad
      const cantidad = await Utils.prompt(
        `¿Cuántas unidades de "${producto.nombre}" deseas agregar?`,
        '1',
        'Cantidad'
      );

      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum < 1) {
        Utils.showError('Cantidad inválida');
        return;
      }

      // Obtener datos actuales
      const pedidoElement = document.getElementById(pedidoId);
      const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
      const ronda = rondas.find(r => r.id === rondaId);
      
      if (!ronda) return;

      // Verificar si el producto ya existe en la ronda
      const productoExistente = ronda.productos.find(p => p.codigo === producto.codigo);
      
      if (productoExistente) {
        // Agregar a la cantidad existente
        productoExistente.cantidad += cantidadNum;
      } else {
        // Agregar nuevo producto
        ronda.productos.push({
          codigo: producto.codigo,
          nombre: producto.nombre,
          precio_unitario: producto.precio,
          cantidad: cantidadNum
        });
      }

      // Recalcular total
      ronda.total = ronda.productos.reduce((total, prod) => {
        return total + (prod.cantidad * prod.precio_unitario);
      }, 0);

      // Actualizar dataset
      pedidoElement.dataset.rondas = JSON.stringify(rondas);

      // Persistir cambios
      await this.guardarCambiosRonda(pedidoId, ronda);

      // Actualizar UI
      this.actualizarVisualizacionRonda(pedidoId, ronda);

      Utils.showSuccess(`"${producto.nombre}" agregado a la ronda`);
    } catch (error) {
      Utils.error('Error agregando producto', error);
      Utils.showError('Error al agregar el producto');
    }
  }

  // ================================================================
  // GESTIÓN DE ESTADOS
  // ================================================================

  async cancelarRonda(pedidoId, rondaId) {
    try {
      const confirmar = await Utils.confirmar(
        '¿Estás seguro de cancelar esta ronda?\nEsta acción no se puede deshacer.',
        'Cancelar Ronda'
      );

      if (!confirmar) return;

      // Obtener datos actuales
      const pedidoElement = document.getElementById(pedidoId);
      const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
      const ronda = rondas.find(r => r.id === rondaId);
      
      if (!ronda) return;

      // Cambiar estado
      ronda.estado = 'cancelada';
      ronda.updated_at = new Date().toISOString();

      // Actualizar dataset
      pedidoElement.dataset.rondas = JSON.stringify(rondas);

      // Persistir cambios
      await this.guardarCambiosRonda(pedidoId, ronda);

      // Log de actividad
      await this.dataService.logActividad(
        'cancelar_ronda',
        `Ronda #${ronda.numero_ronda} cancelada`,
        { pedido_id: pedidoId, ronda_id: rondaId }
      );

      // Actualizar UI
      this.renderizarRondasEnPedido(pedidoElement, rondas);

      Utils.showSuccess('Ronda cancelada');
    } catch (error) {
      Utils.error('Error cancelando ronda', error);
      Utils.showError('Error al cancelar la ronda');
    }
  }

  // ================================================================
  // EVENTOS Y ACTUALIZACIONES
  // ================================================================

  handlePedidoActualizado(detalle) {
    const { pedidoId, pedido } = detalle;
    const pedidoElement = document.getElementById(pedidoId);
    
    if (pedidoElement && pedido.rondas) {
      this.renderizarRondasEnPedido(pedidoElement, pedido.rondas);
    }
  }

  async guardarCambiosRonda(pedidoId, ronda) {
    // Actualizar timestamp
    ronda.updated_at = new Date().toISOString();

    // Persistir a través del data service
    await this.dataService.saveRonda(ronda, pedidoId);

    // Disparar evento de actualización
    const event = new CustomEvent('ronda:actualizada', {
      detail: { pedidoId, ronda }
    });
    document.dispatchEvent(event);
  }

  actualizarVisualizacionRonda(pedidoId, ronda) {
    const pedidoElement = document.getElementById(pedidoId);
    if (!pedidoElement) return;

    const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
    const contenidoContainer = pedidoElement.querySelector('.contenido-ronda');
    const activeTabIndex = this.activeTab.get(pedidoId) || 0;

    // Re-renderizar contenido actual si es la ronda activa
    if (rondas[activeTabIndex]?.id === ronda.id) {
      this.mostrarContenidoRonda(ronda, activeTabIndex, pedidoId, contenidoContainer);
    }

    // Actualizar pestañas para reflejar cambios de estado
    this.renderizarRondasEnPedido(pedidoElement, rondas);

    // Disparar evento para actualizar totales del pedido
    const event = new CustomEvent('pedido:recalcular', {
      detail: { pedidoId }
    });
    document.dispatchEvent(event);
  }

  // ================================================================
  // UTILIDADES
  // ================================================================

  calcularTotalPendienteRonda(ronda) {
    const totalRonda = ronda.total || 0;
    const totalPagado = (ronda.pagos || []).reduce((sum, pago) => sum + pago.monto, 0);
    return Math.max(0, totalRonda - totalPagado);
  }

  getRondaActiva(pedidoId) {
    const activeTabIndex = this.activeTab.get(pedidoId) || 0;
    const pedidoElement = document.getElementById(pedidoId);
    
    if (pedidoElement) {
      const rondas = JSON.parse(pedidoElement.dataset.rondas || '[]');
      return rondas[activeTabIndex] || null;
    }
    
    return null;
  }

  setRondaActiva(pedidoId, rondaIndex) {
    this.activeTab.set(pedidoId, rondaIndex);
  }
}

// Funciones globales para compatibilidad
window.editarRonda = function(pedidoId, rondaIndex) {
  if (window.rondaManager) {
    window.rondaManager.cambiarPestanaRonda(pedidoId, rondaIndex);
    Utils.showInfo('Modo de edición activado. Puedes modificar cantidades o agregar/eliminar productos.');
  }
};

window.cancelarRonda = function(pedidoId, rondaId) {
  if (window.rondaManager) {
    window.rondaManager.cancelarRonda(pedidoId, rondaId);
  }
};

window.agregarProductoARonda = function(pedidoId, rondaId) {
  if (window.rondaManager) {
    window.rondaManager.agregarProductoARonda(pedidoId, rondaId);
  }
};

window.eliminarProductoDeRonda = function(pedidoId, rondaId, productoIndex) {
  if (window.rondaManager) {
    window.rondaManager.eliminarProductoDeRonda(pedidoId, rondaId, productoIndex);
  }
};

window.actualizarCantidadProducto = function(input, pedidoId, rondaId) {
  if (window.rondaManager) {
    window.rondaManager.actualizarCantidadProducto(input, pedidoId, rondaId);
  }
};