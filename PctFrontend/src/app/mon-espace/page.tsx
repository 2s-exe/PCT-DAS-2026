'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, TrendingUp, BookOpen, Award, Target } from 'lucide-react'
import { dashboardApi } from '@/lib/api'
import { ProgressBar, Card, Spinner, Topbar, Badge, Empty } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { pct, fmtNum } from '@/lib/helpers'
import { useAuth } from '@/store/authStore'

export default function MonEspacePage() {
  const { user } = useAuth()
  const { data, isLoading, error } = useQuery({
    queryKey: ['mon-espace'],
    queryFn:  () => dashboardApi.monEspace().then(r => r.data),
  })

  return (
    <DashboardLayout roles={['enseignant']}>
      <Topbar
        title="Mon espace"
        subtitle={user?.enseignant ? `${user.enseignant.prenom} ${user.enseignant.nom}` : 'Espace enseignant'}
      />
      <div className="page-content animate-slide">
        {isLoading
          ? <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}><Spinner size={32}/></div>
          : error
          ? <Empty icon="⚠" text="Impossible de charger les données. Veuillez rafraîchir la page." />
          : data
          ? <MonEspaceContent data={data} />
          : null
        }
      </div>
    </DashboardLayout>
  )
}

function MonEspaceContent({ data }: { data: Record<string,unknown> }) {
  const ens  = data.enseignant as Record<string,unknown>|undefined
  const atts = (data.attributions as Record<string,unknown>[]) || []
  const totalPrev  = Number(data.total_heures_prevues  || 0)
  const totalReal  = Number(data.total_heures_realisees || 0)
  const totalComp  = Number(data.heures_complementaires || 0)
  const p          = pct(totalReal, totalPrev)

  return (
    <>
      {/* Bandeau identité */}
      <div style={{
        background:'linear-gradient(135deg, var(--uvci-blue), var(--uvci-blue-light))',
        borderRadius:'var(--radius)',
        padding:'24px 28px',
        marginBottom:24,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 4px 20px rgba(0,86,166,.25)',
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:'rgba(255,255,255,.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, fontWeight:800, color:'#fff',
            }}>
              {String(ens?.prenom || '?').charAt(0)}
            </div>
            <div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>
                {String(ens?.prenom||'')} {String(ens?.nom||'')}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', marginTop:2 }}>
                {String(ens?.grade||'')} · Année {String(data.annee_active||'—')}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Badge color={ens?.statut==='Permanent'?'green':'orange'}>{String(ens?.statut||'')}</Badge>
            {ens?.statut === 'Vacataire' && (
              <span style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>
                ⚠ Toutes vos heures sont des heures complémentaires (RG09)
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:40, color:'#fff', lineHeight:1 }}>
            {p}%
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:4 }}>taux de réalisation</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { icon:Clock,     label:'Heures prévues',     value:`${fmtNum(totalPrev)}h`,  color:'blue'   },
          { icon:BookOpen,  label:'Heures réalisées',   value:`${fmtNum(totalReal)}h`,  color:'green'  },
          { icon:TrendingUp,label:'H. complémentaires', value:`${fmtNum(totalComp)}h`,  color:'orange' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={18} color="var(--uvci-blue)" />
              </div>
              <span style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'1px', color:'var(--text3)', fontWeight:700 }}>{label}</span>
            </div>
            <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:28, color: color === 'blue' ? 'var(--uvci-blue)' : color === 'green' ? 'var(--green)' : 'var(--uvci-orange)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Barre de progression globale */}
      <Card title="Progression globale" actions={
        <span style={{ fontSize:12, color:'var(--text3)' }}>{fmtNum(totalReal)}h / {fmtNum(totalPrev)}h</span>
      }>
        <div className="card-body">
          <ProgressBar value={totalReal} max={totalPrev || 1} />
        </div>
      </Card>

      {/* Attributions */}
      <Card title={<span style={{ display:'flex', alignItems:'center', gap:8 }}><Award size={15}/> Mes attributions</span>}>
        {atts.length === 0
          ? <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
              Aucune attribution pour cette année académique.
            </div>
          : atts.map((a, i) => {
              const cours = a.cours as Record<string,unknown>|undefined
              const vol   = a.volumeHoraire as Record<string,unknown>|undefined
              const prev  = Number(vol?.heures_prevues  || a.charge_horaire || 0)
              const real  = Number(vol?.heures_realisees || 0)
              const comp  = Number(vol?.heures_complementaires || 0)
              const p2    = pct(real, prev)
              const color = p2 >= 100 ? 'var(--green)' : p2 >= 60 ? 'var(--uvci-blue)' : 'var(--uvci-orange)'
              return (
                <div key={i} style={{ padding:'18px 20px', borderBottom: i < atts.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:600, color:'var(--text)', fontSize:14 }}>
                        {String(cours?.intitule_ecue || '')}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                        {String(cours?.filiere || '')} · {String(cours?.niveau || '')} · S{String(cours?.semestre || '')}
                      </div>
                    </div>
                    <span style={{
                      fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16, color,
                      background: color === 'var(--green)' ? 'var(--green-light)' : color === 'var(--uvci-blue)' ? 'var(--accent-light)' : 'var(--uvci-orange-lt)',
                      padding:'4px 12px', borderRadius:20,
                    }}>
                      {real}h / {prev}h
                    </span>
                  </div>
                  <ProgressBar value={real} max={prev || 1} color={color} />
                  <div style={{ display:'flex', gap:20, marginTop:8, fontSize:11, color:'var(--text3)' }}>
                    <span>✓ {real}h réalisées</span>
                    {comp > 0 && <span style={{ color:'var(--uvci-orange)' }}>+{comp}h complémentaires</span>}
                    <span style={{ marginLeft:'auto', color, fontWeight:600 }}>{p2}%</span>
                  </div>
                </div>
              )
            })
        }
      </Card>
    </>
  )
}
