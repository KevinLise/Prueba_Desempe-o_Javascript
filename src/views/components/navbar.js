// ============================================================
// COMPONENTE NAVBAR
// Barra de navegación con links filtrados por rol y botón de logout.
// ============================================================
import { authService } from '../../services/auth.js'
import router from '../../router.js'

export default class Navbar {

    static async render() {
        const user    = authService.getCurrentUser()
        const isAdmin = user?.role === 'admin'

        return `
        <nav class="bg-white border-b border-slate-100 shadow-sm">
            <div class="container mx-auto px-4">
                <div class="flex justify-between items-center h-16">

                    <!-- Logo + links -->
                    <div class="flex items-center space-x-8">
                        <span class="text-base font-semibold text-slate-700 tracking-tight">
                            Workspace Reservation
                        </span>
                        <div class="hidden md:flex items-center space-x-5">
                            ${isAdmin
                                ? '<a href="#" data-link="/dashboard" class="nav-link">Dashboard</a>'
                                : ''}
                            <a href="#" data-link="/reservations" class="nav-link">Reservations</a>
                            ${isAdmin
                                ? '<a href="#" data-link="/spaces" class="nav-link">Spaces</a>'
                                : ''}
                        </div>
                    </div>

                    <!-- Usuario + logout -->
                    <div class="flex items-center space-x-3">
                        <span class="hidden sm:block text-xs text-slate-400">
                            ${user?.name ?? ''}
                            <span class="ml-1 px-1.5 py-0.5 rounded text-indigo-500 bg-indigo-50 font-medium">
                                ${user?.role ?? ''}
                            </span>
                        </span>
                        <button id="logoutBtn"
                                class="px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-rose-500 bg-rose-50 hover:bg-rose-100
                                       border border-rose-100 transition-colors duration-200">
                            Logout
                        </button>
                    </div>

                </div>
            </div>
        </nav>`
    }

    static async mounted() {
        // Logout: limpia sesión y redirige al login
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            authService.logout()
            router.navigate('/login')
        })

        // Navegación SPA con data-link en lugar de recarga de página
        document.querySelectorAll('[data-link]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault()
                router.navigate(link.getAttribute('data-link'))
            })
        })
    }
}
