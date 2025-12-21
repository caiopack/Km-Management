import axios from 'axios';

const api = axios.create({
  // CORREÇÃO: Removido o '/api' do final para alinhar com o Backend
  baseURL: 'http://localhost:8080', 
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor de request: adiciona o token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: captura 401 e força logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Limpa dados do usuário também
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;