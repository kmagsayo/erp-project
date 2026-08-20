const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof payload.message === 'string'
        ? payload.message
        : 'The Laravel API could not complete this request.'
    throw new ApiError(message, response.status)
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
