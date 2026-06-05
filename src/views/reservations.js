// ============================================================
// VISTA DE RESERVAS
// Admin: CRUD completo sobre todas las reservas + aprobar/rechazar.
// User:  ve sus reservas, crea nuevas, edita pendientes, cancela.
// ============================================================
import Navbar from './components/navbar.js'
import { reservationsAPI, spacesAPI, usersAPI } from '../services/api.js'
import { authService } from '../services/auth.js'

export default class ReservationsView {
    constructor() {
        this.currentReservation = null   // null = modo creación; objeto = modo edición
        this.allReservations    = []
        this.spaces             = []
        this.users              = []
        this.currentUser        = authService.getCurrentUser()
        this.isAdmin            = authService.isAdmin()
    }

    async render() {
        return `
        <div class="app-shell">
            ${await Navbar.render()}

            <main class="main-content">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-white">Reservations</h1>
                        <p class="text-sm text-gray-500 mt-1">
                            ${this.isAdmin ? 'All reservations' : 'Your reservations'}
                        </p>
                    </div>
                    <button id="createBtn" class="btn-primary">+ New Reservation</button>
                </div>

                <!-- Estado de carga -->
                <p id="loadingMsg" class="text-center py-12 text-gray-600 text-sm">
                    Loading...
                </p>

                <!-- Tabla -->
                <div id="tableWrapper" class="table-wrapper hidden">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="th">Space</th>
                                ${this.isAdmin ? '<th class="th">User</th>' : ''}
                                <th class="th">Date</th>
                                <th class="th">Time</th>
                                <th class="th">Reason</th>
                                <th class="th">Status</th>
                                <th class="th">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="reservationsBody"></tbody>
                    </table>
                    <p id="emptyMsg" class="hidden text-center py-10 text-gray-600 text-sm">
                        No reservations found.
                    </p>
                </div>
            </main>
        </div>

        <!-- Modal: crear / editar reserva -->
        <div id="reservationModal" class="modal-overlay">
            <div class="modal-box">
                <h2 id="modalTitle" class="text-lg font-bold text-white mb-1">
                    New Reservation
                </h2>
                <p class="text-xs text-gray-500 mb-6">Fill in the details below</p>

                <!-- Error dentro del modal -->
                <div id="modalError"
                     class="hidden mb-5 px-4 py-3 bg-red-500/10 text-red-400
                            border border-red-500/20 rounded-lg text-sm">
                </div>

                <form id="reservationForm" novalidate>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Space</label>
                        <select id="formSpaceId" class="input-field" required></select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Date</label>
                        <input type="date" id="formDate" class="input-field" required>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-400
                                          uppercase tracking-wider mb-2">Start</label>
                            <input type="time" id="formStartTime" class="input-field" required>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-400
                                          uppercase tracking-wider mb-2">End</label>
                            <input type="time" id="formEndTime" class="input-field" required>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Reason</label>
                        <textarea id="formReason" rows="3" class="input-field"
                                  placeholder="Purpose of the reservation" required></textarea>
                    </div>

                    <!-- Campo status: solo visible para admin -->
                    ${this.isAdmin ? `
                    <div class="mb-5">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Status</label>
                        <select id="formStatus" class="input-field">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>` : ''}

                    <div class="flex gap-3 pt-2">
                        <button type="submit" class="btn-primary flex-1 justify-center">
                            Save
                        </button>
                        <button type="button" id="closeModalBtn" class="btn-ghost flex-1 justify-center">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>`
    }

    async mounted() {
        await Navbar.mounted()

        // Carga espacios y usuarios en paralelo (necesarios para la tabla y el modal)
        try {
            [this.spaces, this.users] = await Promise.all([
                spacesAPI.getAll(),
                usersAPI.getAll()
            ])
            this._populateSpacesSelect()
        } catch {
            this.spaces = []
            this.users  = []
        }

        await this.loadReservations()
        this._setupEvents()
    }

    // ── Carga de datos ─────────────────────────────────────────

    async loadReservations() {
        const loading = document.getElementById('loadingMsg')
        const wrapper = document.getElementById('tableWrapper')

        loading?.classList.remove('hidden')
        wrapper?.classList.add('hidden')

        try {
            let reservations = await reservationsAPI.getAll()

            // El user solo puede ver sus propias reservas (filtro en cliente)
            if (!this.isAdmin) {
                reservations = reservations.filter(r => r.userId === this.currentUser.id)
            }

            this.allReservations = reservations
            this._renderTable(reservations)
        } catch {
            this._showToast('Error loading reservations', 'error')
        } finally {
            loading?.classList.add('hidden')
            wrapper?.classList.remove('hidden')
        }
    }

    // ── Render de la tabla ─────────────────────────────────────

    _renderTable(reservations) {
        const tbody    = document.getElementById('reservationsBody')
        const emptyMsg = document.getElementById('emptyMsg')
        if (!tbody) return

        if (reservations.length === 0) {
            tbody.innerHTML = ''
            emptyMsg?.classList.remove('hidden')
            return
        }

        emptyMsg?.classList.add('hidden')

        // Mapas id → nombre para no mostrar IDs en la UI
        const spaceMap = Object.fromEntries(this.spaces.map(s => [s.id, s.name]))
        const userMap  = Object.fromEntries(this.users.map(u => [u.id, u.name]))

        tbody.innerHTML = reservations.map(r => {
            const canEdit    = this._canEdit(r)
            const canDelete  = this._canDelete(r)
            const canCancel  = this._canCancel(r)
            const canApprove = this.isAdmin && r.status === 'pending'

            // Construye los botones de acción según permisos del rol
            const actions = [
                canEdit
                    ? `<button data-action="edit" data-id="${r.id}"
                               class="text-cyan-400 hover:text-cyan-300 text-xs
                                      font-medium mr-3 transition-colors">
                           Edit
                       </button>`
                    : '',
                canApprove
                    ? `<button data-action="approve" data-id="${r.id}"
                               class="text-emerald-400 hover:text-emerald-300 text-xs
                                      font-medium mr-3 transition-colors">
                           Approve
                       </button>
                       <button data-action="reject" data-id="${r.id}"
                               class="text-amber-400 hover:text-amber-300 text-xs
                                      font-medium mr-3 transition-colors">
                           Reject
                       </button>`
                    : '',
                canCancel
                    ? `<button data-action="cancel" data-id="${r.id}"
                               class="text-gray-400 hover:text-gray-300 text-xs
                                      font-medium mr-3 transition-colors">
                           Cancel
                       </button>`
                    : '',
                canDelete
                    ? `<button data-action="delete" data-id="${r.id}"
                               class="text-red-400 hover:text-red-300 text-xs
                                      font-medium transition-colors">
                           Delete
                       </button>`
                    : ''
            ].join('')

            return `
            <tr class="tr-hover">
                <td class="td font-medium text-gray-200">
                    ${spaceMap[r.spaceId] ?? 'Unknown'}
                </td>
                ${this.isAdmin
                    ? `<td class="td text-gray-400">${userMap[r.userId] ?? 'Unknown'}</td>`
                    : ''}
                <td class="td">${r.date}</td>
                <td class="td whitespace-nowrap">${r.startTime} – ${r.endTime}</td>
                <td class="td max-w-xs truncate text-gray-400">${r.reason}</td>
                <td class="td">
                    <span class="badge ${this._badgeClass(r.status)}">${r.status}</span>
                </td>
                <td class="td whitespace-nowrap">${actions}</td>
            </tr>`
        }).join('')

        // Event delegation: un listener en el tbody para todos los botones
        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id     = Number(btn.dataset.id)
                const action = btn.dataset.action
                if (action === 'edit')    this._openEdit(id)
                if (action === 'delete')  this._deleteReservation(id)
                if (action === 'cancel')  this._updateStatus(id, 'cancelled')
                if (action === 'approve') this._updateStatus(id, 'approved')
                if (action === 'reject')  this._updateStatus(id, 'rejected')
            })
        })
    }

    // ── Permisos por fila ──────────────────────────────────────

    // Admin edita cualquier reserva; user solo sus reservas pendientes
    _canEdit(r) {
        if (this.isAdmin) return true
        return r.userId === this.currentUser.id && r.status === 'pending'
    }

    // Solo el admin puede borrar permanentemente
    _canDelete(r) { return this.isAdmin }

    // User puede cancelar sus propias reservas si son pending o approved
    _canCancel(r) {
        if (this.isAdmin) return false
        return r.userId === this.currentUser.id &&
               (r.status === 'pending' || r.status === 'approved')
    }

    // ── Modal ──────────────────────────────────────────────────

    _openCreate() {
        this.currentReservation = null
        document.getElementById('modalTitle').textContent = 'New Reservation'
        document.getElementById('reservationForm').reset()
        document.getElementById('modalError')?.classList.add('hidden')
        this._populateSpacesSelect()
        this._showModal()
    }

    async _openEdit(id) {
        try {
            const r = await reservationsAPI.getById(id)
            this.currentReservation = r

            document.getElementById('modalTitle').textContent   = 'Edit Reservation'
            document.getElementById('modalError')?.classList.add('hidden')
            document.getElementById('formSpaceId').value        = r.spaceId
            document.getElementById('formDate').value           = r.date
            document.getElementById('formStartTime').value      = r.startTime
            document.getElementById('formEndTime').value        = r.endTime
            document.getElementById('formReason').value         = r.reason
            if (this.isAdmin) document.getElementById('formStatus').value = r.status

            this._showModal()
        } catch {
            this._showToast('Error loading reservation', 'error')
        }
    }

    _showModal() {
        const modal = document.getElementById('reservationModal')
        modal.classList.remove('hidden')
        modal.classList.add('flex')
    }

    _closeModal() {
        const modal = document.getElementById('reservationModal')
        modal.classList.add('hidden')
        modal.classList.remove('flex')
        this.currentReservation = null
    }

    // ── Formulario ─────────────────────────────────────────────

    async _handleSubmit(e) {
        e.preventDefault()
        const errorDiv = document.getElementById('modalError')
        errorDiv.classList.add('hidden')

        const spaceId   = parseInt(document.getElementById('formSpaceId').value)
        const date      = document.getElementById('formDate').value
        const startTime = document.getElementById('formStartTime').value
        const endTime   = document.getElementById('formEndTime').value
        const reason    = document.getElementById('formReason').value.trim()

        // Validaciones del lado del cliente
        if (!spaceId || !date || !startTime || !endTime || !reason) {
            errorDiv.textContent = 'All fields are required.'
            errorDiv.classList.remove('hidden')
            return
        }
        if (startTime >= endTime) {
            errorDiv.textContent = 'End time must be after start time.'
            errorDiv.classList.remove('hidden')
            return
        }

        // Regla de negocio: no se permiten reservas duplicadas
        const duplicate = await this._checkDuplicate(spaceId, date, startTime, endTime)
        if (duplicate) {
            errorDiv.textContent = 'This space is already reserved for that date and time.'
            errorDiv.classList.remove('hidden')
            return
        }

        const data = {
            userId:    this.currentReservation?.userId ?? this.currentUser.id,
            spaceId,
            date,
            startTime,
            endTime,
            reason,
            // Admin puede cambiar el status; user siempre crea como pending
            status: this.isAdmin
                ? document.getElementById('formStatus').value
                : (this.currentReservation?.status ?? 'pending')
        }

        try {
            if (this.currentReservation) {
                await reservationsAPI.update(this.currentReservation.id,
                    { ...this.currentReservation, ...data })
                this._showToast('Reservation updated.')
            } else {
                await reservationsAPI.create(data)
                this._showToast('Reservation created.')
            }
            this._closeModal()
            await this.loadReservations()
        } catch {
            this._showToast('Error saving reservation.', 'error')
        }
    }

    // ── Acciones de estado ─────────────────────────────────────

    async _deleteReservation(id) {
        if (!confirm('Delete this reservation permanently?')) return
        try {
            await reservationsAPI.delete(id)
            this._showToast('Reservation deleted.')
            await this.loadReservations()
        } catch {
            this._showToast('Error deleting reservation.', 'error')
        }
    }

    // Actualiza solo el campo status con PATCH (no toca los demás campos)
    async _updateStatus(id, status) {
        try {
            await reservationsAPI.patch(id, { status })
            this._showToast(`Marked as ${status}.`)
            await this.loadReservations()
        } catch {
            this._showToast('Error updating status.', 'error')
        }
    }

    // ── Regla de negocio: sin duplicados ───────────────────────

    /**
     * Retorna true si ya existe una reserva activa (no cancelada/rechazada)
     * para el mismo espacio, misma fecha y con horario solapado.
     * Al editar, excluye la reserva actual del chequeo.
     */
    async _checkDuplicate(spaceId, date, startTime, endTime) {
        const all = await reservationsAPI.getAll()
        return all.some(r => {
            if (this.currentReservation && r.id === this.currentReservation.id) return false
            if (r.spaceId !== spaceId || r.date !== date) return false
            if (r.status === 'cancelled' || r.status === 'rejected') return false
            // Solapamiento: A empieza antes que B termine Y A termina después que B empieza
            return startTime < r.endTime && endTime > r.startTime
        })
    }

    // ── Helpers ────────────────────────────────────────────────

    // Llena el select del modal con los espacios disponibles
    _populateSpacesSelect() {
        const select = document.getElementById('formSpaceId')
        if (!select) return
        select.innerHTML = this.spaces
            .filter(s => s.status === 'available')
            .map(s => `<option value="${s.id}">${s.name} (${s.type} · ${s.capacity} ppl)</option>`)
            .join('')
    }

    _setupEvents() {
        document.getElementById('createBtn')
            ?.addEventListener('click', () => this._openCreate())

        document.getElementById('closeModalBtn')
            ?.addEventListener('click', () => this._closeModal())

        document.getElementById('reservationForm')
            ?.addEventListener('submit', e => this._handleSubmit(e))

        // Cierra el modal al hacer clic en el overlay oscuro
        document.getElementById('reservationModal')
            ?.addEventListener('click', e => {
                if (e.target.id === 'reservationModal') this._closeModal()
            })
    }

    _badgeClass(status) {
        const map = {
            pending:   'badge-pending',
            approved:  'badge-approved',
            rejected:  'badge-rejected',
            cancelled: 'badge-cancelled'
        }
        return map[status] ?? 'badge-cancelled'
    }

    _showToast(message, type = 'success') {
        const t = document.createElement('div')
        t.className = `fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-2xl z-50
                       text-sm font-medium border toast-anim
                       ${type === 'success'
                           ? 'bg-gray-900 text-emerald-400 border-emerald-500/30'
                           : 'bg-gray-900 text-red-400 border-red-500/30'}`
        t.textContent = message
        document.body.appendChild(t)
        setTimeout(() => t.remove(), 3000)
    }
}
