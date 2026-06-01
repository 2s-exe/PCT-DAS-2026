'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Check } from 'lucide-react'
import { activitesApi, attributionsApi, ressourcesApi } from '@/lib/api'
import { StatutBadge, NiveauBadge, Btn, Modal, SearchBar, Card, Empty, Spinner, SeancesSelector, Textarea, Topbar, Sel } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { computeVhtc, fmtDate, BAREM } from '@/lib/helpers'
import { useAuth } from '@/store/authStore'

// ── Modale validation ─────────────────────────────────────────────────────────
function ModalValider({ activite, onClose }: { activite: Record<string,unknown>; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ decision: 'valide', commentaire: '' })

  const { mutate, isPending } = useMutation({
    mutationFn: () => activitesApi.valider(activite.id_activite as number, form),
    onSuccess: () => {
      toast.success(form.decision === 'valide' ? 'Activité validée ✓' : 'Activité rejetée')
      qc.invalidateQueries({ queryKey: ['activites'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: () => toast.error('Erreur lors de la validation'),
  })

  const res = activite.ressource as Record<string,unknown> | undefined
  const attr = activite.attribution as Record<string,unknown> | undefined
  const ens  = attr?.enseignant as Record<string,unknown> | undefined

  return (
    <Modal title="Valider / Rejeter" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={() => mutate()} disabled={isPending}>{isPending ? <Spinner size={14}/> : 'Confirmer'}</Btn></>}>
      <div style={{ marginBottom:16, padding:12, background:'var(--surface2)', borderRadius:8 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{String(res?.titre_ressource || '')}</div>
        <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>
          {String(ens?.nom || '')} {String(ens?.prenom || '')} · {String(activite.nb_seances)} séance(s) · <strong style={{ color:'var(--accent)' }}>{String(activite.vhtc || 0)}h</strong>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Décision</label>
        <div style={{ display:'flex', gap:10 }}>
          {(['valide','rejete'] as const).map(v => (
            <button key={v} type="button" onClick={() => setForm(f => ({ ...f, decision: v }))}
              style={{ flex:1, padding:'10px', borderRadius:8, border:`2px solid ${form.decision===v?(v==='valide'?'var(--green)':'var(--red)'):'var(--border2)'}`, background: form.decision===v?(v==='valide'?'rgba(52,199,138,.1)':'rgba(240,90,90,.1)'):'transparent', color: form.decision===v?(v==='valide'?'var(--green)':'var(--red)'):'var(--text2)', cursor:'pointer', fontWeight:500 }}>
              {v === 'valide' ? 'Valider' : 'Rejeter'}
            </button>
          ))}
        </div>
      </div>
      <Textarea label="Commentaire (optionnel)" value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} />
    </Modal>
  )
}

// ── Modale création ───────────────────────────────────────────────────────────
function ModalCreer({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ id_ressource:'', id_attribution:'', nb_seances:2, date_activite:'', observations:'' })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const { data: attrData } = useQuery({ queryKey:['attributions-list'], queryFn: () => attributionsApi.list().then(r => r.data.data ?? r.data) })
  const { data: resData  } = useQuery({ queryKey:['ressources-list'],   queryFn: () => ressourcesApi.list().then(r => r.data.data ?? r.data) })

  const selectedRes = (resData || []).find((r: Record<string,unknown>) => r.id_ressource === parseInt(form.id_ressource))
  const sim = selectedRes ? computeVhtc(String(selectedRes.type_operation), Number(selectedRes.niveau_complexite), form.nb_seances) : null

  const { mutate, isPending } = useMutation({
    mutationFn: () => activitesApi.create(form as Record<string,unknown>),
    onSuccess:  () => { toast.success('Activité déclarée ✓'); qc.invalidateQueries({ queryKey:['activites'] }); onClose() },
    onError:    () => toast.error('Erreur lors de la déclaration'),
  })

  const attrOptions = (attrData || []).map((a: Record<string,unknown>) => {
    const e = a.enseignant as Record<string,unknown>|undefined
    const c = a.cours as Record<string,unknown>|undefined
    return { value: a.id_attribution as number, label: `${e?.nom} ${e?.prenom} — ${c?.intitule_ecue}` }
  })
  const resOptions = (resData || []).map((r: Record<string,unknown>) =>
    ({ value: r.id_ressource as number, label: `${r.titre_ressource} (N${r.niveau_complexite} · ${r.type_operation})` })
  )

  return (
    <Modal title="Déclarer une activité" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Annuler</Btn><Btn variant="primary" onClick={() => mutate()} disabled={isPending}>{isPending ? <Spinner size={14}/> : 'Soumettre'}</Btn></>}>
      <Sel label="Attribution (Enseignant × Cours)" options={attrOptions} value={form.id_attribution} onChange={e => set('id_attribution', e.target.value)} placeholder="-- Sélectionner --" />
      <Sel label="Ressource pédagogique" options={resOptions} value={form.id_ressource} onChange={e => set('id_ressource', e.target.value)} placeholder="-- Sélectionner --" />
      <SeancesSelector value={form.nb_seances} onChange={v => set('nb_seances', v)} />
      <div className="form-group">
        <label className="form-label">Date de l&apos;activité</label>
        <input className="form-control" type="date" value={form.date_activite} onChange={e => set('date_activite', e.target.value)} />
      </div>
      <Textarea label="Observation (optionnel)" value={form.observations} onChange={e => set('observations', e.target.value)} />
      {sim && (
        <div className="vhtc-preview">
          <div className="vhtc-row"><span style={{ fontSize:12, color:'var(--text3)' }}>Vhn</span><span style={{ color:'var(--text2)', fontWeight:600 }}>{sim.vhn}h</span></div>
          <div className="vhtc-row" style={{ marginTop:6 }}>
            <span style={{ fontSize:14, color:'var(--text)', fontWeight:600 }}>Vhtc</span>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'var(--accent)' }}>{sim.vhtc}h</span>
          </div>
          <div className="vhtc-formula">Vhtc = {sim.vhn} × {form.nb_seances} = {sim.vhtc}h — {sim.credits === 0 ? 'Sans crédit' : `${sim.credits} Cr`}</div>
        </div>
      )}
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ActivitesPage() {
  const { canManage, isEnseignant } = useAuth()
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalValider, setModalValider] = useState<Record<string,unknown> | null>(null)
  const [modalCreer, setModalCreer] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['activites', filterStatut],
    queryFn:  () => activitesApi.list(filterStatut ? { statut: filterStatut } : {}).then(r => r.data),
  })

  const list: Record<string,unknown>[] = (Array.isArray(data) ? data : data?.data || []).filter((a: Record<string,unknown>) =>
    !search || String(a.ressource ? (a.ressource as Record<string,unknown>).titre_ressource : '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <Topbar title={isEnseignant ? 'Mes activités' : 'Activités pédagogiques'} />
      <div className="page-content animate-slide">
        <div className="actions-bar">
          <div className="filter-row">
            <SearchBar value={search} onChange={setSearch} />
            <select className="form-control" style={{ width:'auto' }} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              {['soumis','valide','brouillon','rejete'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Btn variant="primary" icon={Plus} onClick={() => setModalCreer(true)}>
            {isEnseignant ? 'Déclarer une activité' : 'Nouvelle activité'}
          </Btn>
        </div>

        <Card>
          {isLoading ? <div style={{ padding:40, textAlign:'center' }}><Spinner size={28}/></div>
          : list.length === 0 ? <Empty text="Aucune activité" />
          : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Ressource</th><th>Niveau</th><th>Type</th>
                  <th>Enseignant</th><th>Séances</th><th>Vhtc</th>
                  <th>Date</th><th>Statut</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {list.map(a => {
                    const res  = a.ressource as Record<string,unknown>|undefined
                    const attr = a.attribution as Record<string,unknown>|undefined
                    const ens  = attr?.enseignant as Record<string,unknown>|undefined
                    const cours = attr?.cours as Record<string,unknown>|undefined
                    return (
                      <tr key={String(a.id_activite)}>
                        <td>
                          <div className="cell-main">{String(res?.titre_ressource || '')}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{String(cours?.intitule_ecue || '')}</div>
                        </td>
                        <td><NiveauBadge niveau={Number(res?.niveau_complexite || 1)} /></td>
                        <td><span className={`badge badge-${res?.type_operation === 'conception' ? 'blue' : 'purple'}`}>{String(res?.type_operation || '')}</span></td>
                        <td>{String(ens?.nom || '')} {String(ens?.prenom || '')}</td>
                        <td><span className="badge badge-gray">{String(a.nb_seances)}s</span></td>
                        <td><strong style={{ fontFamily:'Syne,sans-serif', color:'var(--accent)' }}>{String(a.vhtc || 0)}h</strong></td>
                        <td style={{ color:'var(--text3)', fontSize:12 }}>{fmtDate(String(a.date_activite || ''))}</td>
                        <td><StatutBadge statut={String(a.statut)} /></td>
                        <td>
                          {canManage && a.statut === 'soumis' && (
                            <Btn variant="success" size="sm" icon={Check} onClick={() => setModalValider(a)} />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {modalCreer   && <ModalCreer   onClose={() => setModalCreer(false)} />}
      {modalValider && <ModalValider activite={modalValider} onClose={() => setModalValider(null)} />}
    </DashboardLayout>
  )
}
