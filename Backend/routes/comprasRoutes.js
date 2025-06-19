const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/comprasController');
const { protegerRuta, autorizar } = require('../middleware/authMiddleware');

const ROLES_PERMITIDOS = ['Administrador', 'Líder de Bodega'];

router.post(
    '/registrar',
    protegerRuta,
    autorizar(ROLES_PERMITIDOS),
    comprasController.registrarCompra
);

module.exports = router;