'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { authApi } from '@/lib/api'

export interface AuthUser {
  login: string
  profil: 'admin' | 'secretaire' | 'enseignant'
  enseignant?: { id_enseignant: number; nom: string; prenom: string; statut: string }
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (credentials: { login: string; mot_de_passe: string }) => Promise<AuthUser>
  logout: () => Promise<void>
  isAdmin: boolean
  isSecretaire: boolean
  isEnseignant: boolean
  canManage: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

function getStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<AuthUser | null>(() => getStored<AuthUser>('pct_user'))
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('pct_token') : null
  )

  const login = useCallback(async (credentials: { login: string; mot_de_passe: string }) => {
    const res = await authApi.login(credentials)
    // Backend retourne { token, user: { id, login, role, enseignant } }
    const { token: t, user } = res.data

    // On normalise : le backend appelle le rôle "role", le frontend attend "profil"
    const authUser: AuthUser = {
      login:       user.login,
      profil:      user.role as AuthUser['profil'],
      enseignant:  user.enseignant ?? undefined,
    }

    // localStorage (pour Axios)
    localStorage.setItem('pct_token', t)
    localStorage.setItem('pct_user', JSON.stringify(authUser))

    // Cookies (pour le middleware Next.js)
    setCookie('pct_token', t)
    setCookie('pct_user', JSON.stringify(authUser))

    setToken(t)
    setUser(authUser)
    return authUser
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}

    localStorage.removeItem('pct_token')
    localStorage.removeItem('pct_user')
    deleteCookie('pct_token')
    deleteCookie('pct_user')

    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isAdmin:      user?.profil === 'admin',
      isSecretaire: user?.profil === 'secretaire',
      isEnseignant: user?.profil === 'enseignant',
      canManage:    user?.profil === 'admin' || user?.profil === 'secretaire',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
