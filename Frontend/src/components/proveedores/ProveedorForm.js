// frontend/src/components/ProveedorForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// CAMBIO AQUÍ: La ruta ha sido corregida
import { getProveedorById, crearProveedor, actualizarProveedor } from '../../services/proveedoresService'; 

const ProveedorForm = ({ proveedorId, onClose, onSave, onFormSuccess }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombre: '',
        informacion_contacto: '',
        direccion: '',
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (proveedorId) {
            setLoadingData(true);
            getProveedorById(proveedorId)
                .then(data => {
                    setFormData({
                        nombre: data.nombre || '',
                        informacion_contacto: data.informacion_contacto || '',
                        direccion: data.direccion || '',
                        is_active: data.is_active !== undefined ? data.is_active : true 
                    });
                })
                .catch(err => {
                    console.error('Error al cargar los datos del proveedor para edición:', err);
                    toast.error(err.message || 'Error al cargar datos del proveedor.');
                    if (onClose) onClose(); 
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else {
            setLoadingData(false);
            setFormData({
                nombre: '',
                informacion_contacto: '',
                direccion: '',
                is_active: true
            });
        }
    }, [proveedorId, onClose]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (proveedorId) {
                await actualizarProveedor(proveedorId, formData);
                toast.success('¡Proveedor actualizado exitosamente!');
            } else {
                await crearProveedor(formData);
                toast.success('¡Proveedor registrado exitosamente!');
            }
            
            if (onSave) onSave();
            if (onClose) onClose();
            if (onFormSuccess) onFormSuccess();
            
        } catch (error) {
            console.error('Error al guardar el proveedor:', error);
            toast.error(error.message || 'Error al guardar el proveedor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingData) {
        return <div className="text-center p-4">Cargando datos del proveedor...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>{proveedorId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">Nombre del Proveedor</label>
                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        className="form-control"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        autoComplete="organization"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="informacion_contacto" className="form-label">Información de Contacto (Teléfono/Email)</label>
                    <input
                        type="text"
                        id="informacion_contacto"
                        name="informacion_contacto"
                        className="form-control"
                        value={formData.informacion_contacto}
                        onChange={handleChange}
                        required
                        autoComplete="tel"
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="direccion" className="form-label">Dirección (Opcional)</label>
                    <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        className="form-control"
                        value={formData.direccion}
                        onChange={handleChange}
                        autoComplete="street-address"
                    />
                </div>

                {proveedorId && (
                    <div className="mb-3 form-check">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            className="form-check-input"
                            checked={formData.is_active}
                            onChange={handleChange}
                        />
                        <label htmlFor="is_active" className="form-check-label">Activo</label>
                    </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : (proveedorId ? 'Actualizar Proveedor' : 'Registrar Proveedor')}
                </button>
                {onClose ? (
                    <button type="button" onClick={onClose} className="btn btn-secondary ms-2" disabled={isSubmitting}>
                        Cancelar
                    </button>
                ) : (
                    <button type="button" onClick={() => navigate('/providers')} className="btn btn-secondary ms-2" disabled={isSubmitting}>
                        Cancelar
                    </button>
                )}
            </form>
        </div>
    );
};

export default ProveedorForm;