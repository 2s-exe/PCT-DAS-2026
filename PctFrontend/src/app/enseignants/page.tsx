'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, UserX, Users } from 'lucide-react'
import { enseignantsApi, departementsApi } from '@/lib/api'
import { Badge, Btn, Modal, SearchBar, Card, Empty, Spinner, Input, Sel, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'

type Ens = Record<string, unknown>

const GRADES  = ['Assistant','Maitre-Assistant','Professeur'].map(v => ({ value:v, label:v }))
const STATUTS = ['Permanent','Vacataire'].map(v => ({ value:v, label:v }))

function ModalEnseignant({ ens, onClose }: { ens: Ens|null; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: depts } = useQuery({ queryKey:['departements'], queryFn: () => departementsApi.list().then(r => r.data) })

  const [form, setForm] = useState({
    nom:            String(ens?.nom||''),
    prenom:         String(ens?.prenom||''),
    email:          String(ens?.email||''),
    telephone:      String(ens?.telephone||''),
    grade:          String(ens?.grade||'Assistant'),
    statut:         String(ens?.statut||'Permanent'),
    taux_horaire:   String(ens?.taux_horaire||''),
    id_departement: String(ens?.id_departement||''),
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => ens
      ? enseignantsApi.update(ens.id_enseignant as number, form)
      : enseignantsApi.create(form),
    onSuccess: () => {
      toast.success(ens ? 'Enseignant mis à jour ✓' : 'Enseignant ajouté ✓')
      qc.invalidateQueries({ queryKey:['enseignants'] })
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message
      toast.error(msg || 'Erreur lors de la sauvegarde')
    },
  })

  const deptOptions = (Array.isArray(depts) ? depts : depts?.data || [])
    .map((d: Ens) => ({ value: String(d.id_departement), label: String(d.nom_departement) }))

  return (
    <Modal
      title={ens ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={() => mutate()} disabled={isPending}>
            {isPending ? <Spinner size={14}/> : 'Enregistrer'}
          </Btn>
        </>
      }
    >
      <div className="form-row">
        <Input label="Nom"    value={form.nom}    onChange={e => set('nom',    e.target.value)} placeholder="Nom de famille" />
        <Input label="Prénom" value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" />
      </div>
      <Input label="Email institutionnel" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="prenom.nom@uvci.ci" />
      <Input label="Téléphone" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+225 00 00 00 00 00" />
      <div className="form-row">
        <Sel label="Grade"  options={GRADES}  value={form.grade}  onChange={e => set('grade',  e.target.value)} />
        <Sel label="Statut" options={STATUTS} value={form.statut} onChange={e => set('statut', e.target.value)} />
      </div>
      <div className="form-row">
        <Sel label="Département" options={deptOptions} value={form.id_departement} onChange={e => set('id_departement', e.target.value)} placeholder="-- Choisir --" />
        <Input label="Taux horaire (FCFA)" type="number" value={form.taux_horaire} onChange={e => set('taux_horaire', e.target.value)} placeholder="10000" />
      </div>
    </Modal>
  )
}

export default function EnseignantsPage() {
  const qc = useQueryClient()
  const [search, setSearch]   = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modal, setModal]     = useState<null|'create'|Ens>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['enseignants', filterDept, filterStatut],
    queryFn:  () => enseignantsApi.list({
      ...(filterDept   ? { departement: filterDept }   : {}),
      ...(filterStatut ? { statut: filterStatut }       : {}),
    }).then(r => r.data),
  })
  const { data: depts } = useQuery({ queryKey:['departements'], queryFn: () => departementsApi.list().then(r => r.data) })

  const { mutate: del } = useMutation({
    mutationFn: (id: number) => enseignantsApi.delete(id),
    onSuccess: () => { toast.success('Enseignant désactivé'); qc.invalidateQueries({ queryKey:['enseignants'] }) },
  })

  // EnseignantResource::collection retourne { data: [...], links, meta }
  const list: Ens[] = (Array.isArray(data) ? data : data?.data || [])
    .filter((e: Ens) => !search || `${e.nom} ${e.prenom} ${e.email}`.toLowerCase().includes(search.toLowerCase()))

  const deptList = Array.isArray(depts) ? depts : depts?.data || []

  return (
    <DashboardLayout roles={['admin','secretaire']}>
      <Topbar title="Enseignants" subtitle={`${list.length} enseignant${list.length !== 1 ? 's' : ''} actif${list.length !== 1 ? 's' : ''}`} />
      <div className="page-content animate-slide">

        {/* Stats rapides */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          {[
            ['Total actifs', list.length, 'var(--uvci-blue)'],
            ['Permanents',   list.filter(e => e.statut === 'Permanent').length, 'var(--green)'],
            ['Vacataires',   list.filter(e => e.statut === 'Vacataire').length, 'var(--uvci-orange)'],
            ['Départements', deptList.length, 'var(--purple)'],
          ].map(([l,v,c]) => (
            <div key={String(l)} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', boxShadow:'var(--shadow-sm)' }}>
              <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1.2px', color:'var(--text3)', fontWeight:700, marginBottom:8 }}>{String(l)}</div>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:26, color:String(c) }}>{String(v)}</div>
            </div>
          ))}
        </div>

        <div className="actions-bar">
          <div className="filter-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Nom, prénom, email…" />
            <select className="form-control" style={{ width:'auto' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">Tous les départements</option>
              {deptList.map((d: Ens) => <option key={String(d.id_departement)} value={String(d.id_departement)}>{String(d.nom_departement)}</option>)}
            </select>
            <select className="form-control" style={{ width:'auto' }} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="Permanent">Permanents</option>
              <option value="Vacataire">Vacataires</option>
            </select>
          </div>
          <Btn variant="primary" icon={Plus} onClick={() => setModal('create')}>Ajouter un enseignant</Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{ padding:40, textAlign:'center' }}><Spinner size={28}/></div>
            : list.length === 0
            ? <Empty icon="👨‍🏫" text="Aucun enseignant trouvé" />
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Enseignant</th><th>Grade</th><th>Statut</th>
                    <th>Département</th><th>Taux horaire</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {list.map(e => {
                      const dept = e.departement as Ens|undefined
                      return (
                        <tr key={String(e.id_enseignant)}>
                          <td>
                            <div className="cell-main">{String(e.nom)} {String(e.prenom)}</div>
                            <div style={{ fontSize:11, color:'var(--text3)' }}>{String(e.email)}</div>
                          </td>
                          <td><Badge color="purple">{String(e.grade)}</Badge></td>
                          <td><Badge color={e.statut === 'Permanent' ? 'green' : 'orange'}>{String(e.statut)}</Badge></td>
                          <td style={{ fontSize:13, color:'var(--text2)' }}>{String(dept?.nom_departement || '—')}</td>
                          <td>
                            <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, color:'var(--uvci-blue)' }}>
                              {Number(e.taux_horaire || 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </td>
                          <td>
                            <div style={{ display:'flex', gap:6 }}>
                              <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => setModal(e)} />
                              <Btn variant="danger" size="sm" icon={UserX}
                                onClick={() => { if(confirm(`Désactiver ${e.nom} ${e.prenom} ?`)) del(e.id_enseignant as number) }} />
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
      {modal && (
        <ModalEnseignant
          ens={modal === 'create' ? null : modal as Ens}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
