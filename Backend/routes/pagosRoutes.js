// backend/routes/pagosRoutes.js
const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');
// const authMiddleware = require('../middleware/authMiddleware'); // Comenta o elimina esta línea

// Rutas para pagos (SIN MIDDLEWARES POR AHORA)
router.get('/', pagosController.getPagos); // <-- Solo el controlador
router.post('/', pagosController.registrarPago); // <-- Solo el controlador
router.get('/:pedidoId/pagos', pagosController.getPagosByPedidoId); // <-- Solo el controlador

module.exports = router;