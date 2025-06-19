// frontend/src/services/proveedoresService.js

// NOTA IMPORTANTE: Asegúrate de que API_URL apunte a tu backend, no a tu frontend.
// Tu backend de proveedores corre en http://localhost:5000/api/proveedores,
// no en http://localhost:3000/api/proveedores (que sería tu propio frontend si no tienes proxy).
const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta esto si tu puerto o dominio de backend es diferente

// --- Función Auxiliar para manejar las peticiones a la API ---
// Esta función centraliza la lógica de autenticación y manejo de errores.
async function apiFetch(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: method,
    headers: headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, config);

  // Manejo de errores mejorado: Intenta leer el mensaje de error del backend.
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Error en la petición: ${response.statusText}` }));
    throw new Error(errorData.message || 'Ocurrió un error desconocido.');
  }

  // Si la respuesta no tiene contenido (ej. en un DELETE exitoso), no intenta parsear JSON.
  // CORRECCIÓN APLICADA AQUÍ: Añadidos paréntesis para clarificar la precedencia de operadores.
  if (response.status === 204 || (response.status === 200 && response.headers.get('content-length') === '0')) {
    return null;
  }

  return await response.json();
}


// --- Las funciones de servicio ahora son más simples y limpias ---

/**
 * Obtiene la lista de todos los proveedores activos.
 */
export const obtenerProveedores = () => {
  return apiFetch(`${API_BASE_URL}/proveedores`);
};

/**
 * Obtiene los detalles de un proveedor específico por su ID.
 * @param {number} id - ID del proveedor.
 */
export const getProveedorById = (id) => {
  return apiFetch(`${API_BASE_URL}/proveedores/${id}`);
};

/**
 * Crea un nuevo proveedor.
 * @param {object} nuevoProveedor - Datos del proveedor a crear.
 */
export const crearProveedor = (nuevoProveedor) => {
  return apiFetch(`${API_BASE_URL}/proveedores`, 'POST', nuevoProveedor);
};

/**
 * Actualiza un proveedor existente.
 * @param {number} id - ID del proveedor a actualizar.
 * @param {object} datosActualizados - Datos del proveedor para actualizar.
 */
export const actualizarProveedor = (id, datosActualizados) => {
  return apiFetch(`${API_BASE_URL}/proveedores/${id}`, 'PUT', datosActualizados);
};

/**
 * "Elimina" (inactiva) un proveedor.
 * @param {number} id - ID del proveedor a inactivar.
 */
export const eliminarProveedor = (id) => {
  // Para un soft delete, el backend ya espera el DELETE a la ruta con el ID.
  // El controlador se encargará de cambiar is_active a FALSE.
  return apiFetch(`${API_BASE_URL}/proveedores/${id}`, 'DELETE');
};


// --- Funciones de Compras y Comparación de Precios (se mantienen) ---

/**
 * Registra una nueva compra y su lote asociado.
 * @param {object} compraData - Datos de la compra.
 */
export const registrarCompra = (compraData) => {
  return apiFetch(`${API_BASE_URL}/proveedores/compras`, 'POST', compraData);
};

/**
 * Obtiene el historial de todas las compras registradas.
 */
export const obtenerHistorialCompras = () => {
  return apiFetch(`${API_BASE_URL}/proveedores/compras`);
};

/**
 * Compara precios de un producto entre diferentes proveedores.
 * @param {string} nombreProducto - El nombre de la materia prima a comparar.
 */
export const compararPrecios = (nombreProducto) => {
  const endpoint = `${API_BASE_URL}/proveedores/comparar-precios?producto=${encodeURIComponent(nombreProducto)}`;
  return apiFetch(endpoint);
};