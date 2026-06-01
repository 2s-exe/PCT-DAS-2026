'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/authStore'
import Sidebar from './Sidebar'
import { Spinner } from '@/components/ui'

interface Props {
  children: React.ReactNode
  roles?: ('admin' | 'secretaire' | 'enseignant')[]
}

export default function DashboardLayout({ children, roles }: Props) {
  const { user } = useAuth()
  const router   = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) { router.push('/login'); return }
    if (roles && !roles.includes(user.profil as 'admin' | 'secretaire' | 'enseignant')) {
      // Rediriger vers la page d'accueil du rôle
      router.push(user.profil === 'enseignant' ? '/mon-espace' : '/dashboard')
    }
  }, [user, roles, router])

  // Render spinner during hydration/auth check
  if (!mounted || !user) return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Spinner size={32} />
    </div>
  )

  if (roles && !roles.includes(user.profil as 'admin' | 'secretaire' | 'enseignant')) return null

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}
