'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { volumesApi, anneesApi } from '@/lib/api'
import { Badge, Card, Empty, Spinner, Topbar, ProgressBar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { pct, fmtNum } from '@/lib/helpers'

type Vol = Record<string, unknown>

export default function VolumesPage() {
  const [filterAnnee, setFilterAnnee] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['volumes', filterAnnee],
    queryFn:  () => volumesApi.list(filterAnnee ? { id_annee: filterAnnee } : {}).then(r=>r.data),
  })
  const { data: anneesList } = useQuery({ queryKey:['annees-list'], queryFn:()=>anneesApi.list().then(r=>r.data) })

  const list: Vol[] = (Array.isArray(data)?data:data?.data||[]).filter((v:Vol) => {
    if (!filterStatut) return true
    const ens = v.enseignant as Vol|undefined
    return ens?.statut === filterStatut
  })

  // Totaux
  const totalPrev = list.reduce((s,v)=>s+Number(v.heures_prevues||0),0)
  const totalReal = list.reduce((s,v)=>s+Number(v.heures_realisees||0),0)
  const totalComp = list.reduce((s,v)=>s+Number(v.heures_complementaires||0),0)
  const taux      = pct(totalReal, totalPrev)

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique','secretaire']}>
      <Topbar title="Volumes horaires"/>
      <div className="page-content animate-slide">

        {/* Résumé global */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
          {[
            ['Total heures prévues',         fmtNum(totalPrev)+'h', 'var(--text2)'],
            ['Total heures réalisées',        fmtNum(totalReal)+'h', 'var(--green)'],
            ['Total heures complémentaires',  fmtNum(totalComp)+'h', 'var(--orange)'],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:16}}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'1px',color:'var(--text3)',marginBottom:8}}>{l}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:24,color:c}}>{v}</div>
              {l.includes('réalisées') && <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>Taux global : {taux}%</div>}
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="actions-bar" style={{marginBottom:16}}>
          <div className="filter-row">
            <select className="form-control" style={{width:'auto'}} value={filterAnnee} onChange={e=>setFilterAnnee(e.target.value)}>
              <option value="">Toutes les années</option>
              {(anneesList||[]).map((a:Vol)=><option key={String(a.id_annee)} value={String(a.id_annee)}>{String(a.libelle_annee)}</option>)}
            </select>
            <select className="form-control" style={{width:'auto'}} value={filterStatut} onChange={e=>setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="Permanent">Permanents</option>
              <option value="Vacataire">Vacataires</option>
            </select>
          </div>
          <div style={{fontSize:12,color:'var(--text3)'}}>{list.length} attribution{list.length!==1?'s':''}</div>
        </div>

        <Card>
          {isLoading
            ? <div style={{padding:40,textAlign:'center'}}><Spinner size={28}/></div>
            : list.length===0
            ? <Empty icon="⏱" text="Aucun volume horaire"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Enseignant</th><th>Statut</th><th>Grade</th>
                    <th>Prévues</th><th>Réalisées</th><th>Complémentaires</th><th>Avancement</th>
                  </tr></thead>
                  <tbody>
                    {list.map(v=>{
                      const ens   = v.enseignant as Vol|undefined
                      const dept  = ens?.departement as Vol|undefined
                      const annee = v.annee      as Vol|undefined
                      const prev  = Number(v.heures_prevues||0)
                      const real  = Number(v.heures_realisees||0)
                      const comp  = Number(v.heures_complementaires||0)
                      const p     = pct(real, prev)
                      const color = p>=100?'var(--green)':p>=60?'var(--accent)':'var(--orange)'
                      return (
                        <tr key={String(v.id_volume)}>
                          <td>
                            <div className="cell-main">{String(ens?.nom||'')} {String(ens?.prenom||'')}</div>
                            <div style={{fontSize:11,color:'var(--text3)'}}>{String(dept?.nom_departement||'')} · {String(annee?.libelle_annee||'')}</div>
                          </td>
                          <td><Badge color={ens?.statut==='Permanent'?'green':'orange'}>{String(ens?.statut||'')}</Badge></td>
                          <td style={{fontSize:12,color:'var(--text2)'}}>{String(ens?.grade||'')}</td>
                          <td style={{fontWeight:500}}>{prev}h</td>
                          <td><strong style={{color:'var(--green)',fontFamily:'Syne,sans-serif'}}>{real}h</strong></td>
                          <td>
                            <strong style={{color:'var(--orange)',fontFamily:'Syne,sans-serif'}}>{comp}h</strong>
                            {ens?.statut==='Vacataire' && <div style={{fontSize:10,color:'var(--text3)'}}>100% compl.</div>}
                          </td>
                          <td style={{minWidth:160}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{flex:1}}><ProgressBar value={real} max={prev} color={color}/></div>
                              <span style={{fontSize:12,color,fontWeight:600,width:36,flexShrink:0}}>{p}%</span>
                            </div>
                            <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>{real}h / {prev}h</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      </div>
    </DashboardLayout>
  )
}
