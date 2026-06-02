'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { activitesApi, attributionsApi, ressourcesApi, anneesApi } from '@/lib/api'
import { StatutBadge, NiveauBadge, Btn, Modal, Card, Empty, Spinner, SeancesSelector, Textarea, Topbar, Sel, Badge } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { computeVhtc, fmtDate } from '@/lib/helpers'
import { useAuth } from '@/store/authStore'

type Activite = Record<string, unknown>

function ModalDeclarer({ activite, onClose }: { activite?: Activite; onClose: ()=>void }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isEdit = !!activite

  const [form, setForm] = useState({
    id_ressource:   String(activite?.id_ressource||''),
    id_attribution: String(activite?.id_attribution||''),
    nb_seances:     Number(activite?.nb_seances||2),
    date_activite:  String(activite?.date_activite||''),
    observations:   String(activite?.observations||''),
    id_annee:       String(activite?.id_annee||''),
  })
  const set = (k:string,v:unknown) => setForm(f=>({...f,[k]:v}))

  // Pour l'enseignant : filtrer ses attributions
  const { data: attrData } = useQuery({
    queryKey: ['mes-attributions'],
    queryFn:  () => attributionsApi.list().then(r=>r.data.data ?? r.data),
  })
  const { data: resData } = useQuery({
    queryKey: ['ressources-list'],
    queryFn:  () => ressourcesApi.list().then(r=>r.data.data ?? r.data),
  })
  const { data: anneeData } = useQuery({
    queryKey: ['annees-list'],
    queryFn:  () => anneesApi.list().then(r=>r.data),
  })

  const selectedRes = (resData||[]).find((r:Activite)=>r.id_ressource===parseInt(form.id_ressource)) as Activite|undefined
  const sim = selectedRes ? computeVhtc(String(selectedRes.type_operation), Number(selectedRes.niveau_complexite), form.nb_seances) : null

  const attrOptions = (attrData||[])
    .filter((a:Activite)=>!user?.enseignant || a.id_enseignant===user.enseignant.id_enseignant)
    .map((a:Activite)=>{
      const c = a.cours as Activite|undefined
      const e = a.enseignant as Activite|undefined
      return { value:String(a.id_attribution), label:`${c?.intitule_ecue} — ${e?.nom} ${e?.prenom}` }
    })

  const resOptions = (resData||[]).map((r:Activite)=>({
    value: String(r.id_ressource),
    label: `${r.titre_ressource} (N${r.niveau_complexite} · ${r.type_operation})`
  }))
  const anneeOptions = (Array.isArray(anneeData) ? anneeData : []).map((a:Activite)=>({
    value: String(a.id_annee),
    label: String(a.libelle_annee) + (a.active ? ' ★' : ''),
  }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => isEdit
      ? activitesApi.update(activite.id_activite as number, form)
      : activitesApi.create(form as Record<string,unknown>),
    onSuccess: () => {
      toast.success(isEdit ? 'Activité mise à jour ✓' : 'Activité déclarée ✓')
      qc.invalidateQueries({queryKey:['mes-activites']})
      qc.invalidateQueries({queryKey:['mon-espace']})
      onClose()
    },
    onError: (e:unknown) => {
      const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message
      toast.error(msg || 'Erreur lors de la déclaration')
    },
  })

  return (
    <Modal title={isEdit?'Modifier l\'activité':'Déclarer une activité'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={()=>mutate()} disabled={isPending}>{isPending?<Spinner size={14}/>:'Soumettre'}</Btn></>}>

      <Sel label="Année académique" options={anneeOptions} value={form.id_annee}
        onChange={e=>set('id_annee',e.target.value)} placeholder="-- Sélectionner l'année --"/>
      <Sel label="Mon attribution (cours assigné)" options={attrOptions} value={form.id_attribution}
        onChange={e=>set('id_attribution',e.target.value)} placeholder="-- Sélectionner --"/>
      <Sel label="Ressource pédagogique travaillée" options={resOptions} value={form.id_ressource}
        onChange={e=>set('id_ressource',e.target.value)} placeholder="-- Sélectionner --"/>

      {selectedRes && (
        <div style={{padding:'8px 12px',background:'var(--surface2)',borderRadius:8,marginBottom:12,fontSize:12,display:'flex',gap:10,alignItems:'center'}}>
          <NiveauBadge niveau={Number(selectedRes.niveau_complexite)}/>
          <span className={`badge badge-${selectedRes.type_operation==='conception'?'blue':'purple'}`}>{String(selectedRes.type_operation)}</span>
          <span style={{color:'var(--text3)'}}>{String(selectedRes.type_ressource)}</span>
        </div>
      )}

      <SeancesSelector value={form.nb_seances} onChange={v=>set('nb_seances',v)}/>

      <div className="form-group">
        <label className="form-label">Date de l&apos;activité</label>
        <input className="form-control" type="date" value={form.date_activite} onChange={e=>set('date_activite',e.target.value)}/>
      </div>

      <Textarea label="Observation (optionnel)" value={form.observations}
        onChange={e=>set('observations',e.target.value)} placeholder="Remarques sur cette activité..."/>

      {sim && (
        <div className="vhtc-preview">
          <div className="vhtc-row">
            <span style={{fontSize:12,color:'var(--text3)'}}>Vhn (heures par séance)</span>
            <span style={{color:'var(--text2)',fontWeight:600}}>{sim.vhn}h</span>
          </div>
          <div className="vhtc-row" style={{marginTop:6}}>
            <span style={{fontSize:15,color:'var(--text)',fontWeight:600}}>Volume Horaire Total (Vhtc)</span>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:26,color:'var(--accent)'}}>{sim.vhtc}h</span>
          </div>
          <div className="vhtc-row">
            <span style={{fontSize:12,color:'var(--text3)'}}>Crédits associés</span>
            <span style={{color:'var(--purple)',fontWeight:600}}>{sim.credits===0?'Sans crédit':`${sim.credits} Crédit${sim.credits>1?'s':''}`}</span>
          </div>
          <div className="vhtc-formula">Vhtc = Vhn × S = {sim.vhn}h × {form.nb_seances} séance(s) = <strong style={{color:'var(--accent)'}}>{sim.vhtc}h</strong></div>
        </div>
      )}
    </Modal>
  )
}

export default function MesActivitesPage() {
  const qc = useQueryClient()
  const [filterStatut, setFilterStatut] = useState('')
  const [modal, setModal] = useState<null|'new'|Activite>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mes-activites', filterStatut],
    queryFn:  () => activitesApi.list(filterStatut ? {statut:filterStatut} : {}).then(r=>r.data),
  })

  const { mutate: del } = useMutation({
    mutationFn: (id:number) => activitesApi.delete(id),
    onSuccess: () => { toast.success('Activité supprimée'); qc.invalidateQueries({queryKey:['mes-activites']}) },
    onError: () => toast.error('Impossible de supprimer une activité validée'),
  })

  const list: Activite[] = (Array.isArray(data)?data:data?.data||[])

  // Stats rapides
  const stats = {
    total:    list.length,
    valides:  list.filter(a=>a.statut==='valide').length,
    soumis:   list.filter(a=>a.statut==='soumis').length,
    brouill:  list.filter(a=>a.statut==='brouillon').length,
    totalVhtc:list.filter(a=>a.statut==='valide').reduce((s,a)=>s+Number(a.vhtc||0),0),
  }

  return (
    <DashboardLayout roles={['enseignant']}>
      <Topbar title="Mes activités"/>
      <div className="page-content animate-slide">

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          {[
            ['Total déclarées', stats.total,  'var(--text2)'],
            ['Validées',        stats.valides, 'var(--green)'],
            ['En attente',      stats.soumis,  'var(--accent)'],
            ['Vhtc validé',     stats.totalVhtc+'h','var(--orange)'],
          ].map(([l,v,c])=>(
            <div key={String(l)} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:16}}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'1px',color:'var(--text3)',marginBottom:8}}>{String(l)}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:24,color:String(c)}}>{String(v)}</div>
            </div>
          ))}
        </div>

        <div className="actions-bar">
          <select className="form-control" style={{width:'auto'}} value={filterStatut} onChange={e=>setFilterStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillons</option>
            <option value="soumis">Soumises</option>
            <option value="valide">Validées</option>
            <option value="rejete">Rejetées</option>
          </select>
          <Btn variant="primary" icon={Plus} onClick={()=>setModal('new')}>Déclarer une activité</Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{padding:40,textAlign:'center'}}><Spinner size={28}/></div>
            : list.length===0
            ? <Empty icon="📝" text="Aucune activité déclarée — commencez par en créer une"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Ressource</th><th>Niveau</th><th>Type</th>
                    <th>Cours</th><th>Séances</th><th>Vhtc</th>
                    <th>Date</th><th>Statut</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {list.map(a=>{
                      const res  = a.ressource  as Activite|undefined
                      const attr = a.attribution as Activite|undefined
                      const cours = attr?.cours  as Activite|undefined
                      const sim   = res ? computeVhtc(String(res.type_operation), Number(res.niveau_complexite), Number(a.nb_seances)) : null
                      return (
                        <tr key={String(a.id_activite)}>
                          <td>
                            <div className="cell-main" style={{maxWidth:180}}>{String(res?.titre_ressource||'')}</div>
                          </td>
                          <td><NiveauBadge niveau={Number(res?.niveau_complexite||1)}/></td>
                          <td><Badge color={res?.type_operation==='conception'?'blue':'purple'}>{String(res?.type_operation||'')}</Badge></td>
                          <td style={{fontSize:12,color:'var(--text)'}}>{String(cours?.intitule_ecue||'')}</td>
                          <td><span className="badge badge-gray">{String(a.nb_seances)} séance{Number(a.nb_seances)>1?'s':''}</span></td>
                          <td>
                            <strong style={{fontFamily:'Syne,sans-serif',color:'var(--accent)'}}>{sim?.vhtc||0}h</strong>
                            {sim && sim.credits > 0 && <div style={{fontSize:10,color:'var(--text3)'}}>{sim.credits} Cr</div>}
                          </td>
                          <td style={{fontSize:12,color:'var(--text3)'}}>{fmtDate(String(a.date_activite||''))}</td>
                          <td><StatutBadge statut={String(a.statut)}/></td>
                          <td>
                            <div style={{display:'flex',gap:6}}>
                              {a.statut !== 'valide' && (
                                <>
                                  <Btn variant="ghost" size="sm" icon={Pencil} onClick={()=>setModal(a)}/>
                                  <Btn variant="danger" size="sm" icon={Trash2}
                                    onClick={()=>{ if(confirm('Supprimer cette activité ?')) del(a.id_activite as number) }}/>
                                </>
                              )}
                              {a.statut === 'valide' && (
                                <span style={{fontSize:11,color:'var(--green)'}}>✓ Validée</span>
                              )}
                            </div>
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

        {/* Note RG09 */}
        <div style={{padding:'10px 16px',background:'rgba(240,149,74,.06)',border:'1px solid rgba(240,149,74,.2)',borderRadius:8,fontSize:12,color:'var(--text2)'}}>
          <strong style={{color:'var(--orange)'}}>RG09</strong> — Seules les activités avec le statut <strong>Validé</strong> sont comptabilisées dans votre volume horaire réalisé.
          Les activités soumises sont en attente de validation par la secrétaire ou l&apos;administrateur.
        </div>
      </div>

      {modal && (
        <ModalDeclarer
          activite={modal==='new' ? undefined : modal as Activite}
          onClose={()=>setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
