const express = require("express");
const router = express.Router();
const proveedorController = require("../controllers/proveedorController");
const { protegerRuta, autorizar } = require("../middleware/authMiddleware");

// --- Definición de Roles ---
const ROLES_MODIFICAR = ['Administrador', 'Líder de Bodega'];
const ROLES_VISUALIZAR = ['Administrador', 'Líder de Bodega', 'Líder de Producción', 'Auxiliar Administrativo'];

// Middleware de protección para todas las rutas en este archivo si aplica
// router.use(protegerRuta);
// router.use(autorizar(ROLES_VISUALIZAR)); // O el rol base más permisivo

// --- Rutas ESPECÍFICAS (con segmentos fijos) - ¡DEBEN IR PRIMERO! ---

// GET /api/proveedores/compras -> Obtiene el historial de compras
router.get("/compras", protegerRuta, autorizar(ROLES_VISUALIZAR), proveedorController.obtenerHistorialCompras);

// POST /api/proveedores/registrar-compra (Si es diferente a /api/compras/registrar)
// NOTA: Si usas /api/compras/registrar para todas las compras (como en tu comprasRoutes.js),
// esta ruta de registro de compra de proveedor aquí podría ser redundante o generar confusión.
// Si registrarCompra es *solo* para proveedores, puedes mover su controller a aqui
// router.post("/registrar-compra", protegerRuta, autorizar(ROLES_MODIFICAR), proveedorController.registrarCompra);

// GET /api/proveedores/comparar-precios -> Compara precios
router.get("/comparar-precios", protegerRuta, autorizar(ROLES_VISUALIZAR), proveedorController.compararPrecios);

// --- Rutas CRUD de Proveedores (genéricas sin ID, luego con ID) ---

// GET /api/proveedores/ -> Obtiene la lista de todos los proveedores ACTIVOS
router.get("/", protegerRuta, autorizar(ROLES_VISUALIZAR), proveedorController.obtenerProveedores);

// POST /api/proveedores/ -> Registra un nuevo proveedor
router.post("/", protegerRuta, autorizar(ROLES_MODIFICAR), proveedorController.registrarProveedor);

// --- Rutas con PARÁMETROS DINÁMICOS (:id) - ¡DEBEN IR ÚLTIMAS EN ESTE GRUPO! ---

// GET /api/proveedores/:id -> Obtiene los detalles de un proveedor específico (ACTIVO)
router.get("/:id", protegerRuta, autorizar(ROLES_VISUALIZAR), proveedorController.getProveedorById);

// PUT /api/proveedores/:id -> Actualiza los datos de un proveedor existente
router.put("/:id", protegerRuta, autorizar(ROLES_MODIFICAR), proveedorController.actualizarProveedor);

// DELETE /api/proveedores/:id -> "Elimina" (inactiva) un proveedor (Soft Delete)
router.delete("/:id", protegerRuta, autorizar(ROLES_MODIFICAR), proveedorController.eliminarProveedor);


module.exports = router;