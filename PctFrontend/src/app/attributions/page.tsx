'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { attributionsApi, enseignantsApi, coursApi, anneesApi } from '@/lib/api'
import { Badge, Btn, Modal, SearchBar, Card, Empty, Spinner, Input, Sel, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'

type Attribution = Record<string, unknown>

function ModalAttribution({ item, onClose }: { item: Attribution|null; onClose: ()=>void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    id_enseignant: String(item?.id_enseignant||''),
    id_cours:      String(item?.id_cours||''),
    id_annee:      String(item?.id_annee||''),
    charge_horaire:String(item?.charge_horaire||''),
  })
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  const { data: ensList   } = useQuery({ queryKey:['ens-list'],    queryFn:()=>enseignantsApi.list().then(r=>r.data.data ?? r.data) })
  const { data: coursList  } = useQuery({ queryKey:['cours-list'],  queryFn:()=>coursApi.list().then(r=>r.data.data ?? r.data) })
  const { data: anneesList } = useQuery({ queryKey:['annees-list'], queryFn:()=>anneesApi.list().then(r=>r.data) })

  const ensOptions   = (ensList||[]).map((e:Attribution)=>({ value:String(e.id_enseignant), label:`${e.nom} ${e.prenom} (${e.statut})` }))
  const coursOptions = (coursList||[]).map((c:Attribution)=>({ value:String(c.id_cours), label:`${c.intitule_ecue} — ${c.niveau}` }))
  const anneeOptions = (anneesList||[]).map((a:Attribution)=>({ value:String(a.id_annee), label:`${a.libelle_annee}${a.active?' ✓ active':''}` }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => item
      ? attributionsApi.update(item.id_attribution as number, form)
      : attributionsApi.create(form),
    onSuccess: () => {
      toast.success(item ? 'Attribution mise à jour ✓' : 'Attribution créée ✓')
      qc.invalidateQueries({ queryKey:['attributions'] })
      onClose()
    },
    onError: (e:unknown) => {
      const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message
      toast.error(msg || 'Erreur — cette combinaison existe peut-être déjà')
    },
  })

  return (
    <Modal
      title={item ? 'Modifier l\'attribution' : 'Nouvelle attribution'}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={()=>mutate()} disabled={isPending}>
            {isPending ? <Spinner size={14}/> : 'Enregistrer'}
          </Btn>
        </>
      }
    >
      <Sel label="Enseignant" options={ensOptions} value={form.id_enseignant}
        onChange={e=>set('id_enseignant',e.target.value)} placeholder="-- Sélectionner un enseignant --"/>
      <Sel label="Cours (ECUE)" options={coursOptions} value={form.id_cours}
        onChange={e=>set('id_cours',e.target.value)} placeholder="-- Sélectionner un cours --"/>
      <Sel label="Année académique" options={anneeOptions} value={form.id_annee}
        onChange={e=>set('id_annee',e.target.value)} placeholder="-- Sélectionner une année --"/>
      <Input label="Charge horaire prévisionnelle (h)" type="number" value={form.charge_horaire}
        onChange={e=>set('charge_horaire',e.target.value)} placeholder="ex: 60"
        hint="Cette valeur définira les heures prévues dans le volume horaire"/>
    </Modal>
  )
}

export default function AttributionsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterAnnee, setFilterAnnee] = useState('')
  const [modal, setModal] = useState<null|'create'|Attribution>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['attributions', filterAnnee],
    queryFn:  () => attributionsApi.list(filterAnnee ? { id_annee: filterAnnee } : {}).then(r=>r.data),
  })
  const { data: anneesList } = useQuery({ queryKey:['annees-list'], queryFn:()=>anneesApi.list().then(r=>r.data) })

  const { mutate: del } = useMutation({
    mutationFn: (id:number) => attributionsApi.delete(id),
    onSuccess: () => { toast.success('Attribution supprimée'); qc.invalidateQueries({queryKey:['attributions']}) },
    onError: () => toast.error('Impossible de supprimer — des activités sont liées'),
  })

  const list: Attribution[] = (Array.isArray(data)?data:data?.data||[]).filter((a:Attribution) => {
    if (!search) return true
    const ens   = a.enseignant as Attribution|undefined
    const cours = a.cours      as Attribution|undefined
    return `${ens?.nom} ${ens?.prenom} ${cours?.intitule_ecue}`.toLowerCase().includes(search.toLowerCase())
  })

  const anneeOptions: { value: string; label: string }[] = (anneesList||[]).map((a:Attribution)=>({value:String(a.id_annee),label:String(a.libelle_annee)}))

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique','secretaire']}>
      <Topbar title="Attributions"/>
      <div className="page-content animate-slide">

        {/* Info */}
        <div className="info-box blue" style={{ marginBottom:16 }}>
          <span>ℹ</span>
          <span>Une attribution lie un <strong>enseignant</strong>, un <strong>cours</strong> et une <strong>année académique</strong>. Elle génère automatiquement un volume horaire prévisionnel.</span>
        </div>

        <div className="actions-bar">
          <div className="filter-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Enseignant, cours..."/>
            <select className="form-control" style={{width:'auto'}} value={filterAnnee} onChange={e=>setFilterAnnee(e.target.value)}>
              <option value="">Toutes les années</option>
              {anneeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Btn variant="primary" icon={Plus} onClick={()=>setModal('create')}>Attribuer un cours</Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{padding:40,textAlign:'center'}}><Spinner size={28}/></div>
            : list.length===0
            ? <Empty icon="🔗" text="Aucune attribution"/>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Enseignant</th><th>Statut</th><th>Cours (ECUE)</th>
                    <th>Niveau</th><th>Année académique</th><th>Charge prévue</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {list.map(a => {
                      const ens   = a.enseignant as Attribution|undefined
                      const cours = a.cours      as Attribution|undefined
                      const annee = a.annee      as Attribution|undefined
                      return (
                        <tr key={String(a.id_attribution)}>
                          <td>
                            <div className="cell-main">{String(ens?.nom||'')} {String(ens?.prenom||'')}</div>
                            <div style={{fontSize:11,color:'var(--text3)'}}>{String(ens?.email||'')}</div>
                          </td>
                          <td><Badge color={ens?.statut==='Permanent'?'green':'orange'}>{String(ens?.statut||'')}</Badge></td>
                          <td>
                            <div className="cell-main">{String(cours?.intitule_ecue||'')}</div>
                            <div style={{fontSize:11,color:'var(--text3)'}}>{String(cours?.filiere||'')} — S{String(cours?.semestre||'')}</div>
                          </td>
                          <td><Badge color="blue">{String(cours?.niveau||'')}</Badge></td>
                          <td><Badge color={annee?.active?'green':'gray'}>{String(annee?.libelle_annee||'')}</Badge></td>
                          <td>
                            <strong style={{fontFamily:'Plus Jakarta Sans,sans-serif',color:'var(--uvci-blue)',fontSize:15}}>
                              {String(a.charge_horaire)}h
                            </strong>
                          </td>
                          <td>
                            <div style={{display:'flex',gap:6}}>
                              <Btn variant="ghost" size="sm" icon={Pencil} onClick={()=>setModal(a)}/>
                              <Btn variant="danger" size="sm" icon={Trash2}
                                onClick={()=>{ if(confirm('Supprimer cette attribution ? Les activités liées seront aussi supprimées.')) del(a.id_attribution as number) }}/>
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
      </div>

      {modal && <ModalAttribution item={modal==='create'?null:modal as Attribution} onClose={()=>setModal(null)}/>}
    </DashboardLayout>
  )
}
