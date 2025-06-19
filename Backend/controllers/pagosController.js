// backend/controllers/pagosController.js
const pool = require('../config/db'); // Asume que db.js está en '../config/db'
// Si tu archivo db.js está en otra ruta (ej. 'ruta/a/db'), ajústala.

// Función auxiliar para calcular saldo pendiente de un pedido
// Esta función simulará la lógica que necesitas.
// DEBES TENER UNA TABLA 'pedidos' CON 'id' Y 'total_pedido'
// Y UNA TABLA 'pagos' CON 'id', 'pedido_id', 'monto'
async function calcularSaldoPedido(pedidoId) {
    // 1. Obtener el total del pedido
    const [pedidoRows] = await pool.query('SELECT id, total_pedido, estado_pedido FROM pedidos WHERE id = ?', [pedidoId]);
    if (pedidoRows.length === 0) {
        throw new Error(`Pedido con ID ${pedidoId} no encontrado.`);
    }
    const totalPedido = parseFloat(pedidoRows[0].total_pedido);
    const estadoPedidoActual = pedidoRows[0].estado_pedido; // Obtener el estado actual del pedido

    // 2. Sumar todos los pagos asociados a ese pedido
    const [pagosRows] = await pool.query('SELECT SUM(monto) AS total_pagado FROM pagos WHERE pedido_id = ?', [pedidoId]);
    const totalPagado = parseFloat(pagosRows[0].total_pagado || 0); // Si no hay pagos, será 0

    const saldoPendiente = totalPedido - totalPagado;

    return {
        total_pedido: totalPedido,
        total_pagado_pedido_calculado: totalPagado,
        saldo_pendiente_pedido_calculado: saldoPendiente,
        estado_pedido_actual: estadoPedidoActual // Devolver el estado del pedido
    };
}

// @desc    Obtener todos los pagos (con filtros opcionales)
// @route   GET /api/pagos
// @access  Private (Admin, Empleado, Finanzas)
exports.getPagos = async (req, res) => {
    try {
        const { pedidoId, metodoPago, fechaDesde, fechaHasta } = req.query;
        let query = 'SELECT p.*, pe.total_pedido, pe.estado_pedido FROM pagos p JOIN pedidos pe ON p.pedido_id = pe.id WHERE 1=1';
        const params = [];

        if (pedidoId) {
            query += ' AND p.pedido_id = ?';
            params.push(pedidoId);
        }
        if (metodoPago) {
            query += ' AND p.metodo_pago = ?';
            params.push(metodoPago);
        }
        if (fechaDesde) {
            query += ' AND p.fecha_pago >= ?';
            params.push(fechaDesde);
        }
        if (fechaHasta) {
            query += ' AND p.fecha_pago <= ?';
            params.push(fechaHasta + ' 23:59:59'); // Incluir todo el día
        }

        query += ' ORDER BY p.fecha_pago DESC';

        const [pagos] = await pool.query(query, params);

        // Para cada pago, calcular el saldo pendiente del pedido asociado
        const pagosConSaldos = await Promise.all(pagos.map(async (pago) => {
            const { total_pedido, total_pagado_pedido_calculado, saldo_pendiente_pedido_calculado, estado_pedido_actual } = await calcularSaldoPedido(pago.pedido_id);
            return {
                ...pago,
                total_pedido: total_pedido, // Ya viene del JOIN, pero lo confirmamos
                total_pagado_pedido_calculado: total_pagado_pedido_calculado,
                saldo_pendiente_pedido_calculado: saldo_pendiente_pedido_calculado,
                estado_pedido_actual: estado_pedido_actual // Estado actual del pedido
            };
        }));

        res.status(200).json(pagosConSaldos);
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener pagos.' });
    }
};

// @desc    Registrar un nuevo pago
// @route   POST /api/pagos
// @access  Private (Admin, Empleado, Finanzas)
exports.registrarPago = async (req, res) => {
    const { pedido_id, monto, metodo_pago } = req.body;

    // Validación básica
    if (!pedido_id || !monto || !metodo_pago) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios: pedido_id, monto, metodo_pago.' });
    }
    if (isNaN(monto) || parseFloat(monto) <= 0) {
        return res.status(400).json({ message: 'El monto debe ser un número positivo.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Verificar si el pedido existe y obtener su total
        const [pedidoRows] = await connection.query('SELECT total_pedido, estado_pedido FROM pedidos WHERE id = ?', [pedido_id]);
        if (pedidoRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Pedido con ID ${pedido_id} no encontrado.` });
        }
        const totalPedido = parseFloat(pedidoRows[0].total_pedido);
        let estadoPedido = pedidoRows[0].estado_pedido;

        // Calcular el saldo actual antes de registrar el nuevo pago
        const { total_pagado_pedido_calculado: totalPagadoAntes } = await calcularSaldoPedido(pedido_id);
        const saldoPendienteAntes = totalPedido - totalPagadoAntes;

        // Validar que el pago no exceda el saldo pendiente
        if (parseFloat(monto) > saldoPendienteAntes) {
            await connection.rollback();
            return res.status(400).json({ message: `El monto del pago ($${parseFloat(monto).toFixed(2)}) excede el saldo pendiente ($${saldoPendienteAntes.toFixed(2)}) del pedido.` });
        }

        // Insertar el nuevo pago
        const [result] = await connection.query(
            'INSERT INTO pagos (pedido_id, monto, metodo_pago, fecha_pago) VALUES (?, ?, ?, NOW())',
            [pedido_id, parseFloat(monto), metodo_pago]
        );
        const pagoId = result.insertId;

        // Recalcular el saldo después del pago
        const { total_pagado_pedido_calculado: totalPagadoDespues, saldo_pendiente_pedido_calculado: saldoPendienteDespues } = await calcularSaldoPedido(pedido_id);

        // Actualizar el estado del pedido si el saldo pendiente es 0 o menos
        if (saldoPendienteDespues <= 0 && estadoPedido !== 'Completado') {
            await connection.query('UPDATE pedidos SET estado_pedido = ? WHERE id = ?', ['Completado', pedido_id]);
            estadoPedido = 'Completado'; // Actualizar el estado local para la respuesta
        } else if (saldoPendienteDespues > 0 && estadoPedido === 'Completado') {
             // Si por alguna razón un pago fue eliminado o ajustado y ahora hay saldo, cambiar a 'Pendiente' o 'Parcialmente Pagado'
            await connection.query('UPDATE pedidos SET estado_pedido = ? WHERE id = ?', ['Pendiente', pedido_id]); // O un estado intermedio
            estadoPedido = 'Pendiente';
        }


        await connection.commit();

        res.status(201).json({
            message: 'Pago registrado exitosamente.',
            pagoId: pagoId,
            saldo_pendiente_calculado_despues_pago: saldoPendienteDespues.toFixed(2),
            estado_pedido_actualizado: estadoPedido
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al registrar pago:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar el pago.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// @desc    Obtener todos los pagos para un pedido específico
// @route   GET /api/pagos/:pedidoId/pagos
// @access  Private (Admin, Empleado, Finanzas)
exports.getPagosByPedidoId = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const [pagos] = await pool.query('SELECT * FROM pagos WHERE pedido_id = ? ORDER BY fecha_pago DESC', [pedidoId]);
        res.status(200).json(pagos);
    } catch (error) {
        console.error('Error al obtener pagos por pedidoId:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener pagos por pedido.' });
    }
};