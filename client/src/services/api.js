import axios from 'axios';

const defaultHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
const API_URL = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
  ? import.meta.env.VITE_API_URL
  : `http://${defaultHost}:5000`;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('workwave_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('workwave_token');
      localStorage.removeItem('workwave_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function fileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}

export const AUTH_API = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const USER_API = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  updateProfile: (payload) => api.patch('/users/me/profile', payload),
  updateSettings: (payload) => api.patch('/users/me/settings', payload),
  changePassword: (payload) => api.patch('/users/me/password', payload),
  updateStatus: (status) => api.patch('/users/me/status', { status }),
};

export const CONVERSATION_API = {
  list: () => api.get('/conversations'),
  get: (id) => api.get(`/conversations/${id}`),
  openDirect: (userId) => api.post('/conversations/direct', { userId }),
  createGroup: (payload) => api.post('/conversations/group', payload),
  update: (id, payload) => api.patch(`/conversations/${id}`, payload),
  addMembers: (id, memberIds) => api.post(`/conversations/${id}/members`, { memberIds }),
  removeMember: (id, userId) => api.delete(`/conversations/${id}/members/${userId}`),
  leave: (id) => api.post(`/conversations/${id}/leave`),
  pinned: (id) => api.get(`/conversations/${id}/pinned`),
};

export const MESSAGE_API = {
  history: (conversationId, params) => api.get(`/messages/conversation/${conversationId}`, { params }),
  edit: (id, content) => api.patch(`/messages/${id}`, { content }),
  remove: (id) => api.delete(`/messages/${id}`),
  react: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
  pin: (id) => api.post(`/messages/${id}/pin`),
  forward: (id, targetConversationIds) => api.post(`/messages/${id}/forward`, { targetConversationIds }),
  search: (q, conversationId) => api.get('/messages/search', { params: { q, conversationId } }),
};

export const FILE_API = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress) onProgress(Math.round((evt.loaded * 100) / (evt.total || 1)));
      },
    }),
  shared: (conversationId, category) => api.get(`/files/conversation/${conversationId}`, { params: { category } }),
};

export const CALL_API = {
  history: () => api.get('/calls/history'),
  iceServers: () => api.get('/calls/ice-servers'),
};

export const NOTIFICATION_API = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  markConversationRead: (conversationId) => api.patch(`/notifications/conversation/${conversationId}/read`),
};

export const TEAM_API = {
  list: () => api.get('/teams'),
  create: (payload) => api.post('/teams', payload),
  get: (id) => api.get(`/teams/${id}`),
  delete: (id) => api.delete(`/teams/${id}`),
  addMembers: (id, memberIds) => api.post(`/teams/${id}/members`, { memberIds }),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
};
