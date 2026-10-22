import logo from '@/assets/logo.png'
import { useAuth } from '@/data/auth'
import { getAuthToken } from '@/lib/api'
import { ClipboardList, Eye, EyeOff, FileText, ShoppingCart, Truck } from 'lucide-react'
import { useState, useEffect, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const modules = [
  { label: 'Quotations', icon: FileText, tone: 'bg-[#8B1E3F]' },
  { label: 'Purchase Orders', icon: ShoppingCart, tone: 'bg-[#c45c26]' },
  { label: 'Outslips', icon: ClipboardList, tone: 'bg-[#3f3f46]' },
  { label: 'Delivery Receipts', icon: Truck, tone: 'bg-[#8B1E3F]' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('login-route')
    return () => document.documentElement.classList.remove('login-route')
  }, [])

  if (user && getAuthToken()) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password, remember: true })
      navigate(from, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen flex min-h-screen flex-col overflow-y-auto lg:h-screen lg:overflow-hidden lg:flex-row">
      <section className="relative order-2 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto bg-[#1a1614] px-6 py-8 text-white scrollbar-hide sm:px-12 lg:order-1 lg:overflow-hidden lg:px-16 lg:py-10">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
          <div>
            <div className="text-lg font-bold tracking-[0.08em]">RESPONSIVCODE</div>
            <div className="text-[11px] font-medium tracking-[0.22em] text-white/55">
              ERP SYSTEM
            </div>
          </div>
        </div>

        <div className="max-w-xl py-12 lg:py-0">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Streamlined operations for your{' '}
            <span className="bg-gradient-to-r from-[#e08a4a] to-[#f3c56b] bg-clip-text text-transparent">
              business.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
            Manage quotations, purchase orders, inventory movement, and delivery
            workflows from one secure workspace.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {modules.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-4 ring-1 ring-white/10"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${item.tone}`}
                >
                  <item.icon className="h-4 w-4 text-white" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">© 2026 ResponsivCode.</p>
      </section>

      <section className="order-1 flex min-h-0 w-full shrink-0 items-center justify-center overflow-y-auto bg-white px-6 py-10 scrollbar-hide lg:order-2 lg:w-[42%] lg:px-14 lg:py-12">
        <div className="w-full max-w-[380px]">
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1614]">Sign in</h2>
          <p className="mt-1 text-sm text-neutral-400">Secure ERP access</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
              >
                Username or email
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="admin or admin@responsivcode.com"
                required
                autoFocus
                className="h-12 w-full rounded-xl border-0 bg-[#f3ecec] px-4 text-sm text-[#1a1614] outline-none ring-0 placeholder:text-neutral-400 focus:bg-[#efe6e6] focus:ring-2 focus:ring-maroon/25"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className="h-12 w-full rounded-xl border-0 bg-[#f3ecec] px-4 pr-12 text-sm text-[#1a1614] outline-none placeholder:text-neutral-400 focus:bg-[#efe6e6] focus:ring-2 focus:ring-maroon/25"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400 hover:text-[#1a1614]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="text-xs italic text-neutral-400 hover:text-maroon"
                  onClick={() =>
                    setError('Please contact your system administrator for access.')
                  }
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-[#fde8e8] px-4 py-3 text-sm text-[#9b1c1c]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-maroon text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-maroon-dark disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
