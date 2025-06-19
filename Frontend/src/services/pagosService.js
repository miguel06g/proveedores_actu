// frontend/src/services/pagosService.js

const API_URL = 'http://localhost:3000/api/pagos'; // Asegúrate de que esta URL coincida con la de tu backend

export const getPagos = async (filters = {}) => {
    // Construir los parámetros de consulta a partir del objeto filters
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // <-- DESCOMENTADO
        }
    });
    if (!response.ok) {
        const errorData = await response.json(); // Intentar leer el mensaje de error del backend
        throw new Error(errorData.message || 'Error al obtener los pagos.');
    }
    return response.json();
};

export const registrarPago = async (pagoData) => {
    // pagoData solo contendrá pedido_id, monto, metodo_pago
    const { pedido_id, monto, metodo_pago } = pagoData;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // <-- DESCOMENTADO
        },
        body: JSON.stringify({ pedido_id, monto, metodo_pago }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el pago.');
    }
    return response.json();
};

export const getPagosByPedidoId = async (pedidoId) => {
    const response = await fetch(`${API_URL}/${pedidoId}/pagos`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // <-- DESCOMENTADO
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al obtener pagos para el pedido ${pedidoId}.`);
    }
    return response.json();
};

// Necesitas un servicio para obtener pedidos con saldo pendiente para el formulario de registro de pago.
export const obtenerPedidosPendientes = async () => {
    // TODO: Ajusta esta URL a tu endpoint real para obtener pedidos.
    const response = await fetch('http://localhost:3000/api/pedidos', { // <-- AJUSTA ESTA URL si es diferente
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // <-- DESCOMENTADO
        }
    });
    if (!response.ok) {
        // Mejorar el mensaje de error para incluir el estado 401 si es el caso
        const errorDetail = response.status === 401 ? ' (No autorizado, verifica tu sesión)' : '';
        throw new Error(`Error al cargar pedidos.${errorDetail} Asegúrate de que el backend de pedidos esté funcionando.`);
    }
    const pedidos = await response.json();

    // Para cada pedido, obtendremos sus pagos y calcularemos el total pagado y el saldo pendiente.
    const pedidosConSaldo = await Promise.all(pedidos.map(async pedido => {
        // Obtenemos los pagos específicos de este pedido usando la API que acabamos de crear
        const pagosDelPedido = await getPagosByPedidoId(pedido.id);
        const totalPagado = pagosDelPedido.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);

        return {
            ...pedido,
            total_pagado: parseFloat(pedido.total_pedido), // Asegurarse de que total_pedido sea un número
            total_pagado_actual: totalPagado, // Nuevo campo para el total pagado hasta ahora
            saldo_pendiente: parseFloat(pedido.total_pedido) - totalPagado,
        };
    }));

    // Filtra los pedidos que aún tienen saldo pendiente (> 0)
    return pedidosConSaldo.filter(pedido => pedido.saldo_pendiente > 0);
};