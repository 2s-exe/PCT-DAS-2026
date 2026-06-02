'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Users, Clock, TrendingUp, AlertCircle, Activity,
  ShieldCheck, ShieldOff, ShieldAlert, KeyRound,
  UserCheck, UserX, Lock, LogIn,
} from 'lucide-react'
import { dashboardApi } from '@/lib/api'
import { StatCard, ProgressBar, Spinner, Card, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/store/authStore'
import { pct, fmtNum, fmtDate } from '@/lib/helpers'

// ── Helpers ───────────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  creation_compte:       { label: 'Compte créé',         color: 'var(--green)'   },
  modification_compte:   { label: 'Compte modifié',      color: 'var(--uvci-blue)' },
  desactivation_compte:  { label: 'Compte désactivé',    color: 'var(--text3)'   },
  reinitialisation_mdp:  { label: 'MDP réinitialisé',    color: 'var(--uvci-orange)' },
  verrouillage_auto:     { label: 'Verrouillage auto',   color: 'var(--red, #E63946)' },
  verrouillage_manuel:   { label: 'Verrouillage manuel', color: 'var(--red, #E63946)' },
}

// ── Vue SUPER_ADMIN ───────────────────────────────────────────────────────────
function DashboardSuperAdmin() {
  const { data: sec, isLoading: loadSec } = useQuery({
    queryKey: ['dashboard-securite'],
    queryFn:  () => dashboardApi.securite().then(r => r.data),
    refetchInterval: 30_000,
  })
  const { data: ped, isLoading: loadPed } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => dashboardApi.global().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (loadSec || loadPed) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'calc(100vh - 64px)' }}>
      <Spinner size={36} />
    </div>
  )

  const s   = sec  || {}
  const d   = ped  || {}
  const par = s.par_role as AnyRecord || {}

  return (
    <div className="page-content animate-slide">

      {/* ── Bannière rôle ── */}
      <div style={{
        background:'linear-gradient(135deg,rgba(230,57,70,.08),rgba(230,57,70,.02))',
        border:'1px solid rgba(230,57,70,.2)', borderRadius:12,
        padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ width:36, height:36, borderRadius:8, background:'rgba(230,57,70,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ShieldCheck size={18} color="#E63946" />
        </div>
        <div>
          <div style={{ fontWeight:700, color:'var(--text)', fontSize:14 }}>Super Administrateur — Gestion du Système d&apos;Information</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Vue consolidée : sécurité SI + supervision pédagogique</div>
        </div>
      </div>

      {/* ── Section SI ── */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>
          Gestion des comptes
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
          <StatCard label="Total comptes"    value={s.total_comptes ?? 0} sub="enregistrés"              color="blue"   icon={Users} />
          <StatCard label="Comptes actifs"   value={s.actifs        ?? 0} sub="accès autorisé"           color="green"  icon={UserCheck} />
          <StatCard label="Comptes inactifs" value={s.inactifs      ?? 0} sub="accès révoqué"            color="gray"   icon={UserX} />
          <StatCard label="Verrouillés"      value={s.verrouilles   ?? 0} sub="tentatives échouées"      color="red"    icon={Lock} />
        </div>
      </div>

      {/* Répartition par rôle + alertes 24h */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Répartition par rôle */}
        <Card title="Répartition par rôle">
          <div className="card-body">
            {[
              { key:'super_admin',       label:'Super Administrateur', color:'#E63946' },
              { key:'admin_pedagogique', label:'Admin. Pédagogique',   color:'#F28C28' },
              { key:'secretaire',        label:'Secrétaire',           color:'#9B7EF0' },
              { key:'enseignant',        label:'Enseignant',           color:'#1D9E6F' },
            ].map(({ key, label, color }) => {
              const role  = (par[key] as AnyRecord) || {}
              const total = Number(role.total  || 0)
              const actif = Number(role.actifs || 0)
              return (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{actif} actif{actif > 1 ? 's' : ''} / {total} total</div>
                  </div>
                  <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:20, color }}>
                    {total}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Alertes sécurité 24h */}
        <Card title="Alertes sécurité (24h)">
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div style={{ background:'rgba(230,57,70,.07)', border:'1px solid rgba(230,57,70,.2)', borderRadius:10, padding:'14px', textAlign:'center' }}>
                <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:28, color:'#E63946' }}>
                  {s.echecs_connexion_24h ?? 0}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
                  <ShieldOff size={11} style={{ display:'inline', marginRight:4 }} />
                  Connexions échouées
                </div>
              </div>
              <div style={{ background:'rgba(240,149,74,.07)', border:'1px solid rgba(240,149,74,.2)', borderRadius:10, padding:'14px', textAlign:'center' }}>
                <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:28, color:'var(--uvci-orange)' }}>
                  {s.verrouillages_24h ?? 0}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
                  <ShieldAlert size={11} style={{ display:'inline', marginRight:4 }} />
                  Comptes verrouillés
                </div>
              </div>
            </div>

            {/* Comptes verrouillés actuellement */}
            {(s.comptes_verrouilles as AnyRecord[] || []).length > 0 ? (
              <>
                <div style={{ fontSize:11, fontWeight:600, color:'#E63946', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                  Verrouillés maintenant
                </div>
                {(s.comptes_verrouilles as AnyRecord[]).map((u, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                    <span style={{ color:'var(--text)' }}>{String(u.login)}</span>
                    <span style={{ color:'var(--text3)' }}>jusqu&apos;à {fmtDate(String(u.verrouille_jusqu_a || ''))}</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'16px 0', color:'var(--green)', fontSize:13 }}>
                <ShieldCheck size={20} style={{ display:'block', margin:'0 auto 6px' }} />
                Aucun compte verrouillé
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Dernières connexions + Journal des actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

        <Card title="Dernières connexions réussies">
          <div className="card-body">
            {(s.dernieres_connexions as AnyRecord[] || []).length === 0
              ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, padding:16 }}>Aucune connexion enregistrée</div>
              : (s.dernieres_connexions as AnyRecord[]).map((c, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:'rgba(29,158,111,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <LogIn size={13} color="var(--green)" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{String(c.login)}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{String(c.adresse_ip || '—')}</div>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{fmtDate(String(c.date || ''))}</div>
                </div>
              ))}
          </div>
        </Card>

        <Card title="Journal — actions récentes">
          <div className="card-body">
            {(s.dernieres_actions as AnyRecord[] || []).length === 0
              ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, padding:16 }}>Aucune action enregistrée</div>
              : (s.dernieres_actions as AnyRecord[]).map((a, i) => {
                const cfg = ACTION_LABELS[String(a.action)] || { label: String(a.action), color:'var(--text3)' }
                return (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:cfg.color, marginTop:5, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize:11, color:'var(--text2)', marginTop:1, lineHeight:1.4 }}>{String(a.description)}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>par {String(a.login)} · {fmtDate(String(a.date || ''))}</div>
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      </div>

      {/* ── Section Pédagogie (supervision) ── */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>
          Supervision pédagogique — {d.annee_active ?? '—'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
          <StatCard label="Enseignants actifs" value={d.total_enseignants ?? 0} sub={`${d.permanents ?? 0} perm. · ${d.vacataires ?? 0} vac.`} color="blue"   icon={Users} />
          <StatCard label="Heures réalisées"   value={`${fmtNum(d.heures_realisees ?? 0)}h`} sub={`sur ${fmtNum(d.heures_prevues ?? 0)}h prévues`} color="green"  icon={Clock} />
          <StatCard label="H. complémentaires" value={`${fmtNum(d.heures_complementaires ?? 0)}h`} sub={d.annee_active ?? '—'} color="orange" icon={TrendingUp} />
          <StatCard label="Activités en attente" value={d.activites_en_attente ?? 0} sub="à valider" color="purple" icon={AlertCircle} />
        </div>
      </div>
    </div>
  )
}

// ── Vue ADMIN_PEDAGOGIQUE & SECRETAIRE ────────────────────────────────────────
function DashboardPedago({ profil }: { profil: string }) {
  const { data, isLoading } = useQuery({
    queryKey:  ['dashboard'],
    queryFn:   () => dashboardApi.global().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'calc(100vh - 64px)' }}>
      <Spinner size={36} />
    </div>
  )

  const d    = data || {}
  const taux = pct(d.heures_realisees, d.heures_prevues)

  const chartData = (d.par_departement || []).map((dep: AnyRecord) => ({
    name:            String(dep.departement).split(' ').slice(0,2).join(' '),
    prevues:         Number(dep.heures_prevues),
    realisees:       Number(dep.heures_realisees),
    complementaires: Number(dep.heures_complementaires),
  }))

  const bannerColor  = profil === 'admin_pedagogique' ? '#F28C28' : '#9B7EF0'
  const bannerBg     = profil === 'admin_pedagogique' ? 'rgba(242,140,40,.08)' : 'rgba(155,126,240,.08)'
  const bannerBorder = profil === 'admin_pedagogique' ? 'rgba(242,140,40,.2)' : 'rgba(155,126,240,.2)'
  const bannerLabel  = profil === 'admin_pedagogique' ? 'Administrateur Pédagogique — Gestion académique' : 'Secrétaire — Consultation & saisie'
  const bannerSub    = profil === 'admin_pedagogique' ? 'CRUD complet : enseignants, attributions, activités, paramètres' : 'Déclaration d\'activités, consultation et génération de documents'

  return (
    <div className="page-content animate-slide">

      {/* Bannière rôle */}
      <div style={{
        background:`linear-gradient(135deg,${bannerBg},rgba(0,0,0,0))`,
        border:`1px solid ${bannerBorder}`, borderRadius:12,
        padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ width:36, height:36, borderRadius:8, background:bannerBg, border:`1px solid ${bannerBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Activity size={18} color={bannerColor} />
        </div>
        <div>
          <div style={{ fontWeight:700, color:'var(--text)', fontSize:14 }}>{bannerLabel}</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{bannerSub}</div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span className="badge badge-green">{d.annee_active ?? '—'}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="stat-grid">
        <StatCard label="Enseignants actifs" value={d.total_enseignants ?? 0}       sub={`${d.permanents ?? 0} permanents · ${d.vacataires ?? 0} vacataires`} color="blue"   icon={Users} />
        <StatCard label="Heures réalisées"   value={`${fmtNum(d.heures_realisees ?? 0)}h`} sub={`sur ${fmtNum(d.heures_prevues ?? 0)}h prévues · ${taux}%`}    color="green"  icon={Clock} />
        <StatCard label="H. complémentaires" value={`${fmtNum(d.heures_complementaires ?? 0)}h`} sub={d.annee_active ?? '—'}                                     color="orange" icon={TrendingUp} />
        <StatCard label="Activités en attente" value={d.activites_en_attente ?? 0}  sub="à valider"                                                               color="purple" icon={AlertCircle} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Avancement global */}
        <Card title="Avancement global">
          <div className="card-body">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>Taux de réalisation</div>
                <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:36, color:'var(--uvci-blue)', lineHeight:1 }}>
                  {taux}%
                </div>
              </div>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Activity size={28} color="var(--uvci-blue)" />
              </div>
            </div>
            <ProgressBar value={d.heures_realisees ?? 0} max={d.heures_prevues ?? 1} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:18 }}>
              {([
                ['Prévues',         d.heures_prevues,        'var(--text3)'],
                ['Réalisées',       d.heures_realisees,       'var(--green)'],
                ['Complémentaires', d.heures_complementaires,'var(--uvci-orange)'],
              ] as [string,number,string][]).map(([l,v,c]) => (
                <div key={l} style={{ textAlign:'center', padding:'12px 8px', background:'var(--surface2)', borderRadius:10 }}>
                  <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:18, color:c }}>{fmtNum(v ?? 0)}h</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:3, textTransform:'uppercase', letterSpacing:'.5px' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Par département */}
        <Card title="Par département">
          <div className="card-body">
            {(d.par_departement || []).length === 0
              ? <div style={{ padding:24, textAlign:'center', color:'var(--text3)', fontSize:13 }}>Aucune donnée de département</div>
              : (d.par_departement as AnyRecord[]).map((dep, i, arr) => {
                const p     = pct(Number(dep.heures_realisees), Number(dep.heures_prevues))
                const color = p >= 100 ? 'var(--green)' : p >= 60 ? 'var(--uvci-blue)' : 'var(--uvci-orange)'
                return (
                  <div key={i} style={{ paddingBottom:14, marginBottom:14, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                      <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>
                        {String(dep.departement).split(' ').slice(0,3).join(' ')}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>{String(dep.nb_enseignants)} ens.</span>
                    </div>
                    <ProgressBar value={Number(dep.heures_realisees)} max={Number(dep.heures_prevues)} color={color} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginTop:5 }}>
                      <span>{fmtNum(Number(dep.heures_realisees))}h / {fmtNum(Number(dep.heures_prevues))}h</span>
                      <span style={{ color, fontWeight:600 }}>{p}%</span>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </Card>
      </div>

      {/* Graphique */}
      {chartData.length > 0 && (
        <Card title="Volumes horaires par département">
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:12 }} />
                <Bar dataKey="prevues"         fill="var(--border2)"     radius={[4,4,0,0]} name="Prévues" />
                <Bar dataKey="realisees"       fill="var(--uvci-blue)"   radius={[4,4,0,0]} name="Réalisées" />
                <Bar dataKey="complementaires" fill="var(--uvci-orange)" radius={[4,4,0,0]} name="Complémentaires" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:8 }}>
              {[['Prévues','var(--border2)'],['Réalisées','var(--uvci-blue)'],['Complémentaires','var(--uvci-orange)']].map(([l,c]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text3)' }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Page principale — routing par profil ──────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const profil   = user?.profil ?? ''

  const subtitle = profil === 'super_admin'
    ? 'Gestion SI & Supervision pédagogique'
    : profil === 'secretaire'
    ? 'Consultation & Saisie'
    : 'Gestion académique'

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique','secretaire']}>
      <Topbar title="Tableau de bord" subtitle={subtitle} />

      {profil === 'super_admin'
        ? <DashboardSuperAdmin />
        : <DashboardPedago profil={profil} />
      }
    </DashboardLayout>
  )
}
