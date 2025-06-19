import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';
import './styles/Modal.css';
import './styles/providers.css';

// --- Importación de Componentes ---
import AppLayout from './components/AppLayout';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory/GestionMateriasPrimas';
import GestionProductosTerminados from './components/Productos/GestionProductosTerminados';
import GestionRecetas from './components/Recetas/GestionRecetas';
import GestionProduccion from './components/Produccion/GestionProduccion';
import Orders from './components/Orders';
import PedidoForm from './components/Pedidos/PedidoForm';
import PedidoDetalle from './components/Pedidos/PedidoDetalle';
import GestionProveedores from './components/proveedores/GestionProveedores'; 
import CompraForm from './components/proveedores/CompraForm';
import HistorialCompras from './components/proveedores/HistorialCompras';
import CrearUsuario from './components/Admin/CrearUsuario';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// --- IMPORTACIÓN DE LA NUEVA PÁGINA DE PAGOS ---

import PagosPage from './components/PagosPage'; // <-- RUTA CORREGIDA
// --- FIN IMPORTACIÓN NUEVA PÁGINA ---

const ROLES = {
    ADMIN: 'Administrador',
    PRODUCCION: 'Líder de Producción',
    BODEGA: 'Líder de Bodega',
    AUXILIAR: 'Auxiliar Administrativo',
    // --- NUEVO ROL SUGERIDO PARA PAGOS ---
    FINANZAS: 'Finanzas', 
    // --- FIN NUEVO ROL ---
};

const HomePage = () => {
    const { usuario, cargando } = useAuth();
    if (cargando) {
        return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    }
    return usuario ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />

                        <Route element={<ProtectedRoute rolesPermitidos={[ROLES.ADMIN, ROLES.BODEGA, ROLES.AUXILIAR]} />}>
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/providers" element={<GestionProveedores />} />
                            <Route path="/register-purchase" element={<CompraForm />} />
                            <Route path="/providers/historial" element={<HistorialCompras />} />
                        </Route>

                        <Route element={<ProtectedRoute rolesPermitidos={[ROLES.ADMIN, ROLES.PRODUCCION]} />}>
                            <Route path="/finished-products" element={<GestionProductosTerminados />} />
                            <Route path="/recetas/:productoId" element={<GestionRecetas />} />
                            <Route path="/production" element={<GestionProduccion />} />
                        </Route>

                        <Route element={<ProtectedRoute rolesPermitidos={[ROLES.ADMIN, ROLES.PRODUCCION, ROLES.AUXILIAR]} />}>
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/orders/new" element={<PedidoForm />} />
                            <Route path="/orders/:id" element={<PedidoDetalle />} />
                        </Route>

                        {/* --- NUEVA RUTA PARA GESTIÓN DE PAGOS --- */}
                        <Route element={<ProtectedRoute rolesPermitidos={[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.FINANZAS]} />}>
                            <Route path="/pagos" element={<PagosPage />} />
                        </Route>
                        {/* --- FIN NUEVA RUTA --- */}

                        <Route element={<ProtectedRoute rolesPermitidos={[ROLES.ADMIN]} />}>
                            <Route path="/admin/crear-usuario" element={<CrearUsuario />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <ToastContainer autoClose={3000} hideProgressBar />
            </Router>
        </AuthProvider>
    );
}

export default App;