'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, CheckCircle } from 'lucide-react'
import { anneesApi } from '@/lib/api'
import { Badge, Btn, Modal, Card, Empty, Spinner, Input, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { fmtDate } from '@/lib/helpers'

type Annee = Record<string, unknown>

function ModalAnnee({ annee, onClose }: { annee: Annee | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    libelle_annee: String(annee?.libelle_annee || ''),
    date_debut:    String(annee?.date_debut    || ''),
    date_fin:      String(annee?.date_fin      || ''),
    active:        Boolean(annee?.active       || false),
  })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => annee
      ? anneesApi.update(annee.id_annee as number, form)
      : anneesApi.create(form),
    onSuccess: () => {
      toast.success(annee ? 'Année mise à jour ✓' : 'Année créée ✓')
      qc.invalidateQueries({ queryKey: ['annees'] })
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erreur')
    },
  })

  return (
    <Modal
      title={annee ? 'Modifier l\'année académique' : 'Nouvelle année académique'}
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
        label="Libellé (ex: 2025-2026)"
        value={form.libelle_annee}
        onChange={e => set('libelle_annee', e.target.value)}
        placeholder="2025-2026"
        hint="Format recommandé : AAAA-AAAA"
      />
      <div className="form-row">
        <Input label="Date de début" type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)} />
        <Input label="Date de fin"   type="date" value={form.date_fin}   onChange={e => set('date_fin',   e.target.value)} />
      </div>
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
          <span className="form-label" style={{ margin: 0 }}>
            Définir comme année académique active
          </span>
        </label>
        <div className="form-hint">Une seule année peut être active à la fois. Les autres seront désactivées automatiquement.</div>
      </div>
    </Modal>
  )
}

export default function AnneesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<null | 'create' | Annee>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['annees'],
    queryFn:  () => anneesApi.list().then(r => r.data),
  })

  const { mutate: activate } = useMutation({
    mutationFn: (id: number) => anneesApi.update(id, { active: true }),
    onSuccess: () => {
      toast.success('Année activée ✓')
      qc.invalidateQueries({ queryKey: ['annees'] })
    },
    onError: () => toast.error('Erreur lors de l\'activation'),
  })

  const list: Annee[] = data || []

  return (
    <DashboardLayout roles={['super_admin','admin_pedagogique']}>
      <Topbar title="Années académiques" />
      <div className="page-content animate-slide">
        <div className="actions-bar">
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            Gérez les années académiques et définissez l&apos;année active.
          </div>
          <Btn variant="primary" icon={Plus} onClick={() => setModal('create')}>
            Nouvelle année
          </Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{ padding: 40, textAlign: 'center' }}><Spinner size={28} /></div>
            : list.length === 0
            ? <Empty icon="📅" text="Aucune année académique" />
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Libellé</th>
                      <th>Date de début</th>
                      <th>Date de fin</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(a => (
                      <tr key={String(a.id_annee)}>
                        <td>
                          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                            {String(a.libelle_annee)}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text2)', fontSize: 13 }}>{fmtDate(String(a.date_debut))}</td>
                        <td style={{ color: 'var(--text2)', fontSize: 13 }}>{fmtDate(String(a.date_fin))}</td>
                        <td>
                          {a.active
                            ? <Badge color="green">✓ Active</Badge>
                            : <Badge color="gray">Inactive</Badge>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!a.active && (
                              <Btn variant="success" size="sm" icon={CheckCircle}
                                onClick={() => { if (confirm('Activer cette année ? L\'année courante sera désactivée.')) activate(a.id_annee as number) }}>
                                Activer
                              </Btn>
                            )}
                            <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => setModal(a)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      </div>

      {modal && (
        <ModalAnnee
          annee={modal === 'create' ? null : modal as Annee}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
