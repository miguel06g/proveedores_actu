require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// --- CORRECCIÓN: Asegurémonos de que todas las rutas se importen ---
console.log('Cargando rutas...');
const authRoutes = require('./routes/authRoutes');
const materiaPrimaRoutes = require('./routes/materiaPrimaRoutes');
const productosTerminadosRoutes = require('./routes/productosTerminadosRoutes');
const proveedoresRoutes = require('./routes/proveedoresRoutes');
const movimientosInventarioRoutes = require('./routes/movimientosInventarioRoutes');
const alertasRoutes = require('./routes/alertasRoutes');
const lotesRoutes = require('./routes/lotesRoutes');
const comprasRoutes = require('./routes/comprasRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const recetasRoutes = require('./routes/recetasRoutes');
const produccionRoutes = require('./routes/produccionRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const pagosRoutes = require('./routes/pagosRoutes');
// Agrega aquí cualquier otro archivo de rutas que tengas

// Usar las rutas con sus prefijos de API
app.use('/api/auth', authRoutes);
app.use('/api/materias-primas', materiaPrimaRoutes);
app.use('/api/productos-terminados', productosTerminadosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/movimientos', movimientosInventarioRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/recetas', recetasRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/roles', rolesRoutes); 
app.use('/api/pagos', pagosRoutes);
// ...

// Ruta de prueba para verificar que el servidor está vivo
app.get('/', (req, res) => {
  res.send('API de Stocket funcionando correctamente.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});