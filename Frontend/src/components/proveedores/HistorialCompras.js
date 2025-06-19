import React, { useState, useEffect, useCallback } from 'react';
// --- PASO 1: IMPORTAMOS useNavigate ---
import { useNavigate } from 'react-router-dom';
// --- CORRECCIÓN AQUÍ: Importar desde historialComprasService ---
import { obtenerHistorialCompras } from '../../services/historialComprasServices'; 

const HistorialCompras = () => {
  // --- PASO 2: INICIALIZAMOS useNavigate ---
  const navigate = useNavigate();

  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarHistorial = useCallback(async () => {
    try {
      setCargando(true);
      const data = await obtenerHistorialCompras();
      setHistorial(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      // El mensaje "Proveedor no encontrado o inactivo" probablemente viene del backend
      // o de una lógica condicional en el servicio si la respuesta es vacía o con cierto error.
      // Aquí puedes mejorar el manejo de errores para ser más específico si es necesario.
      setError(err.message || "No se pudo cargar el historial de compras.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  if (cargando) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando...</span></div></div>;
  }

  if (error) {
    // Mostrar el error que viene de la API o el mensaje por defecto
    return <div className="alert alert-danger mt-4" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Historial de Compras a Proveedores</h2>
        {/* --- PASO 3: AÑADIMOS EL BOTÓN DE VOLVER ---
            Este botón usará la función navigate para volver a la página principal de proveedores.
        */}
        <button onClick={() => navigate('/providers')} className="btn btn-secondary">
          <i className="fas fa-arrow-left me-2"></i>Volver a Proveedores
        </button>
      </div>

      {historial.length === 0 ? (
        <p>No hay compras registradas en el historial.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID Compra</th>
                <th>Fecha</th>
                <th>Materia Prima</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Costo Total</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((compra) => (
                <tr key={compra.id}>
                  <td>{compra.id}</td>
                  <td>{new Date(compra.fecha_compra).toLocaleDateString()}</td>
                  <td>{compra.materia_prima_nombre}</td>
                  <td>{compra.proveedor_nombre}</td>
                  <td>{compra.cantidad}</td>
                  <td>${parseFloat(compra.precio_unitario).toFixed(2)}</td>
                  <td>${(compra.cantidad * compra.precio_unitario).toFixed(2)}</td>
                  <td>{compra.nombre_usuario || 'No disponible'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistorialCompras;