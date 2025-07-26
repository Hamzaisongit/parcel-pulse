import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { pickListName } = params;
    
    const response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Pick List/${pickListName}`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie')
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch pick list' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching pick list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { pickListName } = params;
    const body = await request.json();

    const response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Pick List/${pickListName}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie')
      },
      body: JSON.stringify({
        locations: body.items
      }),
    });

    if (!response.ok) {
      console.log(response)
      return NextResponse.json(
        { error: 'Failed to update pick list' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error updating pick list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 