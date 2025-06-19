import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; 
import ProveedorForm from './ProveedorForm'; 
import { obtenerProveedores, eliminarProveedor } from '../../services/proveedoresService'; 
// --- NUEVA IMPORTACIÓN DE ICONOS ---
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importa los iconos de lápiz para editar y papelera para inactivar
// --- FIN NUEVA IMPORTACIÓN ---

const GestionProveedores = () => {
    const navigate = useNavigate();
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProveedorId, setEditingProveedorId] = useState(null);

    const fetchProveedores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await obtenerProveedores();
            setProveedores(data); 
        } catch (err) {
            console.error("Error al obtener proveedores:", err);
            setError("No se pudieron cargar los proveedores.");
            Swal.fire('Error', err.message || 'No se pudieron cargar los proveedores.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    const handleNewProveedorClick = () => {
        setEditingProveedorId(null);
        setShowFormModal(true);
    };

    const handleEditClick = (id) => {
        setEditingProveedorId(id);
        setShowFormModal(true);
    };

    const handleDeleteClick = async (id, nombreProveedor) => {
        Swal.fire({
            title: `¿Estás seguro de inactivar a ${nombreProveedor}?`,
            text: "¡No podrás revertir esto directamente desde aquí! El proveedor dejará de aparecer en las listas activas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, inactivar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await eliminarProveedor(id);
                    Swal.fire(
                        '¡Inactivado!',
                        'El proveedor ha sido inactivado correctamente.',
                        'success'
                    );
                    fetchProveedores();
                } catch (err) {
                    console.error("Error al inactivar proveedor:", err);
                    Swal.fire(
                        'Error',
                        err.message || 'No se pudo inactivar el proveedor.',
                        'error'
                    );
                }
            }
        });
    };

    const handleFormSave = () => {
        fetchProveedores();
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingProveedorId(null);
    };

    if (loading) {
        return <div className="text-center p-4">Cargando proveedores...</div>;
    }

    if (error) {
        return <div className="text-center p-4 text-danger">{error}</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Proveedores</h2>
                <div className="d-flex justify-content-between mb-3">
                    <button className="btn btn-primary" onClick={handleNewProveedorClick}>
                        Registrar Proveedor
                    </button>
                    {/* Botón Registrar Compra */}
                    <button className="btn btn-success" onClick={() => navigate('/register-purchase')}>Registrar Compra</button>
                    {/* Botón Historial de Compras */}
                    <button className="btn btn-info" onClick={() => navigate('/providers/historial')}>Historial de Compras</button>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>Regresar</button>
                </div>
            </div>

            {proveedores.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Contacto</th>
                                <th>Dirección</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proveedores.map((proveedor) => (
                                <tr key={proveedor.id}>
                                    <td>{proveedor.id}</td>
                                    <td>{proveedor.nombre}</td>
                                    <td>{proveedor.informacion_contacto}</td>
                                    <td>{proveedor.direccion}</td>
                                    <td>{proveedor.is_active ? 'Activo' : 'Inactivo'}</td>
                                    {/* --- CELDAS DE ACCIONES MODIFICADAS --- */}
                                    <td className="d-flex justify-content-center align-items-center"> 
                                        {/* Botón Editar */}
                                        <button
                                            className="circular-icon-button yellow" 
                                            onClick={() => handleEditClick(proveedor.id)}
                                            title="Editar Proveedor" 
                                            style={{ marginRight: '25px' }} // <--- ¡CAMBIADO A '15px'!
                                        >
                                            <FaEdit /> 
                                        </button>

                                        {/* Botón Inactivar */}
                                        <button
                                            className="circular-icon-button red" 
                                            onClick={() => handleDeleteClick(proveedor.id, proveedor.nombre)}
                                            title="Inactivar Proveedor" 
                                        >
                                            <FaTrashAlt /> 
                                        </button>
                                    </td>
                                    {/* --- FIN CELDAS DE ACCIONES MODIFICADAS --- */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center">No hay proveedores registrados o activos.</p>
            )}

            {showFormModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'auto', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editingProveedorId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Cerrar"></button>
                            </div>
                            <div className="modal-body">
                                <ProveedorForm 
                                    proveedorId={editingProveedorId}
                                    onClose={handleCloseModal}
                                    onSave={handleFormSave}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionProveedores;