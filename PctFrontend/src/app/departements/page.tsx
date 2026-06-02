'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { departementsApi } from '@/lib/api'
import { Btn, Modal, SearchBar, Card, Empty, Spinner, Input, Textarea, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'

type Dept = {
  id_departement?: number
  nom_departement?: string
  responsable?: string
  description?: string
  enseignants_count?: number
  [key: string]: unknown
}

function ModalDept({ dept, onClose }: { dept: Dept | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    nom_departement: String(dept?.nom_departement || ''),
    responsable:     String(dept?.responsable     || ''),
    description:     String(dept?.description     || ''),
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => dept
      ? departementsApi.update(dept.id_departement as number, form)
      : departementsApi.create(form),
    onSuccess: () => {
      toast.success(dept ? 'Département mis à jour ✓' : 'Département créé ✓')
      qc.invalidateQueries({ queryKey: ['departements'] })
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur')
    },
  })

  return (
    <Modal
      title={dept ? 'Modifier le département' : 'Nouveau département'}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="primary" onClick={() => mutate()} disabled={isPending}>
            {isPending ? <Spinner size={14} /> : 'Enregistrer'}
          </Btn>
        </>
      }
    >
      <Input
        label="Nom du département"
        value={form.nom_departement}
        onChange={e => set('nom_departement', e.target.value)}
        placeholder="ex: Sciences et Technologies du Numérique"
      />
      <Input
        label="Responsable"
        value={form.responsable}
        onChange={e => set('responsable', e.target.value)}
        placeholder="ex: Dr. Kouamé Jean"
      />
      <Textarea
        label="Description (optionnel)"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        placeholder="Description du département..."
      />
    </Modal>
  )
}

export default function DepartementsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | Dept>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['departements'],
    queryFn:  () => departementsApi.list().then(r => r.data),
  })

  const { mutate: del } = useMutation({
    mutationFn: (id: number) => departementsApi.delete(id),
    onSuccess: () => {
      toast.success('Département supprimé')
      qc.invalidateQueries({ queryKey: ['departements'] })
    },
    onError: () => toast.error('Impossible de supprimer — des enseignants sont rattachés'),
  })

  const list: Dept[] = (data || []).filter((d: Dept) =>
    !search || String(d.nom_departement).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique']}>
      <Topbar title="Départements" />
      <div className="page-content animate-slide">
        <div className="actions-bar">
          <SearchBar value={search} onChange={setSearch} placeholder="Nom du département..." />
          <Btn variant="primary" icon={Plus} onClick={() => setModal('create')}>
            Nouveau département
          </Btn>
        </div>

        {/* Grille de cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {isLoading
            ? <div style={{ padding: 40, textAlign: 'center', gridColumn: '1/-1' }}><Spinner size={28} /></div>
            : list.length === 0
            ? <div style={{ gridColumn: '1/-1' }}><Empty icon="🏛️" text="Aucun département" /></div>
            : list.map(d => {
                const nbEns = Number(d.enseignants_count || 0)
                return (
                  <div key={String(d.id_departement)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden', transition: 'border-color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    {/* Top accent UVCI */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,var(--uvci-blue),var(--uvci-orange))' }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--accent-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--uvci-blue)' }}>
                        <Building2 size={20} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => setModal(d)} />
                        <Btn variant="danger" size="sm" icon={Trash2}
                          onClick={() => { if (confirm('Supprimer ce département ?')) del(d.id_departement as number) }} />
                      </div>
                    </div>

                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>
                      {String(d.nom_departement)}
                    </div>

                    {d.responsable && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                        Responsable : <span style={{ color: 'var(--text2)' }}>{String(d.responsable)}</span>
                      </div>
                    )}

                    {d.description && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.5 }}>
                        {String(d.description)}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: nbEns > 0 ? 'var(--green)' : 'var(--text3)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                        <strong style={{ color: 'var(--text)' }}>{nbEns}</strong> enseignant{nbEns !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {modal && (
        <ModalDept
          dept={modal === 'create' ? null : modal as Dept}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
