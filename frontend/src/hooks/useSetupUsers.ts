import { listSetupRecords } from '@/lib/setupsApi'
import type { UserSetup } from '@/data/setupTypes'
import { useEffect, useState } from 'react'

export interface SetupUserOption {
  id: string
  name: string
  username: string
  positionId: string | null
  positionName: string
}

function mapUser(user: UserSetup): SetupUserOption {
  return {
    id: String(user.id),
    name: user.name,
    username: user.username,
    positionId: user.position_id ? String(user.position_id) : null,
    positionName: user.position?.name ?? '',
  }
}

export function useSetupUsers() {
  const [users, setUsers] = useState<SetupUserOption[]>([])

  useEffect(() => {
    void listSetupRecords<UserSetup>('users', 'users', { per_page: 100, status: 'active' })
      .then((result) => {
        setUsers(result.items.map(mapUser))
      })
      .catch(() => {
        setUsers([])
      })
  }, [])

  return users
}
