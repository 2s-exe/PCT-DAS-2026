'use client'

import { useState } from 'react'
import { SeancesSelector, Card, Topbar } from '@/components/ui'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { computeVhtc, BAREM, SEANCES_VALIDES, CREDITS_PAR_SEANCES } from '@/lib/helpers'

const TYPE_OPTIONS = [
  { value:'conception',  label:'Conception — Création initiale de la ressource' },
  { value:'mise_a_jour', label:'Mise à jour — Révision d\'une ressource existante (½ du volume)' },
]
const NIVEAU_OPTIONS = [
  { value:1, label:'Niveau 1 — Contenus simples + quiz + évaluations (8h/séance en conception)' },
  { value:2, label:'Niveau 2 — Activités interactives + quiz + évaluation (15h/séance)' },
  { value:3, label:'Niveau 3 — Serious games, simulations, haute qualité (30h/séance)' },
]

export default function SimulateurPage() {
  const [form, setForm] = useState({ type_operation:'conception', niveau:1, nb_seances:2 })
  const set = (k:string, v:unknown) => setForm(f=>({...f,[k]:v}))

  const sim = computeVhtc(form.type_operation, form.niveau, form.nb_seances)

  const allSims = SEANCES_VALIDES.map(s=>({
    s,
    conception:  computeVhtc('conception',  form.niveau, s),
    mise_a_jour: computeVhtc('mise_a_jour', form.niveau, s),
  }))

  return (
    <DashboardLayout>
      <Topbar title="Simulateur Vhtc"/>
      <div className="page-content animate-slide">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>

          <Card title="Calculer le Vhtc">
            <div className="card-body">
              <div style={{padding:'10px 14px',background:'rgba(79,142,247,.06)',border:'1px solid rgba(79,142,247,.15)',borderRadius:8,marginBottom:20,fontSize:12,color:'var(--text2)'}}>
                Formule Annexe 1 : <strong style={{color:'var(--accent)'}}>Vhtc = Vhn × S</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Type d&apos;opération</label>
                <select className="form-control" value={form.type_operation} onChange={e=>set('type_operation',e.target.value)}>
                  {TYPE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Niveau de complexité</label>
                <select className="form-control" value={form.niveau} onChange={e=>set('niveau',parseInt(e.target.value))}>
                  {NIVEAU_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="form-hint">Vhn = {(BAREM[form.type_operation]||{})[form.niveau]||0}h par séance pour ce niveau</div>
              </div>

              <SeancesSelector value={form.nb_seances} onChange={v=>set('nb_seances',v)}/>

              <div className="vhtc-preview" style={{marginTop:20}}>
                <div className="vhtc-row">
                  <span style={{fontSize:12,color:'var(--text3)'}}>Vhn (heures par séance)</span>
                  <span style={{color:'var(--text2)',fontWeight:600}}>{sim.vhn}h</span>
                </div>
                <div className="vhtc-row">
                  <span style={{fontSize:12,color:'var(--text3)'}}>Nombre de séances (S)</span>
                  <span style={{color:'var(--text2)',fontWeight:600}}>{form.nb_seances}</span>
                </div>
                <div className="vhtc-row" style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(79,142,247,.15)'}}>
                  <span style={{fontSize:15,fontWeight:600,color:'var(--text)'}}>Volume Horaire Total (Vhtc)</span>
                  <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:28,color:'var(--accent)'}}>{sim.vhtc}h</span>
                </div>
                <div className="vhtc-row">
                  <span style={{fontSize:12,color:'var(--text3)'}}>Crédits associés</span>
                  <span style={{color:'var(--purple)',fontWeight:600}}>{sim.credits===0?'Sans crédit':`${sim.credits} Crédit${sim.credits>1?'s':''}`}</span>
                </div>
                <div className="vhtc-formula">
                  Vhtc = Vhn × S = {sim.vhn}h × {form.nb_seances} = <strong style={{color:'var(--accent)'}}>{sim.vhtc}h</strong>
                </div>
              </div>
            </div>
          </Card>

          <Card title={`Tableau de référence — Niveau ${form.niveau}`}>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Séances</th><th>Crédits</th>
                  <th style={{color:'var(--accent)'}}>Conception</th>
                  <th style={{color:'var(--purple)'}}>Mise à jour</th>
                </tr></thead>
                <tbody>
                  {allSims.map(({s,conception,mise_a_jour})=>(
                    <tr key={s} style={{background:s===form.nb_seances?'rgba(79,142,247,.05)':'transparent'}}>
                      <td><strong>{s} séance{s>1?'s':''}</strong></td>
                      <td><span className="badge badge-gray">{CREDITS_PAR_SEANCES[s]===0?'—':`${CREDITS_PAR_SEANCES[s]} Cr`}</span></td>
                      <td><strong style={{color:'var(--accent)',fontFamily:'Syne,sans-serif'}}>{conception.vhtc}h</strong></td>
                      <td><strong style={{color:'var(--purple)',fontFamily:'Syne,sans-serif'}}>{mise_a_jour.vhtc}h</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
