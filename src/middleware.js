import { NextResponse } from 'next/server'

export async function middleware(request) {
  const path = request.nextUrl.pathname

  // Allow PWA assets to pass through without authentication
  if (path === '/login' || 
      path.startsWith('/manifest') ||
      path.startsWith('/sw.js') ||
      path.startsWith('/icon-') ||
      path.startsWith('/favicon') ||
      path.startsWith('/_next/') ||
      path.startsWith('/api/')) {
    return NextResponse.next()
  }

  try {
    const cookies = request.headers.get('cookie') || ''

    const authResponse = await fetch(
      `${process.env.ERP_SITE}/api/method/frappe.auth.get_logged_user`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': cookies,
        },
      }
    )

    if (!authResponse.ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Auth check failed:', error)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}
