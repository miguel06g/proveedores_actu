// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { loginUser } from '../services/authService'; // Asumimos que tienes un servicio para la API

// 1. Creamos el contexto
export const AuthContext = createContext(null);

// 2. Creamos el proveedor
export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    // --- NUEVO ESTADO DE CARGA ---
    // Inicia en true, porque al principio siempre estamos cargando/verificando la sesión.
    const [cargando, setCargando] = useState(true);

    // Al iniciar la app, verificamos si hay un token y datos en localStorage
    useEffect(() => {
        try {
            const tokenGuardado = localStorage.getItem('token');
            const usuarioGuardado = localStorage.getItem('usuario');

            if (tokenGuardado && usuarioGuardado) {
                // Aquí podrías añadir una llamada para verificar si el token aún es válido contra el backend
                setUsuario(JSON.parse(usuarioGuardado));
            }
        } catch (error) {
            console.error("Fallo al cargar datos de sesión:", error);
            // Si falla, limpiamos todo para evitar un estado inconsistente
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
        } finally {
            // --- IMPORTANTE ---
            // Una vez terminada la verificación, ponemos 'cargando' en false.
            setCargando(false);
        }
    }, []);

    // --- FUNCIÓN LOGOUT ---
    // Definimos logout primero para que esté disponible para el login useCallback
    const logout = useCallback(() => {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        setUsuario(null);
    }, []); // El array de dependencias está vacío porque no depende de ningún estado/prop externo

    // --- FUNCIÓN LOGIN MEJORADA ---
    // Ahora esta función llama a la API y actualiza el estado.
    const login = useCallback(async (email, contrasena) => {
        try {
            const data = await loginUser({ email, contrasena }); // Llama al servicio de API
            const { token, usuario } = data;

            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('token', token);
            setUsuario(usuario);
            
            // Retornamos el usuario para que el componente Login pueda usarlo si lo necesita
            return usuario;
        } catch (error) {
            // Si el login falla, nos aseguramos de que no quede basura en el estado
            logout(); // <-- Aquí se usa 'logout'
            // Propagamos el error para que el componente Login pueda mostrar un toast
            throw error;
        }
    }, [logout]); // <<--- ¡Aquí está la CORRECCIÓN! Añadimos 'logout' como dependencia.

    // Pasamos el nuevo estado 'cargando' en el valor del contexto
    const value = { usuario, cargando, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {/* --- MEJORA ---
                No renderizamos nada hasta que la carga inicial termine, 
                así evitamos parpadeos o errores en las rutas protegidas. 
            */}
            {!cargando && children}
        </AuthContext.Provider>
    );
};

// 3. Custom Hook para consumir el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};