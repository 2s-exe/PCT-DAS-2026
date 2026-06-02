'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/store/authStore'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, BookOpen, Activity, Clock,
  BarChart3, Settings, User, Layers, LogOut, Calculator,
  Building2, Calendar, Library, FileStack, ChevronRight,
  GraduationCap
} from 'lucide-react'

interface NavItem {
  to?: string
  label?: string
  icon?: LucideIcon
  section?: string
}

const NAV: Record<string, NavItem[]> = {
  admin: [
    { section: 'Principal' },
    { to: '/dashboard',    label: 'Tableau de bord',    icon: LayoutDashboard },
    { to: '/activites',    label: 'Activités',          icon: Activity },
    { section: 'Pédagogie' },
    { to: '/enseignants',  label: 'Enseignants',        icon: Users },
    { to: '/cours',        label: 'Cours (ECUE)',       icon: BookOpen },
    { to: '/sequences',    label: 'Séquences',          icon: FileStack },
    { to: '/ressources',   label: 'Ressources péda.',   icon: Library },
    { section: 'Gestion' },
    { to: '/attributions', label: 'Attributions',       icon: Layers },
    { to: '/volumes',      label: 'Volumes horaires',   icon: Clock },
    { section: 'Analyse' },
    { to: '/rapports',     label: 'Rapports & Exports', icon: BarChart3 },
    { section: 'Administration' },
    { to: '/departements', label: 'Départements',       icon: Building2 },
    { to: '/annees',       label: 'Années académiques', icon: Calendar },
    { to: '/parametres',   label: 'Paramètres Vhtc',   icon: Settings },
    { to: '/utilisateurs', label: 'Utilisateurs',       icon: User },
  ],
  secretaire: [
    { section: 'Principal' },
    { to: '/dashboard',    label: 'Tableau de bord',    icon: LayoutDashboard },
    { to: '/activites',    label: 'Activités',          icon: Activity },
    { section: 'Pédagogie' },
    { to: '/enseignants',  label: 'Enseignants',        icon: Users },
    { to: '/cours',        label: 'Cours (ECUE)',       icon: BookOpen },
    { to: '/sequences',    label: 'Séquences',          icon: FileStack },
    { to: '/ressources',   label: 'Ressources péda.',   icon: Library },
    { section: 'Gestion' },
    { to: '/attributions', label: 'Attributions',       icon: Layers },
    { to: '/volumes',      label: 'Volumes horaires',   icon: Clock },
    { section: 'Analyse' },
    { to: '/rapports',     label: 'Rapports & Exports', icon: BarChart3 },
  ],
  enseignant: [
    { section: 'Mon espace' },
    { to: '/mon-espace',    label: 'Mon tableau de bord', icon: LayoutDashboard },
    { to: '/mes-activites', label: 'Mes activités',       icon: Activity },
    { section: 'Outils' },
    { to: '/simuler',       label: 'Simulateur Vhtc',     icon: Calculator },
  ],
}

const ROLE_COLORS: Record<string, string> = {
  admin:      '#F28C28',
  secretaire: '#9B7EF0',
  enseignant: '#1D9E6F',
}
const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrateur',
  secretaire: 'Secrétaire pédagogique',
  enseignant: 'Enseignant',
}

export default function Sidebar() {
  const { user, logout, isEnseignant } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()
  const items    = NAV[user?.profil || 'admin'] || []

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const displayName = isEnseignant && user?.enseignant
    ? `${user.enseignant.prenom} ${user.enseignant.nom}`
    : user?.login?.split('@')[0] ?? ''

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className="sidebar-logo-mark">
            <GraduationCap size={20} />
          </div>
          <div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, color:'#fff', letterSpacing:'-0.3px' }}>
              PCT — UVCI
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', letterSpacing:'0.5px', marginTop:1 }}>
              Plateforme pédagogique
            </div>
          </div>
        </div>
      </div>

      {/* ── User badge ── */}
      <div className="sidebar-user">
        <div style={{
          display:'flex', alignItems:'center', gap:10
        }}>
          <div style={{
            width:34, height:34, borderRadius:8,
            background: ROLE_COLORS[user?.profil || ''] || '#0056A6',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, fontSize:13, fontWeight:700, color:'#fff',
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:12.5, color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:150 }}>
              {displayName}
            </div>
            <div style={{
              fontSize:10, fontWeight:600, letterSpacing:'0.5px',
              color: ROLE_COLORS[user?.profil || ''] || 'rgba(255,255,255,.6)',
              textTransform:'uppercase', marginTop:1,
            }}>
              {ROLE_LABELS[user?.profil || '']}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {items.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : item.to ? (
            <Link
              key={item.to}
              href={item.to}
              className={`nav-item${pathname === item.to ? ' active' : ''}`}
            >
              {item.icon && (
                <item.icon size={15} />
              )}
              <span style={{ flex:1 }}>{item.label}</span>
              {pathname === item.to && (
                <ChevronRight size={12} style={{ opacity:.6 }} />
              )}
            </Link>
          ) : null
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div style={{
          fontSize:10, color:'rgba(255,255,255,.35)', textAlign:'center',
          marginBottom:10, letterSpacing:'.5px'
        }}>
          © 2025–2026 UVCI · PCT v2.0
        </div>
        <button
          onClick={handleLogout}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
            gap:8, padding:'9px 14px', borderRadius:8,
            background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)',
            color:'rgba(255,255,255,.7)', cursor:'pointer', fontSize:13, fontWeight:500,
            transition:'all .15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(242,140,40,.2)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.08)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.7)'
          }}
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
