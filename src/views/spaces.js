// ============================================================
// VISTA DE ESPACIOS (solo Admin)
// CRUD completo de espacios de trabajo.
// Los espacios están relacionados con las reservas por spaceId.
// ============================================================
import Navbar from './components/navbar.js'
import { spacesAPI } from '../services/api.js'

export default class SpacesView {
    constructor() {
        this.currentSpace = null  // null = modo creación; objeto = modo edición
    }

    async render() {
        return `
        <div class="app-shell">
            ${await Navbar.render()}

            <main class="main-content">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h1 class="text-2xl font-bold text-white">Spaces</h1>
                        <p class="text-sm text-gray-500 mt-1">Manage workspace spaces</p>
                    </div>
                    <button id="createSpaceBtn" class="btn-primary">+ Add Space</button>
                </div>

                <p id="loadingMsg" class="text-center py-12 text-gray-600 text-sm">
                    Loading...
                </p>

                <!-- Grid de tarjetas — display gestionado por JS -->
                <div id="spacesGrid" style="display:none"></div>

                <p id="emptyMsg" class="hidden text-center py-12 text-gray-600 text-sm">
                    No spaces yet. Add one to get started.
                </p>
            </main>
        </div>

        <!-- Modal: crear / editar espacio -->
        <div id="spaceModal" class="modal-overlay">
            <div class="modal-box">
                <h2 id="spaceModalTitle" class="text-lg font-bold text-white mb-1">
                    Add Space
                </h2>
                <p class="text-xs text-gray-500 mb-6">Fill in the workspace details</p>

                <form id="spaceForm" novalidate>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Name</label>
                        <input type="text" id="spaceName" class="input-field" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Type</label>
                        <select id="spaceType" class="input-field">
                            <option value="Meeting Room">Meeting Room</option>
                            <option value="Private Office">Private Office</option>
                            <option value="Coworking">Coworking</option>
                            <option value="Auditorium">Auditorium</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Capacity</label>
                        <input type="number" id="spaceCapacity" class="input-field"
                               min="1" placeholder="Number of people" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Location</label>
                        <input type="text" id="spaceLocation" class="input-field"
                               placeholder="e.g. Floor 2" required>
                    </div>
                    <div class="mb-6">
                        <label class="block text-xs font-semibold text-gray-400
                                      uppercase tracking-wider mb-2">Status</label>
                        <select id="spaceStatus" class="input-field">
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" class="btn-primary flex-1 justify-center">
                            Save
                        </button>
                        <button type="button" id="closeSpaceModalBtn"
                                class="btn-ghost flex-1 justify-center">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>`
    }

    async mounted() {
        await Navbar.mounted()
        await this.loadSpaces()
        this._setupEvents()
    }

    // ── Carga y render del grid ────────────────────────────────

    async loadSpaces() {
        const loading = document.getElementById('loadingMsg')
        const grid    = document.getElementById('spacesGrid')
        const empty   = document.getElementById('emptyMsg')

        loading?.classList.remove('hidden')
        if (grid) grid.style.display = 'none'
        empty?.classList.add('hidden')

        try {
            const spaces = await spacesAPI.getAll()
            loading?.classList.add('hidden')

            if (spaces.length === 0) {
                empty?.classList.remove('hidden')
                return
            }

            // Activa el grid con CSS grid (Tailwind 'hidden' entra en conflicto con 'grid')
            grid.style.display = 'grid'
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'

            grid.innerHTML = spaces.map(s => `
                <div class="bg-gray-900 rounded-xl border border-gray-800
                            hover:border-gray-700 transition-colors duration-200 p-5">

                    <!-- Nombre + badge de estado -->
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="font-semibold text-white text-base leading-tight">
                            ${s.name}
                        </h3>
                        <span class="badge ml-2 shrink-0
                                     ${s.status === 'available'
                                         ? 'badge-available'
                                         : 'badge-unavailable'}">
                            ${s.status}
                        </span>
                    </div>

                    <!-- Detalles del espacio -->
                    <div class="space-y-1.5 text-sm mb-5">
                        <div class="flex justify-between">
                            <span class="text-gray-500">Type</span>
                            <span class="text-gray-300">${s.type}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Capacity</span>
                            <span class="text-gray-300">${s.capacity} people</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Location</span>
                            <span class="text-gray-300">${s.location}</span>
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex gap-2 pt-4 border-t border-gray-800">
                        <button data-action="edit" data-id="${s.id}"
                                class="flex-1 py-1.5 rounded-lg text-xs font-medium
                                       text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20
                                       border border-cyan-400/20 transition-colors cursor-pointer">
                            Edit
                        </button>
                        <button data-action="delete" data-id="${s.id}"
                                class="flex-1 py-1.5 rounded-lg text-xs font-medium
                                       text-red-400 bg-red-400/10 hover:bg-red-400/20
                                       border border-red-400/20 transition-colors cursor-pointer">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('')

            // Event delegation en el grid
            grid.querySelectorAll('button[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id     = Number(btn.dataset.id)
                    const action = btn.dataset.action
                    if (action === 'edit')   this._openEdit(spaces.find(s => s.id === id))
                    if (action === 'delete') this._deleteSpace(id)
                })
            })

        } catch {
            loading?.classList.add('hidden')
            this._showToast('Error loading spaces.', 'error')
        }
    }

    // ── Modal ──────────────────────────────────────────────────

    _openCreate() {
        this.currentSpace = null
        document.getElementById('spaceModalTitle').textContent = 'Add Space'
        document.getElementById('spaceForm').reset()
        this._showModal()
    }

    _openEdit(space) {
        this.currentSpace = space
        document.getElementById('spaceModalTitle').textContent   = 'Edit Space'
        document.getElementById('spaceName').value     = space.name
        document.getElementById('spaceType').value     = space.type
        document.getElementById('spaceCapacity').value = space.capacity
        document.getElementById('spaceLocation').value = space.location
        document.getElementById('spaceStatus').value   = space.status
        this._showModal()
    }

    _showModal() {
        const modal = document.getElementById('spaceModal')
        modal.classList.remove('hidden')
        modal.classList.add('flex')
    }

    _closeModal() {
        const modal = document.getElementById('spaceModal')
        modal.classList.add('hidden')
        modal.classList.remove('flex')
        this.currentSpace = null
    }

    // ── Formulario ─────────────────────────────────────────────

    async _handleSubmit(e) {
        e.preventDefault()

        const data = {
            name:     document.getElementById('spaceName').value.trim(),
            type:     document.getElementById('spaceType').value,
            capacity: parseInt(document.getElementById('spaceCapacity').value),
            location: document.getElementById('spaceLocation').value.trim(),
            status:   document.getElementById('spaceStatus').value
        }

        if (!data.name || !data.location || !data.capacity) {
            this._showToast('Please fill all required fields.', 'error')
            return
        }

        try {
            if (this.currentSpace) {
                await spacesAPI.update(this.currentSpace.id, { ...this.currentSpace, ...data })
                this._showToast('Space updated.')
            } else {
                await spacesAPI.create(data)
                this._showToast('Space created.')
            }
            this._closeModal()
            await this.loadSpaces()
        } catch {
            this._showToast('Error saving space.', 'error')
        }
    }

    async _deleteSpace(id) {
        if (!confirm('Delete this space? Existing reservations will not be affected.')) return
        try {
            await spacesAPI.delete(id)
            this._showToast('Space deleted.')
            await this.loadSpaces()
        } catch {
            this._showToast('Error deleting space.', 'error')
        }
    }

    // ── Helpers ────────────────────────────────────────────────

    _setupEvents() {
        document.getElementById('createSpaceBtn')
            ?.addEventListener('click', () => this._openCreate())

        document.getElementById('closeSpaceModalBtn')
            ?.addEventListener('click', () => this._closeModal())

        document.getElementById('spaceForm')
            ?.addEventListener('submit', e => this._handleSubmit(e))

        // Cierra el modal al hacer clic en el overlay
        document.getElementById('spaceModal')
            ?.addEventListener('click', e => {
                if (e.target.id === 'spaceModal') this._closeModal()
            })
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
