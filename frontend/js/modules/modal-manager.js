// ================================================================
// MODAL-MANAGER.JS - Gestor de modales del sistema
// Maneja todos los modales: rondas, pagos, mesas, etc.
// ================================================================

import { Utils } from '../utils/utils.js';

export class ModalManager {
  constructor(dataService) {
    this.dataService = dataService;
    this.activeModals = new Map();
    this.modalContainer = null;
  }

  init() {
    this.createModalContainer();
    this.setupGlobalEvents();
    Utils.log('ModalManager inicializado');
  }

  createModalContainer() {
    this.modalContainer = document.getElementById('modal-container');
    if (!this.modalContainer) {
      this.modalContainer = Utils.createElement('div', 'modal-container');
      this.modalContainer.id = 'modal-container';
      document.body.appendChild(this.modalContainer);
    }
  }

  setupGlobalEvents() {
    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopModal();
      }
    });
  }

  // ================================================================
  // GESTIÓN GENERAL DE MODALES
  // ================================================================

  createModal(id, title, content, options = {}) {
    const defaultOptions = {
      size: 'md', // sm, md, lg, xl
      closable: true,
      backdrop: true,
      customClass: '',
      buttons: []
    };

    const opts = { ...defaultOptions, ...options };
    
    const modal = Utils.createElement('div', 
      `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${opts.backdrop ? '' : 'pointer-events-none'}`
    );
    modal.id = id;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md', 
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    };

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg ${sizeClasses[opts.size]} w-full mx-4 ${opts.customClass}" onclick="event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">${title}</h3>
            ${opts.closable ? `
              <button type="button" class="modal-close text-gray-400 hover:text-gray-600" onclick="modalManager.closeModal('${id}')">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            ` : ''}
          </div>
          <div class="modal-content">
            ${content}
          </div>
          ${opts.buttons.length > 0 ? `
            <div class="flex justify-end space-x-2 mt-6">
              ${opts.buttons.map(btn => `
                <button type="button" class="${btn.class}" onclick="${btn.onclick}">
                  ${btn.text}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Cerrar con click en backdrop
    if (opts.backdrop && opts.closable) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(id);
        }
      });
    }

    this.modalContainer.appendChild(modal);
    this.activeModals.set(id, { element: modal, options: opts });

    // Animación de entrada
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);

    Utils.log(`Modal creado: ${id}`);
    return modal;
  }

  closeModal(id) {
    const modalData = this.activeModals.get(id);
    if (modalData) {
      const modal = modalData.element;
      
      // Animación de salida
      modal.style.transition = 'opacity 0.3s ease-out';
      modal.style.opacity = '0';
      
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        this.activeModals.delete(id);
        Utils.log(`Modal cerrado: ${id}`);
      }, 300);
    }
  }

  closeAllModals() {
    for (const [id] of this.activeModals) {
      this.closeModal(id);
    }
  }

  closeTopModal() {
    const ids = Array.from(this.activeModals.keys());
    if (ids.length > 0) {
      this.closeModal(ids[ids.length - 1]);
    }
  }

  isModalOpen(id) {
    return this.activeModals.has(id);
  }

  // ================================================================
  // MODAL DE RONDA (Crear/Editar productos)
  // ================================================================

  mostrarModalRonda(targetAcordeonId = '') {
    // Alias para createRondaModal para compatibilidad
    return this.createRondaModal(targetAcordeonId);
  }

  createRondaModal(targetAcordeonId = '') {
    const content = `
      <div class="overflow-x-auto">
        <table id="tablaExcel" class="min-w-full text-sm text-left border">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-2 py-1">Producto</th>
              <th class="px-2 py-1">Precio Unitario</th>
              <th class="px-2 py-1">Cantidad</th>
              <th class="px-2 py-1">Subtotal</th>
              <th class="px-2 py-1">Acciones</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="mt-4">
        <button id="btnAgregarProducto" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
          + Agregar producto
        </button>
        <button id="btnSeleccionarCatalogo" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold ml-2">
          📋 Catálogo
        </button>
      </div>
    `;

    const buttons = [
      {
        text: 'Cancelar',
        class: 'bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded',
        onclick: `modalManager.closeModal('modalRonda')`
      },
      {
        text: 'Guardar ronda',
        class: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold',
        onclick: `modalManager.guardarRonda()`
      }
    ];

    const modal = this.createModal('modalRonda', 'Crear Ronda', content, {
      size: 'lg',
      buttons: buttons
    });

    // Guardar referencia al acordeón
    modal.dataset.targetAcordeon = targetAcordeonId;

    // Configurar eventos
    this.setupRondaModalEvents(modal);
    
    // Agregar primera fila automáticamente
    this.agregarFilaProducto();

    return modal;
  }

  setupRondaModalEvents(modal) {
    const tbody = modal.querySelector('tbody');
    
    // Evento para agregar producto
    modal.querySelector('#btnAgregarProducto').onclick = () => {
      this.agregarFilaProducto();
    };

    // Evento para abrir catálogo
    modal.querySelector('#btnSeleccionarCatalogo').onclick = () => {
      this.openCatalogoModal();
    };

    // Actualizar subtotales al cambiar valores
    tbody.addEventListener('input', (e) => {
      if (e.target.matches('input[type="number"]')) {
        this.actualizarSubtotalFila(e.target.closest('tr'));
      }
    });
  }

  agregarFilaProducto() {
    const tbody = document.querySelector('#modalRonda tbody');
    if (!tbody) return;

    const tr = Utils.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">
        <input type="text" class="w-full border rounded px-2 py-1 producto-nombre" placeholder="Nombre del producto" required>
      </td>
      <td class="px-2 py-1">
        <input type="number" class="w-24 border rounded px-2 py-1 producto-precio" min="0" step="100" placeholder="0" required>
      </td>
      <td class="px-2 py-1">
        <input type="number" class="w-16 border rounded px-2 py-1 producto-cantidad text-center" min="1" value="1" required>
      </td>
      <td class="px-2 py-1">
        <span class="producto-subtotal font-mono">$0</span>
      </td>
      <td class="px-2 py-1">
        <button type="button" class="text-red-600 hover:bg-red-100 px-1 py-1 rounded text-sm" onclick="this.closest('tr').remove()" title="Eliminar producto">
          ✕
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
    
    // Enfocar el input de nombre
    const nombreInput = tr.querySelector('.producto-nombre');
    nombreInput.focus();
  }

  actualizarSubtotalFila(fila) {
    const precioInput = fila.querySelector('.producto-precio');
    const cantidadInput = fila.querySelector('.producto-cantidad');
    const subtotalSpan = fila.querySelector('.producto-subtotal');
    
    const precio = parseFloat(precioInput.value) || 0;
    const cantidad = parseInt(cantidadInput.value) || 1;
    const subtotal = precio * cantidad;
    
    subtotalSpan.textContent = Utils.formatoCOP(subtotal);
  }

  guardarRonda() {
    const modal = this.activeModals.get('modalRonda');
    if (!modal) return;

    const tbody = modal.element.querySelector('tbody');
    const filas = Array.from(tbody.querySelectorAll('tr'));
    
    if (filas.length === 0) {
      Utils.showWarning('Agrega al menos un producto antes de guardar la ronda.');
      return;
    }

    const productos = [];
    let total = 0;
    let hayErrores = false;

    // Validar y recopilar productos
    filas.forEach((fila, index) => {
      const nombre = Utils.sanitizeInput(fila.querySelector('.producto-nombre').value);
      const precio = parseFloat(fila.querySelector('.producto-precio').value) || 0;
      const cantidad = parseInt(fila.querySelector('.producto-cantidad').value) || 1;
      
      if (!nombre.trim()) {
        Utils.showError(`Producto ${index + 1}: El nombre es obligatorio`);
        hayErrores = true;
        return;
      }
      
      if (precio < 0) {
        Utils.showError(`Producto ${index + 1}: El precio no puede ser negativo`);
        hayErrores = true;
        return;
      }
      
      if (cantidad <= 0) {
        Utils.showError(`Producto ${index + 1}: La cantidad debe ser mayor a 0`);
        hayErrores = true;
        return;
      }

      const subtotal = precio * cantidad;
      total += subtotal;
      
      productos.push({
        nombre,
        precio,
        cantidad,
        subtotal
      });
    });

    if (hayErrores) return;

    // Obtener acordeón destino
    const targetAcordeonId = modal.element.dataset.targetAcordeon;
    const acordeon = document.getElementById(targetAcordeonId);
    
    if (!acordeon) {
      Utils.showError('No se encontró el pedido destino');
      return;
    }

    // Guardar ronda (esto lo manejará RondaManager)
    const event = new CustomEvent('ronda:guardar', {
      detail: {
        acordeonId: targetAcordeonId,
        productos,
        total
      }
    });
    
    document.dispatchEvent(event);
    
    this.closeModal('modalRonda');
    Utils.showSuccess('Ronda guardada correctamente');
  }

  // ================================================================
  // MODAL DE CATÁLOGO DE PRODUCTOS
  // ================================================================

  async openCatalogoModal() {
    // TODO: Cargar productos desde DataService
    const content = `
      <div class="mb-4">
        <input type="text" id="buscarProducto" class="w-full border rounded px-3 py-2" 
               placeholder="Buscar productos..." onkeyup="modalManager.filtrarProductos()">
      </div>
      <div class="mb-4">
        <select id="categoriaFilter" class="border rounded px-3 py-2" onchange="modalManager.filtrarPorCategoria()">
          <option value="">Todas las categorías</option>
          <option value="1">Bebidas Alcohólicas</option>
          <option value="2">Bebidas No Alcohólicas</option>
          <option value="3">Comida Rápida</option>
          <option value="4">Aperitivos</option>
          <option value="5">Postres</option>
          <option value="6">Platos Principales</option>
          <option value="7">Desayunos</option>
        </select>
      </div>
      <div id="productosLista" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        <!-- Los productos se cargarán dinámicamente -->
      </div>
    `;

    const modal = this.createModal('modalCatalogo', 'Catálogo de Productos', content, {
      size: 'xl'
    });

    // Cargar productos
    await this.cargarProductosCatalogo();
  }

  async cargarProductosCatalogo() {
    const lista = document.getElementById('productosLista');
    if (!lista) return;

    try {
      // Cargar productos desde DataService
      const productos = await this.dataService.getProductos();
      
      // Mapear categorías para mostrar nombres legibles
      const categoriasMap = {
        1: 'Bebidas Alcohólicas',
        2: 'Bebidas No Alcohólicas', 
        3: 'Comida Rápida',
        4: 'Aperitivos',
        5: 'Postres',
        6: 'Platos Principales',
        7: 'Desayunos',
        8: 'Otros'
      };

      lista.innerHTML = productos.map(producto => {
        const categoria = categoriasMap[producto.categoria_id] || 'Otros';
        return `
          <div class="border rounded p-3 hover:bg-gray-50 cursor-pointer producto-item" 
               onclick="modalManager.seleccionarProductoCatalogo(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
            <div class="font-semibold">${producto.nombre}</div>
            <div class="text-sm text-gray-600">${categoria}</div>
            <div class="text-lg font-bold text-green-600">${Utils.formatoCOP(producto.precio_venta)}</div>
            <div class="text-xs ${producto.stock_actual > 0 ? 'text-blue-600' : 'text-orange-600'}">
              Stock: ${producto.stock_actual > 0 ? producto.stock_actual : 'Sin límite'}
            </div>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      lista.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">❌</div>
          <p>Error cargando productos</p>
          <p class="text-sm">${error.message}</p>
        </div>
      `;
    }
  }

  seleccionarProductoCatalogo(producto) {
    // Agregar producto a la ronda actual
    const tbody = document.querySelector('#modalRonda tbody');
    if (!tbody) {
      Utils.showError('No hay una ronda abierta');
      return;
    }

    const tr = Utils.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">
        <input type="text" class="w-full border rounded px-2 py-1 producto-nombre" value="${producto.nombre}" required>
        <input type="hidden" class="producto-id" value="${producto.id}">
      </td>
      <td class="px-2 py-1">
        <input type="number" class="w-24 border rounded px-2 py-1 producto-precio" value="${producto.precio_venta}" min="0" step="100" required>
      </td>
      <td class="px-2 py-1">
        <input type="number" class="w-16 border rounded px-2 py-1 producto-cantidad text-center" min="1" value="1" required>
      </td>
      <td class="px-2 py-1">
        <span class="producto-subtotal font-mono">${Utils.formatoCOP(producto.precio_venta)}</span>
      </td>
      <td class="px-2 py-1">
        <button type="button" class="text-red-600 hover:bg-red-100 px-1 py-1 rounded text-sm" onclick="this.closest('tr').remove()" title="Eliminar producto">
          ✕
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
    
    this.closeModal('modalCatalogo');
    Utils.showSuccess(`Producto "${producto.nombre}" agregado`);
  }

  filtrarProductos() {
    // TODO: Implementar filtro de búsqueda
    const termino = document.getElementById('buscarProducto').value.toLowerCase();
    const productos = document.querySelectorAll('.producto-item');
    
    productos.forEach(item => {
      const nombre = item.querySelector('div').textContent.toLowerCase();
      if (nombre.includes(termino)) {
        Utils.showElement(item);
      } else {
        Utils.hideElement(item);
      }
    });
  }

  filtrarPorCategoria() {
    // TODO: Implementar filtro por categoría
    const categoria = document.getElementById('categoriaFilter').value;
    console.log('Filtrar por categoría:', categoria);
  }

  // ================================================================
  // MODAL DE MÉTODO DE PAGO
  // ================================================================

  createMetodoPagoModal(monto, titulo = 'Método de Pago') {
    return new Promise((resolve) => {
      const content = `
        <div class="text-center mb-6">
          <div class="text-3xl font-bold text-green-600">${Utils.formatoCOP(monto)}</div>
          <div class="text-gray-600">Total a pagar</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="metodo-btn bg-green-100 hover:bg-green-200 border-2 border-green-300 rounded-lg p-4 text-center transition-colors" data-metodo="Efectivo">
            <div class="text-3xl mb-2">💵</div>
            <div class="font-semibold">Efectivo</div>
          </button>
          <button type="button" class="metodo-btn bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 rounded-lg p-4 text-center transition-colors" data-metodo="Nequi">
            <div class="text-3xl mb-2">📱</div>
            <div class="font-semibold">Nequi</div>
          </button>
          <button type="button" class="metodo-btn bg-orange-100 hover:bg-orange-200 border-2 border-orange-300 rounded-lg p-4 text-center transition-colors" data-metodo="Daviplata">
            <div class="text-3xl mb-2">💳</div>
            <div class="font-semibold">Daviplata</div>
          </button>
          <button type="button" class="metodo-btn bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded-lg p-4 text-center transition-colors" data-metodo="Transferencia">
            <div class="text-3xl mb-2">🏦</div>
            <div class="font-semibold">Transferencia</div>
          </button>
        </div>
      `;

      const modal = this.createModal('modalMetodoPago', titulo, content, {
        size: 'md'
      });

      // Configurar eventos
      modal.querySelectorAll('.metodo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const metodo = btn.dataset.metodo;
          this.closeModal('modalMetodoPago');
          resolve(metodo);
        });
      });

      // Si se cierra el modal sin seleccionar, resolver con null
      modal.addEventListener('modalClosed', () => {
        resolve(null);
      });
    });
  }
}