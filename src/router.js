// ============================================================
// ROUTER SPA
// Navega entre vistas sin recargar usando History API.
// Incluye guards de autenticación y de rol.
// ============================================================
import LoginView        from './views/login.js'
import DashboardView    from './views/dashboard.js'
import ReservationsView from './views/reservations.js'
import SpacesView       from './views/spaces.js'
import { authService }  from './services/auth.js'

class Router {
    constructor() {
        this.routes = {
            '/login':        { View: LoginView,        requiresAuth: false, adminOnly: false },
            '/dashboard':    { View: DashboardView,    requiresAuth: true,  adminOnly: true  },
            '/reservations': { View: ReservationsView, requiresAuth: true,  adminOnly: false },
            '/spaces':       { View: SpacesView,       requiresAuth: true,  adminOnly: true  }
        }
    }

    init() {
        this.handleRoute()
    }

    async handleRoute() {
        const path = window.location.pathname
        const app  = document.getElementById('app')
        if (!app) return

        const route = this.routes[path]

        // Ruta desconocida: redirige según estado de sesión
        if (!route) {
            if (authService.isAuthenticated()) {
                const user = authService.getCurrentUser()
                this.navigate(user?.role === 'admin' ? '/dashboard' : '/reservations')
            } else {
                this.navigate('/login')
            }
            return
        }

        // Guard de autenticación
        if (route.requiresAuth && !authService.isAuthenticated()) {
            this.navigate('/login')
            return
        }

        // Guard de rol: solo admins pueden acceder a rutas adminOnly
        if (route.adminOnly && !authService.isAdmin()) {
            app.innerHTML = this._accessDeniedHTML()
            return
        }

        // Renderiza la vista
        const view = new route.View()
        const html = await view.render()
        app.innerHTML = html
        await view.mounted()
    }

    /**
     * Navega programáticamente a una ruta.
     * @param {string} path
     */
    navigate(path) {
        window.history.pushState({}, '', path)
        this.handleRoute()
    }

    /**
     * HTML que se muestra cuando el usuario no tiene permisos.
     */
    _accessDeniedHTML() {
        return `
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div class="card text-center max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    You do not have permission to access this page.
                </p>
                <button id="goBackBtn" class="btn-primary">Go Back</button>
            </div>
        </div>`
    }
}

const router = new Router()

// Listener para el botón "Go Back" del mensaje de acceso denegado
document.addEventListener('click', (e) => {
    if (e.target.id === 'goBackBtn') {
        const user = authService.getCurrentUser()
        router.navigate(user?.role === 'admin' ? '/dashboard' : '/reservations')
    }
})

export default router
