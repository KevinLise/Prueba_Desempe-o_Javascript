// ============================================================
// SERVICIO DE AUTENTICACIÓN
// Maneja login, logout y persistencia de sesión con localStorage.
// La contraseña nunca se guarda en el almacenamiento local.
// ============================================================
import { usersAPI } from './api.js'

class AuthService {

    /**
     * Valida credenciales contra json-server.
     * Si coinciden, persiste la sesión en localStorage.
     * @param {string} email
     * @param {string} password
     * @returns {{ success: boolean, user?: object, error?: string }}
     */
    async login(email, password) {
        try {
            const users = await usersAPI.getAll()
            const user  = users.find(u => u.email === email && u.password === password)

            if (user) {
                // Excluye la contraseña antes de guardar en localStorage
                const { password: _, ...safeUser } = user
                localStorage.setItem('currentUser', JSON.stringify(safeUser))
                localStorage.setItem('isAuthenticated', 'true')
                return { success: true, user: safeUser }
            }

            return { success: false, error: 'Invalid email or password.' }
        } catch {
            return { success: false, error: 'Could not connect to the server. Please try again.' }
        }
    }

    /**
     * Cierra sesión eliminando todos los datos del localStorage.
     */
    logout() {
        localStorage.removeItem('currentUser')
        localStorage.removeItem('isAuthenticated')
    }

    /**
     * Indica si hay una sesión activa.
     * @returns {boolean}
     */
    isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true'
    }

    /**
     * Retorna el usuario actual desde localStorage.
     * @returns {object|null}
     */
    getCurrentUser() {
        const raw = localStorage.getItem('currentUser')
        return raw ? JSON.parse(raw) : null
    }

    /**
     * Verifica si el usuario actual tiene el rol indicado.
     * @param {'admin'|'user'} role
     * @returns {boolean}
     */
    hasRole(role) {
        return this.getCurrentUser()?.role === role
    }

    /**
     * Verifica si el usuario actual es administrador.
     * @returns {boolean}
     */
    isAdmin() {
        return this.hasRole('admin')
    }
}

// Singleton: una sola instancia en toda la app
export const authService = new AuthService()
