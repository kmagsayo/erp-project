import {
  ApiError,
  clearAuthToken,
  fetchCurrentUser,
  getAuthToken,
  loginApi,
  logoutApi,
  persistAuthToken,
} from '@/lib/api'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const AUTH_KEY = 'erp-auth-session'

export interface AuthUser {
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  apiConnected: boolean
  login: (input: { email: string; password: string; remember: boolean }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.email) return null
    return parsed
  } catch {
    return null
  }
}

function persistUser(user: AuthUser, remember: boolean) {
  const payload = JSON.stringify(user)
  localStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(AUTH_KEY)
  if (remember) localStorage.setItem(AUTH_KEY, payload)
  else sessionStorage.setItem(AUTH_KEY, payload)
}

function clearUser() {
  localStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getAuthToken() ? loadUser() : null))
  const [apiConnected, setApiConnected] = useState(false)

  useEffect(() => {
    function onSessionExpired() {
      clearUser()
      setUser(null)
      setApiConnected(false)
    }

    window.addEventListener('erp-session-expired', onSessionExpired)
    return () => window.removeEventListener('erp-session-expired', onSessionExpired)
  }, [])

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      clearUser()
      setUser(null)
      setApiConnected(false)
      return
    }

    fetchCurrentUser()
      .then((next) => {
        setUser(next)
        persistUser(next, Boolean(localStorage.getItem(AUTH_KEY)))
        setApiConnected(true)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthToken()
          clearUser()
          setUser(null)
        }
        setApiConnected(false)
      })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      apiConnected,
      async login({ email, password, remember }) {
        const result = await loginApi(email.trim().toLowerCase(), password)
        persistAuthToken(result.token, remember)
        persistUser(result.user, remember)
        setUser(result.user)
        setApiConnected(true)
      },
      async logout() {
        try {
          await logoutApi()
        } catch {
          // Still clear the local session if Laravel is already offline.
        }
        clearAuthToken()
        clearUser()
        setUser(null)
        setApiConnected(false)
      },
    }),
    [user, apiConnected],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return context
}
