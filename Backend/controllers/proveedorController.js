const pool = require("../config/db");

// --- Obtener lista de proveedores (Solo Activos) ---
// Modificado para obtener solo los proveedores con is_active = TRUE
exports.obtenerProveedores = async (req, res) => {
  try {
    const [proveedores] = await pool.query(
      `SELECT id, nombre, informacion_contacto, direccion, is_active FROM proveedores WHERE is_active = TRUE ORDER BY nombre ASC`
    );
    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

// --- Obtener un Proveedor por ID (Solo si está Activo) ---
// Nueva función para obtener un proveedor específico por su ID
exports.getProveedorById = async (req, res) => {
    try {
        const { id } = req.params;
        const [proveedor] = await pool.query(
            `SELECT id, nombre, informacion_contacto, direccion, is_active FROM proveedores WHERE id = ? AND is_active = TRUE`,
            [id]
        );
        if (proveedor.length === 0) {
            return res.status(404).json({ message: 'Proveedor no encontrado o inactivo' });
        }
        res.json(proveedor[0]);
    } catch (error) {
        console.error('Error al obtener proveedor por ID:', error);
        res.status(500).json({ error: 'Error al obtener el proveedor' });
    }
};

// --- Registrar nuevo proveedor ---
// Mantenido como estaba, la columna is_active es TRUE por defecto en la DB
exports.registrarProveedor = async (req, res) => {
  try {
    const { nombre, informacion_contacto, direccion } = req.body;
    if (!nombre || !informacion_contacto) {
        return res.status(400).json({ message: "Nombre e información de contacto son obligatorios." });
    }
    const query = `INSERT INTO proveedores (nombre, informacion_contacto, direccion) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [nombre, informacion_contacto, direccion || null]);
    res.status(201).json({ message: 'Proveedor registrado exitosamente', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un proveedor con ese nombre o contacto.' });
    }
    console.error('Error al registrar proveedor:', error);
    res.status(500).json({ error: "Error interno al registrar proveedor" });
  }
};

// --- Actualizar Proveedor ---
// Nueva función para actualizar los datos de un proveedor, incluyendo su estado de actividad
exports.actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        // Ahora también esperamos is_active en el body para permitir re-activación
        const { nombre, informacion_contacto, direccion, is_active } = req.body; 

        if (!nombre || !informacion_contacto) {
            return res.status(400).json({ message: "Nombre e información de contacto son obligatorios." });
        }

        // Determina si is_active se envió para incluirlo en la actualización
        let query;
        let queryParams;

        if (typeof is_active === 'boolean') { // Si is_active se envía y es un booleano
             query = `UPDATE proveedores SET nombre = ?, informacion_contacto = ?, direccion = ?, is_active = ? WHERE id = ?`;
             queryParams = [nombre, informacion_contacto, direccion || null, is_active, id];
        } else { // Si is_active NO se envía, solo actualiza los otros campos
             query = `UPDATE proveedores SET nombre = ?, informacion_contacto = ?, direccion = ? WHERE id = ?`;
             queryParams = [nombre, informacion_contacto, direccion || null, id];
        }
       
        const [result] = await pool.query(query, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Proveedor no encontrado para actualizar.' });
        }

        res.json({ message: 'Proveedor actualizado exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya existe otro proveedor con ese nombre o contacto.' });
        }
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ error: 'Error interno al actualizar proveedor' });
    }
};

// --- "Eliminar" Proveedor (Soft Delete) ---
// Modificado para realizar un UPDATE de is_active a FALSE
exports.eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params;

        // Marcamos el proveedor como inactivo (soft delete)
        // Solo desactiva si el proveedor está actualmente activo
        const query = `UPDATE proveedores SET is_active = FALSE WHERE id = ? AND is_active = TRUE`; 
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            // Esto significa que el proveedor no existe o ya estaba inactivo
            return res.status(404).json({ message: 'Proveedor no encontrado o ya estaba inactivo.' });
        }

        res.json({ message: 'Proveedor "eliminado" (inactivado) exitosamente.' });
    } catch (error) {
        console.error('Error al inactivar proveedor:', error);
        res.status(500).json({ error: 'Error interno al inactivar proveedor.' });
    }
};


// --- Registrar nueva compra (lote de materia prima) ---
// Se añadió validación para proveedor activo
exports.registrarCompra = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { proveedor_id, materia_prima_id, cantidad, precio_unitario, fecha_compra, fecha_expiracion } = req.body;
    // Asumiendo que req.usuario.id ya está definido por algún middleware de autenticación
    const usuario_id = req.usuario ? req.usuario.id : null; // Añadido un fallback por si req.usuario no está definido

    if (!proveedor_id || !materia_prima_id || !cantidad || !precio_unitario || !fecha_compra) {
      return res.status(400).json({ message: "Faltan datos obligatorios para la compra." });
    }

    // --- Validar que el proveedor esté ACTIVO antes de registrar una compra ---
    const [proveedor] = await connection.query('SELECT is_active FROM proveedores WHERE id = ?', [proveedor_id]);
    if (proveedor.length === 0 || !proveedor[0].is_active) {
        throw new Error('Proveedor no encontrado o inactivo. No se puede registrar la compra.');
    }
    // --- Fin de validación de proveedor activo ---

    const [materia] = await connection.query('SELECT nombre FROM materias_primas WHERE id = ?', [materia_prima_id]);
    if (materia.length === 0) throw new Error('Materia prima no encontrada.');
    const materia_prima_nombre = materia[0].nombre;

    const costo_compra = parseFloat(cantidad) * parseFloat(precio_unitario);

    const [loteResult] = await connection.query(
      'INSERT INTO lotes_materias_primas (materia_prima_nombre, proveedor_id, cantidad_ingresada, stock_lote, costo_compra, fecha_expiracion) VALUES (?, ?, ?, ?, ?, ?)',
      [materia_prima_nombre, proveedor_id, cantidad, cantidad, costo_compra, fecha_expiracion || null]
    );
    const lote_id = loteResult.insertId;

    await connection.query(
      'INSERT INTO compras_proveedores (proveedor_id, materia_prima_nombre, cantidad, precio_unitario, fecha_compra, lote_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [proveedor_id, materia_prima_nombre, cantidad, precio_unitario, fecha_compra, lote_id, usuario_id]
    );

    // Se añade el movimiento de inventario para que el trigger actualice el stock general.
    await connection.query(
        'INSERT INTO movimientos_inventario_mp (lote_id, tipo_movimiento, cantidad, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)',
        [lote_id, 'entrada', cantidad, `Entrada por compra al proveedor ID: ${proveedor_id}`, usuario_id]
    );

    await connection.commit();
    res.status(201).json({ message: 'Compra y lote registrados exitosamente', id_lote: lote_id });

  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar la compra:', error);
    res.status(500).json({ error: 'Error al registrar la compra', details: error.message });
  } finally {
    connection.release();
  }
};

// --- Obtener historial de compras ---
// Mantenido sin cambios
exports.obtenerHistorialCompras = async (req, res) => {
  console.log("1. Petición recibida en 'obtenerHistorialCompras'.");
  try {
    const query = `
      SELECT
        c.id,
        p.nombre AS proveedor_nombre,
        c.materia_prima_nombre,
        c.cantidad,
        c.precio_unitario,
        (c.cantidad * c.precio_unitario) AS costo_total,
        c.fecha_compra,
        c.lote_id,
        c.usuario_id,
        u.nombre_usuario,
        u.apellido
      FROM compras_proveedores c
      JOIN proveedores p ON p.id = c.proveedor_id
      LEFT JOIN usuarios u ON u.id = c.usuario_id
      ORDER BY c.fecha_compra DESC
    `;
    console.log("2. Ejecutando consulta a la base de datos...");
    const [rows] = await pool.query(query);
    console.log("3. Consulta finalizada. Se encontraron " + rows.length + " registros.");
    res.json(rows);
    console.log("4. Respuesta JSON enviada al frontend.");
  } catch (error) {
    console.error("¡ERROR en obtenerHistorialCompras!:", error);
    res.status(500).json({
      error: "Error al obtener historial de compras",
      details: error.message
    });
  }
};

// --- Comparar precios por producto ---
// Mantenido sin cambios
exports.compararPrecios = async (req, res) => {
    // Tu función existente aquí. Puedes devolver un 501 si aún no la tienes implementada
    res.status(501).json({ message: "Función compararPrecios no implementada aún." });
};