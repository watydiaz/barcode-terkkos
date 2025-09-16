// ================================================================
// MAIN.JS - Controlador principal de la aplicación modular
// Inicializa y coordina todos los módulos del sistema
// ================================================================

import { PedidoManager } from './modules/pedido-manager.js';
import { RondaManager } from './modules/ronda-manager.js';
import { MesaManager } from './modules/mesa-manager.js';
import { PagoManager } from './modules/pago-manager.js';
import { ModalManager } from './modules/modal-manager.js';
import { DataService } from './services/data-service.js';
import { Utils } from './utils/utils.js';

// ================================================================
// APLICACIÓN PRINCIPAL
// ================================================================

class App {
  constructor() {
    this.dataService = null;
    this.modalManager = null;
    this.pedidoManager = null;
    this.rondaManager = null;
    this.mesaManager = null;
    this.pagoManager = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      Utils.log('🚀 Iniciando sistema modular Barcode Terkkos...');
      
      // Paso 1: Inicializar DataService
      Utils.log('📁 Inicializando DataService...');
      this.dataService = new DataService();
      await this.dataService.init();
      
      // Paso 2: Inicializar ModalManager
      Utils.log('🪟 Inicializando ModalManager...');
      this.modalManager = new ModalManager(this.dataService);
      await this.modalManager.init();
      
      // Paso 3: Inicializar PedidoManager
      Utils.log('📋 Inicializando PedidoManager...');
      this.pedidoManager = new PedidoManager(this.dataService, this.modalManager);
      await this.pedidoManager.init();
      
      // Paso 4: Inicializar RondaManager
      Utils.log('🍽️ Inicializando RondaManager...');
      this.rondaManager = new RondaManager(this.dataService, this.modalManager);
      await this.rondaManager.init();
      
      // Paso 5: Inicializar PagoManager
      Utils.log('💳 Inicializando PagoManager...');
      this.pagoManager = new PagoManager(this.dataService, this.modalManager);
      await this.pagoManager.init();
      
      // Paso 6: Inicializar MesaManager
      Utils.log('🪑 Inicializando MesaManager...');
      this.mesaManager = new MesaManager(this.dataService, this.modalManager);
      await this.mesaManager.init();
      
      // Paso 7: Configurar comunicación entre módulos
      Utils.log('🔗 Configurando comunicación entre módulos...');
      this.setupModuleCommunication();
      
      // Paso 8: Hacer disponibles globalmente
      this.makeGloballyAvailable();
      
      // Paso 9: Configurar eventos globales
      this.setupGlobalEvents();
      
      // Paso 10: Configurar auto-save
      this.setupAutoSave();
      
      // Paso 11: Cargar datos iniciales
      await this.loadInitialData();
      
      this.isInitialized = true;
      Utils.log('✅ Sistema inicializado correctamente');
      this.showSuccessIndicator();
      
    } catch (error) {
      Utils.error('❌ Error inicializando sistema', error);
      this.showError('Error inicializando el sistema: ' + error.message);
    }
  }

  setupModuleCommunication() {
    // Comunicación entre RondaManager y PedidoManager
    document.addEventListener('pedido:actualizado', (e) => {
      const { pedidoId, pedido } = e.detail;
      const pedidoElement = document.getElementById(pedidoId);
      
      if (pedidoElement && pedido.rondas) {
        this.rondaManager.renderizarRondasEnPedido(pedidoElement, pedido.rondas);
      }
    });

    // Comunicación entre PagoManager y otros managers
    document.addEventListener('pago:completado', (e) => {
      const { tipo, pedidoId } = e.detail;
      
      if (tipo === 'pedido_completo') {
        // Eliminar pedido completamente pagado
        const elemento = document.getElementById(pedidoId);
        if (elemento) {
          elemento.style.transition = 'all 0.5s ease-out';
          elemento.style.opacity = '0';
          elemento.style.transform = 'translateX(100%)';
          
          setTimeout(() => {
            if (elemento.parentNode) {
              elemento.parentNode.removeChild(elemento);
            }
          }, 500);
        }
        
        if (this.pedidoManager.pedidos.has(pedidoId)) {
          this.pedidoManager.pedidos.delete(pedidoId);
        }
      }
    });

    // Comunicación entre MesaManager y PedidoManager
    document.addEventListener('mesa:terminada', (e) => {
      const { pedidoId, alquiler } = e.detail;
      
      const pedido = this.pedidoManager.getPedido(pedidoId);
      if (pedido) {
        pedido.mesa_alquilada = alquiler;
        this.dataService.savePedido(pedido);
        this.pedidoManager.actualizarElementoPedido(pedido);
      }
    });

    // Eventos de recálculo de totales
    document.addEventListener('pedido:recalcular', (e) => {
      const { pedidoId } = e.detail;
      const pedido = this.pedidoManager.getPedido(pedidoId);
      
      if (pedido) {
        const totalRondas = this.pedidoManager.calcularTotalRondas(pedido.rondas || []);
        const totalMesa = pedido.mesa_alquilada?.costo_total || 0;
        pedido.total_pedido = totalRondas + totalMesa;
        
        this.dataService.savePedido(pedido);
        this.pedidoManager.actualizarElementoPedido(pedido);
      }
    });

    Utils.log('✅ Comunicación entre módulos configurada');
  }

  makeGloballyAvailable() {
    window.dataService = this.dataService;
    window.modalManager = this.modalManager;
    window.pedidoManager = this.pedidoManager;
    window.rondaManager = this.rondaManager;
    window.pagoManager = this.pagoManager;
    window.mesaManager = this.mesaManager;
    window.app = this;
    
    Utils.log('✅ Módulos disponibles globalmente');
  }

  setupGlobalEvents() {
    const btnNuevoPedido = document.getElementById('btnNuevoPedido');
    if (btnNuevoPedido) {
      btnNuevoPedido.addEventListener('click', () => {
        this.pedidoManager.crearNuevoPedido();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.modalManager.closeAllModals();
      }
      
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.pedidoManager.crearNuevoPedido();
      }
    });

    window.addEventListener('error', (event) => {
      Utils.error('Error no capturado', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      Utils.error('Promesa rechazada no manejada', event.reason);
      event.preventDefault();
    });

    window.addEventListener('beforeunload', (event) => {
      if (this.pedidoManager?.getPedidosCount() > 0) {
        this.pedidoManager.autoSave();
        event.returnValue = '¿Estás seguro de salir? Hay pedidos activos.';
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Utils.log('🔄 Página oculta');
      } else {
        Utils.log('🔄 Página visible');
        if (this.mesaManager) {
          this.mesaManager.actualizarTodosLosTiempos();
        }
      }
    });

    Utils.log('✅ Eventos globales configurados');
  }

  setupAutoSave() {
    setInterval(async () => {
      if (this.pedidoManager && this.pedidoManager.getPedidosCount() > 0) {
        try {
          await this.pedidoManager.autoSave();
          Utils.log('💾 Auto-save completado');
        } catch (error) {
          Utils.error('❌ Error en auto-save', error);
        }
      }
    }, 120000);

    Utils.log('✅ Auto-save configurado');
  }

  async loadInitialData() {
    try {
      Utils.log('📊 Cargando datos iniciales...');
      
      const productos = await this.dataService.getProductos();
      Utils.log(`📦 ${productos.length} productos cargados`);
      
      const config = await this.dataService.getConfiguracion();
      Utils.log('⚙️ Configuración cargada');
      
      const pedidos = await this.dataService.getPedidos();
      if (pedidos.length > 0) {
        Utils.log(`📋 ${pedidos.length} pedidos restaurados`);
      }
      
      Utils.log('✅ Datos iniciales cargados');
    } catch (error) {
      Utils.error('❌ Error cargando datos', error);
    }
  }

  showSuccessIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg';
    indicator.innerHTML = `
      <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      <span class="text-sm font-medium">Sistema Online ✅</span>
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.transition = 'opacity 0.5s ease-out';
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        }, 500);
      }
    }, 3000);
  }

  showError(message) {
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-red-50">
        <div class="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 class="text-2xl font-bold text-red-700 mb-4">Error de Sistema</h1>
          <p class="text-red-600 mb-6">${message}</p>
          <button onclick="location.reload()" 
                  class="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold">
            🔄 Recargar Página
          </button>
        </div>
      </div>
    `;
  }

  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      modules: {
        dataService: !!this.dataService,
        modalManager: !!this.modalManager,
        pedidoManager: !!this.pedidoManager,
        rondaManager: !!this.rondaManager,
        pagoManager: !!this.pagoManager,
        mesaManager: !!this.mesaManager
      },
      stats: {
        pedidos_activos: this.pedidoManager?.getPedidosCount() || 0,
        mesas_activas: this.mesaManager?.getMesasActivas()?.length || 0
      }
    };
  }

  async restart() {
    Utils.log('🔄 Reiniciando sistema...');
    
    if (this.mesaManager) {
      this.mesaManager.destroy();
    }
    
    await this.init();
    Utils.showSuccess('✅ Sistema reiniciado');
  }
}

// ================================================================
// FUNCIONES GLOBALES PARA COMPATIBILIDAD
// ================================================================

window.crearNuevoPedido = () => {
  if (window.pedidoManager) {
    window.pedidoManager.crearNuevoPedido();
  }
};

window.abrirModalRonda = (element) => {
  if (window.modalManager) {
    const pedidoId = element.closest('[data-id]')?.dataset.id;
    if (pedidoId) {
      window.modalManager.mostrarModalRonda(pedidoId);
    }
  }
};

window.alquilarMesa = (element) => {
  if (window.mesaManager) {
    const pedidoId = element.closest('[data-id]')?.dataset.id;
    if (pedidoId) {
      window.mesaManager.alquilarMesa(pedidoId);
    }
  }
};

window.pagoCompletoTotal = (element) => {
  if (window.pagoManager) {
    const pedidoId = element.closest('[data-id]')?.dataset.id;
    if (pedidoId) {
      window.pagoManager.pagarPedidoCompleto(pedidoId);
    }
  }
};

window.diagnosticoSistema = () => {
  if (window.app) {
    const status = window.app.getSystemStatus();
    console.table(status.modules);
    console.table(status.stats);
    return status;
  }
  return null;
};

window.reiniciarSistema = async () => {
  if (window.app) {
    await window.app.restart();
  } else {
    location.reload();
  }
};

// ================================================================
// INICIALIZACIÓN
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
  Utils.log('📄 DOM cargado, iniciando sistema...');
  
  const app = new App();
  window.app = app;
  await app.init();
  
  console.log('%c🎉 BARCODE TERKKOS - SISTEMA MODULAR ACTIVO', 'color: #10B981; font-size: 18px; font-weight: bold;');
  console.log('%c📊 diagnosticoSistema() - Ver estado', 'color: #6B7280; font-size: 12px;');
  console.log('%c🔄 reiniciarSistema() - Reiniciar', 'color: #6B7280; font-size: 12px;');
});