// ================================================================
// UTILS.JS - Funciones de utilidad
// ================================================================

export class Utils {
  
  // ================================================================
  // FORMATEO DE DATOS
  // ================================================================

  static formatoCOP(valor) {
    return valor.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    });
  }

  static formatearFecha(fecha) {
    if (typeof fecha === 'string') {
      fecha = new Date(fecha);
    }
    return fecha.toLocaleString('es-CO');
  }

  static formatearTiempo(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    const segundos = 0; // Por simplicidad
    
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  // ================================================================
  // VALIDACIONES
  // ================================================================

  static validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validarTelefono(telefono) {
    const regex = /^[\d\s\-\+\(\)]{7,15}$/;
    return regex.test(telefono);
  }

  static validarPrecio(precio) {
    return !isNaN(precio) && parseFloat(precio) >= 0;
  }

  static validarCantidad(cantidad) {
    return !isNaN(cantidad) && parseInt(cantidad) > 0;
  }

  // ================================================================
  // MANIPULACIÓN DEL DOM
  // ================================================================

  static createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }

  static findAcordeon(element) {
    return element.closest('.border.rounded.shadow');
  }

  static showElement(element) {
    if (element) element.classList.remove('hidden');
  }

  static hideElement(element) {
    if (element) element.classList.add('hidden');
  }

  static toggleElement(element) {
    if (element) element.classList.toggle('hidden');
  }

  // ================================================================
  // NOTIFICACIONES Y ALERTAS
  // ================================================================

  static showSuccess(mensaje, duracion = 3000) {
    this.showToast(mensaje, 'success', duracion);
  }

  static showError(mensaje, duracion = 5000) {
    this.showToast(mensaje, 'error', duracion);
  }

  static showInfo(mensaje, duracion = 3000) {
    this.showToast(mensaje, 'info', duracion);
  }

  static showWarning(mensaje, duracion = 4000) {
    this.showToast(mensaje, 'warning', duracion);
  }

  static showToast(mensaje, tipo = 'info', duracion = 3000) {
    // Crear contenedor de toast si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
      container = this.createElement('div', 'fixed top-20 right-4 z-50 space-y-2');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    // Colores según el tipo
    const colores = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    // Crear toast
    const toast = this.createElement('div', 
      `${colores[tipo]} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 opacity-0 translate-x-full`
    );
    toast.textContent = mensaje;

    container.appendChild(toast);

    // Animación de entrada
    setTimeout(() => {
      toast.classList.remove('opacity-0', 'translate-x-full');
    }, 100);

    // Auto-eliminar
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duracion);
  }

  // ================================================================
  // CONFIRMACIONES
  // ================================================================

  static async confirmar(mensaje, titulo = 'Confirmar') {
    return new Promise((resolve) => {
      const modal = this.createElement('div', 
        'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
      );

      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4">${titulo}</h3>
            <p class="text-gray-600 mb-6">${mensaje}</p>
            <div class="flex justify-end space-x-2">
              <button id="btn-cancelar" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">
                Cancelar
              </button>
              <button id="btn-confirmar" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#btn-confirmar').onclick = () => {
        modal.remove();
        resolve(true);
      };

      modal.querySelector('#btn-cancelar').onclick = () => {
        modal.remove();
        resolve(false);
      };

      // Cerrar con click fuera del modal
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      };
    });
  }

  static async prompt(mensaje, valorDefault = '', titulo = 'Ingreso de datos') {
    return new Promise((resolve) => {
      const modal = this.createElement('div', 
        'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
      );

      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4">${titulo}</h3>
            <p class="text-gray-600 mb-4">${mensaje}</p>
            <input type="text" id="input-prompt" class="w-full border rounded px-3 py-2 mb-6" value="${valorDefault}" placeholder="Ingrese el valor...">
            <div class="flex justify-end space-x-2">
              <button id="btn-cancelar" class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">
                Cancelar
              </button>
              <button id="btn-aceptar" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const input = modal.querySelector('#input-prompt');
      input.focus();
      input.select();

      const aceptar = () => {
        const valor = input.value.trim();
        modal.remove();
        resolve(valor || null);
      };

      modal.querySelector('#btn-aceptar').onclick = aceptar;
      modal.querySelector('#btn-cancelar').onclick = () => {
        modal.remove();
        resolve(null);
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          aceptar();
        } else if (e.key === 'Escape') {
          modal.remove();
          resolve(null);
        }
      });
    });
  }

  // ================================================================
  // GENERACIÓN DE IDs ÚNICOS
  // ================================================================

  static generateId(prefijo = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefijo}${prefijo ? '-' : ''}${timestamp}-${random}`;
  }

  static generatePedidoId() {
    const pedidos = document.querySelectorAll('[id^="pedido-"]');
    return `pedido-${pedidos.length}`;
  }

  // ================================================================
  // MANIPULACIÓN DE ARRAYS Y OBJETOS
  // ================================================================

  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .substring(0, 500); // Limitar longitud
  }

  // ================================================================
  // CÁLCULOS COMUNES
  // ================================================================

  static calcularSubtotal(cantidad, precio) {
    return (parseInt(cantidad) || 0) * (parseFloat(precio) || 0);
  }

  static calcularTotal(productos) {
    return productos.reduce((total, producto) => {
      return total + (producto.subtotal || 0);
    }, 0);
  }

  static calcularDivision(total, personas) {
    const numPersonas = parseInt(personas) || 1;
    return total / numPersonas;
  }

  static calcularTiempoMesa(fechaInicio, fechaFin = null) {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    return Math.floor((fin - inicio) / (1000 * 60)); // Minutos
  }

  static calcularCostoMesa(minutos, precioPorHora) {
    const horas = Math.ceil(minutos / 60); // Redondear hacia arriba
    return horas * precioPorHora;
  }

  // ================================================================
  // DEBUGGING Y LOGGING
  // ================================================================

  static log(mensaje, datos = null) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`[BarcodeTerrkkos] ${mensaje}`, datos || '');
    }
  }

  static error(mensaje, error = null) {
    console.error(`[BarcodeTerrkkos ERROR] ${mensaje}`, error || '');
  }

  static warn(mensaje, datos = null) {
    console.warn(`[BarcodeTerrkkos WARN] ${mensaje}`, datos || '');
  }

  // ================================================================
  // ALMACENAMIENTO LOCAL
  // ================================================================

  static saveToStorage(key, data) {
    try {
      localStorage.setItem(`barcode_terkkos_${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      this.error('Error guardando en localStorage', error);
      return false;
    }
  }

  static loadFromStorage(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(`barcode_terkkos_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      this.error('Error cargando de localStorage', error);
      return defaultValue;
    }
  }

  static removeFromStorage(key) {
    try {
      localStorage.removeItem(`barcode_terkkos_${key}`);
      return true;
    } catch (error) {
      this.error('Error eliminando de localStorage', error);
      return false;
    }
  }
}