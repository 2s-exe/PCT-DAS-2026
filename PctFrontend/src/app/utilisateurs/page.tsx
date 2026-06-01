'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, ShieldOff, ShieldCheck, KeyRound } from 'lucide-react'
import { utilisateursApi, enseignantsApi, profilsApi } from '@/lib/api'
import { RoleBadge, Badge, Btn, Modal, Card, Empty, Spinner, Input, Sel, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { fmtDate } from '@/lib/helpers'

type User    = Record<string, unknown>
type Profil  = { id_profil: number; libelle_profil: string }

function ModalUser({ user, profils, onClose }: { user: User|null; profils: Profil[]; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: ensList } = useQuery({ queryKey:['ens-list'], queryFn: () => enseignantsApi.list().then(r => r.data.data ?? r.data) })

  const [form, setForm] = useState({
    login:         String(user?.login || ''),
    password:      '',
    id_profil:     String((user?.profil as User|undefined)?.id_profil || ''),
    id_enseignant: String(user?.id_enseignant || ''),
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const ensRaw   = Array.isArray(ensList) ? ensList : ensList?.data || []
  const ensOptions = [
    { value:'', label:'-- Aucun (admin / secrétaire) --' },
    ...ensRaw.map((e: User) => ({ value: String(e.id_enseignant), label: `${e.nom} ${e.prenom} (${e.statut})` })),
  ]
  const profilOptions = profils.map(p => ({ value: String(p.id_profil), label: p.libelle_profil }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        login:     form.login,
        id_profil: form.id_profil,
      }
      if (form.password)      payload.password      = form.password
      if (form.id_enseignant) payload.id_enseignant = form.id_enseignant
      return user
        ? utilisateursApi.update(user.id_user as number, payload)
        : utilisateursApi.create(payload)
    },
    onSuccess: () => {
      toast.success(user ? 'Compte mis à jour ✓' : 'Compte créé ✓')
      qc.invalidateQueries({ queryKey:['utilisateurs'] })
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message
      toast.error(msg || 'Erreur — le login existe peut-être déjà')
    },
  })

  return (
    <Modal
      title={user ? 'Modifier le compte' : 'Nouveau compte utilisateur'}
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
      <Input
        label="Login (adresse email)"
        type="email"
        value={form.login}
        onChange={e => set('login', e.target.value)}
        placeholder="prenom.nom@uvci.edu.ci"
      />
      <Input
        label={user ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe initial'}
        type="password"
        value={form.password}
        onChange={e => set('password', e.target.value)}
        placeholder="Minimum 8 caractères"
        hint="Doit contenir majuscule, chiffre et caractère spécial"
      />
      <Sel
        label="Profil (rôle)"
        options={profilOptions}
        value={form.id_profil}
        onChange={e => set('id_profil', e.target.value)}
        placeholder="-- Choisir un profil --"
      />
      <Sel
        label="Enseignant associé (uniquement si profil Enseignant)"
        options={ensOptions}
        value={form.id_enseignant}
        onChange={e => set('id_enseignant', e.target.value)}
        hint="Obligatoire pour le profil enseignant"
      />
    </Modal>
  )
}

export default function UtilisateursPage() {
  const qc = useQueryClient()
  const [modal, setModal]   = useState<null|'create'|User>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn:  () => utilisateursApi.list().then(r => r.data.data ?? r.data),
  })
  const { data: profilsData } = useQuery({
    queryKey: ['profils'],
    queryFn:  () => profilsApi.list().then(r => r.data),
  })

  const { mutate: toggleActif } = useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => utilisateursApi.update(id, { actif }),
    onSuccess: (_d, vars) => {
      toast.success(vars.actif ? 'Compte réactivé ✓' : 'Compte désactivé')
      qc.invalidateQueries({ queryKey:['utilisateurs'] })
    },
  })
  const { mutate: resetPwd } = useMutation({
    mutationFn: (id: number) => utilisateursApi.resetPassword(id),
    onSuccess: (res) => {
      const tmp = (res.data as Record<string,string>).mot_de_passe_temp
      toast.success(`Mot de passe réinitialisé : ${tmp}`, { duration: 8000 })
      qc.invalidateQueries({ queryKey:['utilisateurs'] })
    },
  })

  // UserController::index retourne paginate(15) → { data:[], meta:{}, links:{} }
  const allUsers: User[] = Array.isArray(data) ? data : data?.data || []
  const profils: Profil[] = (profilsData as Profil[] | undefined) || []

  const list = allUsers.filter(u => !search || String(u.login).toLowerCase().includes(search.toLowerCase()))

  const stats = {
    total:  allUsers.length,
    actifs: allUsers.filter(u => u.actif).length,
    admin:  allUsers.filter(u => (u.profil as User|undefined)?.libelle_profil === 'admin').length,
    secr:   allUsers.filter(u => (u.profil as User|undefined)?.libelle_profil === 'secretaire').length,
    ens:    allUsers.filter(u => (u.profil as User|undefined)?.libelle_profil === 'enseignant').length,
  }

  return (
    <DashboardLayout roles={['admin']}>
      <Topbar title="Gestion des utilisateurs" subtitle="Comptes d'accès à la plateforme PCT" />
      <div className="page-content animate-slide">

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
          {[
            ['Total',       stats.total,  'var(--text2)'],
            ['Actifs',      stats.actifs, 'var(--green)'],
            ['Admins',      stats.admin,  'var(--uvci-blue)'],
            ['Secrétaires', stats.secr,   'var(--purple)'],
            ['Enseignants', stats.ens,    'var(--uvci-orange)'],
          ].map(([l,v,c]) => (
            <div key={String(l)} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', textAlign:'center', boxShadow:'var(--shadow-sm)' }}>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:24, color:String(c) }}>{String(v)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{String(l)}</div>
            </div>
          ))}
        </div>

        <div className="actions-bar">
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color:'var(--text3)', flexShrink:0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un login…" />
          </div>
          <Btn variant="primary" icon={Plus} onClick={() => setModal('create')}>Nouveau compte</Btn>
        </div>

        <Card>
          {isLoading
            ? <div style={{ padding:40, textAlign:'center' }}><Spinner size={28}/></div>
            : list.length === 0
            ? <Empty icon="👤" text="Aucun utilisateur" />
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Login</th><th>Profil</th><th>Enseignant lié</th>
                    <th>Statut</th><th>Dernière connexion</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {list.map(u => {
                      const profil = u.profil as User|undefined
                      const ens    = u.enseignant as User|undefined
                      return (
                        <tr key={String(u.id_user)}>
                          <td>
                            <div className="cell-main">{String(u.login)}</div>
                          </td>
                          <td><RoleBadge role={String(profil?.libelle_profil || '')} /></td>
                          <td>
                            {ens
                              ? <span style={{ fontSize:13 }}>{String(ens.nom)} {String(ens.prenom)}</span>
                              : <span style={{ fontSize:12, color:'var(--text3)' }}>—</span>
                            }
                          </td>
                          <td><Badge color={u.actif ? 'green' : 'gray'}>{u.actif ? 'Actif' : 'Inactif'}</Badge></td>
                          <td style={{ fontSize:12, color:'var(--text3)' }}>{fmtDate(String(u.derniere_connexion || ''))}</td>
                          <td>
                            <div style={{ display:'flex', gap:5 }}>
                              <Btn variant="ghost" size="sm" icon={Pencil} onClick={() => setModal(u)} />
                              <Btn
                                variant="ghost" size="sm" icon={KeyRound}
                                title="Réinitialiser le mot de passe"
                                onClick={() => { if(confirm('Réinitialiser le mot de passe ?')) resetPwd(u.id_user as number) }}
                              />
                              {u.actif
                                ? <Btn variant="danger" size="sm" icon={ShieldOff}
                                    onClick={() => { if(confirm('Désactiver ce compte ?')) toggleActif({ id: u.id_user as number, actif: false }) }} />
                                : <Btn variant="success" size="sm" icon={ShieldCheck}
                                    onClick={() => toggleActif({ id: u.id_user as number, actif: true })} />
                              }
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
        <ModalUser
          user={modal === 'create' ? null : modal as User}
          profils={profils}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}
