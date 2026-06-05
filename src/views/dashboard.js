// ============================================================
// VISTA DE DASHBOARD (solo Admin)
// Muestra estadísticas generales de reservas y lista reciente.
// ============================================================
import Navbar from './components/navbar.js'
import { reservationsAPI, usersAPI, spacesAPI } from '../services/api.js'
import router from '../router.js'

export default class DashboardView {

    async render() {
        return `
        ${await Navbar.render()}

        <div class="container mx-auto px-4 py-8">
            <h1 class="text-xl font-semibold text-slate-700 mb-6">Dashboard</h1>

            <!-- Tarjetas de estadísticas -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

                <div class="card text-center">
                    <p class="text-xs text-slate-400 mb-2 uppercase tracking-wide">Total</p>
                    <p id="statTotal" class="text-3xl font-bold text-indigo-400">-</p>
                </div>

                <div class="card text-center">
                    <p class="text-xs text-slate-400 mb-2 uppercase tracking-wide">Pending</p>
                    <p id="statPending" class="text-3xl font-bold text-amber-400">-</p>
                </div>

                <div class="card text-center">
                    <p class="text-xs text-slate-400 mb-2 uppercase tracking-wide">Approved</p>
                    <p id="statApproved" class="text-3xl font-bold text-teal-400">-</p>
                </div>

                <div class="card text-center">
                    <p class="text-xs text-slate-400 mb-2 uppercase tracking-wide">Spaces</p>
                    <p id="statSpaces" class="text-3xl font-bold text-slate-400">-</p>
                </div>

            </div>

            <!-- Reservas recientes -->
            <div class="card">
                <div class="flex justify-between items-center mb-5">
                    <h2 class="text-base font-semibold text-slate-600">Recent Reservations</h2>
                    <button id="viewAllBtn"
                            class="text-xs text-indigo-500 hover:text-indigo-600
                                   font-medium transition-colors duration-200">
                        View all
                    </button>
                </div>
                <div id="recentList" class="space-y-2">
                    <p class="text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
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
            // Carga en paralelo para no esperar una por una
            const [reservations, spaces, users] = await Promise.all([
                reservationsAPI.getAll(),
                spacesAPI.getAll(),
                usersAPI.getAll()
            ])

            // Mapas auxiliares id → nombre
            const userMap  = Object.fromEntries(users.map(u => [u.id, u.name]))
            const spaceMap = Object.fromEntries(spaces.map(s => [s.id, s.name]))

            // Actualiza los contadores de las tarjetas
            document.getElementById('statTotal').textContent
                = reservations.length
            document.getElementById('statPending').textContent
                = reservations.filter(r => r.status === 'pending').length
            document.getElementById('statApproved').textContent
                = reservations.filter(r => r.status === 'approved').length
            document.getElementById('statSpaces').textContent
                = spaces.length

            // Últimas 5 reservas (más recientes primero)
            const recent = [...reservations].reverse().slice(0, 5)
            const list   = document.getElementById('recentList')
            if (!list) return

            if (recent.length === 0) {
                list.innerHTML = '<p class="text-slate-400 text-sm">No reservations yet.</p>'
                return
            }

            list.innerHTML = recent.map(r => `
                <div class="flex items-center justify-between
                            px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <p class="text-sm font-medium text-slate-600">
                            ${spaceMap[r.spaceId] ?? 'Unknown space'}
                        </p>
                        <p class="text-xs text-slate-400 mt-0.5">
                            ${userMap[r.userId] ?? 'Unknown'} &bull;
                            ${r.date} &bull; ${r.startTime}–${r.endTime}
                        </p>
                    </div>
                    <span class="px-2 py-0.5 text-xs rounded-md font-medium border
                                 ${this._statusBadge(r.status)}">
                        ${r.status}
                    </span>
                </div>
            `).join('')

        } catch (err) {
            console.error('Dashboard error:', err)
        }
    }

    // Devuelve las clases del badge según el estado de la reserva
    _statusBadge(status) {
        const map = {
            pending:   'badge-pending',
            approved:  'badge-approved',
            rejected:  'badge-rejected',
            cancelled: 'badge-cancelled'
        }
        return map[status] ?? 'badge-cancelled'
    }
}
