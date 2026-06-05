// ============================================================
// VISTA DE RESERVAS
// Admin: ve y gestiona todas las reservas (CRUD + aprobar/rechazar).
// User:  ve solo sus reservas, puede crear, editar pendientes y cancelar.
// ============================================================
import Navbar from './components/navbar.js'
import { reservationsAPI, spacesAPI, usersAPI } from '../services/api.js'
import { authService } from '../services/auth.js'

export default class ReservationsView {
    constructor() {
        this.currentReservation = null       // null = modo creación
        this.allReservations    = []
        this.spaces             = []
        this.users              = []
        this.currentUser        = authService.getCurrentUser()
        this.isAdmin            = authService.isAdmin()
    }

    async render() {
        return `
        ${await Navbar.render()}

        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-xl font-semibold text-slate-700">Reservations</h1>
                <button id="createBtn" class="btn-primary">+ New Reservation</button>
            </div>

            <p id="loadingMsg" class="text-center py-8 text-slate-400 text-sm">Loading...</p>

            <!-- Tabla de reservas -->
            <div id="tableWrapper" class="card hidden overflow-x-auto p-0">
                <table class="w-full text-sm text-left">
                    <thead>
                        <tr class="border-b border-slate-100">
                            <th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Space</th>
                            ${this.isAdmin
                                ? '<th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">User</th>'
                                : ''}
                            <th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Time</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Reason</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                            <th class="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="reservationsBody"></tbody>
                </table>
                <p id="emptyMsg" class="hidden text-center py-8 text-slate-400 text-sm">
                    No reservations found.
                </p>
            </div>
        </div>

        <!-- Modal: crear / editar reserva -->
        <div id="reservationModal"
             class="fixed inset-0 bg-slate-900/40 hidden items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4
                        max-h-screen overflow-y-auto p-6 border border-slate-100">

                <h2 id="modalTitle" class="text-lg font-semibold text-slate-700 mb-5">
                    New Reservation
                </h2>

                <!-- Error en el modal -->
                <div id="modalError"
                     class="hidden mb-4 px-3 py-2 bg-rose-50 text-rose-600
                            border border-rose-100 rounded-lg text-sm">
                </div>

                <form id="reservationForm" novalidate>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Space</label>
                        <select id="formSpaceId" class="input-field" required></select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Date</label>
                        <input type="date" id="formDate" class="input-field" required>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-600 mb-1.5">Start Time</label>
                            <input type="time" id="formStartTime" class="input-field" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-600 mb-1.5">End Time</label>
                            <input type="time" id="formEndTime" class="input-field" required>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Reason</label>
                        <textarea id="formReason" rows="3" class="input-field"
                                  placeholder="Purpose of the reservation" required></textarea>
                    </div>

                    <!-- Campo status solo visible para admin -->
                    ${this.isAdmin ? `
                    <div class="mb-5">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Status</label>
                        <select id="formStatus" class="input-field">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>` : ''}

                    <div class="flex gap-3 mt-5">
                        <button type="submit" class="btn-primary flex-1">Save</button>
                        <button type="button" id="closeModalBtn"
                                class="flex-1 px-4 py-2 rounded-lg text-sm font-medium
                                       text-slate-500 bg-slate-100 hover:bg-slate-200
                                       transition-colors duration-200 cursor-pointer">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>`
    }

    async mounted() {
        await Navbar.mounted()

        // Carga espacios y usuarios en paralelo para llenar el modal y la tabla
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

            // User solo ve sus propias reservas
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

        // Mapas auxiliares para mostrar nombres en vez de IDs
        const spaceMap = Object.fromEntries(this.spaces.map(s => [s.id, s.name]))
        const userMap  = Object.fromEntries(this.users.map(u => [u.id, u.name]))

        tbody.innerHTML = reservations.map(r => {
            const canEdit    = this._canEdit(r)
            const canDelete  = this._canDelete(r)
            const canCancel  = this._canCancel(r)
            const canApprove = this.isAdmin && r.status === 'pending'

            // Construye los botones de acción según permisos
            const actions = [
                canEdit
                    ? `<button data-action="edit" data-id="${r.id}"
                               class="text-indigo-400 hover:text-indigo-600 text-xs mr-3
                                      font-medium transition-colors">Edit</button>`
                    : '',
                canApprove
                    ? `<button data-action="approve" data-id="${r.id}"
                               class="text-teal-500 hover:text-teal-700 text-xs mr-3
                                      font-medium transition-colors">Approve</button>
                       <button data-action="reject" data-id="${r.id}"
                               class="text-amber-500 hover:text-amber-700 text-xs mr-3
                                      font-medium transition-colors">Reject</button>`
                    : '',
                canCancel
                    ? `<button data-action="cancel" data-id="${r.id}"
                               class="text-slate-400 hover:text-slate-600 text-xs mr-3
                                      font-medium transition-colors">Cancel</button>`
                    : '',
                canDelete
                    ? `<button data-action="delete" data-id="${r.id}"
                               class="text-rose-400 hover:text-rose-600 text-xs
                                      font-medium transition-colors">Delete</button>`
                    : ''
            ].join('')

            return `
            <tr class="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                <td class="px-4 py-3 font-medium text-slate-600">
                    ${spaceMap[r.spaceId] ?? 'Unknown'}
                </td>
                ${this.isAdmin
                    ? `<td class="px-4 py-3 text-slate-500">
                           ${userMap[r.userId] ?? 'Unknown'}
                       </td>`
                    : ''}
                <td class="px-4 py-3 text-slate-500">${r.date}</td>
                <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                    ${r.startTime} – ${r.endTime}
                </td>
                <td class="px-4 py-3 text-slate-500 max-w-xs truncate">${r.reason}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 text-xs rounded-md font-medium border
                                 ${this._statusBadge(r.status)}">
                        ${r.status}
                    </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">${actions}</td>
            </tr>`
        }).join('')

        // Event delegation: un solo listener en el tbody
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

    // Admin edita cualquier reserva; user solo sus pendientes
    _canEdit(r) {
        if (this.isAdmin) return true
        return r.userId === this.currentUser.id && r.status === 'pending'
    }

    // Solo admin puede eliminar permanentemente
    _canDelete(r) {
        return this.isAdmin
    }

    // User puede cancelar sus reservas pending o approved
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

        // Validaciones antes de llamar a la API
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

        // Regla de negocio: sin duplicados de espacio + fecha + horario
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
            // Admin puede cambiar el status desde el formulario; user siempre pending
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

    // ── Acciones individuales ──────────────────────────────────

    async _deleteReservation(id) {
        if (!confirm('Are you sure you want to delete this reservation?')) return
        try {
            await reservationsAPI.delete(id)
            this._showToast('Reservation deleted.')
            await this.loadReservations()
        } catch {
            this._showToast('Error deleting reservation.', 'error')
        }
    }

    // Cambia solo el campo status con PATCH (no sobreescribe el resto)
    async _updateStatus(id, status) {
        try {
            await reservationsAPI.patch(id, { status })
            this._showToast(`Reservation marked as ${status}.`)
            await this.loadReservations()
        } catch {
            this._showToast('Error updating status.', 'error')
        }
    }

    // ── Regla de negocio: sin duplicados ───────────────────────

    /**
     * Devuelve true si ya existe una reserva activa en el mismo espacio,
     * misma fecha y con horario solapado.
     * Excluye la reserva que se está editando actualmente.
     */
    async _checkDuplicate(spaceId, date, startTime, endTime) {
        const all = await reservationsAPI.getAll()
        return all.some(r => {
            if (this.currentReservation && r.id === this.currentReservation.id) return false
            if (r.spaceId !== spaceId || r.date !== date) return false
            if (r.status === 'cancelled' || r.status === 'rejected') return false
            // Solapamiento: A empieza antes de que B termine Y A termina después de que B empiece
            return startTime < r.endTime && endTime > r.startTime
        })
    }

    // ── Helpers ────────────────────────────────────────────────

    // Llena el select del modal solo con espacios disponibles
    _populateSpacesSelect() {
        const select = document.getElementById('formSpaceId')
        if (!select) return
        const available = this.spaces.filter(s => s.status === 'available')
        select.innerHTML = available.map(s =>
            `<option value="${s.id}">${s.name} (${s.type} · Cap: ${s.capacity})</option>`
        ).join('')
    }

    _setupEvents() {
        document.getElementById('createBtn')
            ?.addEventListener('click', () => this._openCreate())

        document.getElementById('closeModalBtn')
            ?.addEventListener('click', () => this._closeModal())

        document.getElementById('reservationForm')
            ?.addEventListener('submit', e => this._handleSubmit(e))

        // Cerrar modal al hacer clic en el fondo oscuro
        document.getElementById('reservationModal')
            ?.addEventListener('click', e => {
                if (e.target.id === 'reservationModal') this._closeModal()
            })
    }

    // Clases del badge según estado
    _statusBadge(status) {
        const map = {
            pending:   'badge-pending',
            approved:  'badge-approved',
            rejected:  'badge-rejected',
            cancelled: 'badge-cancelled'
        }
        return map[status] ?? 'badge-cancelled'
    }

    // Notificación temporal en esquina inferior derecha
    _showToast(message, type = 'success') {
        const t = document.createElement('div')
        t.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-md z-50
                       text-sm font-medium text-white
                       ${type === 'success' ? 'bg-teal-500' : 'bg-rose-400'}`
        t.textContent = message
        document.body.appendChild(t)
        setTimeout(() => t.remove(), 3000)
    }
}
