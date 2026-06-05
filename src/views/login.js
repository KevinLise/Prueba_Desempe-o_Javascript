// ============================================================
// VISTA DE LOGIN
// Formulario de inicio de sesión con validación y manejo de errores.
// ============================================================
import { authService } from '../services/auth.js'
import router from '../router.js'

export default class LoginView {

    async render() {
        return `
        <div class="min-h-screen flex items-center justify-center bg-slate-100">
            <div class="w-full max-w-sm mx-4">

                <!-- Encabezado -->
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-semibold text-slate-700">Workspace Reservation</h1>
                    <p class="text-sm text-slate-400 mt-1">Sign in to your account</p>
                </div>

                <!-- Tarjeta del formulario -->
                <div class="card">
                    <!-- Error -->
                    <div id="errorMessage"
                         class="hidden mb-4 px-3 py-2 bg-rose-50 text-rose-600
                                border border-rose-100 rounded-lg text-sm">
                    </div>

                    <form id="loginForm" novalidate>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-600 mb-1.5">
                                Email
                            </label>
                            <input type="email" id="email" class="input-field"
                                   placeholder="you@example.com" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-slate-600 mb-1.5">
                                Password
                            </label>
                            <input type="password" id="password" class="input-field"
                                   placeholder="Password" required>
                        </div>
                        <button type="submit" id="submitBtn" class="btn-primary w-full py-2.5">
                            Sign In
                        </button>
                    </form>
                </div>

                <!-- Credenciales de prueba -->
                <div class="mt-4 p-3 bg-white rounded-lg border border-slate-100
                            text-xs text-slate-400 space-y-1">
                    <p class="font-medium text-slate-500 mb-1">Test credentials</p>
                    <p>Admin: admin@test.com / Admin123*</p>
                    <p>User 1: user@test.com / User123*</p>
                    <p>User 2: user2@test.com / User123*</p>
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

            // Validación del lado del cliente antes de llamar a la API
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
                // Redirige al admin al dashboard, al user a sus reservas
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
