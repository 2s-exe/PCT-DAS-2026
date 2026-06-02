'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Download, FileText, Users, BarChart3 } from 'lucide-react'
import { rapportsApi, enseignantsApi, anneesApi } from '@/lib/api'
import { Card, Spinner, Topbar, Badge } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { downloadBlob, fmtNum } from '@/lib/helpers'

type Ens = Record<string, unknown>

function ExportButtons({ onExcel, onPdf, loading }: { onExcel:()=>void; onPdf:()=>void; loading:boolean }) {
  return (
    <div style={{display:'flex',gap:8}}>
      <button className="btn btn-ghost btn-sm" onClick={onExcel} disabled={loading}>
        <Download size={13}/> Excel
      </button>
      <button className="btn btn-primary btn-sm" onClick={onPdf} disabled={loading}>
        {loading ? <Spinner size={13}/> : <Download size={13}/>} PDF
      </button>
    </div>
  )
}

export default function RapportsPage() {
  const [ensId, setEnsId] = useState('')
  const [loading, setLoading] = useState<string|null>(null)

  const { data: ensList   } = useQuery({ queryKey:['ens-list'],    queryFn:()=>enseignantsApi.list().then(r=>r.data.data ?? r.data) })
  const { data: anneesList } = useQuery({ queryKey:['annees-list'],queryFn:()=>anneesApi.list().then(r=>r.data) })
  const anneeActive = ((Array.isArray(anneesList)?anneesList:anneesList)||[]).find((a:Ens)=>a.active)

  const anneeIdActive = anneeActive?.id_annee as number|undefined

  async function exportGlobal(format: string) {
    setLoading('global-'+format)
    try {
      const res = await rapportsApi.global(format, anneeIdActive)
      if (format !== 'json') {
        downloadBlob(res.data as Blob, `rapport_global_${String(anneeActive?.libelle_annee||'')}.${format}`)
        toast.success(`Rapport exporté en ${format.toUpperCase()}`)
      }
    } catch { toast.error('Erreur lors de l\'export') }
    finally { setLoading(null) }
  }

  async function exportFiche(format: string) {
    if (!ensId) { toast.error('Sélectionnez un enseignant'); return }
    setLoading('fiche-'+format)
    try {
      const ens = ((Array.isArray(ensList)?ensList:ensList?.data)||[]).find((e:Ens)=>String(e.id_enseignant)===ensId) as Ens|undefined
      const res = await rapportsApi.ficheEnseignant(parseInt(ensId), format, anneeIdActive)
      if (format !== 'json') {
        downloadBlob(res.data as Blob, `fiche_${String(ens?.nom||ensId)}_${String(ens?.prenom||'')}.${format}`)
        toast.success(`Fiche exportée en ${format.toUpperCase()}`)
      }
    } catch { toast.error('Erreur lors de l\'export') }
    finally { setLoading(null) }
  }

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique','secretaire']}>
      <Topbar title="Rapports & Exports"/>
      <div className="page-content animate-slide">

        {/* Année active */}
        {anneeActive && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,padding:'12px 16px',background:'rgba(52,199,138,.06)',border:'1px solid rgba(52,199,138,.2)',borderRadius:10}}>
            <Badge color="green">Année active</Badge>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:15,color:'var(--text)'}}>{String(anneeActive.libelle_annee)}</span>
            <span style={{fontSize:12,color:'var(--text3)'}}>du {String(anneeActive.date_debut)} au {String(anneeActive.date_fin)}</span>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

          {/* Rapport global */}
          <Card title={<span style={{display:'flex',alignItems:'center',gap:8}}><BarChart3 size={15}/> Rapport global annuel</span>}>
            <div className="card-body">
              <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,marginBottom:20}}>
                Synthèse complète de <strong style={{color:'var(--text)'}}>tous les enseignants</strong> pour l&apos;année académique active. Inclut les heures prévues, réalisées, complémentaires et les activités par département.
              </p>
              <div style={{padding:'10px 14px',background:'var(--surface2)',borderRadius:8,fontSize:12,color:'var(--text3)',marginBottom:16}}>
                📌 Généré automatiquement pour l&apos;année active : <strong style={{color:'var(--text)'}}>{String(anneeActive?.libelle_annee||'—')}</strong>
              </div>
              <ExportButtons
                onExcel={()=>exportGlobal('excel')}
                onPdf={()=>exportGlobal('pdf')}
                loading={loading?.startsWith('global')||false}
              />
            </div>
          </Card>

          {/* Fiche individuelle */}
          <Card title={<span style={{display:'flex',alignItems:'center',gap:8}}><Users size={15}/> Fiche individuelle enseignant</span>}>
            <div className="card-body">
              <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,marginBottom:12}}>
                Volume horaire détaillé d&apos;un enseignant : toutes ses attributions, activités validées, heures prévues et complémentaires.
              </p>
              <div className="form-group">
                <label className="form-label">Sélectionner un enseignant</label>
                <select className="form-control" value={ensId} onChange={e=>setEnsId(e.target.value)}>
                  <option value="">-- Choisir un enseignant --</option>
                  {((Array.isArray(ensList)?ensList:ensList?.data)||[]).map((e:Ens)=>(
                    <option key={String(e.id_enseignant)} value={String(e.id_enseignant)}>
                      {String(e.nom)} {String(e.prenom)} ({String(e.statut)})
                    </option>
                  ))}
                </select>
              </div>
              {ensId && (() => {
                const ens = (ensList||[]).find((e:Ens)=>String(e.id_enseignant)===ensId) as Ens|undefined
                if (!ens) return null
                return (
                  <div style={{padding:'8px 12px',background:'var(--surface2)',borderRadius:8,marginBottom:12,fontSize:12}}>
                    <div style={{fontWeight:500,color:'var(--text)'}}>{String(ens.nom)} {String(ens.prenom)}</div>
                    <div style={{color:'var(--text3)',marginTop:2}}>{String(ens.grade)} · <span style={{color:ens.statut==='Permanent'?'var(--green)':'var(--orange)'}}>{String(ens.statut)}</span></div>
                  </div>
                )
              })()}
              <ExportButtons
                onExcel={()=>exportFiche('excel')}
                onPdf={()=>exportFiche('pdf')}
                loading={loading?.startsWith('fiche')||false}
              />
            </div>
          </Card>

          {/* Info barème */}
          <Card title={<span style={{display:'flex',alignItems:'center',gap:8}}><FileText size={15}/> Barème de référence — Annexe 1</span>} style={{gridColumn:'1 / -1'}}>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Type d&apos;opération</th><th>Niveau</th><th>Description</th>
                  <th>Vhn (×1s)</th><th>×2 séances</th><th>×4 séances</th><th>×6 séances</th>
                </tr></thead>
                <tbody>
                  {[
                    {op:'conception',  n:1, desc:'Contenus simples + quiz/évaluations',              vhn:8},
                    {op:'conception',  n:2, desc:'Niveau 1 + 25% activités interactives + quiz',     vhn:15},
                    {op:'conception',  n:3, desc:'Serious games, simulations, haute qualité',         vhn:30},
                    {op:'mise_a_jour', n:1, desc:'Mise à jour N1 (½ de la conception)',               vhn:4},
                    {op:'mise_a_jour', n:2, desc:'Mise à jour N2 (½ de la conception)',               vhn:7.5},
                    {op:'mise_a_jour', n:3, desc:'Mise à jour N3 (½ de la conception)',               vhn:15},
                  ].map((row,i)=>(
                    <tr key={i}>
                      <td><span className={`badge badge-${row.op==='conception'?'blue':'purple'}`}>{row.op}</span></td>
                      <td><span className={`badge badge-${row.n===1?'orange':row.n===2?'purple':'blue'}`}>N{row.n}</span></td>
                      <td style={{fontSize:12,color:'var(--text)'}}>{row.desc}</td>
                      <td><strong style={{fontFamily:'Syne,sans-serif',fontSize:15,color:'var(--accent)'}}>{row.vhn}h</strong></td>
                      <td style={{color:'var(--text2)'}}>{fmtNum(row.vhn*2)}h</td>
                      <td style={{color:'var(--text2)'}}>{fmtNum(row.vhn*4)}h</td>
                      <td style={{color:'var(--text2)'}}>{fmtNum(row.vhn*6)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
