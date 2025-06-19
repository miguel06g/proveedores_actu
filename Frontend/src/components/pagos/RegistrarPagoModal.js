// frontend/src/components/pagos/RegistrarPagoModal.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // Para notificaciones
import { registrarPago, obtenerPedidosPendientes } from '../../services/pagosService'; // Importa las funciones del servicio

const RegistrarPagoModal = ({ onClose, onSave }) => {
    const [pagoData, setPagoData] = useState({
        pedido_id: '',
        monto: '',
        metodo_pago: 'Efectivo', // Valor por defecto
    });
    const [pedidosPendientes, setPedidosPendientes] = useState([]);
    const [loadingPedidos, setLoadingPedidos] = useState(true);
    const [errorPedidos, setErrorPedidos] = useState(null);

    // Carga los pedidos con saldo pendiente al montar el modal
    useEffect(() => {
        const fetchPedidos = async () => {
            try {
                const data = await obtenerPedidosPendientes();
                setPedidosPendientes(data);
                // Si solo hay un pedido pendiente, seleccionarlo por defecto
                if (data.length === 1) {
                    setPagoData(prev => ({ ...prev, pedido_id: data[0].id }));
                }
            } catch (err) {
                setErrorPedidos('Error al cargar pedidos. Asegúrate de que el backend de pedidos esté funcionando y las APIs sean correctas.');
                console.error('Error fetching pedidos:', err);
            } finally {
                setLoadingPedidos(false);
            }
        };
        fetchPedidos();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPagoData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Asegurarse de que el monto sea un número y positivo
            const montoNumerico = parseFloat(pagoData.monto);
            if (isNaN(montoNumerico) || montoNumerico <= 0) {
                Swal.fire('Advertencia', 'El monto debe ser un número positivo.', 'warning');
                return;
            }

            // Opcional: Validar que el monto no exceda el saldo pendiente si se ha seleccionado un pedido
            const pedidoSeleccionado = pedidosPendientes.find(p => p.id === parseInt(pagoData.pedido_id));
            if (pedidoSeleccionado && montoNumerico > pedidoSeleccionado.saldo_pendiente) {
                 Swal.fire('Advertencia', `El monto del pago ($${montoNumerico.toFixed(2)}) excede el saldo pendiente ($${pedidoSeleccionado.saldo_pendiente.toFixed(2)}) de este pedido.`, 'warning');
                 return;
            }


            await registrarPago({ ...pagoData, monto: montoNumerico }); // Envía el monto como número
            Swal.fire('¡Éxito!', 'Pago registrado exitosamente.', 'success');
            onSave(); // Llama a la función para recargar la lista de pagos en el componente padre
            onClose(); // Cierra el modal
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'auto', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Registrar Nuevo Pago</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="pedido_id" className="form-label">Pedido Asociado</label>
                                {loadingPedidos ? (
                                    <p>Cargando pedidos...</p>
                                ) : errorPedidos ? (
                                    <p className="text-danger">{errorPedidos}</p>
                                ) : (
                                    <select
                                        className="form-select"
                                        id="pedido_id"
                                        name="pedido_id"
                                        value={pagoData.pedido_id}
                                        onChange={handleChange}
                                        required
                                        disabled={pedidosPendientes.length === 0} // Deshabilita si no hay pedidos
                                    >
                                        <option value="">Selecciona un pedido</option>
                                        {pedidosPendientes.map(pedido => (
                                            <option key={pedido.id} value={pedido.id}>
                                                Pedido #{pedido.id} - Total: ${parseFloat(pedido.total_pedido).toFixed(2)} - Saldo Pendiente: ${parseFloat(pedido.saldo_pendiente).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {pedidosPendientes.length === 0 && !loadingPedidos && !errorPedidos && (
                                    <p className="text-info mt-2">No hay pedidos con saldo pendiente para registrar pagos.</p>
                                )}
                            </div>
                            <div className="mb-3">
                                <label htmlFor="monto" className="form-label">Monto del Pago</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="monto"
                                    name="monto"
                                    value={pagoData.monto}
                                    onChange={handleChange}
                                    step="0.01" // Permite decimales
                                    min="0.01" // Asegura un monto positivo
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="metodo_pago" className="form-label">Método de Pago</label>
                                <select
                                    className="form-select"
                                    id="metodo_pago"
                                    name="metodo_pago"
                                    value={pagoData.metodo_pago}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Crédito">Crédito</option>
                                    {/* Puedes añadir más métodos si los manejas en tu BD */}
                                </select>
                            </div>
                            <div className="d-flex justify-content-end">
                                <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={pedidosPendientes.length === 0}>Registrar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrarPagoModal;