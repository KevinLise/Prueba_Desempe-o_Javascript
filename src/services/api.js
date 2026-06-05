// ============================================================
// SERVICIO DE API
// Centraliza todas las llamadas HTTP a json-server usando Axios.
// El proxy de Vite redirige /api → http://localhost:3000
// ============================================================
import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
})

// Interceptor: extrae body de respuesta exitosa y lanza errores
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error)
        throw error
    }
)

// ── Usuarios ────────────────────────────────────────────────
export const usersAPI = {
    getAll:  ()   => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`)
}

// ── Espacios de trabajo ─────────────────────────────────────
export const spacesAPI = {
    getAll:  ()           => api.get('/spaces'),
    getById: (id)         => api.get(`/spaces/${id}`),
    create:  (data)       => api.post('/spaces', data),
    update:  (id, data)   => api.put(`/spaces/${id}`, data),
    patch:   (id, data)   => api.patch(`/spaces/${id}`, data),
    delete:  (id)         => api.delete(`/spaces/${id}`)
}

// ── Reservas ────────────────────────────────────────────────
export const reservationsAPI = {
    getAll:  ()           => api.get('/reservations'),
    getById: (id)         => api.get(`/reservations/${id}`),
    create:  (data)       => api.post('/reservations', data),
    update:  (id, data)   => api.put(`/reservations/${id}`, data),
    patch:   (id, data)   => api.patch(`/reservations/${id}`, data),
    delete:  (id)         => api.delete(`/reservations/${id}`)
}

export default api
