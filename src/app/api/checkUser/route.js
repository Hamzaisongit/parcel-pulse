import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    
    const response = await fetch(`https://mycompany404.erpnext.com/api/method/frappe.auth.get_logged_user`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie')
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
