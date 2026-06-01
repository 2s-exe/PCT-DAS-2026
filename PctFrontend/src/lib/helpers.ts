// ── Barème Annexe 1 ──────────────────────────────────────────────────────────
export const BAREM: Record<string, Record<number, number>> = {
  conception:  { 1: 8,    2: 15,   3: 30  },
  mise_a_jour: { 1: 4,    2: 7.5,  3: 15  },
}

export const CREDITS_PAR_SEANCES: Record<number, number> = { 1: 0, 2: 1, 4: 2, 6: 3 }
export const SEANCES_VALIDES = [1, 2, 4, 6] as const

export interface VhtcResult { vhn: number; vhtc: number; credits: number }

export function computeVhtc(typeOperation: string, niveau: number, nbSeances: number): VhtcResult {
  const vhn    = (BAREM[typeOperation] || {})[niveau] || 0
  const vhtc   = vhn * nbSeances
  const credits = CREDITS_PAR_SEANCES[nbSeances] ?? 0
  return { vhn, vhtc, credits }
}

// ── Pourcentage ───────────────────────────────────────────────────────────────
export function pct(a: number, b: number): number {
  return b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0
}

// ── Formatage ─────────────────────────────────────────────────────────────────
export function fmtNum(n: number | undefined | null): string {
  return Number(n || 0).toLocaleString('fr-FR')
}

export function fmtDate(d: string | undefined | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Config statuts ────────────────────────────────────────────────────────────
export const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  valide:    { label: 'Validé',    color: 'green'  },
  soumis:    { label: 'Soumis',    color: 'blue'   },
  brouillon: { label: 'Brouillon', color: 'gray'   },
  rejete:    { label: 'Rejeté',    color: 'red'    },
}

export const NIVEAU_CONFIG: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'N1 — Simple',        color: 'orange', desc: 'Contenus simples + quiz/évaluations' },
  2: { label: 'N2 — Interactif',    color: 'purple', desc: '25% activités interactives + quiz + éval' },
  3: { label: 'N3 — Serious Games', color: 'blue',   desc: 'Serious games, simulations, haute qualité' },
}

// ── Download blob ─────────────────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
