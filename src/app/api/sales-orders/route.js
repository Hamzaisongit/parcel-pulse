import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log(request)
    const response = await fetch('https://mycompany404.erpnext.com/api/v2/document/Sales Order', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie')
      }
    });

    console.log(response)
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sales orders' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 