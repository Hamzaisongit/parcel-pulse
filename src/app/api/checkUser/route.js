import { NextResponse } from 'next/server'

export async function GET() {
  try {
    
    const response = await fetch(`https://mycompany404.erpnext.com/api/method/frappe.auth.get_logged_user`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error checking user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
