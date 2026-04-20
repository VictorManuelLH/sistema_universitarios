import { auth } from '../firebase';

const API_URL = '/api';

const getToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) return await currentUser.getIdToken();
  return null;
};

const request = async (endpoint, options = {}) => {
  const token = await getToken();
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
    throw new Error('No se pudo conectar con el servidor.');
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Error al procesar la respuesta del servidor.');
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
