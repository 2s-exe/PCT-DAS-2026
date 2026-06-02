'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Pencil, Save } from 'lucide-react'
import { parametresApi, anneesApi } from '@/lib/api'
import { Badge, Card, Spinner, Topbar, NiveauBadge } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'

type Param = Record<string, unknown>

const BAREM_OFFICIEL = [
  {op:'conception',  n:1, vhn:8,    desc:'Contenus simples + quiz + évaluations'},
  {op:'conception',  n:2, vhn:15,   desc:'N1 + 25% activités interactives + quiz + éval'},
  {op:'conception',  n:3, vhn:30,   desc:'Serious games, simulations, haute qualité'},
  {op:'mise_a_jour', n:1, vhn:4,    desc:'Mise à jour N1 (moitié de la conception)'},
  {op:'mise_a_jour', n:2, vhn:7.5,  desc:'Mise à jour N2 (moitié de la conception)'},
  {op:'mise_a_jour', n:3, vhn:15,   desc:'Mise à jour N3 (moitié de la conception)'},
]

function EditableVhn({ param, onSave }: { param: Param; onSave: (id:number,v:number)=>void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(param.heures_par_seance))

  useEffect(() => {
    setVal(String(param.heures_par_seance))
  }, [param.heures_par_seance])

  if (!editing) return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <strong style={{fontFamily:'Syne,sans-serif',fontSize:16,color:'var(--accent)'}}>{String(param.heures_par_seance)}h</strong>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setEditing(true)}><Pencil size={12}/></button>
    </div>
  )

  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <input type="number" step="0.5" className="form-control" style={{width:80,padding:'4px 8px'}}
        value={val} onChange={e=>setVal(e.target.value)}/>
      <button className="btn btn-success btn-sm btn-icon" onClick={()=>{ onSave(param.id_parametre as number, parseFloat(val)); setEditing(false) }}>
        <Save size={12}/>
      </button>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setEditing(false)}>✕</button>
    </div>
  )
}

export default function ParametresPage() {
  const qc = useQueryClient()
  const [anneeId, setAnneeId] = useState('')

  const { data: anneesList } = useQuery({ queryKey:['annees-list'], queryFn:()=>anneesApi.list().then(r=>r.data) })
  const anneeActive = (anneesList||[]).find((a:Param)=>a.active) as Param|undefined
  const selectedAnnee = anneeId || String(anneeActive?.id_annee||'')

  const { data: params, isLoading } = useQuery({
    queryKey: ['parametres', selectedAnnee],
    queryFn:  () => parametresApi.list(selectedAnnee ? {id_annee:selectedAnnee} : {}).then(r=>r.data),
    enabled:  !!selectedAnnee,
  })

  const { mutate: update } = useMutation({
    mutationFn: ({id,vhn}:{id:number,vhn:number}) => parametresApi.update(id,{heures_par_seance:vhn}),
    onSuccess: () => { toast.success('Paramètre mis à jour ✓'); qc.invalidateQueries({queryKey:['parametres']}) },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const { mutate: resetBarem, isPending: resetting } = useMutation({
    mutationFn: () => Promise.all(
      BAREM_OFFICIEL.map(b => parametresApi.create({
        type_operation: b.op, niveau: b.n,
        heures_par_seance: b.vhn, id_annee: parseInt(selectedAnnee),
        libelle_niveau: b.desc,
      }))
    ),
    onSuccess: () => { toast.success('Barème réinitialisé avec les valeurs officielles ✓'); qc.invalidateQueries({queryKey:['parametres']}) },
    onError: () => toast.error('Erreur lors de la réinitialisation'),
  })

  const paramsList: Param[] = (Array.isArray(params)?params:params?.data||[])

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique']}>
      <Topbar title="Paramètres de calcul"/>
      <div className="page-content animate-slide">

        {/* Info formule */}
        <div style={{padding:'14px 18px',background:'linear-gradient(135deg,rgba(79,142,247,.08),rgba(155,126,240,.06))',border:'1px solid rgba(79,142,247,.2)',borderRadius:12,marginBottom:20}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'var(--text)',marginBottom:6}}>
            Formule officielle — Annexe 1
          </div>
          <div style={{fontSize:13,color:'var(--text2)'}}>
            <strong style={{color:'var(--accent)',fontSize:16}}>Vhtc = Vhn × S</strong>
            {' '}— Vhn = heures par séance (défini ci-dessous) · S = nombre de séances (1, 2, 4 ou 6)
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginTop:6}}>
            La mise à jour vaut toujours la moitié du volume de conception pour le même niveau.
          </div>
        </div>

        {/* Sélecteur année */}
        <div className="actions-bar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <label style={{fontSize:13,color:'var(--text2)'}}>Année :</label>
            <select className="form-control" style={{width:'auto'}} value={selectedAnnee} onChange={e=>setAnneeId(e.target.value)}>
              {(anneesList||[]).map((a:Param)=>(
                <option key={String(a.id_annee)} value={String(a.id_annee)}>
                  {String(a.libelle_annee)}{a.active?' (active)':''}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>resetBarem()} disabled={resetting}>
            {resetting?<Spinner size={13}/>:null} Réinitialiser au barème officiel
          </button>
        </div>

        {isLoading
          ? <div style={{padding:40,textAlign:'center'}}><Spinner size={28}/></div>
          : (
          <Card title="Barème Vhn — editable par l'administrateur">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Type d&apos;opération</th><th>Niveau</th><th>Description officielle</th>
                  <th>Vhn (par séance)</th><th>Valeur barème</th><th>×2s</th><th>×4s</th><th>×6s</th>
                </tr></thead>
                <tbody>
                  {BAREM_OFFICIEL.map((b,i)=>{
                    const stored = paramsList.find(p=>p.type_operation===b.op && Number(p.niveau)===b.n)
                    const diff   = stored && Number(stored.heures_par_seance) !== b.vhn
                    const vhn    = stored ? Number(stored.heures_par_seance) : b.vhn
                    return (
                      <tr key={i}>
                        <td><Badge color={b.op==='conception'?'blue':'purple'}>{b.op}</Badge></td>
                        <td><NiveauBadge niveau={b.n}/></td>
                        <td style={{fontSize:12,color:'var(--text)',maxWidth:220}}>{b.desc}</td>
                        <td>
                          {stored
                            ? <EditableVhn param={stored} onSave={(id,v)=>update({id,vhn:v})}/>
                            : <span style={{fontSize:12,color:'var(--text3)'}}>Non créé</span>
                          }
                        </td>
                        <td>
                          <span style={{fontSize:12,color:diff?'var(--orange)':'var(--text3)'}}>
                            {diff ? <><span style={{textDecoration:'line-through'}}>{b.vhn}h</span> ⚠</> : `${b.vhn}h ✓`}
                          </span>
                        </td>
                        <td style={{color:'var(--text2)',fontSize:12}}>{vhn*2}h</td>
                        <td style={{color:'var(--text2)',fontSize:12}}>{vhn*4}h</td>
                        <td style={{color:'var(--text2)',fontSize:12}}>{vhn*6}h</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Correspondance séances/crédits */}
        <Card title="Correspondance Séances → Crédits ECUE">
          <div className="card-body">
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[[1,0,'Sans crédit'],[2,1,'1 Crédit'],[4,2,'2 Crédits'],[6,3,'3 Crédits']].map(([s,cr,label])=>(
                <div key={String(s)} style={{textAlign:'center',padding:16,background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)'}}>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:28,color:'var(--accent)'}}>{s}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>séance{Number(s)>1?'s':''}</div>
                  <div style={{marginTop:8}}><Badge color={Number(cr)===0?'gray':'purple'}>{String(label)}</Badge></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
