import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/login']

const ROLE_ALLOWED: Record<string, string[]> = {
  admin: [
    '/dashboard','/activites','/enseignants','/cours','/sequences','/ressources',
    '/attributions','/volumes','/rapports','/parametres','/utilisateurs',
    '/departements','/annees',
  ],
  secretaire: [
    '/dashboard','/activites','/enseignants','/cours','/sequences','/ressources',
    '/attributions','/volumes','/rapports',
  ],
  enseignant: ['/mon-espace','/mes-activites','/simuler'],
}

const ROLE_HOME: Record<string, string> = {
  admin:      '/dashboard',
  secretaire: '/dashboard',
  enseignant: '/mon-espace',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC.includes(pathname) || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token     = request.cookies.get('pct_token')?.value
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

  const allowed = ROLE_ALLOWED[profil] || []
  const hasAccess = allowed.some(route => pathname === route || pathname.startsWith(route + '/'))

  if (!hasAccess) {
    return NextResponse.redirect(new URL(ROLE_HOME[profil] || '/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
