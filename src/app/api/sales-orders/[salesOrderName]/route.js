import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { salesOrderName } = params;
    
    const response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Sales Order/${salesOrderName}`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': request.headers.get('cookie')
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sales order' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching sales order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { salesOrderName } = await params;
    const body = await request.json();
    console.log(salesOrderName, body, request.headers.get('cookie'))

    const response = await fetch(`${process.env.ERP_SITE}/api/v2/document/Sales Order/${salesOrderName}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie')
      },
      body: JSON.stringify({
        items: body.items
      }),
    });

    if (!response.ok) {
      console.log(response)
      return NextResponse.json(
        { error: 'Failed to update sales order' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error updating sales order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 