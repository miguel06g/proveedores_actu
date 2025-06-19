// frontend/src/pages/PagosPage.js
import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { getPagos } from '../services/pagosService'; // Importa la función para obtener pagos
import RegistrarPagoModal from '../components/pagos/RegistrarPagoModal'; // Importa el modal de registro
import { useNavigate } from 'react-router-dom'; // Para el botón de regresar

const PagosPage = () => {
    const navigate = useNavigate(); // Hook para la navegación
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRegistroModal, setShowRegistroModal] = useState(false); // Estado para mostrar/ocultar el modal
    const [filters, setFilters] = useState({
        pedidoId: '',
        metodoPago: '',
        fechaDesde: '',
        fechaHasta: ''
    });

    // Función para obtener pagos con filtros, memoizada con useCallback
    const fetchPagos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPagos(filters); // Llama al servicio con los filtros actuales
            setPagos(data);
        } catch (err) {
            console.error("Error al obtener pagos:", err);
            setError("No se pudieron cargar los pagos. " + (err.message || ''));
            Swal.fire('Error', err.message || 'No se pudieron cargar los pagos.', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]); // Dependencia: re-ejecutar cuando los filtros cambien

    // Efecto para cargar los pagos cuando el componente se monta o los filtros cambian
    useEffect(() => {
        fetchPagos();
    }, [fetchPagos]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            pedidoId: '',
            metodoPago: '',
            fechaDesde: '',
            fechaHasta: ''
        });
    };

    const handleRegistroClick = () => {
        setShowRegistroModal(true); // Muestra el modal de registro
    };

    const handleCloseRegistroModal = () => {
        setShowRegistroModal(false); // Oculta el modal de registro
    };

    const handleSavePago = () => {
        fetchPagos(); // Recarga la lista de pagos después de registrar uno nuevo
    };

    if (loading) {
        return <div className="text-center p-4">Cargando pagos...</div>;
    }

    if (error) {
        return <div className="text-center p-4 text-danger">{error}</div>;
    }

    return (
        <div className="page-container"> {/* Asumo que tienes una clase para el contenedor principal */}
            <div className="page-header">
                <h2>Gestión de Pagos</h2>
                <div className="d-flex justify-content-between mb-3">
                    <button className="btn btn-primary" onClick={handleRegistroClick}>
                        Registrar Nuevo Pago
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>Regresar</button> {/* Botón para volver */}
                </div>
            </div>

            {/* Sección de Filtros */}
            <div className="card mb-4 p-3">
                <h5 className="card-title">Filtros de Búsqueda</h5>
                <div className="row g-3">
                    <div className="col-md-3">
                        <label htmlFor="filterPedidoId" className="form-label">ID Pedido</label>
                        <input
                            type="text"
                            className="form-control"
                            id="filterPedidoId"
                            name="pedidoId"
                            value={filters.pedidoId}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="filterMetodoPago" className="form-label">Método de Pago</label>
                        <select
                            className="form-select"
                            id="filterMetodoPago"
                            name="metodoPago"
                            value={filters.metodoPago}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todos</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Crédito">Crédito</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="filterFechaDesde" className="form-label">Fecha Desde</label>
                        <input
                            type="date"
                            className="form-control"
                            id="filterFechaDesde"
                            name="fechaDesde"
                            value={filters.fechaDesde}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <label htmlFor="filterFechaHasta" className="form-label">Fecha Hasta</label>
                        <input
                            type="date"
                            className="form-control"
                            id="filterFechaHasta"
                            name="fechaHasta"
                            value={filters.fechaHasta}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div className="col-12 d-flex justify-content-end">
                        <button className="btn btn-outline-secondary" onClick={handleClearFilters}>Limpiar Filtros</button>
                    </div>
                </div>
            </div>

            {/* Tabla de Pagos */}
            {pagos.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>ID Pago</th>
                                <th>ID Pedido</th>
                                <th>Monto</th>
                                <th>Fecha Pago</th>
                                <th>Método</th>
                                <th>Total Pedido</th>
                                <th>Total Pagado (Acumulado)</th>
                                <th>Saldo Pendiente (Calculado)</th>
                                <th>Estado Pedido Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagos.map((pago) => (
                                <tr key={pago.id}>
                                    <td>{pago.id}</td>
                                    <td>{pago.pedido_id}</td>
                                    <td>${parseFloat(pago.monto).toFixed(2)}</td>
                                    <td>{new Date(pago.fecha_pago).toLocaleString()}</td>
                                    <td>{pago.metodo_pago}</td>
                                    <td>${parseFloat(pago.total_pedido).toFixed(2)}</td>
                                    <td>${parseFloat(pago.total_pagado_pedido_calculado).toFixed(2)}</td>
                                    <td>${parseFloat(pago.saldo_pendiente_pedido_calculado).toFixed(2)}</td>
                                    <td>{pago.estado_pedido_actual}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center">No hay pagos registrados con los filtros actuales.</p>
            )}

            {/* Modal de Registro de Pago (condicional) */}
            {showRegistroModal && (
                <RegistrarPagoModal
                    onClose={handleCloseRegistroModal}
                    onSave={handleSavePago}
                />
            )}
        </div>
    );
};

export default PagosPage;