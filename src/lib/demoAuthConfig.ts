import { mockAdmins } from '@/data/mockAdmins'

export const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_DEMO_PASS ?? 'admin123'
const rawPublicEmail = import.meta.env.VITE_PUBLIC_DEMO_EMAIL ?? 'citizen.demo@nazariq.gov.in'
export const DEMO_PUBLIC_EMAIL_RAW = rawPublicEmail
export const DEMO_PUBLIC_EMAIL = rawPublicEmail.toLowerCase()
export const DEMO_PUBLIC_PASSWORD = import.meta.env.VITE_PUBLIC_DEMO_PASS ?? 'public123'
export const DEMO_ADMIN_EMAILS = mockAdmins.map(admin => admin.email.toLowerCase())
export const PRIMARY_ADMIN = mockAdmins[0]
