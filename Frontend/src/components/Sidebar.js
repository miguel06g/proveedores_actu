import React, { useState } from 'react';
// Asegúrate de importar useLocation de react-router-dom
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const ROLES = {
    ADMIN: 'Administrador',
    PRODUCCION: 'Líder de Producción',
    BODEGA: 'Líder de Bodega',
    AUXILIAR: 'Auxiliar Administrativo',
    FINANZAS: 'Finanzas', // <-- Asegúrate de que este rol esté aquí
};

const Sidebar = () => {
    const { usuario, logout } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation(); // <-- ¡Importante! Aquí se inicializa useLocation

    if (!usuario) { return null; }

    const puedeVerInventarioYProveedores = [ROLES.ADMIN, ROLES.BODEGA, ROLES.AUXILIAR].includes(usuario.rol_nombre);
    const puedeVerProduccionYProductos = [ROLES.ADMIN, ROLES.PRODUCCION].includes(usuario.rol_nombre);
    const puedeVerPedidos = [ROLES.ADMIN, ROLES.PRODUCCION, ROLES.AUXILIAR].includes(usuario.rol_nombre);
    const esAdmin = usuario.rol_nombre === ROLES.ADMIN;
    // Lógica para determinar si el usuario tiene acceso a la sección de Pagos
    const puedeVerPagos = [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.FINANZAS].includes(usuario.rol_nombre);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
            <div className="sidebar-header">
                <h3 className="sidebar-title">{isSidebarOpen ? 'Stocket' : 'S'}</h3>
                <button onClick={toggleSidebar} className="sidebar-toggle">
                    <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>
            </div>
            <nav className="sidebar-nav">
                {/* Dashboard */}
                <NavLink
                    to="/dashboard"
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                    <i className="fas fa-th-large"></i>
                    <span>Dashboard</span>
                </NavLink>

                {/* Inventario y Proveedores */}
                {puedeVerInventarioYProveedores && (
                    <>
                        <NavLink
                            to="/inventory"
                            className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}
                        >
                            <i className="fas fa-boxes"></i>
                            <span>Inventario</span>
                        </NavLink>
                        <NavLink
                            to="/providers"
                            className={`nav-link ${location.pathname.startsWith('/providers') || location.pathname.startsWith('/register-purchase') ? 'active' : ''}`}
                        >
                            <i className="fas fa-truck-loading"></i>
                            <span>Proveedores</span>
                        </NavLink>
                    </>
                )}

                {/* Productos y Producción */}
                {puedeVerProduccionYProductos && (
                    <>
                        <NavLink
                            to="/finished-products"
                            className={`nav-link ${location.pathname === '/finished-products' ? 'active' : ''}`}
                        >
                            <i className="fas fa-cookie-bite"></i>
                            <span>Productos</span>
                        </NavLink>
                        <NavLink
                            to="/production"
                            className={`nav-link ${location.pathname.startsWith('/production') || location.pathname.startsWith('/recetas') ? 'active' : ''}`}
                        >
                            <i className="fas fa-industry"></i>
                            <span>Producción</span>
                        </NavLink>
                    </>
                )}

                {/* Pedidos */}
                {puedeVerPedidos && (
                    <NavLink
                        to="/orders"
                        className={`nav-link ${location.pathname.startsWith('/orders') ? 'active' : ''}`}
                    >
                        <i className="fas fa-clipboard-list"></i>
                        <span>Pedidos</span>
                    </NavLink>
                )}

                {/* --- NUEVO ELEMENTO DE NAVEGACIÓN PARA PAGOS --- */}
                {puedeVerPagos && (
                    <NavLink
                        to="/pagos"
                        className={`nav-link ${location.pathname === '/pagos' ? 'active' : ''}`}
                    >
                        <i className="fas fa-dollar-sign"></i> {/* O el ícono que prefieras */}
                        <span>Pagos</span>
                    </NavLink>
                )}
                {/* --- FIN NUEVO ELEMENTO --- */}

                {/* Admin Usuarios */}
                {esAdmin && (
                    <NavLink
                        to="/admin/crear-usuario"
                        className={`nav-link ${location.pathname === '/admin/crear-usuario' ? 'active' : ''}`}
                    >
                        <i className="fas fa-user-plus"></i>
                        <span>Admin Usuarios</span>
                    </NavLink>
                )}
            </nav>
            <div className="sidebar-footer">
                <div className="user-info">
                    <i className="fas fa-user-circle"></i>
                    <div className="user-details">
                        <span className="user-name">{usuario.nombre_usuario}</span>
                        <span className="user-role">{usuario.rol_nombre}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;