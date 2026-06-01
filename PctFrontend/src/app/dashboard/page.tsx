'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users, Clock, TrendingUp, AlertCircle, Activity } from 'lucide-react'
import { dashboardApi } from '@/lib/api'
import { StatCard, ProgressBar, Spinner, Card, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { pct, fmtNum } from '@/lib/helpers'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey:  ['dashboard'],
    queryFn:   () => dashboardApi.global().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <DashboardLayout roles={['admin','secretaire']}>
      <Topbar title="Tableau de bord" />
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'calc(100vh - 64px)' }}>
        <div style={{ textAlign:'center' }}>
          <Spinner size={36} />
          <div style={{ marginTop:12, color:'var(--text3)', fontSize:13 }}>Chargement des données…</div>
        </div>
      </div>
    </DashboardLayout>
  )

  const d    = data || {}
  const taux = pct(d.heures_realisees, d.heures_prevues)

  const chartData = (d.par_departement || []).map((dep: Record<string,unknown>) => ({
    name:            String(dep.departement).split(' ').slice(0,2).join(' '),
    prevues:         Number(dep.heures_prevues),
    realisees:       Number(dep.heures_realisees),
    complementaires: Number(dep.heures_complementaires),
  }))

  return (
    <DashboardLayout roles={['admin','secretaire']}>
      <Topbar title="Tableau de bord" subtitle={`Année académique ${d.annee_active || '—'}`} />
      <div className="page-content animate-slide">

        {/* KPIs */}
        <div className="stat-grid">
          <StatCard
            label="Enseignants actifs"
            value={d.total_enseignants ?? 0}
            sub={`${d.permanents ?? 0} permanents · ${d.vacataires ?? 0} vacataires`}
            color="blue" icon={Users}
          />
          <StatCard
            label="Heures réalisées"
            value={`${fmtNum(d.heures_realisees ?? 0)}h`}
            sub={`sur ${fmtNum(d.heures_prevues ?? 0)}h prévues · ${taux}%`}
            color="green" icon={Clock}
          />
          <StatCard
            label="H. complémentaires"
            value={`${fmtNum(d.heures_complementaires ?? 0)}h`}
            sub={d.annee_active ?? '—'}
            color="orange" icon={TrendingUp}
          />
          <StatCard
            label="Activités en attente"
            value={d.activites_en_attente ?? 0}
            sub="à valider"
            color="purple" icon={AlertCircle}
          />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

          {/* Avancement global */}
          <Card title="Avancement global" actions={
            <span className="badge badge-green">{d.annee_active ?? '—'}</span>
          }>
            <div className="card-body">
              {/* Taux en grand */}
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
                  ['Prévues',          d.heures_prevues,         'var(--text3)'],
                  ['Réalisées',        d.heures_realisees,        'var(--green)'],
                  ['Complémentaires',  d.heures_complementaires, 'var(--uvci-orange)'],
                ] as [string,number,string][]).map(([l,v,c]) => (
                  <div key={l} style={{ textAlign:'center', padding:'12px 8px', background:'var(--surface2)', borderRadius:10 }}>
                    <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:18, color:c }}>
                      {fmtNum(v ?? 0)}h
                    </div>
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
                : (d.par_departement as Record<string,unknown>[]).map((dep, i, arr) => {
                  const p = pct(Number(dep.heures_realisees), Number(dep.heures_prevues))
                  const color = p >= 100 ? 'var(--green)' : p >= 60 ? 'var(--uvci-blue)' : 'var(--uvci-orange)'
                  return (
                    <div key={i} style={{ paddingBottom:14, marginBottom:14, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                        <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>
                          {String(dep.departement).split(' ').slice(0,3).join(' ')}
                        </span>
                        <span style={{ fontSize:11, color:'var(--text3)', fontWeight:500 }}>
                          {String(dep.nb_enseignants)} ens.
                        </span>
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
                  <XAxis dataKey="name" tick={{ fill:'var(--text3)', fontSize:11, fontWeight:500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background:'var(--surface)',
                      border:'1px solid var(--border)',
                      borderRadius:10,
                      color:'var(--text)',
                      fontSize:12,
                      boxShadow:'var(--shadow)',
                    }}
                  />
                  <Bar dataKey="prevues"         fill="var(--border2)"       radius={[4,4,0,0]} name="Prévues" />
                  <Bar dataKey="realisees"       fill="var(--uvci-blue)"     radius={[4,4,0,0]} name="Réalisées" />
                  <Bar dataKey="complementaires" fill="var(--uvci-orange)"   radius={[4,4,0,0]} name="Complémentaires" />
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
    </DashboardLayout>
  )
}
