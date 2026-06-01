import axios from 'axios'

// ── Client Axios ──────────────────────────────────────────────────────────────
const api = axios.create({
  // Next.js rewrite: /api/v1/* → http://localhost:8000/api/v1/*
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pct_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pct_token')
      localStorage.removeItem('pct_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  // Le backend attend { login, password } — on traduit ici depuis mot_de_passe
  login:  (data: { login: string; mot_de_passe: string }) =>
    api.post('/login', { login: data.login, password: data.mot_de_passe }),
  me:     () => api.get('/me'),
  logout: () => api.post('/logout'),
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  global:    () => api.get('/dashboard'),
  monEspace: () => api.get('/mon-espace'),
}

// ── DEPARTEMENTS ──────────────────────────────────────────────────────────────
export const departementsApi = {
  list:   () => api.get('/departements'),
  get:    (id: number) => api.get(`/departements/${id}`),
  create: (data: Record<string, unknown>) => api.post('/departements', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/departements/${id}`, data),
  delete: (id: number) => api.delete(`/departements/${id}`),
}

// ── ENSEIGNANTS ───────────────────────────────────────────────────────────────
export const enseignantsApi = {
  list:   (params?: Record<string, unknown>) => api.get('/enseignants', { params }),
  get:    (id: number) => api.get(`/enseignants/${id}`),
  create: (data: Record<string, unknown>) => api.post('/enseignants', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/enseignants/${id}`, data),
  delete: (id: number) => api.delete(`/enseignants/${id}`),
}

// ── COURS ─────────────────────────────────────────────────────────────────────
export const coursApi = {
  list:   (params?: Record<string, unknown>) => api.get('/cours', { params }),
  get:    (id: number) => api.get(`/cours/${id}`),
  create: (data: Record<string, unknown>) => api.post('/cours', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/cours/${id}`, data),
  delete: (id: number) => api.delete(`/cours/${id}`),
}

// ── SEQUENCES ─────────────────────────────────────────────────────────────────
export const sequencesApi = {
  list:   (params?: Record<string, unknown>) => api.get('/sequences', { params }),
  get:    (id: number) => api.get(`/sequences/${id}`),
  create: (data: Record<string, unknown>) => api.post('/sequences', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/sequences/${id}`, data),
  delete: (id: number) => api.delete(`/sequences/${id}`),
}

// ── RESSOURCES ────────────────────────────────────────────────────────────────
export const ressourcesApi = {
  list:   (params?: Record<string, unknown>) => api.get('/ressources', { params }),
  get:    (id: number) => api.get(`/ressources/${id}`),
  create: (data: Record<string, unknown>) => api.post('/ressources', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/ressources/${id}`, data),
  delete: (id: number) => api.delete(`/ressources/${id}`),
}

// ── ATTRIBUTIONS ──────────────────────────────────────────────────────────────
export const attributionsApi = {
  list:   (params?: Record<string, unknown>) => api.get('/attributions', { params }),
  get:    (id: number) => api.get(`/attributions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/attributions', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/attributions/${id}`, data),
  delete: (id: number) => api.delete(`/attributions/${id}`),
}

// ── ACTIVITES ─────────────────────────────────────────────────────────────────
export const activitesApi = {
  list:    (params?: Record<string, unknown>) => api.get('/activites', { params }),
  get:     (id: number) => api.get(`/activites/${id}`),
  create:  (data: Record<string, unknown>) => api.post('/activites', data),
  update:  (id: number, data: Record<string, unknown>) => api.put(`/activites/${id}`, data),
  delete:  (id: number) => api.delete(`/activites/${id}`),
  valider: (id: number, data: { decision: string; commentaire?: string }) =>
    api.post(`/activites/${id}/valider`, data),
  simuler: (params: { id_ressource: number; nb_seances: number; id_annee: number }) =>
    api.get('/activites/simuler', { params }),
}

// ── VOLUMES HORAIRES ──────────────────────────────────────────────────────────
export const volumesApi = {
  list: (params?: Record<string, unknown>) => api.get('/volume-horaire', { params }),
  get:  (id: number) => api.get(`/volume-horaire/${id}`),
}

// ── ANNEES ────────────────────────────────────────────────────────────────────
export const anneesApi = {
  list:   () => api.get('/annees'),
  get:    (id: number) => api.get(`/annees/${id}`),
  create: (data: Record<string, unknown>) => api.post('/annees', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/annees/${id}`, data),
}

// ── PARAMETRES ────────────────────────────────────────────────────────────────
export const parametresApi = {
  list:   (params?: Record<string, unknown>) => api.get('/parametres', { params }),
  create: (data: Record<string, unknown>) => api.post('/parametres', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/parametres/${id}`, data),
  delete: (id: number) => api.delete(`/parametres/${id}`),
}

// ── PROFILS ───────────────────────────────────────────────────────────────────
export const profilsApi = {
  list: () => api.get('/profils'),
}

// ── UTILISATEURS ──────────────────────────────────────────────────────────────
// La route backend est /api/v1/users (non /utilisateurs)
export const utilisateursApi = {
  list:   () => api.get('/users'),
  get:    (id: number) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number) => api.post(`/users/${id}/reinitialiser-mdp`),
}

// ── RAPPORTS ──────────────────────────────────────────────────────────────────
export const rapportsApi = {
  global: (format = 'pdf', idAnnee?: number) =>
    api.get('/rapports/global', {
      params: { format, ...(idAnnee ? { id_annee: idAnnee } : {}) },
      responseType: format !== 'json' ? 'blob' : 'json',
    }),
  ficheEnseignant: (id: number, format = 'pdf', idAnnee?: number) =>
    api.get(`/rapports/enseignant/${id}`, {
      params: { format, ...(idAnnee ? { id_annee: idAnnee } : {}) },
      responseType: format !== 'json' ? 'blob' : 'json',
    }),
}
