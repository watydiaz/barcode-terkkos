// producto-manager.js
import { DataService } from '../services/data-service.js';

export class ProductoManager {
  constructor() {
    this.dataService = new DataService();
  }

  async listarProductos(categoriaId = null) {
    return await this.dataService.getProductos(categoriaId);
  }

  async crearProducto(producto) {
    // Si usas localStorage, DataService no tiene método directo, pero puedes extenderlo
    // Si usas API, implementa el endpoint correspondiente
    // Ejemplo para API:
    if (!this.dataService.useLocalStorage) {
      const response = await fetch(`${this.dataService.baseUrl}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      });
      return await response.json();
    }
    // Si es localStorage, deberías agregar lógica aquí
    throw new Error('No implementado para localStorage');
  }

  async actualizarProducto(producto) {
    if (!this.dataService.useLocalStorage) {
      const response = await fetch(`${this.dataService.baseUrl}/productos/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      });
      return await response.json();
    }
    throw new Error('No implementado para localStorage');
  }

  async eliminarProducto(productoId) {
    if (!this.dataService.useLocalStorage) {
      const response = await fetch(`${this.dataService.baseUrl}/productos/${productoId}`, {
        method: 'DELETE'
      });
      return await response.json();
    }
    throw new Error('No implementado para localStorage');
  }
}
