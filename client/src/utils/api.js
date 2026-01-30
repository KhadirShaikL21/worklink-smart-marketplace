import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/refresh`, { 
        refreshToken: localStorage.getItem('refreshToken') 
      }, {
        withCredentials: true
      })
      .then(res => res.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      // Prevent infinite loops if verify/refresh endpoint itself turns 401
      if (original.url.includes('/auth/refresh') || original.url.includes('/auth/login') || original.url.includes('/auth/register')) {
         return Promise.reject(error);
      }

      original._retry = true;
      try {
        const data = await refreshToken();
        if (data?.accessToken) {
          accessToken = data.accessToken;
          localStorage.setItem('refreshToken', data.refreshToken || localStorage.getItem('refreshToken'));
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        }
      } catch (err) {
        // fall through
      }
    }
    return Promise.reject(error);
  }
);

export default api;
