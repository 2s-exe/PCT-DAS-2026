'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/store/authStore'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, BookOpen, Activity, Clock,
  BarChart3, Settings, User, Layers, LogOut, Calculator,
  Building2, Calendar, Library, FileStack, ChevronRight,
  GraduationCap, ShieldCheck, KeyRound, X, Eye, EyeOff,
} from 'lucide-react'

// ── Modal Changer mot de passe ─────────────────────────────────────────────
function ModalChangerMdp({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    mot_de_passe_actuel:  '',
    nouveau_mot_de_passe: '',
    confirmation:         '',
  })
  const [showActuel,   setShowActuel]   = useState(false)
  const [showNouveau,  setShowNouveau]  = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.changerMotDePasse(form),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès ✓')
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message
      toast.error(msg || 'Erreur lors du changement de mot de passe')
    },
  })

  const regles = [
    { ok: form.nouveau_mot_de_passe.length >= 10,                 label: '10 caractères minimum' },
    { ok: /[A-Z]/.test(form.nouveau_mot_de_passe),               label: 'Une majuscule' },
    { ok: /[a-z]/.test(form.nouveau_mot_de_passe),               label: 'Une minuscule' },
    { ok: /[0-9]/.test(form.nouveau_mot_de_passe),               label: 'Un chiffre' },
    { ok: /[@#$!%^&*]/.test(form.nouveau_mot_de_passe),          label: 'Un caractère spécial (@#$!%)' },
    { ok: form.confirmation !== '' && form.confirmation === form.nouveau_mot_de_passe, label: 'Confirmation identique' },
  ]
  const pret = regles.every(r => r.ok) && form.mot_de_passe_actuel.length > 0

  const fieldStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', position: 'relative',
  }
  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '10px 40px 10px 12px',
    border: '1px solid var(--border2)', borderRadius: 8,
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 14, outline: 'none', width: '100%',
  }
  const eyeStyle: React.CSSProperties = {
    position: 'absolute', right: 10, cursor: 'pointer',
    color: 'var(--text3)', background: 'none', border: 'none',
    display: 'flex', alignItems: 'center',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'rgba(79,142,247,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <KeyRound size={17} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Changer mon mot de passe</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Modifiez votre mot de passe d&apos;accès PCT</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', display:'flex', alignItems:'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 0' }}>
          {/* Mot de passe actuel */}
          <div className="form-group">
            <label className="form-label">Mot de passe actuel</label>
            <div style={fieldStyle}>
              <input
                style={inputStyle}
                type={showActuel ? 'text' : 'password'}
                value={form.mot_de_passe_actuel}
                onChange={e => set('mot_de_passe_actuel', e.target.value)}
                placeholder="Votre mot de passe actuel"
                autoComplete="current-password"
              />
              <button style={eyeStyle} onClick={() => setShowActuel(s => !s)} type="button">
                {showActuel ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <div style={fieldStyle}>
              <input
                style={inputStyle}
                type={showNouveau ? 'text' : 'password'}
                value={form.nouveau_mot_de_passe}
                onChange={e => set('nouveau_mot_de_passe', e.target.value)}
                placeholder="Minimum 10 caractères"
                autoComplete="new-password"
              />
              <button style={eyeStyle} onClick={() => setShowNouveau(s => !s)} type="button">
                {showNouveau ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {/* Confirmation */}
          <div className="form-group">
            <label className="form-label">Confirmer le nouveau mot de passe</label>
            <div style={fieldStyle}>
              <input
                style={inputStyle}
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmation}
                onChange={e => set('confirmation', e.target.value)}
                placeholder="Répéter le nouveau mot de passe"
                autoComplete="new-password"
              />
              <button style={eyeStyle} onClick={() => setShowConfirm(s => !s)} type="button">
                {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {/* Règles de sécurité */}
          {form.nouveau_mot_de_passe.length > 0 && (
            <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 12px', marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>Politique de sécurité</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                {regles.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                    <span style={{ color: r.ok ? 'var(--green)' : 'var(--text3)', fontSize:13 }}>
                      {r.ok ? '✓' : '○'}
                    </span>
                    <span style={{ color: r.ok ? 'var(--text2)' : 'var(--text3)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', padding:'12px 20px 18px', borderTop:'1px solid var(--border)' }}>
          <button onClick={onClose}
            style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            Annuler
          </button>
          <button
            onClick={() => { if (pret) mutate() }}
            disabled={!pret || isPending}
            style={{
              padding:'9px 20px', borderRadius:8, border:'none',
              background: pret ? 'var(--accent)' : 'var(--border2)',
              color: pret ? '#fff' : 'var(--text3)',
              cursor: pret ? 'pointer' : 'not-allowed',
              fontSize:13, fontWeight:600,
              transition:'all .15s',
            }}>
            {isPending ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Navigation par profil ─────────────────────────────────────────────────
interface NavItem { to?: string; label?: string; icon?: LucideIcon; section?: string }

const NAV_ADMIN_COMMUN: NavItem[] = [
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
]

const NAV: Record<string, NavItem[]> = {
  super_admin: [
    ...NAV_ADMIN_COMMUN,
    { section: 'Administration' },
    { to: '/departements', label: 'Départements',       icon: Building2 },
    { to: '/annees',       label: 'Années académiques', icon: Calendar },
    { to: '/parametres',   label: 'Paramètres Vhtc',   icon: Settings },
    { section: 'Sécurité SI' },
    { to: '/utilisateurs', label: 'Utilisateurs',       icon: ShieldCheck },
  ],
  admin_pedagogique: [
    ...NAV_ADMIN_COMMUN,
    { section: 'Administration' },
    { to: '/departements', label: 'Départements',       icon: Building2 },
    { to: '/annees',       label: 'Années académiques', icon: Calendar },
    { to: '/parametres',   label: 'Paramètres Vhtc',   icon: Settings },
  ],
  secretaire: [...NAV_ADMIN_COMMUN],
  enseignant: [
    { section: 'Mon espace' },
    { to: '/mon-espace',    label: 'Mon tableau de bord', icon: LayoutDashboard },
    { to: '/mes-activites', label: 'Mes activités',       icon: Activity },
    { section: 'Outils' },
    { to: '/simuler',       label: 'Simulateur Vhtc',     icon: Calculator },
  ],
  // Alias rétro-compatibilité
  admin: [
    ...NAV_ADMIN_COMMUN,
    { section: 'Administration' },
    { to: '/departements', label: 'Départements',       icon: Building2 },
    { to: '/annees',       label: 'Années académiques', icon: Calendar },
    { to: '/parametres',   label: 'Paramètres Vhtc',   icon: Settings },
    { to: '/utilisateurs', label: 'Utilisateurs',       icon: User },
  ],
}

const ROLE_COLORS: Record<string, string> = {
  super_admin:       '#E63946',
  admin_pedagogique: '#F28C28',
  secretaire:        '#9B7EF0',
  enseignant:        '#1D9E6F',
  admin:             '#F28C28',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:       'Super Administrateur',
  admin_pedagogique: 'Admin. Pédagogique',
  secretaire:        'Secrétaire pédagogique',
  enseignant:        'Enseignant',
  admin:             'Administrateur',
}

// ── Sidebar ───────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout, isEnseignant } = useAuth()
  const pathname    = usePathname()
  const router      = useRouter()
  const [showMdp, setShowMdp] = useState(false)

  const profil    = user?.profil || 'enseignant'
  const items     = NAV[profil] || NAV['enseignant']
  const roleColor = ROLE_COLORS[profil] ?? '#0056A6'
  const roleLabel = ROLE_LABELS[profil] ?? profil

  const displayName = isEnseignant && user?.enseignant
    ? `${user.enseignant.prenom} ${user.enseignant.nom}`
    : user?.login?.split('@')[0] ?? ''

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <>
      <aside className="sidebar">
        {/* ── Logo ── */}
        <div className="sidebar-logo">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="sidebar-logo-mark"><GraduationCap size={20} /></div>
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
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:8, background: roleColor,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, fontSize:13, fontWeight:700, color:'#fff',
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:12.5, color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:150 }}>
                {displayName}
              </div>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.5px', color: roleColor, textTransform:'uppercase', marginTop:1 }}>
                {roleLabel}
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
                {item.icon && <item.icon size={15} />}
                <span style={{ flex:1 }}>{item.label}</span>
                {pathname === item.to && <ChevronRight size={12} style={{ opacity:.6 }} />}
              </Link>
            ) : null
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', textAlign:'center', marginBottom:8, letterSpacing:'.5px' }}>
            © 2025–2026 UVCI · PCT v2.0
          </div>

          {/* Bouton Changer mot de passe — visible par TOUS les profils */}
          <button
            onClick={() => setShowMdp(true)}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
              gap:7, padding:'8px 14px', borderRadius:8, marginBottom:6,
              background:'rgba(79,142,247,.12)', border:'1px solid rgba(79,142,247,.25)',
              color:'rgba(255,255,255,.75)', cursor:'pointer', fontSize:12, fontWeight:500,
              transition:'all .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(79,142,247,.22)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(79,142,247,.12)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.75)'
            }}
          >
            <KeyRound size={13} />
            Changer mon mot de passe
          </button>

          {/* Bouton Déconnexion */}
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

      {/* Modal changement de mot de passe (rendu en dehors du sidebar) */}
      {showMdp && <ModalChangerMdp onClose={() => setShowMdp(false)} />}
    </>
  )
}
