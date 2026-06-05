// ============================================================
// VISTA DE ESPACIOS (solo Admin)
// CRUD completo de espacios de trabajo.
// Los espacios están relacionados con las reservas.
// ============================================================
import Navbar from './components/navbar.js'
import { spacesAPI } from '../services/api.js'

export default class SpacesView {
    constructor() {
        this.currentSpace = null  // null = modo creación
    }

    async render() {
        return `
        ${await Navbar.render()}

        <div class="container mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-xl font-semibold text-slate-700">Spaces</h1>
                <button id="createSpaceBtn" class="btn-primary">+ Add Space</button>
            </div>

            <p id="loadingMsg" class="text-center py-8 text-slate-400 text-sm">Loading...</p>

            <!-- Grid de tarjetas — se muestra/oculta con style.display -->
            <div id="spacesGrid" style="display:none"></div>

            <p id="emptyMsg" class="hidden text-center py-8 text-slate-400 text-sm">
                No spaces yet. Add one!
            </p>
        </div>

        <!-- Modal: crear / editar espacio -->
        <div id="spaceModal"
             class="fixed inset-0 bg-slate-900/40 hidden items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6
                        border border-slate-100">

                <h2 id="spaceModalTitle" class="text-lg font-semibold text-slate-700 mb-5">
                    Add Space
                </h2>

                <form id="spaceForm" novalidate>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Name</label>
                        <input type="text" id="spaceName" class="input-field" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Type</label>
                        <select id="spaceType" class="input-field">
                            <option value="Meeting Room">Meeting Room</option>
                            <option value="Private Office">Private Office</option>
                            <option value="Coworking">Coworking</option>
                            <option value="Auditorium">Auditorium</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Capacity</label>
                        <input type="number" id="spaceCapacity" class="input-field" min="1" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Location</label>
                        <input type="text" id="spaceLocation" class="input-field" required>
                    </div>
                    <div class="mb-5">
                        <label class="block text-sm font-medium text-slate-600 mb-1.5">Status</label>
                        <select id="spaceStatus" class="input-field">
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" class="btn-primary flex-1">Save</button>
                        <button type="button" id="closeSpaceModalBtn"
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

            // Activa el grid con CSS grid manualmente para evitar conflicto con Tailwind 'hidden'
            grid.style.display = 'grid'
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'

            grid.innerHTML = spaces.map(s => `
                <div class="card hover:shadow-md transition-shadow duration-200">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="font-semibold text-slate-700">${s.name}</h3>
                        <span class="px-2 py-0.5 text-xs rounded-md font-medium border
                                     ${s.status === 'available'
                                         ? 'bg-teal-50 text-teal-600 border-teal-100'
                                         : 'bg-slate-100 text-slate-500 border-slate-200'}">
                            ${s.status}
                        </span>
                    </div>
                    <div class="space-y-1 text-sm text-slate-500 mb-4">
                        <p><span class="text-slate-400">Type:</span> ${s.type}</p>
                        <p><span class="text-slate-400">Capacity:</span> ${s.capacity} people</p>
                        <p><span class="text-slate-400">Location:</span> ${s.location}</p>
                    </div>
                    <div class="flex gap-2 pt-3 border-t border-slate-50">
                        <button data-action="edit" data-id="${s.id}"
                                class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-indigo-500 bg-indigo-50 hover:bg-indigo-100
                                       border border-indigo-100 transition-colors cursor-pointer">
                            Edit
                        </button>
                        <button data-action="delete" data-id="${s.id}"
                                class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-rose-400 bg-rose-50 hover:bg-rose-100
                                       border border-rose-100 transition-colors cursor-pointer">
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

        // Cierra el modal al hacer clic en el fondo oscuro
        document.getElementById('spaceModal')
            ?.addEventListener('click', e => {
                if (e.target.id === 'spaceModal') this._closeModal()
            })
    }

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
