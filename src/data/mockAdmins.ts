import type { AdminUser } from '@/types'

export const mockAdmins: AdminUser[] = [
  { id: 'ADM-001', name: 'Priya Sharma', email: 'priya.sharma@nazariq.gov.in', role: 'ADMIN', lastLogin: '2024-01-20T08:00:00', actionsCount: 234, avatar: 'PS' },
  { id: 'ADM-002', name: 'Arjun Reddy', email: 'arjun.reddy@nazariq.gov.in', role: 'ADMIN', lastLogin: '2024-01-20T07:45:00', actionsCount: 189, avatar: 'AR' },
  { id: 'ADM-003', name: 'Meera Iyer', email: 'meera.iyer@nazariq.gov.in', role: 'ADMIN', lastLogin: '2024-01-19T22:30:00', actionsCount: 156, avatar: 'MI' },
]
