// ============================================================
// VISTA DE LOGIN
// Pantalla de inicio de sesión — diseño centrado, fondo oscuro.
// Valida campos en el cliente antes de llamar a la API.
// ============================================================
import { authService } from '../services/auth.js'
import router from '../router.js'

export default class LoginView {

    async render() {
        return `
        <div class="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div class="w-full max-w-sm">

                <!-- Encabezado -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-12 h-12
                                bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20">
                        <span class="text-emerald-400 text-xl font-bold">W</span>
                    </div>
                    <h1 class="text-xl font-bold text-white">Workspace Reservation</h1>
                    <p class="text-sm text-gray-500 mt-1">Sign in to continue</p>
                </div>

                <!-- Tarjeta del formulario -->
                <div class="bg-gray-900 rounded-2xl border border-gray-800 p-7 shadow-2xl">

                    <!-- Mensaje de error -->
                    <div id="errorMessage"
                         class="hidden mb-5 px-4 py-3 bg-red-500/10 text-red-400
                                border border-red-500/20 rounded-lg text-sm">
                    </div>

                    <form id="loginForm" novalidate>
                        <div class="mb-4">
                            <label class="block text-xs font-semibold text-gray-400
                                          uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <input type="email" id="email" class="input-field"
                                   placeholder="you@example.com" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-xs font-semibold text-gray-400
                                          uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <input type="password" id="password" class="input-field"
                                   placeholder="••••••••" required>
                        </div>
                        <button type="submit" id="submitBtn"
                                class="w-full py-2.5 rounded-lg text-sm font-semibold
                                       bg-emerald-500 text-white hover:bg-emerald-400
                                       transition-colors duration-150 cursor-pointer">
                            Sign In
                        </button>
                    </form>
                </div>

                <!-- Credenciales de prueba -->
                <div class="mt-5 bg-gray-900/50 rounded-xl border border-gray-800/60 p-4">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Test credentials
                    </p>
                    <div class="space-y-1.5 text-xs text-gray-500">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Admin</span>
                            <span>admin@test.com / Admin123*</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">User 1</span>
                            <span>user@test.com / User123*</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">User 2</span>
                            <span>user2@test.com / User123*</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>`
    }

    async mounted() {
        const form      = document.getElementById('loginForm')
        const errorDiv  = document.getElementById('errorMessage')
        const submitBtn = document.getElementById('submitBtn')

        form.addEventListener('submit', async (e) => {
            e.preventDefault()

            const email    = document.getElementById('email').value.trim()
            const password = document.getElementById('password').value

            // Validación básica antes de llamar a la API
            if (!email || !password) {
                errorDiv.textContent = 'Please enter your email and password.'
                errorDiv.classList.remove('hidden')
                return
            }

            submitBtn.textContent = 'Signing in...'
            submitBtn.disabled    = true
            errorDiv.classList.add('hidden')

            const result = await authService.login(email, password)

            if (result.success) {
                // Admin va al dashboard, user regular va a sus reservas
                router.navigate(result.user.role === 'admin' ? '/dashboard' : '/reservations')
            } else {
                errorDiv.textContent = result.error
                errorDiv.classList.remove('hidden')
                submitBtn.textContent = 'Sign In'
                submitBtn.disabled    = false
            }
        })
    }
}
