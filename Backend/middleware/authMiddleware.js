// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config({ path: './.env' }); // Asegúrate de que .env se cargue para JWT_SECRET

// Middleware para proteger rutas que requieren autenticación
exports.protegerRuta = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const query = `
                SELECT u.id, u.nombre_usuario, u.rol_id, r.nombre_rol
                FROM usuarios u
                JOIN roles r ON u.rol_id = r.id
                WHERE u.id = ?
            `;
            const [rows] = await pool.query(query, [decoded.id]);

            if (rows.length === 0) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado.' });
            }

            req.usuario = rows[0];
            next();

        } catch (error) {
            console.error('Error de autenticación:', error);
            // Si el token es inválido o expiró
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'No autorizado, token expirado.' });
            }
            return res.status(401).json({ message: 'No autorizado, token inválido o error en la verificación.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no se proporcionó un token.' });
    }
};

// Middleware para autorizar basado en roles
exports.autorizar = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.nombre_rol)) {
            return res.status(403).json({ message: 'Acceso denegado. No tienes el rol requerido.' });
        }
        next();
    };
};