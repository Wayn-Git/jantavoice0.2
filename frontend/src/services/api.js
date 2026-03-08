import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('jv_token') || localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jv_token');
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
  profile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const complaintAPI = {
  create: (d, config) => api.post('/complaints', d, config),
  quickFile: d => api.post('/complaints/quick-file', d),
  aiCategorize: d => api.post('/complaints/ai-categorize', d),
  getAll: p => api.get('/complaints', { params: p }),
  getMy: () => api.get('/complaints/my'),
  getStats: () => api.get('/complaints/stats'),
  getById: id => api.get('/complaints/' + id),
  toggleLike: id => api.put('/complaints/' + id + '/like'),
  addComment: (id, d) => api.post('/complaints/' + id + '/comment', d),
  updateStatus: (id, d) => api.put('/complaints/' + id + '/status', d),
  delete: id => api.delete('/complaints/' + id),
  getLetter: id => api.get('/complaints/' + id + '/letter', { responseType: 'blob' }),
};

export const aqiAPI = {
  getByCoords: (lat, lon) => api.get('/aqi', { params: { lat, lon } }),
  getByCity: name => api.get('/aqi/city', { params: { name } }),
  getCities: () => api.get('/aqi/cities'),
  getForecast: (lat, lon) => api.get('/aqi/forecast', { params: { lat, lon } }),
};

export const govAPI = {
  submit: id => api.post('/gov/submit/' + id),
  check: id => api.get('/gov/status/' + id),
  getMyTickets: () => api.get('/gov/my-tickets'),
  trackManual: d => api.post('/gov/track-manual', d),
};

export const automationAPI = {
  getRules: () => api.get('/automation/rules'),
  toggleRule: id => api.put('/automation/rules/' + id),
  getLogs: () => api.get('/automation/logs'),
  runNow: () => api.post('/automation/run-now'),
};

export const callAPI = {
  requestPermission: id => api.post('/calls/' + id + '/request-permission'),
  confirmCall: d => api.post('/calls/confirm-call', d),
  getLog: id => api.get('/calls/' + id),
  getAllLogs: () => api.get('/calls'),
};

export const chatbotAPI = {
  chat: d => api.post('/chatbot/chat', d),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: id => api.put('/notifications/' + id + '/read'),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
