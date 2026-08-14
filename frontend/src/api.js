/* Thin API client. The JWT lives in memory and is mirrored to localStorage. */

const BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'portfolio.jwt';

let token = localStorage.getItem(TOKEN_KEY) || null;

/* Uploads are served by the API, so relative asset paths need its origin. */
export function assetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getToken() {
  return token;
}

export function setToken(value) {
  token = value;
  if (value) {
    localStorage.setItem(TOKEN_KEY, value);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) setToken(null);
    throw new ApiError(payload.error || `Request failed (${response.status})`, response.status);
  }
  return payload;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  getProfile: () => request('/profile'),
  updateProfile: (body) => request('/profile', { method: 'PUT', body }),
  setPublished: (isPublished) =>
    request('/profile/publish', { method: 'POST', body: { is_published: isPublished } }),
  uploadPhoto: (file) => request('/profile/photo', { method: 'POST', body: toForm(file), isForm: true }),
  uploadResume: (file) => request('/profile/resume', { method: 'POST', body: toForm(file), isForm: true }),

  list: (section) => request(`/${section}`),
  create: (section, body) => request(`/${section}`, { method: 'POST', body }),
  update: (section, id, body) => request(`/${section}/${id}`, { method: 'PUT', body }),
  remove: (section, id) => request(`/${section}/${id}`, { method: 'DELETE' }),

  publicTemplates: () => request('/templates'),
  portfolio: (studentId) => request(`/portfolio/${encodeURIComponent(studentId)}`),

  adminStudents: () => request('/admin/students'),
  adminCreateStudent: (body) => request('/admin/students', { method: 'POST', body }),
  adminUpdateStudent: (id, body) => request(`/admin/students/${id}`, { method: 'PATCH', body }),
  adminDeleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
  adminProfiles: () => request('/admin/profiles'),
  adminTemplates: () => request('/admin/templates'),
  adminCreateTemplate: (body) => request('/admin/templates', { method: 'POST', body }),
  adminUpdateTemplate: (id, body) => request(`/admin/templates/${id}`, { method: 'PATCH', body }),
};

function toForm(file) {
  const form = new FormData();
  form.append('file', file);
  return form;
}
