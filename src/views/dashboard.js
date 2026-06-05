// ============================================================
// VISTA DE DASHBOARD (solo Admin)
// Estadísticas generales de reservas y lista de las más recientes.
// ============================================================
import Navbar from './components/navbar.js'
import { reservationsAPI, usersAPI, spacesAPI } from '../services/api.js'
import router from '../router.js'

export default class DashboardView {

    async render() {
        return `
        <div class="app-shell">
            ${await Navbar.render()}

            <main class="main-content">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold text-white">Dashboard</h1>
                    <p class="text-sm text-gray-500 mt-1">Overview of all reservations</p>
                </div>

                <!-- Tarjetas de estadísticas -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                    <div class="card-stat">
                        <p class="text-xs text-gray-500 uppercase tracking-wider mb-3">
                            Total Reservations
                        </p>
                        <p id="statTotal" class="text-3xl font-bold text-white">-</p>
                    </div>

                    <div class="card-stat">
                        <p class="text-xs text-gray-500 uppercase tracking-wider mb-3">
                            Pending
                        </p>
                        <p id="statPending" class="text-3xl font-bold text-amber-400">-</p>
                    </div>

                    <div class="card-stat">
                        <p class="text-xs text-gray-500 uppercase tracking-wider mb-3">
                            Approved
                        </p>
                        <p id="statApproved" class="text-3xl font-bold text-emerald-400">-</p>
                    </div>

                    <div class="card-stat">
                        <p class="text-xs text-gray-500 uppercase tracking-wider mb-3">
                            Spaces
                        </p>
                        <p id="statSpaces" class="text-3xl font-bold text-cyan-400">-</p>
                    </div>

                </div>

                <!-- Reservas recientes -->
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-base font-semibold text-white">Recent Reservations</h2>
                        <button id="viewAllBtn"
                                class="text-xs text-emerald-400 hover:text-emerald-300
                                       font-medium transition-colors duration-150">
                            View all
                        </button>
                    </div>
                    <div id="recentList" class="space-y-2">
                        <p class="text-gray-600 text-sm">Loading...</p>
                    </div>
                </div>

            </main>
        </div>`
    }

    async mounted() {
        await Navbar.mounted()

        document.getElementById('viewAllBtn')
            ?.addEventListener('click', () => router.navigate('/reservations'))

        await this.loadStats()
    }

    async loadStats() {
        try {
            // Carga los tres recursos en paralelo para mayor velocidad
            const [reservations, spaces, users] = await Promise.all([
                reservationsAPI.getAll(),
                spacesAPI.getAll(),
                usersAPI.getAll()
            ])

            // Mapas auxiliares id → nombre para mostrar en la lista
            const userMap  = Object.fromEntries(users.map(u  => [u.id,  u.name]))
            const spaceMap = Object.fromEntries(spaces.map(s => [s.id,  s.name]))

            // Actualiza los contadores de las tarjetas de estadística
            document.getElementById('statTotal').textContent
                = reservations.length
            document.getElementById('statPending').textContent
                = reservations.filter(r => r.status === 'pending').length
            document.getElementById('statApproved').textContent
                = reservations.filter(r => r.status === 'approved').length
            document.getElementById('statSpaces').textContent
                = spaces.length

            // Muestra las últimas 5 reservas (más recientes primero)
            const recent = [...reservations].reverse().slice(0, 5)
            const list   = document.getElementById('recentList')
            if (!list) return

            if (recent.length === 0) {
                list.innerHTML = '<p class="text-gray-600 text-sm">No reservations yet.</p>'
                return
            }

            list.innerHTML = recent.map(r => `
                <div class="flex items-center justify-between
                            px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-800
                            hover:border-gray-700 transition-colors duration-150">
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-200 truncate">
                            ${spaceMap[r.spaceId] ?? 'Unknown space'}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">
                            ${userMap[r.userId] ?? 'Unknown'}
                            &nbsp;&middot;&nbsp;
                            ${r.date}
                            &nbsp;&middot;&nbsp;
                            ${r.startTime}–${r.endTime}
                        </p>
                    </div>
                    <span class="badge ${this._badgeClass(r.status)} ml-4 shrink-0">
                        ${r.status}
                    </span>
                </div>
            `).join('')

        } catch (err) {
            console.error('Dashboard error:', err)
        }
    }

    // Devuelve la clase de badge correspondiente al estado
    _badgeClass(status) {
        const map = {
            pending:   'badge-pending',
            approved:  'badge-approved',
            rejected:  'badge-rejected',
            cancelled: 'badge-cancelled'
        }
        return map[status] ?? 'badge-cancelled'
    }
}
