'use client'

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { type LucideIcon, X } from 'lucide-react'
import { STATUT_CONFIG, NIVEAU_CONFIG, pct, SEANCES_VALIDES, CREDITS_PAR_SEANCES } from '@/lib/helpers'

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color = 'gray', children }: { color?: string; children: ReactNode }) {
  return <span className={`badge badge-${color}`}>{children}</span>
}

export function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut] || { label: statut, color: 'gray' }
  return <Badge color={cfg.color}>{cfg.label}</Badge>
}

export function NiveauBadge({ niveau }: { niveau: number }) {
  const cfg = NIVEAU_CONFIG[niveau] || { label: `N${niveau}`, color: 'gray' }
  return <Badge color={cfg.color}>{cfg.label}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin:       'red',
    admin_pedagogique: 'orange',
    admin:             'blue',
    secretaire:        'purple',
    enseignant:        'green',
  }
  const labels: Record<string, string> = {
    super_admin:       'Super Admin',
    admin_pedagogique: 'Admin. Péda.',
    admin:             'Administrateur',
    secretaire:        'Secrétaire',
    enseignant:        'Enseignant',
  }
  return <Badge color={colors[role] || 'gray'}>{labels[role] || role}</Badge>
}

// ── Buttons ───────────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'orange'
  size?: 'sm' | 'icon'
  icon?: LucideIcon
  children?: ReactNode
}

export function Btn({ variant = 'ghost', size, icon: Icon, children, className = '', ...props }: BtnProps) {
  const cls = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...props}>
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  )
}

// ── Form controls ─────────────────────────────────────────────────────────────
interface FieldProps { label?: string; hint?: string; error?: string }

export function Input({ label, hint, error, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className="form-control" {...props} />
      {hint  && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

interface SelectProps extends FieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string | number; label: string }[]
  placeholder?: string
}

export function Sel({ label, hint, error, options = [], placeholder, ...props }: SelectProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-control" {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint  && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

export function Textarea({ label, hint, error, rows = 3, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { rows?: number }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea className="form-control" rows={rows} {...props} />
      {hint  && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps { title: string; size?: 'lg'; onClose?: () => void; footer?: ReactNode; children: ReactNode }

export function Modal({ title, size, onClose, footer, children }: ModalProps) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal${size === 'lg' ? ' modal-lg' : ''}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
            style={{ color:'var(--text3)', borderColor:'transparent' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ title, actions, children, style }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={style}>
      {title && (
        <div className="card-header">
          <div className="card-title">{title}</div>
          {actions && <div style={{ display:'flex', gap:8 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'blue', icon: Icon }: {
  label: string; value: ReactNode; sub?: string; color?: string; icon?: LucideIcon
}) {
  return (
    <div className={`stat-card ${color}`}>
      {Icon && <div className={`stat-icon ${color}`}><Icon size={20} /></div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const p = pct(value, max)
  const bg = color || 'linear-gradient(90deg, var(--uvci-blue), var(--uvci-blue-light))'
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width:`${p}%`, background: bg }} />
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon = '📋', text = 'Aucune donnée' }: { icon?: string; text?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <div className="spinner" style={{ width:size, height:size }} />
}

// ── SearchBar ─────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="search-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={{ color:'var(--text3)', flexShrink:0 }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

// ── SeancesSelector ───────────────────────────────────────────────────────────
export function SeancesSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">Nombre de séances (S)</label>
      <div className="seances-grid">
        {SEANCES_VALIDES.map(s => (
          <button key={s} type="button" className={`seance-btn${value === s ? ' selected' : ''}`} onClick={() => onChange(s)}>
            <div className="seance-num">{s}</div>
            <div className="seance-cr">{CREDITS_PAR_SEANCES[s] === 0 ? 'Sans Cr' : `${CREDITS_PAR_SEANCES[s]} Cr`}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Topbar ────────────────────────────────────────────────────────────────────
export function Topbar({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="topbar">
      <div>
        <h1 style={{
          fontFamily:'Plus Jakarta Sans,sans-serif',
          fontWeight:800, fontSize:20,
          color:'var(--text)',
          letterSpacing:'-0.4px',
        }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{
          padding:'5px 13px',
          background:'var(--accent-light)',
          border:'1px solid rgba(0,86,166,.18)',
          borderRadius:20, fontSize:11.5,
          color:'var(--uvci-blue)',
          fontWeight:600,
          letterSpacing:'.2px',
        }}>
          📅 2025–2026
        </span>
        {children}
      </div>
    </div>
  )
}

// ── PageHeader — bandeau coloré optionnel ─────────────────────────────────────
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div style={{
      background:'linear-gradient(135deg, var(--uvci-blue), var(--uvci-blue-light))',
      borderRadius:'var(--radius)',
      padding:'22px 26px',
      marginBottom:24,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      boxShadow:'0 4px 16px rgba(0,86,166,.22)',
    }}>
      <div>
        <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:20, color:'#fff', marginBottom:4 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:13, color:'rgba(255,255,255,.72)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:8 }}>{actions}</div>}
    </div>
  )
}
