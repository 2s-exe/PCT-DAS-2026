'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { authApi } from '@/lib/api'

export type ProfilType = 'super_admin' | 'admin_pedagogique' | 'secretaire' | 'enseignant'

export interface AuthUser {
  id:        number
  login:     string
  profil:    ProfilType
  mot_de_passe_change_requis?: boolean
  enseignant?: { id_enseignant: number; nom: string; prenom: string; statut: string }
}

interface AuthContextType {
  user:             AuthUser | null
  token:            string | null
  login:            (credentials: { login: string; mot_de_passe: string }) => Promise<AuthUser>
  logout:           () => Promise<void>
  isSuperAdmin:     boolean
  isAdminPedago:    boolean
  isAdmin:          boolean  // super_admin OU admin_pedagogique (rétro-compat)
  isSecretaire:     boolean
  isEnseignant:     boolean
  canManage:        boolean  // peut valider des activités
  canManageUsers:   boolean  // SUPER_ADMIN exclusif
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
    // Backend retourne { token, user: { id, login, role, mot_de_passe_change_requis, enseignant } }
    const { token: t, user } = res.data

    const authUser: AuthUser = {
      id:                          user.id,
      login:                       user.login,
      profil:                      user.role as ProfilType,
      mot_de_passe_change_requis:  user.mot_de_passe_change_requis ?? false,
      enseignant:                  user.enseignant ?? undefined,
    }

    localStorage.setItem('pct_token', t)
    localStorage.setItem('pct_user', JSON.stringify(authUser))
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

  const isSuperAdmin  = user?.profil === 'super_admin'
  const isAdminPedago = user?.profil === 'admin_pedagogique'
  const isSecretaire  = user?.profil === 'secretaire'
  const isEnseignant  = user?.profil === 'enseignant'

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isSuperAdmin,
      isAdminPedago,
      isAdmin:          isSuperAdmin || isAdminPedago,
      isSecretaire,
      isEnseignant,
      canManage:        isSuperAdmin || isAdminPedago || isSecretaire,
      canManageUsers:   isSuperAdmin,
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
