'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, type ProfilType } from '@/store/authStore'
import Sidebar from './Sidebar'
import { Spinner } from '@/components/ui'

interface Props {
  children: React.ReactNode
  roles?: ProfilType[]
}

const ROLE_HOME: Record<ProfilType, string> = {
  super_admin:       '/dashboard',
  admin_pedagogique: '/dashboard',
  secretaire:        '/dashboard',
  enseignant:        '/mon-espace',
}

export default function DashboardLayout({ children, roles }: Props) {
  const { user } = useAuth()
  const router   = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) { router.push('/login'); return }
    if (roles && !roles.includes(user.profil)) {
      router.push(ROLE_HOME[user.profil] ?? '/login')
    }
  }, [user, roles, router])

  if (!mounted || !user) return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <Spinner size={32} />
    </div>
  )

  if (roles && !roles.includes(user.profil)) return null

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}
