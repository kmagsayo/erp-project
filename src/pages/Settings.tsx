import { useAuth } from '@/data/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  fetchSettings,
  savePassword,
  saveSettings,
  type AppSettings,
} from '@/lib/api'
import { applyPrintPaperSize } from '@/lib/paperSize'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

const LOCAL_KEY = 'erp-settings'

const defaultSettings: AppSettings = {
  company_name: 'RESPONSIVCODE TECHNOLOGY SOLUTIONS',
  company_address: 'RM301-E3 Medalle Bldg., Fuente Osmeña, Capitol Site, Cebu City 6000',
  company_phone: '09175734911',
  company_email: 'info@responsivcode.com',
  user_name: 'Admin',
  user_email: 'admin@responsivcode.com',
  date_format: 'F j, Y',
  paper_size: 'A4',
}

function loadLocalSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

function FieldSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary',
        'focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon-light',
      )}
    >
      {children}
    </select>
  )
}

export function SettingsPage() {
  const { apiConnected } = useAuth()
  const [form, setForm] = useState<AppSettings>(loadLocalSettings)
  const [password, setPassword] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        const next = { ...defaultSettings, ...data }
        setForm(next)
        applyPrintPaperSize(next.paper_size)
      })
      .catch(() => {
        // Keep locally saved settings when the API is unavailable.
      })
  }, [])

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setStatus(null)

    localStorage.setItem(LOCAL_KEY, JSON.stringify(form))
    applyPrintPaperSize(form.paper_size)

    try {
      await saveSettings(form)
      setStatus('Settings saved to Laravel.')
    } catch {
      setStatus('Settings saved locally in this browser.')
    }
    setSaving(false)
  }

  async function handleSavePassword(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus(null)

    if (password.password !== password.password_confirmation) {
      setError('New password and confirmation do not match.')
      return
    }

    try {
      await savePassword(password)
      setPassword({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
      setStatus('Password updated in Laravel.')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Password can only be changed when the Laravel API is running.',
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description={
          apiConnected
            ? 'Connected to Laravel API.'
            : 'Laravel API offline — settings save locally in this browser.'
        }
      />

      {status && <p className="mb-4 text-sm text-success-text">{status}</p>}
      {error && <p className="mb-4 text-sm text-error-text">{error}</p>}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Company name" className="sm:col-span-2">
              <Input
                value={form.company_name}
                onChange={(event) => update('company_name', event.target.value)}
                required
              />
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <Input
                value={form.company_address}
                onChange={(event) => update('company_address', event.target.value)}
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={form.company_phone}
                onChange={(event) => update('company_phone', event.target.value)}
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.company_email}
                onChange={(event) => update('company_email', event.target.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User account</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Display name">
              <Input
                value={form.user_name}
                onChange={(event) => update('user_name', event.target.value)}
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.user_email}
                onChange={(event) => update('user_email', event.target.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Date format">
              <FieldSelect
                value={form.date_format}
                onChange={(value) => update('date_format', value)}
              >
                <option value="F j, Y">August 19, 2026</option>
                <option value="Y-m-d">2026-08-19</option>
                <option value="m/d/Y">08/19/2026</option>
              </FieldSelect>
            </FormField>
            <FormField label="Paper size">
              <FieldSelect
                value={form.paper_size}
                onChange={(value) => update('paper_size', value)}
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </FieldSelect>
            </FormField>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </form>

      <form onSubmit={handleSavePassword} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Current password">
              <Input
                type="password"
                value={password.current_password}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    current_password: event.target.value,
                  }))
                }
                autoComplete="current-password"
              />
            </FormField>
            <FormField label="New password">
              <Input
                type="password"
                value={password.password}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirm password">
              <Input
                type="password"
                value={password.password_confirmation}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    password_confirmation: event.target.value,
                  }))
                }
                autoComplete="new-password"
              />
            </FormField>
            <div className="sm:col-span-3">
              <Button type="submit" variant="secondary">
                Update password
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
