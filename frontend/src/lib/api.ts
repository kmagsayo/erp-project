const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'erp-api-token'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function persistAuthToken(token: string, remember: boolean) {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  if (remember) localStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

function buildApiErrorMessage(
  status: number,
  payload: Record<string, unknown>,
  errors?: Record<string, string[]>,
): string {
  if (status === 0) {
    return 'Unable to connect to Laravel API.'
  }

  if (status === 401) {
    return 'Session expired. Please log in again.'
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.'
  }

  if (status === 404) {
    return 'Requested resource was not found.'
  }

  if (status === 419) {
    return 'Session expired. Please log in again.'
  }

  if (status === 422) {
    const firstError = errors ? Object.values(errors).flat()[0] : undefined
    if (firstError) return firstError
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }
    return 'Validation failed. Please review the form fields.'
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'Unable to connect to Laravel API.'
  }

  if (status >= 500) {
    return 'Server error. Please try again later.'
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  return 'The Laravel API could not complete this request.'
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const isFormData = options?.body instanceof FormData
  const { headers: optionHeaders, ...rest } = options ?? {}

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(optionHeaders ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new ApiError('Unable to connect to Laravel API.', 0)
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    if (response.status === 401 && path !== '/login') {
      clearAuthToken()
      window.dispatchEvent(new Event('erp-session-expired'))
    }

    const errors = payload.errors as Record<string, string[]> | undefined
    throw new ApiError(
      buildApiErrorMessage(response.status, payload, errors),
      response.status,
      errors,
    )
  }

  return payload as T
}

export interface AppSettings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  user_name: string
  user_email: string
  date_format: string
  paper_size: string
}

export interface AuthUserResponse {
  name: string
  email: string
}

export interface LoginResponse {
  token: string
  user: AuthUserResponse
}

export function checkApiHealth() {
  return request<{ status: string; app: string }>('/health')
}

export function loginApi(email: string, password: string) {
  return request<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchCurrentUser() {
  return request<AuthUserResponse>('/user')
}

export function logoutApi() {
  return request<{ message: string }>('/logout', {
    method: 'POST',
  })
}

export function fetchSettings() {
  return request<AppSettings>('/settings')
}

export function saveSettings(data: AppSettings) {
  return request<{ message: string; data: AppSettings }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function savePassword(data: {
  current_password: string
  password: string
  password_confirmation: string
}) {
  return request<{ message: string }>('/settings/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
