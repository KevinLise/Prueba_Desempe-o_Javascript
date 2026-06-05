// ============================================================
// COMPONENTE SIDEBAR
// Navegación lateral fija con links según rol y botón de logout.
// Reemplaza la navbar superior — diseño dark con acentos emerald.
// ============================================================
import { authService } from '../../services/auth.js'
import router from '../../router.js'

export default class Navbar {

    /**
     * Retorna el HTML del sidebar.
     * Los links de Dashboard y Spaces solo se muestran al admin.
     */
    static async render() {
        const user    = authService.getCurrentUser()
        const isAdmin = user?.role === 'admin'
        const path    = window.location.pathname

        // Helper para marcar el link activo
        const active = (p) => path === p ? 'sidebar-link active' : 'sidebar-link'

        return `
        <aside class="sidebar">

            <!-- Logo -->
            <div class="sidebar-logo">
                <p class="text-sm font-bold text-white tracking-tight leading-tight">
                    Workspace
                </p>
                <p class="text-xs text-emerald-400 font-medium mt-0.5">
                    Reservation System
                </p>
            </div>

            <!-- Links de navegación -->
            <nav class="sidebar-nav">
                ${isAdmin ? `
                <a href="#" data-link="/dashboard" class="${active('/dashboard')}">
                    <span class="w-4 h-4 opacity-60">&#9632;</span>
                    Dashboard
                </a>` : ''}
                <a href="#" data-link="/reservations" class="${active('/reservations')}">
                    <span class="w-4 h-4 opacity-60">&#9632;</span>
                    Reservations
                </a>
                ${isAdmin ? `
                <a href="#" data-link="/spaces" class="${active('/spaces')}">
                    <span class="w-4 h-4 opacity-60">&#9632;</span>
                    Spaces
                </a>` : ''}
            </nav>

            <!-- Footer: usuario + logout -->
            <div class="sidebar-footer">
                <div class="mb-3 px-3">
                    <p class="text-xs font-medium text-gray-300 truncate">
                        ${user?.name ?? ''}
                    </p>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs
                                 bg-emerald-400/10 text-emerald-400 font-medium">
                        ${user?.role ?? ''}
                    </span>
                </div>
                <button id="logoutBtn"
                        class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                               text-sm text-gray-400 hover:text-red-400
                               hover:bg-red-400/10 transition-all duration-150 font-medium">
                    <span class="opacity-60">&#9663;</span>
                    Sign out
                </button>
            </div>

        </aside>`
    }

    /**
     * Registra los event listeners del sidebar después de montarlo en el DOM.
     */
    static async mounted() {
        // Cierra sesión y redirige al login
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            authService.logout()
            router.navigate('/login')
        })

        // Navegación SPA — evita recarga de página completa
        document.querySelectorAll('[data-link]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault()
                router.navigate(link.getAttribute('data-link'))
            })
        })
    }
}
