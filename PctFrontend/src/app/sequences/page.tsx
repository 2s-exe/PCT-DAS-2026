'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { sequencesApi, coursApi } from '@/lib/api'
import { Badge, Btn, Modal, SearchBar, Card, Empty, Spinner, Input, Sel, Textarea, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'

type Seq = Record<string, unknown>

function ModalSequence({ seq, defaultCours, onClose }: { seq: Seq | null; defaultCours?: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    titre_sequence:  String(seq?.titre_sequence  || ''),
    ordre_sequence:  String(seq?.ordre_sequence  || '1'),
    description:     String(seq?.description     || ''),
    id_cours:        String(seq?.id_cours        || defaultCours || ''),
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: coursList } = useQuery({ queryKey: ['cours-list'], queryFn: () => coursApi.list().then(r => r.data.data ?? r.data) })
  const coursOptions = (coursList || []).map((c: Seq) => ({
    value: String(c.id_cours),
    label: `${c.intitule_ecue} (${c.niveau})`,
  }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => seq
      ? sequencesApi.update(seq.id_sequence as number, form)
      : sequencesApi.create(form),
    onSuccess: () => {
      toast.success(seq ? 'Séquence mise à jour ✓' : 'Séquence créée ✓')
      qc.invalidateQueries({ queryKey: ['sequences'] })
      qc.invalidateQueries({ queryKey: ['cours'] })
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur')
    },
  })

  return (
    <Modal title={seq ? 'Modifier la séquence' : 'Nouvelle séquence pédagogique'} onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={() => mutate()} disabled={isPending}>{isPending ? <Spinner size={14} /> : 'Enregistrer'}</Btn></>}>
      <Sel label="Cours (ECUE)" options={coursOptions} value={form.id_cours} onChange={e => set('id_cours', e.target.value)} placeholder="-- Choisir un cours --" />
      <div className="form-row">
        <Input label="Titre de la séquence" value={form.titre_sequence} onChange={e => set('titre_sequence', e.target.value)} placeholder="ex: Introduction au SQL avancé" />
        <Input label="Ordre" type="number" value={form.ordre_sequence} onChange={e => set('ordre_sequence', e.target.value)} placeholder="1" hint="Position dans le cours" />
      </div>
      <Textarea label="Description (optionnel)" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Objectifs et contenu de la séquence..." />
    </Modal>
  )
}

export default function SequencesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterCours, setFilterCours] = useState('')
  const [modal, setModal] = useState<null | 'create' | Seq>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sequences', filterCours],
    queryFn: () => sequencesApi.list(filterCours ? { id_cours: filterCours } : {}).then(r => r.data.data ?? r.data),
  })
  const { data: coursList } = useQuery({ queryKey: ['cours-list'], queryFn: () => coursApi.list().then(r => r.data.data ?? r.data) })

  const { mutate: del } = useMutation({
    mutationFn: (id: number) => sequencesApi.delete(id),
    onSuccess: () => { toast.success('Séquence supprimée'); qc.invalidateQueries({ queryKey: ['sequences'] }) },
    onError: () => toast.error('Impossible — des ressources sont liées à cette séquence'),
  })

  const list: Seq[] = (Array.isArray(data) ? data : data?.data || []).filter((s: Seq) =>
    !search || String(s.titre_sequence).toLowerCase().includes(search.toLowerCase())
  )

  const coursOptions = (coursList || []).map((c: Seq) => ({
    value: String(c.id_cours),
    label: String(c.intitule_ecue),
  }))

  // Grouper par cours
  const grouped = list.reduce((acc: Record<string, Seq[]>, s: Seq) => {
    const cours = s.cours as Seq | undefined
    const key = String(cours?.intitule_ecue || 'Sans cours')
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <DashboardLayout roles={['admin', 'secretaire']}>
      <Topbar title="Séquences pédagogiques" />
      <div className="page-content animate-slide">

        {/* Info hiérarchie */}
        <div style={{ padding: '10px 16px', background: 'rgba(79,142,247,.05)', border: '1px solid rgba(79,142,247,.15)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text)' }}>COURS</span>
          <ChevronRight size={14} />
          <strong style={{ color: 'var(--accent)' }}>SÉQUENCE</strong>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>RESSOURCE</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>ACTIVITÉ</span>
        </div>

        <div className="actions-bar">
          <div className="filter-row">
            <SearchBar value={search} onChange={setSearch} placeholder="Titre de la séquence..." />
            <select className="form-control" style={{ width: 'auto' }} value={filterCours} onChange={e => setFilterCours(e.target.value)}>
              <option value="">Tous les cours</option>
              {coursOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Btn variant="primary" icon={Plus} onClick={() => setModal('create')}>Nouvelle séquence</Btn>
        </div>

        {isLoading
          ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner size={28} /></div>
          : list.length === 0
          ? <Empty icon="📋" text="Aucune séquence pédagogique" />
          : Object.entries(grouped).map(([coursNom, seqs]) => (
            <Card key={coursNom} title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {coursNom}
                <Badge color="gray">{seqs.length} séquence{seqs.length !== 1 ? 's' : ''}</Badge>
              </span>
            }>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ordre</th><th>Titre de la séquence</th><th>Description</th><th>Ressources</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seqs
                      .sort((a, b) => Number(a.ordre_sequence) - Number(b.ordre_sequence))
                      .map(s => (
                        <tr key={String(s.id_sequence)}>
                          <td>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(79,142,247,.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13 }}>
                              {String(s.ordre_sequence)}
                            </div>
                          </td>
                          <td><div className="cell-main">{String(s.titre_sequence)}</div></td>
                          <td style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 250 }}>
                            {s.description ? String(s.description).slice(0, 80) + (String(s.description).length > 80 ? '…' : '') : '—'}
                          </td>
                          <td>
                            <Badge color={(s.ressources_count as number) > 0 ? 'blue' : 'gray'}>
                              {String(s.ressources_count || 0)} ressource{Number(s.ressources_count) !== 1 ? 's' : ''}
                            </Badge>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => setModal(s)} />
                              <Btn variant="danger" size="sm" icon={Trash2}
                                onClick={() => { if (confirm('Supprimer cette séquence ?')) del(s.id_sequence as number) }} />
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        }
      </div>

      {modal && (
        <ModalSequence
          seq={modal === 'create' ? null : modal as Seq}
          defaultCours={filterCours}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
