import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';

// Verificar que la variable de entorno existe
const API_URL = import.meta.env.VITE_API_URL;

// Validacion en desarrollo
if (import.meta.env.DEV) {
  console.log('Modo desarrollo');
  console.log('API URL:', API_URL);
  
  if (!API_URL) {
    console.error('VITE_API_URL no esta definida en el archivo .env');
    console.error('El archivo .env debe estar en la raiz del proyecto:');
    console.error('   front-lista/listas-hanxue/.env');
    console.error('   Contenido del .env:');
    console.error('   VITE_API_URL=https://api-lista.vercel.app');
  }
}

// Valor por defecto en caso de que no exista la variable (solo para desarrollo)
const baseURL = API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de solicitudes
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Error en la solicitud:', error.message);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => {
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(`${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Log del error
    console.error('Error en la respuesta:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    // Manejar error 401 (no autorizado)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Manejar error de red (servidor no disponible)
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout - el servidor no respondio');
    }

    if (!error.response) {
      console.error('Error de red - el backend no esta disponible');
      console.error('URL configurada:', baseURL);
      console.error('Verifica que el backend este corriendo en:', baseURL);
    }

    return Promise.reject(error);
  }
);

export default api;