import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log('Middleware - Request:', req.nextUrl.pathname)

  // Refresh session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Also try to get user to ensure session is valid
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware - Auth state:', { 
    path: req.nextUrl.pathname, 
    session: !!session, 
    user: !!user 
  })

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/make-ready']
  const adminRoutes = ['/admin']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  
  const isAdminRoute = adminRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without session or user
  if (isProtectedRoute && (!session || !user)) {
    console.log('Middleware - Redirecting to login:', req.nextUrl.pathname)
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin access
  if (isAdminRoute && session) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // If there's a permission error or no profile, redirect to dashboard
      if (error || !profile || profile.role !== 'admin') {
        console.log('Admin access denied:', { error, profile })
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    console.log('Middleware - Redirecting from auth to dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect authenticated users from landing page to dashboard
  if (session && req.nextUrl.pathname === '/') {
    console.log('Middleware - Redirecting from home to dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
