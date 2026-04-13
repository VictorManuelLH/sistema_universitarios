const API_URL = '/api';

const getToken = () => localStorage.getItem('token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const config = {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, config);
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend este corriendo.');
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('El backend no está corriendo. Inicia el servidor y asegúrate de que MongoDB esté activo.');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Error en la peticion');
  }

  return data;
};

const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

export default api;
