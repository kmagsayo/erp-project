import { checkApiHealth, getAuthToken } from '@/lib/api'
import { useEffect, useState } from 'react'

export function SetupApiNotice() {
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function verifyApi() {
      try {
        await checkApiHealth()
      } catch (error) {
        if (active) {
          setOfflineMessage(
            error instanceof Error ? error.message : 'Unable to connect to Laravel API.',
          )
        }
        return
      }

      // Health can succeed on an unrelated Laravel app; probe setups route shape.
      try {
        const token = getAuthToken()
        const response = await fetch('/api/setups/customers?per_page=1', {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (response.status === 404 && active) {
          setOfflineMessage(
            'This address is not serving the ERP API. Close the other program using the port, then run start-local.bat.',
          )
          return
        }
      } catch {
        // Ignore probe failures; list pages still surface their own errors.
      }

      if (active) setOfflineMessage(null)
    }

    void verifyApi()

    return () => {
      active = false
    }
  }, [])

  if (!offlineMessage) {
    return null
  }

  return (
    <div className="mb-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
      <p className="font-medium">Unable to connect to Laravel API.</p>
      <p className="mt-1">{offlineMessage}</p>
      <p className="mt-2">
        Start the application with start-local.bat. Leave that window alone while you use the ERP.
      </p>
    </div>
  )
}
