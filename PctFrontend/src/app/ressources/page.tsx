'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ressourcesApi, sequencesApi } from '@/lib/api'
import { NiveauBadge, Badge, Btn, Modal, SearchBar, Card, Empty, Spinner, Input, Sel, Textarea, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { computeVhtc } from '@/lib/helpers'

type Res = Record<string, unknown>

const TYPE_RESSOURCE_OPTIONS = [
  'Textuel','Video','Document','Quiz','Activite','Evaluation'
].map(v => ({ value: v, label: v }))

const NIVEAU_OPTIONS = [
  { value: '1', label: 'Niveau 1 — Contenus simples + quiz/évaluations (8h/séance)' },
  { value: '2', label: 'Niveau 2 — Interactif + quiz + évaluation (15h/séance)' },
  { value: '3', label: 'Niveau 3 — Serious games / simulations (30h/séance)' },
]

const TYPE_OP_OPTIONS = [
  { value: 'conception',  label: 'Conception — Création initiale' },
  { value: 'mise_a_jour', label: 'Mise à jour — Révision (½ du volume)' },
]

function ModalRessource({ res, onClose }: { res: Res | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    titre_ressource:   String(res?.titre_ressource   || ''),
    type_ressource:    String(res?.type_ressource    || 'Document'),
    niveau_complexite: String(res?.niveau_complexite || '1'),
    type_operation:    String(res?.type_operation    || 'conception'),
    description:       String(res?.description       || ''),
    id_sequence:       String(res?.id_sequence       || ''),
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: seqData } = useQuery({
    queryKey: ['sequences-list'],
    queryFn: () => sequencesApi.list().then(r => r.data.data ?? r.data),
  })

  const seqOptions = (seqData || []).map((s: Res) => {
    const cours = s.cours as Res | undefined
    return { value: String(s.id_sequence), label: `${s.titre_sequence} (${cours?.intitule_ecue || '—'})` }
  })

  // Prévisualisation Vhtc
  const sim2  = computeVhtc(form.type_operation, parseInt(form.niveau_complexite), 2)
  const sim4  = computeVhtc(form.type_operation, parseInt(form.niveau_complexite), 4)
  const sim6  = computeVhtc(form.type_operation, parseInt(form.niveau_complexite), 6)

  const { mutate, isPending } = useMutation({
    mutationFn: () => res
      ? ressourcesApi.update(res.id_ressource as number, form)
      : ressourcesApi.create(form),
    onSuccess: () => {
      toast.success(res ? 'Ressource mise à jour ✓' : 'Ressource créée ✓')
      qc.invalidateQueries({ queryKey: ['ressources'] })
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur')
    },
  })

  return (
    <Modal title={res ? 'Modifier la ressource' : 'Nouvelle ressource pédagogique'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={() => mutate()} disabled={isPending}>{isPending ? <Spinner size={14} /> : 'Enregistrer'}</Btn></>}>

      <Input label="Titre de la ressource" value={form.titre_ressource} onChange={e => set('titre_ressource', e.target.value)} placeholder="ex: Cours SQL — requêtes imbriquées" />
      <Sel label="Séquence pédagogique" options={seqOptions} value={form.id_sequence} onChange={e => set('id_sequence', e.target.value)} placeholder="-- Choisir une séquence --" />

      <div className="form-row">
        <Sel label="Type de ressource" options={TYPE_RESSOURCE_OPTIONS} value={form.type_ressource} onChange={e => set('type_ressource', e.target.value)} />
        <Sel label="Type d'opération" options={TYPE_OP_OPTIONS} value={form.type_operation} onChange={e => set('type_operation', e.target.value)} />
      </div>

      <Sel label="Niveau de complexité (Annexe 1)" options={NIVEAU_OPTIONS} value={form.niveau_complexite} onChange={e => set('niveau_complexite', e.target.value)} />

      <Textarea label="Description (optionnel)" value={form.description} onChange={e => set('description', e.target.value)} />

      {/* Prévisualisation barème */}
      <div style={{ background: 'rgba(79,142,247,.06)', border: '1px solid rgba(79,142,247,.15)', borderRadius: 10, padding: 14, marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Vhtc prévisionnels (Vhn × S)
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            ['2 séances', sim2.vhtc, '1 Cr'],
            ['4 séances', sim4.vhtc, '2 Cr'],
            ['6 séances', sim6.vhtc, '3 Cr'],
          ].map(([label, vhtc, cr]) => (
            <div key={String(label)} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{vhtc}h</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{label}</div>
              <div style={{ fontSize: 10, color: 'var(--purple)', marginTop: 2 }}>{cr}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default function RessourcesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState<null | 'create' | Res>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ressources', filterNiveau, filterType],
    queryFn: () => ressourcesApi.list({
      ...(filterNiveau ? { niveau_complexite: filterNiveau } : {}),
      ...(filterType   ? { type_operation:    filterType   } : {}),
    }).then(r => r.data),
  })

  const { mutate: del } = useMutation({
    mutationFn: (id: number) => ressourcesApi.delete(id),
    onSuccess: () => { toast.success('Ressource supprimée'); qc.invalidateQueries({ queryKey: ['ressources'] }) },
    onError: () => toast.error('Impossible de supprimer — des activités sont liées'),
  })

  const list: Res[] = (Array.isArray(data) ? data : data?.data || []).filter((r: Res) =>
    !search || String(r.titre_ressource).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout roles={['admin', 'secretaire']}>
      <Topbar title="Ressources pédagogiques" />
      <div className="page-content animate-slide">
        <div className="actions-bar">
          <div className="filter-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Titre de la ressource..." />
            <select className="form-control" style={{ width: 'auto' }} value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}>
              <option value="">Tous niveaux</option>
              <option value="1">Niveau 1</option>
              <option value="2">Niveau 2</option>
              <option value="3">Niveau 3</option>
            </select>
            <select className="form-control" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tous types</option>
              <option value="conception">Conception</option>
              <option value="mise_a_jour">Mise à jour</option>
            </select>
          </div>
          <Btn variant="primary" icon={Plus} onClick={() => setModal('create')}>Nouvelle ressource</Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner size={28} /></div>
            : list.length === 0
            ? <Empty icon="📚" text="Aucune ressource pédagogique" />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Titre</th><th>Type</th><th>Niveau</th><th>Opération</th>
                      <th>Séquence</th><th>Vhn</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(r => {
                      const seq   = r.sequence  as Res | undefined
                      const cours = seq?.cours   as Res | undefined
                      const sim1  = computeVhtc(String(r.type_operation), Number(r.niveau_complexite), 1)
                      return (
                        <tr key={String(r.id_ressource)}>
                          <td>
                            <div className="cell-main">{String(r.titre_ressource)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{String(r.type_ressource)}</div>
                          </td>
                          <td><Badge color="gray">{String(r.type_ressource)}</Badge></td>
                          <td><NiveauBadge niveau={Number(r.niveau_complexite)} /></td>
                          <td>
                            <Badge color={r.type_operation === 'conception' ? 'blue' : 'purple'}>
                              {String(r.type_operation)}
                            </Badge>
                          </td>
                          <td>
                            {seq
                              ? <div>
                                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{String(seq.titre_sequence)}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{String(cours?.intitule_ecue || '')}</div>
                                </div>
                              : '—'
                            }
                          </td>
                          <td>
                            <strong style={{ fontFamily: 'Syne,sans-serif', color: 'var(--accent)' }}>{sim1.vhn}h</strong>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>par séance</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => setModal(r)} />
                              <Btn variant="danger" size="sm" icon={Trash2}
                                onClick={() => { if (confirm('Supprimer cette ressource ?')) del(r.id_ressource as number) }} />
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
        <ModalRessource
          res={modal === 'create' ? null : modal as Res}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
