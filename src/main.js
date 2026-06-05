// ============================================================
// PUNTO DE ENTRADA DE LA APLICACIÓN
// Inicializa el router y protege rutas al cargar la página.
// ============================================================
import './style.css'
import router from './router.js'
import { authService } from './services/auth.js'

/**
 * Verifica sesión activa y redirige según corresponda:
 * - Sin sesión y fuera de /login → va a /login
 * - Con sesión en /login → redirige al home según rol
 */
const checkAuth = () => {
    const path            = window.location.pathname
    const isAuthenticated = authService.isAuthenticated()

    if (!isAuthenticated && path !== '/login') {
        router.navigate('/login')
    } else if (isAuthenticated && path === '/login') {
        const user = authService.getCurrentUser()
        router.navigate(user?.role === 'admin' ? '/dashboard' : '/reservations')
    }
}

document.addEventListener('DOMContentLoaded', () => {
    router.init()
    checkAuth()
})

// Re-valida autenticación al navegar con los botones del navegador
window.addEventListener('popstate', () => {
    router.handleRoute()
    checkAuth()
})
