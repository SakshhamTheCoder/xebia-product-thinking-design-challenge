import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    const message = data?.message || err.message || 'Something went wrong';
    const normalized = new Error(message);
    normalized.fieldErrors = data?.errors || null;
    return Promise.reject(normalized);
  }
);

export default client;
