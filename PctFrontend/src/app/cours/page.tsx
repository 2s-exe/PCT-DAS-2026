'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers, BookOpen } from 'lucide-react'
import { coursApi, sequencesApi, ressourcesApi } from '@/lib/api'
import { Badge, Btn, Modal, SearchBar, Card, Empty, Spinner, Input, Sel, Topbar, NiveauBadge } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'

// ─── Types ───────────────────────────────────────────────────────────────────
type Cours      = Record<string, unknown>
type Sequence   = Record<string, unknown>
type Ressource  = Record<string, unknown>

const NIVEAUX   = ['L1','L2','L3','M1','M2'].map(v=>({value:v,label:v}))
const SEMESTRES = [{value:'1',label:'Semestre 1'},{value:'2',label:'Semestre 2'}]
const TYPES_RES = ['Textuel','Video','Document','Quiz','Activite','Evaluation'].map(v=>({value:v,label:v}))
const NIVEAUX_COMPLEXITE = [{value:'1',label:'Niveau 1 — Simples + quiz'},{value:'2',label:'Niveau 2 — Interactif'},{value:'3',label:'Niveau 3 — Serious Games'}]
const TYPES_OP  = [{value:'conception',label:'Conception'},{value:'mise_a_jour',label:'Mise à jour'}]

// ─── Modal Cours ──────────────────────────────────────────────────────────────
function ModalCours({ item, onClose }: { item: Cours|null; onClose: ()=>void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    intitule_ecue: String(item?.intitule_ecue||''),
    filiere: String(item?.filiere||''),
    niveau: String(item?.niveau||'L1'),
    semestre: String(item?.semestre||'1'),
    credit_ecue: String(item?.credit_ecue||''),
    charge_horaire_annuel: String(item?.charge_horaire_annuel||''),
  })
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  const { mutate, isPending } = useMutation({
    mutationFn: () => item ? coursApi.update(item.id_cours as number, form) : coursApi.create(form),
    onSuccess: () => { toast.success(item?'Cours mis à jour ✓':'Cours créé ✓'); qc.invalidateQueries({queryKey:['cours']}); onClose() },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  return (
    <Modal title={item?'Modifier le cours':'Nouveau cours'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={()=>mutate()} disabled={isPending}>{isPending?<Spinner size={14}/>:'Enregistrer'}</Btn></>}>
      <Input label="Intitulé ECUE" value={form.intitule_ecue} onChange={e=>set('intitule_ecue',e.target.value)} placeholder="ex: Bases de données avancées"/>
      <Input label="Filière" value={form.filiere} onChange={e=>set('filiere',e.target.value)} placeholder="ex: Informatique"/>
      <div className="form-row">
        <Sel label="Niveau" options={NIVEAUX} value={form.niveau} onChange={e=>set('niveau',e.target.value)}/>
        <Sel label="Semestre" options={SEMESTRES} value={form.semestre} onChange={e=>set('semestre',e.target.value)}/>
      </div>
      <div className="form-row">
        <Input label="Crédits ECUE" type="number" value={form.credit_ecue} onChange={e=>set('credit_ecue',e.target.value)} placeholder="3"/>
        <Input label="Charge horaire annuelle (h)" type="number" value={form.charge_horaire_annuel} onChange={e=>set('charge_horaire_annuel',e.target.value)} placeholder="45"/>
      </div>
    </Modal>
  )
}

// ─── Modal Séquence ───────────────────────────────────────────────────────────
function ModalSequence({ seq, idCours, onClose }: { seq: Sequence|null; idCours: number; onClose: ()=>void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    titre_sequence: String(seq?.titre_sequence||''),
    ordre_sequence: String(seq?.ordre_sequence||'1'),
    description: String(seq?.description||''),
    id_cours: idCours,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => seq ? sequencesApi.update(seq.id_sequence as number, form) : sequencesApi.create(form),
    onSuccess: () => { toast.success(seq?'Séquence mise à jour ✓':'Séquence créée ✓'); qc.invalidateQueries({queryKey:['cours-detail',idCours]}); onClose() },
    onError: () => toast.error('Erreur'),
  })

  return (
    <Modal title={seq?'Modifier la séquence':'Nouvelle séquence'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={()=>mutate()} disabled={isPending}>{isPending?<Spinner size={14}/>:'Enregistrer'}</Btn></>}>
      <Input label="Titre de la séquence" value={form.titre_sequence} onChange={e=>setForm(f=>({...f,titre_sequence:e.target.value}))} placeholder="ex: Introduction au SQL avancé"/>
      <Input label="Ordre" type="number" value={form.ordre_sequence} onChange={e=>setForm(f=>({...f,ordre_sequence:e.target.value}))} placeholder="1"/>
      <div className="form-group">
        <label className="form-label">Description (optionnel)</label>
        <textarea className="form-control" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
      </div>
    </Modal>
  )
}

// ─── Modal Ressource ──────────────────────────────────────────────────────────
function ModalRessource({ res, idSequence, onClose }: { res: Ressource|null; idSequence: number; onClose: ()=>void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    titre_ressource: String(res?.titre_ressource||''),
    type_ressource: String(res?.type_ressource||'Document'),
    niveau_complexite: String(res?.niveau_complexite||'1'),
    type_operation: String(res?.type_operation||'conception'),
    description: String(res?.description||''),
    id_sequence: idSequence,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => res ? ressourcesApi.update(res.id_ressource as number, form) : ressourcesApi.create(form),
    onSuccess: () => { toast.success('Ressource sauvegardée ✓'); qc.invalidateQueries({queryKey:['cours-detail']}); onClose() },
    onError: () => toast.error('Erreur'),
  })

  const BAREM_PREVIEW: Record<string,Record<string,number>> = { conception:{1:8,2:15,3:30}, mise_a_jour:{1:4,2:7.5,3:15} }
  const vhn = BAREM_PREVIEW[form.type_operation]?.[parseInt(form.niveau_complexite)] || 0

  return (
    <Modal title={res?'Modifier la ressource':'Nouvelle ressource'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={()=>mutate()} disabled={isPending}>{isPending?<Spinner size={14}/>:'Enregistrer'}</Btn></>}>
      <Input label="Titre de la ressource" value={form.titre_ressource} onChange={e=>setForm(f=>({...f,titre_ressource:e.target.value}))} placeholder="ex: Cours SQL — requêtes imbriquées"/>
      <div className="form-row">
        <Sel label="Type" options={TYPES_RES} value={form.type_ressource} onChange={e=>setForm(f=>({...f,type_ressource:e.target.value}))}/>
        <Sel label="Type d'opération" options={TYPES_OP} value={form.type_operation} onChange={e=>setForm(f=>({...f,type_operation:e.target.value}))}/>
      </div>
      <Sel label="Niveau de complexité" options={NIVEAUX_COMPLEXITE} value={form.niveau_complexite} onChange={e=>setForm(f=>({...f,niveau_complexite:e.target.value}))}
        hint={`Vhn = ${vhn}h par séance pour ce niveau et ce type d'opération`}/>
      <div className="form-group">
        <label className="form-label">Description (optionnel)</label>
        <textarea className="form-control" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
      </div>
    </Modal>
  )
}

// ─── Ligne expandable d'un cours ─────────────────────────────────────────────
function CoursRow({ cours, onEdit, onDelete }: { cours: Cours; onEdit: ()=>void; onDelete: ()=>void }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [modalSeq, setModalSeq]  = useState<Sequence|null|'new'>(null)
  const [modalRes, setModalRes]  = useState<{res:Ressource|null; idSeq:number}|null>(null)

  const { data: detail } = useQuery({
    queryKey: ['cours-detail', cours.id_cours],
    queryFn:  () => coursApi.get(cours.id_cours as number).then(r=>r.data),
    enabled:  expanded,
  })

  const { mutate: delSeq } = useMutation({
    mutationFn: (id:number) => sequencesApi.delete(id),
    onSuccess: () => { toast.success('Séquence supprimée'); qc.invalidateQueries({queryKey:['cours-detail', cours.id_cours]}) },
    onError: () => toast.error('Impossible de supprimer — des ressources sont liées à cette séquence'),
  })
  const { mutate: delRes } = useMutation({
    mutationFn: (id:number) => ressourcesApi.delete(id),
    onSuccess: () => { toast.success('Ressource supprimée'); qc.invalidateQueries({queryKey:['cours-detail', cours.id_cours]}) },
    onError: () => toast.error('Impossible de supprimer — des activités sont liées à cette ressource'),
  })

  const sequences: Sequence[] = (detail?.sequences || []) as Sequence[]

  return (
    <>
      <tr>
        <td>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setExpanded(e=>!e)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:2,display:'flex'}}>
              {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            <div>
              <div className="cell-main">{String(cours.intitule_ecue)}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{String(cours.filiere||'')}</div>
            </div>
          </div>
        </td>
        <td><Badge color="blue">{String(cours.niveau)}</Badge></td>
        <td>S{String(cours.semestre)}</td>
        <td>{String(cours.credit_ecue)} Cr</td>
        <td><strong style={{color:'var(--accent)'}}>{String(cours.charge_horaire_annuel)}h</strong></td>
        <td><span className="badge badge-gray">{String((cours.sequences as unknown[])?.length||0)} séq.</span></td>
        <td>
          <div style={{display:'flex',gap:6}}>
            <Btn variant="ghost" size="sm" icon={Pencil} onClick={onEdit}/>
            <Btn variant="danger" size="sm" icon={Trash2} onClick={onDelete}/>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{padding:0,background:'var(--surface2)'}}>
            <div style={{padding:'12px 20px 16px 48px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'1px'}}>Séquences pédagogiques</span>
                <Btn variant="ghost" size="sm" icon={Plus} onClick={()=>setModalSeq('new')}>Ajouter une séquence</Btn>
              </div>

              {!detail ? <div style={{padding:20,textAlign:'center'}}><Spinner size={20}/></div>
              : sequences.length === 0
              ? <div style={{padding:16,color:'var(--text3)',fontSize:13}}>Aucune séquence — cliquez sur «Ajouter une séquence»</div>
              : sequences.map((seq) => {
                  const ressources: Ressource[] = (seq.ressources || []) as Ressource[]
                  return (
                    <div key={String(seq.id_sequence)} style={{marginBottom:12,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--border)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <Layers size={13} style={{color:'var(--text3)'}}/>
                          <span style={{fontWeight:500,color:'var(--text)',fontSize:13}}>
                            {String(seq.ordre_sequence)}. {String(seq.titre_sequence)}
                          </span>
                        </div>
                        <div style={{display:'flex',gap:6}}>
                          <Btn variant="ghost" size="sm" icon={Plus} onClick={()=>setModalRes({res:null,idSeq:seq.id_sequence as number})}>Ressource</Btn>
                          <Btn variant="ghost" size="sm" icon={Pencil} onClick={()=>setModalSeq(seq)}/>
                          <Btn variant="danger" size="sm" icon={Trash2} onClick={()=>{ if(confirm('Supprimer cette séquence ?')) delSeq(seq.id_sequence as number) }}/>
                        </div>
                      </div>
                      {ressources.length > 0 && (
                        <div style={{padding:'8px 14px'}}>
                          {ressources.map((r) => (
                            <div key={String(r.id_ressource)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <BookOpen size={12} style={{color:'var(--text3)'}}/>
                                <span style={{fontSize:12,color:'var(--text)'}}>{String(r.titre_ressource)}</span>
                                <NiveauBadge niveau={Number(r.niveau_complexite)}/>
                                <span className={`badge badge-${r.type_operation==='conception'?'blue':'purple'}`} style={{fontSize:10}}>{String(r.type_operation)}</span>
                              </div>
                              <div style={{display:'flex',gap:6}}>
                                <Btn variant="ghost" size="sm" icon={Pencil} onClick={()=>setModalRes({res:r,idSeq:seq.id_sequence as number})}/>
                                <Btn variant="danger" size="sm" icon={Trash2} onClick={()=>{ if(confirm('Supprimer ?')) delRes(r.id_ressource as number) }}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </div>
          </td>
        </tr>
      )}

      {modalSeq && (
        <ModalSequence
          seq={modalSeq === 'new' ? null : modalSeq as Sequence}
          idCours={cours.id_cours as number}
          onClose={()=>setModalSeq(null)}
        />
      )}
      {modalRes && (
        <ModalRessource
          res={modalRes.res}
          idSequence={modalRes.idSeq}
          onClose={()=>setModalRes(null)}
        />
      )}
    </>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CoursPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [modal, setModal] = useState<null|'create'|Cours>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cours'],
    queryFn:  () => coursApi.list().then(r => r.data.data ?? r.data),
  })

  const { mutate: del } = useMutation({
    mutationFn: (id:number) => coursApi.delete(id),
    onSuccess: () => { toast.success('Cours supprimé'); qc.invalidateQueries({queryKey:['cours']}) },
    onError: () => toast.error('Impossible de supprimer ce cours'),
  })

  const list: Cours[] = (data||[]).filter((c:Cours) =>
    (!search || String(c.intitule_ecue).toLowerCase().includes(search.toLowerCase())) &&
    (!filterNiveau || c.niveau === filterNiveau)
  )

  return (
    <DashboardLayout roles={['admin','secretaire']}>
      <Topbar title="Cours & Séquences"/>
      <div className="page-content animate-slide">
        <div className="actions-bar">
          <div className="filter-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un cours..."/>
            <select className="form-control" style={{width:'auto'}} value={filterNiveau} onChange={e=>setFilterNiveau(e.target.value)}>
              <option value="">Tous les niveaux</option>
              {['L1','L2','L3','M1','M2'].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Btn variant="primary" icon={Plus} onClick={()=>setModal('create')}>Nouveau cours</Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{padding:40,textAlign:'center'}}><Spinner size={28}/></div>
            : list.length===0
            ? <Empty icon="📚" text="Aucun cours trouvé"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Intitulé ECUE</th><th>Niveau</th><th>Semestre</th>
                    <th>Crédits</th><th>Charge horaire</th><th>Séquences</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {list.map(c=>(
                      <CoursRow
                        key={String(c.id_cours)}
                        cours={c}
                        onEdit={()=>setModal(c)}
                        onDelete={()=>{ if(confirm('Supprimer ce cours ?')) del(c.id_cours as number) }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      </div>

      {modal && (
        <ModalCours
          item={modal==='create' ? null : modal as Cours}
          onClose={()=>setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
