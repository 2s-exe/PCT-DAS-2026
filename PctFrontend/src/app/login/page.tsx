'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/store/authStore'
import { Spinner } from '@/components/ui'
import { GraduationCap, BookOpen, Users, BarChart3, Eye, EyeOff } from 'lucide-react'

const DEMO = [
  { login: 'admin@uvci.edu.ci',      password: 'secret123',      role: 'Administrateur',          color: '#0056A6' },
  { login: 'secretaire@uvci.edu.ci', password: 'secret123', role: 'Secrétaire pédagogique',  color: '#6B4ECC' },
  { login: 'j.kouakou@uvci.ci',      password: 'secret123', role: 'Enseignant — Kouassi J.', color: '#1D9E6F' },
]

const FEATURES = [
  { icon: BookOpen,  title: 'Gestion pédagogique',   desc: 'Cours, séquences, ressources et activités' },
  { icon: Users,     title: 'Suivi des enseignants',  desc: 'Attributions et volumes horaires' },
  { icon: BarChart3, title: 'Rapports & Exports',     desc: 'Fiches PDF et états Excel' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const router    = useRouter()
  const [form, setForm]       = useState({ login: '', mot_de_passe: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(form)
      toast.success('Connexion réussie !')
      router.push(user.profil === 'enseignant' ? '/mon-espace' : '/dashboard')
    } catch {
      setError('Identifiants incorrects. Vérifiez votre login et mot de passe.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-screen">
      {/* ── Partie gauche — branding UVCI ── */}
      <div className="login-left">
        {/* Logo */}
        <div style={{ position:'relative', zIndex:1, marginBottom:48 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:32 }}>
            <div style={{
              width:52, height:52, borderRadius:14,
              background:'#F28C28',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 6px 20px rgba(242,140,40,.4)',
            }}>
              <GraduationCap size={28} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:20, color:'#fff', letterSpacing:'-0.5px' }}>PCT — UVCI</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', letterSpacing:'1px', textTransform:'uppercase' }}>Système de gestion pédagogique</div>
            </div>
          </div>

          <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:38, color:'#fff', lineHeight:1.15, marginBottom:16 }}>
            Plateforme de<br />
            <span style={{ color:'#F28C28' }}>Conception</span> &<br />
            Traçabilité
          </h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.65)', lineHeight:1.7, maxWidth:380, marginBottom:40 }}>
            Gérez les activités pédagogiques, le suivi des volumes horaires et les rapports de l'UVCI depuis une interface unifiée.
          </p>

          {/* Features */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:40, height:40, borderRadius:10,
                  background:'rgba(255,255,255,.1)',
                  border:'1px solid rgba(255,255,255,.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>
                  <Icon size={18} color="rgba(255,255,255,.8)" />
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:1 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:180,
          background:'linear-gradient(to top, rgba(0,20,50,.4), transparent)',
          pointerEvents:'none', zIndex:0,
        }} />
      </div>

      {/* ── Partie droite — formulaire ── */}
      <div className="login-right">
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'4px 12px', borderRadius:20,
            background:'rgba(0,86,166,.08)', border:'1px solid rgba(0,86,166,.15)',
            fontSize:11, fontWeight:600, color:'#0056A6',
            textTransform:'uppercase', letterSpacing:'1px',
            marginBottom:16,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#0056A6', display:'inline-block' }} />
            Espace sécurisé
          </div>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:26, color:'#0A1F3C', marginBottom:6, letterSpacing:'-0.5px' }}>
            Connexion
          </h2>
          <p style={{ fontSize:13.5, color:'#7A95B8' }}>
            Accédez à votre espace avec vos identifiants institutionnels.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding:'12px 16px',
            background:'#FDECEA', border:'1px solid rgba(217,48,37,.2)',
            borderRadius:10, fontSize:13, color:'#D93025',
            marginBottom:20, display:'flex', alignItems:'center', gap:8,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom:24 }}>
          <div className="form-group">
            <label className="form-label">Identifiant institutionnel</label>
            <input
              className="form-control"
              type="email"
              placeholder="prenom.nom@uvci.edu.ci"
              value={form.login}
              onChange={e => set('login', e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group" style={{ marginBottom:24 }}>
            <label className="form-label">Mot de passe</label>
            <div style={{ position:'relative' }}>
              <input
                className="form-control"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.mot_de_passe}
                onChange={e => set('mot_de_passe', e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight:42 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer',
                  color:'#7A95B8', display:'flex', alignItems:'center',
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'12px 20px', fontSize:14, borderRadius:10 }}
          >
            {loading ? <><Spinner size={16} /> Connexion en cours…</> : 'Se connecter'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'#D4E2F4' }} />
          <span style={{ fontSize:11, color:'#B8CDE8', fontWeight:600, letterSpacing:'.5px' }}>COMPTES DE DÉMONSTRATION</span>
          <div style={{ flex:1, height:1, background:'#D4E2F4' }} />
        </div>

        {/* Demo accounts */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {DEMO.map(acc => (
            <button
              key={acc.login}
              type="button"
              onClick={() => { setForm({ login: acc.login, mot_de_passe: acc.password }); setError('') }}
              style={{
                textAlign:'left',
                background:'#F5F8FE',
                border:'1.5px solid #D4E2F4',
                borderRadius:10,
                padding:'10px 14px',
                cursor:'pointer',
                display:'flex', alignItems:'center', gap:12,
                transition:'all .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = acc.color
                ;(e.currentTarget as HTMLButtonElement).style.background = '#EBF3FF'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4E2F4'
                ;(e.currentTarget as HTMLButtonElement).style.background = '#F5F8FE'
              }}
            >
              <div style={{
                width:32, height:32, borderRadius:8,
                background: acc.color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
              }}>
                {acc.role.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize:12.5, color:'#0A1F3C', fontWeight:600 }}>{acc.role}</div>
                <div style={{ fontSize:11, color:'#7A95B8', marginTop:1 }}>{acc.login}</div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:11, color:'#B8CDE8' }}>Cliquer →</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop:32, textAlign:'center', fontSize:11, color:'#B8CDE8' }}>
          Université Virtuelle de Côte d'Ivoire · PCT v2.0 · 2025–2026
        </div>
      </div>
    </div>
  )
}
