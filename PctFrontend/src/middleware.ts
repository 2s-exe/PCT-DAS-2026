import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/login']

// Routes accessibles par profil — principe du moindre privilège
const ROLE_ALLOWED: Record<string, string[]> = {
  // SUPER_ADMIN : gestion SI + supervision lecture seule du pédagogique
  super_admin: [
    '/dashboard',
    '/utilisateurs',  // exclusif super_admin
    '/departements',
    '/annees',
    '/parametres',
    '/rapports',
    // Lecture seule sur les entités pédagogiques (supervision)
    '/enseignants', '/cours', '/attributions', '/sequences',
    '/ressources', '/activites', '/volumes',
  ],

  // ADMIN_PEDAGOGIQUE : gestion académique complète, pas de gestion des comptes
  admin_pedagogique: [
    '/dashboard',
    '/enseignants',
    '/cours',
    '/sequences',
    '/ressources',
    '/attributions',
    '/activites',
    '/volumes',
    '/rapports',
    '/departements',
    '/annees',
    '/parametres',
  ],

  // SECRETAIRE : saisie + consultation, pas d'administration
  secretaire: [
    '/dashboard',
    '/activites',
    '/enseignants',
    '/cours',
    '/sequences',
    '/ressources',
    '/attributions',
    '/volumes',
    '/rapports',
  ],

  // ENSEIGNANT : espace personnel uniquement
  enseignant: ['/mon-espace', '/mes-activites', '/simuler'],
}

const ROLE_HOME: Record<string, string> = {
  super_admin:       '/dashboard',
  admin_pedagogique: '/dashboard',
  secretaire:        '/dashboard',
  enseignant:        '/mon-espace',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC.includes(pathname) || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token      = request.cookies.get('pct_token')?.value
  const userCookie = request.cookies.get('pct_user')?.value

  if (!token || !userCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let profil: string | null = null
  try {
    profil = JSON.parse(decodeURIComponent(userCookie))?.profil || null
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!profil) return NextResponse.redirect(new URL('/login', request.url))

  const allowed   = ROLE_ALLOWED[profil] || []
  const hasAccess = allowed.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )

  if (!hasAccess) {
    return NextResponse.redirect(new URL(ROLE_HOME[profil] || '/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
